import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Heart, Users, Calendar } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { mockProjects, mockConsultants, mockAssignments, mockLikes, mockVacationRequests } from '@/lib/mockData'
import { matchConsultants } from '@/lib/matching'
import { getInitials, formatDate } from '@/lib/utils'

function statusVariant(status: string) {
  if (status === 'Open') return 'open'
  if (status === 'Partially Staffed') return 'partial'
  return 'full'
}

export default function ProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuth()

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

  const assignedIds = mockAssignments.filter((a) => a.project_id === project.id).map((a) => a.consultant_id)
  const assignedConsultants = mockConsultants.filter((c) => assignedIds.includes(c.id))
  const interestedConsultants = mockConsultants.filter((c) =>
    mockLikes.some((l) => l.project_id === project.id && l.consultant_id === c.id),
  )
  const matchResults = matchConsultants(project, mockConsultants, mockLikes, mockVacationRequests)

  const isHR = profile?.user_role === 'hr_admin'

  return (
    <Layout>
      <div className="mb-5">
        <Link
          to={isHR ? '/admin' : '/employee'}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-navy-800"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Project info */}
        <div className="lg:col-span-2 space-y-5">
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
              <CardTitle className="flex items-center gap-2 text-sm">
                <Users size={15} className="text-bip-red" /> Assigned Team ({assignedConsultants.length}/{project.team_size})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assignedConsultants.length === 0 ? (
                <p className="text-sm text-slate-400">No consultants assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {assignedConsultants.map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback className="text-xs">{getInitials(c.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-navy-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.role_title} · {c.seniority}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interested consultants */}
          {interestedConsultants.length > 0 && (
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

        {/* Match suggestions (HR only) */}
        {isHR && (
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
