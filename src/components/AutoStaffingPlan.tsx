import { useState } from 'react'
import { Zap, Check, X, AlertTriangle, Heart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { matchConsultants } from '@/lib/matching'
import { getInitials, formatDate } from '@/lib/utils'
import type {
  Profile,
  Project,
  ProjectAssignment,
  VacationRequest,
  ProjectLike,
  MatchResult,
} from '@/lib/types'

interface ProjectSuggestion {
  project: Project
  slotsNeeded: number
  suggestions: MatchResult[]
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
  const [plan, setPlan] = useState<ProjectSuggestion[] | null>(null)
  const [accepted, setAccepted] = useState<Set<string>>(new Set())

  const today = new Date()

  function generatePlan() {
    const horizonDate = new Date(today.getTime() + horizon * 86400000)

    const openProjects = projects.filter(
      (p) =>
        p.status !== 'Active' &&
        p.status !== 'Fully Staffed' &&
        new Date(p.start_date) <= horizonDate &&
        new Date(p.end_date) >= today,
    )

    const alreadyAssignedIds = new Set(assignments.map((a) => a.consultant_id))
    const claimedIds = new Set<string>()

    const suggestions: ProjectSuggestion[] = openProjects.map((project) => {
      const assignedToProject = assignments.filter((a) => a.project_id === project.id).length
      const slotsNeeded = Math.max(0, project.team_size - assignedToProject)

      const available = consultants.filter(
        (c) => c.is_active && !alreadyAssignedIds.has(c.id) && !claimedIds.has(c.id),
      )

      const results = matchConsultants(project, available, likes, vacations, assignments)
      const top3 = results.slice(0, 3)
      top3.forEach((r) => claimedIds.add(r.consultant.id))

      return { project, slotsNeeded, suggestions: top3 }
    })

    setPlan(suggestions)

    const initialAccepted = new Set<string>()
    suggestions.forEach(({ project, suggestions: s }) => {
      if (s[0]) initialAccepted.add(`${project.id}:${s[0].consultant.id}`)
    })
    setAccepted(initialAccepted)
  }

  function toggle(projectId: string, consultantId: string) {
    const key = `${projectId}:${consultantId}`
    setAccepted((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  function applyPlan() {
    if (!plan) return
    const newAssignments: ProjectAssignment[] = []
    plan.forEach(({ project, suggestions }) => {
      suggestions.forEach(({ consultant }) => {
        if (accepted.has(`${project.id}:${consultant.id}`)) {
          newAssignments.push({
            id: `auto-${Date.now()}-${consultant.id}`,
            project_id: project.id,
            consultant_id: consultant.id,
            dedication_percentage: 100,
            end_date: project.end_date,
            assigned_at: new Date().toISOString(),
          })
        }
      })
    })
    onApply(newAssignments)
    setPlan(null)
    setAccepted(new Set())
  }

  const acceptedCount = accepted.size

  const previewProjects = projects.filter(
    (p) =>
      p.status !== 'Active' &&
      p.status !== 'Fully Staffed' &&
      new Date(p.start_date) <= new Date(today.getTime() + horizon * 86400000) &&
      new Date(p.end_date) >= today,
  )

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
                  return (
                    <div
                      key={p.id}
                      className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-navy-800">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            {p.client} · starts {formatDate(p.start_date)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <Badge variant={p.status === 'Partially Staffed' ? 'partial' : 'open'} className="text-xs">
                            {p.status}
                          </Badge>
                          <p className="mt-0.5 text-xs text-slate-400">{slots} slot{slots !== 1 ? 's' : ''} open</p>
                        </div>
                      </div>
                      <p className="mt-1 text-xs text-slate-500 italic">{p.description}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {p.skills_required.map((s) => (
                          <span
                            key={s}
                            className="rounded-full bg-navy-800/10 px-2 py-0.5 text-xs text-navy-800"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
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
            {plan.length} project{plan.length !== 1 ? 's' : ''} · {acceptedCount} assignment{acceptedCount !== 1 ? 's' : ''} selected
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setPlan(null)}>
            Regenerate
          </Button>
          <Button size="sm" onClick={applyPlan} disabled={acceptedCount === 0} className="gap-1.5">
            <Check size={14} /> Apply {acceptedCount} Assignment{acceptedCount !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>

      {plan.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-8 text-center">
          <p className="text-slate-500">No open projects starting in the next {horizon} days.</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={() => setPlan(null)}>
            Try a longer horizon
          </Button>
        </div>
      ) : (
        plan.map(({ project, slotsNeeded, suggestions }) => (
          <div key={project.id} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-navy-800">{project.name}</p>
                <p className="text-xs text-slate-500">
                  {project.client} · {formatDate(project.start_date)} – {formatDate(project.end_date)}
                </p>
              </div>
              <Badge variant="open" className="shrink-0 text-xs">
                {slotsNeeded} slot{slotsNeeded !== 1 ? 's' : ''} open
              </Badge>
            </div>

            {suggestions.length === 0 ? (
              <p className="text-xs text-slate-400">No available consultants matched this project.</p>
            ) : (
              <div className="space-y-2">
                {suggestions.map((result) => {
                  const key = `${project.id}:${result.consultant.id}`
                  const isAccepted = accepted.has(key)
                  return (
                    <div
                      key={result.consultant.id}
                      className={`flex items-center gap-3 rounded-md border p-2.5 transition ${
                        isAccepted
                          ? 'border-green-200 bg-green-50'
                          : 'border-slate-100 bg-white opacity-60'
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
                          {result.hasLiked && (
                            <Heart size={11} className="fill-bip-red text-bip-red" />
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
                          onClick={() => toggle(project.id, result.consultant.id)}
                          className={`flex h-7 w-7 items-center justify-center rounded-full transition ${
                            isAccepted
                              ? 'bg-green-600 text-white hover:bg-red-500'
                              : 'border border-slate-200 text-slate-400 hover:border-green-600 hover:text-green-600'
                          }`}
                          title={isAccepted ? 'Remove from plan' : 'Add to plan'}
                        >
                          {isAccepted ? <Check size={13} /> : <X size={13} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ))
      )}

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
