import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase, isDemoMode } from '@/lib/supabase'
import { DEMO_USERS } from '@/lib/mockData'
import type { Profile } from '@/lib/types'

interface AuthContextValue {
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const DEMO_SESSION_KEY = 'bench_demo_user'

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
      const user = DEMO_USERS[email as keyof typeof DEMO_USERS]
      if (!user || user.password !== password) return { error: 'Invalid email or password' }
      setProfile(user.profile)
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(user.profile))
      return { error: null }
    }

    const { error } = await supabase!.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
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
    <AuthContext.Provider value={{ profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
