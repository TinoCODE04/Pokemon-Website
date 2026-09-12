import { Star } from 'lucide-react'

export function MovieRating({
  rating,
  voteCount,
  capturedAt,
  compact = true,
}: {
  rating?: number
  voteCount?: number
  capturedAt?: string
  compact?: boolean
}) {
  if (rating === undefined) {
    return <span className="text-sm font-medium text-slate-400">Not rated</span>
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5" aria-label={`TMDB rating ${rating.toFixed(1)} out of 10`}>
      <Star className={compact ? 'h-4 w-4 fill-amber-400 text-amber-400' : 'h-5 w-5 fill-amber-400 text-amber-400'} />
      <strong className={compact ? 'text-sm' : 'text-lg'}>{rating.toFixed(1)} TMDB</strong>
      {voteCount !== undefined && <span className="text-xs text-slate-400">· {voteCount.toLocaleString()} votes</span>}
      {!compact && capturedAt && <span className="text-xs text-slate-400">· Snapshot {capturedAt}</span>}
    </span>
  )
}

export function TmdbAttribution({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`flex ${compact ? 'items-center gap-2' : 'flex-wrap items-center gap-x-3 gap-y-2'} text-xs text-slate-500 dark:text-slate-400`}>
      <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer" aria-label="Visit TMDB">
        <img src="/tmdb-logo.svg" alt="TMDB" className={compact ? 'h-3 w-auto' : 'h-4 w-auto'} />
      </a>
      {!compact && <span>This product uses the TMDB API but is not endorsed or certified by TMDB.</span>}
    </div>
  )
}
