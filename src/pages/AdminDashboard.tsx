import { useState, useEffect } from 'react'
import {
  Search, Heart,
  AlertTriangle, ChevronDown, ChevronUp, Upload, Plus, X, UserPlus,
} from 'lucide-react'
import Layout from '@/components/Layout'
import { SUGGESTED_SKILLS, ALL_SKILLS } from '@/lib/skills'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  mockConsultants,
  mockProjects,
  mockVacationRequests,
  mockAssignments,
  mockLikes,
} from '@/lib/mockData'
import { matchConsultants, matchConsultantsForPosition, findReplacements } from '@/lib/matching'
import { MAX_CARGABILITY } from '@/lib/constants'
import { getInitials, formatDate, isAvailableNow } from '@/lib/utils'
import PeopleTab from '@/components/PeopleTab'
import AutoStaffingPlan from '@/components/AutoStaffingPlan'
import KimbleImportModal from '@/components/KimbleImportModal'
import type { KimbleImportResult } from '@/lib/kimbleParser'
import type { Profile, Project, VacationRequest, ProjectAssignment, BeachAssignment, BeachTaskType } from '@/lib/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function projectStatusVariant(status: string): 'open' | 'partial' | 'full' | 'active' | 'ended' {
  if (status === 'Open') return 'open'
  if (status === 'Partially Staffed') return 'partial'
  if (status === 'Fully Staffed') return 'full'
  if (status === 'Ended') return 'ended'
  return 'active'
}

function getTotalDedication(
  consultantId: string,
  assignments: ProjectAssignment[],
  today: Date,
): number {
  return assignments
    .filter((a) => {
      if (a.consultant_id !== consultantId) return false
      const project = mockProjects.find((p) => p.id === a.project_id)
      return project ? new Date(project.end_date) >= today : false
    })
    .reduce((sum, a) => sum + a.dedication_percentage, 0)
}

// ─── sub-components ──────────────────────────────────────────────────────────

