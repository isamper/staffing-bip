import { useState, useEffect, useRef } from 'react'
import { Heart, Briefcase, Clock, FileText, Users, Search, X, AlertTriangle, Lock } from 'lucide-react'
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
import { Label } from '@/components/ui/label'
import type { Profile, Project, ProjectAssignment, ProjectLike } from '@/lib/types'
import type { KimbleImportResult } from '@/lib/kimbleParser'

// ─── shared helpers ───────────────────────────────────────────────────────────
const normName = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Return a new object with only the listed keys from `obj`. */
function pick<T extends object>(obj: T, keys: (keyof T)[]): Partial<T> {
  const result: Partial<T> = {}
  for (const k of keys) if (k in obj) result[k] = obj[k]
  return result
}

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
  // Always re-derive Kimble assignments from the stored result — these are
  // authoritative for who is actually staffed. Stale bench_assignments_v1
  // data (e.g. written from mockData before Kimble was imported) cannot shadow them.
  const result = loadKimbleResult()
  const kimbleAssignments = result ? kimbleToAssignments(result) : []

  // Layer manually-added assignments on top (IDs that don't start with "kimble-")
  try {
    const raw = localStorage.getItem('bench_assignments_v1')
    if (raw) {
      const persisted = JSON.parse(raw) as ProjectAssignment[]
      const manualOnly = persisted.filter((a) => !a.id.startsWith('kimble-'))
      return [...kimbleAssignments, ...manualOnly]
    }
  } catch { /* ignore */ }

  // If we have Kimble data, return it; otherwise fall back to static mock data
  return kimbleAssignments.length > 0 ? kimbleAssignments : mockAssignments
}

const PROFILES_STORAGE_KEY = 'bench_profiles_v1'
const CV_DISMISSED_KEY     = 'bench_cv_dismissed_v1'

/** Fields a consultant can edit in their CV (persisted to localStorage) */
const EDITABLE_PROFILE_KEYS: (keyof Profile)[] = [
  'role_title', 'seniority',
  'bio', 'education', 'languages', 'years_of_experience',
  'certifications', 'experience', 'skills', 'photo_url', 'cv_versions',
]

