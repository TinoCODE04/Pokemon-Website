import { useQueries } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { GitCompareArrows, Plus, Search, Shield, Sword, Trash2, Trophy, X, Zap } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { extractId } from '../api/pokeapi'
import { getPokemon } from '../api/pokemon'
import type { Pokemon } from '../api/types'
import { StatRadarChart, pokemonToRadarSeries } from '../components/charts/StatRadarChart'
import { Pagination } from '../components/filters/Pagination'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { SectionHeading } from '../components/ui/Feedback'
import { MAX_COMPARE, typeStyle } from '../constants/types'
import { useCompare } from '../store/AppContext'
import { useAllPokemon } from '../hooks/queries'
import { useDebounce } from '../hooks/useDebounce'
import { cn } from '../utils/cn'
import {
  getCompareColumnCount,
  getComparisonHighlights,
  getFocusRestoreTarget,
  isComparisonReady,
  isPokemonBrowserActive,
  paginateAvailablePokemon,
  shouldClosePokemonBrowser,
} from '../utils/compare'
import {
  artworkUrl,
  bestArtwork,
  formatDexNumber,
  formatHeight,
  formatName,
  formatWeight,
  statLabel,
} from '../utils/format'

const STAT_ORDER = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed']
const SERIES_COLORS = ['#e3350d', '#6390f0', '#e6b800']
const COMPARE_SEARCH_ID = 'compare-pokemon-search'
const BROWSER_PAGE_SIZE = 24

