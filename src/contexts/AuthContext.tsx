import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase'
import { DEMO_USERS, mockConsultants } from '@/lib/mockData'
import type { Profile } from '@/lib/types'

interface SignUpData {
  email: string
  password: string
  name: string
  role_title: string
  seniority: Profile['seniority']
}

interface AuthContextValue {
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (data: SignUpData) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// Store only the email — never the full profile object, which goes stale.
const DEMO_SESSION_KEY = 'bench_demo_email'

function nameToEmail(name: string): string {
  const parts = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(' ')
    .filter(Boolean)
  return `${parts[0]}.${parts[parts.length - 1]}@bip-group.com`
}

function profileFromEmail(email: string): Profile | null {
  // Named admin/HR users first
  const demoEntry = DEMO_USERS[email as keyof typeof DEMO_USERS]
  if (demoEntry) return demoEntry.profile

  // Regular consultants matched by firstname.lastname@bip-group.com
  if (email.endsWith('@bip-group.com')) {
    return mockConsultants.find((c) => nameToEmail(c.name) === email) ?? null
  }

  return null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      // Migrate any old bench_demo_user key (full profile) to the new email-only key
      const oldKey = 'bench_demo_user'
      const oldStored = localStorage.getItem(oldKey)
      if (oldStored) {
        try {
          const oldProfile = JSON.parse(oldStored) as Profile
          const email = nameToEmail(oldProfile.name)
          localStorage.setItem(DEMO_SESSION_KEY, email)
        } catch { /* ignore */ }
        localStorage.removeItem(oldKey)
      }

      const email = localStorage.getItem(DEMO_SESSION_KEY)
      if (email) {
        const p = profileFromEmail(email)
        if (p) setProfile(p)
        else localStorage.removeItem(DEMO_SESSION_KEY)
      }
      setLoading(false)
      return
    }

    // ── Real Supabase mode ──
    // Restore session on hard refresh
    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) resolveProfile(session.user.id, session.user.email ?? '')
      else setLoading(false)
    })

    // Keep profile in sync with auth state changes (login, logout, invite click, token refresh)
    const { data: listener } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session?.user) resolveProfile(session.user.id, session.user.email ?? '')
      else { setProfile(null); setLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Resolve the active profile after a successful auth event.
   *
   * Strategy (in order):
   *  1. Try to match the session email against mockConsultants / DEMO_USERS —
   *     this gives rich profile data (skills, bio, etc.) for the existing 73 team members.
   *  2. Fall back to the Supabase `profiles` table for new hires who signed up directly.
   */
  async function resolveProfile(userId: string, email: string) {
    const mock = profileFromEmail(email)
    if (mock) {
      setProfile(mock)
      setLoading(false)
      return
    }
    // New hire: profile was created by the DB trigger on signup
    await fetchProfile(userId)
  }

  async function fetchProfile(userId: string) {
    const { data } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data ?? null)
    setLoading(false)
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (isDemoMode) {
      if (password !== 'demo123') return { error: 'Invalid email or password' }

      const p = profileFromEmail(email)
      if (p) {
        setProfile(p)
        localStorage.setItem(DEMO_SESSION_KEY, email)
        return { error: null }
      }

      return { error: 'Invalid email or password' }
    }

    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    return { error: null }
  }

  async function signUp({ email, password, name, role_title, seniority }: SignUpData): Promise<{ error: string | null }> {
    if (!email.endsWith('@bip-group.com')) {
      return { error: 'Only @bip-group.com email addresses are allowed' }
    }

    // Pass name/role/seniority as metadata — a DB trigger reads this and
    // creates the profile row automatically (bypasses RLS on email confirmation)
    const { error } = await supabase!.auth.signUp({
      email,
      password,
      options: { data: { name, role_title, seniority } },
    })

    if (error) return { error: error.message }
    return { error: null }
  }

  async function signOut() {
    if (isDemoMode) {
      setProfile(null)
      localStorage.removeItem(DEMO_SESSION_KEY)
      localStorage.removeItem('bench_demo_user') // clean up old key if still present
      return
    }
    await supabase!.auth.signOut()
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{ profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
