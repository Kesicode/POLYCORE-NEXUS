import { apiClient, unwrap } from './client'

export interface Device {
  id: string
  deviceId: string
  name: string
  deviceType: string
  hardwareModel?: string
  firmwareVersion?: string
  status: 'online' | 'offline' | 'error' | 'maintenance'
  lastSeenAt?: string
  location?: string
  isSimulator: boolean
  createdAt: string
}

export interface TelemetryPoint {
  deviceId: string
  timestamp: string
  metrics: Record<string, number | string>
}

export const devicesApi = {
  list: async (): Promise<Device[]> => {
    const res = await apiClient.get('/devices')
    return unwrap<{ devices: Device[] }>(res)?.devices ?? []
  },

  get: async (deviceId: string): Promise<Device> => {
    const res = await apiClient.get(`/devices/${deviceId}`)
    return unwrap<Device>(res)
  },

  register: async (body: {
    deviceId: string
    name: string
    deviceType: string
    hardwareModel?: string
    firmwareVersion?: string
    location?: string
  }): Promise<Device> => {
    const res = await apiClient.post('/devices', body)
    return unwrap<Device>(res)
  },

  getTelemetry: async (deviceId: string, limit = 100): Promise<TelemetryPoint[]> => {
    const res = await apiClient.get(`/devices/${deviceId}/telemetry?limit=${limit}`)
    return unwrap<{ telemetry: TelemetryPoint[] }>(res)?.telemetry ?? []
  },

  sendCommand: async (deviceId: string, command: Record<string, unknown>) => {
    const res = await apiClient.post(`/devices/${deviceId}/commands`, command)
    return unwrap(res)
  },

  /** Subscribe to real-time telemetry via Server-Sent Events from IoT service */
  streamTelemetry: (
    onMessage: (pt: TelemetryPoint) => void,
    onError?: (e: Event) => void,
  ): EventSource => {
    const iotUrl = import.meta.env.VITE_IOT_URL ?? 'http://localhost:8005'
    const es = new EventSource(`${iotUrl}/api/v1/telemetry/stream`)
    es.onmessage = (e) => {
      try {
        onMessage(JSON.parse(e.data) as TelemetryPoint)
      } catch { /* ignore parse errors */ }
    }
    if (onError) es.onerror = onError
    return es
  },
}
