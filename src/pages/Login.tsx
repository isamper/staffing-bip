import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useAuth } from '@/contexts/AuthContext'
import { isDemoMode } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

export default function Login() {
  const { signIn, profile } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (profile) {
    navigate(profile.user_role === 'hr_admin' ? '/admin' : '/employee', { replace: true })
  }

  async function onSubmit(data: FormData) {
    setServerError('')
    const { error } = await signIn(data.email, data.password)
    if (error) {
      setServerError(error)
      return
    }
    navigate(profile?.user_role === 'hr_admin' ? '/admin' : '/employee', { replace: true })
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
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Enter your Bip credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="you@bip.com" {...register('email')} />
                {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="••••••••" {...register('password')} />
                {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
              </div>

              {serverError && (
                <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{serverError}</p>
              )}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Signing in…' : 'Sign in'}
              </Button>
            </form>

            {isDemoMode && (
              <div className="mt-4 rounded-md bg-slate-50 p-3 text-xs text-slate-500">
                <p className="mb-1 font-semibold text-slate-600">Demo accounts</p>
                <p>consultant@bip.com / demo123</p>
                <p>carla@bip.com / demo123 (HR Admin)</p>
                <p>martha@bip.com / demo123 (HR Admin)</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
