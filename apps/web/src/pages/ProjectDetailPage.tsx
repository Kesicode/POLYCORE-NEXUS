import { useParams, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FolderOpen, FileCode, Play, ArrowLeft, Loader2 } from 'lucide-react'
import { projectsApi } from '@/api/projects'
import type { Project, ProjectFile } from '@/types'
import toast from 'react-hot-toast'

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [project, setProject] = useState<Project | null>(null)
  const [files, setFiles] = useState<ProjectFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    Promise.all([
      projectsApi.get(id),
      projectsApi.listFiles(id),
    ]).then(([proj, { files }]) => {
      setProject(proj)
      setFiles(files)
    }).catch(() => toast.error('Failed to load project')).finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="w-6 h-6 text-primary animate-spin" />
    </div>
  )

  if (!project) return (
    <div className="text-center py-20">
      <p className="text-text-muted">Project not found</p>
      <Link to="/projects" className="text-primary hover:underline text-sm mt-2 block">← Back to projects</Link>
    </div>
  )

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link to="/projects" className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">{project.name}</h1>
          {project.description && <p className="text-text-muted text-sm mt-0.5">{project.description}</p>}
        </div>
        <Link to={`/projects/${id}/editor`} className="btn-primary flex items-center gap-2">
          <Play className="w-4 h-4" /> Open Editor
        </Link>
      </div>

      <div className="grid sm:grid-cols-3 gap-4 text-sm">
        <div className="card p-4">
          <div className="text-text-muted text-xs mb-1">Files</div>
          <div className="text-2xl font-bold text-text-primary">{files.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-text-muted text-xs mb-1">Visibility</div>
          <div className="text-lg font-semibold text-text-primary">{project.isPublic ? 'Public' : 'Private'}</div>
        </div>
        <div className="card p-4">
          <div className="text-text-muted text-xs mb-1">Created</div>
          <div className="text-sm font-medium text-text-primary">{new Date(project.createdAt).toLocaleDateString()}</div>
        </div>
      </div>

      <div className="card">
        <div className="px-4 py-3 border-b border-border flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-text-muted" />
          <span className="font-semibold text-text-primary text-sm">Files</span>
        </div>
        {files.length === 0 ? (
          <div className="p-8 text-center text-text-muted">
            No files yet.{' '}
            <Link to={`/projects/${id}/editor`} className="text-primary hover:underline">Open editor to create files</Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {files.map((file) => (
              <div key={file.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-panel-hover transition-colors">
                <FileCode className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-mono text-text-primary">{file.path}</span>
                <span className="text-xs text-text-muted ml-auto">
                  {(file.content?.length || 0).toLocaleString()} chars
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
