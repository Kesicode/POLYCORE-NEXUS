// TypeScript types for the PolyCore Nexus platform

export interface User {
  id: string
  email: string
  username: string
  displayName: string
  role: 'user' | 'developer' | 'admin'
  isActive: boolean
  createdAt: string
}

export interface TokenPair {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface Language {
  id: string
  name: string
  displayName: string
  version: string
  category: string
  runtime: string
  fileExtensions: string[]
  executionCommand: string
  supportsCompilation: boolean
  supportsMetrics: boolean
  runnerImage: string
  color: string
  description: string
  isActive: boolean
  isExperimental: boolean
}

export interface Project {
  id: string
  ownerId: string
  name: string
  slug: string
  description: string
  template: string
  isPublic: boolean
  isArchived: boolean
  primaryLanguageId?: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface ProjectFile {
  id: string
  projectId: string
  languageId?: string
  path: string
  name: string
  content: string
  isDirectory: boolean
  createdAt: string
  updatedAt: string
}

export type ExecutionStatus =
  | 'queued'
  | 'starting'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'cancelled'

export interface Execution {
  id: string
  userId: string
  language: string
  sourceCode: string
  status: ExecutionStatus
  exitCode?: number
  stdout: string
  stderr: string
  wallTimeMs?: number
  memoryBytes?: number
  queuedAt: string
  startedAt?: string
  completedAt?: string
}

export interface BenchmarkAlgorithm {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  isActive: boolean
}

export interface BenchmarkRun {
  id: string
  userId: string
  algorithmId: string
  languageIds: string[]
  status: ExecutionStatus
  startedAt?: string
  completedAt?: string
  createdAt: string
}

export interface BenchmarkResult {
  id: string
  runId: string
  languageId: string
  language?: Language
  wallTimeMs?: number
  memoryBytes?: number
  isCorrect?: boolean
  errorMessage?: string
}

export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance'

export interface Device {
  id: string
  ownerId: string
  deviceId: string
  name: string
  deviceType: string
  hardwareModel?: string
  firmwareVersion?: string
  status: DeviceStatus
  lastSeenAt?: string
  location?: string
  isSimulator: boolean
  createdAt: string
}

export interface DeviceTelemetry {
  deviceId: string
  timestamp: string
  metrics: Record<string, number | string>
}

export interface Plugin {
  id: string
  name: string
  displayName: string
  version: string
  author?: string
  description?: string
  pluginType: 'language' | 'algorithm' | 'iot' | 'automation' | 'visualization'
  isActive: boolean
  isVerified: boolean
}

export interface Notification {
  id: string
  type: string
  title: string
  message?: string
  link?: string
  isRead: boolean
  createdAt: string
}

// API response envelope
export interface APIResponse<T> {
  success: boolean
  data: T
  error: { code: string; message: string } | null
  requestId: string
}

// System health
export interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'degraded'
  url: string
}

export interface SystemMetrics {
  executionQueue: {
    depth: number
    active: number
  }
  timestamp: string
}
