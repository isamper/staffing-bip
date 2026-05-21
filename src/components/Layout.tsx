import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Bell, LayoutDashboard, User } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { getInitials } from '@/lib/utils'

export default function Layout({ children }: { children: React.ReactNode }) {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const isAdmin = profile?.user_role === 'hr_admin'
  const isOnAdminView = location.pathname.startsWith('/admin')
  const dashboardPath = isAdmin ? '/admin' : '/employee'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-navy-800 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <Link to={dashboardPath} className="flex items-center gap-2">
            <span className="font-display text-2xl font-bold tracking-tight">
              bench<span className="text-bip-red">.</span>
            </span>
            <span className="hidden text-xs text-slate-300 sm:block">
              Smart Staffing by Bip Consulting
            </span>
          </Link>

          <nav className="flex items-center gap-4">
            {isAdmin && (
              <Link
                to={isOnAdminView ? '/employee' : '/admin'}
                className="flex items-center gap-1.5 rounded-md border border-navy-600 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-navy-700 hover:text-white"
                title={isOnAdminView ? 'Cambiar a vista de consultor' : 'Cambiar a vista de admin'}
              >
                {isOnAdminView ? (
                  <><User size={13} /> Vista Consultor</>
                ) : (
                  <><LayoutDashboard size={13} /> Vista Admin</>
                )}
              </Link>
            )}
            <button className="relative rounded-md p-1.5 text-slate-200 transition hover:bg-navy-700 hover:text-white">
              <Bell size={18} />
            </button>

            <div className="flex items-center gap-2 border-l border-navy-600 pl-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-bip-red text-xs font-semibold text-white">
                {profile ? getInitials(profile.name) : '?'}
              </div>
              <div className="hidden flex-col sm:flex">
                <span className="text-sm font-medium leading-tight">{profile?.name}</span>
                <span className="text-xs capitalize text-slate-300">
                  {profile?.user_role === 'hr_admin' ? 'HR Admin' : profile?.seniority}
                </span>
              </div>
              <button
                onClick={handleSignOut}
                className="ml-2 rounded-md p-1.5 text-slate-300 transition hover:bg-navy-700 hover:text-white"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  )
}
