import { useQueries } from '@tanstack/react-query'
import { Film, SearchX, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getTmdbMovie, mergeTmdbMovie } from '../api/movies'
import { Pagination } from '../components/filters/Pagination'
import { MovieCard } from '../components/movies/MovieCard'
import { MovieFilters } from '../components/movies/MovieFilters'
import { TmdbAttribution } from '../components/movies/MovieRating'
import { EmptyState } from '../components/ui/Feedback'
import { MOVIES, type PokemonMovie } from '../data/movies'
import { filterMovies, paginateMovies, parseMovieSearchParams, sortMovies, type MovieCategoryFilter, type MovieSort } from '../utils/movies'

const PAGE_SIZE = 12
const STALE_TIME = 1000 * 60 * 60

export default function MoviesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const heroRef = useRef<HTMLElement>(null)
  const state = parseMovieSearchParams(searchParams)

  const filtered = useMemo(
    () => sortMovies(filterMovies(MOVIES, { query: state.query, category: state.category }), state.sort),
    [state.query, state.category, state.sort],
  )
  const pageData = useMemo(() => paginateMovies(filtered, state.page, PAGE_SIZE), [filtered, state.page])

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    let changed = false
    const rawQuery = searchParams.get('q')
    const rawCategory = searchParams.get('category')
    const rawSort = searchParams.get('sort')
    const rawPage = searchParams.get('page')

    if (rawQuery !== null && rawQuery !== state.query) {
      if (state.query) next.set('q', state.query)
      else next.delete('q')
      changed = true
    }
    if (rawCategory !== null && (state.category === 'all' || rawCategory !== state.category)) {
      next.delete('category')
      changed = true
    }
    if (rawSort !== null && (state.sort === 'release-asc' || rawSort !== state.sort)) {
      next.delete('sort')
      changed = true
    }
    if (pageData.page !== state.page || (rawPage !== null && rawPage !== String(pageData.page))) {
      if (pageData.page === 1) next.delete('page')
      else next.set('page', String(pageData.page))
      changed = true
    }
    if (!changed) return
    setSearchParams(next, { replace: true })
  }, [pageData.page, searchParams, setSearchParams, state.category, state.page, state.query, state.sort])

  const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim()
  const enrichments = useQueries({
    queries: pageData.items.map((movie) => ({
      queryKey: ['movies', 'tmdb', movie.tmdb?.mediaType ?? 'movie', movie.tmdb?.id],
      queryFn: async () => mergeTmdbMovie(
        movie,
        await getTmdbMovie(movie.tmdb!.id, token!, movie.tmdb?.mediaType ?? 'movie'),
        new Date().toISOString().slice(0, 10),
      ),
      enabled: Boolean(movie.tmdb?.id && token),
      staleTime: STALE_TIME,
      retry: 1,
    })),
  })
  const visibleMovies = pageData.items.map((movie, index) => enrichments[index]?.data ?? movie) as PokemonMovie[]

  function updateParams(values: { q?: string; category?: MovieCategoryFilter; sort?: MovieSort; page?: number }) {
    const next = new URLSearchParams(searchParams)
    if (values.q !== undefined) {
      if (values.q.trim()) next.set('q', values.q)
      else next.delete('q')
    }
    if (values.category !== undefined) {
      if (values.category === 'all') next.delete('category')
      else next.set('category', values.category)
    }
    if (values.sort !== undefined) {
      if (values.sort === 'release-asc') next.delete('sort')
      else next.set('sort', values.sort)
    }
    if (values.page !== undefined) {
      if (values.page === 1) next.delete('page')
      else next.set('page', String(values.page))
    }
    setSearchParams(next)
  }

  function changePage(page: number) {
    updateParams({ page })
    window.requestAnimationFrame(() => heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  function reset() {
    setSearchParams(new URLSearchParams())
  }

  const resetVisible = Boolean(state.query || state.category !== 'all' || state.sort !== 'release-asc')

  return (
    <div className="pb-16">
      <section ref={heroRef} className="movies-atmosphere relative overflow-hidden border-b border-white/10 py-16 text-white sm:py-20">
        <div className="container-app relative z-10">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-amber-200 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" /> Stories across generations
            </div>
            <h1 className="font-display text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Pokémon Movies</h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-200 sm:text-lg">
              Journey through animated classics, cinematic specials, and live-action adventures—from Mewtwo’s first strike to the next story on the horizon.
            </p>
            <div className="mt-7 flex items-center gap-3 text-sm font-semibold text-slate-200">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 shadow-lg shadow-brand-500/30"><Film className="h-5 w-5" /></span>
              {filtered.length} {filtered.length === 1 ? 'movie or special' : 'movies and specials'}
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 top-1/2 h-72 w-72 -translate-y-1/2 rounded-full border-[44px] border-white/[0.035] sm:right-[8%] sm:h-96 sm:w-96" />
      </section>

      <div className="container-app">
        <MovieFilters
          query={state.query}
          category={state.category}
          sort={state.sort}
          onQueryChange={(q) => updateParams({ q, page: 1 })}
          onCategoryChange={(category) => updateParams({ category, page: 1 })}
          onSortChange={(sort) => updateParams({ sort, page: 1 })}
          onReset={reset}
          resetVisible={resetVisible}
        />

        <div className="mt-10">
          {visibleMovies.length > 0 ? (
            <>
              <div className="grid grid-cols-1 gap-5 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleMovies.map((movie, index) => <MovieCard key={movie.id} movie={movie} index={index} />)}
              </div>
              <Pagination page={pageData.page} totalPages={pageData.totalPages} onChange={changePage} />
            </>
          ) : (
            <EmptyState
              icon={<SearchX className="h-6 w-6" />}
              title="No movies found"
              message="Try another title, year, featured Pokémon, or category."
              action={<button type="button" onClick={reset} className="mt-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600">Reset filters</button>}
            />
          )}
        </div>

        <div className="mt-12 border-t border-slate-200 pt-6 dark:border-white/10"><TmdbAttribution /></div>
      </div>
    </div>
  )
}
