import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Users, Calendar, UserPlus, X, Search } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { mockProjects, mockConsultants, mockAssignments, mockLikes, mockVacationRequests } from '@/lib/mockData'
import { matchConsultants } from '@/lib/matching'
import { getInitials, formatDate } from '@/lib/utils'
import type { ProjectAssignment } from '@/lib/types'

function statusVariant(status: string) {
  if (status === 'Open') return 'open'
  if (status === 'Partially Staffed') return 'partial'
  return 'full'
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()

  const [assignments, setAssignments] = useState<ProjectAssignment[]>(mockAssignments)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addSearch, setAddSearch] = useState('')
  const [addDedication, setAddDedication] = useState(100)

  const project = mockProjects.find((p) => p.id === id)

  if (!project) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-slate-500">Project not found.</p>
          <Link to={profile?.user_role === 'hr_admin' ? '/admin' : '/employee'} className="mt-2 text-sm text-navy-600 hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </Layout>
    )
  }

  const isActiveProject = project.status === 'Active' || project.status === 'Fully Staffed'
  const isHR = profile?.user_role === 'hr_admin'

  const assignedIds = assignments.filter((a) => a.project_id === project.id).map((a) => a.consultant_id)
  const assignedConsultants = mockConsultants.filter((c) => assignedIds.includes(c.id))

  const interestedConsultants = mockConsultants.filter((c) =>
    mockLikes.some((l) => l.project_id === project.id && l.consultant_id === c.id),
  )
  const matchResults = isActiveProject
    ? []
    : matchConsultants(project, mockConsultants, mockLikes, mockVacationRequests, assignments)

  // Candidates for manual add: active consultants not already on the project
  const addCandidates = mockConsultants.filter(
    (c) =>
      c.is_active &&
      !assignedIds.includes(c.id) &&
      (addSearch === '' ||
        c.name.toLowerCase().includes(addSearch.toLowerCase()) ||
        c.role_title.toLowerCase().includes(addSearch.toLowerCase()) ||
        c.skills.some((s) => s.toLowerCase().includes(addSearch.toLowerCase()))),
  )

  function handleAddConsultant(consultantId: string) {
    setAssignments((prev) => [
      ...prev,
      {
        id: `manual-${Date.now()}`,
        project_id: project!.id,
        consultant_id: consultantId,
        dedication_percentage: addDedication,
        assigned_at: new Date().toISOString(),
        end_date: project!.end_date,
      },
    ])
    setShowAddModal(false)
    setAddSearch('')
    setAddDedication(100)
  }

  function handleRemoveConsultant(consultantId: string) {
    setAssignments((prev) =>
      prev.filter((a) => !(a.project_id === project!.id && a.consultant_id === consultantId)),
    )
  }

  return (
    <Layout>
      {/* Add Person modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-20 overflow-y-auto">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="text-sm font-semibold text-navy-800">Agregar persona al proyecto</h2>
              <button onClick={() => { setShowAddModal(false); setAddSearch('') }} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Dedication */}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Dedicación (%)</label>
                <Input
                  type="number"
                  min={10}
                  max={100}
                  step={10}
                  value={addDedication}
                  onChange={(e) => setAddDedication(Number(e.target.value))}
                  className="h-8 text-sm w-28"
                />
              </div>
              {/* Search */}
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
              {/* Candidate list */}
              <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                {addCandidates.length === 0 ? (
                  <p className="text-center text-sm text-slate-400 py-6">No se encontraron consultores disponibles.</p>
                ) : (
                  addCandidates.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleAddConsultant(c.id)}
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
      )}

      <div className="mb-5">
        <Link
          to={isHR ? '/admin' : '/employee'}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-800"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
      </div>

      <div className={`grid gap-6 ${!isActiveProject && isHR ? 'lg:grid-cols-3' : ''}`}>
        {/* Project info + team */}
        <div className={`space-y-5 ${!isActiveProject && isHR ? 'lg:col-span-2' : ''}`}>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-navy-800">{project.name}</h1>
                  <p className="mt-0.5 text-slate-500">{project.client} · {project.industry}</p>
                </div>
                <Badge variant={statusVariant(project.status)}>{project.status}</Badge>
              </div>

              <p className="mt-4 text-sm text-slate-600">{project.description}</p>

              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs font-medium text-slate-400">Start Date</p>
                  <p className="text-sm font-medium text-navy-800">{formatDate(project.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">End Date</p>
                  <p className="text-sm font-medium text-navy-800">{formatDate(project.end_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-400">Team Size</p>
                  <p className="text-sm font-medium text-navy-800">{assignedConsultants.length}/{project.team_size}</p>
                </div>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-slate-400 mb-1.5">Required Skills</p>
                <div className="flex flex-wrap gap-1.5">
                  {project.skills_required.map((s) => (
                    <span key={s} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600">{s}</span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned team */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users size={15} className="text-bip-red" /> Equipo asignado ({assignedConsultants.length}/{project.team_size})
                </CardTitle>
                {isHR && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 gap-1.5 text-xs"
                    onClick={() => setShowAddModal(true)}
                  >
                    <UserPlus size={13} /> Agregar persona
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assignedConsultants.length === 0 ? (
                <p className="text-sm text-slate-400">No hay consultores asignados.</p>
              ) : (
                <div className="space-y-3">
                  {assignedConsultants.map((c) => {
                    const asgn = assignments.find(
                      (a) => a.project_id === project.id && a.consultant_id === c.id,
                    )
                    return (
                      <div key={c.id} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-navy-800">{c.name}</p>
                          <p className="text-xs text-slate-400">{c.role_title} · {c.seniority}</p>
                        </div>
                        {asgn && (
                          <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs text-navy-700 shrink-0">
                            {asgn.dedication_percentage}%
                          </span>
                        )}
                        {isHR && (
                          <button
                            onClick={() => handleRemoveConsultant(c.id)}
                            className="ml-1 text-slate-300 hover:text-red-400 transition shrink-0"
                            title="Quitar del proyecto"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interested consultants — only for open/partially staffed projects */}
          {!isActiveProject && interestedConsultants.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Heart size={15} className="text-bip-red" /> Interested Consultants
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {interestedConsultants.map((c) => (
                    <div key={c.id} className="flex items-center gap-2 rounded-full bg-slate-100 pl-1 pr-3 py-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-navy-800">{c.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Match suggestions — only for open/partially staffed projects */}
        {!isActiveProject && isHR && (
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Calendar size={15} className="text-bip-red" /> AI Match Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {matchResults.length === 0 ? (
                  <p className="text-sm text-slate-400">No matches found.</p>
                ) : (
                  <div className="space-y-3">
                    {matchResults.slice(0, 6).map((result) => (
                      <div key={result.consultant.id} className="rounded-md border border-slate-100 p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className="text-xs">{getInitials(result.consultant.name)}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm font-medium text-navy-800">{result.consultant.name}</p>
                            {result.hasLiked && <Heart size={12} className="fill-bip-red text-bip-red" />}
                          </div>
                          <span className="text-sm font-bold text-navy-800">{result.score}</span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{result.reason}</p>
                        {result.vacationWarning && (
                          <p className="mt-0.5 text-xs text-amber-600">⚠ {result.vacationWarning}</p>
                        )}
                        <Button size="sm" variant="outline" className="mt-2 h-7 text-xs w-full">
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </Layout>
  )
}
