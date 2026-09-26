import { useState, useEffect } from 'react'
import { ShieldCheck, Users, Activity, Database, Loader2, RefreshCw } from 'lucide-react'
import { apiClient, unwrap } from '@/api/client'
import { useAuthStore } from '@/stores/authStore'
import { Navigate } from 'react-router-dom'
import type { SystemMetrics, ServiceStatus } from '@/types'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const user = useAuthStore((s) => s.user)
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [services, setServices] = useState<ServiceStatus[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />

  const load = async () => {
    setLoading(true)
    try {
      const [metricsRes, servicesRes, usersRes] = await Promise.all([
        apiClient.get('/system/metrics').catch(() => null),
        apiClient.get('/system/services').catch(() => null),
        apiClient.get('/admin/users').catch(() => null),
      ])
      if (metricsRes) setMetrics(unwrap<SystemMetrics>(metricsRes))
      if (servicesRes) setServices(unwrap<{ services: ServiceStatus[] }>(servicesRes)?.services || [])
      if (usersRes) setUsers(unwrap<{ users: any[] }>(usersRes)?.users || [])
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Admin Panel
          </h1>
          <p className="text-text-secondary mt-1">Platform management and system monitoring</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* System metrics */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card p-4">
            <div className="text-xs text-text-muted mb-1">Queue Depth</div>
            <div className="text-2xl font-bold text-text-primary">{metrics.executionQueue?.depth ?? '—'}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-text-muted mb-1">Active Jobs</div>
            <div className="text-2xl font-bold text-text-primary">{metrics.executionQueue?.active ?? '—'}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-text-muted mb-1">Total Users</div>
            <div className="text-2xl font-bold text-text-primary">{users.length}</div>
          </div>
          <div className="card p-4">
            <div className="text-xs text-text-muted mb-1">Services</div>
            <div className="text-2xl font-bold text-text-primary">
              {services.filter((s) => s.status === 'online').length}/{services.length}
            </div>
          </div>
        </div>
      )}

      {/* Services */}
      <div className="card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Activity className="w-4 h-4 text-text-muted" /> Service Status
          </h2>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
        ) : services.length === 0 ? (
          <div className="p-6 text-text-muted text-sm text-center">Services not reachable — is the API running?</div>
        ) : (
          <div className="divide-y divide-border">
            {services.map((svc) => (
              <div key={svc.name} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-text-primary">{svc.name}</div>
                  <div className="text-xs text-text-muted font-mono">{svc.url}</div>
                </div>
                <span className={`badge text-xs ${
                  svc.status === 'online' ? 'badge-success' :
                  svc.status === 'degraded' ? 'badge-warning' : 'badge-error'
                }`}>
                  {svc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Users */}
      <div className="card">
        <div className="px-4 py-3 border-b border-border">
          <h2 className="font-semibold text-text-primary flex items-center gap-2">
            <Users className="w-4 h-4 text-text-muted" /> Users
          </h2>
        </div>
        {loading ? (
          <div className="p-8 flex justify-center"><Loader2 className="w-5 h-5 text-primary animate-spin" /></div>
        ) : users.length === 0 ? (
          <div className="p-6 text-text-muted text-sm text-center">No users found</div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => (
              <div key={u.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                  {u.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">{u.displayName || u.username}</div>
                  <div className="text-xs text-text-muted">{u.email}</div>
                </div>
                <span className={`badge text-xs ${u.role === 'admin' ? 'badge-primary' : 'badge-neutral'}`}>
                  {u.role}
                </span>
                <span className={`badge text-xs ${u.isActive ? 'badge-success' : 'badge-error'}`}>
                  {u.isActive ? 'active' : 'disabled'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
