import { useState } from 'react'
import { Zap, Check, X, AlertTriangle, Heart, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { matchConsultantsForPosition } from '@/lib/matching'
import { getInitials, formatDate } from '@/lib/utils'
import type {
  Profile,
  Position,
  Project,
  ProjectAssignment,
  VacationRequest,
  ProjectLike,
  MatchResult,
} from '@/lib/types'

interface PositionSuggestion {
  position: Position
  suggestions: MatchResult[]
}

interface ProjectPlan {
  project: Project
  positions: PositionSuggestion[]
}

interface AutoStaffingPlanProps {
  projects: Project[]
  consultants: Profile[]
  assignments: ProjectAssignment[]
  vacations: VacationRequest[]
  likes: ProjectLike[]
  onApply: (newAssignments: ProjectAssignment[]) => void
}

export default function AutoStaffingPlan({
  projects,
  consultants,
  assignments,
  vacations,
  likes,
  onApply,
}: AutoStaffingPlanProps) {
  const [horizon, setHorizon] = useState<30 | 60 | 90>(30)
  const [plan, setPlan] = useState<ProjectPlan[] | null>(null)
  // accepted: "projectId:positionId" -> consultantId
  const [accepted, setAccepted] = useState<Map<string, string>>(new Map())
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const today = new Date()

  const previewProjects = projects.filter(
    (p) =>
      p.status !== 'Active' &&
      p.status !== 'Fully Staffed' &&
      new Date(p.start_date) <= new Date(today.getTime() + horizon * 86400000) &&
      new Date(p.end_date) >= today,
  )

  function generatePlan() {
    const claimedIds = new Set<string>()
    const alreadyAssignedIds = new Set(assignments.map((a) => a.consultant_id))

    const projectPlans: ProjectPlan[] = previewProjects.map((project) => {
      const positionsToFill = project.positions ?? []

      const positionSuggestions: PositionSuggestion[] = positionsToFill.map((position) => {
        const available = consultants.filter(
          (c) => c.is_active && !alreadyAssignedIds.has(c.id) && !claimedIds.has(c.id),
        )
        const results = matchConsultantsForPosition(
          position, project, available, likes, vacations, assignments,
        ).slice(0, 3)

        // Claim the top pick so it won't appear in later positions
        if (results[0]) claimedIds.add(results[0].consultant.id)

        return { position, suggestions: results }
      })

      return { project, positions: positionSuggestions }
    })

    setPlan(projectPlans)

    // Pre-accept the top suggestion for each position
    const initial = new Map<string, string>()
    projectPlans.forEach(({ project, positions }) => {
      positions.forEach(({ position, suggestions }) => {
        if (suggestions[0]) {
          initial.set(`${project.id}:${position.id}`, suggestions[0].consultant.id)
        }
      })
    })
    setAccepted(initial)
    setExpanded(new Set())
  }

  function selectConsultant(projectId: string, positionId: string, consultantId: string) {
    const key = `${projectId}:${positionId}`
    setAccepted((prev) => {
      const next = new Map(prev)
      if (next.get(key) === consultantId) next.delete(key)
      else next.set(key, consultantId)
      return next
    })
  }

  function toggleExpand(key: string) {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function applyPlan() {
    if (!plan) return
    const newAssignments: ProjectAssignment[] = []
    plan.forEach(({ project, positions }) => {
      positions.forEach(({ position }) => {
        const consultantId = accepted.get(`${project.id}:${position.id}`)
        if (consultantId) {
          newAssignments.push({
            id: `auto-${Date.now()}-${position.id}`,
            project_id: project.id,
            consultant_id: consultantId,
            dedication_percentage: 100,
            end_date: project.end_date,
            assigned_at: new Date().toISOString(),
          })
        }
      })
    })
    onApply(newAssignments)
    setPlan(null)
    setAccepted(new Map())
  }

  const acceptedCount = accepted.size

  if (!plan) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy-800">
            <Zap size={24} className="text-white" />
          </div>
          <h3 className="text-lg font-semibold text-navy-800">Auto-Staff Open Projects</h3>
          <p className="mt-1 text-sm text-slate-500">
            Generate the best staffing plan for all open projects starting in the next
          </p>
          <div className="mt-4 flex justify-center gap-2">
            {([30, 60, 90] as const).map((d) => (
              <button
                key={d}
                onClick={() => setHorizon(d)}
                className={`rounded-full px-5 py-1.5 text-sm font-medium transition ${
                  horizon === d
                    ? 'bg-navy-800 text-white'
                    : 'border border-slate-200 text-slate-600 hover:border-navy-800'
                }`}
              >
                {d} days
              </button>
            ))}
          </div>
        </div>

        {/* Project preview */}
        <div className="mb-6">
          {previewProjects.length === 0 ? (
            <p className="text-center text-sm text-slate-400">
              No open projects starting in the next {horizon} days.
            </p>
          ) : (
            <>
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                {previewProjects.length} project{previewProjects.length !== 1 ? 's' : ''} to staff
              </p>
              <div className="space-y-2">
                {previewProjects.map((p) => {
                  const assigned = assignments.filter((a) => a.project_id === p.id).length
                  const slots = Math.max(0, p.team_size - assigned)
                  const key = `preview-${p.id}`
                  const isExpanded = expanded.has(key)
                  return (
                    <div
                      key={p.id}
                      className="rounded-md border border-slate-100 bg-slate-50"
                    >
                      <button
                        onClick={() => toggleExpand(key)}
                        className="flex w-full items-start justify-between gap-2 px-3 py-2.5 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-navy-800">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            {p.client} · starts {formatDate(p.start_date)}
                          </p>
                          <p className="mt-0.5 text-xs text-slate-400 italic">{p.description}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <Badge variant={p.status === 'Partially Staffed' ? 'partial' : 'open'} className="text-xs">
                            {p.status}
                          </Badge>
                          <p className="text-xs text-slate-400">{slots} slot{slots !== 1 ? 's' : ''} open</p>
                          {isExpanded ? <ChevronUp size={13} className="text-slate-400" /> : <ChevronDown size={13} className="text-slate-400" />}
                        </div>
                      </button>

                      {isExpanded && p.positions && (
                        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
                          <p className="mb-2 text-xs font-medium text-slate-500">Positions to fill:</p>
                          <div className="space-y-2">
                            {p.positions.map((pos) => (
                              <div key={pos.id} className="rounded-md bg-white border border-slate-100 px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold text-navy-800">{pos.role}</p>
                                  <span className="text-xs text-slate-500 shrink-0">{pos.seniority}</span>
                                </div>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {pos.skills.map((s) => (
                                    <span
                                      key={s}
                                      className="rounded-full bg-navy-800/10 px-2 py-0.5 text-xs text-navy-800"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="flex justify-center">
          <Button onClick={generatePlan} disabled={previewProjects.length === 0} className="gap-2">
            <Zap size={15} /> Generate Plan
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-navy-800">Staffing Plan — Next {horizon} Days</h3>
          <p className="text-sm text-slate-500">
            {plan.length} project{plan.length !== 1 ? 's' : ''} · {acceptedCount} position{acceptedCount !== 1 ? 's' : ''} assigned
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPlan(null)}>Regenerate</Button>
          <Button size="sm" onClick={applyPlan} disabled={acceptedCount === 0} className="gap-1.5">
            <Check size={14} /> Apply {acceptedCount} Assignment{acceptedCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      {plan.map(({ project, positions }) => (
        <div key={project.id} className="rounded-lg border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <p className="font-medium text-navy-800">{project.name}</p>
            <p className="text-xs text-slate-500">
              {project.client} · {formatDate(project.start_date)} – {formatDate(project.end_date)}
            </p>
          </div>

          <div className="space-y-3">
            {positions.map(({ position, suggestions }) => {
              const selectedId = accepted.get(`${project.id}:${position.id}`)
              const isExpanded = expanded.has(`${project.id}:${position.id}`)

              return (
                <div key={position.id} className="rounded-md border border-slate-100">
                  {/* Position header */}
                  <div className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-t-md">
                    <div>
                      <span className="text-xs font-semibold text-navy-800">{position.role}</span>
                      <span className="ml-2 text-xs text-slate-500">{position.seniority}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {position.skills.map((s) => (
                          <span key={s} className="rounded-full bg-navy-800/10 px-2 py-0.5 text-xs text-navy-800">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Suggestions */}
                  <div className="divide-y divide-slate-50 px-3 pb-2 pt-1">
                    {suggestions.length === 0 ? (
                      <p className="py-2 text-xs text-slate-400">No available consultants matched this position.</p>
                    ) : (
                      <>
                        {(isExpanded ? suggestions : suggestions.slice(0, 1)).map((result) => {
                          const isSelected = selectedId === result.consultant.id
                          return (
                            <div
                              key={result.consultant.id}
                              className={`flex items-center gap-3 py-2 transition ${
                                isSelected ? 'opacity-100' : 'opacity-50'
                              }`}
                            >
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="text-xs">
                                  {getInitials(result.consultant.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-medium text-navy-800">{result.consultant.name}</p>
                                  {result.hasLiked && <Heart size={11} className="fill-bip-red text-bip-red" />}
                                  {result.isStretch && (
                                    <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                                      Best available
                                    </span>
                                  )}
                                </div>
                                <p className="truncate text-xs text-slate-500">{result.reason}</p>
                                {result.vacationWarning && (
                                  <p className="flex items-center gap-1 text-xs text-amber-600">
                                    <AlertTriangle size={10} /> {result.vacationWarning}
                                  </p>
                                )}
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-sm font-bold text-navy-800">{result.score}</span>
                                <button
                                  onClick={() => selectConsultant(project.id, position.id, result.consultant.id)}
                                  className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                                    isSelected
                                      ? 'bg-green-600 text-white hover:bg-red-500'
                                      : 'border border-slate-200 text-slate-400 hover:border-green-600 hover:text-green-600'
                                  }`}
                                >
                                  {isSelected ? <Check size={13} /> : <X size={13} />}
                                </button>
                              </div>
                            </div>
                          )
                        })}
                        {suggestions.length > 1 && (
                          <button
                            onClick={() => toggleExpand(`${project.id}:${position.id}`)}
                            className="flex w-full items-center gap-1 pt-1 text-xs text-slate-400 hover:text-navy-800"
                          >
                            {isExpanded ? (
                              <><ChevronUp size={12} /> Show less</>
                            ) : (
                              <><ChevronDown size={12} /> {suggestions.length - 1} more option{suggestions.length - 1 !== 1 ? 's' : ''}</>
                            )}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {plan.length > 0 && (
        <div className="flex justify-end pt-1">
          <Button onClick={applyPlan} disabled={acceptedCount === 0} className="gap-1.5">
            <Check size={14} /> Apply {acceptedCount} Assignment{acceptedCount !== 1 ? 's' : ''}
          </Button>
        </div>
      )}
    </div>
  )
}
