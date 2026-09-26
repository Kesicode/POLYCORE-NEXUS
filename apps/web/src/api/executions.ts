import { apiClient, unwrap } from './client'
import type { Execution } from '@/types'

export const executionsApi = {
  create: async (data: {
    language: string
    sourceCode: string
    stdin?: string
    timeoutSecs?: number
    projectId?: string
  }) => {
    const res = await apiClient.post('/executions', data)
    return unwrap<Execution>(res)
  },

  get: async (id: string) => {
    const res = await apiClient.get(`/executions/${id}`)
    return unwrap<Execution>(res)
  },

  list: async () => {
    const res = await apiClient.get('/executions')
    return unwrap<{ executions: Execution[]; total: number }>(res)
  },

  cancel: async (id: string) => {
    const res = await apiClient.delete(`/executions/${id}`)
    return unwrap<{ message: string }>(res)
  },

  /** Poll execution until it's no longer pending (timeout = 60s) */
  poll: async (id: string, intervalMs = 800): Promise<Execution> => {
    const deadline = Date.now() + 60_000
    while (Date.now() < deadline) {
      const exec = await executionsApi.get(id)
      if (!['queued', 'starting', 'running'].includes(exec.status)) {
        return exec
      }
      await new Promise((r) => setTimeout(r, intervalMs))
    }
    throw new Error('Execution polling timed out')
  },
}
