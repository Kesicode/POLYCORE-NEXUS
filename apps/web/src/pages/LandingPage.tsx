import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Play, BarChart2, Cpu, Brain, Globe, ChevronRight, Github, Shield, Terminal } from 'lucide-react'

const CODE_EXAMPLES = [
  { lang: 'Python', color: '#3776AB', code: `def fibonacci(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

print(fibonacci(50))  # 12586269025` },
  { lang: 'Rust', color: '#CE412B', code: `fn fibonacci(n: u64) -> u64 {
    let (mut a, mut b) = (0u64, 1u64);
    for _ in 0..n {
        (a, b) = (b, a + b);
    }
    a
}

fn main() {
    println!("{}", fibonacci(50));
}` },
  { lang: 'Go', color: '#00ADD8', code: `package main

import "fmt"

func fibonacci(n int) int {
    a, b := 0, 1
    for i := 0; i < n; i++ {
        a, b = b, a+b
    }
    return a
}

func main() {
    fmt.Println(fibonacci(50))
}` },
]

const FEATURES = [
  { icon: Globe, title: '25+ Languages', desc: 'Python, Go, Rust, C++, Java, TypeScript, R, Julia, and more — all in one platform.' },
  { icon: Shield, title: 'Secure Execution', desc: 'Every code run is isolated in a Docker container with strict CPU, memory, and network limits.' },
  { icon: Brain, title: 'AI Assistant', desc: 'Explain, analyze, and optimize code with Gemini, OpenAI, or Anthropic AI — with graceful fallback.' },
  { icon: BarChart2, title: 'PolyBenchmark', desc: 'Compare performance of equivalent algorithms across multiple languages with measured results.' },
  { icon: Cpu, title: 'IoT Command Center', desc: 'Connect ESP32 devices, receive sensor telemetry via MQTT, and visualize real-time data.' },
  { icon: Terminal, title: 'Developer Workspace', desc: 'Monaco editor, file explorer, integrated terminal, and real-time execution streaming.' },
]

const LANGUAGES = [
  { name: 'Python', color: '#3776AB' }, { name: 'Go', color: '#00ADD8' },
  { name: 'Rust', color: '#CE412B' }, { name: 'TypeScript', color: '#3178C6' },
  { name: 'C++', color: '#00599C' }, { name: 'Java', color: '#ED8B00' },
  { name: 'R', color: '#276DC3' }, { name: 'Julia', color: '#9558B2' },
  { name: 'C#', color: '#512BD4' }, { name: 'Swift', color: '#F05138' },
  { name: 'Kotlin', color: '#7F52FF' }, { name: 'Dart', color: '#0175C2' },
  { name: 'Elixir', color: '#6E4A7E' }, { name: 'Haskell', color: '#5D4F85' },
  { name: 'Ruby', color: '#CC342D' }, { name: 'PHP', color: '#777BB4' },
  { name: 'Lua', color: '#000080' }, { name: 'Zig', color: '#F7A41D' },
  { name: 'C', color: '#A8B9CC' }, { name: 'Assembly', color: '#6E4C13' },
]

export default function LandingPage() {
  const [codeIdx, setCodeIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setCodeIdx((i) => (i + 1) % CODE_EXAMPLES.length), 4000)
    return () => clearInterval(t)
  }, [])

  const example = CODE_EXAMPLES[codeIdx]

  return (
    <div className="min-h-screen bg-surface text-text-primary">
      {/* Navbar */}
      <nav className="border-b border-border bg-panel/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-text-primary">PolyCore Nexus</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/docs" className="text-sm text-text-secondary hover:text-text-primary transition-colors">Docs</Link>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm text-text-secondary hover:text-text-primary transition-colors">GitHub</a>
            <Link to="/login" className="btn-secondary text-sm px-3 py-1.5">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-3 py-1.5">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-20 pb-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-6">
              <Zap className="w-3 h-3" />
              25+ Languages • Secure Execution • AI-Powered
            </div>
            <h1 className="text-5xl font-bold text-text-primary leading-tight mb-4">
              PolyCore <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">Nexus</span>
            </h1>
            <p className="text-xl text-text-secondary mb-4 font-medium">
              One Platform. Many Languages. One Engineering Ecosystem.
            </p>
            <p className="text-text-secondary mb-8 leading-relaxed">
              A unified polyglot engineering platform where every language owns a real responsibility.
              Write, run, benchmark, and analyze code across 25+ languages with AI assistance, IoT integration, and real-time monitoring.
            </p>
            <div className="flex items-center gap-3">
              <Link to="/register" className="btn-primary flex items-center gap-2 px-6 py-3">
                <Play className="w-4 h-4" />
                Start Building
              </Link>
              <a href="https://github.com" target="_blank" rel="noreferrer" className="btn-secondary flex items-center gap-2 px-6 py-3">
                <Github className="w-4 h-4" />
                View Source
              </a>
            </div>
          </div>

          {/* Live code example */}
          <div className="card p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-panel-hover">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-status-error/60" />
                <div className="w-3 h-3 rounded-full bg-status-warning/60" />
                <div className="w-3 h-3 rounded-full bg-status-online/60" />
              </div>
              <div className="flex-1 text-center">
                <span className="text-xs font-medium px-3 py-0.5 rounded-md transition-colors duration-300"
                  style={{ color: example.color, backgroundColor: example.color + '20' }}>
                  {example.lang}
                </span>
              </div>
            </div>
            <pre className="p-5 font-mono text-sm text-text-primary bg-surface leading-relaxed overflow-x-auto min-h-[180px]">
              <code>{example.code}</code>
            </pre>
            <div className="px-4 py-3 border-t border-border bg-panel-hover flex items-center justify-between text-xs text-text-muted">
              <span>fibonacci(50)</span>
              <span className="text-status-online font-medium">→ 12586269025</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-text-primary mb-3">Everything You Need</h2>
          <p className="text-text-secondary">A complete engineering platform for polyglot development</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6 hover:border-border-light transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="font-semibold text-text-primary mb-2">{f.title}</h3>
              <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Language Ecosystem */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-text-primary mb-3">Language Ecosystem</h2>
          <p className="text-text-secondary">Every language has a real technical responsibility</p>
        </div>
        <div className="flex flex-wrap gap-3 justify-center">
          {LANGUAGES.map((lang) => (
            <div key={lang.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-panel hover:bg-panel-hover transition-colors"
              style={{ borderColor: lang.color + '40' }}>
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: lang.color }} />
              <span className="text-sm font-medium text-text-primary">{lang.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-16 border-t border-border">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-text-primary mb-4">Ready to Start?</h2>
          <p className="text-text-secondary mb-8 max-w-xl mx-auto">
            One command to start the entire platform locally with Docker Compose.
          </p>
          <pre className="inline-block bg-panel border border-border rounded-lg px-6 py-4 font-mono text-sm text-text-primary text-left mb-8">
{`git clone https://github.com/your-org/polycore-nexus
cd polycore-nexus
cp .env.example .env
docker compose up --build

# Open http://localhost:3000`}
          </pre>
          <div className="flex items-center justify-center gap-4">
            <Link to="/register" className="btn-primary flex items-center gap-2 px-6 py-3">
              Get Started Free
              <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/docs" className="btn-ghost">Read the Docs</Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-text-muted">
          <p>PolyCore Nexus — One Platform. Many Languages. One Engineering Ecosystem.</p>
          <p className="mt-1">MIT License · Built with Go, Python, Rust, TypeScript, and 25+ languages</p>
        </div>
      </footer>
    </div>
  )
}
