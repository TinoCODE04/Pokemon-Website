import { Search, SearchX, Zap } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { extractId } from '../api/pokeapi'
import { Pagination } from '../components/filters/Pagination'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Feedback'
import { useAbilityList } from '../hooks/queries'
import { useDebounce } from '../hooks/useDebounce'
import { formatName } from '../utils/format'

const PAGE_SIZE = 48

export default function AbilitiesPage() {
  const { data, isLoading, isError, refetch } = useAbilityList()
  const [query, setQuery] = useState('')
  const debounced = useDebounce(query, 200)
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    if (!data) return []
    const q = debounced.trim().toLowerCase()
    const list = q ? data.results.filter((a) => a.name.includes(q)) : data.results
    return [...list].sort((a, b) => a.name.localeCompare(b.name))
  }, [data, debounced])

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
              setPage(1)
            }}
            placeholder="Search abilities…"
            className="h-11 w-full rounded-full border border-slate-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 18 }, (_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="No abilities found"
          message={`Nothing matches "${debounced}".`}
        />
      ) : (
        <>
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {pageItems.map((ability) => (
              <Link
                key={ability.name}
                to={`/abilities/${ability.name}`}
                className="card-surface group flex items-center gap-3 p-4 transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white">
                  <Zap className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold capitalize">{formatName(ability.name)}</p>
                  <p className="font-mono text-[11px] text-slate-400">#{extractId(ability)}</p>
                </div>
              </Link>
            ))}
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