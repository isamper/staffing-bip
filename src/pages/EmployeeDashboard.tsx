import { useState } from 'react'
import { Heart, Briefcase, Clock, FileText, Users, Search, X, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, isDemoMode } from '@/lib/supabase'
import Layout from '@/components/Layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import ConsultantCV from '@/components/ConsultantCV'
import {
  mockConsultants,
  mockProjects,
  mockAssignments,
  mockLikes,
} from '@/lib/mockData'
import { getInitials, formatDate } from '@/lib/utils'
import type { Profile, Project, ProjectAssignment, ProjectLike } from '@/lib/types'
import type { KimbleImportResult } from '@/lib/kimbleParser'

// ─── shared helpers ───────────────────────────────────────────────────────────
const normName = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

const numericCode = (id: string) => {
  const m = id.match(/(\d+)$/)
  return m ? String(parseInt(m[1], 10)) : id
}

// Build numeric-suffix → existing mock project ID map (e.g. "711" → "p711")
const numericToMockId = new Map<string, string>(
  mockProjects.map((p) => [numericCode(p.id), p.id]),
)

// Build normalised name → consultant ID map from mockConsultants
const normToConsultantId: Record<string, string> = {}
mockConsultants.forEach((c) => { normToConsultantId[normName(c.name)] = c.id })

// ─── read the same localStorage keys the admin dashboard writes ───────────────

function loadKimbleResult(): KimbleImportResult | null {
  try {
    const raw = localStorage.getItem('bench_kimble_result_v1')
    return raw ? (JSON.parse(raw) as KimbleImportResult) : null
  } catch { return null }
}

/**
 * Derive assignments from the stored Kimble result using the same logic as
 * AdminDashboard.handleKimbleImport — this way the employee view is correct
 * even before the admin dashboard has had a chance to write bench_assignments_v1.
 */
