import assert from 'node:assert/strict'
import test from 'node:test'
import { MOVIES, validateMovieCatalog } from '../src/data/movies.ts'

test('ships the approved 31-title Pokémon movie catalogue', () => {
  assert.equal(MOVIES.length, 31)
  assert.deepEqual(
    Object.fromEntries(
      ['animated', 'live-action', 'special', 'upcoming'].map((category) => [
        category,
        MOVIES.filter((movie) => movie.category === category).length,
      ]),
    ),
    { animated: 24, 'live-action': 1, special: 5, upcoming: 1 },
  )
})

test('keeps both Victini releases as distinct records', () => {
  const victini = MOVIES.filter((movie) => movie.title.includes('Victini'))
  assert.equal(victini.length, 2)
  assert.notEqual(victini[0]?.slug, victini[1]?.slug)
})

test('contains the five approved feature-length specials', () => {
  assert.deepEqual(
    new Set(MOVIES.filter((movie) => movie.category === 'special').map((movie) => movie.title)),
    new Set([
      'Pokémon: Mewtwo Returns',
      'The Legend of Thunder!',
      'Pokémon: The Mastermind of Mirage Pokémon',
      'Pokémon Origins',
      'Pokémon: The Arceus Chronicles',
    ]),
  )
})

test('has unique identities, valid dates, source URLs, and verification dates', () => {
  assert.deepEqual(validateMovieCatalog(MOVIES), [])
  assert.equal(new Set(MOVIES.map((movie) => movie.id)).size, MOVIES.length)
  assert.equal(new Set(MOVIES.map((movie) => movie.slug)).size, MOVIES.length)
})

test('uses a title-specific Bulbapedia source for every released record', () => {
  for (const movie of MOVIES.filter((item) => item.category !== 'upcoming')) {
    const source = movie.sources.find((item) => item.kind === 'bulbapedia')
    assert.ok(source, `${movie.slug} has a Bulbapedia source`)
    assert.notEqual(source.url, 'https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_movie')
  }
})

test('ships verified direct trailers only with safe YouTube ids and HTTPS sources', () => {
  const trailers = MOVIES.flatMap((movie) => movie.trailer ? [{ slug: movie.slug, ...movie.trailer }] : [])
  assert.deepEqual(trailers.map((trailer) => trailer.slug).sort(), [
    'detective-pikachu',
    'lucario-and-the-mystery-of-mew',
    'mewtwo-strikes-back-evolution',
    'pokemon-ranger-and-the-temple-of-the-sea',
    'the-arceus-chronicles',
  ])
  assert.ok(trailers.every((trailer) => /^[A-Za-z0-9_-]{6,20}$/.test(trailer.youtubeId)))
  assert.ok(trailers.every((trailer) => trailer.sourceUrl.startsWith('https://www.youtube.com/watch?v=')))
})

test('catalog validation rejects unsafe trailer metadata', () => {
  const invalid = [{
    ...MOVIES[0],
    trailer: { youtubeId: 'not a video id', label: 'Trailer', sourceUrl: 'http://example.com/video' },
  }]
  assert.ok(validateMovieCatalog(invalid).some((error) => error.includes('Invalid trailer')))
})
