# Pokémon Explorer

A clean, responsive Pokémon encyclopedia powered by [PokéAPI](https://pokeapi.co/). Browse the National Pokédex, search by name or number, inspect stats and evolution chains, explore types and generations, compare Pokémon, and save favorites locally.

## Features

- Browse and search the complete Pokédex
- Explore Top 50, Top 100, and Top 200 Pokémon power rankings
- Filter Pokémon by type and generation
- Sort results by Pokédex number or name
- View artwork, types, measurements, abilities, moves, cries, and base stats
- Explore evolution chains and type effectiveness
- Browse Pokémon by generation and region
- Compare up to three Pokémon side by side
- Save favorite Pokémon on the current device
- Play Quick Battle and challenge powerful Legendary Pokémon
- Browse a source-attributed catalogue of Pokémon movies and feature-length specials
- Search movies by title, year, or featured Pokémon and sort them by date, rating, or title
- Switch between light and dark themes
- Use responsive layouts designed for desktop, tablet, and mobile
- Open global search using the navigation or `/` keyboard shortcut

## Tech stack

| Technology | Purpose |
| --- | --- |
| [React](https://react.dev/) | Component-based user interface |
| [TypeScript](https://www.typescriptlang.org/) | Static typing and safer API models |
| [Vite](https://vite.dev/) | Development server and production bundling |
| [Tailwind CSS](https://tailwindcss.com/) | Responsive styling and design tokens |
| [TanStack Query](https://tanstack.com/query/latest) | API requests, caching, and loading/error states |
| [React Router](https://reactrouter.com/) | Client-side pages and URL routing |
| [Framer Motion](https://motion.dev/) | Page transitions and interface animations |
| [Lucide React](https://lucide.dev/) | Interface icons |
| [PokéAPI](https://pokeapi.co/docs/v2) | Pokémon data and media |

## How it works

The browser communicates directly with PokéAPI through a typed API layer inside `src/api`. The Movies module renders from a checked-in, verified catalogue, so it remains available without an API key or a network request.

Reusable TanStack Query hooks in `src/hooks/queries.ts` fetch and cache Pokémon, species, evolution, type, generation, and ability data.

The main Pokédex request loads lightweight Pokémon records for searching, filtering, and pagination. Full details are fetched only for the Pokémon cards currently displayed.

Detail pages combine multiple PokéAPI resources. For example, the Pokémon endpoint supplies stats and abilities, while the species endpoint supplies descriptions and evolution information.

Favorites, comparison selections, and the selected color theme are stored in the browser using `localStorage`.

The application does not require an account, database, API key, or `.env` file. A replaceable, read-only TMDB access token can optionally refresh TMDB-owned movie fields such as ratings and artwork.

### Optional TMDB enrichment

Copy `.env.example` to `.env.local` and add a TMDB API Read Access Token:

```dotenv
VITE_TMDB_ACCESS_TOKEN=your_read_only_token
```

This setting is optional; the bundled catalogue, poster paths, and rating snapshot are used when it is absent or TMDB is unavailable. Vite embeds every `VITE_` value in the browser bundle, so use only a replaceable read-only token—never a privileged secret.

## Getting started

### Requirements

- A current Node.js LTS release
- npm
- An internet connection for PokéAPI data and artwork

### Install and run locally

```bash
git clone https://github.com/TinoCODE04/Pokemon-Website.git
cd Pokemon-Website
npm install
npm run dev
```

Vite will display the local development URL in the terminal. It is normally:

```text
http://localhost:5173
```

## Build for production

Create an optimized production build:

```bash
npm run build
```

This command checks the TypeScript project and generates the production files inside the `dist/` directory.

Preview the production build locally:

```bash
npm run preview
```

## Available scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Type-check and create an optimized production build |
| `npm run preview` | Serve the generated `dist/` build locally |
| `npm run lint` | Check the source code using Oxlint |

## Project structure

```text
src/
├── api/          # PokéAPI client functions and TypeScript response types
├── components/   # Layout, filters, charts, search, and Pokémon UI
├── constants/    # Type colors, icons, and application constants
├── data/         # Verified, normalized Pokémon movie catalogue
├── hooks/        # Query, debounce, and theme hooks
├── pages/        # Route-level pages
├── store/        # Favorites and comparison state using localStorage
├── utils/        # Formatting and class-name helpers
├── App.tsx       # Routes, application shell, and global search
└── main.tsx      # React providers and browser entry point
```

## Main routes

| Route | Screen |
| --- | --- |
| `/` | Homepage and quick navigation |
| `/pokedex` | Searchable and filterable Pokédex |
| `/rankings` | Base Stat Total rankings for Pokémon and forms |
| `/pokemon/:id` | Pokémon details, stats, moves, and evolution chain |
| `/types` | List of all Pokémon types |
| `/types/:name` | Type effectiveness and related Pokémon |
| `/generations` | Pokémon generation overview |
| `/generations/:id` | Generation and region details |
| `/abilities` | Ability directory |
| `/abilities/:name` | Ability details and related Pokémon |
| `/compare` | Side-by-side Pokémon comparison |
| `/games` | Quick Battle and Legendary Challenge |
| `/movies` | Searchable Pokémon movies and specials catalogue |
| `/movies/:slug` | Movie details, production facts, sources, and chronology |
| `/favorites` | Locally saved favorite Pokémon |

## API usage

The PokéAPI base URL is configured in `src/api/pokeapi.ts`:

```text
https://pokeapi.co/api/v2
```

API requests are cached for one hour because Pokémon reference data changes infrequently.

Network errors and missing records are converted into readable application error states with retry actions.

## Deployment

This project is a static single-page application.

First, generate the production files:

```bash
npm run build
```

You can then deploy the contents of the `dist/` directory to services such as:

- Vercel
- Netlify
- Cloudflare Pages
- GitHub Pages
- ChatGPT Sites

When configuring your hosting service, add a fallback that serves `index.html` for unknown paths. This allows routes such as `/pokemon/25` to work when opened or refreshed directly.

## Troubleshooting

### Pokémon data does not load

Confirm that your device can access:

```text
https://pokeapi.co/api/v2/
```

The application needs an internet connection while running.

### A detail page returns a 404 after refreshing

Configure your hosting service to rewrite unknown routes to `/index.html`. Vite's local development server handles this automatically.

### Favorites disappeared

Favorites are stored only in the current browser's local storage.

Clearing browser data, using private browsing, or switching devices can remove or hide the saved collection.

## Data and trademarks

Pokémon data and artwork are provided by the community-maintained [PokéAPI](https://pokeapi.co/).

Movie titles and official links are checked first against the [Pokémon Movie Encyclopedia](https://www.pokemon.com/us/animation/movies), with catalogue cross-checking through [Bulbapedia](https://bulbapedia.bulbagarden.net/wiki/Pok%C3%A9mon_movie). Posters, backdrops, community ratings, and optional live enrichment are provided by [TMDB](https://www.themoviedb.org/). Each movie detail page exposes its verification links and date.

This product uses the TMDB API but is not endorsed or certified by TMDB.

Pokémon and Pokémon character names are trademarks of Nintendo, Game Freak, and The Pokémon Company.

This is an unofficial fan-made project and is not affiliated with or endorsed by those companies.