function kimbleToAssignments(result: KimbleImportResult): ProjectAssignment[] {
  return result.rawAssignments.flatMap((ra, i) => {
    const consultantId = normToConsultantId[normName(ra.consultantName)]
    if (!consultantId) return []
    const resolvedProjectId = numericToMockId.get(numericCode(ra.projectId)) ?? ra.projectId
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
}

function loadProjects(): Project[] {
  // The Kimble result stores raw IDs (e.g. "e000711"), but assignments use the
  // resolved "p711"-style IDs.  We use mockProjects as the canonical ID map and
  // overlay Kimble data (name / status / dates / positions) on top.
  const result = loadKimbleResult()
  if (!result) return mockProjects

  const mockById = new Map<string, Project>(mockProjects.map((p) => [p.id, p]))
  const merged = new Map<string, Project>(mockProjects.map((p) => [p.id, { ...p }]))

  for (const kp of result.projects) {
    const nc = numericCode(kp.id)
    const existingId = numericToMockId.get(nc)
    if (existingId) {
      const existing = mockById.get(existingId)!
      merged.set(existingId, {
        ...existing,
        name: kp.name || existing.name,
        client: kp.client || existing.client,
        end_date: kp.end_date,
        status: kp.status,
        team_size: kp.team_size,
      })
    } else {
      merged.set(kp.id, kp)
    }
  }

  return [...merged.values()]
}

function loadAssignments(): ProjectAssignment[] {
  // 1. Prefer fully-persisted state (includes manual assignments from admin)
  try {
    const raw = localStorage.getItem('bench_assignments_v1')
    if (raw) return JSON.parse(raw) as ProjectAssignment[]
  } catch { /* ignore */ }

  // 2. Fall back: derive directly from the stored Kimble result so the employee
  //    view works even if the admin dashboard hasn't re-mounted yet this session.
  const result = loadKimbleResult()
  if (result) return kimbleToAssignments(result)

  // 3. Last resort: static mock data
  return mockAssignments
}

function loadConsultants(): Profile[] {
  // Deactivations are the only persistent change to profiles
  try {
    const raw = localStorage.getItem('bench_deactivated_v1')
    const deactivated: Set<string> = raw ? new Set(JSON.parse(raw) as string[]) : new Set()
    if (deactivated.size === 0) return mockConsultants
    return mockConsultants.map((c) => deactivated.has(c.id) ? { ...c, is_active: false } : c)
  } catch {
    return mockConsultants
  }
}

type Tab = 'overview' | 'cv' | 'team'

export default function EmployeeDashboard() {
  const { profile: authProfile } = useAuth()
  const [myProfile, setMyProfile] = useState<Profile | null>(authProfile)
  const [tab, setTab] = useState<Tab>('overview')
  const [likes, setLikes] = useState<ProjectLike[]>(mockLikes)
  const [teamSearch, setTeamSearch] = useState('')
  const [selectedColleague, setSelectedColleague] = useState<Profile | null>(null)

  const profile = myProfile
  if (!profile) return null

  // ── Real data from localStorage (same source as admin dashboard) ──
  const allProjects   = loadProjects()
  const allAssignments = loadAssignments()
  const allConsultants = loadConsultants()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const ninetyDaysAgo = new Date(today.getTime() - 90 * 86400000)

  // All assignments for this consultant
  const myAllAssignments = allAssignments.filter((a) => a.consultant_id === profile.id)

  // Currently active assignments — same date filter as admin Projects tab
  const myAssignments = myAllAssignments.filter((a) => {
    if (a.end_date && a.end_date < todayStr) return false
    if (a.start_date && a.start_date > todayStr) return false
    return true
  })

  const myProjects = myAssignments
    .map((a) => ({ assignment: a, project: allProjects.find((p) => p.id === a.project_id)! }))
    .filter((x) => x.project)

  // Projects ended in the last 90 days → prompt to update CV
  const recentlyEndedProjects = myAllAssignments
    .map((a) => allProjects.find((p) => p.id === a.project_id))
    .filter((p): p is NonNullable<typeof p> => {
      if (!p) return false
      const end = new Date(p.end_date)
      return end < today && end >= ninetyDaysAgo
    })

  // Availability derived from real active assignments (not the static profile field)
  const latestActiveEnd = myAssignments.reduce<string | null>((max, a) => {
    if (!a.end_date) return max
    return max === null || a.end_date > max ? a.end_date : max
  }, null)
  const isOnProject = myAssignments.length > 0

  const myLikes = likes.filter((l) => l.consultant_id === profile.id).map((l) => l.project_id)
  const openProjects = allProjects.filter(
    (p) => p.status === 'Open' || p.status === 'Partially Staffed',
  )

  function toggleLike(projectId: string) {
    setLikes((prev) => {
      const existing = prev.find((l) => l.project_id === projectId && l.consultant_id === profile!.id)
      if (existing) return prev.filter((l) => l.id !== existing.id)
      return [...prev, { id: `l${Date.now()}`, project_id: projectId, consultant_id: profile!.id, created_at: new Date().toISOString() }]
    })
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
          <button
            onClick={() => setTab('team')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${tab === 'team' ? 'bg-white text-navy-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Users size={14} /> Equipo
          </button>
        </div>
      </div>

      {/* Colleague CV modal */}
      {selectedColleague && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-16 overflow-y-auto">
          <div className="w-full max-w-3xl">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-white/80">CV de {selectedColleague.name}</span>
              <button
                onClick={() => setSelectedColleague(null)}
                className="flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/20 transition-colors"
              >
                <X size={14} /> Cerrar
              </button>
            </div>
            <ConsultantCV
              profile={selectedColleague}
              assignments={allAssignments}
              projects={allProjects}
              readOnly
            />
          </div>
        </div>
      )}

      {/* CV-update notification banner */}
      {tab === 'overview' && recentlyEndedProjects.length > 0 && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">Actualiza tu CV</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Tienes {recentlyEndedProjects.length === 1 ? 'un proyecto que terminó recientemente' : `${recentlyEndedProjects.length} proyectos que terminaron recientemente`}.
              Recuerda agregar esta experiencia a tu hoja de vida:{' '}
              <span className="font-medium">{recentlyEndedProjects.map(p => p.name).join(', ')}</span>.
            </p>
            <button
              onClick={() => setTab('cv')}
              className="mt-1.5 text-xs font-medium text-amber-800 underline underline-offset-2 hover:text-amber-900"
            >
              Ir a mi CV →
            </button>
          </div>
        </div>
      )}

      {/* CV Tab */}
      {tab === 'cv' && (
        <ConsultantCV
          profile={profile}
          assignments={allAssignments}
          projects={allProjects}
          onUpdate={async (updated) => {
            setMyProfile(updated)
            if (!isDemoMode && supabase) {
              await supabase.from('profiles').update({
                name: updated.name,
                role_title: updated.role_title,
                seniority: updated.seniority,
                skills: updated.skills,
                bio: updated.bio,
                education: updated.education,
                languages: updated.languages,
                years_of_experience: updated.years_of_experience,
                certifications: updated.certifications,
                experience: updated.experience,
              }).eq('id', updated.id)
            }
          }}
        />
      )}

      {/* Equipo Tab */}
      {tab === 'team' && (
        <div>
          <div className="mb-4 flex items-center gap-2">
            <Search size={15} className="text-slate-400 shrink-0" />
            <Input
              placeholder="Buscar consultor por nombre o habilidad…"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="h-9 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {allConsultants
              .filter((c) =>
                c.is_active &&
                (c.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
                  c.skills.some((s) => s.toLowerCase().includes(teamSearch.toLowerCase())))
              )
              .map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedColleague(c)}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left transition hover:border-navy-400 hover:shadow-sm"
                >
                  <Avatar className="h-11 w-11 shrink-0">
                    {c.photo_url ? (
                      <img src={c.photo_url} alt={c.name} className="h-full w-full object-cover rounded-full" />
                    ) : (
                      <AvatarFallback className="text-sm">{getInitials(c.name)}</AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-navy-800 truncate">{c.name}</p>
                    <p className="text-xs text-slate-500 truncate">{c.role_title}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {c.skills.slice(0, 2).map((s) => (
                        <span key={s} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 truncate max-w-[110px]">{s}</span>
                      ))}
                      {c.skills.length > 2 && (
                        <span className="text-xs text-slate-400">+{c.skills.length - 2}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>
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
              {isOnProject ? (
                <div>
                  <Badge variant="active">On Project</Badge>
                  {latestActiveEnd && (
                    <p className="mt-1.5 text-xs text-slate-500">
                      Until {formatDate(latestActiveEnd)}
                    </p>
                  )}
                </div>
              ) : (
                <Badge variant="success">Available now</Badge>
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

        </div>
      </div>}
    </Layout>
  )
}
