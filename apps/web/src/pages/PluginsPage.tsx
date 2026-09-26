import { Puzzle } from 'lucide-react'

export default function PluginsPage() {
  const plugins = [
    { name: 'extra-languages', displayName: 'Extra Languages', version: '1.0.0', type: 'language', verified: true, desc: 'Adds MATLAB, Fortran, COBOL, and Prolog support via external runners.' },
    { name: 'opentelemetry', displayName: 'OpenTelemetry', version: '0.3.2', type: 'automation', verified: true, desc: 'Emit distributed traces for all executions to your OTel collector.' },
    { name: 'vscode-theme', displayName: 'VS Code Themes', version: '2.1.0', type: 'visualization', verified: false, desc: 'Import your favourite VS Code colour themes into the Monaco editor.' },
    { name: 'benchmark-exporter', displayName: 'Benchmark Exporter', version: '1.2.0', type: 'automation', verified: true, desc: 'Export benchmark results to CSV, JSON, or Prometheus exposition format.' },
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Puzzle className="w-6 h-6 text-primary" /> Plugins
        </h1>
        <p className="text-text-secondary mt-1">Extend PolyCore Nexus with community and first-party plugins</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        {plugins.map((p) => (
          <div key={p.name} className="card p-5 hover:border-border-light transition-all">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="font-semibold text-text-primary">{p.displayName}</div>
                <div className="text-xs text-text-muted font-mono mt-0.5">v{p.version}</div>
              </div>
              <div className="flex items-center gap-2">
                {p.verified && <span className="badge-success text-xs">Verified</span>}
                <span className="badge-neutral capitalize text-xs">{p.type}</span>
              </div>
            </div>
            <p className="text-sm text-text-muted">{p.desc}</p>
            <button className="btn-secondary text-xs mt-4 px-3 py-1.5">Install</button>
          </div>
        ))}
      </div>
    </div>
  )
}
