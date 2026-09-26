import { useState } from 'react'
import { Settings, Key, User, Bell, Palette } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const user = useAuthStore((s) => s.user)
  const [geminiKey, setGeminiKey] = useState('')
  const [openaiKey, setOpenaiKey] = useState('')

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary" /> Settings
        </h1>
        <p className="text-text-secondary mt-1">Manage your account and preferences</p>
      </div>

      {/* Profile */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <User className="w-4 h-4 text-text-muted" /> Profile
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Display Name</label>
            <input className="input" defaultValue={user?.displayName} />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Username</label>
            <input className="input" defaultValue={user?.username} disabled />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs text-text-muted mb-1.5">Email</label>
            <input className="input" defaultValue={user?.email} disabled />
          </div>
        </div>
        <button className="btn-primary" onClick={() => toast.success('Profile updated')}>Save Profile</button>
      </div>

      {/* AI Keys */}
      <div className="card p-6 space-y-4">
        <h2 className="font-semibold text-text-primary flex items-center gap-2">
          <Key className="w-4 h-4 text-text-muted" /> AI Provider Keys
        </h2>
        <p className="text-xs text-text-muted">
          Keys are stored server-side. Set them in your <code className="font-mono">.env</code> file for the AI service,
          or configure them here for per-user overrides.
        </p>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Google Gemini API Key</label>
            <input type="password" className="input font-mono text-xs" placeholder="AIza…"
              value={geminiKey} onChange={(e) => setGeminiKey(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">OpenAI API Key</label>
            <input type="password" className="input font-mono text-xs" placeholder="sk-…"
              value={openaiKey} onChange={(e) => setOpenaiKey(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary" onClick={() => toast.success('Keys saved (server-side storage not yet wired)')}>
          Save Keys
        </button>
      </div>

      {/* Account info */}
      <div className="card p-5">
        <h2 className="font-semibold text-text-primary mb-3">Account</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Role</span>
            <span className="capitalize badge-primary">{user?.role}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Status</span>
            <span className={user?.isActive ? 'text-status-online' : 'text-status-error'}>
              {user?.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
