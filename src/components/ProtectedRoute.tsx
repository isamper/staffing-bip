import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole } from '@/lib/types'

interface Props {
  children: React.ReactNode
  role?: UserRole
}

export default function ProtectedRoute({ children, role }: Props) {
  const { profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-navy border-t-transparent" />
      </div>
    )
  }

  if (!profile) return <Navigate to="/login" replace />
  // hr_admin can access both /admin and /employee views
  if (role && profile.user_role !== role && !(profile.user_role === 'hr_admin')) {
    return <Navigate to="/employee" replace />
  }

  return <>{children}</>
}
