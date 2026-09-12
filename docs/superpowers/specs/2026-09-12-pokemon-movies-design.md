# Pokémon Movies Module Design

**Date:** 2026-09-12

## Goal

Add a complete, responsive Pokémon Movies area to Pokémon Explorer. The module must remain useful in the existing static deployment without an API key, while allowing optional TMDB enrichment when a read-only token is configured.

## Scope

The catalogue includes these clearly labelled groups:

- Animated theatrical movies, with the Black/White Victini versions represented as separate releases.
- Live-action theatrical movies, including `POKÉMON Detective Pikachu`.
- Feature-length television and streaming specials that are commonly catalogued alongside Pokémon movies.
- Officially announced upcoming feature films.

Short films, ordinary television episodes, compilation videos, fan productions, and unconfirmed projects are excluded. A title may remain in the catalogue when no poster, rating, runtime, or exact international release date is available; the UI supplies an explicit `Not available` or `Coming soon` state instead of inventing a value.

The initial catalogue contains exactly 31 records:

- 24 animated theatrical records: `Pokémon: The First Movie`, `Pokémon the Movie 2000`, `Pokémon 3: The Movie`, `Pokémon 4Ever`, `Pokémon Heroes`, `Jirachi: Wish Maker`, `Destiny Deoxys`, `Lucario and the Mystery of Mew`, `Pokémon Ranger and the Temple of the Sea`, `The Rise of Darkrai`, `Giratina & the Sky Warrior`, `Arceus and the Jewel of Life`, `Zoroark: Master of Illusions`, both `Black—Victini and Reshiram` and `White—Victini and Zekrom`, `Kyurem vs. the Sword of Justice`, `Genesect and the Legend Awakened`, `Diancie and the Cocoon of Destruction`, `Hoopa and the Clash of Ages`, `Volcanion and the Mechanical Marvel`, `I Choose You!`, `The Power of Us`, `Mewtwo Strikes Back—Evolution`, and `Secrets of the Jungle`.
- 1 live-action record: `POKÉMON Detective Pikachu`.
- 5 special records: `Pokémon: Mewtwo Returns`, `The Legend of Thunder!`, `Pokémon: The Mastermind of Mirage Pokémon`, `Pokémon Origins`, and `Pokémon: The Arceus Chronicles`.
- 1 upcoming record: `Pokémon: Wild Card`.

Minor punctuation differences between international releases are stored as alternate titles rather than creating duplicate records. If an additional officially announced feature appears before implementation finishes, it is added only after confirmation from Pokémon's official website and the catalogue count is updated with it.

## Source Policy

Field values use the following priority:

1. Pokémon official websites for official English title, synopsis, classification, and official availability links.
2. TMDB for poster and backdrop paths, community rating, vote count, runtime, genres, and external IDs.
3. Bulbapedia for catalogue completeness, release chronology, Japanese release information, featured Pokémon, and special classification.
4. Wikipedia for secondary validation of release dates, runtime, production, and distribution.
5. Wikidata for stable identifiers and structured cross-checking.
6. IMDb and other reputable sources only to resolve conflicts or fill a field that higher-priority sources do not provide.

Every bundled record stores field-level source URLs where practical, plus `verifiedAt`. Conflicts are resolved in favour of the higher-priority source and documented in the record notes only when the distinction affects what users see. Ratings are labelled `TMDB` and include their snapshot date because they can change over time.

Where TMDB data or imagery appears, the site includes the approved TMDB logo and the notice `This product uses the TMDB API but is not endorsed or certified by TMDB.` in a credits area linked from the Movies pages. The TMDB mark remains less prominent than Pokémon Explorer branding.

No scraping happens in the user's browser. The app ships a reviewed TypeScript/JSON catalogue so it works without credentials. If `VITE_TMDB_ACCESS_TOKEN` is present, the app may refresh TMDB-owned fields from the documented TMDB API and merge them over the bundled snapshot. The token is optional and, because Vite exposes `VITE_` values to the client, documentation must warn deployers to use only a replaceable read-only token and never a privileged secret. A future server-side proxy can replace this adapter without changing page components.

## Information Architecture

### Navigation and routes

