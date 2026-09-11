import type { MovieCategory, PokemonMovie } from '../data/movies.ts'

export type MovieCategoryFilter = MovieCategory | 'all'
export type MovieSort = 'release-asc' | 'release-desc' | 'rating-desc' | 'title-asc'

export interface MovieFilters {
  query: string
  category: MovieCategoryFilter
}

export interface MovieSearchState extends MovieFilters {
  sort: MovieSort
  page: number
}

const CATEGORIES = new Set<MovieCategoryFilter>(['all', 'animated', 'live-action', 'special', 'upcoming'])
const SORTS = new Set<MovieSort>(['release-asc', 'release-desc', 'rating-desc', 'title-asc'])
const titleCollator = new Intl.Collator('en', { sensitivity: 'base', numeric: true })

function normalizeSearch(value: string | number): string {
  return String(value)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLocaleLowerCase('en')
}

function searchableText(movie: PokemonMovie): string {
  return normalizeSearch([
    movie.title,
    ...(movie.alternateTitles ?? []),
    movie.japaneseTitle ?? '',
    movie.releaseYear,
    ...movie.featuredPokemon,
  ].join(' '))
}

export function filterMovies(movies: readonly PokemonMovie[], filters: MovieFilters): PokemonMovie[] {
  const query = normalizeSearch(filters.query.trim())
  return movies.filter(
    (movie) =>
      (filters.category === 'all' || movie.category === filters.category)
      && (!query || searchableText(movie).includes(query)),
  )
}

function dateValue(movie: PokemonMovie): number | null {
  return movie.releaseDate ? Date.parse(`${movie.releaseDate}T00:00:00Z`) : null
}

function stableTie(a: PokemonMovie, b: PokemonMovie): number {
  return (dateValue(a) ?? Number.MAX_SAFE_INTEGER) - (dateValue(b) ?? Number.MAX_SAFE_INTEGER)
    || titleCollator.compare(a.id, b.id)
}

export function sortMovies(movies: readonly PokemonMovie[], sort: MovieSort): PokemonMovie[] {
  return [...movies].sort((a, b) => {
    if (sort === 'title-asc') return titleCollator.compare(a.title, b.title) || stableTie(a, b)
    if (sort === 'rating-desc') return (b.tmdb?.rating ?? -1) - (a.tmdb?.rating ?? -1) || stableTie(a, b)

    const aDate = dateValue(a)
    const bDate = dateValue(b)
    if (aDate === null || bDate === null) {
      if (aDate === bDate) return titleCollator.compare(a.id, b.id)
      return sort === 'release-desc' ? (aDate === null ? -1 : 1) : (aDate === null ? 1 : -1)
    }

    return sort === 'release-desc'
      ? bDate - aDate || titleCollator.compare(a.id, b.id)
      : aDate - bDate || titleCollator.compare(a.id, b.id)
  })
}

export function paginateMovies(movies: readonly PokemonMovie[], requestedPage: number, pageSize: number) {
  const safePageSize = Math.max(1, Math.floor(pageSize))
  const totalItems = movies.length
  const totalPages = Math.max(1, Math.ceil(totalItems / safePageSize))
  const validPage = Number.isInteger(requestedPage) ? requestedPage : 1
  const page = Math.min(Math.max(validPage, 1), totalPages)
  return {
    items: movies.slice((page - 1) * safePageSize, page * safePageSize),
    page,
    totalPages,
    totalItems,
  }
}

export function findMovieBySlug(movies: readonly PokemonMovie[], slug: string): PokemonMovie | undefined {
  return movies.find((movie) => movie.slug === slug)
}

export function getChronologicalNeighbors(movies: readonly PokemonMovie[], slug: string) {
  const ordered = sortMovies(movies, 'release-asc')
  const index = ordered.findIndex((movie) => movie.slug === slug)
  return index < 0
    ? { previous: undefined, next: undefined }
    : { previous: ordered[index - 1], next: ordered[index + 1] }
}

export function parseMovieSearchParams(params: URLSearchParams): MovieSearchState {
  const categoryValue = params.get('category') ?? 'all'
  const sortValue = params.get('sort') ?? 'release-asc'
  const pageValue = Number(params.get('page') ?? 1)

  return {
    query: (params.get('q') ?? '').trim(),
    category: CATEGORIES.has(categoryValue as MovieCategoryFilter)
      ? categoryValue as MovieCategoryFilter
      : 'all',
    sort: SORTS.has(sortValue as MovieSort) ? sortValue as MovieSort : 'release-asc',
    page: Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1,
  }
}
