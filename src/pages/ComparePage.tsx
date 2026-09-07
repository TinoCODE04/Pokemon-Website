import { useQueries } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { GitCompareArrows, Plus, Search, Trash2, Trophy, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { extractId } from '../api/pokeapi'
import { getPokemon } from '../api/pokemon'
import type { Pokemon } from '../api/types'
import { StatRadarChart, pokemonToRadarSeries } from '../components/charts/StatRadarChart'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { EmptyState, SectionHeading } from '../components/ui/Feedback'
import { MAX_COMPARE, typeStyle } from '../constants/types'
import { useCompare } from '../store/AppContext'
import { useAllPokemon } from '../hooks/queries'
import { useDebounce } from '../hooks/useDebounce'
import { cn } from '../utils/cn'
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

export default function ComparePage() {
  const { compare, removeFromCompare, clearCompare } = useCompare()
  const [confirmingClear, setConfirmingClear] = useState(false)

  const queries = useQueries({
    queries: compare.map((id) => ({
      queryKey: ['pokemon', 'detail', String(id)],
      queryFn: () => getPokemon(id),
      staleTime: 1000 * 60 * 60,
    })),
  })

  const pokemon = queries.map((q) => q.data).filter((p): p is Pokemon => !!p)
  const loading = queries.some((q) => q.isPending)

  // Best value per stat row (for the winner highlight).
  const bestByStat = new Map<string, number>()
  for (const name of STAT_ORDER) {
    const values = pokemon.map(
      (p) => p.stats.find((s) => s.stat.name === name)?.base_stat ?? 0,
    )
    bestByStat.set(name, Math.max(...values))
  }
  const totals = pokemon.map((p) => p.stats.reduce((sum, s) => sum + s.base_stat, 0))
  const bestTotal = totals.length ? Math.max(...totals) : 0

  if (compare.length === 0) {
    return (
      <div className="container-app py-10">
        <SectionHeading
          title="Compare Pokémon"
          subtitle={`Pick up to ${MAX_COMPARE} Pokémon to compare their stats side by side.`}
        />
        <div className="card-surface mb-5 p-4 sm:p-5">
          <p className="mb-3 text-sm font-bold">Add your first Pokémon</p>
          <ComparePicker />
        </div>
        <EmptyState
          icon={<GitCompareArrows className="h-6 w-6" />}
          title="Your compare list is empty"
          message="Tap the compare icon on any Pokémon card, or start from the Pokédex."
          action={<Link to="/pokedex" className="mt-2 text-sm font-bold text-brand-500 hover:underline">Or browse the full Pokédex</Link>}
        />
      </div>
    )
  }

  return (
    <div className="container-app py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
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
        style={{ gridTemplateColumns: `repeat(${Math.max(pokemon.length, 2)}, minmax(220px, 1fr))` }}
      >
        {queries.map((q, i) => {
          const p = q.data
          const isTotalWinner = p && pokemon.length > 1 && totals[i] === bestTotal
          return (
            <motion.div
              key={compare[i]}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.08 }}
              className="card-surface relative flex flex-col items-center overflow-hidden p-5 text-center"
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
                aria-label={`Remove ${p ? formatName(p.name) : 'Pokémon'} from compare`}
              >
                <X className="h-4 w-4" />
              </button>
              {!p || loading ? (
                <div className="h-32 w-32 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
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
        {pokemon.length > 0 && pokemon.length < MAX_COMPARE && (
          <div className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-400 dark:border-white/10">
            <Plus className="h-6 w-6" />
            Open slot
          </div>
        )}
      </div>

      {pokemon.length >= 2 && !loading && (
        <>
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
                  {pokemon.map((p, i) => (
                    <td key={p.id} className="px-2 py-3 text-right">
                      <span
                        className={cn(
                          'inline-flex min-w-10 items-center justify-center rounded-lg px-2 py-1 font-mono text-sm font-extrabold tabular-nums',
                          pokemon.length > 1 && totals[i] === bestTotal
                            ? 'bg-brand-500 text-white'
                            : 'text-slate-700 dark:text-slate-200',
                        )}
                      >
                        {totals[i]}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>
        </>
      )}
    </div>
  )
}

function ComparePicker() {
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
        value={query}
        onChange={(event) => setQuery(event.target.value)}
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
