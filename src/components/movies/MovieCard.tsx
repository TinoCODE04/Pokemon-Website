import { motion, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, CalendarDays, Film } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { tmdbImageUrl } from '../../api/movies'
import type { MovieCategory, PokemonMovie } from '../../data/movies'
import { cn } from '../../utils/cn'
import { MovieRating } from './MovieRating'

const categoryMeta: Record<MovieCategory, { label: string; className: string }> = {
  animated: { label: 'Animated film', className: 'bg-sky-500/90 text-white' },
  'live-action': { label: 'Live action', className: 'bg-violet-500/90 text-white' },
  special: { label: 'Special', className: 'bg-emerald-500/90 text-white' },
  upcoming: { label: 'Coming soon', className: 'bg-brand-500 text-white' },
}

export function MovieCategoryBadge({ category }: { category: MovieCategory }) {
  const meta = categoryMeta[category]
  return <span className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide shadow-sm', meta.className)}>{meta.label}</span>
}

export function MoviePoster({ movie, className }: { movie: PokemonMovie; className?: string }) {
  const [failedPoster, setFailedPoster] = useState<string>()
  const poster = tmdbImageUrl(movie.tmdb?.posterPath, 'w500')
  const failed = poster !== undefined && failedPoster === poster

  return (
    <div className={cn('relative overflow-hidden bg-gradient-to-br from-night-800 via-night-900 to-slate-950', className)}>
      {poster && !failed ? (
        <img src={poster} alt={`${movie.title} poster`} className="h-full w-full object-cover" loading="lazy" onError={() => setFailedPoster(poster)} />
      ) : (
        <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center text-white/80">
          <span className="absolute -right-12 -top-12 h-40 w-40 rounded-full border-[24px] border-white/5" />
          <Film className="h-12 w-12 text-brand-400" />
          <span className="font-display text-lg font-bold">{movie.title}</span>
        </div>
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-night-950/75 via-transparent to-transparent" />
    </div>
  )
}

export function MovieCard({ movie, index = 0 }: { movie: PokemonMovie; index?: number }) {
  const reduceMotion = useReducedMotion()
  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, delay: Math.min(index, 8) * 0.035 }}
      className="group h-full"
    >
      <Link
        to={`/movies/${movie.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-[1.4rem] border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-500 dark:border-white/10 dark:bg-night-900 dark:hover:shadow-black/30"
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          <MoviePoster movie={movie} className="h-full w-full transition duration-500 group-hover:scale-[1.035]" />
          <div className="absolute left-3 top-3"><MovieCategoryBadge category={movie.category} /></div>
          <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-slate-900 opacity-0 shadow-md transition group-hover:opacity-100 dark:bg-night-950/90 dark:text-white">
            <ArrowUpRight className="h-4 w-4" />
          </span>
        </div>
        <div className="flex flex-1 flex-col p-4">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <CalendarDays className="h-3.5 w-3.5" />
            {movie.category === 'upcoming' && !movie.releaseDate ? 'Coming soon' : movie.releaseYear}
          </div>
          <h2 className="font-display text-lg font-bold leading-tight tracking-tight transition group-hover:text-brand-500">{movie.title}</h2>
          {movie.alternateTitles?.[0] && <p className="mt-1 line-clamp-1 text-xs text-slate-400">{movie.alternateTitles[0]}</p>}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {movie.featuredPokemon.slice(0, 3).map((pokemon) => (
              <span key={pokemon} className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-white/5 dark:text-slate-300">{pokemon}</span>
            ))}
          </div>
          <div className="mt-auto pt-4"><MovieRating rating={movie.tmdb?.rating} voteCount={movie.tmdb?.voteCount} /></div>
        </div>
      </Link>
    </motion.article>
  )
}
