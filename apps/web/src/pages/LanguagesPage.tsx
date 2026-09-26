import { useState, useEffect } from 'react'
import { Globe, Search, Filter } from 'lucide-react'
import { languagesApi } from '@/api/languages'
import type { Language } from '@/types'
import { cn } from '@/utils/cn'

const CATEGORIES = ['All', 'system', 'scripting', 'functional', 'data-science', 'jvm', 'emerging', 'web', 'embedded']

export default function LanguagesPage() {
  const [languages, setLanguages] = useState<Language[]>([])
  const [filtered, setFiltered] = useState<Language[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All')

  useEffect(() => {
    languagesApi.list().then(({ languages }) => {
      setLanguages(languages)
      setFiltered(languages)
    }).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    let result = languages
    if (category !== 'All') result = result.filter((l) => l.category === category)
    if (search) result = result.filter((l) =>
      l.displayName.toLowerCase().includes(search.toLowerCase()) ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.description?.toLowerCase().includes(search.toLowerCase())
    )
    setFiltered(result)
  }, [languages, category, search])

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Globe className="w-6 h-6 text-primary" />
          Language Ecosystem
        </h1>
        <p className="text-text-secondary mt-1">
          {languages.length} languages supported — every language has a meaningful technical responsibility
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            className="input pl-9 w-56" placeholder="Search languages…" />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={cn(
                'px-3 py-1 rounded-md text-xs font-medium border transition-colors capitalize',
                category === cat
                  ? 'bg-primary/10 border-primary text-primary'
                  : 'border-border text-text-secondary hover:border-border-light hover:text-text-primary bg-panel'
              )}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Language grid */}
      {loading ? (
        <div className="text-center py-20 text-text-muted">Loading languages…</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((lang) => (
            <div key={lang.id} className="card p-4 hover:border-border-light transition-all group">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold"
                  style={{ backgroundColor: lang.color + '20', color: lang.color }}>
                  {lang.displayName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-text-primary text-sm truncate">{lang.displayName}</div>
                  <div className="text-xs text-text-muted">{lang.version}</div>
                </div>
                {lang.isExperimental && <span className="badge-warning text-xs">Beta</span>}
              </div>

              <p className="text-xs text-text-muted mb-3 line-clamp-2">{lang.description}</p>

              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="capitalize badge-neutral">{lang.category}</span>
                <div className="flex gap-2">
                  {lang.supportsCompilation && <span title="Compiled">⚙️</span>}
                  {lang.supportsMetrics && <span title="Metrics">📊</span>}
                </div>
              </div>

              {lang.fileExtensions?.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {lang.fileExtensions.slice(0, 3).map((ext) => (
                    <span key={ext} className="font-mono text-xs px-1.5 py-0.5 rounded bg-surface text-text-muted border border-border">
                      .{ext}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center py-12 text-text-muted">
          No languages match your search
        </div>
      )}
    </div>
  )
}
