import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_BASE = import.meta.env.VITE_API_URL || ''

export const apiClient = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Request interceptor — attach auth token
apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401 and refresh tokens
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = useAuthStore.getState().refreshToken
        if (!refreshToken) {
          useAuthStore.getState().logout()
          return Promise.reject(error)
        }

        const response = await axios.post(`${API_BASE}/api/v1/auth/refresh`, {
          refreshToken,
        })

        const { tokens } = response.data.data
        useAuthStore.getState().setTokens(tokens.accessToken, tokens.refreshToken)

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`
        return apiClient(originalRequest)
      } catch {
        useAuthStore.getState().logout()
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  },
)

// Helper to extract data from response envelope
export function unwrap<T>(response: { data: { success: boolean; data: T; error: any } }): T {
  if (!response.data.success) {
    throw new Error(response.data.error?.message || 'Request failed')
  }
  return response.data.data
}
