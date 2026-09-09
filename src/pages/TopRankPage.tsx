import { useQueries, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Crown, Info, Search, Trophy } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getPokemon } from '../api/pokemon'
import { getPokemonRankings, type PokemonRanking } from '../api/rankings'
import { Pagination } from '../components/filters/Pagination'
import { PokemonCard, PokemonCardSkeleton, toCardPokemon } from '../components/pokemon/PokemonCard'
import { PokemonGrid } from '../components/pokemon/PokemonGrid'
import { ErrorState, Skeleton } from '../components/ui/Feedback'
import { useDebounce } from '../hooks/useDebounce'
import { artworkUrl, formatDexNumber, formatName } from '../utils/format'

type RankingLimit = 50 | 100 | 200
type RankingScope = 'all' | 'default'

const PAGE_SIZE = 24
const LIMITS: RankingLimit[] = [50, 100, 200]

export default function TopRankPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialLimit = Number(searchParams.get('top'))
  const [limit, setLimit] = useState<RankingLimit>(LIMITS.includes(initialLimit as RankingLimit) ? initialLimit as RankingLimit : 100)
  const [scope, setScope] = useState<RankingScope>(searchParams.get('scope') === 'default' ? 'default' : 'all')
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const [page, setPage] = useState(Math.max(1, Number(searchParams.get('page') ?? 1) || 1))
  const debouncedQuery = useDebounce(query, 180)
  const rankingQuery = useQuery({
    queryKey: ['pokemon-rankings'],
    queryFn: getPokemonRankings,
    staleTime: Infinity,
  })

  const ranked = useMemo(() => {
    const source = rankingQuery.data ?? []
    return scope === 'default' ? source.filter((entry) => entry.isDefault) : source
  }, [rankingQuery.data, scope])

  const rankById = useMemo(
    () => new Map(ranked.map((entry, index) => [entry.id, index + 1])),
    [ranked],
  )

  const limited = useMemo(() => ranked.slice(0, limit), [limit, ranked])
  const filtered = useMemo(() => {
    const value = debouncedQuery.trim().toLowerCase()
    if (!value) return limited
    const numeric = /^\d+$/.test(value) ? Number(value) : null
    return limited.filter((entry) => entry.name.includes(value) || (numeric !== null && entry.id === numeric))
  }, [debouncedQuery, limited])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageEntries = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)
  const detailQueries = useQueries({
    queries: pageEntries.map((entry) => ({
      queryKey: ['pokemon', 'detail', String(entry.id)],
      queryFn: () => getPokemon(entry.id),
      staleTime: 1000 * 60 * 60,
    })),
  })

  useEffect(() => {
    const next = new URLSearchParams()
    next.set('top', String(limit))
    if (scope === 'default') next.set('scope', 'default')
    if (debouncedQuery.trim()) next.set('q', debouncedQuery.trim())
    if (page > 1) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [debouncedQuery, limit, page, scope, setSearchParams])

  const selectLimit = (value: RankingLimit) => {
    setLimit(value)
    setPage(1)
  }

  if (rankingQuery.isError) {
    return (
      <div className="container-app py-10">
        <ErrorState
          title="Could not load the rankings"
          message="The local PokéAPI ranking data could not be read."
          onRetry={() => rankingQuery.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="container-app py-8 sm:py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-5">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-amber-600 dark:text-amber-300">
            <Trophy className="h-3.5 w-3.5" />
            Power rankings
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Top Rank</h1>
          <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
            Discover the strongest Pokémon and forms ranked by their combined base stats.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-white/10 dark:bg-night-900 dark:text-slate-400">
          <Info className="h-4 w-4 shrink-0 text-sky-500" />
          HP + Attack + Defense + Sp. Atk + Sp. Def + Speed
        </div>
      </header>

      {rankingQuery.isLoading ? (
        <>
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-64" />)}
          </div>
          <PokemonGrid>{Array.from({ length: 18 }, (_, index) => <PokemonCardSkeleton key={index} />)}</PokemonGrid>
        </>
      ) : (
        <>
          <section className="mb-9" aria-labelledby="podium-heading">
            <div className="mb-5 flex items-center gap-2">
              <Crown className="h-5 w-5 fill-amber-400 text-amber-500" />
              <h2 id="podium-heading" className="font-display text-xl font-bold">The podium</h2>
            </div>
            <div className="grid items-end gap-4 sm:grid-cols-3">
              {ranked.slice(0, 3).map((entry) => (
                <PodiumCard key={entry.id} entry={entry} rank={rankById.get(entry.id) ?? 0} />
              ))}
            </div>
          </section>

          <section className="card-surface mb-6 p-4 sm:p-5" aria-label="Ranking controls">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Ranking size">
                {LIMITS.map((value) => (
                  <button
                    key={value}
                    onClick={() => selectLimit(value)}
                    aria-pressed={limit === value}
                    className={limit === value
                      ? 'min-h-10 rounded-full bg-brand-500 px-5 text-sm font-extrabold text-white shadow-md shadow-brand-500/20'
                      : 'min-h-10 rounded-full border border-slate-200 bg-white px-5 text-sm font-bold text-slate-600 transition hover:border-brand-300 hover:text-brand-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300'}
                  >
                    Top {value}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="relative min-w-0 sm:w-72">
                  <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <span className="sr-only">Search within the rankings</span>
                  <input
                    value={query}
                    onChange={(event) => { setQuery(event.target.value); setPage(1) }}
                    placeholder={`Search the Top ${limit}…`}
                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:focus:bg-night-850"
                  />
                </label>
                <select
                  value={scope}
                  onChange={(event) => { setScope(event.target.value as RankingScope); setPage(1) }}
                  className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5"
                  aria-label="Choose ranking scope"
                >
                  <option value="all">All forms</option>
                  <option value="default">Default forms only</option>
                </select>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 pt-4 text-sm dark:border-white/10">
              <p className="font-semibold text-slate-600 dark:text-slate-300">
                {filtered.length} ranked Pokémon shown
              </p>
              <p className="text-slate-400">Forms are ranked separately · Data from PokéAPI</p>
            </div>
          </section>

          {filtered.length === 0 ? (
            <div className="card-surface py-16 text-center">
              <Search className="mx-auto h-7 w-7 text-slate-400" />
              <h2 className="mt-3 font-display text-lg font-bold">No ranked Pokémon found</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Try another name, number, or ranking size.</p>
            </div>
          ) : (
            <>
              <PokemonGrid>
                {pageEntries.map((entry, index) => {
                  const detail = detailQueries[index]?.data
                  const pokemon = detail
                    ? toCardPokemon(detail)
                    : { id: entry.id, name: entry.name, image: artworkUrl(entry.id) }
                  return (
                    <PokemonCard
                      key={entry.id}
                      pokemon={pokemon}
                      index={index}
                      rank={rankById.get(entry.id)}
                      score={entry.total}
                    />
                  )
                })}
              </PokemonGrid>
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onChange={(value) => {
                  setPage(value)
                  window.scrollTo({ top: 560, behavior: 'smooth' })
                }}
              />
            </>
          )}
        </>
      )}
    </div>
  )
}

function PodiumCard({ entry, rank }: { entry: PokemonRanking; rank: number }) {
  const placement = rank === 1
    ? { border: 'border-amber-400/60', badge: 'bg-amber-400 text-amber-950', glow: 'from-amber-400/25', label: 'Champion' }
    : rank === 2
      ? { border: 'border-slate-300/60', badge: 'bg-slate-300 text-slate-800', glow: 'from-slate-300/20', label: 'Second' }
      : { border: 'border-orange-300/60', badge: 'bg-orange-300 text-orange-950', glow: 'from-orange-300/20', label: 'Third' }
  const stats = [
    ['HP', entry.stats.hp],
    ['ATK', entry.stats.attack],
    ['DEF', entry.stats.defense],
    ['SPA', entry.stats.specialAttack],
    ['SPD', entry.stats.specialDefense],
    ['SPE', entry.stats.speed],
  ] as const

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      className={`card-surface group relative overflow-hidden border-2 p-5 ${placement.border} ${rank === 1 ? 'sm:order-2 sm:min-h-72' : rank === 2 ? 'sm:order-1 sm:min-h-64' : 'sm:order-3 sm:min-h-64'}`}
    >
      <Link to={`/pokemon/${entry.id}`} className="absolute inset-0 z-10 rounded-2xl" aria-label={`View ${formatName(entry.name)} details`} />
      <div className={`absolute inset-0 bg-gradient-to-br ${placement.glow} to-transparent opacity-70`} />
      <div className="relative flex items-start justify-between gap-3">
        <span className={`rounded-full px-3 py-1 font-display text-sm font-extrabold ${placement.badge}`}>#{rank}</span>
        <span className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">{placement.label}</span>
      </div>
      <div className="relative mt-1 grid grid-cols-[7rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-1 sm:text-center">
        <img
          src={artworkUrl(entry.id)}
          alt={formatName(entry.name)}
          className="mx-auto h-28 w-28 object-contain drop-shadow-xl transition duration-300 group-hover:scale-110 sm:h-32 sm:w-32"
          onError={(event) => { event.currentTarget.onerror = null; event.currentTarget.src = '/favicon.svg' }}
        />
        <div>
          <p className="font-mono text-[11px] text-slate-400">{formatDexNumber(entry.id)}</p>
          <h3 className="font-display text-xl font-extrabold">{formatName(entry.name)}</h3>
          <p className="mt-1 text-sm font-bold text-brand-500">BST {entry.total}</p>
        </div>
      </div>
      <div className="relative mt-4 grid grid-cols-6 gap-1.5">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-lg bg-slate-900/5 px-1 py-2 text-center dark:bg-white/5">
            <p className="text-[9px] font-bold text-slate-400">{label}</p>
            <p className="mt-0.5 font-mono text-xs font-bold">{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
