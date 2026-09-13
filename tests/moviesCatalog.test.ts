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

test('uses the official Wild Card teaser artwork in the movie catalogue', () => {
  const wildCard = MOVIES.find((movie) => movie.slug === 'pokemon-wild-card')
  assert.equal(wildCard?.posterUrl, '/movie-wild-card-poster.webp')
})

test('ships the user-provided trailer for every movie in release order', () => {
  const expected = [
    ['pokemon-the-first-movie', 'hX-NHafvY5I'],
    ['pokemon-the-movie-2000', '3uwx7tnwdCw'],
    ['pokemon-3-the-movie', 'SEqstQn0sag'],
    ['mewtwo-returns', '_VdEWS_CJDI'],
    ['pokemon-4ever', 'JRDRRhRQc0M'],
    ['pokemon-heroes', 'ZivTZFebZGY'],
    ['jirachi-wish-maker', 'eCgjWW_5SIU'],
    ['destiny-deoxys', '32k8JTOftMA'],
    ['mastermind-of-mirage-pokemon', 'wFnePZJs7Hg'],
    ['the-legend-of-thunder', 'epVPgW0E9AU'],
    ['lucario-and-the-mystery-of-mew', '7vc-FhG682E'],
    ['pokemon-ranger-and-the-temple-of-the-sea', 'jt1Ui72oBlc'],
    ['the-rise-of-darkrai', 'koKPESdDzYU'],
    ['giratina-and-the-sky-warrior', '7DliP7EX9To'],
    ['arceus-and-the-jewel-of-life', 'u0uW_J5enjU'],
    ['zoroark-master-of-illusions', '3Iy3UlYdF9U'],
    ['white-victini-and-zekrom', 'sgpqZq8KG8U'],
    ['black-victini-and-reshiram', 'pJGcJNkzWIM'],
    ['kyurem-vs-the-sword-of-justice', 'Zmd_uEHxO0Q'],
    ['genesect-and-the-legend-awakened', 'S-8sNPW9aBQ'],
    ['pokemon-origins', 'cgc81i06qwY'],
    ['diancie-and-the-cocoon-of-destruction', 'KNv6_s2Vy4I'],
    ['hoopa-and-the-clash-of-ages', 'GChQk8ixeYc'],
    ['volcanion-and-the-mechanical-marvel', 'IBbCZgQBzK4'],
    ['i-choose-you', 'r12w4iRBLp4'],
    ['the-power-of-us', '8PGsP59Io20'],
    ['detective-pikachu', 'NWLUZHzW890'],
    ['mewtwo-strikes-back-evolution', 'D0zYJ1RQ-fs'],
    ['secrets-of-the-jungle', 'ByzhuRr8StU'],
    ['the-arceus-chronicles', 'rHimPkAq5V8'],
    ['pokemon-wild-card', 'H6_jMQ6whtQ'],
  ] as const

  assert.deepEqual(MOVIES.map((movie) => [movie.slug, movie.trailer?.youtubeId]).sort(), [...expected].sort())
  assert.ok(MOVIES.every((movie) => movie.trailer?.sourceUrl.includes(movie.trailer.youtubeId)))
})

test('catalog validation rejects unsafe trailer metadata', () => {
  const invalid = [{
    ...MOVIES[0],
    trailer: { youtubeId: 'not a video id', label: 'Trailer', sourceUrl: 'http://example.com/video' },
  }]
  assert.ok(validateMovieCatalog(invalid).some((error) => error.includes('Invalid trailer')))
})

test('catalog validation rejects trailer source URLs for a different YouTube video', () => {
  const invalid = [{
    ...MOVIES[0],
    trailer: {
      youtubeId: 'abcdef12345',
      label: 'Official trailer',
      sourceUrl: 'https://www.youtube.com/watch?v=zyxwv98765',
    },
  }]
  assert.ok(validateMovieCatalog(invalid).some((error) => error.includes('Invalid trailer')))
})
