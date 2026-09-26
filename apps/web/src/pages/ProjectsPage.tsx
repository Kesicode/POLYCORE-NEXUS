import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, FolderOpen, Lock, Globe, Trash2, Loader2 } from 'lucide-react'
import { projectsApi } from '@/api/projects'
import type { Project } from '@/types'
import toast from 'react-hot-toast'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', isPublic: false })

  useEffect(() => {
    projectsApi.list().then(({ projects }) => setProjects(projects)).finally(() => setLoading(false))
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const p = await projectsApi.create(form)
      setProjects((prev) => [p, ...prev])
      setShowModal(false)
      setForm({ name: '', description: '', isPublic: false })
      toast.success('Project created!')
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    try {
      await projectsApi.delete(id)
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast.success('Project deleted')
    } catch {
      toast.error('Failed to delete project')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Projects</h1>
          <p className="text-text-secondary mt-1">Organize your code in collaborative workspaces</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderOpen className="w-12 h-12 text-text-muted mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-text-primary mb-2">No projects yet</h3>
          <p className="text-text-muted mb-4">Create your first project to start coding</p>
          <button onClick={() => setShowModal(true)} className="btn-primary inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Project
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((proj) => (
            <div key={proj.id} className="card p-5 hover:border-border-light transition-all group relative">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  {proj.isPublic ? <Globe className="w-4 h-4 text-text-muted" /> : <Lock className="w-4 h-4 text-text-muted" />}
                  <button onClick={() => handleDelete(proj.id, proj.name)}
                    className="p-1 rounded text-text-muted hover:text-status-error transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <Link to={`/projects/${proj.id}`} className="block">
                <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors mb-1 truncate">
                  {proj.name}
                </h3>
                <p className="text-sm text-text-muted line-clamp-2 mb-3">{proj.description || 'No description'}</p>
              </Link>
              <div className="flex items-center gap-2 flex-wrap">
                {proj.tags?.slice(0, 3).map((tag) => (
                  <span key={tag} className="badge-neutral">{tag}</span>
                ))}
                {proj.isPublic && <span className="badge-primary">Public</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Project Name</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="input" placeholder="my-awesome-project" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="input resize-none h-20" placeholder="Optional description…" />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form.isPublic}
                  onChange={(e) => setForm((f) => ({ ...f, isPublic: e.target.checked }))}
                  className="w-4 h-4 accent-primary" />
                <span className="text-sm text-text-secondary">Make project public</span>
              </label>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={creating} className="btn-primary flex-1">
                  {creating ? 'Creating…' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
