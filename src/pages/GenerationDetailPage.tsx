import { ArrowLeft, Gamepad2, MapPin, Sword, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pagination } from '../components/filters/Pagination'
import { PokemonCard, PokemonCardSkeleton, resourceToCardPokemon } from '../components/pokemon/PokemonCard'
import { PokemonGrid } from '../components/pokemon/PokemonGrid'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { ErrorState, SectionHeading, Skeleton } from '../components/ui/Feedback'
import { useGeneration } from '../hooks/queries'
import { formatName } from '../utils/format'

const PAGE_SIZE = 24
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']

export default function GenerationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { data: gen, isLoading, isError, refetch } = useGeneration(id)
  const [page, setPage] = useState(1)

  if (isError) {
    return (
      <div className="container-app py-10">
        <ErrorState
          title="Generation not found"
          message="This generation does not exist."
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const totalPages = gen ? Math.ceil(gen.pokemon_species.length / PAGE_SIZE) : 0
  const pageSpecies = gen
    ? [...gen.pokemon_species]
        .sort((a, b) => {
          const ai = Number(a.url.match(/\/(\d+)\/?$/)?.[1] ?? 0)
          const bi = Number(b.url.match(/\/(\d+)\/?$/)?.[1] ?? 0)
          return ai - bi
        })
        .slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : []

  return (
    <div className="container-app py-10">
      <Link
        to="/generations"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-500 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        All generations
      </Link>

      {isLoading || !gen ? (
        <div className="space-y-6">
          <Skeleton className="h-36" />
          <PokemonGrid>
            {Array.from({ length: 12 }, (_, i) => (
              <PokemonCardSkeleton key={i} />
            ))}
          </PokemonGrid>
        </div>
      ) : (
        <>
          <div className="card-surface mb-8 p-6 sm:p-8">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-brand-500">
              Generation {ROMAN[gen.id - 1] ?? gen.id}
            </span>
            <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {formatName(gen.main_region.name)} region
            </h1>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                <MapPin className="h-5 w-5 shrink-0 text-brand-500" />
                <div>
                  <p className="text-xs text-slate-400">New species</p>
                  <p className="font-display text-xl font-extrabold">{gen.pokemon_species.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                <Sword className="h-5 w-5 shrink-0 text-brand-500" />
                <div>
                  <p className="text-xs text-slate-400">New moves</p>
                  <p className="font-display text-xl font-extrabold">{gen.moves.length}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                <Zap className="h-5 w-5 shrink-0 text-brand-500" />
                <div>
                  <p className="text-xs text-slate-400">New abilities</p>
                  <p className="font-display text-xl font-extrabold">{gen.abilities.length}</p>
                </div>
              </div>
            </div>

            {gen.types.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
                  Types introduced
                </p>
                <div className="flex flex-wrap gap-2">
                  {gen.types.map((t) => (
                    <TypeBadge key={t.name} type={t.name} linked />
                  ))}
                </div>
              </div>
            )}

            {gen.version_groups.length > 0 && (
              <div className="mt-6">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <Gamepad2 className="h-3.5 w-3.5" />
                  Games
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {gen.version_groups.map((vg) => (
                    <span
                      key={vg.name}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold capitalize text-slate-600 dark:border-white/10 dark:text-slate-300"
                    >
                      {formatName(vg.name)}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <SectionHeading
            title="Pokémon introduced"
            subtitle={`${gen.pokemon_species.length} species debuted in this generation`}
          />
          <PokemonGrid>
            {pageSpecies.map((s, i) => (
              <PokemonCard key={s.name} pokemon={resourceToCardPokemon(s)} index={i} />
            ))}
          </PokemonGrid>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => {
              setPage(p)
              window.scrollTo({ top: 480, behavior: 'smooth' })
            }}
          />
        </>
      )}
    </div>
  )
}