import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Loader2, Search, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractId } from '../../api/pokeapi'
import { useAllPokemon } from '../../hooks/queries'
import { useDebounce } from '../../hooks/useDebounce'
import { artworkUrl, formatDexNumber, formatName } from '../../utils/format'

interface SearchEntry {
  id: number
  name: string
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const navigate = useNavigate()
  const { data, isLoading } = useAllPokemon()
  const debounced = useDebounce(query, 120)

  const entries = useMemo<SearchEntry[]>(() => {
    if (!data) return []
    return data.results.map((r) => ({ id: extractId(r), name: r.name }))
  }, [data])

  const results = useMemo(() => {
    const q = debounced.trim().toLowerCase()
    if (!q) return []
    const numeric = /^\d+$/.test(q) ? Number(q) : null
    const starts: SearchEntry[] = []
    const contains: SearchEntry[] = []
    for (const e of entries) {
      if (numeric !== null && e.id === numeric) {
        starts.push(e)
        continue
      }
      if (e.name.startsWith(q)) starts.push(e)
      else if (e.name.includes(q)) contains.push(e)
      if (starts.length + contains.length > 200) break
    }
    return [...starts, ...contains].slice(0, 8)
  }, [debounced, entries])

  useEffect(() => {
    if (open) {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      setQuery('')
      setActiveIndex(0)
      document.body.style.overflow = 'hidden'
      // wait for mount before focusing
      window.setTimeout(() => inputRef.current?.focus(), 30)
    }
    return () => {
      document.body.style.overflow = ''
      previousFocusRef.current?.focus()
    }
  }, [open])

  useEffect(() => setActiveIndex(0), [debounced])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'Tab') {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
          ) ?? [],
        )
        if (focusable.length > 0) {
          const first = focusable[0]
          const last = focusable[focusable.length - 1]
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((i) => Math.min(i + 1, results.length - 1))
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((i) => Math.max(i - 1, 0))
      }
      if (e.key === 'Enter' && results[activeIndex]) {
        go(results[activeIndex])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, results, activeIndex])

  const go = (entry: SearchEntry) => {
    onClose()
    navigate(`/pokemon/${entry.id}`)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            ref={dialogRef}
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.16 }}
            className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-night-900"
            role="dialog"
            aria-modal="true"
            aria-label="Search Pokémon"
          >
            <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-white/10">
              <Search className="h-5 w-5 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or number…"
                className="h-14 flex-1 bg-transparent text-base outline-none placeholder:text-slate-400"
              />
              {isLoading && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
              <button
                onClick={onClose}
                className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/10"
                aria-label="Close search"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto p-2">
              <p className="sr-only" aria-live="polite">
                {query.trim() ? `${results.length} search results` : 'Enter a name or number to search'}
              </p>
              {query.trim() === '' && (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  Start typing to search across every Pokémon.
                </p>
              )}
              {query.trim() !== '' && results.length === 0 && !isLoading && (
                <p className="px-3 py-6 text-center text-sm text-slate-400">
                  No Pokémon found for &ldquo;{query}&rdquo;.
                </p>
              )}
              {results.map((entry, i) => (
                <button
                  key={entry.id}
                  onClick={() => go(entry)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    i === activeIndex ? 'bg-brand-500/10 dark:bg-brand-500/15' : ''
                  }`}
                >
                  <img
                    src={artworkUrl(entry.id)}
                    alt=""
                    loading="lazy"
                    onError={(e) => {
                      const el = e.currentTarget
                      if (!el.dataset.fallback) {
                        el.dataset.fallback = '1'
                        el.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${entry.id}.png`
                      } else {
                        el.onerror = null
                        el.src = '/favicon.svg'
                      }
                    }}
                    className="h-10 w-10 shrink-0 rounded-lg bg-slate-100 object-contain p-0.5 dark:bg-white/5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold capitalize">{formatName(entry.name)}</p>
                    <p className="font-mono text-xs text-slate-400">{formatDexNumber(entry.id)}</p>
                  </div>
                  <ArrowRight
                    className={`h-4 w-4 shrink-0 transition ${
                      i === activeIndex ? 'text-brand-500' : 'text-slate-300 dark:text-slate-600'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-400 dark:border-white/10">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans dark:border-white/10 dark:bg-white/5">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans dark:border-white/10 dark:bg-white/5">↵</kbd>
                open
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans dark:border-white/10 dark:bg-white/5">esc</kbd>
                close
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
