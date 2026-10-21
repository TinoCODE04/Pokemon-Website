import { RotateCcw, Search, X } from 'lucide-react'
import type { MovieCategoryFilter, MovieSort } from '../../utils/movies'
import { cn } from '../../utils/cn'
import { ResponsiveFilters } from '../filters/ResponsiveFilters'

const inputClass = 'h-11 rounded-xl border border-slate-200 bg-white text-sm outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-500/10 dark:border-white/10 dark:bg-night-900'

export function MovieFilters({
  query,
  category,
  sort,
  onQueryChange,
  onCategoryChange,
  onSortChange,
  onReset,
  resetVisible,
}: {
  query: string
  category: MovieCategoryFilter
  sort: MovieSort
  onQueryChange: (value: string) => void
  onCategoryChange: (value: MovieCategoryFilter) => void
  onSortChange: (value: MovieSort) => void
  onReset: () => void
  resetVisible: boolean
}) {
  const categories: { value: MovieCategoryFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'animated', label: 'Animated' },
    { value: 'live-action', label: 'Live Action' },
    { value: 'special', label: 'Specials' },
    { value: 'upcoming', label: 'Upcoming' },
  ]

  return (
    <section className="card-surface relative z-10 -mt-8 grid gap-4 p-4 shadow-lg sm:p-5" aria-label="Movie filters">
      <label className="relative block">
        <span className="sr-only">Search movies</span>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input type="search" enterKeyHint="search" value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Search title, year, or Pokémon…" className={`${inputClass} w-full pl-10 pr-12`} />
        {query && <button type="button" onClick={() => onQueryChange('')} className="absolute right-0.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-slate-500" aria-label="Clear movie search"><X size={18} /></button>}
      </label>
      <ResponsiveFilters activeCount={Number(category !== 'all') + Number(sort !== 'release-asc') + Number(Boolean(query))} summary={category !== 'all' ? categories.find((item) => item.value === category)?.label : undefined} resultsLabel="movies" onReset={onReset}>
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={category === item.value}
            onClick={() => onCategoryChange(item.value)}
            className={cn(
              'min-h-10 rounded-full border px-4 text-sm font-semibold transition',
              category === item.value
                ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
                : 'border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-500 dark:border-white/10 dark:text-slate-300',
            )}
          >
            {item.label}
          </button>
        ))}
        {resetVisible && (
          <button type="button" onClick={onReset} className="ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-brand-500 dark:hover:bg-white/5">
            <RotateCcw className="h-4 w-4" /> Reset
          </button>
        )}
      </div>
      <label className="flex max-w-xl flex-col gap-2 text-sm font-semibold">
        <span>Sort movies</span>
        <select value={sort} onChange={(event) => onSortChange(event.target.value as MovieSort)} className={`${inputClass} w-full px-4`}>
          <option value="release-asc">Release date: Oldest → Newest</option>
          <option value="release-desc">Release date: Newest → Oldest</option>
          <option value="rating-desc">Rating: High → Low</option>
          <option value="title-asc">Title: A → Z</option>
        </select>
      </label>
      </ResponsiveFilters>
    </section>
  )
}
