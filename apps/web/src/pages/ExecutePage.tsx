import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Loader2, ChevronDown, AlertTriangle, CheckCircle, Clock, Trash2 } from 'lucide-react'
import { languagesApi } from '@/api/languages'
import { executionsApi } from '@/api/executions'
import type { Language, Execution } from '@/types'
import { cn } from '@/utils/cn'
import toast from 'react-hot-toast'

const STARTER_CODE: Record<string, string> = {
  python: `# PolyCore Nexus — Python\nprint("Hello from Python!")\n\ndef fibonacci(n):\n    a, b = 0, 1\n    for _ in range(n):\n        a, b = b, a + b\n    return a\n\nprint(fibonacci(20))`,
  javascript: `// PolyCore Nexus — JavaScript\nconsole.log("Hello from JavaScript!")\n\nfunction fibonacci(n) {\n  let [a, b] = [0, 1]\n  for (let i = 0; i < n; i++) [a, b] = [b, a + b]\n  return a\n}\n\nconsole.log(fibonacci(20))`,
  go: `package main\n\nimport "fmt"\n\nfunc fibonacci(n int) int {\n\ta, b := 0, 1\n\tfor i := 0; i < n; i++ {\n\t\ta, b = b, a+b\n\t}\n\treturn a\n}\n\nfunc main() {\n\tfmt.Println("Hello from Go!")\n\tfmt.Println(fibonacci(20))\n}`,
  rust: `fn fibonacci(n: u64) -> u64 {\n    let (mut a, mut b) = (0, 1);\n    for _ in 0..n { (a, b) = (b, a + b); }\n    a\n}\n\nfn main() {\n    println!("Hello from Rust!");\n    println!("{}", fibonacci(20));\n}`,
}

const EDITOR_LANG: Record<string, string> = {
  python: 'python', javascript: 'javascript', typescript: 'typescript',
  go: 'go', rust: 'rust', c: 'c', cpp: 'cpp', java: 'java',
  csharp: 'csharp', ruby: 'ruby', php: 'php', lua: 'lua', r: 'r',
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    completed: 'badge-success', failed: 'badge-error', timeout: 'badge-warning',
    queued: 'badge-neutral', running: 'badge-primary', starting: 'badge-primary',
  }
  return <span className={cn('badge', map[status] || 'badge-neutral')}>{status}</span>
}

