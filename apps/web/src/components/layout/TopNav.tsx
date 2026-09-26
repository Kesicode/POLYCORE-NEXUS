import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, User as UserIcon } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { authApi } from '@/api/auth'
import toast from 'react-hot-toast'

export function TopNav() {
  const { user, refreshToken, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken)
    } catch { /* ignore */ }
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }

  return (
    <header className="h-14 border-b border-border bg-panel flex items-center justify-between px-6 shrink-0">
      <div className="text-sm text-text-muted">
        {/* Breadcrumb rendered by each page if needed */}
      </div>

      <div className="flex items-center gap-3">
        <button
          className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-panel-hover transition-colors"
          title="Notifications"
        >
          <Bell className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <UserIcon className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-medium text-text-primary leading-none">{user?.displayName}</div>
            <div className="text-xs text-text-muted mt-0.5 capitalize">{user?.role}</div>
          </div>
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-md text-text-muted hover:text-status-error hover:bg-status-error/10 transition-colors ml-1"
            title="Logout"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  )
}