- Add `Movies` to desktop, tablet, and mobile primary navigation.
- `/movies` renders the searchable catalogue.
- `/movies/:slug` renders a movie detail page.
- Unknown slugs render a movie-specific not-found state with a link back to `/movies`.
- Page titles follow the existing `… | Pokémon Explorer` convention.

### Catalogue page

The page begins with a cinematic hero containing the title `Pokémon Movies`, a short description, the number of matching titles, and a featured visual. Below it is a single filter toolbar followed by a responsive card grid. All matching titles render in one continuous page without catalogue pagination.

The toolbar contains:

- Search by English title, alternate title, year, or featured Pokémon.
- Category tabs: `All`, `Animated`, `Live Action`, `Specials`, and `Upcoming`.
- A `Sort` label and select control aligned on the right on desktop and full-width on narrow screens.
- Exactly these sort options and values:
  - `Release date: Oldest → Newest` (`release-asc`)
  - `Release date: Newest → Oldest` (`release-desc`)
  - `Rating: High → Low` (`rating-desc`)
  - `Title: A → Z` (`title-asc`)

The default sort is `release-asc`, presenting the franchise chronologically. Search, category, and sort are reflected in URL query parameters; legacy `page` parameters are removed. Invalid URL values fall back to defaults. Upcoming titles without a final date sort after dated titles in ascending order and before them in descending order. Unrated titles sort after rated titles. Title ties use release date, then stable catalogue ID.

Cards show a 2:3 poster area, title, release year or `Coming soon`, category badge, TMDB rating with vote context when available, up to three featured Pokémon, and a `Play Trailer` button. Missing posters use a polished branded placeholder rather than a broken image. Poster and title link to details while the trailer remains a separate accessible action.

Verified YouTube trailers open in a responsive 16:9 dialog with Escape, backdrop, and close-button handling. When configured, TMDB Videos supplies an official YouTube trailer on demand. If no verified direct video is available, the action opens a title-and-year-specific YouTube trailer search rather than guessing an upload or embedding copyrighted full-length content.

Empty searches provide a reset action. Loading and optional enrichment failure do not remove bundled content.

### Detail page

The detail page uses a backdrop-led header with poster, title, alternate/Japanese title where available, release date, category, runtime, TMDB rating, and badges for featured Pokémon. It includes:

- Official or highest-priority synopsis.
- Release and production facts.
- Featured Pokémon list.
- `Where to watch / Official page` links only when supplied by an authoritative source; no availability is inferred by geography.
- A compact `Sources` section linking to the records used for verification and displaying the verification date.
- Previous and next movie navigation in chronological catalogue order.

The page never embeds copyrighted video or copies long passages. Synopses are concise paraphrases unless supplied for permitted use by an API.

## Visual Design

The visual language remains consistent with Pokémon Explorer: rounded surfaces, red brand accents, Outfit display typography, strong light/dark contrast, and restrained motion. The Movies section adds a cinematic identity through deep navy-to-indigo gradients, warm projector-light glows, subtle film-grain/dot texture, poster elevation, and red/yellow accent details. It must not imitate a streaming service or overwhelm the existing Pokémon styling.

Grid targets:

- Mobile: 2 cards when space permits, otherwise 1.
- Tablet: 3 cards.
- Desktop: 4 cards.
- Wide desktop: 5 or 6 cards only when poster titles remain readable.

Motion is limited to card lift, image scale, and page fades, and honours `prefers-reduced-motion` through the project's existing global rule.

## Components and Boundaries

- `src/data/movies.ts`: bundled, typed, verified catalogue only.
- `src/api/movies.ts`: TMDB response types, optional enrichment fetcher, image URL construction, and safe merge rules.
- `src/utils/movies.ts`: pure search, category filtering, sorting, pagination, slug lookup, and neighbouring-title functions.
- `src/components/movies/MovieCard.tsx`: poster card and poster fallback.
- `src/components/movies/MovieFilters.tsx`: controlled search, category, and sort controls.
- `src/components/movies/MovieRating.tsx`: consistent TMDB attribution and missing-rating state.
- `src/pages/MoviesPage.tsx`: URL state, query integration, catalogue orchestration, and grid states.
- `src/pages/MovieDetailPage.tsx`: detail composition and source presentation.
- `src/App.tsx` and `src/components/layout/Navbar.tsx`: lazy routes, titles, and navigation entry.
- `README.md` and `.env.example`: feature, source attribution, and optional TMDB configuration.