export default function ComparePage() {
  const { compare, removeFromCompare, clearCompare } = useCompare()
  const [confirmingClear, setConfirmingClear] = useState(false)
  const [browserOpen, setBrowserOpen] = useState(false)
  const browserTriggerRef = useRef<HTMLElement | null>(null)
  const closeBrowser = useCallback(() => setBrowserOpen(false), [])

  const queries = useQueries({
    queries: compare.map((id) => ({
      queryKey: ['pokemon', 'detail', String(id)],
      queryFn: () => getPokemon(id),
      staleTime: 1000 * 60 * 60,
    })),
  })

  const pokemon = queries.map((q) => q.data).filter((p): p is Pokemon => !!p)
  const comparisonReady = isComparisonReady(
    compare.length,
    pokemon.length,
    queries.some((query) => query.isError),
  )

  // Best value per stat row (for the winner highlight).
  const bestByStat = new Map<string, number>()
  for (const name of STAT_ORDER) {
    const values = pokemon.map(
      (p) => p.stats.find((s) => s.stat.name === name)?.base_stat ?? 0,
    )
    bestByStat.set(name, Math.max(...values))
  }
  const totalsById = new Map(pokemon.map((p) => [p.id, p.stats.reduce((sum, s) => sum + s.base_stat, 0)]))
  const bestTotal = pokemon.length ? Math.max(...totalsById.values()) : 0
  const highlights = comparisonReady
    ? getComparisonHighlights(pokemon.map((entry) => ({
        id: entry.id,
        name: entry.name,
        stats: {
          hp: entry.stats.find((stat) => stat.stat.name === 'hp')?.base_stat ?? 0,
          attack: entry.stats.find((stat) => stat.stat.name === 'attack')?.base_stat ?? 0,
          defense: entry.stats.find((stat) => stat.stat.name === 'defense')?.base_stat ?? 0,
          'special-attack': entry.stats.find((stat) => stat.stat.name === 'special-attack')?.base_stat ?? 0,
          'special-defense': entry.stats.find((stat) => stat.stat.name === 'special-defense')?.base_stat ?? 0,
          speed: entry.stats.find((stat) => stat.stat.name === 'speed')?.base_stat ?? 0,
        },
      })))
    : []

  if (compare.length === 0) {
    return (
      <div className="container-app py-10">
        <SectionHeading
          title="Compare Pokémon"
          subtitle={`Pick up to ${MAX_COMPARE} Pokémon to compare their stats side by side.`}
        />
        <section className="card-surface relative px-5 py-8 sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-sky-500/10 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-3xl text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
              <GitCompareArrows className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-xl font-extrabold sm:text-2xl">Choose your Pokémon</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Search for your first Pokémon, then fill the remaining slots to compare their strengths side by side.
            </p>
            <div className="mx-auto mt-6 max-w-2xl text-left">
              <ComparePicker autoFocus />
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-3" aria-label="Comparison slots">
              {Array.from({ length: MAX_COMPARE }, (_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={(event) => {
                    browserTriggerRef.current = event.currentTarget
                    setBrowserOpen(true)
                  }}
                  className="group flex min-h-28 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-4 text-slate-400 transition hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-500 dark:border-white/10 dark:bg-white/[0.025] dark:hover:border-brand-500/60"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm transition group-hover:scale-105 dark:bg-white/5">
                    <Plus className="h-4 w-4" />
                  </span>
                  <span className="mt-2 text-sm font-bold">Slot {index + 1}</span>
                  <span className="mt-0.5 text-xs">Choose Pokémon</span>
                </button>
              ))}
            </div>
            <Link
              to="/pokedex"
              className="mt-6 inline-flex min-h-10 items-center justify-center rounded-full border border-slate-200 px-5 text-sm font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-500 dark:border-white/10 dark:text-slate-300"
            >
              Browse the Pokédex
            </Link>
          </div>
        </section>
        <PokemonBrowserDialog open={browserOpen} onClose={closeBrowser} returnFocusRef={browserTriggerRef} />
      </div>
    )
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1
            tabIndex={-1}
            data-compare-focus-fallback
            className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl"
          >
            Compare Pokémon
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {compare.length} of {MAX_COMPARE} slots used — the best value in each row is highlighted.
          </p>
        </div>
        <div className="flex gap-2">
          {confirmingClear ? (
            <div className="flex items-center gap-2" role="group" aria-label="Confirm clearing comparison">
              <button
                onClick={() => setConfirmingClear(false)}
                className="min-h-10 rounded-full border border-slate-300 px-4 text-sm font-bold text-slate-600 dark:border-white/15 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={() => { clearCompare(); setConfirmingClear(false) }}
                className="min-h-10 rounded-full bg-red-500 px-4 text-sm font-bold text-white transition hover:bg-red-600"
              >
                Clear all
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingClear(true)}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-red-200 px-4 text-sm font-bold text-red-500 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      {compare.length < MAX_COMPARE && (
        <div className="card-surface mb-5 flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="shrink-0">
            <p className="text-sm font-bold">Add another Pokémon</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Search without leaving this page.</p>
          </div>
          <ComparePicker />
        </div>
      )}

      {/* Headers */}
      <div
        className="grid gap-4 overflow-x-auto pb-2"
        style={{ gridTemplateColumns: `repeat(${getCompareColumnCount(compare.length, MAX_COMPARE)}, minmax(220px, 1fr))` }}
      >
        {queries.map((q, i) => {
          const p = q.data
          const isTotalWinner = p && comparisonReady && totalsById.get(p.id) === bestTotal
          return (
            <motion.div
              key={compare[i]}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="card-surface relative flex flex-col items-center overflow-hidden p-5 text-center"
              aria-busy={q.isPending}
              style={
                p
                  ? {
                      backgroundImage: `linear-gradient(160deg, ${typeStyle(p.types[0]?.type.name ?? 'normal').soft}, transparent 55%)`,
                    }
                  : undefined
              }
            >
              <button
                onClick={() => removeFromCompare(compare[i])}
                className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500 dark:text-slate-600 dark:hover:bg-red-500/10"
                aria-label={`Remove ${p ? formatName(p.name) : formatDexNumber(compare[i])} from compare`}
              >
                <X className="h-4 w-4" />
              </button>
              {q.isPending ? (
                <div className="flex min-h-40 flex-col items-center justify-center">
                  <div className="h-28 w-28 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
                  <p className="mt-3 font-mono text-xs font-semibold text-slate-400">{formatDexNumber(compare[i])}</p>
                  <p className="mt-1 text-xs text-slate-500" role="status">Loading Pokémon…</p>
                </div>
              ) : q.isError || !p ? (
                <div className="flex min-h-40 flex-col items-center justify-center px-4 text-center">
                  <p className="font-mono text-xs font-semibold text-slate-400">{formatDexNumber(compare[i])}</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Could not load this Pokémon</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Check your connection and try again.</p>
                  <button
                    type="button"
                    onClick={() => q.refetch()}
                    className="mt-3 rounded-full bg-brand-500 px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-600"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {isTotalWinner && (
                    <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-300">
                      <Trophy className="h-3 w-3" />
                      Highest total
                    </span>
                  )}
                  <Link to={`/pokemon/${p.id}`} className="group">
                    <img
                      src={bestArtwork(p.sprites) || artworkUrl(p.id)}
                      alt={formatName(p.name)}
                      className="h-28 w-28 object-contain drop-shadow-md transition-transform group-hover:scale-110 sm:h-32 sm:w-32"
                    />
                  </Link>
                  <span className="mt-1 font-mono text-xs font-semibold text-slate-400">
                    {formatDexNumber(p.id)}
                  </span>
                  <Link
                    to={`/pokemon/${p.id}`}
                    className="font-display text-lg font-bold capitalize transition hover:text-brand-500"
                  >
                    {formatName(p.name)}
                  </Link>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {p.types.map((t) => (
                      <TypeBadge key={t.type.name} type={t.type.name} size="sm" />
                    ))}
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span>{formatHeight(p.height)}</span>
                    <span>{formatWeight(p.weight)}</span>
                  </div>
                </>
              )}
            </motion.div>
          )
        })}
        {compare.length < MAX_COMPARE && (
          <button
            type="button"
            onClick={(event) => {
              browserTriggerRef.current = event.currentTarget
              setBrowserOpen(true)
            }}
            className="group flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-400 transition hover:border-brand-400 hover:bg-brand-500/5 hover:text-brand-500 dark:border-white/10 dark:hover:border-brand-500/60"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 transition group-hover:scale-105 dark:bg-white/5">
              <Plus className="h-5 w-5" />
            </span>
            Add Pokémon
          </button>
        )}
      </div>

      {comparisonReady && (
        <>
          <section className="mt-6" aria-labelledby="comparison-highlights-heading">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 id="comparison-highlights-heading" className="font-display text-lg font-bold">At a glance</h2>
              <p className="text-xs text-slate-400">Ties include every leader</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {highlights.map((highlight, index) => {
                const Icon = [Trophy, Sword, Shield, Zap][index]
                return (
                  <div key={highlight.label} className="card-surface flex items-center gap-3 p-4">
                    <span className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl',
                      index === 0 && 'bg-amber-400/15 text-amber-500',
                      index === 1 && 'bg-red-500/10 text-red-500',
                      index === 2 && 'bg-sky-500/10 text-sky-500',
                      index === 3 && 'bg-violet-500/10 text-violet-500',
                    )}>
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">{highlight.label}</p>
                      <p className="font-display text-sm font-extrabold leading-snug text-slate-800 dark:text-slate-100">
                        {highlight.leaders.map(formatName).join(' & ')}
                      </p>
                      <p className="font-mono text-xs font-bold text-brand-500">{highlight.value}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Radar overlay */}
          <section className="card-surface mt-6 p-5 sm:p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Stat radar</h2>
            <StatRadarChart
              series={pokemon.map((p, i) =>
                pokemonToRadarSeries(p, SERIES_COLORS[i % SERIES_COLORS.length]),
              )}
            />
            <div className="mt-3 flex flex-wrap justify-center gap-4">
              {pokemon.map((p, i) => (
                <span key={p.id} className="flex items-center gap-1.5 text-xs font-semibold capitalize">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                  />
                  {formatName(p.name)}
                </span>
              ))}
            </div>
          </section>

          {/* Stat table */}
          <section className="card-surface mt-6 overflow-x-auto p-5 sm:p-6">
            <h2 className="mb-4 font-display text-lg font-bold">Base stats</h2>
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400 dark:border-white/10">
                  <th className="py-2 pr-4 font-bold">Stat</th>
                  {pokemon.map((p) => (
                    <th key={p.id} className="px-2 py-2 text-right font-bold capitalize">
                      {formatName(p.name)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {STAT_ORDER.map((name) => {
                  const best = bestByStat.get(name) ?? 0
                  return (
                    <tr
                      key={name}
                      className="border-b border-slate-50 last:border-0 dark:border-white/5"
                    >
                      <td className="py-2.5 pr-4 font-semibold text-slate-500 dark:text-slate-400">
                        {statLabel(name)}
                      </td>
                      {pokemon.map((p) => {
                        const value =
                          p.stats.find((s) => s.stat.name === name)?.base_stat ?? 0
                        const isBest = pokemon.length > 1 && value === best
                        return (
                          <td key={p.id} className="px-2 py-2.5 text-right">
                            <span
                              className={cn(
                                'inline-flex min-w-10 items-center justify-center gap-1 rounded-lg px-2 py-1 font-mono text-sm font-bold tabular-nums',
                                isBest
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-600 dark:text-slate-300',
                              )}
                            >
                              {value}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                <tr className="border-t-2 border-slate-200 dark:border-white/15">
                  <td className="py-3 pr-4 font-bold">Total</td>
                  {pokemon.map((p) => (
                    <td key={p.id} className="px-2 py-3 text-right">
                      <span
                        className={cn(
                          'inline-flex min-w-10 items-center justify-center rounded-lg px-2 py-1 font-mono text-sm font-extrabold tabular-nums',
                          pokemon.length > 1 && totalsById.get(p.id) === bestTotal
                            ? 'bg-brand-500 text-white'
                            : 'text-slate-700 dark:text-slate-200',
                        )}
                      >
                        {totalsById.get(p.id)}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>
        </>
      )}
      <PokemonBrowserDialog open={browserOpen} onClose={closeBrowser} returnFocusRef={browserTriggerRef} />
    </div>
  )
}

function PokemonBrowserDialog({
  open,
  onClose,
  returnFocusRef,
}: {
  open: boolean
  onClose: () => void
  returnFocusRef: { current: HTMLElement | null }
}) {
  const { compare, addToCompare, isFull } = useCompare()
  const allPokemon = useAllPokemon()
  const [page, setPage] = useState(1)
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)
  const active = isPokemonBrowserActive(open, isFull)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (shouldClosePokemonBrowser(open, isFull)) onClose()
  }, [open, isFull, onClose])

  useEffect(() => {
    if (!active) return
    const returnFocusTarget = returnFocusRef.current
    const previousOverflow = document.body.style.overflow
    const appRoot = document.getElementById('root')
    const previousInert = appRoot?.inert ?? false
    const previousAriaHidden = appRoot?.getAttribute('aria-hidden') ?? null
    document.body.style.overflow = 'hidden'
    if (appRoot) {
      appRoot.inert = true
      appRoot.setAttribute('aria-hidden', 'true')
    }
    window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    const handleDialogKeys = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return

      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      )
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      } else if (!dialogRef.current?.contains(document.activeElement)) {
        event.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', handleDialogKeys)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', handleDialogKeys)
      if (appRoot) {
        appRoot.inert = previousInert
        if (previousAriaHidden === null) appRoot.removeAttribute('aria-hidden')
        else appRoot.setAttribute('aria-hidden', previousAriaHidden)
      }
      window.requestAnimationFrame(() => {
        const fallback = document.querySelector<HTMLElement>('[data-compare-focus-fallback]')
          ?? document.getElementById(COMPARE_SEARCH_ID)
        getFocusRestoreTarget(returnFocusTarget, fallback)?.focus()
      })
    }
  }, [active, returnFocusRef])

  const entries = useMemo(
    () => allPokemon.data?.results.map((entry) => ({
      id: extractId(entry),
      name: entry.name,
    })) ?? [],
    [allPokemon.data],
  )
  const paged = paginateAvailablePokemon(entries, compare, page, BROWSER_PAGE_SIZE)
  const browserDetailQueries = useQueries({
    queries: active
      ? paged.items.map((entry) => ({
          queryKey: ['pokemon', 'detail', String(entry.id)],
          queryFn: () => getPokemon(entry.id),
          staleTime: 1000 * 60 * 60,
        }))
      : [],
  })

  return createPortal(
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/70 p-0 backdrop-blur-sm sm:items-center sm:p-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="pokemon-browser-title"
            className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-t-3xl border border-slate-200 bg-slate-100 shadow-2xl dark:border-white/10 dark:bg-night-950 sm:max-h-[86vh] sm:rounded-3xl"
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.18 }}
          >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 dark:border-white/10 dark:bg-night-900 sm:px-6 sm:py-5">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-500">
                  Slot {compare.length + 1} of {MAX_COMPARE}
                </p>
                <h2 id="pokemon-browser-title" className="mt-1 font-display text-xl font-extrabold sm:text-2xl">
                  Choose a Pokémon
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Browse the Pokédex and select one to add to your comparison.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 dark:border-white/10 dark:hover:bg-red-500/10"
                aria-label="Close Pokémon browser"
              >
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
              {allPokemon.isLoading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6" aria-label="Loading Pokémon">
                  {Array.from({ length: 12 }, (_, index) => (
                    <div key={index} className="h-36 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />
                  ))}
                </div>
              ) : allPokemon.isError ? (
                <div className="flex min-h-72 flex-col items-center justify-center text-center">
                  <p className="font-display text-lg font-bold">Could not load the Pokémon list</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Check your connection and try again.</p>
                  <button
                    type="button"
                    onClick={() => allPokemon.refetch()}
                    className="mt-4 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {paged.items.map((entry, index) => (
                    (() => {
                      const detailQuery = browserDetailQueries[index]
                      const detail = detailQuery?.data
                      const primaryType = detail?.types[0]?.type.name
                      const style = primaryType ? typeStyle(primaryType) : null
                      return (
                        <motion.button
                          key={entry.id}
                          type="button"
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: Math.min(index * 0.015, 0.18) }}
                          onClick={() => {
                            addToCompare(entry.id)
                            onClose()
                          }}
                          aria-label={`Select ${formatName(entry.name)} for comparison`}
                          className="group relative flex min-h-56 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm transition duration-300 hover:-translate-y-1 hover:border-brand-400 hover:shadow-xl focus:border-brand-400 dark:border-white/10 dark:bg-night-900 dark:hover:border-brand-500/60"
                          style={style ? {
                            backgroundImage: `radial-gradient(circle at 50% 38%, ${style.color}40, transparent 42%), linear-gradient(150deg, ${style.color}2e, transparent 70%)`,
                            boxShadow: `inset 0 1px 0 ${style.color}45`,
                          } : undefined}
                        >
                          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-brand-500 opacity-0 transition group-hover:opacity-100 group-focus:opacity-100" />
                          <span className="relative z-10 self-start font-mono text-xs font-bold text-slate-500 dark:text-slate-400">
                            {formatDexNumber(entry.id)}
                          </span>
                          <span className="pokemon-stage relative mx-auto mt-1 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
                            {style && (
                              <span
                                className="absolute inset-2 rounded-full opacity-55 blur-2xl transition duration-300 group-hover:scale-110 group-hover:opacity-80"
                                style={{ background: style.color }}
                              />
                            )}
                            <span className="absolute bottom-2 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full bg-slate-950/25 blur-md dark:bg-black/50" />
                            <img
                              src={detail ? bestArtwork(detail.sprites) || artworkUrl(entry.id) : artworkUrl(entry.id)}
                              alt=""
                              width="128"
                              height="128"
                              loading="lazy"
                              className="relative h-full w-full object-contain drop-shadow-[0_14px_12px_rgba(15,23,42,0.32)] transition duration-300 group-hover:-translate-y-1 group-hover:scale-110"
                              onError={(event) => {
                                event.currentTarget.onerror = null
                                event.currentTarget.src = '/favicon.svg'
                              }}
                            />
                          </span>
                          <span className="relative z-10 mt-1 font-display text-base font-extrabold capitalize text-slate-900 dark:text-white">
                            {formatName(entry.name)}
                          </span>
                          {detail ? (
                            <span className="relative z-10 mt-2 flex min-h-5 flex-nowrap justify-center gap-1">
                              {detail.types.map((type) => (
                                <TypeBadge key={type.type.name} type={type.type.name} size="sm" className="shrink-0" />
                              ))}
                            </span>
                          ) : detailQuery?.isError ? (
                            <span className="relative z-10 mt-2 text-[11px] font-semibold text-slate-400">Type unavailable</span>
                          ) : (
                            <span className="relative z-10 mt-2 h-5 w-20 animate-pulse rounded-full bg-slate-300/70 dark:bg-white/10" />
                          )}
                        </motion.button>
                      )
                    })()
                  ))}
                </div>
              )}
            </div>

            {!allPokemon.isLoading && !allPokemon.isError && (
              <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-night-900 sm:px-6">
                <div className="flex flex-col items-center justify-between gap-2 sm:flex-row">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {paged.totalItems.toLocaleString()} Pokémon available
                  </p>
                  <div className="min-w-0 max-w-full [&>nav]:mt-0">
                    <Pagination page={paged.page} totalPages={paged.totalPages} onChange={setPage} />
                  </div>
                </div>
              </footer>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}

function ComparePicker({ autoFocus = false }: { autoFocus?: boolean }) {
  const { compare, toggleCompare, isFull } = useCompare()
  const { data, isLoading, isError } = useAllPokemon()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 120)

  const results = useMemo(() => {
    const value = debounced.trim().toLowerCase()
    if (!value || !data) return []
    const numeric = /^\d+$/.test(value) ? Number(value) : null
    return data.results
      .map((entry) => ({ id: extractId(entry), name: entry.name }))
      .filter((entry) => !compare.includes(entry.id))
      .filter((entry) => entry.name.includes(value) || (numeric !== null && entry.id === numeric))
      .slice(0, 6)
  }, [compare, data, debounced])

  return (
    <div className="relative w-full sm:ml-auto sm:max-w-xl">
      <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
      <input
        id={COMPARE_SEARCH_ID}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        autoFocus={autoFocus}
        disabled={isFull}
        placeholder="Search by name or Pokédex number"
        aria-label="Search Pokémon to compare"
        className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:focus:bg-night-850"
      />
      {query.trim() && (
        <div className="absolute left-0 right-0 top-12 z-30 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-night-900" role="listbox">
          {isLoading && <p className="px-3 py-4 text-sm text-slate-500">Loading Pokémon…</p>}
          {isError && <p className="px-3 py-4 text-sm text-red-500">Search is unavailable right now.</p>}
          {!isLoading && !isError && results.length === 0 && (
            <p className="px-3 py-4 text-sm text-slate-500">No available Pokémon found.</p>
          )}
          {results.map((entry) => (
            <button
              key={entry.id}
              type="button"
              role="option"
              aria-selected="false"
              onClick={() => { toggleCompare(entry.id); setQuery('') }}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm transition hover:bg-brand-500/10 focus:bg-brand-500/10"
            >
              <img
                src={artworkUrl(entry.id)}
                alt=""
                className="h-9 w-9 object-contain"
                onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/favicon.svg' }}
              />
              <span className="flex-1 font-semibold capitalize">{formatName(entry.name)}</span>
              <span className="font-mono text-xs text-slate-400">{formatDexNumber(entry.id)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