export default function ExecutePage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLang, setSelectedLang] = useState<Language | null>(null)
  const [code, setCode] = useState('')
  const [stdin, setStdin] = useState('')
  const [showStdin, setShowStdin] = useState(false)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<Execution | null>(null)
  const [history, setHistory] = useState<Execution[]>([])
  const pollRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    languagesApi.list().then(({ languages }) => {
      setLanguages(languages)
      const python = languages.find((l) => l.name === 'python') || languages[0]
      if (python) {
        setSelectedLang(python)
        setCode(STARTER_CODE[python.name] || `# Write your ${python.displayName} code here\nprint("Hello, World!")`)
      }
    })
    executionsApi.list().then(({ executions }) => setHistory(executions.slice(0, 10))).catch(() => {})
  }, [])

  const handleRun = async () => {
    if (!selectedLang || !code.trim()) return
    setRunning(true)
    setResult(null)
    try {
      const exec = await executionsApi.create({
        language: selectedLang.name,
        sourceCode: code,
        stdin: showStdin ? stdin : undefined,
      })
      setResult(exec)
      toast.success('Code queued for execution')

      // Poll until done
      const final = await executionsApi.poll(exec.id)
      setResult(final)
      setHistory((prev) => [final, ...prev].slice(0, 10))
      if (final.status === 'completed') toast.success('Execution completed!')
      else if (final.status === 'timeout') toast.error('Execution timed out')
      else toast.error('Execution failed')
    } catch (e: any) {
      toast.error(e.message || 'Failed to run code')
    } finally {
      setRunning(false)
    }
  }

  const handleLangSelect = (lang: Language) => {
    setSelectedLang(lang)
    setCode(STARTER_CODE[lang.name] || `// Write your ${lang.displayName} code here`)
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-text-primary">Code Execution</h1>
        <div className="flex items-center gap-2 text-xs text-text-muted">
          <span className="w-2 h-2 rounded-full bg-status-online inline-block" />
          Sandboxed execution — max 30s
        </div>
      </div>

      {/* Language selector */}
      <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
          <button key={lang.id}
            onClick={() => handleLangSelect(lang)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium border transition-all',
              selectedLang?.id === lang.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-panel text-text-secondary hover:border-border-light hover:text-text-primary'
            )}>
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: lang.color }} />
            {lang.displayName}
          </button>
        ))}
      </div>

      <div className="flex-1 grid lg:grid-cols-2 gap-4 min-h-0">
        {/* Editor panel */}
        <div className="card overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border">
            <span className="text-sm font-medium text-text-secondary">
              {selectedLang ? `${selectedLang.displayName} ${selectedLang.version}` : 'Select a language'}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowStdin((s) => !s)}
                className="text-xs text-text-muted hover:text-text-primary transition-colors">
                {showStdin ? 'Hide' : 'Show'} stdin
              </button>
              <button onClick={() => setCode('')} className="p-1 rounded text-text-muted hover:text-status-error transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleRun} disabled={running || !selectedLang}
                className="btn-primary flex items-center gap-1.5 px-3 py-1.5 text-xs">
                {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                {running ? 'Running…' : 'Run'}
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              language={EDITOR_LANG[selectedLang?.name || ''] || 'plaintext'}
              value={code}
              onChange={(v) => setCode(v || '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                padding: { top: 12, bottom: 12 },
                tabSize: 2,
                renderLineHighlight: 'line',
              }}
            />
          </div>
          {showStdin && (
            <div className="border-t border-border">
              <textarea value={stdin} onChange={(e) => setStdin(e.target.value)}
                className="w-full bg-surface text-text-primary font-mono text-xs p-3 h-24 resize-none outline-none"
                placeholder="Standard input (stdin)…" />
            </div>
          )}
        </div>

        {/* Output panel */}
        <div className="flex flex-col gap-3 min-h-0">
          <div className="card flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
              <span className="text-sm font-medium text-text-secondary">Output</span>
              {result && <StatusBadge status={result.status} />}
            </div>

            {!result && !running && (
              <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
                <div className="text-center">
                  <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  Click Run to execute your code
                </div>
              </div>
            )}

            {running && !result && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <Loader2 className="w-8 h-8 mx-auto mb-2 text-primary animate-spin" />
                  <p className="text-sm text-text-secondary">Executing in sandbox…</p>
                </div>
              </div>
            )}

            {result && (
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {/* Metrics */}
                {(result.wallTimeMs || result.exitCode !== undefined) && (
                  <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                    {result.exitCode !== undefined && <span>exit: {result.exitCode}</span>}
                    {result.wallTimeMs && <span><Clock className="w-3 h-3 inline mr-1" />{result.wallTimeMs}ms</span>}
                    {result.memoryBytes && <span>mem: {(result.memoryBytes / 1024).toFixed(1)}KB</span>}
                  </div>
                )}

                {/* Stdout */}
                {result.stdout && (
                  <div>
                    <div className="text-xs text-text-muted mb-1">stdout</div>
                    <pre className="bg-surface rounded p-3 text-sm font-mono text-text-primary whitespace-pre-wrap overflow-x-auto border border-border">
                      {result.stdout}
                    </pre>
                  </div>
                )}

                {/* Stderr */}
                {result.stderr && (
                  <div>
                    <div className="flex items-center gap-1 text-xs text-status-error mb-1">
                      <AlertTriangle className="w-3 h-3" /> stderr
                    </div>
                    <pre className="bg-status-error/5 border border-status-error/20 rounded p-3 text-sm font-mono text-status-error whitespace-pre-wrap overflow-x-auto">
                      {result.stderr}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* History */}
          <div className="card max-h-40 overflow-y-auto">
            <div className="px-3 py-2 border-b border-border text-xs font-medium text-text-muted">Recent runs</div>
            {history.length === 0 ? (
              <div className="p-3 text-xs text-text-muted text-center">No history yet</div>
            ) : (
              <div className="divide-y divide-border">
                {history.map((h) => (
                  <button key={h.id} onClick={() => setResult(h)}
                    className="w-full flex items-center gap-3 px-3 py-2 hover:bg-panel-hover text-left transition-colors">
                    {h.status === 'completed'
                      ? <CheckCircle className="w-3.5 h-3.5 text-status-online shrink-0" />
                      : <AlertTriangle className="w-3.5 h-3.5 text-status-error shrink-0" />
                    }
                    <span className="text-xs font-medium capitalize text-text-secondary w-20 shrink-0">{h.language}</span>
                    <span className="text-xs text-text-muted truncate flex-1 font-mono">
                      {h.sourceCode.slice(0, 40).replace(/\n/g, ' ')}
                    </span>
                    {h.wallTimeMs && <span className="text-xs text-text-muted shrink-0">{h.wallTimeMs}ms</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
