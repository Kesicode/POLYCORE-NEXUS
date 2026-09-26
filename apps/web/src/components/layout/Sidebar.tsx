import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, FolderOpen, Play, BarChart2, Globe,
  Cpu, LineChart, Puzzle, Terminal, BookOpen, Settings,
  ShieldCheck, Zap,
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/projects', icon: FolderOpen, label: 'Projects' },
  { to: '/execute', icon: Play, label: 'Execute' },
  { to: '/benchmarks', icon: BarChart2, label: 'Benchmarks' },
  { to: '/languages', icon: Globe, label: 'Languages' },
  { to: '/devices', icon: Cpu, label: 'IoT Devices' },
  { to: '/analytics', icon: LineChart, label: 'Analytics' },
  { to: '/plugins', icon: Puzzle, label: 'Plugins' },
  { to: '/terminal', icon: Terminal, label: 'Terminal' },
  { to: '/docs', icon: BookOpen, label: 'Docs' },
]

export function Sidebar() {
  const user = useAuthStore((s) => s.user)

  return (
    <aside className="w-56 bg-panel border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">PolyCore</div>
            <div className="text-xs text-text-muted">Nexus</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-100',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary',
              )
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.label}
          </NavLink>
        ))}

        {/* Admin link */}
        {user?.role === 'admin' && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-100 mt-4',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary',
              )
            }
          >
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Admin
          </NavLink>
        )}
      </nav>

      {/* Settings */}
      <div className="p-3 border-t border-border">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-100',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-text-secondary hover:bg-panel-hover hover:text-text-primary',
            )
          }
        >
          <Settings className="w-4 h-4" />
          Settings
        </NavLink>
      </div>
    </aside>
  )
}
