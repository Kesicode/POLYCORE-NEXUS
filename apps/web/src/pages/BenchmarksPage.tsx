import { BarChart2, Zap } from 'lucide-react'

export default function BenchmarksPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <BarChart2 className="w-6 h-6 text-primary" />
          PolyBenchmark
        </h1>
        <p className="text-text-secondary mt-1">
          Compare real execution performance across multiple languages with identical algorithms
        </p>
      </div>
      <div className="card p-8 text-center">
        <Zap className="w-12 h-12 text-primary mx-auto mb-4 opacity-50" />
        <h2 className="text-lg font-semibold text-text-primary mb-2">Benchmark Suite</h2>
        <p className="text-text-secondary mb-4">
          Run Fibonacci, primes, sorting, matrix operations, and Monte Carlo simulations across all active languages.
          Results show real wall-clock and memory measurements — no synthetic data.
        </p>
        <div className="grid sm:grid-cols-3 gap-4 mt-6 text-left">
          {[
            { name: 'Fibonacci (n=40)', desc: 'Recursive integer math', category: 'numeric' },
            { name: 'Sieve of Eratosthenes', desc: 'Prime number generation up to 10,000', category: 'numeric' },
            { name: 'Quicksort', desc: 'Sorting 10,000 random integers', category: 'sorting' },
            { name: 'Matrix Multiply', desc: '200×200 matrix multiplication', category: 'matrix' },
            { name: 'SHA-256 Hashing', desc: 'Hash 1,000 strings', category: 'hashing' },
            { name: 'Monte Carlo π', desc: 'Estimate π with 1M samples', category: 'statistical' },
          ].map((alg) => (
            <div key={alg.name} className="card p-4">
              <div className="text-sm font-semibold text-text-primary mb-1">{alg.name}</div>
              <div className="text-xs text-text-muted mb-2">{alg.desc}</div>
              <span className="badge-neutral capitalize text-xs">{alg.category}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-text-muted mt-6">
          Full benchmark execution requires the execution service and Docker runners to be running.
          Start with: <code className="font-mono">docker compose up</code>
        </p>
      </div>
    </div>
  )
}
