import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ExternalLink, Loader2, Play, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { PokemonMovie } from '../../data/movies'

export interface TrailerModalState {
  movie: PokemonMovie
  youtubeId?: string
  sourceUrl?: string
  loading?: boolean
  searchUrl: string
}

export function TrailerModal({ state, onClose }: { state: TrailerModalState | null; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const dialogRef = useRef<HTMLElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    if (!state) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Tab' && dialogRef.current) {
        const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>('button, a[href], iframe, [tabindex]:not([tabindex="-1"])')]
        const first = focusable[0]
        const last = focusable.at(-1)
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last?.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first?.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, state])

  return (
    <AnimatePresence>
      {state && (
        <motion.div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-night-950/90 p-3 backdrop-blur-sm sm:p-6"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduceMotion ? undefined : { opacity: 0 }}
          transition={reduceMotion ? { duration: 0 } : undefined}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) onClose()
          }}
        >
          <motion.section
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="trailer-title"
            initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 12, scale: 0.98 }}
            transition={reduceMotion ? { duration: 0 } : undefined}
            className="w-full max-w-5xl overflow-hidden rounded-2xl border border-white/15 bg-night-900 text-white shadow-2xl"
          >
            <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-5">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand-400">Trailer</p>
                <h2 id="trailer-title" className="truncate font-display text-lg font-bold sm:text-xl">{state.movie.title}</h2>
              </div>
              <button ref={closeRef} type="button" onClick={onClose} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close trailer">
                <X className="h-5 w-5" />
              </button>
            </header>

            <div className="relative aspect-video min-h-[220px] bg-black">
              {state.youtubeId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${state.youtubeId}?autoplay=1&rel=0`}
                  title={`${state.movie.title} trailer`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : state.loading ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-300" role="status">
                  <Loader2 className="h-9 w-9 animate-spin text-brand-500" />
                  <span className="text-sm">Looking for an official trailer…</span>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10"><Play className="h-6 w-6 fill-current" /></span>
                  <div><h3 className="font-display text-xl font-bold">Direct trailer unavailable</h3><p className="mt-1 text-sm text-slate-400">Search YouTube for a verified upload of this trailer.</p></div>
                  <a href={state.searchUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-500 px-5 py-2 text-sm font-bold text-white hover:bg-brand-600">
                    Search YouTube <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>

            {state.youtubeId && state.sourceUrl && (
              <footer className="flex justify-end border-t border-white/10 px-4 py-3">
                <a href={state.sourceUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white">Open on YouTube <ExternalLink className="h-3.5 w-3.5" /></a>
              </footer>
            )}
          </motion.section>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
