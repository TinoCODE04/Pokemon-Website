import type { PokemonMovie, TmdbSnapshot } from '../data/movies.ts'

export const TMDB_API_BASE_URL = 'https://api.themoviedb.org/3'
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p'

export type TmdbMediaType = 'movie' | 'tv'
export type TmdbImageSize = 'w342' | 'w500' | 'w780' | 'original'

export interface TmdbMovieResponse {
  id: number
  title?: string
  name?: string
  overview?: string
  release_date?: string
  first_air_date?: string
  runtime?: number | null
  episode_run_time?: number[]
  vote_average?: number
  vote_count?: number
  poster_path?: string | null
  backdrop_path?: string | null
}

export interface TmdbVideo {
  id: string
  key: string
  name: string
  site: string
  type: string
  official?: boolean
  published_at?: string
}

export class TmdbApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'TmdbApiError'
    this.status = status
  }
}

const TMDB_PATH = /^\/[A-Za-z0-9._-]+$/

export function tmdbImageUrl(path: string | null | undefined, size: TmdbImageSize): string | undefined {
  return path && TMDB_PATH.test(path) ? `${TMDB_IMAGE_BASE_URL}/${size}${path}` : undefined
}

export function youtubeTrailerSearchUrl(title: string, releaseYear: number): string {
  const params = new URLSearchParams({ search_query: `${title} ${releaseYear} official trailer` })
  return `https://www.youtube.com/results?${params}`
}

const YOUTUBE_ID = /^[A-Za-z0-9_-]{6,20}$/

export function selectYoutubeTrailer(videos: readonly TmdbVideo[]): TmdbVideo | undefined {
  return videos
    .filter((video) => video.site === 'YouTube' && video.type === 'Trailer' && video.official === true && YOUTUBE_ID.test(video.key))
    .sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''))[0]
}

function validNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function validPositive(value: unknown): value is number {
  return validNonNegative(value) && value > 0
}

function validPath(value: unknown): value is string {
  return typeof value === 'string' && TMDB_PATH.test(value)
}

export function mergeTmdbMovie(
  movie: PokemonMovie,
  remote: TmdbMovieResponse,
  capturedAt: string,
): PokemonMovie {
  if (!movie.tmdb || remote.id !== movie.tmdb.id) {
    throw new TmdbApiError('TMDB id mismatch for curated movie record.')
  }

  const remoteRuntime = (movie.tmdb.mediaType ?? 'movie') === 'movie' && validPositive(remote.runtime)
    ? remote.runtime
    : undefined
  const snapshot: TmdbSnapshot = {
    id: movie.tmdb.id,
    mediaType: movie.tmdb.mediaType ?? 'movie',
    rating: validNonNegative(remote.vote_average) ? remote.vote_average : movie.tmdb.rating,
    voteCount: validNonNegative(remote.vote_count) ? remote.vote_count : movie.tmdb.voteCount,
    posterPath: validPath(remote.poster_path) ? remote.poster_path : movie.tmdb.posterPath,
    backdropPath: validPath(remote.backdrop_path) ? remote.backdrop_path : movie.tmdb.backdropPath,
    capturedAt,
  }

  return {
    ...movie,
    runtimeMinutes: remoteRuntime ?? movie.runtimeMinutes,
    tmdb: snapshot,
  }
}

function isTmdbMovieResponse(value: unknown): value is TmdbMovieResponse {
  return typeof value === 'object'
    && value !== null
    && Number.isInteger((value as { id?: unknown }).id)
    && Number((value as { id: number }).id) > 0
}

export async function getTmdbMovie(
  tmdbId: number,
  token: string,
  mediaType: TmdbMediaType = 'movie',
  fetcher: typeof fetch = fetch,
): Promise<TmdbMovieResponse> {
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) throw new TmdbApiError('A valid TMDB id is required.')
  if (!token.trim()) throw new TmdbApiError('A TMDB read access token is required.')

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), 12_000)
  let response: Response

  try {
    response = await fetcher(`${TMDB_API_BASE_URL}/${mediaType}/${tmdbId}?language=en-US`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new TmdbApiError('TMDB request timed out. Bundled movie data is still available.')
    }
    throw new TmdbApiError('TMDB enrichment is unavailable. Bundled movie data is still available.')
  } finally {
    globalThis.clearTimeout(timeout)
  }

  if (!response.ok) {
    if (response.status === 401) throw new TmdbApiError('TMDB authorization failed.', 401)
    if (response.status === 404) throw new TmdbApiError('TMDB movie record was not found.', 404)
    throw new TmdbApiError(`TMDB request failed (${response.status}).`, response.status)
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new TmdbApiError('TMDB returned invalid data.')
  }
  if (!isTmdbMovieResponse(data)) throw new TmdbApiError('TMDB returned invalid data.')
  return data
}

export async function getTmdbVideos(
  tmdbId: number,
  token: string,
  mediaType: TmdbMediaType = 'movie',
  fetcher: typeof fetch = fetch,
): Promise<TmdbVideo[]> {
  if (!Number.isInteger(tmdbId) || tmdbId <= 0) throw new TmdbApiError('A valid TMDB id is required.')
  if (!token.trim()) throw new TmdbApiError('A TMDB read access token is required.')

  const controller = new AbortController()
  const timeout = globalThis.setTimeout(() => controller.abort(), 12_000)
  let response: Response
  try {
    response = await fetcher(`${TMDB_API_BASE_URL}/${mediaType}/${tmdbId}/videos?language=en-US`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    })
  } catch {
    throw new TmdbApiError('TMDB trailers are unavailable.')
  } finally {
    globalThis.clearTimeout(timeout)
  }

  if (!response.ok) throw new TmdbApiError(`TMDB trailer request failed (${response.status}).`, response.status)
  const data: unknown = await response.json().catch(() => undefined)
  if (typeof data !== 'object' || data === null || !Array.isArray((data as { results?: unknown }).results)) {
    throw new TmdbApiError('TMDB returned invalid trailer data.')
  }
  return (data as { results: unknown[] }).results.filter((video): video is TmdbVideo => {
    if (typeof video !== 'object' || video === null) return false
    const item = video as Partial<TmdbVideo>
    return typeof item.id === 'string' && typeof item.key === 'string' && typeof item.name === 'string'
      && typeof item.site === 'string' && typeof item.type === 'string'
  })
}
