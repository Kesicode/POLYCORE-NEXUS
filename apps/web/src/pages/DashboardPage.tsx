import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Play, FolderOpen, BarChart2, Cpu, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { executionsApi } from '@/api/executions'
import { projectsApi } from '@/api/projects'
import { useAuthStore } from '@/stores/authStore'
import type { Execution, Project } from '@/types'
import { cn } from '@/utils/cn'

const STATUS_STYLES: Record<string, string> = {
  completed: 'text-status-online',
  failed: 'text-status-error',
  timeout: 'text-status-warning',
  queued: 'text-text-muted',
  running: 'text-primary',
  starting: 'text-primary',
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'completed') return <CheckCircle className="w-4 h-4 text-status-online" />
  if (status === 'failed' || status === 'timeout') return <XCircle className="w-4 h-4 text-status-error" />
  if (['running', 'starting', 'queued'].includes(status)) return <Loader2 className="w-4 h-4 text-primary animate-spin" />
  return null
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  const [executions, setExecutions] = useState<Execution[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [execData, projData] = await Promise.all([
          executionsApi.list(),
          projectsApi.list(),
        ])
        setExecutions(execData.executions.slice(0, 8))
        setProjects(projData.projects.slice(0, 6))
      } catch { /* fail silently */ }
      setLoading(false)
    }
    load()
  }, [])

  const stats = {
    total: executions.length,
    completed: executions.filter((e) => e.status === 'completed').length,
    failed: executions.filter((e) => e.status === 'failed' || e.status === 'timeout').length,
    avgMs: executions.filter((e) => e.wallTimeMs).reduce((sum, e) => sum + (e.wallTimeMs || 0), 0) /
           Math.max(executions.filter((e) => e.wallTimeMs).length, 1),
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Welcome back, {user?.displayName} 👋</h1>
        <p className="text-text-secondary mt-1">Here's an overview of your PolyCore Nexus activity</p>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { to: '/execute', icon: Play, label: 'Run Code', color: 'text-primary' },
          { to: '/projects', icon: FolderOpen, label: 'Projects', color: 'text-accent' },
          { to: '/benchmarks', icon: BarChart2, label: 'Benchmark', color: 'text-status-online' },
          { to: '/devices', icon: Cpu, label: 'IoT Devices', color: 'text-status-warning' },
        ].map((item) => (
          <Link key={item.to} to={item.to}
            className="card p-4 hover:border-border-light hover:bg-panel-hover transition-all group">
            <item.icon className={cn('w-6 h-6 mb-3', item.color)} />
            <div className="text-sm font-medium text-text-primary group-hover:text-text-primary">{item.label}</div>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Runs', value: stats.total, sub: 'All time' },
          { label: 'Succeeded', value: stats.completed, sub: 'Exit code 0' },
          { label: 'Failed', value: stats.failed, sub: 'Non-zero exit' },
          { label: 'Avg Runtime', value: loading ? '—' : `${Math.round(stats.avgMs)}ms`, sub: 'Wall clock' },
        ].map((s) => (
          <div key={s.label} className="card p-4">
            <div className="text-xs text-text-muted mb-1">{s.label}</div>
            <div className="text-2xl font-bold text-text-primary">{s.value}</div>
            <div className="text-xs text-text-secondary mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent executions */}
        <div className="card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <Clock className="w-4 h-4 text-text-muted" />
              Recent Executions
            </h2>
            <Link to="/execute" className="text-xs text-primary hover:underline">Run code →</Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-text-muted">Loading…</div>
            ) : executions.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                No executions yet. <Link to="/execute" className="text-primary hover:underline">Run some code!</Link>
              </div>
            ) : (
              executions.map((exec) => (
                <div key={exec.id} className="px-4 py-3 flex items-center gap-3">
                  <StatusIcon status={exec.status} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary capitalize">{exec.language}</div>
                    <div className="text-xs text-text-muted truncate font-mono">
                      {exec.sourceCode.slice(0, 50).replace(/\n/g, ' ')}…
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={cn('text-xs font-medium capitalize', STATUS_STYLES[exec.status] || 'text-text-muted')}>
                      {exec.status}
                    </div>
                    {exec.wallTimeMs && <div className="text-xs text-text-muted">{exec.wallTimeMs}ms</div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent projects */}
        <div className="card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-text-primary flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-text-muted" />
              Your Projects
            </h2>
            <Link to="/projects" className="text-xs text-primary hover:underline">All projects →</Link>
          </div>
          <div className="divide-y divide-border">
            {loading ? (
              <div className="p-8 text-center text-text-muted">Loading…</div>
            ) : projects.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                No projects yet. <Link to="/projects" className="text-primary hover:underline">Create one!</Link>
              </div>
            ) : (
              projects.map((proj) => (
                <Link key={proj.id} to={`/projects/${proj.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-panel-hover transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FolderOpen className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors truncate">
                      {proj.name}
                    </div>
                    <div className="text-xs text-text-muted truncate">{proj.description || 'No description'}</div>
                  </div>
                  {proj.isPublic && <span className="badge-neutral text-xs">Public</span>}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
