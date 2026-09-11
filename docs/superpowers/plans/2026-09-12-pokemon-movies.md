# Pokémon Movies Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete, source-attributed Pokémon Movies catalogue and detail experience with optional TMDB enrichment, deterministic filters/sorting, and resilient static fallbacks.

**Architecture:** A checked-in typed catalogue is the source of truth, pure utilities own all catalogue transformations, and a small TMDB adapter may enrich only provider-owned fields. Route pages orchestrate URL state and TanStack Query while focused movie components render the UI, keeping remote failures separate from the usable local experience.

**Tech Stack:** React 19, TypeScript 6, React Router 7, TanStack Query 5, Tailwind CSS 4, Framer Motion, Lucide React, Node test runner, TMDB v3 API.

**Spec:** `docs/superpowers/specs/2026-09-12-pokemon-movies-design.md`

## Global Constraints

- Ship exactly the 31 records listed in the approved specification unless a newer feature film is confirmed on Pokémon's official website before implementation ends.
- Source priority is Pokémon official, TMDB, Bulbapedia, Wikipedia, Wikidata, then IMDb or another reputable source only for conflict resolution.
- The Movies module must work completely without an API key; `VITE_TMDB_ACCESS_TOKEN` only enriches bundled records.
- Never commit an API token or privileged secret.
- TMDB imagery/data must include the approved attribution notice and TMDB link in the Movies credits area.
- Use the four exact requested sort labels and persist search, category, sort, and page in the URL.
- Use 12 records per page and the existing shared `Pagination` component.
- Preserve current light/dark themes, keyboard access, responsive layout, reduced-motion support, and static SPA deployment.
- Write behavioral tests first and observe the intended failure before adding each production function.

---

### Task 1: Define and validate the bundled movie catalogue

**Files:**
- Create: `src/data/movies.ts`
- Create: `tests/moviesCatalog.test.ts`

**Interfaces:**
- Produces: `MovieCategory`, `MovieSourceKind`, `MovieSource`, `TmdbSnapshot`, `PokemonMovie`, `MOVIES`, and `validateMovieCatalog(movies: readonly PokemonMovie[]): string[]`.
- The `MOVIES` export is the immutable normalized catalogue consumed by every later task.

- [ ] **Step 1: Write the failing catalogue contract tests**

Create `tests/moviesCatalog.test.ts` with real catalogue assertions:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { MOVIES, validateMovieCatalog } from '../src/data/movies.ts'

test('ships the approved 31-title Pokémon movie catalogue', () => {
  assert.equal(MOVIES.length, 31)
  assert.deepEqual(
    Object.fromEntries(['animated', 'live-action', 'special', 'upcoming'].map((category) => [
      category,
      MOVIES.filter((movie) => movie.category === category).length,
    ])),
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
    MOVIES.filter((movie) => movie.category === 'special').map((movie) => movie.title),
    [
      'Pokémon: Mewtwo Returns',
      'The Legend of Thunder!',
      'Pokémon: The Mastermind of Mirage Pokémon',
      'Pokémon Origins',
      'Pokémon: The Arceus Chronicles',
    ],
  )
})

test('has unique identities, valid dates, source URLs, and verification dates', () => {
  assert.deepEqual(validateMovieCatalog(MOVIES), [])
  assert.equal(new Set(MOVIES.map((movie) => movie.id)).size, MOVIES.length)
  assert.equal(new Set(MOVIES.map((movie) => movie.slug)).size, MOVIES.length)
})
```

- [ ] **Step 2: Run the new test and verify RED**

Run: `node --test tests/moviesCatalog.test.ts`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `src/data/movies.ts`.

- [ ] **Step 3: Add the typed model and validator**

Start `src/data/movies.ts` with these public contracts:

```ts
export type MovieCategory = 'animated' | 'live-action' | 'special' | 'upcoming'
export type MovieSourceKind = 'official' | 'tmdb' | 'bulbapedia' | 'wikipedia' | 'wikidata' | 'imdb' | 'other'

export interface MovieSource {
  label: string
  url: string
  kind: MovieSourceKind
}

