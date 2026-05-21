import * as XLSX from 'xlsx'
import type { Project, Position, Seniority } from './types'
import { countColombianWorkDays, COLOMBIAN_WORK_DAYS_2026 } from './colombianHolidays'

// ─── types ───────────────────────────────────────────────────────────────────

export interface KimbleRawAssignment {
  projectId: string        // engagement code e.g. "e000720"
  consultantName: string   // as it appears in Kimble
  usageDays: number        // Forecast P2 Usage (working days on the project)
  projectWorkDays: number  // Colombian working days in project's date range
  projectDedPct: number    // usageDays / projectWorkDays * 100
  endDate: string          // YYYY-MM-DD (Forecast P2 End Date)
}

export interface KimbleImportResult {
  projects: Project[]
  rawAssignments: KimbleRawAssignment[]
  /** name → annual dedication % (sum of usage days / 243 Colombian work days in 2026) */
  consultantDedications: Record<string, number>
  /** name → industries + service areas derived from 2026 Kimble rows */
  consultantAreaData: Record<string, { industries: string[]; areas: string[] }>
  unmatchedNames: string[]
  fileName: string
  importedAt: string
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function parseDMY(rawDate: string | number | null | undefined): string {
  if (rawDate === null || rawDate === undefined || rawDate === '') return ''

  // Excel stores dates as integer serial numbers (days since Jan 0 1900).
  // The library returns them as JS numbers when the cell's format isn't plain text.
  // Formula: (serial − 25569) × 86400 × 1000 ms → UTC midnight of that date.
  if (typeof rawDate === 'number') {
    const ms = Math.round((rawDate - 25569) * 86400 * 1000)
    return new Date(ms).toISOString().split('T')[0]   // "2026-04-06"
  }

  // String in "d/m/yyyy" format, e.g. "6/04/2026" or "17/07/2026"
  const parts = String(rawDate).split('/')
  if (parts.length === 3) {
    const [d, m, y] = parts
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }

  return String(rawDate) // already ISO or unknown — pass through
}

function extractCode(engagementName: string): string {
  const match = String(engagementName).match(/\(E(\d+)\)/)
  return match ? `e${match[1]}` : String(engagementName).toLowerCase().replace(/\s+/g, '-')
}

function extractName(engagementName: string): string {
  return String(engagementName).replace(/\s*\(E\d+\)\s*$/, '').trim()
}

function parseSeniorityFromGeneric(name: string): Seniority {
  const n = name.toLowerCase()
  if (n.includes('senior partner') || n.includes('socio senior')) return 'Senior Partner'
  if (n.includes('partner') || n.includes('socio')) return 'Partner'
  if (n.includes('director')) return 'Director'
  if (n.includes('senior manager') || n.includes('gerente senior')) return 'Senior Manager'
  if (n.includes('manager') || n.includes('gerente')) return 'Manager'
  if (n.includes('senior associate') || n.includes('asociado senior')) return 'Senior Associate'
  if (n.includes('senior consultant') || n.includes('consultor senior') || n.includes('consultor sr')) return 'Senior Consultant'
  if (n.includes('associate') || n.includes('asociado')) return 'Associate'
  if (n.includes('intern') || n.includes('practicante')) return 'Intern'
  if (n.includes('consultant') || n.includes('consultor')) return 'Consultant'
  return 'Consultant'
}

function formatGenericRole(name: string): string {
  // Strip leading "#" and "Generic" prefix to get the role label
  const cleaned = name.replace(/^#\s*/g, '').replace(/^generic\s*/i, '').trim()
  return cleaned || name
}

// ─── main parser ─────────────────────────────────────────────────────────────

export function parseKimbleExcel(
  file: File,
  knownConsultantNames: string[],
): Promise<KimbleImportResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onerror = () => reject(new Error('Failed to read file'))

    reader.onload = (e) => {
      try {
        const buffer = e.target!.result as ArrayBuffer
        const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows: (string | number | null)[][] = XLSX.utils.sheet_to_json(ws, {
          header: 1,
          defval: null,
        })

        const todayStr = new Date().toISOString().split('T')[0]

        // ── FIRM rows: confirmed staff on active/ended projects ───────────
        const firmRows = rows
          .slice(12)
          .filter((r) => r[1] === 'Firm (100%)' && r[3])

        const projectMap = new Map<string, {
          code: string; name: string; client: string
          industry: string; serviceArea: string
          startDate: string; endDate: string; resourceNames: string[]
        }>()

        const consultantAreaMap = new Map<string, { industries: Set<string>; areas: Set<string> }>()

        for (const row of firmRows) {
          const engRaw  = String(row[5] ?? '')
          const code    = extractCode(engRaw)
          const resourceName = String(row[3] ?? '').trim()
          const usageDays = Number(row[10] ?? 0)
          const industry  = String(row[12] ?? '').trim()
          const serviceArea = String(row[11] ?? '').trim()

          if (!consultantAreaMap.has(resourceName)) {
            consultantAreaMap.set(resourceName, { industries: new Set(), areas: new Set() })
          }
          const areaEntry = consultantAreaMap.get(resourceName)!
          if (industry && industry !== 'Other') areaEntry.industries.add(industry)
          if (serviceArea) areaEntry.areas.add(serviceArea)

          // Pass raw cell values — parseDMY handles both "d/m/yyyy" strings
          // and Excel serial numbers (e.g. 46177 → "2026-04-06")
          const parsedStart = parseDMY(row[6])
          const parsedEnd   = parseDMY(row[9])

          if (!projectMap.has(code)) {
            projectMap.set(code, {
              code,
              name: extractName(engRaw),
              client: String(row[4] ?? '').trim(),
              industry: industry || 'Other',
              serviceArea,
              startDate: parsedStart,
              endDate: parsedEnd,
              resourceNames: [],
            })
          } else {
            const entry = projectMap.get(code)!
            if (parsedEnd > entry.endDate) entry.endDate = parsedEnd
            if (parsedStart < entry.startDate) entry.startDate = parsedStart
          }
          projectMap.get(code)!.resourceNames.push(resourceName)
        }

        // Build firm project objects (Active or Ended — UI derives 'Ended' from date)
        const firmProjects: Project[] = [...projectMap.values()].map((p) => ({
          id: p.code,
          name: p.name,
          client: p.client,
          industry: p.industry,
          description: '',
          status: 'Active' as const,
          start_date: p.startDate,
          end_date: p.endDate,
          team_size: p.resourceNames.length,
          skills_required: [],
          kimble_code: p.code,
          service_area: p.serviceArea,
          created_at: new Date().toISOString(),
        } as unknown as Project))

        // ── GENERIC rows: open / partially-staffed positions ─────────────
        // Any row where Resource contains "Generic" and project hasn't ended.
        // No filter on Forecast Status — the Generic resource name is the real signal.
        const genericMap = new Map<string, {
          code: string; name: string; client: string
          industry: string; serviceArea: string
          startDate: string; endDate: string; generics: string[]
        }>()

        for (const row of rows.slice(12)) {
          const resourceName = String(row[3] ?? '').trim()
          if (!resourceName.toLowerCase().includes('generic')) continue

          const engRaw  = String(row[5] ?? '')
          const code    = extractCode(engRaw)
          const endDate = parseDMY(row[9])

          // Skip if the project has already ended
          if (endDate < todayStr) continue

          if (!genericMap.has(code)) {
            genericMap.set(code, {
              code,
              name: extractName(engRaw),
              client: String(row[4] ?? '').trim(),
              industry: String(row[12] ?? 'Other').trim() || 'Other',
              serviceArea: String(row[11] ?? '').trim(),
              startDate: parseDMY(row[6]),
              endDate,
              generics: [],
            })
          }
          genericMap.get(code)!.generics.push(resourceName)
        }

        // Projects that only have Generic rows → Open
        // Projects that have BOTH Firm rows AND Generic rows → Partially Staffed
        // (Firm-only projects are already in firmProjects as Active/Ended)
        const firmCodes = new Set(projectMap.keys())

        const openProjects: Project[] = [...genericMap.values()].map((p) => {
          const positions: Position[] = p.generics.map((g, i) => ({
            id: `${p.code}-pos-${i}`,
            role: formatGenericRole(g),
            seniority: parseSeniorityFromGeneric(g),
            skills: [],
          }))
          const isPartial = firmCodes.has(p.code)
          return {
            id: p.code,
            name: p.name,
            client: p.client,
            industry: p.industry,
            description: '',
            status: (isPartial ? 'Partially Staffed' : 'Open') as Project['status'],
            start_date: p.startDate,
            end_date: p.endDate,
            // team_size = confirmed firm staff + open generic slots
            team_size: (projectMap.get(p.code)?.resourceNames.length ?? 0) + p.generics.length,
            skills_required: [],
            positions,
            kimble_code: p.code,
            service_area: p.serviceArea,
            created_at: new Date().toISOString(),
          } as unknown as Project
        })

        // Remove firm projects that also appear as partially-staffed (avoid duplicates)
        const partialCodes = new Set(
          [...genericMap.keys()].filter((c) => firmCodes.has(c)),
        )

        // ── Raw assignments (Firm rows only) ─────────────────────────────
        // A consultant can appear multiple times for the same project (extensions).
        // Merge by (projectId, consultantName): sum usage days, track the earliest
        // start and latest end of that consultant's window on this project.
        type MergedKey = string
        const mergedMap = new Map<MergedKey, {
          projectId: string; consultantName: string
          totalUsageDays: number; earliestStartDate: string; latestEndDate: string
        }>()

        for (const row of firmRows) {
          const engRaw         = String(row[5] ?? '')
          const code           = extractCode(engRaw)
          const consultantName = String(row[3] ?? '').trim()
          const usageDays      = Number(row[10] ?? 0)
          const rowStartDate   = parseDMY(row[6])
          const rowEndDate     = parseDMY(row[9])

          const key: MergedKey = `${code}||${consultantName}`
          const existing = mergedMap.get(key)
          if (existing) {
            existing.totalUsageDays += usageDays
            if (rowStartDate < existing.earliestStartDate) existing.earliestStartDate = rowStartDate
            if (rowEndDate   > existing.latestEndDate)     existing.latestEndDate     = rowEndDate
          } else {
            mergedMap.set(key, {
              projectId: code,
              consultantName,
              totalUsageDays: usageDays,
              earliestStartDate: rowStartDate,
              latestEndDate: rowEndDate,
            })
          }
        }

        const rawAssignments: KimbleRawAssignment[] = [...mergedMap.values()].map((entry) => {
          // Use the consultant's OWN date window (earliest start → latest end),
          // not the project's full range. This correctly handles consultants who
          // join late, leave early, or only cover part of a long project.
          const startDate = new Date(entry.earliestStartDate + 'T00:00:00')
          const endDate   = new Date(entry.latestEndDate   + 'T00:00:00')
          const consultantWorkDays = countColombianWorkDays(startDate, endDate)
          const projectDedPct =
            consultantWorkDays > 0
              ? Math.min(100, Math.round((entry.totalUsageDays / consultantWorkDays) * 100))
              : 100

          return {
            projectId: entry.projectId,
            consultantName: entry.consultantName,
            usageDays: entry.totalUsageDays,
            projectWorkDays: consultantWorkDays,
            projectDedPct,
            endDate: entry.latestEndDate,
          }
        })

        // ── Annual dedication % ──────────────────────────────────────────
        // Build from the deduplicated mergedMap (not raw rows) so extensions
        // don't double-count a consultant's days for annual utilisation.
        const consultantDaysMap = new Map<string, number>()
        for (const entry of mergedMap.values()) {
          consultantDaysMap.set(
            entry.consultantName,
            (consultantDaysMap.get(entry.consultantName) ?? 0) + entry.totalUsageDays,
          )
        }
        const consultantDedications: Record<string, number> = {}
        for (const [name, days] of consultantDaysMap.entries()) {
          consultantDedications[name] = Math.min(100, Math.round((days / COLOMBIAN_WORK_DAYS_2026) * 100))
        }

        // ── Consultant area data ─────────────────────────────────────────
        const consultantAreaData: Record<string, { industries: string[]; areas: string[] }> = {}
        for (const [name, entry] of consultantAreaMap.entries()) {
          consultantAreaData[name] = { industries: [...entry.industries], areas: [...entry.areas] }
        }

        // ── Unmatched names ──────────────────────────────────────────────
        function normForMatch(s: string) {
          return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
        }
        const normalizedKnown = new Set(knownConsultantNames.map(normForMatch))
        const unmatchedNames = [...consultantDaysMap.keys()].filter(
          (name) => !normalizedKnown.has(normForMatch(name)),
        )

        // Firm projects that now have open positions are represented in openProjects
        // as Partially Staffed — drop the pure-firm duplicate
        const dedupedFirmProjects = firmProjects.filter((p) => !partialCodes.has(p.id))

        resolve({
          projects: [...dedupedFirmProjects, ...openProjects],
          rawAssignments,
          consultantDedications,
          consultantAreaData,
          unmatchedNames,
          fileName: file.name,
          importedAt: new Date().toISOString(),
        })
      } catch (err) {
        reject(err)
      }
    }

    reader.readAsArrayBuffer(file)
  })
}
