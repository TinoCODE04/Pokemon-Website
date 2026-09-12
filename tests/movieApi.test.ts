import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getTmdbMovie,
  mergeTmdbMovie,
  TmdbApiError,
  tmdbImageUrl,
  type TmdbMovieResponse,
} from '../src/api/movies.ts'
import type { PokemonMovie } from '../src/data/movies.ts'

const local = {
  id: 'm01',
  slug: 'first',
  title: 'Official title',
  category: 'animated',
  releaseDate: '1999-11-10',
  releaseYear: 1999,
  runtimeMinutes: 85,
  synopsis: 'Curated synopsis',
  featuredPokemon: ['Mewtwo'],
  verifiedAt: '2026-09-12',
  sources: [{ label: 'Official', url: 'https://www.pokemon.com/', kind: 'official' }],
  tmdb: { id: 1094, rating: 6.8, voteCount: 1500, posterPath: '/old.jpg', capturedAt: '2026-09-12' },
} satisfies PokemonMovie

const response: TmdbMovieResponse = {
  id: 1094,
  title: 'Remote title',
  overview: 'Remote synopsis',
  release_date: '2000-01-01',
  runtime: 96,
  vote_average: 7.1,
  vote_count: 2000,
  poster_path: '/new.jpg',
  backdrop_path: '/back.jpg',
}

test('builds only valid TMDB CDN image URLs', () => {
  assert.equal(tmdbImageUrl('/poster.jpg', 'w500'), 'https://image.tmdb.org/t/p/w500/poster.jpg')
  assert.equal(tmdbImageUrl(undefined, 'w500'), undefined)
  assert.equal(tmdbImageUrl('https://evil.example/x.jpg', 'w500'), undefined)
})

test('merges only TMDB-owned fields and preserves curated fields', () => {
  const result = mergeTmdbMovie(local, response, '2026-09-13')
  assert.equal(result.title, 'Official title')
  assert.equal(result.synopsis, 'Curated synopsis')
  assert.equal(result.releaseYear, 1999)
  assert.equal(result.runtimeMinutes, 96)
  assert.deepEqual(result.tmdb, {
    id: 1094,
    mediaType: 'movie',
    rating: 7.1,
    voteCount: 2000,
    posterPath: '/new.jpg',
    backdropPath: '/back.jpg',
    capturedAt: '2026-09-13',
  })
})

test('ignores malformed optional TMDB fields', () => {
  const result = mergeTmdbMovie(local, {
    id: 1094,
    runtime: -5,
    vote_average: Number.NaN,
    vote_count: -1,
    poster_path: 'https://example.com/bad.jpg',
  }, '2026-09-13')
  assert.equal(result.runtimeMinutes, 85)
  assert.equal(result.tmdb?.rating, 6.8)
  assert.equal(result.tmdb?.posterPath, '/old.jpg')
})

test('rejects a TMDB response whose id does not match the curated record', () => {
  assert.throws(() => mergeTmdbMovie(local, { id: 999 }, '2026-09-13'), /TMDB id mismatch/)
})

test('requests the selected TMDB media endpoint with bearer authentication', async () => {
  const calls: { url: string; authorization: string | null }[] = []
  const fetcher: typeof fetch = async (input, init) => {
    const headers = new Headers(init?.headers)
    calls.push({ url: String(input), authorization: headers.get('Authorization') })
    return Response.json(response)
  }

  const result = await getTmdbMovie(1094, 'read-token', 'tv', fetcher)
  assert.equal(result.id, 1094)
  assert.deepEqual(calls, [{
    url: 'https://api.themoviedb.org/3/tv/1094?language=en-US',
    authorization: 'Bearer read-token',
  }])
})

test('converts TMDB HTTP failures into readable typed errors', async () => {
  const unauthorized: typeof fetch = async () => new Response('{}', { status: 401 })
  await assert.rejects(
    () => getTmdbMovie(1094, 'bad-token', 'movie', unauthorized),
    (error: unknown) => error instanceof TmdbApiError && error.status === 401 && !error.message.includes('bad-token'),
  )
})

test('rejects malformed TMDB JSON payloads', async () => {
  const malformed: typeof fetch = async () => Response.json({ title: 'Missing id' })
  await assert.rejects(() => getTmdbMovie(1094, 'read-token', 'movie', malformed), /invalid data/i)
})
