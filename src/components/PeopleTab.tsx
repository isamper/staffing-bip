import { useState } from 'react'
import { Search, AlertTriangle, Clock, ChevronRight, Info, Umbrella, X, CalendarOff } from 'lucide-react'
import { MAX_CARGABILITY } from '@/lib/constants'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import ConsultantCV from '@/components/ConsultantCV'
import { getInitials, formatDate, isAvailableNow } from '@/lib/utils'
import type { Profile, Project, ProjectAssignment, BeachAssignment, BeachTaskType, VacationRequest } from '@/lib/types'

type FilterKey = 'all' | 'available' | 'on_project' | 'rolling_off' | 'over_dedicated'

const BEACH_TASK_TYPES: BeachTaskType[] = ['Propuesta', 'Actividad Interna', 'Apoyo a Proyecto', 'Otro']

interface ProjectInfo {
  name: string
  dedication: number
  endDate: string
  startDate: string   // when the consultant starts on this project
  past: boolean       // true when the assignment has already ended
  upcoming?: boolean  // true when the assignment starts in the future
}

interface ConsultantStats {
  consultant: Profile
  totalDedication: number
  maxDedication: number
  isOverDedicated: boolean
  isAvailable: boolean
  isRollingOff: boolean
  isOnProject: boolean
  isOnBeach: boolean
  activeBeachTasks: BeachAssignment[]
  pastBeachTasks: BeachAssignment[]
  pastVacations: VacationRequest[]
  projectsInfo: ProjectInfo[]
  pastProjectsInfo: ProjectInfo[]
}

// ─── filter chip ─────────────────────────────────────────────────────────────

const CHIP_STYLES: Record<string, { base: string; active: string }> = {
  navy:  { base: 'border-slate-200 text-slate-600 hover:border-navy-800',   active: 'border-navy-800 bg-navy-800 text-white' },
  green: { base: 'border-slate-200 text-slate-600 hover:border-green-600',  active: 'border-green-600 bg-green-600 text-white' },
  blue:  { base: 'border-slate-200 text-slate-600 hover:border-blue-600',   active: 'border-blue-600 bg-blue-600 text-white' },
  amber: { base: 'border-slate-200 text-slate-600 hover:border-amber-500',  active: 'border-amber-500 bg-amber-500 text-white' },
  red:   { base: 'border-slate-200 text-slate-600 hover:border-red-600',    active: 'border-red-600 bg-red-600 text-white' },
}

