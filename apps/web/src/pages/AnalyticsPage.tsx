import { useState } from 'react'
import { LineChart, BarChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { LineChart as LineChartIcon, Plus } from 'lucide-react'
import { apiClient, unwrap } from '@/api/client'
import toast from 'react-hot-toast'

const SAMPLE_DATA = Array.from({ length: 20 }, (_, i) => ({
  i,
  value: Math.floor(Math.random() * 100) + 10,
}))

export default function AnalyticsPage() {
  const [rawData, setRawData] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState(SAMPLE_DATA)

  const computeStats = async () => {
    let nums: number[]
    try {
      nums = JSON.parse(rawData)
      if (!Array.isArray(nums) || nums.some((n) => typeof n !== 'number')) throw new Error()
    } catch {
      toast.error('Enter a JSON array of numbers, e.g. [1, 2, 3, 100, 200]')
      return
    }
    setLoading(true)
    try {
      const res = await apiClient.post('/api/v1/analytics/statistics', { data: nums })
      const result = unwrap<any>(res)
      setStats(result)
      setChartData(nums.map((v, i) => ({ i, value: v })))
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Analytics service unavailable')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <LineChartIcon className="w-6 h-6 text-primary" /> Analytics
        </h1>
        <p className="text-text-secondary mt-1">
          Statistical analysis powered by Python NumPy & SciPy — run via the AI Service
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="card p-5 space-y-4">
          <h2 className="font-semibold text-text-primary">Input Data</h2>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">JSON array of numbers</label>
            <textarea
              value={rawData}
              onChange={(e) => setRawData(e.target.value)}
              className="input font-mono text-xs h-32 resize-none"
              placeholder="[1, 5, 23, 44, 100, 73, 12, ...]"
            />
          </div>
          <button onClick={computeStats} disabled={loading} className="btn-primary w-full">
            {loading ? 'Computing…' : 'Compute Statistics'}
          </button>
          <button
            className="btn-secondary w-full text-xs"
            onClick={() => setRawData(JSON.stringify(Array.from({ length: 50 }, () => Math.floor(Math.random() * 200))))}
          >
            Generate sample data
          </button>
        </div>

        {/* Statistics results */}
        <div className="card p-5">
          <h2 className="font-semibold text-text-primary mb-4">Statistics</h2>
          {!stats ? (
            <div className="text-center py-8 text-text-muted text-sm">Run analysis to see results</div>
          ) : (
            <div className="space-y-2 text-sm">
              {[
                ['Count', stats.count],
                ['Mean', stats.mean?.toFixed(4)],
                ['Median', stats.median?.toFixed(4)],
                ['Std Dev', stats.std?.toFixed(4)],
                ['Min', stats.min],
                ['Max', stats.max],
                ['Q1 (25%)', stats.q1?.toFixed(4)],
                ['Q3 (75%)', stats.q3?.toFixed(4)],
                ['IQR', stats.iqr?.toFixed(4)],
                ['Skewness', stats.skewness?.toFixed(4)],
                ['Kurtosis', stats.kurtosis?.toFixed(4)],
                ['P90', stats.percentile_90?.toFixed(4)],
                ['P95', stats.percentile_95?.toFixed(4)],
                ['P99', stats.percentile_99?.toFixed(4)],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between border-b border-border pb-1">
                  <span className="text-text-muted">{label}</span>
                  <span className="font-mono text-text-primary">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        <div className="card p-5">
          <h2 className="font-semibold text-text-primary mb-4">Distribution</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2D3149" />
              <XAxis dataKey="i" hide />
              <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <Tooltip
                contentStyle={{ background: '#1A1D26', border: '1px solid #2D3149', borderRadius: 6 }}
                labelStyle={{ color: '#94A3B8', fontSize: 11 }}
                itemStyle={{ color: '#6366F1' }}
              />
              <Bar dataKey="value" fill="#6366F1" radius={[2, 2, 0, 0]} opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Time series demo */}
      <div className="card p-5">
        <h2 className="font-semibold text-text-primary mb-4">Sample Time Series</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={Array.from({ length: 30 }, (_, i) => ({
            t: i,
            value: 50 + Math.sin(i * 0.4) * 20 + (Math.random() - 0.5) * 10,
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2D3149" />
            <XAxis dataKey="t" stroke="#475569" tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <YAxis stroke="#475569" tick={{ fontSize: 11, fill: '#94A3B8' }} />
            <Tooltip
              contentStyle={{ background: '#1A1D26', border: '1px solid #2D3149', borderRadius: 6 }}
              itemStyle={{ color: '#8B5CF6' }}
            />
            <Line type="monotone" dataKey="value" stroke="#8B5CF6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
