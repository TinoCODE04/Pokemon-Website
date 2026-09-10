import {
  ArrowRight,
  Bomb,
  Brain,
  CloudSun,
  Coins,
  Dna,
  Eye,
  Feather,
  Flame,
  Gauge,
  Gem,
  Ghost,
  HeartPulse,
  Leaf,
  Link2,
  Orbit,
  PackageOpen,
  PartyPopper,
  Search,
  SearchX,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Swords,
  Target,
  Waves,
  Wind,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Pagination } from '../components/filters/Pagination'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback'
import { useAbilityList } from '../hooks/queries'
import { useDebounce } from '../hooks/useDebounce'
import { abilityCategory, type AbilityCategory } from '../utils/abilityCategory'
import { cn } from '../utils/cn'
import { formatName } from '../utils/format'

const PAGE_SIZE = 48
const LETTERS = ['all', ...'abcdefghijklmnopqrstuvwxyz'] as const

const ABILITY_VISUALS: Record<AbilityCategory, { icon: LucideIcon; tone: string }> = {
  fire: { icon: Flame, tone: 'bg-orange-500/10 text-orange-500 ring-orange-500/15' },
  water: { icon: Waves, tone: 'bg-sky-500/10 text-sky-500 ring-sky-500/15' },
  electric: { icon: Zap, tone: 'bg-amber-400/10 text-amber-500 ring-amber-500/15' },
  nature: { icon: Leaf, tone: 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/15' },
  ice: { icon: Snowflake, tone: 'bg-cyan-500/10 text-cyan-500 ring-cyan-500/15' },
  offense: { icon: Swords, tone: 'bg-red-500/10 text-red-500 ring-red-500/15' },
  defense: { icon: ShieldCheck, tone: 'bg-blue-500/10 text-blue-500 ring-blue-500/15' },
  speed: { icon: Gauge, tone: 'bg-violet-500/10 text-violet-500 ring-violet-500/15' },
  recovery: { icon: HeartPulse, tone: 'bg-rose-500/10 text-rose-500 ring-rose-500/15' },
  sensory: { icon: Eye, tone: 'bg-indigo-500/10 text-indigo-500 ring-indigo-500/15' },
  weather: { icon: CloudSun, tone: 'bg-slate-500/10 text-slate-500 ring-slate-500/15 dark:text-slate-300' },
  mental: { icon: Brain, tone: 'bg-fuchsia-500/10 text-fuchsia-500 ring-fuchsia-500/15' },
  item: { icon: PackageOpen, tone: 'bg-lime-500/10 text-lime-600 ring-lime-500/15 dark:text-lime-400' },
  trap: { icon: Target, tone: 'bg-orange-500/10 text-orange-600 ring-orange-500/15 dark:text-orange-400' },
  mobility: { icon: Wind, tone: 'bg-teal-500/10 text-teal-500 ring-teal-500/15' },
  ghost: { icon: Ghost, tone: 'bg-purple-500/10 text-purple-500 ring-purple-500/15' },
  explosive: { icon: Bomb, tone: 'bg-red-500/10 text-red-500 ring-red-500/15' },
  bond: { icon: Link2, tone: 'bg-pink-500/10 text-pink-500 ring-pink-500/15' },
  celebration: { icon: PartyPopper, tone: 'bg-amber-500/10 text-amber-500 ring-amber-500/15' },
  special: { icon: Sparkles, tone: 'bg-brand-500/10 text-brand-500 ring-brand-500/15' },
}

const ABILITY_ICON_OVERRIDES: Partial<Record<string, LucideIcon>> = {
  adaptability: Dna,
  'beads-of-ruin': Gem,
  'big-pecks': Feather,
  'black-hole': Orbit,
  bonanza: Coins,
}

export default function AbilitiesPage() {
  const { data, isLoading, isError, refetch } = useAbilityList()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 200)
  const [letter, setLetter] = useState<(typeof LETTERS)[number]>('all')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!data) return []
    const q = debounced.trim().toLowerCase()
    const searched = q ? data.results.filter((ability) => ability.name.includes(q)) : data.results
    const list = letter === 'all'
      ? searched
      : searched.filter((ability) => ability.name.startsWith(letter))
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [data, debounced, letter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageItems = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  if (isError) {
    return (
      <div className="container-app py-10">
        <ErrorState message="Could not load abilities." onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <div className="container-app py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Abilities</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Passive traits that shape how a Pokémon battles — from Intimidate to Levitate.
            {data && ` ${filtered.length.toLocaleString()} abilities shown.`}
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setLetter('all')
              setPage(1)
            }}
            placeholder="Search abilities…"
            className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5"
          />
        </div>
      </div>

      <div className="mb-6 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 dark:border-white/10 dark:bg-white/[0.03]" aria-label="Filter abilities by first letter">
        <div className="flex min-w-max gap-1 xl:grid xl:min-w-0 xl:grid-cols-[repeat(27,minmax(0,1fr))]">
          {LETTERS.map((item) => {
            const active = letter === item
            return (
              <button
                key={item}
                type="button"
                aria-pressed={active}
                onClick={() => {
                  setLetter(item)
                  setPage(1)
                }}
                className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-bold uppercase transition xl:min-w-0 xl:px-0 ${
                  active
                    ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                    : 'border-transparent text-slate-500 hover:bg-slate-100 hover:text-brand-500 dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-brand-300'
                }`}
              >
                {item}
              </button>
            )
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 20 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="No abilities found"
          message={debounced
            ? `Nothing matches "${debounced}".`
            : `No abilities begin with "${letter.toUpperCase()}".`}
        />
      ) : (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map((ability) => {
              const visual = ABILITY_VISUALS[abilityCategory(ability.name)]
              const AbilityIcon = ABILITY_ICON_OVERRIDES[ability.name] ?? visual.icon
              return (
                <Link
                  key={ability.name}
                  to={`/abilities/${ability.name}`}
                  className="card-surface group relative flex min-h-14 items-center gap-3 overflow-hidden px-4 py-2.5 transition hover:-translate-y-0.5 hover:border-brand-500/30 hover:shadow-md"
                >
                  <span className="absolute left-0 top-1/2 h-0 w-1 -translate-y-1/2 rounded-r-full bg-brand-500 transition-all duration-200 group-hover:h-7" aria-hidden />
                  <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset transition-transform group-hover:scale-105', visual.tone)} aria-hidden>
                    <AbilityIcon className="h-[18px] w-[18px]" strokeWidth={2} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-bold capitalize">{formatName(ability.name)}</p>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-500 dark:text-slate-600" />
                </Link>
              )
            })}
          </div>
          <Pagination
            page={safePage}
            totalPages={totalPages}
            onChange={(p) => {
              setPage(p)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </>
      )}
    </div>
  )
}