function SkillsEditor({ skills, onChange }: { skills: string[]; onChange: (s: string[]) => void }) {
  const [adding, setAdding] = useState(false)
  const [draft, setDraft] = useState('')

  function add(value: string) {
    const val = value.trim()
    if (!val || skills.map(s => s.toLowerCase()).includes(val.toLowerCase())) {
      setDraft(''); setAdding(false); return
    }
    onChange([...skills, val])
    setDraft(''); setAdding(false)
  }

  const filtered = ALL_SKILLS.filter(
    s => !skills.includes(s) && s.toLowerCase().includes(draft.toLowerCase())
  )

  return (
    <div className="mb-4 border-b border-slate-100 pb-4">
      <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
        Skills Requeridas
      </p>
      <div className="flex flex-wrap gap-1.5 mb-2 items-center">
        {skills.map((s) => (
          <span key={s} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-700">
            {s}
            <button onClick={() => onChange(skills.filter(x => x !== s))} className="text-slate-400 hover:text-red-500 transition-colors">
              <X size={10} />
            </button>
          </span>
        ))}
        {skills.length === 0 && !adding && (
          <span className="text-xs text-slate-400">Sin skills definidas aún</span>
        )}
        {adding ? (
          <div className="relative">
            <span className="inline-flex items-center gap-1">
              <input
                className="w-44 rounded-full border border-navy-300 px-2.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-navy-400"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') add(draft)
                  if (e.key === 'Escape') { setDraft(''); setAdding(false) }
                }}
                autoFocus
                placeholder="Buscar skill…"
              />
              <button onClick={() => { setDraft(''); setAdding(false) }} className="text-slate-400 hover:text-slate-600">
                <X size={12} />
              </button>
            </span>
            {filtered.length > 0 && (
              <div className="absolute top-full left-0 z-20 mt-1 w-56 rounded-lg border border-slate-200 bg-white shadow-lg max-h-48 overflow-y-auto">
                {filtered.slice(0, 20).map(s => (
                  <button
                    key={s}
                    onMouseDown={(e) => { e.preventDefault(); add(s) }}
                    className="w-full px-3 py-1.5 text-left text-xs text-slate-700 hover:bg-navy-50 hover:text-navy-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-0.5 rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-400 hover:border-navy-400 hover:text-navy-600 transition-colors"
          >
            <Plus size={10} /> Agregar
          </button>
        )}
      </div>
    </div>
  )
}

function ProjectCard({
  project,
  assigned,
  selected,
  onClick,
}: {
  project: Project
  assigned: number
  selected: boolean
  onClick: () => void
}) {
  const isEnded = new Date(project.end_date) < new Date(new Date().toDateString())
  const derivedStatus = isEnded
    ? 'Ended'
    : project.status === 'Active'
    ? 'Active'
    : assigned === 0
    ? 'Open'
    : assigned >= project.team_size
    ? 'Fully Staffed'
    : 'Partially Staffed'

  return (
    <button
      onClick={onClick}
      className={`w-full rounded-lg border p-3 text-left transition hover:border-navy-800 ${
        selected ? 'border-navy-800 bg-navy-50' : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium text-navy-800 text-sm">{project.name}</p>
        <Badge variant={projectStatusVariant(derivedStatus)} className="shrink-0 text-xs">
          {derivedStatus}
        </Badge>
      </div>
      <p className="mt-0.5 text-xs text-slate-500">{project.client}</p>
      <p className="mt-1 text-xs text-slate-400">
        {derivedStatus === 'Ended'
          ? `Ended ${formatDate(project.end_date)} · ${assigned} staffed`
          : derivedStatus === 'Active'
          ? `${assigned} staffed · Ends ${formatDate(project.end_date)}`
          : `${assigned}/${project.team_size} staffed · Starts ${formatDate(project.start_date)}`}
      </p>
    </button>
  )
}

interface AssignedMemberRowProps {
  consultant: Profile
  assignment: ProjectAssignment
  totalDedication: number
  maxDedication: number
  project: Project
  assignments: ProjectAssignment[]
  vacations: VacationRequest[]
  replacementsFor: string | null
  onToggleReplacements: (id: string) => void
  onUnassign: () => void
}

function AssignedMemberRow({
  consultant,
  assignment,
  totalDedication,
  maxDedication,
  project,
  assignments,
  vacations,
  replacementsFor,
  onToggleReplacements,
  onUnassign,
}: AssignedMemberRowProps) {
  const isOver = totalDedication > maxDedication
  const showingReplacements = replacementsFor === consultant.id

  // Vacation overlap with project
  const ps = new Date(project.start_date)
  const pe = new Date(project.end_date)
  const now = new Date()
  const vacationWarning = vacations
    .filter((v) => v.consultant_id === consultant.id && new Date(v.end_date) >= now)
    .find((v) => new Date(v.start_date) <= pe && new Date(v.end_date) >= ps)
  const vacWarningText = vacationWarning
    ? `Vacaciones: ${formatDate(vacationWarning.start_date)} – ${formatDate(vacationWarning.end_date)}`
    : null

  const replacements = showingReplacements
    ? findReplacements(consultant, project, mockConsultants, assignments, vacations, mockLikes)
    : []

  return (
    <div
      className={`rounded-lg border p-3 transition-colors ${
        isOver ? 'border-red-200 bg-red-50' : 'border-slate-100 bg-white'
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs">{getInitials(consultant.name)}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-navy-800">{consultant.name}</p>
          <p className="text-xs text-slate-500">{consultant.seniority}</p>
          <p className="truncate text-xs text-slate-400">{consultant.skills.slice(0, 3).join(', ')}</p>
          {vacWarningText && (
            <p className="mt-0.5 text-xs text-amber-600">⚠ {vacWarningText}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <div className="flex items-center justify-end gap-1">
            {isOver && <AlertTriangle size={13} className="text-red-500" />}
            <span className={`text-sm font-bold ${isOver ? 'text-red-600' : 'text-navy-800'}`}>
              {totalDedication}%
            </span>
            <span className="text-xs text-slate-400">/ {maxDedication}%</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {assignment.start_date ? `${formatDate(assignment.start_date)} – ` : ''}{formatDate(assignment.end_date ?? project.end_date)}
          </p>
          {isOver && (
            <Badge variant="destructive" className="mt-1 text-xs">Over dedicated</Badge>
          )}
        </div>
      </div>

      {/* Find replacement button */}
      {isOver && (
        <button
          onClick={() => onToggleReplacements(consultant.id)}
          className="mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs text-red-600 transition hover:bg-red-50"
        >
          {showingReplacements ? (
            <><ChevronUp size={13} /> Hide replacements</>
          ) : (
            <><ChevronDown size={13} /> Find replacement</>
          )}
        </button>
      )}

      {/* Desasignar button — only for manually-added assignments, not Kimble imports */}
      {!assignment.id.startsWith('kimble-') && (
        <button
          onClick={(e) => { e.stopPropagation(); onUnassign() }}
          className="mt-1.5 flex w-full items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-3 py-1 text-xs text-slate-400 hover:border-red-200 hover:text-red-500 transition-colors"
        >
          <X size={11} /> Desasignar
        </button>
      )}

      {/* Replacement suggestions */}
      {showingReplacements && (
        <div className="mt-3 border-t border-red-100 pt-3">
          <p className="mb-2 text-xs font-medium text-slate-500">
            Available replacements (similar seniority &amp; skills)
          </p>
          {replacements.length === 0 ? (
            <p className="text-xs text-slate-400">No suitable replacements found.</p>
          ) : (
            <div className="space-y-1.5">
              {replacements.slice(0, 4).map((r) => (
                <div
                  key={r.consultant.id}
                  className="flex items-center gap-2.5 rounded-md bg-white border border-slate-100 p-2"
                >
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="text-xs">{getInitials(r.consultant.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-navy-800">{r.consultant.name}</p>
                    <p className="text-xs text-slate-400">
                      {r.consultant.seniority} ·{' '}
                      {isAvailableNow(r.consultant.available_from)
                        ? 'Available now'
                        : `Free ${formatDate(r.consultant.available_from)}`}
                    </p>
                    {r.vacationWarning && (
                      <p className="text-xs text-amber-600">⚠ {r.vacationWarning}</p>
                    )}
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-sm font-bold text-navy-800">{r.score}</span>
                    {r.hasLiked && (
                      <Heart size={11} className="ml-1 inline fill-bip-red text-bip-red" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── localStorage persistence keys ───────────────────────────────────────────
const KIMBLE_STORAGE_KEY      = 'bench_kimble_result_v1'
const DEACTIVATED_STORAGE_KEY = 'bench_deactivated_v1'
const BEACH_STORAGE_KEY       = 'bench_beach_v1'
const VACATIONS_STORAGE_KEY   = 'bench_vacations_v1'
const ASSIGNMENTS_STORAGE_KEY = 'bench_assignments_v1'
const PROFILES_STORAGE_KEY    = 'bench_profiles_v1'

function loadDeactivatedIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DEACTIVATED_STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch { return new Set() }
}
function saveDeactivatedIds(ids: Set<string>) {
  try { localStorage.setItem(DEACTIVATED_STORAGE_KEY, JSON.stringify([...ids])) } catch { }
}

function loadFromStorage<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) as T[] : fallback
  } catch { return fallback }
}
function saveToStorage<T>(key: string, data: T[]) {
  try { localStorage.setItem(key, JSON.stringify(data)) } catch { }
}

// ─── main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [consultants, setConsultants] = useState<Profile[]>(mockConsultants)
  const [projects, setProjects] = useState(mockProjects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [assignments, setAssignments] = useState<ProjectAssignment[]>(
    () => loadFromStorage<ProjectAssignment>(ASSIGNMENTS_STORAGE_KEY, mockAssignments),
  )
  const [vacations, setVacations] = useState<VacationRequest[]>(() => {
    const yearStart = `${new Date().getFullYear()}-01-01`
    return loadFromStorage<VacationRequest>(VACATIONS_STORAGE_KEY, mockVacationRequests)
      .filter((v) => v.end_date >= yearStart)
  })
  const [search, setSearch] = useState('')
  const [replacementsFor, setReplacementsFor] = useState<string | null>(null)
  const [kimbleModalOpen, setKimbleModalOpen] = useState(false)
  const [lastImport, setLastImport] = useState<string | null>(null)
  const [beachAssignments, setBeachAssignments] = useState<BeachAssignment[]>(() => {
    const yearStart = `${new Date().getFullYear()}-01-01`
    return loadFromStorage<BeachAssignment>(BEACH_STORAGE_KEY, [])
      .filter((b) => b.end_date >= yearStart)
  })
  const [showAddModal, setShowAddModal] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [addDedication, setAddDedication] = useState(100)
  const [addStartDate, setAddStartDate] = useState('')
  const [addEndDate, setAddEndDate] = useState('')
  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 86400000)
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split('T')[0]

  // On mount: restore projects + consultant metadata from last Kimble import.
  // If bench_assignments_v1 already exists (user has persisted state), skip
  // re-generating assignments so manual changes survive.  If it doesn't exist
  // yet (first load after clearing storage), generate assignments from Kimble
  // so the employee view immediately shows correct data.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(KIMBLE_STORAGE_KEY)
      if (saved) {
        const hasPersistedAssignments = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY) !== null
        handleKimbleImport(JSON.parse(saved), { skipAssignments: hasPersistedAssignments })
      }
    } catch {
      localStorage.removeItem(KIMBLE_STORAGE_KEY)
    }
    // 2. Deactivations
    const deactivated = loadDeactivatedIds()
    if (deactivated.size > 0) {
      setConsultants((prev) =>
        prev.map((c) => deactivated.has(c.id) ? { ...c, is_active: false } : c),
      )
    }
    // 3. Saved CV edits (bio, experience, skills, etc. written by each consultant)
    try {
      const savedRaw = localStorage.getItem(PROFILES_STORAGE_KEY)
      if (savedRaw) {
        const savedEdits = JSON.parse(savedRaw) as Record<string, Partial<Profile>>
        const ids = Object.keys(savedEdits)
        if (ids.length > 0) {
          setConsultants((prev) =>
            prev.map((c) => savedEdits[c.id] ? { ...c, ...savedEdits[c.id] } : c),
          )
        }
      }
    } catch { /* ignore */ }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleKimbleImport(result: KimbleImportResult, opts: { skipAssignments?: boolean } = {}) {
    // Accent-insensitive name normalization
    const normName = (s: string) =>
      s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

    // Strip prefix + leading zeros to get a bare numeric code for matching.
    // "e000600" → "600", "p600" → "600", "p711" → "711"
    const numericCode = (id: string) => {
      const m = id.match(/(\d+)$/)
      return m ? String(parseInt(m[1], 10)) : id
    }

    // 1. Upsert projects — match by numeric suffix, update in-place to keep original IDs.
    //    This prevents duplicates when mock IDs use "p600" and Kimble IDs use "e000600".
    //    Build a map: numericCode → existing project ID (for assignment resolution below).
    const numericToExistingId = new Map<string, string>()
    projects.forEach((p) => numericToExistingId.set(numericCode(p.id), p.id))

    setProjects((prev) => {
      const updatedById = new Map<string, Project>()
      const brandNewProjects: Project[] = []

      for (const kp of result.projects) {
        const nc = numericCode(kp.id)
        const existingId = numericToExistingId.get(nc)
        if (existingId) {
          // Update the existing project in-place, preserving its original ID so all
          // existing assignments (which reference "p600", etc.) continue to resolve.
          const existing = prev.find((p) => p.id === existingId)!
          updatedById.set(existingId, {
            ...existing,
            name: kp.name || existing.name,
            client: kp.client || existing.client,
            end_date: kp.end_date,
            status: kp.status,
            team_size: kp.team_size,
          })
        } else {
          // Genuinely new project from Kimble — add it
          brandNewProjects.push(kp)
          numericToExistingId.set(nc, kp.id) // so assignments below resolve correctly
        }
      }

      // Keep ONLY projects that appear in the Kimble file.
      // Anything not in Kimble is a project that ended before this year — discard it.
      return prev
        .filter((p) => updatedById.has(p.id))
        .map((p) => updatedById.get(p.id)!)
        .concat(brandNewProjects)
    })

    // 2. Build project assignments from raw Kimble rows, resolving name → consultant id
    //    and Kimble project code → existing project id (preserving "p600" style ids).
    const normToId: Record<string, string> = {}
    consultants.forEach((c) => { normToId[normName(c.name)] = c.id })

    const newAssignments: ProjectAssignment[] = result.rawAssignments
      .flatMap((ra, i) => {
        const consultantId = normToId[normName(ra.consultantName)]
        if (!consultantId) return []
        // Resolve to existing project ID (e.g. "p600") or fall back to Kimble code
        const resolvedProjectId = numericToExistingId.get(numericCode(ra.projectId)) ?? ra.projectId
        const a: ProjectAssignment = {
          id: `kimble-${ra.projectId}-${i}`,
          project_id: resolvedProjectId,
          consultant_id: consultantId,
          dedication_percentage: ra.projectDedPct,
          start_date: ra.startDate,
          end_date: ra.endDate,
          assigned_at: result.importedAt,
        }
        return [a]
      })

    // On explicit import: Kimble is always the source of truth — replace all
    // Kimble-covered assignments. Manual assignments for other projects are kept.
    // On mount (skipAssignments=true): skip entirely; assignments come from localStorage.
    if (!opts.skipAssignments) {
      setAssignments((prev) => {
        const kimbleProjectIds = new Set(result.projects.map(
          (kp) => numericToExistingId.get(numericCode(kp.id)) ?? kp.id,
        ))
        // Drop any existing assignment (manual or kimble) for projects in this Kimble file
        const kept = prev.filter((a) => !kimbleProjectIds.has(a.project_id))
        const updated = [...kept, ...newAssignments]
        saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
        return updated
      })
    }

    // 3. Update annual_dedication_pct + merge industry/area data on matching profiles
    setConsultants((prev) =>
      prev.map((c) => {
        const normC = normName(c.name)

        // Dedication %
        const kimbleName = Object.keys(result.consultantDedications).find(
          (k) => normName(k) === normC,
        )
        const pct = kimbleName !== undefined ? result.consultantDedications[kimbleName] : undefined

        // Area data — additive merge, no duplicates
        const areaKey = Object.keys(result.consultantAreaData).find((k) => normName(k) === normC)
        const newAreas = areaKey ? result.consultantAreaData[areaKey] : null

        if (pct === undefined && !newAreas) return c

        return {
          ...c,
          ...(pct !== undefined ? { annual_dedication_pct: pct } : {}),
          ...(newAreas ? {
            industry_experience: [
              ...new Set([...(c.industry_experience ?? []), ...newAreas.industries]),
            ],
            kimble_service_areas: [
              ...new Set([...(c.kimble_service_areas ?? []), ...newAreas.areas]),
            ],
          } : {}),
        }
      }),
    )

    setLastImport(result.fileName)

    // Persist the import result so it survives page reloads
    try {
      localStorage.setItem(KIMBLE_STORAGE_KEY, JSON.stringify(result))
    } catch {
      // storage full — not critical, just skip
    }
  }

  const endedProjects = projects.filter((p) => new Date(p.end_date) < today)
  const visibleProjects = projects.filter((p) => new Date(p.end_date) >= today)
  const upcomingProjects = visibleProjects.filter((p) => p.status !== 'Active')
  const activeProjects = visibleProjects.filter((p) => p.status === 'Active')

  const filteredConsultants = consultants.filter(
    (c) =>
      c.is_active &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))),
  )

  const isActiveProject = selectedProject?.status === 'Active'
  const isEndedProject = selectedProject ? new Date(selectedProject.end_date) < today : false

  // Per-position suggestions using the same scorer as Staffing Plan
  const positionSuggestions =
    selectedProject && !isActiveProject && selectedProject.positions?.length
      ? selectedProject.positions.map((pos) => ({
          position: pos,
          results: matchConsultantsForPosition(pos, selectedProject, consultants, mockLikes, vacations, assignments),
        }))
      : selectedProject && !isActiveProject
      ? [{ position: null, results: matchConsultants(selectedProject, consultants, mockLikes, vacations, assignments) }]
      : []

  const assignedToSelected = assignments.filter((a) => {
    if (a.project_id !== selectedProject?.id) return false
    // For ended projects show everyone ever assigned (historical view).
    // For active/upcoming projects show all assignments that haven't ended yet
    // (including future-start ones — they are confirmed on this project).
    if (!isEndedProject) {
      if (a.end_date && new Date(a.end_date + 'T00:00:00') < today) return false
    }
    return true
  })
  const assignedIds = assignedToSelected.map((a) => a.consultant_id)

  const SENIORITY_RANK: Record<string, number> = {
    'Senior Partner': 0, 'Partner': 1, 'Director': 2,
    'Senior Manager': 3, 'Manager': 4,
    'Senior Associate': 5, 'Associate': 6,
    'Senior Consultant': 7, 'Consultant': 8, 'Intern': 9,
  }

  const assignedConsultants = assignedIds
    .map((id) => ({
      consultant: consultants.find((c) => c.id === id)!,
      assignment: assignedToSelected.find((a) => a.consultant_id === id)!,
    }))
    .filter((x) => x.consultant)
    .sort((a, b) =>
      (SENIORITY_RANK[a.consultant.seniority] ?? 99) -
      (SENIORITY_RANK[b.consultant.seniority] ?? 99),
    )

  function handleUpdateProjectSkills(projectId: string, skills: string[]) {
    setProjects((prev) =>
      prev.map((p) => p.id === projectId ? { ...p, skills_required: skills } : p),
    )
    if (selectedProject?.id === projectId) {
      setSelectedProject((p) => p ? { ...p, skills_required: skills } : p)
    }
  }

  function handleAssign(consultantId: string, projectId: string) {
    const project = projects.find((p) => p.id === projectId)
    setAssignments((prev) => {
      const updated = [...prev, {
        id: `a${Date.now()}`,
        project_id: projectId,
        consultant_id: consultantId,
        dedication_percentage: addDedication,
        start_date: addStartDate || null,
        end_date: addEndDate || (project?.end_date ?? null),
        assigned_at: new Date().toISOString(),
      }]
      saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
      return updated
    })
  }

  function handleManualAdd(consultantId: string) {
    if (!selectedProject) return
    setAssignments((prev) => {
      const updated = [...prev, {
        id: `manual-${Date.now()}`,
        project_id: selectedProject.id,
        consultant_id: consultantId,
        dedication_percentage: addDedication,
        start_date: addStartDate || null,
        end_date: addEndDate || selectedProject.end_date,
        assigned_at: new Date().toISOString(),
      }]
      saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
      return updated
    })
    setShowAddModal(false)
    setAddSearch('')
    setAddDedication(100)
    setAddStartDate('')
    setAddEndDate('')
  }

  function handleUnassign(assignmentId: string) {
    setAssignments((prev) => {
      const updated = prev.filter((a) => a.id !== assignmentId)
      saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
      return updated
    })
  }

  function handleAssignBeach(consultantId: string, taskType: BeachTaskType, description: string, endDate: string) {
    const newEntry: BeachAssignment = {
      id: `beach-${Date.now()}`,
      consultant_id: consultantId,
      task_type: taskType,
      description,
      end_date: endDate,
      assigned_at: new Date().toISOString(),
    }
    setBeachAssignments((prev) => {
      const updated = [...prev, newEntry]
      saveToStorage(BEACH_STORAGE_KEY, updated)
      return updated
    })
  }

  function handleRemoveBeach(id: string) {
    setBeachAssignments((prev) => {
      const updated = prev.filter((b) => b.id !== id)
      saveToStorage(BEACH_STORAGE_KEY, updated)
      return updated
    })
  }

  function handleAddVacation(consultantId: string, startDate: string, endDate: string, note: string) {
    const v: VacationRequest = {
      id: `v-${Date.now()}`,
      consultant_id: consultantId,
      start_date: startDate,
      end_date: endDate,
      note: note || undefined,
      created_at: new Date().toISOString(),
    }
    setVacations((prev) => {
      const updated = [...prev, v]
      saveToStorage(VACATIONS_STORAGE_KEY, updated)
      return updated
    })
  }

  function handleRemoveVacation(id: string) {
    setVacations((prev) => {
      const updated = prev.filter((v) => v.id !== id)
      saveToStorage(VACATIONS_STORAGE_KEY, updated)
      return updated
    })
  }

  function handleDeactivate(consultantId: string) {
    setConsultants((prev) =>
      prev.map((c) => c.id === consultantId ? { ...c, is_active: false } : c),
    )
    const ids = loadDeactivatedIds()
    ids.add(consultantId)
    saveDeactivatedIds(ids)
  }

  function toggleReplacements(consultantId: string) {
    setReplacementsFor((prev) => (prev === consultantId ? null : consultantId))
  }

  return (
    <Layout>
      {/* Add Person modal */}
      {showAddModal && selectedProject && (() => {
        const assignedIds = assignments.filter((a) => a.project_id === selectedProject.id).map((a) => a.consultant_id)
        const candidates = consultants.filter(
          (c) =>
            c.is_active &&
            !assignedIds.includes(c.id) &&
            (addSearch === '' ||
              c.name.toLowerCase().includes(addSearch.toLowerCase()) ||
              c.role_title.toLowerCase().includes(addSearch.toLowerCase()) ||
              c.skills.some((s) => s.toLowerCase().includes(addSearch.toLowerCase()))),
        )
        return (
          <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20 overflow-y-auto">
            <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                <h2 className="text-sm font-semibold text-navy-800">Agregar persona — {selectedProject.name}</h2>
                <button onClick={() => { setShowAddModal(false); setAddSearch('') }} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Dedicación (%)</label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      step={10}
                      value={addDedication}
                      onChange={(e) => setAddDedication(Math.min(100, Math.max(0, Number(e.target.value))))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Fecha inicio</label>
                    <Input
                      type="date"
                      value={addStartDate}
                      min={todayStr}
                      onChange={(e) => setAddStartDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">Fecha fin</label>
                    <Input
                      type="date"
                      value={addEndDate}
                      min={tomorrowStr}
                      onChange={(e) => setAddEndDate(e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
                <p className="text-xs text-slate-400 -mt-2">Dejar vacío para usar las fechas del proyecto.</p>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Buscar por nombre, cargo o habilidad…"
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    className="h-9 pl-8 text-sm"
                    autoFocus
                  />
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                  {candidates.length === 0 ? (
                    <p className="text-center text-sm text-slate-400 py-6">No se encontraron consultores disponibles.</p>
                  ) : (
                    candidates.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleManualAdd(c.id)}
                        className="flex w-full items-center gap-3 rounded-lg border border-slate-100 p-2.5 text-left hover:border-navy-400 hover:bg-slate-50 transition"
                      >
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-navy-800 truncate">{c.name}</p>
                          <p className="text-xs text-slate-500 truncate">{c.role_title} · {c.seniority}</p>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })()}

      <KimbleImportModal
        open={kimbleModalOpen}
        onClose={() => setKimbleModalOpen(false)}
        consultants={consultants}
        onConfirm={handleKimbleImport}
      />

      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Staffing Dashboard</h1>
          <p className="text-sm text-slate-500">
            Manage your consulting team and projects
            {lastImport && (
              <span className="ml-2 text-xs text-green-600">· Kimble data imported: {lastImport}</span>
            )}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0 gap-1.5 border-slate-200 text-slate-600 hover:border-navy-800 hover:text-navy-800"
          onClick={() => setKimbleModalOpen(true)}
        >
          <Upload size={14} />
          Import Kimble
        </Button>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="staffing">Staffing Plan</TabsTrigger>
        </TabsList>

        {/* Projects tab */}
        <TabsContent value="projects">
          <div className="grid gap-4 lg:grid-cols-3">
            {/* Project list */}
            <div className="space-y-4">
              {upcomingProjects.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-bip-red">
                    Needs Staffing
                  </p>
                  <div className="space-y-2">
                    {upcomingProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        assigned={assignments.filter((a) => a.project_id === project.id).length}
                        selected={selectedProject?.id === project.id}
                        onClick={() => { setSelectedProject(project); setReplacementsFor(null) }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {activeProjects.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                    In Progress
                  </p>
                  <div className="space-y-2">
                    {activeProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        assigned={assignments.filter((a) => a.project_id === project.id).length}
                        selected={selectedProject?.id === project.id}
                        onClick={() => { setSelectedProject(project); setReplacementsFor(null) }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {endedProjects.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-300">
                    Ended
                  </p>
                  <div className="space-y-2">
                    {endedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        assigned={assignments.filter((a) => a.project_id === project.id).length}
                        selected={selectedProject?.id === project.id}
                        onClick={() => { setSelectedProject(project); setReplacementsFor(null) }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right panel — sticky so it stays visible while the left panel scrolls */}
            <div className="lg:col-span-2 lg:sticky lg:top-4 self-start max-h-[calc(100vh-5rem)] overflow-y-auto space-y-4">
              {selectedProject ? (
                <div className="rounded-lg border border-slate-200 bg-white p-5">
                  {/* Header */}
                  <div className="mb-4 flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-navy-800">{selectedProject.name}</h2>
                      <p className="text-sm text-slate-500">
                        {selectedProject.client} · {selectedProject.industry}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDate(selectedProject.start_date)} – {formatDate(selectedProject.end_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant={projectStatusVariant(selectedProject.status)}>
                        {selectedProject.status}
                      </Badge>
                    </div>
                  </div>

                  {/* ── Required Skills (editable) — hidden for ended projects ── */}
                  {!isEndedProject && (
                    <SkillsEditor
                      skills={selectedProject.skills_required}
                      onChange={(skills) => handleUpdateProjectSkills(selectedProject.id, skills)}
                    />
                  )}

                  {isEndedProject ? (
                    /* ── Ended project: read-only team list ── */
                    <div>
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Equipo ({assignedConsultants.length})
                      </p>
                      {assignedConsultants.length === 0 ? (
                        <p className="text-sm text-slate-400">Sin asignaciones registradas.</p>
                      ) : (
                        <div className="space-y-2">
                          {assignedConsultants.map(({ consultant, assignment }) => (
                            <div key={consultant.id} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white p-3">
                              <Avatar className="h-9 w-9 shrink-0">
                                <AvatarFallback className="text-xs">{getInitials(consultant.name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-navy-800">{consultant.name}</p>
                                <p className="text-xs text-slate-500">{consultant.role_title} · {consultant.seniority}</p>
                              </div>
                              {/* No dedication % shown for ended projects */}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Non-ended project: always show team if there are assignments,
                           plus position suggestions for Open / Partially Staffed ── */
                    <div className="space-y-6">

                      {/* Team section — shown whenever there are confirmed assignments */}
                      {assignedConsultants.length > 0 && (
                        <div>
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                              Assigned Team ({assignedConsultants.length})
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 gap-1.5 text-xs"
                                onClick={() => setShowAddModal(true)}
                              >
                                <UserPlus size={13} /> Agregar persona
                              </Button>
                              {assignedConsultants.some(({ consultant }) => {
                                const total = getTotalDedication(consultant.id, assignments, today)
                                return total > (MAX_CARGABILITY[consultant.seniority] ?? 100)
                              }) && (
                                <span className="flex items-center gap-1 text-xs text-red-600">
                                  <AlertTriangle size={12} />
                                  Over-dedicated members
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {assignedConsultants.map(({ consultant, assignment }) => {
                              const total = getTotalDedication(consultant.id, assignments, today)
                              const max = MAX_CARGABILITY[consultant.seniority] ?? 100
                              return (
                                <AssignedMemberRow
                                  key={consultant.id}
                                  consultant={consultant}
                                  assignment={assignment}
                                  totalDedication={total}
                                  maxDedication={max}
                                  project={selectedProject}
                                  assignments={assignments}
                                  vacations={vacations}
                                  replacementsFor={replacementsFor}
                                  onToggleReplacements={toggleReplacements}
                                  onUnassign={() => handleUnassign(assignment.id)}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Add-person CTA when there are no assignments yet */}
                      {assignedConsultants.length === 0 && isActiveProject && (
                        <div className="flex flex-col items-center gap-2 py-4">
                          <p className="text-sm text-slate-400">No assignments recorded.</p>
                          <Button size="sm" variant="outline" className="h-7 gap-1.5 text-xs" onClick={() => setShowAddModal(true)}>
                            <UserPlus size={13} /> Agregar persona
                          </Button>
                        </div>
                      )}

                      {/* Position suggestions — shown for Open / Partially Staffed projects */}
                      {!isActiveProject && (
                        <div className="space-y-5">
                          {/* Assignment params shared by "Assign" buttons and "Agregar persona" modal */}
                          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-2">
                            <p className="text-xs font-medium text-slate-500">Parámetros de asignación</p>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Dedicación (%)</label>
                                <Input
                                  type="number"
                                  min={0}
                                  max={100}
                                  step={10}
                                  value={addDedication}
                                  onChange={(e) => setAddDedication(Math.min(100, Math.max(0, Number(e.target.value))))}
                                  className="h-7 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Fecha inicio</label>
                                <Input
                                  type="date"
                                  value={addStartDate}
                                  min={todayStr}
                                  onChange={(e) => setAddStartDate(e.target.value)}
                                  className="h-7 text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Fecha fin</label>
                                <Input
                                  type="date"
                                  value={addEndDate}
                                  min={tomorrowStr}
                                  onChange={(e) => setAddEndDate(e.target.value)}
                                  className="h-7 text-sm"
                                />
                              </div>
                            </div>
                            <p className="text-xs text-slate-400">Dejar vacío para usar las fechas del proyecto.</p>
                          </div>
                          {positionSuggestions.map(({ position, results }, pi) => (
                            <div key={position?.id ?? 'general'}>
                              {position && (
                                <div className="mb-2 flex items-center gap-2">
                                  <span className="text-sm font-medium text-blue-800">{position.role}</span>
                                  <Badge variant="open" className="text-xs">{position.seniority}</Badge>
                                </div>
                              )}
                              {!position && (
                                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                                  AI Match Suggestions
                                </p>
                              )}
                              {results.length === 0 ? (
                                <p className="text-sm text-slate-400">No hay candidatos disponibles.</p>
                              ) : (
                                <div className="space-y-2">
                                  {results.map((result) => {
                                    const alreadyAssigned = assignedIds.includes(result.consultant.id)
                                    const activeBeach = beachAssignments.filter(
                                      (b) => b.consultant_id === result.consultant.id && new Date(b.end_date) >= today,
                                    )
                                    return (
                                      <div
                                        key={result.consultant.id}
                                        className="flex items-start gap-3 rounded-md border border-slate-100 p-3"
                                      >
                                        <Avatar className="h-9 w-9 shrink-0">
                                          <AvatarFallback className="text-xs">
                                            {getInitials(result.consultant.name)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="flex items-center gap-2">
                                            <p className="font-medium text-navy-800">{result.consultant.name}</p>
                                            {result.hasLiked && <Heart size={13} className="fill-bip-red text-bip-red" />}
                                          </div>
                                          <p className="text-xs text-slate-500">{result.reason}</p>
                                          {result.vacationWarning && (
                                            <p className="mt-0.5 text-xs text-amber-600">⚠ {result.vacationWarning}</p>
                                          )}
                                          {activeBeach.length > 0 && (
                                            <p className="mt-0.5 text-xs text-amber-600">
                                              ⚠ En playa: {activeBeach.map((b) => `${b.task_type} — ${b.description}`).join('; ')}
                                            </p>
                                          )}
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                          <span className="text-sm font-bold text-navy-800">{result.score}</span>
                                          {alreadyAssigned ? (
                                            <Badge variant="success" className="text-xs">Assigned</Badge>
                                          ) : (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="text-xs h-7"
                                              onClick={() => handleAssign(result.consultant.id, selectedProject.id)}
                                            >
                                              Assign
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white">
                  <p className="text-sm text-slate-400">Select a project to see details</p>
                </div>
              )}

              {/* Consultant directory — only for upcoming/open projects */}
              {!isActiveProject && !isEndedProject && <div className="rounded-lg border border-slate-200 bg-white p-5">
                <div className="mb-3 flex items-center gap-2">
                  <Search size={15} className="text-slate-400" />
                  <Input
                    placeholder="Search by name or skill…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="space-y-2">
                  {filteredConsultants.map((c) => (
                    <div key={c.id} className="flex items-center gap-3 rounded-md py-2">
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-800">{c.name}</p>
                        <p className="truncate text-xs text-slate-400">{c.skills.slice(0, 3).join(', ')}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <Badge variant="secondary" className="text-xs">{c.seniority}</Badge>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {isAvailableNow(c.available_from) ? 'Available' : formatDate(c.available_from)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>}
            </div>
          </div>
        </TabsContent>

        {/* People tab */}
        <TabsContent value="people">
          <PeopleTab
            consultants={consultants}
            projects={projects}
            assignments={assignments}
            beachAssignments={beachAssignments}
            vacations={vacations}
            onAssignBeach={handleAssignBeach}
            onRemoveBeach={handleRemoveBeach}
            onAddVacation={handleAddVacation}
            onRemoveVacation={handleRemoveVacation}
            onDeactivate={handleDeactivate}
          />
        </TabsContent>

        {/* Staffing Plan tab */}
        <TabsContent value="staffing">
          <AutoStaffingPlan
            projects={visibleProjects}
            consultants={consultants}
            assignments={assignments}
            vacations={vacations}
            likes={mockLikes}
            beachAssignments={beachAssignments}
            onApply={(newAssignments) =>
              setAssignments((prev) => {
                const updated = [...prev, ...newAssignments]
                saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
                return updated
              })
            }
          />
        </TabsContent>
      </Tabs>
    </Layout>
  )
}
