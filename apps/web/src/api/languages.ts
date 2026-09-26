import { apiClient, unwrap } from './client'
import type { Language } from '@/types'

export const languagesApi = {
  list: async (category?: string) => {
    const params = category ? { category } : {}
    const res = await apiClient.get('/languages', { params })
    return unwrap<{ languages: Language[]; total: number }>(res)
  },

  getByName: async (name: string) => {
    const res = await apiClient.get(`/languages/${name}`)
    return unwrap<Language>(res)
  },
}
