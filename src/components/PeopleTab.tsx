import { useState } from 'react'
import { Search, AlertTriangle, Clock, ChevronRight } from 'lucide-react'
import { mockConsultants, mockProjects } from '@/lib/mockData'
import { MAX_CARGABILITY } from '@/lib/constants'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import ConsultantCV from '@/components/ConsultantCV'
import { getInitials, formatDate, isAvailableNow } from '@/lib/utils'
import type { Profile, ProjectAssignment } from '@/lib/types'

type FilterKey = 'all' | 'available' | 'on_project' | 'rolling_off' | 'over_dedicated'

interface ProjectInfo {
  name: string
  dedication: number
  endDate: string
  assignedAt: string
}

interface ConsultantStats {
  consultant: Profile
  totalDedication: number
  maxDedication: number
  isOverDedicated: boolean
  isAvailable: boolean
  isRollingOff: boolean
  isOnProject: boolean
  projectsInfo: ProjectInfo[]
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

function ConsultantRow({ stats, onClick }: { stats: ConsultantStats; onClick: () => void }) {
  const { consultant, totalDedication, maxDedication, projectsInfo } = stats
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

      {/* Current assignments */}
      <div className="flex-1 min-w-0">
        {projectsInfo.length === 0 ? (
          <p className="text-xs text-slate-400 mt-1">No current assignments</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {projectsInfo.map((p, i) => {
              const months = Math.floor((Date.now() - new Date(p.assignedAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
              const tenureColor = months > 12
                ? 'bg-red-100 text-red-700 border-red-200'
                : months >= 6
                ? 'bg-amber-100 text-amber-700 border-amber-200'
                : 'bg-green-100 text-green-700 border-green-200'
              return (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 rounded-full bg-navy-50 border border-navy-100 px-2 py-0.5 text-xs text-navy-700"
                >
                  <span className="font-medium">{p.dedication}%</span>
                  <span className="text-navy-500">{p.name}</span>
                  <span className="text-navy-300">· {formatDate(p.endDate)}</span>
                  <span className={`ml-0.5 rounded-full border px-1.5 py-px text-xs font-semibold ${tenureColor}`}>
                    {months}mo
                  </span>
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
  assignments: ProjectAssignment[]
}

export default function PeopleTab({ assignments }: PeopleTabProps) {
  const [filter, setFilter] = useState<FilterKey>('all')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 86400000)

  const stats: ConsultantStats[] = mockConsultants
    .filter((c) => c.is_active)
    .map((c) => {
      const activeAssignments = assignments.filter((a) => {
        if (a.consultant_id !== c.id) return false
        const proj = mockProjects.find((p) => p.id === a.project_id)
        return proj ? new Date(proj.end_date) >= today : false
      })

      const totalDedication = activeAssignments.reduce((sum, a) => sum + a.dedication_percentage, 0)
      const maxDedication = MAX_CARGABILITY[c.seniority] ?? 100

      const projectsInfo: ProjectInfo[] = activeAssignments
        .map((a) => {
          const proj = mockProjects.find((p) => p.id === a.project_id)
          return proj
            ? { name: proj.name, dedication: a.dedication_percentage, endDate: a.end_date ?? proj.end_date, assignedAt: a.assigned_at }
            : null
        })
        .filter((x): x is ProjectInfo => x !== null)

      const isRollingOff = activeAssignments.some((a) => {
        const proj = mockProjects.find((p) => p.id === a.project_id)
        if (!proj) return false
        const end = new Date(a.end_date ?? proj.end_date)
        return end >= today && end <= in30
      })

      return {
        consultant: c,
        totalDedication,
        maxDedication,
        isOverDedicated: totalDedication > maxDedication,
        isAvailable: totalDedication === 0 && isAvailableNow(c.available_from),
        isRollingOff,
        isOnProject: totalDedication > 0,
        projectsInfo,
      }
    })
    // Sort: over-dedicated first, then rolling off, then on project, then available
    .sort((a, b) => {
      const rank = (s: ConsultantStats) =>
        s.isOverDedicated ? 0 : s.isRollingOff ? 1 : s.isOnProject ? 2 : 3
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
    ? mockConsultants.find(c => c.id === selectedId) ?? null
    : null

  return (
    <div>
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
            projects={mockProjects}
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

        {/* List */}
        <div className="space-y-2">
          {filtered.map((s) => (
            <ConsultantRow key={s.consultant.id} stats={s} onClick={() => setSelectedId(s.consultant.id)} />
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
