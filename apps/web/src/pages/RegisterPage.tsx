import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, User, AlertCircle } from 'lucide-react'
import { authApi } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ email: '', username: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true)
    try {
      const { user, tokens } = await authApi.register({
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password,
      })
      setAuth(user, tokens.accessToken, tokens.refreshToken)
      toast.success('Account created! Welcome to PolyCore Nexus.')
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed')
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
          <h1 className="text-2xl font-bold text-text-primary">Create account</h1>
          <p className="text-text-muted text-sm mt-1">Join PolyCore Nexus</p>
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
              <input type="email" value={form.email} onChange={update('email')} className="input pl-9" placeholder="you@example.com" required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="text" value={form.username} onChange={update('username')} className="input pl-9" placeholder="your-username" required minLength={3} maxLength={50} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="password" value={form.password} onChange={update('password')} className="input pl-9" placeholder="Min 8 characters" required minLength={8} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1.5">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input type="password" value={form.confirm} onChange={update('confirm')} className="input pl-9" placeholder="Repeat password" required />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full py-2.5">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-text-muted mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:text-primary-600 font-medium">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
