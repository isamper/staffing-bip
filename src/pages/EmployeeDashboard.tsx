import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Heart, Calendar, Briefcase, Clock, FileText } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ConsultantCV from '@/components/ConsultantCV'
import {
  mockProjects,
  mockVacationRequests,
  mockAssignments,
  mockLikes,
} from '@/lib/mockData'
import { getInitials, formatDate, isAvailableNow } from '@/lib/utils'
import type { Profile, ProjectLike, VacationRequest } from '@/lib/types'

const vacationSchema = z.object({
  start_date: z.string().min(1, 'Required'),
  end_date: z.string().min(1, 'Required'),
  note: z.string().optional(),
})
type VacationForm = z.infer<typeof vacationSchema>

function statusVariant(status: string) {
  if (status === 'Approved') return 'success'
  if (status === 'Rejected') return 'destructive'
  return 'pending'
}

type Tab = 'overview' | 'cv'

export default function EmployeeDashboard() {
  const { profile: authProfile } = useAuth()
  const [myProfile, setMyProfile] = useState<Profile | null>(authProfile)
  const [tab, setTab] = useState<Tab>('overview')
  const [likes, setLikes] = useState<ProjectLike[]>(mockLikes)
  const [vacations, setVacations] = useState<VacationRequest[]>(mockVacationRequests)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<VacationForm>({ resolver: zodResolver(vacationSchema) })

  const profile = myProfile
  if (!profile) return null

  const myAssignments = mockAssignments.filter((a) => a.consultant_id === profile.id)
  const myProjects = myAssignments
    .map((a) => ({ assignment: a, project: mockProjects.find((p) => p.id === a.project_id)! }))
    .filter((x) => x.project)
  const myVacations = vacations.filter((v) => v.consultant_id === profile.id)
  const myLikes = likes.filter((l) => l.consultant_id === profile.id).map((l) => l.project_id)
  const openProjects = mockProjects.filter(
    (p) => p.status === 'Open' || p.status === 'Partially Staffed',
  )

  function toggleLike(projectId: string) {
    setLikes((prev) => {
      const existing = prev.find((l) => l.project_id === projectId && l.consultant_id === profile!.id)
      if (existing) return prev.filter((l) => l.id !== existing.id)
      return [...prev, { id: `l${Date.now()}`, project_id: projectId, consultant_id: profile!.id, created_at: new Date().toISOString() }]
    })
  }

  function onSubmitVacation(data: VacationForm) {
    setVacations((prev) => [
      ...prev,
      {
        id: `v${Date.now()}`,
        consultant_id: profile!.id,
        start_date: data.start_date,
        end_date: data.end_date,
        note: data.note,
        status: 'Pending',
        created_at: new Date().toISOString(),
      },
    ])
    reset()
  }

  return (
    <Layout>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">My Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome back, {profile.name.split(' ')[0]}</p>
        </div>
        {/* Tabs */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 gap-1">
          <button
            onClick={() => setTab('overview')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'overview' ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Briefcase size={14} /> Overview
          </button>
          <button
            onClick={() => setTab('cv')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'cv' ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileText size={14} /> My CV
          </button>
        </div>
      </div>

      {/* CV Tab */}
      {tab === 'cv' && (
        <ConsultantCV
          profile={profile}
          assignments={mockAssignments}
          projects={mockProjects}
          onUpdate={(updated) => setMyProfile(updated)}
        />
      )}

      {tab === 'overview' && <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-5 lg:col-span-1">
          {/* Profile card */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex items-start gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback className="text-base">{getInitials(profile.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-navy-800">{profile.name}</p>
                  <p className="text-sm text-slate-500">{profile.role_title}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {profile.seniority}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Briefcase size={15} className="text-bip-red" /> Current Assignments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {myProjects.length === 0 ? (
                <p className="text-sm text-slate-500">No active assignment</p>
              ) : (
                <div className="space-y-3">
                  {myProjects.map(({ assignment, project }) => (
                    <div key={assignment.id} className="rounded-md border border-slate-100 p-2.5">
                      <p className="font-medium text-navy-800 text-sm">{project.name}</p>
                      <p className="text-xs text-slate-500">{project.client}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-navy-100 px-2 py-0.5 text-xs text-navy-700">
                          {assignment.dedication_percentage}%
                        </span>
                        <span className="text-xs text-slate-400">
                          Until {formatDate(assignment.end_date ?? project.end_date)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Availability */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Clock size={15} className="text-bip-red" /> Availability
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isAvailableNow(profile.available_from) ? (
                <Badge variant="success">Available now</Badge>
              ) : (
                <p className="text-sm text-slate-600">
                  Available from{' '}
                  <span className="font-medium">{formatDate(profile.available_from)}</span>
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-5 lg:col-span-2">
          {/* Project pipeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Heart size={15} className="text-bip-red" /> Project Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {openProjects.map((project) => {
                  const liked = myLikes.includes(project.id)
                  return (
                    <div
                      key={project.id}
                      className="flex items-start justify-between rounded-lg border border-slate-100 p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-navy-800">{project.name}</p>
                          <Badge variant={project.status === 'Open' ? 'open' : 'partial'} className="text-xs">
                            {project.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-500">{project.client} · {project.industry}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          Starts {formatDate(project.start_date)}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {project.skills_required.map((s) => (
                            <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => toggleLike(project.id)}
                        className="ml-3 mt-0.5 transition-transform hover:scale-110"
                        title={liked ? 'Remove interest' : 'Express interest'}
                      >
                        <Heart
                          size={20}
                          className={liked ? 'fill-bip-red text-bip-red' : 'text-slate-300'}
                        />
                      </button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Vacation request */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Calendar size={15} className="text-bip-red" /> Request Time Off
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitVacation)} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="start_date">Start date</Label>
                    <Input id="start_date" type="date" {...register('start_date')} />
                    {errors.start_date && <p className="text-xs text-red-600">{errors.start_date.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="end_date">End date</Label>
                    <Input id="end_date" type="date" {...register('end_date')} />
                    {errors.end_date && <p className="text-xs text-red-600">{errors.end_date.message}</p>}
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="note">Note (optional)</Label>
                  <Input id="note" placeholder="e.g. Family vacation" {...register('note')} />
                </div>
                <Button type="submit" size="sm">Submit request</Button>
              </form>

              {myVacations.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">My requests</p>
                  {myVacations.map((v) => (
                    <div key={v.id} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-navy-800">
                          {formatDate(v.start_date)} – {formatDate(v.end_date)}
                        </p>
                        {v.note && <p className="text-xs text-slate-400">{v.note}</p>}
                      </div>
                      <Badge variant={statusVariant(v.status)}>{v.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>}
    </Layout>
  )
}
