import { useState, useEffect, useRef } from 'react'
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
  EMAIL_OVERRIDES,
} from '@/lib/mockData'
import { matchConsultants, matchConsultantsForPosition, findReplacements } from '@/lib/matching'
import { MAX_CARGABILITY } from '@/lib/constants'
import { getInitials, formatDate, isAvailableNow, nameToEmail } from '@/lib/utils'
import { supabase, isDemoMode } from '@/lib/supabase'
import PeopleTab from '@/components/PeopleTab'
import AutoStaffingPlan from '@/components/AutoStaffingPlan'
import KimbleImportModal from '@/components/KimbleImportModal'
import type { KimbleImportResult } from '@/lib/kimbleParser'
import type { Profile, Project, VacationRequest, ProjectAssignment, BeachAssignment, BeachTaskType } from '@/lib/types'
import { computeFatigue, getBeachDedication } from '@/lib/fatigue'

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
  projects: Project[],
): number {
  return assignments
    .filter((a) => {
      if (a.consultant_id !== consultantId) return false
      const project = projects.find((p) => p.id === a.project_id)
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
  beachAssignments: BeachAssignment[]
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
  beachAssignments,
  replacementsFor,
  onToggleReplacements,
  onUnassign,
}: AssignedMemberRowProps) {
  const today = new Date()
  const beachDed = getBeachDedication(consultant.id, beachAssignments, today)
  const { level: fatigueLevel } = computeFatigue(consultant, totalDedication, beachDed, vacations)
  const isOver = fatigueLevel === 'riesgo' || fatigueLevel === 'vigilancia'
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
              {assignment.dedication_percentage}%
            </span>
            <span className="text-xs text-slate-400">en proyecto</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">
            {assignment.start_date ? `${formatDate(assignment.start_date)} – ` : ''}{formatDate(assignment.end_date ?? project.end_date)}
          </p>
          {fatigueLevel === 'riesgo' && (
            <Badge variant="destructive" className="mt-1 text-xs">Riesgo de fatiga</Badge>
          )}
          {fatigueLevel === 'vigilancia' && (
            <Badge variant="warning" className="mt-1 text-xs">En vigilancia</Badge>
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
  // Deactivated IDs are tracked in their own state, seeded from localStorage on mount.
  // This is intentionally separate from the consultants array so that Kimble imports,
  // Supabase profile fetches, or any other setConsultants call cannot accidentally
  // resurrect a deactivated consultant.
  const [deactivatedIds, setDeactivatedIds] = useState<Set<string>>(new Set())
  const [projects, setProjects] = useState(mockProjects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [assignments, setAssignments] = useState<ProjectAssignment[]>(mockAssignments)
  const [vacations, setVacations] = useState<VacationRequest[]>([])
  const [search, setSearch] = useState('')
  const [replacementsFor, setReplacementsFor] = useState<string | null>(null)
  const [kimbleModalOpen, setKimbleModalOpen] = useState(false)
  const [lastImport, setLastImport] = useState<string | null>(null)
  const [beachAssignments, setBeachAssignments] = useState<BeachAssignment[]>([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [addDedication, setAddDedication] = useState(100)
  const [addStartDate, setAddStartDate] = useState('')
  const [addEndDate, setAddEndDate] = useState('')
  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 86400000)
  const todayStr = today.toISOString().split('T')[0]
  const tomorrowStr = new Date(today.getTime() + 86400000).toISOString().split('T')[0]

  // ── Pending new hires ────────────────────────────────────────────────────────
  interface PendingUser {
    id: string
    email: string
    name: string
    seniority: string
    created_at: string
  }
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([])
  const [pendingLoading, setPendingLoading] = useState(false)
  const [approvingId, setApprovingId] = useState<string | null>(null)

  // On mount: restore state from Supabase (real mode) or localStorage (demo mode).
  useEffect(() => {
    if (isDemoMode || !supabase) {
      // ── Demo / localStorage branch ───────────────────────────────────────────
      try {
        const saved = localStorage.getItem(KIMBLE_STORAGE_KEY)
        if (saved) {
          const hasPersistedAssignments = localStorage.getItem(ASSIGNMENTS_STORAGE_KEY) !== null
          handleKimbleImport(JSON.parse(saved), { skipAssignments: hasPersistedAssignments })
        }
      } catch {
        localStorage.removeItem(KIMBLE_STORAGE_KEY)
      }

      // Assignments (if not restored by handleKimbleImport above)
      const savedAssignments = loadFromStorage<ProjectAssignment>(ASSIGNMENTS_STORAGE_KEY, mockAssignments)
      setAssignments(savedAssignments)

      // Beach assignments
      const yearStart = `${new Date().getFullYear()}-01-01`
      setBeachAssignments(
        loadFromStorage<BeachAssignment>(BEACH_STORAGE_KEY, []).filter((b) => b.end_date >= yearStart),
      )

      // Vacations
      setVacations(
        loadFromStorage<VacationRequest>(VACATIONS_STORAGE_KEY, mockVacationRequests).filter(
          (v) => v.end_date >= yearStart,
        ),
      )

      // Deactivations
      const deactivated = loadDeactivatedIds()
      setDeactivatedIds(deactivated)
      if (deactivated.size > 0) {
        setConsultants((prev) =>
          prev.map((c) => deactivated.has(c.id) ? { ...c, is_active: false } : c),
        )
      }

      // Saved CV edits
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
    } else {
      // ── Supabase branch ──────────────────────────────────────────────────────

      // 1. Kimble cache
      supabase
        .from('kimble_cache')
        .select('*')
        .limit(1)
        .then(({ data }) => {
          if (data && data.length > 0) {
            const row = data[0]
            lastKimbleTs.current = row.imported_at
            handleKimbleImport(row.data as KimbleImportResult, { skipAssignments: true })
            const fn = row.file_name || (row.data as KimbleImportResult)?.fileName
            if (fn) setLastImport(fn)
          }
        })

      // 2. Project assignments
      supabase
        .from('project_assignments')
        .select('*')
        .then(({ data }) => {
          if (data && data.length > 0) {
            setAssignments(data as ProjectAssignment[])
          }
          // else keep the mockAssignments default
        })

      // 3. Beach assignments (current year only)
      const yearStart = `${new Date().getFullYear()}-01-01`
      supabase
        .from('beach_assignments')
        .select('*')
        .gte('end_date', yearStart)
        .then(({ data }) => {
          if (data) setBeachAssignments(data as BeachAssignment[])
        })

      // 4. Vacation requests (current year only)
      supabase
        .from('vacation_requests')
        .select('*')
        .gte('end_date', yearStart)
        .then(({ data }) => {
          if (data) setVacations(data as VacationRequest[])
        })

      // 5. Deactivated consultants
      supabase
        .from('deactivated_consultants')
        .select('consultant_id')
        .then(({ data }) => {
          if (data && data.length > 0) {
            const deactivated = new Set(data.map((r) => r.consultant_id as string))
            setDeactivatedIds(deactivated)
            setConsultants((prev) =>
              prev.map((c) => deactivated.has(c.id) ? { ...c, is_active: false } : c),
            )
          }
        })

      // 6. New hire profiles from Supabase profiles table
      const knownEmails = new Set([
        ...mockConsultants.map((c) => nameToEmail(c.name)),
        ...Object.keys(EMAIL_OVERRIDES),
      ])
      supabase
        .from('profiles')
        .select('*')
        .then(({ data }) => {
          if (!data) return
          const newHires = data.filter(
            (p) => p.email && !knownEmails.has(p.email) && !p.is_admin_only,
          ) as Profile[]
          if (newHires.length > 0) {
            setConsultants((prev) => {
              const existingIds = new Set(prev.map((c) => c.id))
              // deactivatedIds state may not be updated yet — read from Supabase data again
              const toAdd = newHires.filter((h) => !existingIds.has(h.id))
              return [...prev, ...toAdd]
            })
          }
        })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Polling fallback (every 10 s) ────────────────────────────────────────────
  // Guarantees sync even when Realtime events are missed.
  const lastKimbleTs = useRef<string | null>(null)
  useEffect(() => {
    if (isDemoMode || !supabase) return
    const yearStart = `${new Date().getFullYear()}-01-01`

    async function poll() {
      if (!supabase) return
      // Kimble — only re-apply if the timestamp changed
      const { data: kc } = await supabase.from('kimble_cache').select('imported_at, file_name, data').limit(1)
      if (kc && kc.length > 0 && kc[0].imported_at !== lastKimbleTs.current) {
        lastKimbleTs.current = kc[0].imported_at
        refreshFnRef.current?.kimble()
      }
      // Other tables — always sync
      refreshFnRef.current?.assignments()
      refreshFnRef.current?.beach()
      refreshFnRef.current?.vacations()
      refreshFnRef.current?.deactivated()
    }

    const id = setInterval(poll, 10_000)
    return () => clearInterval(id)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Supabase Realtime subscriptions ─────────────────────────────────────────
  // refreshFnRef holds the latest version of the per-table refresh functions so the
  // Realtime callbacks (set up once on mount) always call fresh closures with current state.
  const refreshFnRef = useRef<{
    kimble: () => void
    assignments: () => void
    beach: () => void
    vacations: () => void
    deactivated: () => void
  } | null>(null)

  // Update ref on every render — no stale-closure problem in Realtime callbacks.
  const yearStartStr = `${new Date().getFullYear()}-01-01`
  refreshFnRef.current = {
    kimble: () => {
      if (!supabase) return
      // Re-apply Kimble enrichments (projects + consultant dedications/areas)
      supabase.from('kimble_cache').select('*').limit(1).then(({ data }) => {
        if (data && data.length > 0) {
          // Staleness check: skip if this fetch returned data older than what we already have.
          // This prevents a slow in-flight fetch (started before an import) from overwriting
          // the correct newer file name with stale data.
          const fetchedMs = new Date(data[0].imported_at).getTime()
          const currentMs = lastKimbleTs.current ? new Date(lastKimbleTs.current).getTime() : 0
          if (fetchedMs < currentMs) return
          lastKimbleTs.current = data[0].imported_at
          handleKimbleImport(data[0].data as KimbleImportResult, { skipAssignments: true })
          const fn = data[0].file_name || (data[0].data as KimbleImportResult)?.fileName
          if (fn) setLastImport(fn)
        }
      })
      // Also refresh assignments since a Kimble import replaces them
      supabase.from('project_assignments').select('*').then(({ data }) => {
        if (data && data.length > 0) setAssignments(data as ProjectAssignment[])
      })
    },
    assignments: () => {
      if (!supabase) return
      supabase.from('project_assignments').select('*').then(({ data }) => {
        if (data) setAssignments(data as ProjectAssignment[])
      })
    },
    beach: () => {
      if (!supabase) return
      supabase.from('beach_assignments').select('*').gte('end_date', yearStartStr).then(({ data }) => {
        if (data) setBeachAssignments(data as BeachAssignment[])
      })
    },
    vacations: () => {
      if (!supabase) return
      supabase.from('vacation_requests').select('*').gte('end_date', yearStartStr).then(({ data }) => {
        if (data) setVacations(data as VacationRequest[])
      })
    },
    deactivated: () => {
      if (!supabase) return
      supabase.from('deactivated_consultants').select('consultant_id').then(({ data }) => {
        if (data) {
          const deactivated = new Set(data.map((r) => r.consultant_id as string))
          setDeactivatedIds(deactivated)
          setConsultants((prev) =>
            prev.map((c) => deactivated.has(c.id) ? { ...c, is_active: false } : c),
          )
        }
      })
    },
  }

  useEffect(() => {
    if (isDemoMode || !supabase) return

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kimble_cache' },
        () => refreshFnRef.current?.kimble())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_assignments' },
        () => refreshFnRef.current?.assignments())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'beach_assignments' },
        () => refreshFnRef.current?.beach())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'vacation_requests' },
        () => refreshFnRef.current?.vacations())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deactivated_consultants' },
        () => refreshFnRef.current?.deactivated())
      .subscribe()

    return () => { supabase!.removeChannel(channel) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch pending users from Edge Function on mount (real mode only)
  useEffect(() => {
    if (isDemoMode || !supabase) return
    async function fetchPendingUsers() {
      setPendingLoading(true)
      try {
        const { data: { session } } = await supabase!.auth.getSession()
        if (!session) return
        const res = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/list-pending-users`,
          {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          },
        )
        if (res.ok) {
          const json = await res.json()
          setPendingUsers(json.users ?? [])
        }
      } catch { /* ignore — Edge Function may not be deployed yet */ } finally {
        setPendingLoading(false)
      }
    }
    fetchPendingUsers()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleApproveUser(userId: string) {
    if (!supabase) return
    setApprovingId(userId)
    try {
      const { data: { session } } = await supabase!.auth.getSession()
      if (!session) return
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/approve-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        },
      )
      if (res.ok) {
        setPendingUsers((prev) => prev.filter((u) => u.id !== userId))
      }
    } catch { /* ignore */ } finally {
      setApprovingId(null)
    }
  }

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

    // On explicit import: Kimble is source of truth for any (project, consultant) pair it covers.
    // - Kimble-generated assignments for projects in this file → always replaced.
    // - Manual assignments where Kimble now covers the same (project, consultant) → replaced by Kimble.
    // - Manual assignments for consultants Kimble does NOT mention in that project → kept as-is.
    // On mount (skipAssignments=true): skip entirely; assignments come from localStorage.
    if (!opts.skipAssignments) {
      setAssignments((prev) => {
        const kimbleProjectIds = new Set(result.projects.map(
          (kp) => numericToExistingId.get(numericCode(kp.id)) ?? kp.id,
        ))
        // Build a set of (project_id, consultant_id) pairs covered by new Kimble assignments
        const kimbleCovered = new Set(
          newAssignments.map((a) => `${a.project_id}::${a.consultant_id}`),
        )
        const kept = prev.filter((a) => {
          // Always drop old Kimble assignments for projects in this file
          if (kimbleProjectIds.has(a.project_id) && a.id.startsWith('kimble-')) return false
          // Drop manual assignments if Kimble now covers the same person+project
          if (kimbleCovered.has(`${a.project_id}::${a.consultant_id}`)) return false
          return true
        })
        const updated = [...kept, ...newAssignments]
        if (!isDemoMode && supabase) {
          supabase
            .from('project_assignments')
            .delete()
            .neq('id', '')
            .then(() => {
              supabase!
                .from('project_assignments')
                .insert(updated)
                .then(() => {})
            })
        } else {
          saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
        }
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

    // Only set the file name on a direct import — refreshes handle it separately
    // with a staleness check to avoid overwriting newer data with older fetches.
    if (!opts.skipAssignments && result.fileName) setLastImport(result.fileName)

    // Persist the import result — only on direct imports, NOT on DB refreshes.
    // Refreshes (skipAssignments=true) already have DB data; re-upserting would
    // overwrite new data with stale data and create an infinite Realtime loop.
    if (!isDemoMode && supabase && !opts.skipAssignments) {
      supabase
        .from('kimble_cache')
        .upsert({ id: 1, data: result, file_name: result.fileName, imported_at: result.importedAt })
        .then(() => { lastKimbleTs.current = result.importedAt })
    } else {
      try {
        localStorage.setItem(KIMBLE_STORAGE_KEY, JSON.stringify(result))
      } catch {
        // storage full — not critical, just skip
      }
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
          results: matchConsultantsForPosition(pos, selectedProject, consultants.filter((c) => !deactivatedIds.has(c.id)), mockLikes, vacations, assignments),
        }))
      : selectedProject && !isActiveProject
      ? [{ position: null, results: matchConsultants(selectedProject, consultants.filter((c) => !deactivatedIds.has(c.id)), mockLikes, vacations, assignments) }]
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
    const newAssignment: ProjectAssignment = {
      id: `a${Date.now()}`,
      project_id: projectId,
      consultant_id: consultantId,
      dedication_percentage: addDedication,
      start_date: addStartDate || null,
      end_date: addEndDate || (project?.end_date ?? null),
      assigned_at: new Date().toISOString(),
    }
    setAssignments((prev) => {
      const updated = [...prev, newAssignment]
      if (!isDemoMode && supabase) {
        supabase.from('project_assignments').insert(newAssignment).then(() => {})
      } else {
        saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
      }
      return updated
    })
  }

  function handleManualAdd(consultantId: string) {
    if (!selectedProject) return
    const newAssignment: ProjectAssignment = {
      id: `manual-${Date.now()}`,
      project_id: selectedProject.id,
      consultant_id: consultantId,
      dedication_percentage: addDedication,
      start_date: addStartDate || null,
      end_date: addEndDate || selectedProject.end_date,
      assigned_at: new Date().toISOString(),
    }
    setAssignments((prev) => {
      const updated = [...prev, newAssignment]
      if (!isDemoMode && supabase) {
        supabase.from('project_assignments').insert(newAssignment).then(() => {})
      } else {
        saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
      }
      return updated
    })
    setShowAddModal(false)
    setAddSearch('')
    setAddDedication(100)
    setAddStartDate('')
    setAddEndDate('')
  }

  function handleUnassign(assignmentId: string) {
    if (!isDemoMode && supabase) {
      supabase.from('project_assignments').delete().eq('id', assignmentId).then(() => {})
    }
    setAssignments((prev) => {
      const updated = prev.filter((a) => a.id !== assignmentId)
      if (isDemoMode || !supabase) {
        saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
      }
      return updated
    })
  }

  function handleAssignBeach(consultantId: string, taskType: BeachTaskType, description: string, endDate: string, dedication: number) {
    const newEntry: BeachAssignment = {
      id: `beach-${Date.now()}`,
      consultant_id: consultantId,
      task_type: taskType,
      description,
      end_date: endDate,
      dedication_percentage: dedication,
      assigned_at: new Date().toISOString(),
    }
    setBeachAssignments((prev) => {
      const updated = [...prev, newEntry]
      if (!isDemoMode && supabase) {
        supabase.from('beach_assignments').insert(newEntry).then(() => {})
      } else {
        saveToStorage(BEACH_STORAGE_KEY, updated)
      }
      return updated
    })
  }

  function handleRemoveBeach(id: string) {
    if (!isDemoMode && supabase) {
      supabase.from('beach_assignments').delete().eq('id', id).then(() => {})
    }
    setBeachAssignments((prev) => {
      const updated = prev.filter((b) => b.id !== id)
      if (isDemoMode || !supabase) {
        saveToStorage(BEACH_STORAGE_KEY, updated)
      }
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
      if (!isDemoMode && supabase) {
        supabase.from('vacation_requests').insert(v).then(() => {})
      } else {
        saveToStorage(VACATIONS_STORAGE_KEY, updated)
      }
      return updated
    })
  }

  function handleRemoveVacation(id: string) {
    if (!isDemoMode && supabase) {
      supabase.from('vacation_requests').delete().eq('id', id).then(() => {})
    }
    setVacations((prev) => {
      const updated = prev.filter((v) => v.id !== id)
      if (isDemoMode || !supabase) {
        saveToStorage(VACATIONS_STORAGE_KEY, updated)
      }
      return updated
    })
  }

  async function handleDeactivate(consultantId: string) {
    // 1. Update UI immediately — both the dedicated deactivatedIds state (primary)
    //    and the consultants array (secondary, for backwards compat with matchers etc.)
    const consultant = consultants.find((c) => c.id === consultantId)
    const newDeactivated = new Set(deactivatedIds)
    newDeactivated.add(consultantId)
    setDeactivatedIds(newDeactivated)
    if (!isDemoMode && supabase) {
      supabase
        .from('deactivated_consultants')
        .insert({ consultant_id: consultantId })
        .then(() => {})
    } else {
      saveDeactivatedIds(newDeactivated)
    }
    setConsultants((prev) =>
      prev.map((c) => c.id === consultantId ? { ...c, is_active: false } : c),
    )

    // 2. Delete their Supabase account so they can't log in
    // Use profile.email if available (new hires), otherwise derive from name
    if (!isDemoMode && supabase && consultant) {
      const email = consultant.email ?? nameToEmail(consultant.name)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/deactivate-user`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email }),
            },
          )
        }
      } catch (err) {
        console.warn('[handleDeactivate] Could not delete Supabase account:', err)
      }
    }
  }

  async function handleSetAdminRole(consultantId: string, role: 'hr_admin' | 'consultant') {
    const consultant = consultants.find((c) => c.id === consultantId)
    if (!consultant) return

    // Optimistic UI update
    setConsultants((prev) =>
      prev.map((c) => c.id === consultantId ? { ...c, user_role: role } : c),
    )

    if (!isDemoMode && supabase) {
      const email = consultant.email ?? nameToEmail(consultant.name)
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/set-user-role`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, role }),
            },
          )
          if (!res.ok) {
            console.error('[handleSetAdminRole] Edge Function error')
            // Revert on failure
            setConsultants((prev) =>
              prev.map((c) => c.id === consultantId ? { ...c, user_role: role === 'hr_admin' ? 'consultant' : 'hr_admin' } : c),
            )
          }
        }
      } catch (err) {
        console.warn('[handleSetAdminRole] Failed:', err)
      }
    }
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

      {/* ── Nuevos Consultores (real mode only) ── */}
      {!isDemoMode && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <UserPlus size={16} className="text-navy-800" />
            <h2 className="text-sm font-semibold text-navy-800">Nuevos Consultores</h2>
            {pendingUsers.length > 0 && (
              <span className="rounded-full bg-bip-red px-2 py-0.5 text-xs font-semibold text-white">
                {pendingUsers.length}
              </span>
            )}
          </div>

          {pendingLoading ? (
            <p className="text-sm text-slate-400">Cargando…</p>
          ) : pendingUsers.length === 0 ? (
            <p className="text-sm text-slate-400">No hay nuevos consultores pendientes.</p>
          ) : (
            <div className="space-y-3">
              {pendingUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy-800 truncate">{u.name || '(sin nombre)'}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {u.seniority && (
                        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs text-slate-600">
                          {u.seniority}
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        Registrado: {new Date(u.created_at).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    disabled={approvingId === u.id}
                    onClick={() => handleApproveUser(u.id)}
                    className="shrink-0"
                  >
                    {approvingId === u.id ? 'Aprobando…' : 'Aprobar'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                                const total = getTotalDedication(consultant.id, assignments, today, projects)
                                const beach = getBeachDedication(consultant.id, beachAssignments, today)
                                const { level } = computeFatigue(consultant, total, beach, vacations)
                                return level !== 'normal'
                              }) && (
                                <span className="flex items-center gap-1 text-xs text-red-600">
                                  <AlertTriangle size={12} />
                                  Riesgo de fatiga en el equipo
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="space-y-2">
                            {assignedConsultants.map(({ consultant, assignment }) => {
                              const total = getTotalDedication(consultant.id, assignments, today, projects)
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
                                  beachAssignments={beachAssignments}
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
            consultants={consultants.filter((c) => !deactivatedIds.has(c.id))}
            projects={projects}
            assignments={assignments}
            beachAssignments={beachAssignments}
            vacations={vacations}
            onAssignBeach={handleAssignBeach}
            onRemoveBeach={handleRemoveBeach}
            onAddVacation={handleAddVacation}
            onRemoveVacation={handleRemoveVacation}
            onDeactivate={handleDeactivate}
            onSetAdminRole={handleSetAdminRole}
          />
        </TabsContent>

        {/* Staffing Plan tab */}
        <TabsContent value="staffing">
          <AutoStaffingPlan
            projects={visibleProjects}
            consultants={consultants.filter((c) => !deactivatedIds.has(c.id))}
            assignments={assignments}
            vacations={vacations}
            likes={mockLikes}
            beachAssignments={beachAssignments}
            onApply={(newAssignments) =>
              setAssignments((prev) => {
                const updated = [...prev, ...newAssignments]
                if (!isDemoMode && supabase) {
                  supabase.from('project_assignments').insert(newAssignments).then(() => {})
                } else {
                  saveToStorage(ASSIGNMENTS_STORAGE_KEY, updated)
                }
                return updated
              })
            }
          />
        </TabsContent>
      </Tabs>
    </Layout>
  )
}
