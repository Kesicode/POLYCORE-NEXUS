import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import Editor from '@monaco-editor/react'
import { useState } from 'react'

export default function ProjectEditorPage() {
  const { id } = useParams<{ id: string }>()
  const [code, setCode] = useState('// Start coding...\n')

  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col gap-3 animate-fade-in">
      <div className="flex items-center gap-3 shrink-0">
        <Link to={`/projects/${id}`} className="btn-ghost p-2">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <h1 className="text-lg font-bold text-text-primary">Project Editor</h1>
      </div>
      <div className="flex-1 card overflow-hidden">
        <Editor
          height="100%"
          defaultLanguage="python"
          value={code}
          onChange={(v) => setCode(v || '')}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: '"JetBrains Mono", monospace',
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            padding: { top: 16 },
          }}
        />
      </div>
    </div>
  )
}
