import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Search } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { extractId } from '../../api/pokeapi'
import { useAllPokemon } from '../../hooks/queries'
import { artworkUrl, formatDexNumber, formatName, spriteUrl } from '../../utils/format'
import { getPokemonSuggestions } from '../../utils/pokemonSearch'

export function HomeSearch() {
  const navigate = useNavigate()
  const { data, isPending, isError, refetch } = useAllPokemon()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [popup, setPopup] = useState({ above: false, maxHeight: 320 })
  const root = useRef<HTMLDivElement>(null)
  const list = useRef<HTMLDivElement>(null)
  const composing = useRef(false)
  const listId = useId()
  const entries = useMemo(() => data?.results.map(entry => ({ id: extractId(entry), name: entry.name })) ?? [], [data])
  const results = useMemo(() => getPokemonSuggestions(entries, query), [entries, query])
  const showSuggestions = open && query.trim().length > 0
  const active = showSuggestions ? results[activeIndex] : undefined
  const activeId = active ? `${listId}-${active.id}` : undefined
  const updatePopup = useCallback(() => {
    if (!root.current) return
    const bounds = root.current.getBoundingClientRect()
    const viewport = window.visualViewport
    const viewportTop = viewport?.offsetTop ?? 0
    const height = viewport?.height ?? window.innerHeight
    const headerBottom = document.querySelector('.navbar-shell')?.closest('header')?.getBoundingClientRect().bottom ?? 0
    const top = Math.max(viewportTop, headerBottom)
    const below = viewportTop + height - bounds.bottom - 8
    const above = bounds.top - top - 8
    const desiredHeight = Math.min(320, height * 0.4)
    const showAbove = below < desiredHeight + 46 && above > below
    const maxHeight = Math.floor(Math.min(desiredHeight, Math.max(56, (showAbove ? above : below) - 46)))
    setPopup(current => current.above === showAbove && current.maxHeight === maxHeight ? current : { above: showAbove, maxHeight })
  }, [])

  useEffect(() => {
    if (!showSuggestions) return
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    updatePopup()
    document.addEventListener('pointerdown', closeOutside)
    window.addEventListener('resize', updatePopup)
    window.addEventListener('scroll', updatePopup, true)
    window.visualViewport?.addEventListener('resize', updatePopup)
    window.visualViewport?.addEventListener('scroll', updatePopup)
    return () => {
      document.removeEventListener('pointerdown', closeOutside)
      window.removeEventListener('resize', updatePopup)
      window.removeEventListener('scroll', updatePopup, true)
      window.visualViewport?.removeEventListener('resize', updatePopup)
      window.visualViewport?.removeEventListener('scroll', updatePopup)
    }
  }, [showSuggestions, updatePopup])

  useEffect(() => {
    const option = activeId ? document.getElementById(activeId) : null
    const container = list.current
    if (!option || !container) return
    if (option.offsetTop < container.scrollTop) container.scrollTop = option.offsetTop
    else if (option.offsetTop + option.offsetHeight > container.scrollTop + container.clientHeight) {
      container.scrollTop = option.offsetTop + option.offsetHeight - container.clientHeight
    }
  }, [activeId])

  const searchAll = () => {
    const value = query.trim().replace(/^#(?=\d+$)/, '')
    setOpen(false)
    navigate(value ? `/pokedex?q=${encodeURIComponent(value)}` : '/pokedex')
  }

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!composing.current) searchAll()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.nativeEvent.isComposing) return
    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
    } else if (event.key === 'Tab') {
      setOpen(false)
    } else if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && results.length) {
      event.preventDefault()
      setOpen(true)
      updatePopup()
      const direction = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex(index => !showSuggestions || index < 0
        ? (direction > 0 ? 0 : results.length - 1)
        : (index + direction + results.length) % results.length)
    } else if (event.key === 'Enter' && active) {
      event.preventDefault()
      setOpen(false)
      navigate(`/pokemon/${active.id}`)
    }
  }

  return (
    <motion.div
      ref={root}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay: 0.22 }}
      onBlur={event => {
        if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
      className="relative z-30 mt-7 max-w-xl"
    >
      <form
        role="search"
        aria-label="Home Pokémon search"
        onSubmit={submit}
        className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-xl shadow-slate-900/5 backdrop-blur focus-within:border-brand-400 dark:border-white/15 dark:bg-white/8 dark:shadow-black/20"
      >
        <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
        <input
          type="search"
          role="combobox"
          enterKeyHint="search"
          autoComplete="off"
          spellCheck={false}
          value={query}
          onChange={event => { setQuery(event.target.value); setOpen(true); setActiveIndex(-1); updatePopup() }}
          onFocus={() => { setOpen(true); setActiveIndex(-1); updatePopup() }}
          onClick={() => { setOpen(true); updatePopup() }}
          onKeyDown={onKeyDown}
          onCompositionStart={() => { composing.current = true }}
          onCompositionEnd={() => { composing.current = false }}
          placeholder="Search by name or Pokédex number"
          aria-label="Search the Pokédex"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
          aria-controls={showSuggestions ? listId : undefined}
          aria-activedescendant={activeId}
          className="h-11 min-w-0 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-slate-400"
        />
        <button
          type="submit"
          aria-label="Search the Pokédex"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-600 sm:w-auto sm:px-5"
        >
          <span className="hidden sm:inline">Search</span><ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {showSuggestions && (
        <div className={`absolute inset-x-0 z-30 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-900/15 dark:border-white/15 dark:bg-night-900 dark:shadow-black/30 ${popup.above ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
          <p className="sr-only" role="status" aria-live="polite">
            {isPending ? 'Loading Pokémon suggestions.' : isError && !data ? 'Pokémon suggestions are unavailable.' : `${results.length} suggestions available. Use the up and down arrow keys to choose.`}
          </p>
          <div ref={list} id={listId} role="listbox" aria-label="Suggested Pokémon" aria-busy={isPending} style={{ maxHeight: popup.maxHeight }} className="relative overflow-y-auto overscroll-contain p-1.5">
            {isPending && <p className="flex items-center gap-2 px-3 py-4 text-sm text-slate-600 dark:text-slate-300"><Loader2 className="h-4 w-4 animate-spin" />Loading Pokémon…</p>}
            {isError && !data && <p className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">Suggestions couldn’t load. You can still search the Pokédex.</p>}
            {!isPending && (!isError || data) && results.length === 0 && <p className="px-3 py-4 text-sm text-slate-600 dark:text-slate-300">No Pokémon found for “{query.trim()}”. Try another name or number.</p>}
            {results.map((entry, index) => (
              <button
                key={entry.id}
                id={`${listId}-${entry.id}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => { setOpen(false); navigate(`/pokemon/${entry.id}`) }}
                className={`flex min-h-14 w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors hover:bg-brand-500/10 focus-visible:bg-brand-500/10 ${index === activeIndex ? 'bg-brand-500/10 dark:bg-brand-500/15' : ''}`}
              >
                <img src={spriteUrl(entry.id)} alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" onError={event => {
                  const image = event.currentTarget
                  if (!image.dataset.fallback) { image.dataset.fallback = '1'; image.src = artworkUrl(entry.id) }
                  else if (image.dataset.fallback === '1') { image.dataset.fallback = '2'; image.src = '/favicon.svg' }
                }} />
                <span className="min-w-0 flex-1 break-words text-sm font-semibold">{formatName(entry.name)}</span>
                <span className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400">{formatDexNumber(entry.id)}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-3 dark:border-white/10">
            {isError && !data && <button type="button" onClick={() => void refetch()} className="min-h-11 px-1 text-sm font-semibold text-brand-600 dark:text-brand-300">Retry</button>}
            <button type="button" onClick={searchAll} className="ml-auto inline-flex min-h-11 items-center gap-2 px-1 text-sm font-semibold text-brand-600 dark:text-brand-300">View all results<ArrowRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}
    </motion.div>
  )
}
