import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Heart,
  CheckCircle, XCircle, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react'
import Layout from '@/components/Layout'
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
import { matchConsultants, findReplacements } from '@/lib/matching'
import { MAX_CARGABILITY } from '@/lib/constants'
import { getInitials, formatDate, isAvailableNow } from '@/lib/utils'
import PeopleTab from '@/components/PeopleTab'
import AutoStaffingPlan from '@/components/AutoStaffingPlan'
import type { Profile, Project, VacationRequest, ProjectAssignment } from '@/lib/types'

// ─── helpers ────────────────────────────────────────────────────────────────

function projectStatusVariant(status: string): 'open' | 'partial' | 'full' | 'active' {
  if (status === 'Open') return 'open'
  if (status === 'Partially Staffed') return 'partial'
  if (status === 'Fully Staffed') return 'full'
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
  const derivedStatus = project.status === 'Active'
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
        {derivedStatus === 'Active'
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
}: AssignedMemberRowProps) {
  const isOver = totalDedication > maxDedication
  const showingReplacements = replacementsFor === consultant.id

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
            Until {formatDate(assignment.end_date ?? project.end_date)}
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

// ─── main component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [projects, setProjects] = useState(mockProjects)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [assignments, setAssignments] = useState<ProjectAssignment[]>(mockAssignments)
  const [vacations, setVacations] = useState<VacationRequest[]>(mockVacationRequests)
  const [search, setSearch] = useState('')
  const [replacementsFor, setReplacementsFor] = useState<string | null>(null)
  const today = new Date()
  const in30 = new Date(today.getTime() + 30 * 86400000)

  const visibleProjects = projects.filter((p) => new Date(p.end_date) >= today)
  const upcomingProjects = visibleProjects.filter((p) => p.status !== 'Active')
  const activeProjects = visibleProjects.filter((p) => p.status === 'Active')

  const filteredConsultants = mockConsultants.filter(
    (c) =>
      c.is_active &&
      (c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(search.toLowerCase()))),
  )

  const pendingVacations = vacations.filter((v) => v.status === 'Pending')

  const isActiveProject = selectedProject?.status === 'Active'

  const matchResults =
    selectedProject && !isActiveProject
      ? matchConsultants(selectedProject, mockConsultants, mockLikes, vacations, assignments)
      : []

  const assignedToSelected = assignments.filter((a) => a.project_id === selectedProject?.id)
  const assignedIds = assignedToSelected.map((a) => a.consultant_id)

  const assignedConsultants = assignedIds
    .map((id) => ({
      consultant: mockConsultants.find((c) => c.id === id)!,
      assignment: assignedToSelected.find((a) => a.consultant_id === id)!,
    }))
    .filter((x) => x.consultant)

  function handleAssign(consultantId: string, projectId: string) {
    const project = mockProjects.find((p) => p.id === projectId)
    setAssignments((prev) => [
      ...prev,
      {
        id: `a${Date.now()}`,
        project_id: projectId,
        consultant_id: consultantId,
        dedication_percentage: 100,
        end_date: project?.end_date ?? null,
        assigned_at: new Date().toISOString(),
      },
    ])
  }

  function handleVacation(id: string, status: 'Approved' | 'Rejected') {
    setVacations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status, reviewed_at: new Date().toISOString() } : v)),
    )
  }

  function toggleReplacements(consultantId: string) {
    setReplacementsFor((prev) => (prev === consultantId ? null : consultantId))
  }

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-navy-800">Staffing Dashboard</h1>
        <p className="text-sm text-slate-500">Manage your consulting team and projects</p>
      </div>

      <Tabs defaultValue="projects">
        <TabsList>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="people">People</TabsTrigger>
          <TabsTrigger value="timeoff">
            Time Off
            {pendingVacations.length > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-bip-red text-xs text-white">
                {pendingVacations.length}
              </span>
            )}
          </TabsTrigger>
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
            </div>

            {/* Right panel */}
            <div className="lg:col-span-2">
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
                      <Link
                        to={`/project/${selectedProject.id}`}
                        className="text-xs text-navy-600 hover:underline"
                      >
                        Details →
                      </Link>
                    </div>
                  </div>

                  {isActiveProject ? (
                    /* ── Active project: team + over-dedication ── */
                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Assigned Team ({assignedConsultants.length})
                        </p>
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
                      {assignedConsultants.length === 0 ? (
                        <p className="text-sm text-slate-400">No assignments recorded.</p>
                      ) : (
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
                              />
                            )
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* ── Upcoming project: match suggestions ── */
                    <div>
                      <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                        AI Match Suggestions
                      </p>
                      {matchResults.length === 0 ? (
                        <p className="text-sm text-slate-400">No consultants scored above 0.</p>
                      ) : (
                        <div className="space-y-3">
                          {matchResults.map((result) => {
                            const alreadyAssigned = assignedIds.includes(result.consultant.id)
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
                                    {result.hasLiked && (
                                      <Heart size={13} className="fill-bip-red text-bip-red" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500">{result.reason}</p>
                                  {result.vacationWarning && (
                                    <p className="mt-0.5 text-xs text-amber-600">⚠ {result.vacationWarning}</p>
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
                  )}
                </div>
              ) : (
                <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white">
                  <p className="text-sm text-slate-400">Select a project to see details</p>
                </div>
              )}

              {/* Consultant directory */}
              <div className="mt-4 rounded-lg border border-slate-200 bg-white p-5">
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
              </div>
            </div>
          </div>
        </TabsContent>

        {/* People tab */}
        <TabsContent value="people">
          <PeopleTab assignments={assignments} />
        </TabsContent>

        {/* Time Off tab */}
        <TabsContent value="timeoff">
          <div className="space-y-6">
            {pendingVacations.length > 0 && (
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Pending Requests ({pendingVacations.length})
                </p>
                <div className="space-y-3">
                  {pendingVacations.map((v) => {
                    const consultant = mockConsultants.find((c) => c.id === v.consultant_id)
                    return (
                      <Card key={v.id}>
                        <CardContent className="flex items-center justify-between p-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">
                                {getInitials(consultant?.name ?? '?')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-navy-800">{consultant?.name}</p>
                              <p className="text-sm text-slate-500">
                                {formatDate(v.start_date)} – {formatDate(v.end_date)}
                              </p>
                              {v.note && <p className="text-xs text-slate-400">{v.note}</p>}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 border-green-200 text-green-700 hover:bg-green-50"
                              onClick={() => handleVacation(v.id, 'Approved')}
                            >
                              <CheckCircle size={14} /> Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                              onClick={() => handleVacation(v.id, 'Rejected')}
                            >
                              <XCircle size={14} /> Reject
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )}

            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                All Time Off Requests
              </p>
              <div className="overflow-hidden rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-600">Consultant</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-600">Dates</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-600">Note</th>
                      <th className="px-4 py-2.5 text-left font-medium text-slate-600">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vacations.map((v) => {
                      const c = mockConsultants.find((c) => c.id === v.consultant_id)
                      return (
                        <tr key={v.id} className="bg-white">
                          <td className="px-4 py-3">{c?.name ?? '—'}</td>
                          <td className="px-4 py-3 text-slate-600">
                            {formatDate(v.start_date)} – {formatDate(v.end_date)}
                          </td>
                          <td className="px-4 py-3 text-slate-400">{v.note ?? '—'}</td>
                          <td className="px-4 py-3">
                            <Badge
                              variant={
                                v.status === 'Approved' ? 'success'
                                : v.status === 'Rejected' ? 'destructive'
                                : 'pending'
                              }
                            >
                              {v.status}
                            </Badge>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Staffing Plan tab */}
        <TabsContent value="staffing">
          <AutoStaffingPlan
            projects={visibleProjects}
            consultants={mockConsultants}
            assignments={assignments}
            vacations={vacations}
            likes={mockLikes}
            onApply={(newAssignments) =>
              setAssignments((prev) => [...prev, ...newAssignments])
            }
          />
        </TabsContent>
      </Tabs>
    </Layout>
  )
}
