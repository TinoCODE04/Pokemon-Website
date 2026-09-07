import { useQueries, useQuery } from '@tanstack/react-query'
import { SearchX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { extractId } from '../api/pokeapi'
import { getPokemon } from '../api/pokemon'
import { getType } from '../api/types'
import { Pagination } from '../components/filters/Pagination'
import { ResetFiltersButton, SortSelect, TypeFilter, type SortOption } from '../components/filters/Filters'
import { PokemonCard, PokemonCardSkeleton, resourceToCardPokemon, toCardPokemon, type CardPokemon } from '../components/pokemon/PokemonCard'
import { PokemonGrid } from '../components/pokemon/PokemonGrid'
import { EmptyState, ErrorState } from '../components/ui/Feedback'
import { useAllPokemon } from '../hooks/queries'
import { useDebounce } from '../hooks/useDebounce'

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
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [genIndex, setGenIndex] = useState(0)
  const [sort, setSort] = useState<SortOption>('id-asc')
  const [page, setPage] = useState(1)

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
  }, [allEntries, genIndex, typeMembers, debouncedQuery, sort])

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

  // Reset to first page whenever filters change.
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, selectedTypes, genIndex, sort])

  // Keep ?q= in the URL in sync for shareable searches.
  useEffect(() => {
    const q = debouncedQuery.trim()
    setSearchParams(q ? { q } : {}, { replace: true })
  }, [debouncedQuery, setSearchParams])

  const filtersActive =
    selectedTypes.length > 0 || genIndex !== 0 || debouncedQuery.trim() !== '' || sort !== 'id-asc'

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => (prev.includes(type) ? [] : [type]))
  }

  if (allPokemon.isError) {
    return (
      <div className="container-app py-10">
        <ErrorState
          title="Could not load the Pokédex"
          message="PokéAPI might be unavailable right now."
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
              ? `${filtered.length.toLocaleString()} of ${allPokemon.data.count.toLocaleString()} Pokémon`
              : 'Loading every Pokémon…'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SortSelect value={sort} onChange={setSort} />
          <ResetFiltersButton
            visible={filtersActive}
            onClick={() => {
              setQuery('')
              setSelectedTypes([])
              setGenIndex(0)
              setSort('id-asc')
            }}
          />
        </div>
      </div>

      {/* Search + filters */}
      <div className="card-surface mb-6 space-y-4 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or number…"
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-white/5 dark:focus:bg-night-850"
              aria-label="Search Pokémon"
            />
          </div>
          <select
            value={genIndex}
            onChange={(e) => setGenIndex(Number(e.target.value))}
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
        <TypeFilter selected={selectedTypes} onToggle={toggleType} />
      </div>

      {/* Grid */}
      {allPokemon.isLoading ? (
        <PokemonGrid>
          {Array.from({ length: PAGE_SIZE }, (_, i) => (
            <PokemonCardSkeleton key={i} />
          ))}
        </PokemonGrid>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title="No Pokémon match your filters"
          message="Try a different search term, or reset the active filters."
          action={
            <button
              onClick={() => {
                setQuery('')
                setSelectedTypes([])
                setGenIndex(0)
                setSort('id-asc')
              }}
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