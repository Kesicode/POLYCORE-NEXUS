import Editor from '@monaco-editor/react'
import { Terminal as TerminalIcon } from 'lucide-react'

export default function TerminalPage() {
  return (
    <div className="h-[calc(100vh-8.5rem)] flex flex-col gap-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <TerminalIcon className="w-6 h-6 text-primary" /> Terminal
        </h1>
        <p className="text-text-secondary mt-1">Interactive code execution with persistent session state</p>
      </div>
      <div className="flex-1 card overflow-hidden">
        <div className="h-full bg-black rounded-lg p-4 font-mono text-sm text-green-400 overflow-y-auto">
          <div className="text-green-500 mb-2">PolyCore Nexus Terminal v1.0.0</div>
          <div className="text-gray-500 mb-4">Connected to execution sandbox · Type code below</div>
          <div>
            <span className="text-green-300">polycore</span>
            <span className="text-gray-500">@nexus</span>
            <span className="text-white">:~$ </span>
            <span className="animate-pulse">█</span>
          </div>
          <div className="mt-4 p-3 rounded border border-green-900/50 bg-green-950/20 text-xs text-green-600">
            Full WebSocket terminal coming soon. Use the Execute page for now.
          </div>
        </div>
      </div>
    </div>
  )
}