function FilterChip({
  label, count, active, color, onClick,
}: {
  label: string; count: number; active: boolean; color: string; onClick: () => void
}) {
  const s = CHIP_STYLES[color] ?? CHIP_STYLES.navy
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${active ? s.active : s.base}`}
    >
      {label}
      <span className={`rounded-full px-1.5 py-0.5 text-xs font-bold ${active ? 'bg-white/25' : 'bg-slate-100 text-slate-600'}`}>
        {count}
      </span>
    </button>
  )
}

// ─── consultant row ───────────────────────────────────────────────────────────

function statusBadge(stats: ConsultantStats) {
  if (stats.isOverDedicated)
    return <Badge variant="destructive" className="shrink-0 text-xs gap-1"><AlertTriangle size={10} /> Over-dedicated</Badge>
  if (stats.isRollingOff)
    return <Badge variant="warning" className="shrink-0 text-xs gap-1"><Clock size={10} /> Rolling off</Badge>
  if (stats.isAvailable)
    return <Badge variant="success" className="shrink-0 text-xs">Available now</Badge>
  return <Badge variant="secondary" className="shrink-0 text-xs">On project</Badge>
}

function DedicationBar({ value, max }: { value: number; max: number }) {
  const pct = Math.min((value / max) * 100, 100)
  const over = value > max
  return (
    <div className="w-20">
      <div className="flex justify-between text-xs mb-0.5">
        <span className={`font-semibold ${over ? 'text-red-600' : 'text-navy-800'}`}>{value}%</span>
        <span className="text-slate-400">/{max}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all ${over ? 'bg-red-500' : 'bg-navy-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function ConsultantRow({ stats, onClick, onRemoveVacation, onDeactivate, onSetAdminRole }: { stats: ConsultantStats; onClick: () => void; onRemoveVacation: (id: string) => void; onDeactivate: (id: string) => void; onSetAdminRole?: (id: string, role: 'hr_admin' | 'consultant') => void }) {
  const { consultant, totalDedication, maxDedication, projectsInfo, pastProjectsInfo } = stats
  const allProjects = [
    ...projectsInfo.map(p => ({ ...p, past: false as const })),
    ...pastProjectsInfo.map(p => ({ ...p, past: true as const })),
  ]
  return (
    <div
      onClick={onClick}
      className="flex flex-wrap items-start gap-3 rounded-lg border border-slate-100 bg-white p-3 hover:border-navy-200 hover:shadow-sm transition-all cursor-pointer md:flex-nowrap"
    >
      {/* Identity */}
      <div className="flex items-start gap-2.5 min-w-0 md:w-56 md:shrink-0">
        <Avatar className="h-9 w-9 shrink-0 mt-0.5">
          <AvatarFallback className="text-xs">{getInitials(consultant.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-sm font-medium text-navy-800 leading-tight">{consultant.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">{consultant.seniority}</p>
          {consultant.practice_area && (
            <p className="text-xs text-slate-400">{consultant.practice_area}</p>
          )}
        </div>
      </div>

      {/* Current + past assignments */}
      <div className="flex-1 min-w-0">
        {allProjects.length === 0 ? (
          <p className="text-xs text-slate-400 mt-1">No current assignments</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {allProjects.map((p, i) => {
              // Active: months from start → today. Past: total duration start → end.
              const refDate = p.past ? new Date(p.endDate + 'T00:00:00') : new Date()
              const months = Math.floor((refDate.getTime() - new Date(p.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
              const tenureColor = p.past
                ? 'bg-slate-100 text-slate-400 border-slate-200'
                : months > 12
                ? 'bg-red-100 text-red-700 border-red-200'
                : months >= 6
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-green-100 text-green-700 border-green-200'
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${
                    p.past
                      ? 'bg-slate-50 border-slate-200 text-slate-400'
                      : p.upcoming
                      ? 'bg-amber-50 border-amber-200 text-amber-700'
                      : 'bg-navy-50 border-navy-100 text-navy-700'
                  }`}
                >
                  <span className="font-medium">{p.dedication}%</span>
                  <span className={p.past ? 'text-slate-400' : p.upcoming ? 'text-amber-600' : 'text-navy-500'}>{p.name}</span>
                  <span className={p.past ? 'text-slate-300' : p.upcoming ? 'text-amber-400' : 'text-navy-300'}>
                    {p.upcoming ? `· desde ${formatDate(p.startDate)}` : `· ${formatDate(p.endDate)}`}
                  </span>
                  {!p.upcoming && (
                    <span className={`ml-0.5 rounded-full border px-1.5 py-px text-xs font-semibold ${tenureColor}`}>
                      {months}mo
                    </span>
                  )}
                </span>
              )
            })}
          </div>
        )}
        {/* Skills */}
        <div className="mt-1.5 flex flex-wrap gap-1">
          {consultant.skills.slice(0, 4).map((s) => (
            <span key={s} className="rounded bg-slate-50 px-1.5 py-0.5 text-xs text-slate-500 border border-slate-100">
              {s}
            </span>
          ))}
          {consultant.skills.length > 4 && (
            <span className="text-xs text-slate-400">+{consultant.skills.length - 4}</span>
          )}
        </div>
      </div>

      {/* Right: dedication bar + status + availability + chevron */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {statusBadge(stats)}
        {totalDedication > 0 && (
          <DedicationBar value={totalDedication} max={maxDedication} />
        )}
        {consultant.annual_dedication_pct !== undefined && (
          <p className="text-xs text-slate-400">
            Cargabilidad 2026:{' '}
            <span className={`font-semibold ${consultant.annual_dedication_pct > 80 ? 'text-bip-red' : 'text-navy-700'}`}>
              {consultant.annual_dedication_pct}%
            </span>
          </p>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (window.confirm(`¿Dar de baja a ${consultant.name}? Dejará de aparecer en la plataforma.`)) {
              onDeactivate(consultant.id)
            }
          }}
          className="mt-1 text-xs text-slate-300 hover:text-red-500 transition-colors"
          title="Dar de baja"
        >
          Dar de baja
        </button>
        {onSetAdminRole && (
          consultant.user_role === 'hr_admin' ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm(`¿Revocar acceso admin a ${consultant.name}?`)) {
                  onSetAdminRole(consultant.id, 'consultant')
                }
              }}
              className="mt-1 text-xs text-slate-300 hover:text-amber-500 transition-colors"
              title="Revocar acceso admin"
            >
              Revocar admin
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (window.confirm(`¿Otorgar acceso admin a ${consultant.name}?`)) {
                  onSetAdminRole(consultant.id, 'hr_admin')
                }
              }}
              className="mt-1 text-xs text-slate-300 hover:text-blue-500 transition-colors"
              title="Otorgar acceso admin"
            >
              Otorgar admin
            </button>
          )
        )}
        <p className="text-xs text-slate-400">
          {isAvailableNow(consultant.available_from)
            ? 'Available now'
            : consultant.available_from
            ? `Free ${formatDate(consultant.available_from)}`
            : '—'}
        </p>
        <ChevronRight size={14} className="text-slate-300 mt-1" />
      </div>
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────

