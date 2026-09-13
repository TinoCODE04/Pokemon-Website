import { ArrowLeft, ArrowRight, CalendarDays, Clock3, ExternalLink, Film, Play, ShieldCheck } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { tmdbImageUrl, youtubeTrailerSearchUrl } from '../api/movies'
import { MovieCategoryBadge, MoviePoster } from '../components/movies/MovieCard'
import { MovieRating, TmdbAttribution } from '../components/movies/MovieRating'
import { TrailerModal, type TrailerModalState } from '../components/movies/TrailerModal'
import { EmptyState } from '../components/ui/Feedback'
import { MOVIES } from '../data/movies'
import { useMovieEnrichment } from '../hooks/queries'
import { findMovieBySlug, getChronologicalNeighbors } from '../utils/movies'

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  timeZone: 'UTC',
})

function formatReleaseDate(date?: string): string {
  return date ? dateFormatter.format(new Date(`${date}T00:00:00Z`)) : 'Coming soon'
}

export default function MovieDetailPage() {
  const { slug = '' } = useParams()
  const localMovie = findMovieBySlug(MOVIES, slug)
  const enrichment = useMovieEnrichment(localMovie)
  const [trailerState, setTrailerState] = useState<TrailerModalState | null>(null)
  const trailerOpener = useRef<HTMLButtonElement | null>(null)

  const closeTrailer = useCallback(() => {
    setTrailerState(null)
    window.requestAnimationFrame(() => trailerOpener.current?.focus())
  }, [])

  if (!localMovie) {
    return (
      <div className="container-app py-16">
        <EmptyState
          icon={<Film className="h-6 w-6" />}
          title="Movie not found"
          message="This movie is not part of the verified Pokémon movie catalogue."
          action={<Link to="/movies" className="mt-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">Browse all movies</Link>}
        />
      </div>
    )
  }

  const movie = enrichment.data ?? localMovie
  const backdrop = tmdbImageUrl(movie.tmdb?.backdropPath, 'original')
  const { previous, next } = getChronologicalNeighbors(MOVIES, movie.slug)
  const facts = [
    ['Release', movie.releaseDate ? formatReleaseDate(movie.releaseDate) : movie.releaseNotes ?? 'Coming soon'],
    ['Runtime', movie.runtimeMinutes ? `${movie.runtimeMinutes} minutes` : 'Not available'],
    ['Director', movie.director ?? 'Not available'],
    ['Studio', movie.studio ?? 'Not available'],
    ['Distributor', movie.distributor ?? 'Not available'],
  ]

  return (
    <div className="pb-16">
      <header className="movie-detail-hero relative isolate overflow-hidden border-b border-white/10 text-white">
        {backdrop && <img src={backdrop} alt="" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-40" />}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-night-950 via-night-950/85 to-night-950/40" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-night-950 via-transparent to-night-950/20" />
        <div className="container-app py-8 sm:py-10 lg:py-14">
          <Link to="/movies" className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-4 py-2 text-sm font-semibold text-slate-200 backdrop-blur transition hover:bg-white/10 hover:text-white">
            <ArrowLeft className="h-4 w-4" /> All movies
          </Link>
          <div className="grid items-center gap-7 md:grid-cols-[210px_minmax(0,1fr)] md:gap-8 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-10">
            <MoviePoster movie={movie} className="movie-poster-shine aspect-[2/3] w-full max-w-[250px] rounded-[1.35rem] border border-white/20 shadow-2xl shadow-black/50" />
            <div className="min-w-0 pb-1">
              <MovieCategoryBadge category={movie.category} />
              <h1 className="mt-4 max-w-full break-words font-display text-3xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">{movie.title}</h1>
              {movie.alternateTitles?.length ? <p className="mt-3 text-lg text-slate-300">Also known as {movie.alternateTitles.join(' / ')}</p> : null}
              {movie.japaneseTitle && <p className="mt-1 text-sm text-slate-400" lang="ja">{movie.japaneseTitle}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3 text-sm text-slate-200">
                <span className="inline-flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-400" />{formatReleaseDate(movie.releaseDate)}</span>
                {movie.runtimeMinutes && <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-brand-400" />{movie.runtimeMinutes} min</span>}
                <MovieRating rating={movie.tmdb?.rating} voteCount={movie.tmdb?.voteCount} compact={false} />
              </div>
              <button
                type="button"
                aria-label={`Play trailer for ${movie.title}`}
                onClick={(event) => {
                  trailerOpener.current = event.currentTarget
                  const searchUrl = youtubeTrailerSearchUrl(movie.title, movie.releaseYear)
                  if (movie.trailer) {
                    setTrailerState({ movie, youtubeId: movie.trailer.youtubeId, sourceUrl: movie.trailer.sourceUrl, searchUrl })
                  } else {
                    window.open(searchUrl, '_blank', 'noopener,noreferrer')
                  }
                }}
                className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500"
              >
                <Play className="h-4 w-4 fill-current" /> Play Trailer
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-app mt-8 grid items-start gap-6 lg:mt-10 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <section className="card-surface p-6 sm:col-span-2 sm:p-7">
            <h2 className="font-display text-2xl font-bold">The story</h2>
            <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">{movie.synopsis}</p>
          </section>

          <section className={movie.officialUrl ? 'card-surface p-6 sm:p-7' : 'card-surface p-6 sm:col-span-2 sm:p-7'}>
            <h2 className="font-display text-2xl font-bold">Featured Pokémon</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {movie.featuredPokemon.map((pokemon) => <span key={pokemon} className="rounded-full border border-brand-500/20 bg-brand-500/10 px-3.5 py-1.5 text-sm font-bold text-brand-600 dark:text-brand-300">{pokemon}</span>)}
            </div>
          </section>

          {movie.officialUrl && (
            <section className="rounded-2xl border border-brand-500/20 bg-gradient-to-br from-brand-500/10 to-amber-400/10 p-6 sm:p-7">
              <h2 className="font-display text-xl font-bold">Where to watch / Official page</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Availability may vary by region. Check the official Pokémon page for current information.</p>
              <a href={movie.officialUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600">
                Visit official page <ExternalLink className="h-4 w-4" />
              </a>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-24">
          <section className="card-surface p-6">
            <h2 className="font-display text-xl font-bold">Movie facts</h2>
            <dl className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
              {facts.map(([label, value]) => (
                <div key={label} className="grid grid-cols-[100px_1fr] gap-3 py-3 text-sm">
                  <dt className="font-semibold text-slate-400">{label}</dt>
                  <dd className="font-medium text-slate-700 dark:text-slate-200">{value}</dd>
                </div>
              ))}
            </dl>
          </section>

        </aside>
      </div>

      <section className="container-app mt-6" aria-labelledby="sources-title">
        <div className="card-surface p-6 sm:p-7">
          <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-500" /><h2 id="sources-title" className="font-display text-xl font-bold">Sources</h2></div>
          <ul className="mt-4 grid gap-2 sm:grid-cols-3">
            {movie.sources.map((source) => (
              <li key={`${source.kind}-${source.url}`}>
                <a href={source.url} target="_blank" rel="noreferrer" className="flex h-full items-start justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5 text-sm transition hover:border-brand-300 hover:text-brand-500 dark:border-white/10">
                  <span><strong className="block">{source.label}</strong><span className="text-xs uppercase tracking-wide text-slate-400">{source.kind}</span></span>
                  <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-white/10">
            <p className="text-xs text-slate-400">Verified {movie.verifiedAt}</p>
            {movie.tmdb && <TmdbAttribution />}
          </div>
        </div>
      </section>

      <nav className="container-app mt-10 grid gap-3 sm:grid-cols-2" aria-label="Chronological movie navigation">
        {previous ? (
          <Link to={`/movies/${previous.slug}`} aria-label={`Previous movie: ${previous.title}`} className="card-surface flex items-center gap-3 p-5 transition hover:border-brand-300 hover:text-brand-500">
            <ArrowLeft className="h-5 w-5 shrink-0" /><span><small className="block text-xs font-bold uppercase tracking-wide text-slate-400">Previous</small><strong className="font-display">{previous.title}</strong></span>
          </Link>
        ) : <span />}
        {next && (
          <Link to={`/movies/${next.slug}`} aria-label={`Next movie: ${next.title}`} className="card-surface flex items-center justify-end gap-3 p-5 text-right transition hover:border-brand-300 hover:text-brand-500">
            <span><small className="block text-xs font-bold uppercase tracking-wide text-slate-400">Next</small><strong className="font-display">{next.title}</strong></span><ArrowRight className="h-5 w-5 shrink-0" />
          </Link>
        )}
      </nav>
      <TrailerModal state={trailerState} onClose={closeTrailer} />
    </div>
  )
}