Page components consume a normalized `PokemonMovie` model and do not know which individual field came from TMDB or the bundled snapshot. The API adapter is the only unit allowed to merge remote data.

## Data Model

Each normalized movie contains:

- Stable internal `id` and URL-safe `slug`.
- `title`, optional `alternateTitles`, and optional `japaneseTitle`.
- `category`: `animated`, `live-action`, `special`, or `upcoming`.
- Optional exact `releaseDate`, required display `releaseYear`, and optional regional release notes.
- Optional `runtimeMinutes`.
- Short `synopsis`.
- `featuredPokemon` as display names, without coupling this module to PokéAPI IDs.
- Optional TMDB metadata: `tmdbId`, `rating`, `voteCount`, `posterPath`, and `backdropPath`.
- Optional production facts such as director, studio, and distributor.
- `sources`, each with a label, URL, and source kind.
- ISO `verifiedAt` date.

Bundled image references use TMDB paths or remote authoritative URLs rather than committing third-party poster files. The UI always renders attribution required by the active provider.

## Data Flow and Failure Handling

1. The catalogue renders immediately from the bundled dataset.
2. When no TMDB token exists, no TMDB network request is made.
3. When a token exists, TanStack Query fetches only the TMDB records visible on the current page or the active detail page and caches them for the session.
4. Successful responses replace only TMDB-owned fields; official titles, classification, curated synopsis, featured Pokémon, and source links remain authoritative.
5. A failed enrichment request preserves the bundled record and does not replace the grid with an error screen.
6. Missing or failed images switch to the branded poster fallback.
7. Detail lookup always uses the local catalogue, so an unknown slug can be distinguished from a network failure.

## Accessibility and Responsive Behaviour

- All controls have programmatic labels and visible focus states.
- Category tabs expose their selected state; sort and search use native form semantics.
- Rating text is readable without relying on star colour.
- Posters use meaningful alternative text, while decorative backdrops use empty alt text.
- Contrast meets the established light and dark theme patterns.
- Touch targets are at least 40px high.
- The card grid, filter toolbar, source links, and previous/next navigation reflow without horizontal page overflow.
- Enrichment status is non-disruptive and does not cause focus or layout jumps.

## Testing

Pure utility tests are written first and cover:

- Search across titles, alternate titles, years, and featured Pokémon.
- Every category filter.
- All four sort modes, including equal values, missing ratings, and undated upcoming films.
- Page clamping and page reset expectations.
- Slug lookup and chronological previous/next navigation.
- Remote/local merge precedence and invalid TMDB response handling.

Component-level confidence comes from TypeScript and production builds plus focused DOM tests only if the project adds an existing DOM test harness; this feature does not introduce a heavyweight testing framework solely for snapshot tests. Manual acceptance covers light/dark themes, mobile/tablet/desktop layouts, keyboard navigation, image failures, no-token mode, and token-enabled enrichment.

## Acceptance Criteria

- Movies is reachable from every navigation layout and both new routes load lazily.
- The complete agreed catalogue is present and categorized, with source links and verification dates.
- The list works without an API key and remains usable when TMDB fails.
- All four requested sort options produce deterministic results and remain shareable through the URL.
- Search, category filters, continuous scrolling, reset behaviour, responsive cards, and trailer actions work together.
- Every movie opens a useful detail page with facts, synopsis, featured Pokémon, sources, and chronological navigation.
- Missing media and metadata have intentional fallback states.
- No secrets are committed, source attribution is visible, and README configuration is accurate.
- Tests, lint, TypeScript, and production build pass with no new warnings.

## Out of Scope

- User reviews, watchlists, streaming playback, ticket purchasing, comments, accounts, and server-side storage.
- Automatic scraping of Pokémon, Bulbapedia, Wikipedia, IMDb, or other sites.
- Region-aware streaming availability promises.
- A general non-Pokémon movie browser.
