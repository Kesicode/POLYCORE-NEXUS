import { apiClient, unwrap } from './client'
import type { Project, ProjectFile } from '@/types'

export const projectsApi = {
  list: async () => {
    const res = await apiClient.get('/projects')
    return unwrap<{ projects: Project[]; total: number }>(res)
  },

  create: async (data: { name: string; description?: string; template?: string }) => {
    const res = await apiClient.post('/projects', data)
    return unwrap<Project>(res)
  },

  get: async (id: string) => {
    const res = await apiClient.get(`/projects/${id}`)
    return unwrap<Project>(res)
  },

  update: async (id: string, data: Partial<Project>) => {
    const res = await apiClient.put(`/projects/${id}`, data)
    return unwrap<Project>(res)
  },

  delete: async (id: string) => {
    const res = await apiClient.delete(`/projects/${id}`)
    return unwrap<{ message: string }>(res)
  },

  listFiles: async (projectId: string) => {
    const res = await apiClient.get(`/projects/${projectId}/files`)
    return unwrap<{ files: ProjectFile[] }>(res)
  },

  createFile: async (projectId: string, data: { path: string; name: string; content: string; languageId?: string }) => {
    const res = await apiClient.post(`/projects/${projectId}/files`, data)
    return unwrap<ProjectFile>(res)
  },

  updateFile: async (projectId: string, fileId: string, data: { content: string }) => {
    const res = await apiClient.put(`/projects/${projectId}/files/${fileId}`, data)
    return unwrap<ProjectFile>(res)
  },
}
