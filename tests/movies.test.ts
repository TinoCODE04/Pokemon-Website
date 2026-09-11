import assert from 'node:assert/strict'
import test from 'node:test'
import type { PokemonMovie } from '../src/data/movies.ts'
import {
  filterMovies,
  findMovieBySlug,
  getChronologicalNeighbors,
  paginateMovies,
  parseMovieSearchParams,
  sortMovies,
} from '../src/utils/movies.ts'

const source = { label: 'Official', url: 'https://www.pokemon.com/', kind: 'official' } as const

const movies = [
  {
    id: 'm03',
    slug: 'future',
    title: 'Pokémon: Wild Card',
    category: 'upcoming',
    releaseYear: 2027,
    synopsis: 'A future adventure.',
    featuredPokemon: ['Mimikyu'],
    sources: [source],
    verifiedAt: '2026-09-12',
  },
  {
    id: 'm01',
    slug: 'first',
    title: 'Pokémon: The First Movie',
    alternateTitles: ['Mewtwo Strikes Back'],
    category: 'animated',
    releaseDate: '1999-11-10',
    releaseYear: 1999,
    synopsis: 'Mewtwo challenges Trainers.',
    featuredPokemon: ['Mewtwo', 'Mew'],
    sources: [source],
    verifiedAt: '2026-09-12',
    tmdb: { id: 1, rating: 6.9, capturedAt: '2026-09-12' },
  },
  {
    id: 'm02',
    slug: 'detective',
    title: 'POKÉMON Detective Pikachu',
    category: 'live-action',
    releaseDate: '2019-05-10',
    releaseYear: 2019,
    synopsis: 'A mystery in Ryme City.',
    featuredPokemon: ['Pikachu'],
    sources: [source],
    verifiedAt: '2026-09-12',
    tmdb: { id: 2, rating: 7.2, capturedAt: '2026-09-12' },
  },
  {
    id: 'm04',
    slug: 'special',
    title: 'Pokémon Origins',
    category: 'special',
    releaseDate: '2013-11-15',
    releaseYear: 2013,
    synopsis: 'Red explores Kanto.',
    featuredPokemon: ['Charizard'],
    sources: [source],
    verifiedAt: '2026-09-12',
  },
] satisfies PokemonMovie[]

test('searches title, alternate title, year, and featured Pokémon case-insensitively', () => {
  assert.deepEqual(filterMovies(movies, { query: 'mewtwo', category: 'all' }).map((movie) => movie.id), ['m01'])
  assert.deepEqual(filterMovies(movies, { query: '2019', category: 'all' }).map((movie) => movie.id), ['m02'])
  assert.deepEqual(filterMovies(movies, { query: 'PIKACHU', category: 'all' }).map((movie) => movie.id), ['m02'])
})

test('combines category and query filters', () => {
  assert.deepEqual(filterMovies(movies, { query: 'pokemon', category: 'live-action' }).map((movie) => movie.id), ['m02'])
})

test('sorts oldest to newest and places undated upcoming titles last', () => {
  assert.deepEqual(sortMovies(movies, 'release-asc').map((movie) => movie.id), ['m01', 'm04', 'm02', 'm03'])
})

test('sorts newest to oldest and places undated upcoming titles first', () => {
  assert.deepEqual(sortMovies(movies, 'release-desc').map((movie) => movie.id), ['m03', 'm02', 'm04', 'm01'])
})

test('sorts ratings high to low and keeps unrated titles last', () => {
  assert.deepEqual(sortMovies(movies, 'rating-desc').map((movie) => movie.id), ['m02', 'm01', 'm04', 'm03'])
})

test('sorts titles A to Z without mutating the input', () => {
  const before = movies.map((movie) => movie.id)
  assert.deepEqual(sortMovies(movies, 'title-asc').map((movie) => movie.id), ['m02', 'm04', 'm01', 'm03'])
  assert.deepEqual(movies.map((movie) => movie.id), before)
})

test('uses release date and id as deterministic sort tie breakers', () => {
  const tied = [
    { ...movies[1], id: 'b', title: 'Same', releaseDate: '2001-01-02', tmdb: { id: 8, rating: 7, capturedAt: '2026-09-12' } },
    { ...movies[1], id: 'a', title: 'Same', releaseDate: '2001-01-01', tmdb: { id: 9, rating: 7, capturedAt: '2026-09-12' } },
  ]
  assert.deepEqual(sortMovies(tied, 'rating-desc').map((movie) => movie.id), ['a', 'b'])
})

test('clamps pagination and returns stable totals', () => {
  assert.deepEqual(paginateMovies(movies, 9, 12), { items: movies, page: 1, totalPages: 1, totalItems: 4 })
  assert.deepEqual(paginateMovies(movies, -3, 2), { items: movies.slice(0, 2), page: 1, totalPages: 2, totalItems: 4 })
})

test('finds slugs and chronological neighbours', () => {
  assert.equal(findMovieBySlug(movies, 'detective')?.id, 'm02')
  assert.equal(findMovieBySlug(movies, 'missing'), undefined)
  const neighbors = getChronologicalNeighbors(movies, 'special')
  assert.equal(neighbors.previous?.id, 'm01')
  assert.equal(neighbors.next?.id, 'm02')
})

test('parses valid movie URL state', () => {
  const state = parseMovieSearchParams(new URLSearchParams('q=%20mewtwo%20&category=animated&sort=rating-desc&page=3'))
  assert.deepEqual(state, { query: 'mewtwo', category: 'animated', sort: 'rating-desc', page: 3 })
})

test('falls back from invalid movie URL state', () => {
  const state = parseMovieSearchParams(new URLSearchParams('category=wrong&sort=wrong&page=-2'))
  assert.deepEqual(state, { query: '', category: 'all', sort: 'release-asc', page: 1 })
})