interface PeopleTabProps {
  consultants: Profile[]
  projects: Project[]
  assignments: ProjectAssignment[]
  beachAssignments: BeachAssignment[]
  vacations: VacationRequest[]
  onAssignBeach: (consultantId: string, taskType: BeachTaskType, description: string, endDate: string) => void
  onRemoveBeach: (id: string) => void
  onAddVacation: (consultantId: string, startDate: string, endDate: string, note: string) => void
  onRemoveVacation: (id: string) => void
  onDeactivate: (consultantId: string) => void
  onSetAdminRole?: (consultantId: string, role: 'hr_admin' | 'consultant') => void
}

export default function PeopleTab({
  consultants, projects, assignments, beachAssignments, vacations,
  onAssignBeach, onRemoveBeach, onAddVacation, onRemoveVacation, onDeactivate, onSetAdminRole,
}: PeopleTabProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [beachTarget, setBeachTarget] = useState<Profile | null>(null)
  const [beachForm, setBeachForm] = useState<{ taskType: BeachTaskType; description: string; endDate: string }>({
    taskType: 'Propuesta',
    description: '',
    endDate: '',
  })
  const [vacationTarget, setVacationTarget] = useState<Profile | null>(null)
  const [vacationForm, setVacationForm] = useState({ startDate: '', endDate: '', note: '' })

  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 86400000)

  const stats: ConsultantStats[] = consultants
    .filter((c) => c.is_active)
    .map((c) => {
      const activeAssignments = assignments.filter((a) => {
        if (a.consultant_id !== c.id) return false
        // Respect the individual assignment window, not just the project end date.
        // Only count this person as active on the project if today falls within
        // their personal start→end window.
        if (a.end_date && new Date(a.end_date + 'T00:00:00') < today) return false
        if (a.start_date && new Date(a.start_date + 'T00:00:00') > today) return false
        const proj = projects.find((p) => p.id === a.project_id)
        return proj ? new Date(proj.end_date) >= today : false
      })

      const totalDedication = activeAssignments.reduce((sum, a) => sum + a.dedication_percentage, 0)
      const maxDedication = MAX_CARGABILITY[c.seniority] ?? 100

      const projectsInfo: ProjectInfo[] = activeAssignments
        .map((a) => {
          const proj = projects.find((p) => p.id === a.project_id)
          return proj
            ? {
                name: proj.name,
                dedication: a.dedication_percentage,
                endDate: a.end_date ?? proj.end_date,
                startDate: a.start_date ?? proj.start_date,
                past: false,
              }
            : null
        })
        .filter((x): x is NonNullable<typeof x> => x !== null)

      // Upcoming assignments: start date is in the future
      const upcomingProjectsInfo: ProjectInfo[] = assignments
        .filter((a) => {
          if (a.consultant_id !== c.id) return false
          if (!a.start_date || new Date(a.start_date + 'T00:00:00') <= today) return false
          if (a.end_date && new Date(a.end_date + 'T00:00:00') < today) return false
          const proj = projects.find((p) => p.id === a.project_id)
          return proj ? new Date(proj.end_date) >= today : false
        })
        .map((a) => {
          const proj = projects.find((p) => p.id === a.project_id)
          return proj
            ? {
                name: proj.name,
                dedication: a.dedication_percentage,
                endDate: a.end_date ?? proj.end_date,
                startDate: a.start_date ?? proj.start_date,
                past: false,
                upcoming: true,
              }
            : null
        })
        .filter((x): x is NonNullable<typeof x> => x !== null) as ProjectInfo[]

      // Past assignments: window has already ended (started but rolled off)
      const pastProjectsInfo: ProjectInfo[] = assignments
        .filter((a) => {
          if (a.consultant_id !== c.id) return false
          if (!a.end_date) return false
          if (new Date(a.end_date + 'T00:00:00') >= today) return false
          if (a.start_date && new Date(a.start_date + 'T00:00:00') > today) return false
          return true
        })
        .map((a) => {
          const proj = projects.find((p) => p.id === a.project_id)
          return proj
            ? {
                name: proj.name,
                dedication: a.dedication_percentage,
                endDate: a.end_date!,
                startDate: a.start_date ?? proj.start_date,
                past: true,
              }
            : null
        })
        .filter((x): x is ProjectInfo => x !== null)

      const isRollingOff = activeAssignments.some((a) => {
        const proj = projects.find((p) => p.id === a.project_id)
        if (!proj) return false
        const end = new Date(a.end_date ?? proj.end_date)
        return end >= today && end <= in30
      })

      const activeBeachTasks = beachAssignments.filter(
        (b) => b.consultant_id === c.id && new Date(b.end_date) >= today,
      )
      const pastBeachTasks = beachAssignments.filter(
        (b) => b.consultant_id === c.id && new Date(b.end_date) < today,
      )
      const pastVacations = vacations.filter(
        (v) => v.consultant_id === c.id && new Date(v.end_date) < today,
      )

      return {
        consultant: c,
        totalDedication,
        maxDedication,
        isOverDedicated: totalDedication > maxDedication,
        isAvailable: totalDedication === 0 && isAvailableNow(c.available_from),
        isRollingOff,
        isOnProject: totalDedication > 0,
        isOnBeach: totalDedication === 0,
        activeBeachTasks,
        pastBeachTasks,
        pastVacations,
        projectsInfo: [...projectsInfo, ...upcomingProjectsInfo],
        pastProjectsInfo,
      }
    })
    // Sort: over-dedicated first, then rolling off, then on project, then beach, then available
    .sort((a, b) => {
      const rank = (s: typeof a) =>
        s.isOverDedicated ? 0 : s.isRollingOff ? 1 : s.isOnProject ? 2 : s.activeBeachTasks.length > 0 ? 3 : 4
      return rank(a) - rank(b)
    })

  const counts = {
    all: stats.length,
    available: stats.filter((s) => s.isAvailable).length,
    on_project: stats.filter((s) => s.isOnProject).length,
    rolling_off: stats.filter((s) => s.isRollingOff).length,
    over_dedicated: stats.filter((s) => s.isOverDedicated).length,
  }

  const filtered = stats
    .filter((s) => {
      if (filter === 'available') return s.isAvailable
      if (filter === 'on_project') return s.isOnProject
      if (filter === 'rolling_off') return s.isRollingOff
      if (filter === 'over_dedicated') return s.isOverDedicated
      return true
    })
    .filter((s) => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        s.consultant.name.toLowerCase().includes(q) ||
        s.consultant.seniority.toLowerCase().includes(q) ||
        s.consultant.skills.some((sk) => sk.toLowerCase().includes(q)) ||
        (s.consultant.practice_area?.toLowerCase().includes(q) ?? false)
      )
    })

  const selectedConsultant = selectedId
    ? consultants.find(c => c.id === selectedId) ?? null
    : null

  function openBeachModal(consultant: Profile) {
    setBeachTarget(consultant)
    setBeachForm({ taskType: 'Propuesta', description: '', endDate: '' })
  }

  function submitBeachAssignment() {
    if (!beachTarget || !beachForm.description.trim() || !beachForm.endDate) return
    onAssignBeach(beachTarget.id, beachForm.taskType, beachForm.description.trim(), beachForm.endDate)
    setBeachTarget(null)
  }

  function openVacationModal(consultant: Profile) {
    setVacationTarget(consultant)
    setVacationForm({ startDate: '', endDate: '', note: '' })
  }

  function submitVacation() {
    if (!vacationTarget || !vacationForm.startDate || !vacationForm.endDate) return
    onAddVacation(vacationTarget.id, vacationForm.startDate, vacationForm.endDate, vacationForm.note)
    setVacationTarget(null)
  }

  return (
    <div>
      {/* Beach task assignment modal */}
      <Dialog open={!!beachTarget} onOpenChange={(v) => !v && setBeachTarget(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
            <Umbrella size={16} className="text-amber-500" />
            <h2 className="font-semibold text-navy-800 text-sm">Asignar Tarea — {beachTarget?.name}</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Tipo de tarea</label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-400"
                value={beachForm.taskType}
                onChange={(e) => setBeachForm((f) => ({ ...f, taskType: e.target.value as BeachTaskType }))}
              >
                {BEACH_TASK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Descripción</label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-400"
                placeholder="Ej: Propuesta Bancolombia — modelación financiera"
                value={beachForm.description}
                onChange={(e) => setBeachForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Fecha fin</label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-400"
                value={beachForm.endDate}
                onChange={(e) => setBeachForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 bg-slate-50">
            <Button variant="outline" size="sm" onClick={() => setBeachTarget(null)}>Cancelar</Button>
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white"
              disabled={!beachForm.description.trim() || !beachForm.endDate}
              onClick={submitBeachAssignment}
            >
              Asignar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vacation modal */}
      <Dialog open={!!vacationTarget} onOpenChange={(v) => !v && setVacationTarget(null)}>
        <DialogContent className="max-w-sm p-0 overflow-hidden">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-5 py-4">
            <CalendarOff size={16} className="text-blue-500" />
            <h2 className="font-semibold text-navy-800 text-sm">Agregar Vacación — {vacationTarget?.name}</h2>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Fecha inicio</label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-400"
                value={vacationForm.startDate}
                onChange={(e) => setVacationForm((f) => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Fecha fin</label>
              <input
                type="date"
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-400"
                value={vacationForm.endDate}
                onChange={(e) => setVacationForm((f) => ({ ...f, endDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Nota (opcional)</label>
              <input
                className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-navy-400"
                placeholder="Ej: Vacaciones de mitad de año"
                value={vacationForm.note}
                onChange={(e) => setVacationForm((f) => ({ ...f, note: e.target.value }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 bg-slate-50">
            <Button variant="outline" size="sm" onClick={() => setVacationTarget(null)}>Cancelar</Button>
            <Button
              size="sm"
              disabled={!vacationForm.startDate || !vacationForm.endDate}
              onClick={submitVacation}
            >
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* CV slide-in panel */}
      {selectedConsultant && (
        <div className="mb-5">
          <button
            onClick={() => setSelectedId(null)}
            className="mb-3 flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-800 transition-colors"
          >
            ← Back to people list
          </button>
          <ConsultantCV
            profile={selectedConsultant}
            assignments={assignments}
            projects={projects}
            readOnly
          />
        </div>
      )}

      {!selectedConsultant && <>
        {/* Filter chips */}
        <div className="mb-4 flex flex-wrap gap-2">
          <FilterChip label="All" count={counts.all} active={filter === 'all'} color="navy" onClick={() => setFilter('all')} />
          <FilterChip label="Available Now" count={counts.available} active={filter === 'available'} color="green" onClick={() => setFilter('available')} />
          <FilterChip label="On Project" count={counts.on_project} active={filter === 'on_project'} color="blue" onClick={() => setFilter('on_project')} />
          <FilterChip label="Rolling Off (30d)" count={counts.rolling_off} active={filter === 'rolling_off'} color="amber" onClick={() => setFilter('rolling_off')} />
          <FilterChip label="Over-dedicated" count={counts.over_dedicated} active={filter === 'over_dedicated'} color="red" onClick={() => setFilter('over_dedicated')} />
        </div>

        {/* Search */}
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <Search size={15} className="shrink-0 text-slate-400" />
          <input
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Search by name, seniority, skill, or practice area…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-xs text-slate-400 hover:text-slate-600">
              Clear
            </button>
          )}
        </div>

        {/* Hint */}
        <div className="mb-3 flex items-center gap-1.5 text-xs text-slate-400">
          <Info size={12} className="shrink-0" />
          <span>Haz click en el nombre para ver y descargar hoja de vida completa.</span>
        </div>

        {/* List */}
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.consultant.id}>
              <ConsultantRow stats={s} onClick={() => setSelectedId(s.consultant.id)} onRemoveVacation={onRemoveVacation} onDeactivate={onDeactivate} onSetAdminRole={onSetAdminRole} />
              {/* Beach tasks row */}
              {(s.activeBeachTasks.length > 0 || s.pastBeachTasks.length > 0 || s.isOnBeach) && (
                <div className="ml-12 -mt-1 mb-1 flex flex-wrap gap-1.5 px-3">
                  {/* Active beach tasks */}
                  {s.activeBeachTasks.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs text-amber-700"
                    >
                      <Umbrella size={10} />
                      <span className="font-medium">{b.task_type}</span>
                      <span className="text-amber-500">— {b.description}</span>
                      <span className="text-amber-400">· {formatDate(b.end_date)}</span>
                      <button
                        onClick={() => onRemoveBeach(b.id)}
                        className="ml-0.5 text-amber-400 hover:text-amber-600 transition-colors"
                        title="Eliminar tarea"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  {/* Past beach tasks */}
                  {s.pastBeachTasks.map((b) => (
                    <span
                      key={b.id}
                      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400"
                    >
                      <Umbrella size={10} />
                      <span>{b.task_type} — {b.description}</span>
                      <span>· {formatDate(b.end_date)}</span>
                      <span className="rounded-full bg-slate-200 px-1 text-slate-500 font-medium">pasada</span>
                      <button
                        onClick={() => onRemoveBeach(b.id)}
                        className="ml-0.5 text-slate-300 hover:text-slate-500 transition-colors"
                        title="Eliminar tarea"
                      >
                        <X size={10} />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => openBeachModal(s.consultant)}
                    className="inline-flex items-center gap-1 rounded-full border border-dashed border-amber-300 px-2 py-0.5 text-xs text-amber-500 hover:border-amber-400 hover:text-amber-600 transition-colors"
                  >
                    + Agregar tarea de playa
                  </button>
                </div>
              )}
              {/* Vacations row — active (blue) + past (gray) */}
              {(() => {
                const activeVacations = vacations.filter(v => v.consultant_id === s.consultant.id && new Date(v.end_date) >= today)
                const pastVacations   = s.pastVacations
                return (
                  <div className="ml-12 -mt-1 mb-1 flex flex-wrap gap-1.5 px-3 items-center">
                    {/* Active vacations */}
                    {activeVacations.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-xs text-blue-700"
                      >
                        <CalendarOff size={10} />
                        <span>{formatDate(v.start_date)} – {formatDate(v.end_date)}</span>
                        {v.note && <span className="text-blue-400">· {v.note}</span>}
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveVacation(v.id) }}
                          className="ml-0.5 text-blue-400 hover:text-blue-600 transition-colors"
                          title="Eliminar vacación"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    {/* Past vacations — same lighter style as past beach tasks */}
                    {pastVacations.map((v) => (
                      <span
                        key={v.id}
                        className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-400"
                      >
                        <CalendarOff size={10} />
                        <span>{formatDate(v.start_date)} – {formatDate(v.end_date)}</span>
                        {v.note && <span>· {v.note}</span>}
                        <span className="rounded-full bg-slate-200 px-1 font-medium text-slate-500">pasada</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); onRemoveVacation(v.id) }}
                          className="ml-0.5 text-slate-300 hover:text-slate-500 transition-colors"
                          title="Eliminar vacación"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={(e) => { e.stopPropagation(); openVacationModal(s.consultant) }}
                      className="inline-flex items-center gap-1 rounded-full border border-dashed border-blue-200 px-2 py-0.5 text-xs text-blue-400 hover:border-blue-400 hover:text-blue-600 transition-colors"
                    >
                      + Vacaciones
                    </button>
                  </div>
                )
              })()}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-400">
              No consultants match the current filter.
            </div>
          )}
        </div>
      </>}
    </div>
  )
}
