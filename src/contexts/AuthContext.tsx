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

const DEMO_SESSION_KEY = 'bench_demo_user'

function nameToEmail(name: string): string {
  const parts = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(' ')
    .filter(Boolean)
  return `${parts[0]}.${parts[parts.length - 1]}@bip-group.com`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      const stored = localStorage.getItem(DEMO_SESSION_KEY)
      if (stored) setProfile(JSON.parse(stored))
      setLoading(false)
      return
    }

    supabase!.auth.getSession().then(({ data: { session } }) => {
      if (session) fetchProfile(session.user.id)
      else setLoading(false)
    })

    const { data: listener } = supabase!.auth.onAuthStateChange((_event, session) => {
      if (session) fetchProfile(session.user.id)
      else { setProfile(null); setLoading(false) }
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase!
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    setProfile(data)
    setLoading(false)
  }

  async function signIn(email: string, password: string): Promise<{ error: string | null }> {
    if (isDemoMode) {
      if (password !== 'demo123') return { error: 'Invalid email or password' }

      // Check named admin users first
      const user = DEMO_USERS[email as keyof typeof DEMO_USERS]
      if (user) {
        setProfile(user.profile)
        localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user.profile))
        return { error: null }
      }

      // Auto-match any consultant by firstname.lastname@bip-group.com
      if (email.endsWith('@bip-group.com')) {
        const consultant = mockConsultants.find((c) => nameToEmail(c.name) === email)
        if (consultant) {
          setProfile(consultant)
          localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(consultant))
          return { error: null }
        }
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

    const { data, error } = await supabase!.auth.signUp({ email, password })
    if (error) return { error: error.message }
    if (!data.user) return { error: 'Sign up failed, please try again' }

    const { error: profileError } = await supabase!.from('profiles').insert({
      id: data.user.id,
      name,
      role_title,
      seniority,
      user_role: 'consultant',
      skills: [],
      is_active: true,
    })

    if (profileError) return { error: profileError.message }
    return { error: null }
  }

  async function signOut() {
    if (isDemoMode) {
      setProfile(null)
      localStorage.removeItem(DEMO_SESSION_KEY)
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
