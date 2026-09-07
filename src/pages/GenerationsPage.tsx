import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { extractId } from '../api/pokeapi'
import { ErrorState, Skeleton } from '../components/ui/Feedback'
import { useGenerations } from '../hooks/queries'
import { artworkUrl, formatName } from '../utils/format'

const REGION_BY_GEN: Record<number, string> = {
  1: 'Kanto', 2: 'Johto', 3: 'Hoenn', 4: 'Sinnoh', 5: 'Unova',
  6: 'Kalos', 7: 'Alola', 8: 'Galar', 9: 'Paldea',
}
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const STARTERS: Record<number, [number, number, number]> = {
  1: [1, 4, 7], 2: [152, 155, 158], 3: [252, 255, 258], 4: [387, 390, 393], 5: [495, 498, 501],
  6: [650, 653, 656], 7: [722, 725, 728], 8: [810, 813, 816], 9: [906, 909, 912],
}

export default function GenerationsPage() {
  const { data, isLoading, isError, refetch } = useGenerations()

  if (isError) {
    return (
      <div className="container-app py-10">
        <ErrorState message="Could not load the generation list." onRetry={() => refetch()} />
      </div>
    )
  }

  const gens = data?.results ?? []

  return (
    <div className="container-app py-10">
      <div className="mb-8 max-w-xl">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Generations</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          The Pokémon world grew one region at a time. Pick a generation to see its region, new
          species, moves, abilities and version groups.
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }, (_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gens.map((g, i) => {
            const id = extractId(g)
            return (
              <motion.div
                key={g.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
              >
                <Link
                  to={`/generations/${id}`}
                  className="card-surface group relative flex flex-col overflow-hidden p-6 transition hover:-translate-y-1 hover:shadow-xl"
                >
                  <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-500">
                    Generation {ROMAN[id - 1] ?? id}
                  </span>
                  <h2 className="mt-1 font-display text-2xl font-extrabold">
                    {REGION_BY_GEN[id] ?? formatName(g.name)}
                  </h2>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-4">
                      {(STARTERS[id] ?? [1, 4, 7]).map((sid) => (
                        <img
                          key={sid}
                          src={artworkUrl(sid)}
                          alt=""
                          loading="lazy"
                          className="h-16 w-16 rounded-full border-2 border-white bg-slate-100 object-contain p-1 shadow-md transition-transform group-hover:scale-110 dark:border-night-900 dark:bg-white/10"
                        />
                      ))}
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition group-hover:border-brand-500 group-hover:bg-brand-500 group-hover:text-white dark:border-white/10">
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}