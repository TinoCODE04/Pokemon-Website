import { useQueries, useQuery } from '@tanstack/react-query'
import { Search, SearchX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { extractId, PokeApiError } from '../api/pokeapi'
import { getPokemon } from '../api/pokemon'
import { getType } from '../api/types'
import { Pagination } from '../components/filters/Pagination'
import { LegendaryFilter, ResetFiltersButton, SortSelect, TypeFilter, type SortOption } from '../components/filters/Filters'
import { PokemonCard, PokemonCardSkeleton, resourceToCardPokemon, toCardPokemon, type CardPokemon } from '../components/pokemon/PokemonCard'
import { PokemonGrid } from '../components/pokemon/PokemonGrid'
import { EmptyState, ErrorState } from '../components/ui/Feedback'
import { useAllPokemon } from '../hooks/queries'
import { useDebounce } from '../hooks/useDebounce'
import { LEGENDARY_POKEMON_IDS, TYPE_ORDER, type TypeName } from '../constants/types'

const PAGE_SIZE = 24

const GENERATION_RANGES: { label: string; min: number; max: number }[] = [
  { label: 'All generations', min: 1, max: 99999 },
  { label: 'Gen I — Kanto', min: 1, max: 151 },
  { label: 'Gen II — Johto', min: 152, max: 251 },
  { label: 'Gen III — Hoenn', min: 252, max: 386 },
  { label: 'Gen IV — Sinnoh', min: 387, max: 493 },
  { label: 'Gen V — Unova', min: 494, max: 649 },
  { label: 'Gen VI — Kalos', min: 650, max: 721 },
  { label: 'Gen VII — Alola', min: 722, max: 809 },
  { label: 'Gen VIII — Galar', min: 810, max: 905 },
  { label: 'Gen IX — Paldea', min: 906, max: 1025 },
  { label: 'Alternate forms', min: 10000, max: 99999 },
]

export default function PokedexPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') ?? '')
  const debouncedQuery = useDebounce(query, 200)
  const initialType = searchParams.get('type')
  const initialGeneration = Number(searchParams.get('generation') ?? 0)
  const initialSort = searchParams.get('sort') as SortOption | null
  const initialPage = Number(searchParams.get('page') ?? 1)
  const [legendaryOnly, setLegendaryOnly] = useState(searchParams.get('legendary') === '1')
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialType && TYPE_ORDER.includes(initialType as TypeName) ? [initialType] : [],
  )
  const [genIndex, setGenIndex] = useState(
    Number.isInteger(initialGeneration) && initialGeneration >= 0 && initialGeneration < GENERATION_RANGES.length
      ? initialGeneration
      : 0,
  )
  const [sort, setSort] = useState<SortOption>(
    initialSort && ['id-asc', 'id-desc', 'name-asc', 'name-desc'].includes(initialSort)
      ? initialSort
      : 'id-asc',
  )
  const [page, setPage] = useState(Number.isInteger(initialPage) && initialPage > 0 ? initialPage : 1)

  const allPokemon = useAllPokemon()

  // When exactly one type is selected, fetch its membership to filter precisely.
  const typeFilterQuery = useQuery({
    queryKey: ['type', selectedTypes[0]],
    queryFn: () => getType(selectedTypes[0]),
    enabled: selectedTypes.length === 1,
    staleTime: Infinity,
  })

  const typeMembers = useMemo(() => {
    if (selectedTypes.length !== 1 || !typeFilterQuery.data) return null
    return new Set(typeFilterQuery.data.pokemon.map((p) => extractId(p.pokemon)))
  }, [selectedTypes, typeFilterQuery.data])

  const allEntries = useMemo(() => {
    if (!allPokemon.data) return []
    return allPokemon.data.results.map((r) => ({ id: extractId(r), name: r.name, url: r.url }))
  }, [allPokemon.data])

  const filtered = useMemo(() => {
    let list = allEntries

    const range = GENERATION_RANGES[genIndex]
    if (range && genIndex !== 0) {
      list = list.filter((e) => e.id >= range.min && e.id <= range.max)
    }

    if (legendaryOnly) {
      list = list.filter((entry) => LEGENDARY_POKEMON_IDS.has(entry.id))
    }

    if (selectedTypes.length === 1 && !typeMembers) {
      return []
    }

    if (typeMembers) {
      list = list.filter((e) => typeMembers.has(e.id))
    }

    const q = debouncedQuery.trim().toLowerCase()
    if (q) {
      const numeric = /^\d+$/.test(q) ? Number(q) : null
      list = list.filter((e) => e.name.includes(q) || (numeric !== null && e.id === numeric))
    }

    const sorted = [...list]
    switch (sort) {
      case 'id-desc':
        sorted.sort((a, b) => b.id - a.id)
        break
      case 'name-asc':
        sorted.sort((a, b) => a.name.localeCompare(b.name))
        break
      case 'name-desc':
        sorted.sort((a, b) => b.name.localeCompare(a.name))
        break
      default:
        sorted.sort((a, b) => a.id - b.id)
    }
    return sorted
  }, [allEntries, selectedTypes, genIndex, legendaryOnly, typeMembers, debouncedQuery, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageEntries = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Fetch full detail only for the visible page (cached by React Query).
  const detailQueries = useQueries({
    queries: pageEntries.map((e) => ({
      queryKey: ['pokemon', 'detail', String(e.id)],
      queryFn: () => getPokemon(e.id),
      staleTime: 1000 * 60 * 60,
    })),
  })

  const pageCards: (CardPokemon | null)[] = pageEntries.map((entry, i) => {
    const detail = detailQueries[i]?.data
    return detail ? toCardPokemon(detail) : resourceToCardPokemon(entry)
  })

  // Keep the complete view state shareable and restorable.
  useEffect(() => {
    const next = new URLSearchParams()
    const q = debouncedQuery.trim()
    if (q) next.set('q', q)
    if (selectedTypes[0]) next.set('type', selectedTypes[0])
    if (legendaryOnly) next.set('legendary', '1')
    if (genIndex > 0) next.set('generation', String(genIndex))
    if (sort !== 'id-asc') next.set('sort', sort)
    if (page > 1) next.set('page', String(page))
    setSearchParams(next, { replace: true })
  }, [debouncedQuery, selectedTypes, legendaryOnly, genIndex, sort, page, setSearchParams])

  const filtersActive =
    legendaryOnly || selectedTypes.length > 0 || genIndex !== 0 || debouncedQuery.trim() !== '' || sort !== 'id-asc'

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? [] : [type]))
    setPage(1)
  }

  const resetFilters = () => {
    setQuery('')
    setSelectedTypes([])
    setLegendaryOnly(false)
    setGenIndex(0)
    setSort('id-asc')
    setPage(1)
  }

  if (allPokemon.isError) {
    const isMissing = allPokemon.error instanceof PokeApiError && allPokemon.error.status === 404
    return (
      <div className="container-app py-10">
        <ErrorState
          title="Could not load the Pokédex"
          message={isMissing
            ? 'The Pokédex resource could not be found.'
            : 'The connection to PokéAPI failed. Check your connection and try again.'}
          onRetry={() => allPokemon.refetch()}
        />
      </div>
    )
  }

  return (
    <div className="container-app py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Pokédex</h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {allPokemon.data
              ? typeFilterQuery.isLoading
                ? 'Applying type filter…'
                : `${filtered.length.toLocaleString()} of ${allPokemon.data.count.toLocaleString()} Pokémon`
              : 'Loading every Pokémon…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SortSelect value={sort} onChange={(value) => { setSort(value); setPage(1) }} />
          <ResetFiltersButton
            visible={filtersActive}
            onClick={resetFilters}
          />
        </div>
      </div>

      {/* Search + filters */}
      <div className="card-surface mb-6 space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search by name or number…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:focus:bg-night-850"
              aria-label="Search Pokémon"
            />
          </div>
          <select
            value={genIndex}
            onChange={(e) => { setGenIndex(Number(e.target.value)); setPage(1) }}
            className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5"
            aria-label="Filter by generation"
          >
            {GENERATION_RANGES.map((g, i) => (
              <option key={g.label} value={i}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4 dark:border-white/10">
          <LegendaryFilter
            active={legendaryOnly}
            onToggle={() => { setLegendaryOnly((value) => !value); setPage(1) }}
          />
          <span className="text-sm text-slate-400">Special collection · combine with any type</span>
        </div>
        <TypeFilter selected={selectedTypes} onToggle={toggleType} />
        {selectedTypes.length === 1 && typeFilterQuery.isLoading && (
          <p className="text-sm text-slate-500 dark:text-slate-400" role="status">
            Applying the {selectedTypes[0]} type filter…
          </p>
        )}
      </div>

      {/* Grid */}
      {allPokemon.isLoading || typeFilterQuery.isLoading ? (
        <PokemonGrid>
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <PokemonCardSkeleton key={i} />
          ))}
        </PokemonGrid>
      ) : typeFilterQuery.isError ? (
        <ErrorState
          title="Could not apply this type filter"
          message="The type data could not be loaded. Try again or choose another type."
          onRetry={() => typeFilterQuery.refetch()}
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="No Pokémon match your filters"
          message="Try a different search term, or reset the active filters."
          action={
            <button
              onClick={resetFilters}
              className="mt-2 rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <>
          <PokemonGrid>
            {pageCards.map((card, i) =>
              card ? (
                <PokemonCard key={card.id} pokemon={card} index={i} />
              ) : (
                <PokemonCardSkeleton key={`sk-${i}`} />
              ),
            )}
          </PokemonGrid>
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
