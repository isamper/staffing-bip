import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import type { UserRole, Profile } from '@/lib/types'

interface Props {
  children: React.ReactNode
  role?: UserRole
}

// Seniority levels that get dual admin+consultant access
const DUAL_VIEW_SENIORITIES = ['Senior Partner', 'Partner', 'Director', 'Senior Manager', 'Manager']

export function canAccessBothViews(profile: Profile): boolean {
  return (
    profile.user_role === 'hr_admin' ||
    DUAL_VIEW_SENIORITIES.includes(profile.seniority)
  )
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
  // Users with dual-view access can visit both /admin and /employee
  if (role && profile.user_role !== role && !canAccessBothViews(profile)) {
    return <Navigate to="/employee" replace />
  }

  return <>{children}</>
}