export interface TmdbSnapshot {
  id: number
  rating?: number
  voteCount?: number
  posterPath?: string
  backdropPath?: string
  capturedAt: string
}

export interface PokemonMovie {
  id: string
  slug: string
  title: string
  alternateTitles?: readonly string[]
  japaneseTitle?: string
  category: MovieCategory
  releaseDate?: string
  releaseYear: number
  releaseNotes?: string
  runtimeMinutes?: number
  synopsis: string
  featuredPokemon: readonly string[]
  director?: string
  studio?: string
  distributor?: string
  officialUrl?: string
  tmdb?: TmdbSnapshot
  sources: readonly MovieSource[]
  verifiedAt: string
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export function validateMovieCatalog(movies: readonly PokemonMovie[]): string[] {
  const errors: string[] = []
  const ids = new Set<string>()
  const slugs = new Set<string>()
  for (const movie of movies) {
    if (ids.has(movie.id)) errors.push(`Duplicate id: ${movie.id}`)
    if (slugs.has(movie.slug)) errors.push(`Duplicate slug: ${movie.slug}`)
    ids.add(movie.id)
    slugs.add(movie.slug)
    if (!SLUG.test(movie.slug)) errors.push(`Invalid slug: ${movie.slug}`)
    if (movie.releaseDate && !ISO_DATE.test(movie.releaseDate)) errors.push(`Invalid release date: ${movie.slug}`)
    if (!ISO_DATE.test(movie.verifiedAt)) errors.push(`Invalid verification date: ${movie.slug}`)
    if (!movie.sources.length) errors.push(`Missing sources: ${movie.slug}`)
    if (!movie.sources.every((source) => /^https:\/\//.test(source.url))) errors.push(`Invalid source URL: ${movie.slug}`)
    if (!movie.synopsis.trim()) errors.push(`Missing synopsis: ${movie.slug}`)
  }
  return errors
}
```

- [ ] **Step 4: Populate all 31 verified records**

Add the exact inventory from the specification in chronological order. For each record:

- Use the English release date for `releaseDate` when verified; preserve Japanese or regional distinctions in `releaseNotes`.
- Write a concise original synopsis rather than copying long source passages.
- Include at least one Pokémon official or Bulbapedia source; include TMDB, Wikipedia, Wikidata, or IMDb links only when their fields are used.
- Store a TMDB snapshot only after matching title and year against at least one higher-priority source.
- Set `verifiedAt` to the actual research date and `tmdb.capturedAt` to the actual rating snapshot date.
- Represent `Pokémon: Wild Card` as `category: 'upcoming'`, omit an invented release date/rating, and cite the official announcement.
- Export the completed array with `as const satisfies readonly PokemonMovie[]` so malformed records fail type checking.

- [ ] **Step 5: Run the catalogue test and verify GREEN**

Run: `node --test tests/moviesCatalog.test.ts`

Expected: 4 tests PASS and no validator errors.

- [ ] **Step 6: Commit the catalogue contract**

```bash
git add src/data/movies.ts tests/moviesCatalog.test.ts
git commit -m "feat: add verified pokemon movies catalog"
```

---

### Task 2: Implement deterministic movie search, filtering, sorting, and navigation

**Files:**
- Create: `src/utils/movies.ts`
- Create: `tests/movies.test.ts`

**Interfaces:**
- Consumes: `PokemonMovie`, `MovieCategory`, and `MOVIES` from `src/data/movies.ts`.
- Produces: `MovieSort`, `MovieCategoryFilter`, `filterMovies`, `sortMovies`, `paginateMovies`, `findMovieBySlug`, and `getChronologicalNeighbors`.

- [ ] **Step 1: Write failing tests for search and category filtering**

Create fixtures using `satisfies PokemonMovie[]` and assert real results:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import type { PokemonMovie } from '../src/data/movies.ts'
import { filterMovies } from '../src/utils/movies.ts'

const movies = [
  { id: 'm01', slug: 'first', title: 'Pokémon: The First Movie', alternateTitles: ['Mewtwo Strikes Back'], category: 'animated', releaseDate: '1999-11-10', releaseYear: 1999, synopsis: 'Mewtwo challenges Trainers.', featuredPokemon: ['Mewtwo', 'Mew'], sources: [{ label: 'Official', url: 'https://www.pokemon.com/', kind: 'official' }], verifiedAt: '2026-09-12', tmdb: { id: 1, rating: 6.9, capturedAt: '2026-09-12' } },
  { id: 'm02', slug: 'detective', title: 'POKÉMON Detective Pikachu', category: 'live-action', releaseDate: '2019-05-10', releaseYear: 2019, synopsis: 'A mystery in Ryme City.', featuredPokemon: ['Pikachu'], sources: [{ label: 'Official', url: 'https://www.pokemon.com/', kind: 'official' }], verifiedAt: '2026-09-12' },
] satisfies PokemonMovie[]

test('searches title, alternate title, year, and featured Pokémon case-insensitively', () => {
  assert.deepEqual(filterMovies(movies, { query: 'mewtwo', category: 'all' }).map((movie) => movie.id), ['m01'])
  assert.deepEqual(filterMovies(movies, { query: '2019', category: 'all' }).map((movie) => movie.id), ['m02'])
  assert.deepEqual(filterMovies(movies, { query: 'pikachu', category: 'all' }).map((movie) => movie.id), ['m02'])
})

test('combines category and query filters', () => {
  assert.deepEqual(filterMovies(movies, { query: 'pokemon', category: 'live-action' }).map((movie) => movie.id), ['m02'])
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `node --test tests/movies.test.ts`

Expected: FAIL because `src/utils/movies.ts` does not exist.

- [ ] **Step 3: Implement normalized search and category filtering**

```ts
export type MovieCategoryFilter = MovieCategory | 'all'

function searchableText(movie: PokemonMovie): string {
  return [movie.title, ...(movie.alternateTitles ?? []), movie.releaseYear, ...movie.featuredPokemon]
    .join(' ')
    .toLocaleLowerCase('en')
}

export function filterMovies(
  movies: readonly PokemonMovie[],
  filters: { query: string; category: MovieCategoryFilter },
): PokemonMovie[] {
  const query = filters.query.trim().toLocaleLowerCase('en')
  return movies.filter((movie) =>
    (filters.category === 'all' || movie.category === filters.category)
      && (!query || searchableText(movie).includes(query)),
  )
}
```

- [ ] **Step 4: Add failing tests for all four sort modes and missing values**

Extend `tests/movies.test.ts` with assertions that:

- `release-asc` places dated movies oldest first and undated upcoming titles last.
- `release-desc` places undated upcoming titles first, followed by newest dated movies.
- `rating-desc` places high ratings first and unrated titles last.
- `title-asc` uses English locale title order.
- Equal primary values use release date and then `id` for stable results.
- The input array is not mutated.

Use this signature in the tests:

```ts
sortMovies(movies, 'release-asc')
sortMovies(movies, 'release-desc')
sortMovies(movies, 'rating-desc')
sortMovies(movies, 'title-asc')
```

- [ ] **Step 5: Run the sort tests and verify RED**

Run: `node --test --test-name-pattern="sort" tests/movies.test.ts`

Expected: FAIL because `sortMovies` is not exported.

- [ ] **Step 6: Implement deterministic sorting without mutating input**

```ts
export type MovieSort = 'release-asc' | 'release-desc' | 'rating-desc' | 'title-asc'

const dateValue = (movie: PokemonMovie) => movie.releaseDate ? Date.parse(`${movie.releaseDate}T00:00:00Z`) : null
const stableTie = (a: PokemonMovie, b: PokemonMovie) =>
  (dateValue(a) ?? Number.MAX_SAFE_INTEGER) - (dateValue(b) ?? Number.MAX_SAFE_INTEGER)
  || a.id.localeCompare(b.id, 'en')

export function sortMovies(movies: readonly PokemonMovie[], sort: MovieSort): PokemonMovie[] {
  return [...movies].sort((a, b) => {
    if (sort === 'title-asc') return a.title.localeCompare(b.title, 'en') || stableTie(a, b)
    if (sort === 'rating-desc') return (b.tmdb?.rating ?? -1) - (a.tmdb?.rating ?? -1) || stableTie(a, b)
    const aDate = dateValue(a)
    const bDate = dateValue(b)
    if (aDate === null || bDate === null) {
      if (aDate === bDate) return a.id.localeCompare(b.id, 'en')
      return sort === 'release-desc' ? (aDate === null ? -1 : 1) : (aDate === null ? 1 : -1)
    }
    return sort === 'release-desc' ? bDate - aDate || a.id.localeCompare(b.id, 'en') : aDate - bDate || a.id.localeCompare(b.id, 'en')
  })
}
```

- [ ] **Step 7: Add RED tests, then implement pagination, slug lookup, and neighbours**

Test these exact contracts before implementation:

```ts
paginateMovies(movies, 9, 12) // => { items: movies, page: 1, totalPages: 1, totalItems: 2 }
findMovieBySlug(movies, 'detective') // => movies[1]
findMovieBySlug(movies, 'missing') // => undefined
getChronologicalNeighbors(movies, 'detective') // returns previous/next from release-asc order
```

Then implement:

```ts
export function paginateMovies(movies: readonly PokemonMovie[], requestedPage: number, pageSize: number) {
  const totalItems = movies.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const page = Math.min(Math.max(Number.isInteger(requestedPage) ? requestedPage : 1, 1), totalPages)
  return { items: movies.slice((page - 1) * pageSize, page * pageSize), page, totalPages, totalItems }
}

export const findMovieBySlug = (movies: readonly PokemonMovie[], slug: string) => movies.find((movie) => movie.slug === slug)

export function getChronologicalNeighbors(movies: readonly PokemonMovie[], slug: string) {
  const ordered = sortMovies(movies, 'release-asc')
  const index = ordered.findIndex((movie) => movie.slug === slug)
  return index < 0 ? { previous: undefined, next: undefined } : { previous: ordered[index - 1], next: ordered[index + 1] }
}
```

- [ ] **Step 8: Run utility and full tests**

Run: `node --test tests/movies.test.ts && npm test`

Expected: all movie utility tests and the complete suite PASS.

- [ ] **Step 9: Commit pure catalogue behaviour**

```bash
git add src/utils/movies.ts tests/movies.test.ts
git commit -m "feat: add movie catalog filtering and sorting"
```

---

### Task 3: Add the optional TMDB enrichment adapter

**Files:**
- Create: `src/api/movies.ts`
- Create: `tests/movieApi.test.ts`
- Modify: `src/hooks/queries.ts`

**Interfaces:**
- Consumes: `PokemonMovie` from `src/data/movies.ts`.
- Produces: `TmdbMovieResponse`, `tmdbImageUrl`, `mergeTmdbMovie`, `getTmdbMovie`, and `useMovieEnrichment(movie)`.

- [ ] **Step 1: Write failing pure adapter tests**

Create `tests/movieApi.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { mergeTmdbMovie, tmdbImageUrl } from '../src/api/movies.ts'
import type { PokemonMovie } from '../src/data/movies.ts'

const local = {
  id: 'm01', slug: 'first', title: 'Official title', category: 'animated', releaseYear: 1999,
  synopsis: 'Curated synopsis', featuredPokemon: ['Mewtwo'], verifiedAt: '2026-09-12',
  sources: [{ label: 'Official', url: 'https://www.pokemon.com/', kind: 'official' }],
  tmdb: { id: 1094, rating: 6.8, voteCount: 1500, capturedAt: '2026-09-12' },
} satisfies PokemonMovie

test('builds only valid TMDB CDN image URLs', () => {
  assert.equal(tmdbImageUrl('/poster.jpg', 'w500'), 'https://image.tmdb.org/t/p/w500/poster.jpg')
  assert.equal(tmdbImageUrl(undefined, 'w500'), undefined)
  assert.equal(tmdbImageUrl('https://evil.example/x.jpg', 'w500'), undefined)
})

test('merges only TMDB-owned fields and preserves curated fields', () => {
  const result = mergeTmdbMovie(local, {
    id: 1094, title: 'Remote title', overview: 'Remote synopsis', release_date: '2000-01-01',
    runtime: 96, vote_average: 7.1, vote_count: 2000, poster_path: '/new.jpg', backdrop_path: '/back.jpg',
  }, '2026-09-13')
  assert.equal(result.title, 'Official title')
  assert.equal(result.synopsis, 'Curated synopsis')
  assert.equal(result.releaseYear, 1999)
  assert.equal(result.runtimeMinutes, 96)
  assert.deepEqual(result.tmdb, { id: 1094, rating: 7.1, voteCount: 2000, posterPath: '/new.jpg', backdropPath: '/back.jpg', capturedAt: '2026-09-13' })
})

test('rejects a TMDB response whose id does not match the curated record', () => {
  assert.throws(() => mergeTmdbMovie(local, { id: 999, vote_average: 9 }, '2026-09-13'), /TMDB id mismatch/)
})
```

- [ ] **Step 2: Run adapter tests and verify RED**

Run: `node --test tests/movieApi.test.ts`

Expected: FAIL because `src/api/movies.ts` does not exist.

- [ ] **Step 3: Implement safe image construction and merging**

Implement the exported functions so only `runtimeMinutes`, `tmdb.rating`, `tmdb.voteCount`, `tmdb.posterPath`, `tmdb.backdropPath`, and `tmdb.capturedAt` can change. Validate finite non-negative numeric values and TMDB paths matching `^/[A-Za-z0-9._-]+$`; invalid optional fields fall back to the bundled values.

```ts
export type TmdbImageSize = 'w342' | 'w500' | 'w780' | 'original'

export function tmdbImageUrl(path: string | undefined, size: TmdbImageSize): string | undefined {
  return path && /^\/[A-Za-z0-9._-]+$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : undefined
}
```

- [ ] **Step 4: Add a failing fetch-contract test**

Inject a `fetcher: typeof fetch` argument so the test can verify request behaviour without the network. Assert that `getTmdbMovie(1094, 'token', fetcher)` calls `https://api.themoviedb.org/3/movie/1094?language=en-US`, sends `Authorization: Bearer token`, returns parsed JSON on 200, and throws a readable `TmdbApiError` on 401, 404, timeout, and malformed JSON.

- [ ] **Step 5: Implement the fetcher with timeout and typed errors**

Use a 12-second `AbortController`, validate that `tmdbId` is a positive integer and token is non-empty, and never place the token in a URL or error message.

- [ ] **Step 6: Add the query hook**

Append to `src/hooks/queries.ts`:

```ts
export function useMovieEnrichment(movie: PokemonMovie | undefined) {
  const token = import.meta.env.VITE_TMDB_ACCESS_TOKEN?.trim()
  return useQuery({
    queryKey: ['movies', 'tmdb', movie?.tmdb?.id],
    queryFn: async () => mergeTmdbMovie(movie!, await getTmdbMovie(movie!.tmdb!.id, token!), new Date().toISOString().slice(0, 10)),
    enabled: Boolean(movie?.tmdb?.id && token),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  })
}
```

Use the bundled movie as the page value whenever the query is disabled, loading, or failed.

- [ ] **Step 7: Run focused and full verification**

Run: `node --test tests/movieApi.test.ts && npm test && npm run build`

Expected: adapter tests and full suite PASS; TypeScript build succeeds.

- [ ] **Step 8: Commit the TMDB boundary**

```bash
git add src/api/movies.ts src/hooks/queries.ts tests/movieApi.test.ts
git commit -m "feat: add optional tmdb movie enrichment"
```

---

### Task 4: Build reusable movie presentation components

**Files:**
- Create: `src/components/movies/MovieRating.tsx`
- Create: `src/components/movies/MovieCard.tsx`
- Create: `src/components/movies/MovieFilters.tsx`
- Create: `public/tmdb-logo.svg`

**Interfaces:**
- Consumes: `PokemonMovie`, `MovieCategoryFilter`, `MovieSort`, and `tmdbImageUrl`.
- Produces: controlled `MovieFilters`, linked `MovieCard`, `MoviePosterFallback`, `MovieRating`, `MovieCategoryBadge`, and `TmdbAttribution` components.

- [ ] **Step 1: Add the approved TMDB logo asset**

Download the official logo from TMDB's logo/attribution resources, preserve its aspect ratio and colours, and save it as `public/tmdb-logo.svg`. Do not redraw or modify the mark.

- [ ] **Step 2: Implement the rating and attribution component**

`MovieRating` receives `{ rating?: number; voteCount?: number; capturedAt?: string; compact?: boolean }`. It renders `Not rated` when rating is absent; otherwise it renders a visible star plus `${rating.toFixed(1)} TMDB`, an accessible label, optional localized vote count, and snapshot date in the expanded form.

`TmdbAttribution` links to `https://www.themoviedb.org` and displays the required notice exactly:

```text
This product uses the TMDB API but is not endorsed or certified by TMDB.
```

- [ ] **Step 3: Implement a resilient poster card**

`MovieCard` receives `{ movie: PokemonMovie; index: number }`, links to `/movies/${movie.slug}`, and renders:

- A lazy 2:3 poster image from `tmdbImageUrl(movie.tmdb?.posterPath, 'w500')`.
- `MoviePosterFallback` after `onError` or when the path is absent.
- Category badge, title, year/`Coming soon`, compact rating, and at most three featured Pokémon chips.
- A Framer Motion entrance using `index`, hover lift/scale, and no nested interactive elements.
- One visible focus ring on the link and a meaningful poster alt.

- [ ] **Step 4: Implement controlled filters with exact copy**

Use this public prop shape:

```ts
interface MovieFiltersProps {
  query: string
  category: MovieCategoryFilter
  sort: MovieSort
  onQueryChange: (value: string) => void
  onCategoryChange: (value: MovieCategoryFilter) => void
  onSortChange: (value: MovieSort) => void
  onReset: () => void
  resetVisible: boolean
}
```

Render accessible category buttons (`aria-pressed`), a labelled search field, Reset control, and a labelled native select with these exact options:

```tsx
<option value="release-asc">Release date: Oldest → Newest</option>
<option value="release-desc">Release date: Newest → Oldest</option>
<option value="rating-desc">Rating: High → Low</option>
<option value="title-asc">Title: A → Z</option>
```

- [ ] **Step 5: Verify component contracts**

Run: `npm run build && npm run lint`

Expected: no TypeScript errors and no new lint warnings.

- [ ] **Step 6: Commit reusable movie UI**

```bash
git add public/tmdb-logo.svg src/components/movies
git commit -m "feat: add movie cards and filters"
```

---

### Task 5: Build the Movies catalogue page with URL state

**Files:**
- Create: `src/pages/MoviesPage.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `MOVIES`, movie utilities, movie components, `Pagination`, `EmptyState`, and `useMovieEnrichment`.
- Produces: the route-level default export for `/movies`.

- [ ] **Step 1: Define and test URL parsing as a pure function**

Before the page exists, add `parseMovieSearchParams(params: URLSearchParams)` to `src/utils/movies.ts` and tests covering valid values, invalid category/sort/page fallbacks, whitespace trimming, and non-positive pages.

Use this return shape:

```ts
{
  query: string
  category: MovieCategoryFilter
  sort: MovieSort
  page: number
}
```

Run the focused test and verify it fails before implementation, then implement and re-run to GREEN.

- [ ] **Step 2: Compose derived catalogue state**

In `MoviesPage`, read `q`, `category`, `sort`, and `page` from `useSearchParams`. Apply `filterMovies`, then `sortMovies`, then `paginateMovies` with `PAGE_SIZE = 12`. Replace invalid/clamped URL values using `{ replace: true }`. Search input may keep a local value and use the existing `useDebounce` at 200ms.

- [ ] **Step 3: Enrich only visible cards**

Use `useQueries` (or a dedicated hook accepting the visible array) with query keys identical to `useMovieEnrichment`. Enable each request only when the record has a TMDB ID and a token exists. Map each visible local record to successful enriched data; on loading/error retain the local record without replacing the grid with a spinner or error state.

- [ ] **Step 4: Build the cinematic catalogue layout**

Add:

- A hero with `Film`, `Sparkles`, and subtle projector glow visual treatment.
- Heading `Pokémon Movies`, explanatory copy, and `${filtered.length} movies and specials` result count.
- `MovieFilters` below the hero.
- Responsive grid `grid-cols-1 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5`.
- Existing `Pagination`, scrolling to the hero/top after page changes.
- `EmptyState` with a reset action when no title matches.
- `TmdbAttribution` below the catalogue.

- [ ] **Step 5: Add focused movie CSS utilities**

Add only reusable background treatments to `src/index.css`, such as `.movies-atmosphere`, `.movie-poster-shine`, and dark variants. Keep component layout in Tailwind classes and verify the rules do not alter existing pages.

- [ ] **Step 6: Verify the catalogue page**

Run: `npm test && npm run build && npm run lint`

Expected: all tests pass, the page type-checks, and no new warnings appear.

- [ ] **Step 7: Commit the catalogue page**

```bash
git add src/pages/MoviesPage.tsx src/utils/movies.ts tests/movies.test.ts src/index.css
git commit -m "feat: build pokemon movies catalog page"
```

---

### Task 6: Build the movie detail page

**Files:**
- Create: `src/pages/MovieDetailPage.tsx`

**Interfaces:**
- Consumes: `MOVIES`, `findMovieBySlug`, `getChronologicalNeighbors`, `useMovieEnrichment`, `MovieRating`, `MovieCategoryBadge`, `MoviePosterFallback`, `TmdbAttribution`, and `tmdbImageUrl`.
- Produces: the route-level default export for `/movies/:slug`.

- [ ] **Step 1: Implement local-first route lookup and fallback**

Read `slug` through `useParams`. Resolve against `MOVIES` before starting any request. An unknown slug renders a movie-specific `EmptyState` headed `Movie not found`, with a `Browse all movies` link to `/movies`.

- [ ] **Step 2: Add optional detail enrichment**

Call `useMovieEnrichment(localMovie)` and render `query.data ?? localMovie`. Do not show a blocking page spinner. If enrichment fails, keep the bundled movie and show no destructive error; the Sources area continues to explain when the snapshot was verified.

- [ ] **Step 3: Build the backdrop-led hero and facts**

Use a decorative backdrop from `tmdbImageUrl(movie.tmdb?.backdropPath, 'original')` with gradient overlays, then render poster/fallback, title, alternate/Japanese title, category, release date or `Coming soon`, runtime, rating, synopsis, director/studio/distributor facts, and featured Pokémon chips. Format dates with `Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })` to avoid timezone drift.

- [ ] **Step 4: Render safe official and source links**

Show `Where to watch / Official page` only when `officialUrl` exists. Render every `sources` item as an external HTTPS link with provider label and source kind, plus `Verified ${verifiedAt}`. Use `target="_blank" rel="noreferrer"`; never manufacture streaming availability.

- [ ] **Step 5: Add chronological previous/next navigation**

Use `getChronologicalNeighbors(MOVIES, movie.slug)`. Render only existing neighbours, preserve complete title text on accessible labels, and use responsive stacked/mobile and two-column/desktop layout.

- [ ] **Step 6: Verify detail states**

Run: `npm test && npm run build && npm run lint`

Expected: all tests pass, known and missing slug branches type-check, and no new warnings appear.

- [ ] **Step 7: Commit the detail page**

```bash
git add src/pages/MovieDetailPage.tsx
git commit -m "feat: add pokemon movie detail pages"
```

---

### Task 7: Integrate routing, navigation, titles, and project documentation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/layout/Navbar.tsx`
- Modify: `README.md`
- Create: `.env.example`

**Interfaces:**
- Consumes: default exports from both movie pages.
- Produces: public navigation and routes for `/movies` and `/movies/:slug`, plus setup and attribution documentation.

- [ ] **Step 1: Add lazy routes and document-title handling**

In `src/App.tsx`, add:

```ts
const MovieDetailPage = lazy(() => import('./pages/MovieDetailPage'))
const MoviesPage = lazy(() => import('./pages/MoviesPage'))
```

Register `/movies` before `/movies/:slug`. In the title effect, map `/movies/:slug` to the matched movie title when possible and `/movies` to `Pokémon Movies`, rather than relying on raw path formatting.

- [ ] **Step 2: Add Movies to every navigation layout**

Add `{ to: '/movies', label: 'Movies' }` to `NAV_LINKS`, positioned after `Games` and before `Favorites`. Confirm desktop, tablet scrolling, and mobile menu all consume the same array without clipping. If the extra item causes desktop crowding, reduce only the navigation gap/padding at affected breakpoints; do not hide a section.

- [ ] **Step 3: Document configuration and attribution**

Create `.env.example`:

```dotenv
# Optional read-only TMDB API access token. Never place privileged secrets here.
VITE_TMDB_ACCESS_TOKEN=
```

Update README features, architecture, routes, data sources, configuration, and attribution. State that any `VITE_` value is embedded in the browser bundle, the token is optional, and the bundled catalogue remains available when absent. Include the required TMDB notice verbatim and links to Pokémon official movies and TMDB.

- [ ] **Step 4: Run the complete automated verification**

Run:

```bash
npm test
npm run lint
npm run build
git diff --check
```

Expected: all tests pass; lint and build exit 0; there are no whitespace errors and no new warnings.

- [ ] **Step 5: Perform responsive and failure-mode acceptance checks**

Run the Vite site and inspect `/movies` and at least one `/movies/:slug` at narrow mobile, tablet, desktop, and wide desktop widths in both themes. Verify keyboard-only operation, visible focus, no horizontal page overflow, broken-image fallback, unknown slug, empty search, URL restoration, all four sorts, all category tabs, page clamping, no-token mode, and token-enabled enrichment when a token is available.

- [ ] **Step 6: Update README screenshots only if the repository already adopts screenshot assets**

This repository currently does not require checked-in screenshots. Do not add large screenshots solely for this feature; record visual verification in the handoff instead.

- [ ] **Step 7: Commit integration and documentation**

```bash
git add .env.example README.md src/App.tsx src/components/layout/Navbar.tsx
git commit -m "feat: integrate pokemon movies module"
```

---

### Task 8: Final source audit and release gate

**Files:**
- Modify if necessary: `src/data/movies.ts`
- Modify if necessary: `README.md`
- Modify if necessary: movie tests and components directly affected by audit findings

**Interfaces:**
- Consumes: the complete Movies implementation.
- Produces: release-ready, source-audited module with no unresolved metadata claims.

- [ ] **Step 1: Audit every bundled record**

For all 31 entries, confirm unique ID/slug, category, English title, date/year, synopsis, featured Pokémon, TMDB match when present, source priority, HTTPS links, and verification dates. Open a sample from every category and every provider. Remove any claim that cannot be verified rather than guessing.

- [ ] **Step 2: Re-run catalogue validation and test suite**

Run: `node --test tests/moviesCatalog.test.ts && npm test`

Expected: catalogue contract and complete suite PASS.

- [ ] **Step 3: Review the diff for accidental scope changes and secrets**

Run:

```bash
git status --short
git diff --check
git diff --stat
git grep -n "VITE_TMDB_ACCESS_TOKEN=" -- ':!*.example' ':!docs/**'
```

Expected: only intended feature files are changed, no whitespace errors exist, and no populated token is found.

- [ ] **Step 4: Run final fresh verification**

Run: `npm test && npm run lint && npm run build`

Expected: all commands exit 0 with no new warning compared with the baseline.

- [ ] **Step 5: Request final code review**

Use `superpowers:requesting-code-review` against the full feature diff. Fix every Critical or Important issue with a regression test where behaviour is involved, then repeat the fresh verification commands.

- [ ] **Step 6: Commit audit corrections only when changes were required**

```bash
git add src/data/movies.ts README.md src tests
git commit -m "fix: address pokemon movies release audit"
```

Do not create an empty commit when the audit required no changes.
