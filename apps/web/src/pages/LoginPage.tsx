import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, AlertCircle } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { user, tokens } = await authApi.login({ email: email.trim().toLowerCase(), password })
      setAuth(user, tokens.accessToken, tokens.refreshToken)
      toast.success(`Welcome back, ${user.displayName}!`)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-4">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">Sign in</h1>
          <p className="text-text-muted text-sm mt-1">to PolyCore Nexus</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-md bg-status-error/10 border border-status-error/20 text-status-error text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input pl-9" placeholder="you@example.com" required autoComplete="email"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input pl-9" placeholder="••••••••" required autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary hover:text-primary-600 font-medium">
            Sign up
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-4 p-3 rounded-md bg-panel border border-border text-xs text-text-muted space-y-1">
          <p className="font-medium text-text-secondary">Demo credentials:</p>
          <p>Admin: admin@polycore.dev / PolyCoreAdmin2024!</p>
          <p>User: user@polycore.dev / UserDemo2024!</p>
        </div>
      </div>
    </div>
  )
}