function loadSavedProfileEdits(): Record<string, Partial<Profile>> {
  try {
    const raw = localStorage.getItem(PROFILES_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch { return {} }
}

function loadConsultants(): Profile[] {
  // 1. Start from mockConsultants (already has HISTORIC_ENRICHMENT data)
  let list: Profile[] = mockConsultants

  // 2. Apply saved CV edits (bio, experience, skills, etc. written by each consultant)
  const savedEdits = loadSavedProfileEdits()
  if (Object.keys(savedEdits).length > 0) {
    list = list.map((c) => savedEdits[c.id] ? { ...c, ...savedEdits[c.id] } : c)
  }

  // 3. Apply deactivations
  try {
    const raw = localStorage.getItem('bench_deactivated_v1')
    const deactivated: Set<string> = raw ? new Set(JSON.parse(raw) as string[]) : new Set()
    if (deactivated.size > 0) {
      list = list.map((c) => deactivated.has(c.id) ? { ...c, is_active: false } : c)
    }
  } catch { /* ignore */ }

  // 3. Apply live Kimble enrichment (industry_experience, kimble_service_areas)
  //    so CVs in the Equipo tab match what Vista Admin shows
  const result = loadKimbleResult()
  if (result) {
    list = list.map((c) => {
      const normC = normName(c.name)
      const areaKey = Object.keys(result.consultantAreaData).find((k) => normName(k) === normC)
      const newAreas = areaKey ? result.consultantAreaData[areaKey] : null
      if (!newAreas) return c
      return {
        ...c,
        industry_experience: [...new Set([...(c.industry_experience ?? []), ...newAreas.industries])],
        kimble_service_areas: [...new Set([...(c.kimble_service_areas ?? []), ...newAreas.areas])],
      }
    })
  }

  return list
}

type Tab = 'overview' | 'cv' | 'team'

/** Merge saved CV edits from localStorage on top of a base profile. */
function applysavedEdits(base: Profile): Profile {
  const savedEdits = loadSavedProfileEdits()
  const mine = savedEdits[base.id]
  return mine ? { ...base, ...mine } : base
}

export default function EmployeeDashboard() {
  const { profile: authProfile } = useAuth()

  // Initialise with saved edits already merged so the CV is correct on first
  // render and survives page reloads without overwriting persisted data.
  const [myProfile, setMyProfile] = useState<Profile | null>(
    authProfile ? applysavedEdits(authProfile) : null,
  )
  // Ref always holds the latest profile so saveCV never reads a stale closure
  const latestProfile = useRef(myProfile)
  latestProfile.current = myProfile   // updated every render, before any click handler runs

  const [cvDirty, setCvDirty] = useState(false)
  const [cvSaved, setCvSaved] = useState(false)
  const [dismissedBannerIds, setDismissedBannerIds] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(CV_DISMISSED_KEY)
      return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
    } catch { return new Set() }
  })

  // Re-sync when authProfile resolves (hard refresh / session restore).
  // Apply saved edits so persisted data is never lost.
  useEffect(() => {
    if (authProfile) setMyProfile(applysavedEdits(authProfile))
  }, [authProfile])

  const [tab, setTab] = useState<Tab>('overview')

  // ── Change password ────────────────────────────────────────────────────────
  const [pwNew, setPwNew]           = useState('')
  const [pwConfirm, setPwConfirm]   = useState('')
  const [pwError, setPwError]       = useState('')
  const [pwSuccess, setPwSuccess]   = useState(false)
  const [pwLoading, setPwLoading]   = useState(false)

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setPwError('')
    setPwSuccess(false)
    if (pwNew.length < 6) { setPwError('La contraseña debe tener al menos 6 caracteres'); return }
    if (pwNew !== pwConfirm) { setPwError('Las contraseñas no coinciden'); return }
    setPwLoading(true)
    const { error } = await supabase!.auth.updateUser({ password: pwNew })
    setPwLoading(false)
    if (error) { setPwError(error.message); return }
    setPwSuccess(true)
    setPwNew('')
    setPwConfirm('')
    setTimeout(() => setPwSuccess(false), 4000)
  }
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

  // The profile cached in bench_demo_user may have a stale ID if the user
  // logged in before profiles were updated. Always resolve the canonical
  // consultant ID by name-matching against mockConsultants.
  const knownConsultant = mockConsultants.find(
    (c) => normName(c.name) === normName(profile.name),
  )
  const consultantId = knownConsultant?.id ?? profile.id

  // All assignments for this consultant
  const myAllAssignments = allAssignments.filter((a) => a.consultant_id === consultantId)

  // Currently active assignments — same date filter as admin Projects tab
  const myAssignments = myAllAssignments.filter((a) => {
    if (a.end_date && a.end_date < todayStr) return false
    if (a.start_date && a.start_date > todayStr) return false
    return true
  })

  const myProjects = myAssignments
    .map((a) => ({ assignment: a, project: allProjects.find((p) => p.id === a.project_id)! }))
    .filter((x) => x.project)

  // Projects ended in the last 90 days → prompt to update CV (unless dismissed)
  const recentlyEndedProjects = myAllAssignments
    .map((a) => allProjects.find((p) => p.id === a.project_id))
    .filter((p): p is NonNullable<typeof p> => {
      if (!p) return false
      if (dismissedBannerIds.has(p.id)) return false
      const end = new Date(p.end_date)
      return end < today && end >= ninetyDaysAgo
    })

  function dismissBanner() {
    const ids = new Set([...dismissedBannerIds, ...recentlyEndedProjects.map(p => p.id)])
    setDismissedBannerIds(ids)
    try { localStorage.setItem(CV_DISMISSED_KEY, JSON.stringify([...ids])) } catch { /* ignore */ }
  }

  // Availability derived from real active assignments (not the static profile field)
  const latestActiveEnd = myAssignments.reduce<string | null>((max, a) => {
    if (!a.end_date) return max
    return max === null || a.end_date > max ? a.end_date : max
  }, null)
  const isOnProject = myAssignments.length > 0

  // ── Build enrichedProfile: single source of truth for this consultant's CV ─
  // Layer order (each overrides the previous):
  //   enrichedConsultant  → HISTORIC_ENRICHMENT + live Kimble area/industry
  //   pick(profile, ...)  → saved CV edits already baked into myProfile on init
  //                         + any in-session unsaved edits from this session
  //   annual_dedication_pct → live from Kimble dedications map
  const kimbleResult = loadKimbleResult()
  const enrichedConsultant = allConsultants.find((c) => c.id === consultantId) ?? profile
  const enrichedProfile: Profile = (() => {
    // profile (myProfile) was initialised with applysavedEdits(), so pick() here
    // correctly surfaces both persisted and in-session edits over the Kimble base.
    const base: Profile = { ...enrichedConsultant, ...pick(profile, EDITABLE_PROFILE_KEYS) }
    if (!kimbleResult) return base
    const normP = normName(profile.name)
    const kimbleName = Object.keys(kimbleResult.consultantDedications).find(
      (k) => normName(k) === normP,
    )
    const pct = kimbleName !== undefined ? kimbleResult.consultantDedications[kimbleName] : undefined
    return pct !== undefined ? { ...base, annual_dedication_pct: pct } : base
  })()

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

  /** Persist current edits to localStorage so all views update. */
  function saveCV() {
    // Read from ref — guaranteed to be the latest value even if a blur-triggered
    // setMyProfile hasn't been flushed by React yet when this click handler runs.
    const toSave = latestProfile.current
    if (!toSave) return
    try {
      const raw = localStorage.getItem(PROFILES_STORAGE_KEY) ?? '{}'
      const saved = JSON.parse(raw) as Record<string, Partial<Profile>>
      saved[toSave.id] = pick(toSave, EDITABLE_PROFILE_KEYS) as Partial<Profile>
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(saved))
    } catch { /* storage full */ }
    setCvDirty(false)
    setCvSaved(true)
    setTimeout(() => setCvSaved(false), 2500)
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
          <div className="flex-1">
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
          <button
            onClick={dismissBanner}
            title="Marcar como revisado"
            className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* CV Tab */}
      {tab === 'cv' && (
        <div>
          {/* Save bar — visible only when there are unsaved changes */}
          {(cvDirty || cvSaved) && (
            <div className={`mb-4 flex items-center justify-between rounded-lg border px-4 py-2.5 transition-colors ${cvSaved ? 'border-green-200 bg-green-50' : 'border-amber-200 bg-amber-50'}`}>
              <p className={`text-sm font-medium ${cvSaved ? 'text-green-700' : 'text-amber-700'}`}>
                {cvSaved ? '✓ CV guardado — todos los vistas están actualizadas' : 'Tienes cambios sin guardar'}
              </p>
              {cvDirty && (
                <button
                  onClick={saveCV}
                  className="ml-4 rounded-lg bg-navy-800 px-4 py-1.5 text-sm font-semibold text-white hover:bg-navy-700 transition-colors"
                >
                  Guardar CV
                </button>
              )}
            </div>
          )}
          <ConsultantCV
            profile={enrichedProfile}
            assignments={allAssignments}
            projects={allProjects}
            onUpdate={(updated) => {
              // Update in-memory only — user must click "Guardar CV" to persist
              setMyProfile(updated)
              setCvDirty(true)
              setCvSaved(false)
            }}
          />
        </div>
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

          {/* Change password */}
          {!isDemoMode && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Lock size={15} className="text-bip-red" /> Cambiar contraseña
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pwSuccess ? (
                  <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-700">
                    ✓ Contraseña actualizada correctamente
                  </p>
                ) : (
                  <form onSubmit={handleChangePassword} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Nueva contraseña</Label>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={pwNew}
                        onChange={(e) => setPwNew(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Confirmar contraseña</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={pwConfirm}
                        onChange={(e) => setPwConfirm(e.target.value)}
                      />
                    </div>
                    {pwError && (
                      <p className="rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">{pwError}</p>
                    )}
                    <Button type="submit" size="sm" className="w-full" disabled={pwLoading}>
                      {pwLoading ? 'Guardando…' : 'Guardar contraseña'}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

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
