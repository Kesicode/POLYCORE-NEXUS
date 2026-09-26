import { apiClient, unwrap } from './client'

export interface BenchmarkAlgorithm {
  id: string
  name: string
  displayName: string
  description: string
  category: string
  isActive: boolean
}

export const benchmarksApi = {
  listAlgorithms: async (): Promise<BenchmarkAlgorithm[]> => {
    const res = await apiClient.get('/benchmarks/algorithms')
    return unwrap<{ algorithms: BenchmarkAlgorithm[] }>(res)?.algorithms ?? []
  },

  runBenchmark: async (body: {
    algorithmName: string
    languageIds?: string[]
    iterations?: number
  }) => {
    const res = await apiClient.post('/benchmarks/run', body)
    return unwrap(res)
  },

  listRuns: async () => {
    const res = await apiClient.get('/benchmarks/runs')
    return unwrap<{ runs: unknown[] }>(res)?.runs ?? []
  },

  getRun: async (runId: string) => {
    const res = await apiClient.get(`/benchmarks/runs/${runId}`)
    return unwrap(res)
  },

  getResults: async (runId: string) => {
    const res = await apiClient.get(`/benchmarks/results/${runId}`)
    return unwrap(res)
  },
}
