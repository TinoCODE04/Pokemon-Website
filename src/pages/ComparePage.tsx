import { useQueries } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { ArrowRight, GitCompareArrows, Plus, Trash2, Trophy, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPokemon } from '../api/pokemon'
import type { Pokemon } from '../api/types'
import { StatRadarChart, pokemonToRadarSeries } from '../components/charts/StatRadarChart'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { EmptyState, SectionHeading } from '../components/ui/Feedback'
import { MAX_COMPARE, typeStyle } from '../constants/types'
import { useCompare } from '../store/AppContext'
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
        <EmptyState
          icon={<GitCompareArrows className="h-6 w-6" />}
          title="Your compare list is empty"
          message="Tap the compare icon on any Pokémon card, or start from the Pokédex."
          action={
            <Link
              to="/pokedex"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              Browse Pokédex
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
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
          {compare.length < MAX_COMPARE && (
            <Link
              to="/pokedex"
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-500 dark:border-white/15 dark:text-slate-300"
            >
              <Plus className="h-4 w-4" />
              Add another
            </Link>
          )}
          <button
            onClick={clearCompare}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Clear
          </button>
        </div>
      </div>

      {/* Headers */}
      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${Math.max(pokemon.length, 2)}, minmax(0, 1fr))` }}
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
          <Link
            to="/pokedex"
            className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-200 p-5 text-sm font-semibold text-slate-400 transition hover:border-brand-400 hover:text-brand-500 dark:border-white/10"
          >
            <Plus className="h-6 w-6" />
            Add a Pokémon
          </Link>
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