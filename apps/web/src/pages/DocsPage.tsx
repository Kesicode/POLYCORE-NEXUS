import { BookOpen, ExternalLink } from 'lucide-react'

const sections = [
  { title: 'Getting Started', items: ['Quick Start with Docker', 'Architecture Overview', 'Language Matrix'] },
  { title: 'API Reference', items: ['Authentication', 'Code Execution', 'Projects', 'Benchmarks', 'IoT Devices'] },
  { title: 'Language Guides', items: ['Python Runner', 'Go Runner', 'Rust Runner', 'Adding a New Language'] },
  { title: 'IoT & Devices', items: ['ESP32 Setup', 'MQTT Protocol', 'Device Simulator', 'Telemetry Dashboard'] },
  { title: 'AI Features', items: ['Code Explanation', 'Code Analysis', 'Optimization Tips', 'Provider Configuration'] },
  { title: 'Deployment', items: ['Docker Compose', 'Environment Variables', 'Security Configuration', 'Monitoring'] },
]

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8 animate-fade-in">
      <div className="text-center">
        <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-text-primary">PolyCore Nexus Documentation</h1>
        <p className="text-text-secondary mt-2">One Platform. Many Languages. One Engineering Ecosystem.</p>
      </div>

      <div className="card p-6 border-primary/30 bg-primary/5">
        <h2 className="font-semibold text-text-primary mb-2">Quick Start</h2>
        <pre className="font-mono text-sm text-text-primary bg-surface p-4 rounded border border-border overflow-x-auto">
{`git clone https://github.com/your-org/polycore-nexus
cd polycore-nexus
cp .env.example .env
# Edit .env with your settings (DB password, JWT secret, optional AI keys)
docker compose up --build

# The platform is now running:
# Frontend:       http://localhost:3000
# API Gateway:    http://localhost:8080
# AI Service:     http://localhost:8001
# Exec Service:   http://localhost:8002`}
        </pre>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <div key={section.title} className="card p-5">
            <h2 className="font-semibold text-text-primary mb-3">{section.title}</h2>
            <ul className="space-y-1.5">
              {section.items.map((item) => (
                <li key={item}>
                  <a href="#" className="text-sm text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-border-light shrink-0" />
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="card p-6 text-center">
        <h2 className="font-semibold text-text-primary mb-2">API Reference</h2>
        <p className="text-text-secondary text-sm mb-4">
          Full interactive API docs are available via Swagger UI when running in development mode.
        </p>
        <a href="http://localhost:8001/docs" target="_blank" rel="noreferrer"
          className="btn-primary inline-flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Open Swagger UI
        </a>
      </div>
    </div>
  )
}
