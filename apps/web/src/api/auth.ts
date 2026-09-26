import { apiClient, unwrap } from './client'
import type { User, TokenPair } from '@/types'

export const authApi = {
  register: async (data: { email: string; username: string; password: string }) => {
    const res = await apiClient.post('/auth/register', data)
    return unwrap<{ user: User; tokens: TokenPair }>(res)
  },

  login: async (data: { email: string; password: string }) => {
    const res = await apiClient.post('/auth/login', data)
    return unwrap<{ user: User; tokens: TokenPair }>(res)
  },

  logout: async (refreshToken: string) => {
    await apiClient.post('/auth/logout', { refreshToken })
  },

  me: async () => {
    const res = await apiClient.get('/auth/me')
    return unwrap<User>(res)
  },
}
