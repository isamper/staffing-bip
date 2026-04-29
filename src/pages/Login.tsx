import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { isDemoMode } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Profile } from '@/lib/types'

const SENIORITY_OPTIONS: Profile['seniority'][] = [
  'Intern', 'Consultant', 'Senior Consultant', 'Associate', 'Senior Associate',
  'Manager', 'Senior Manager', 'Director', 'Partner', 'Senior Partner',
]

const ROLE_TITLE_OPTIONS = [
  'Intern',
  'Business Analyst',
  'Consultant',
  'Senior Business Analyst',
  'Senior Consultant',
  'Associate Manager',
  'Manager',
  'Project Manager',
  'Engagement Manager',
  'Senior Manager',
  'Director',
  'Partner',
  'Senior Partner',
  'HR Manager',
  'HR Admin',
]

export default function Login() {
  const { signIn, signUp, profile } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')

  // Sign in fields
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Sign up fields
  const [name, setName] = useState('')
  const [signUpEmail, setSignUpEmail] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [seniority, setSeniority] = useState<Profile['seniority']>('Consultant')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  if (profile) {
    navigate(profile.user_role === 'hr_admin' ? '/admin' : '/employee', { replace: true })
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    setLoading(false)
    if (error) { setError(error); return }
    navigate(profile?.user_role === 'hr_admin' ? '/admin' : '/employee', { replace: true })
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!name.trim()) { setError('Full name is required'); return }
    if (!signUpEmail.endsWith('@bip-group.com')) { setError('Only @bip-group.com email addresses are allowed'); return }
    if (!roleTitle) { setError('Role title is required'); return }
    if (signUpPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (signUpPassword !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    const { error } = await signUp({
      email: signUpEmail,
      password: signUpPassword,
      name: name.trim(),
      role_title: roleTitle.trim(),
      seniority,
    })
    setLoading(false)

    if (error) { setError(error); return }
    setSignedUp(true)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link to="/">
            <span className="font-display text-4xl font-bold text-navy-800">
              bench<span className="text-bip-red">.</span>
            </span>
          </Link>
          <p className="mt-1 text-sm text-slate-500">Smart Staffing by Bip Consulting</p>
        </div>

        <Card>
          <CardHeader>
            {/* Toggle */}
            <div className="flex rounded-lg border border-slate-200 p-1 mb-2">
              <button
                onClick={() => { setMode('signin'); setError('') }}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                  mode === 'signin' ? 'bg-navy-800 text-white' : 'text-slate-500 hover:text-navy-800'
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => { setMode('signup'); setError('') }}
                className={`flex-1 rounded-md py-1.5 text-sm font-medium transition ${
                  mode === 'signup' ? 'bg-navy-800 text-white' : 'text-slate-500 hover:text-navy-800'
                }`}
              >
                Sign up
              </button>
            </div>
            <CardTitle>{mode === 'signin' ? 'Welcome back' : 'Create your account'}</CardTitle>
            <CardDescription>
              {mode === 'signin' ? 'Enter your Bip credentials to continue' : 'Use your @bip-group.com email'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* ── Sign In ── */}
            {mode === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="firstname.lastname@bip-group.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
            )}

            {/* ── Sign Up ── */}
            {mode === 'signup' && !signedUp && (
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input placeholder="e.g. Ana García" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" placeholder="firstname.lastname@bip-group.com" value={signUpEmail} onChange={(e) => setSignUpEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Role Title</Label>
                  <Select value={roleTitle} onValueChange={setRoleTitle}>
                    <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                    <SelectContent>
                      {ROLE_TITLE_OPTIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Seniority</Label>
                  <Select value={seniority} onValueChange={(v) => setSeniority(v as Profile['seniority'])}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SENIORITY_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Password</Label>
                  <Input type="password" placeholder="At least 6 characters" value={signUpPassword} onChange={(e) => setSignUpPassword(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirm Password</Label>
                  <Input type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                </div>
                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account…' : 'Create account'}
                </Button>
              </form>
            )}

            {/* ── Sign Up Success ── */}
            {mode === 'signup' && signedUp && (
              <div className="py-4 text-center">
                <p className="text-2xl mb-2">✓</p>
                <p className="font-medium text-navy-800">Account created!</p>
                <p className="mt-1 text-sm text-slate-500">You can now sign in with your email and password.</p>
                <Button className="mt-4 w-full" onClick={() => { setMode('signin'); setSignedUp(false) }}>
                  Go to Sign in
                </Button>
              </div>
            )}

            {isDemoMode && mode === 'signin' && (
              <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                <p className="mb-1 font-semibold text-slate-600">Demo accounts · password: demo123</p>
                <p>carla.villaverde@bip-group.com (HR Admin)</p>
                <p>martha.martinez@bip-group.com (HR Admin)</p>
                <p>hernando.baquero@bip-group.com (Consultant)</p>
                <p className="mt-1 text-slate-400">All consultants: firstname.lastname@bip-group.com</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
