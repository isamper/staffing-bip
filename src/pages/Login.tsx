import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, isDemoMode } from '@/lib/supabase'
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
  const [seniority, setSeniority] = useState<Profile['seniority']>('Consultant')
  const [signUpPassword, setSignUpPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Set-password mode (invite link / forgot-password recovery)
  const [setPasswordMode, setSetPasswordMode] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')
  const [passwordSet, setPasswordSet] = useState(false)

  // Forgot-password request mode
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotSent, setForgotSent] = useState(false)

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [signedUp, setSignedUp] = useState(false)

  // Detect invite / password-recovery redirect from Supabase email link
  useEffect(() => {
    const hash = window.location.hash
    if (hash.includes('type=invite') || hash.includes('type=recovery')) {
      setSetPasswordMode(true)
    }
  }, [])

  // Auto-redirect once authenticated — but NOT while setting a new password
  if (profile && !setPasswordMode) {
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
    if (signUpPassword.length < 6) { setError('Password must be at least 6 characters'); return }
    if (signUpPassword !== confirmPassword) { setError('Passwords do not match'); return }

    setLoading(true)
    const { error } = await signUp({
      email: signUpEmail,
      password: signUpPassword,
      name: name.trim(),
      role_title: seniority,
      seniority,
    })
    setLoading(false)

    if (error) { setError(error); return }
    setSignedUp(true)
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!forgotEmail.endsWith('@bip-group.com')) {
      setError('Ingresa tu correo @bip-group.com')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-reset-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail }),
        }
      )
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al enviar el correo')
      setForgotSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar el correo')
    } finally {
      setLoading(false)
    }
  }

  async function handleSetPassword(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    if (newPassword !== confirmNewPassword) { setError('Las contraseñas no coinciden'); return }

    setLoading(true)
    const { error } = await supabase!.auth.updateUser({ password: newPassword })
    setLoading(false)

    if (error) { setError(error.message); return }

    // Clean the URL hash so a page refresh doesn't re-enter this mode
    window.history.replaceState(null, '', window.location.pathname)
    setPasswordSet(true)

    // Small delay then redirect
    setTimeout(() => {
      navigate(profile?.user_role === 'hr_admin' ? '/admin' : '/employee', { replace: true })
    }, 1500)
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
            {/* ── Invite / Recovery mode — no tabs, just set-password form ── */}
            {setPasswordMode ? (
              <>
                <CardTitle>Crea tu contraseña</CardTitle>
                <CardDescription>
                  {passwordSet
                    ? 'Contraseña guardada. Ingresando…'
                    : 'Elige una contraseña para activar tu cuenta en bench.'}
                </CardDescription>
              </>
            ) : (
              <>
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
              </>
            )}
          </CardHeader>

          <CardContent>
            {/* ── Set password (invite / recovery) ── */}
            {setPasswordMode && !passwordSet && (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Nueva contraseña</Label>
                  <Input
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Confirmar contraseña</Label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Guardando…' : 'Guardar contraseña'}
                </Button>
              </form>
            )}

            {setPasswordMode && passwordSet && (
              <div className="py-4 text-center">
                <p className="text-3xl mb-2">✓</p>
                <p className="font-medium text-navy-800">¡Contraseña guardada!</p>
                <p className="mt-1 text-sm text-slate-500">Ingresando a tu cuenta…</p>
              </div>
            )}

            {/* ── Forgot password — request form ── */}
            {!setPasswordMode && forgotMode && !forgotSent && (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Tu correo Bip</Label>
                  <Input
                    type="email"
                    placeholder="firstname.lastname@bip-group.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                  />
                </div>
                {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Enviando…' : 'Enviar enlace de recuperación'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setError('') }}
                  className="w-full text-center text-sm text-slate-500 hover:text-navy-800"
                >
                  ← Volver al inicio de sesión
                </button>
              </form>
            )}

            {/* ── Forgot password — success ── */}
            {!setPasswordMode && forgotMode && forgotSent && (
              <div className="py-4 text-center">
                <p className="text-3xl mb-2">✉️</p>
                <p className="font-medium text-navy-800">Revisa tu correo</p>
                <p className="mt-1 text-sm text-slate-500">
                  Te enviamos un enlace para restablecer tu contraseña a <span className="font-medium">{forgotEmail}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => { setForgotMode(false); setForgotSent(false); setForgotEmail(''); setError('') }}
                  className="mt-4 text-sm text-navy-800 underline"
                >
                  Volver al inicio de sesión
                </button>
              </div>
            )}

            {/* ── Sign In ── */}
            {!setPasswordMode && !forgotMode && mode === 'signin' && (
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
                {!isDemoMode && (
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setForgotEmail(email); setError('') }}
                    className="w-full text-center text-sm text-slate-500 hover:text-navy-800"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </form>
            )}

            {/* ── Sign Up ── */}
            {!setPasswordMode && !forgotMode && mode === 'signup' && !signedUp && (
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
                  <Label>Role</Label>
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
            {!setPasswordMode && !forgotMode && mode === 'signup' && signedUp && (
              <div className="py-4 text-center">
                <p className="text-2xl mb-2">✓</p>
                <p className="font-medium text-navy-800">Account created!</p>
                <p className="mt-1 text-sm text-slate-500">Check your email to confirm your account, then sign in.</p>
                <Button className="mt-4 w-full" onClick={() => { setMode('signin'); setSignedUp(false) }}>
                  Go to Sign in
                </Button>
              </div>
            )}

            {isDemoMode && !setPasswordMode && !forgotMode && mode === 'signin' && (
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
