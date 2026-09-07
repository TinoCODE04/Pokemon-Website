import { ArrowLeft, EyeOff, Info, Users, Zap } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Pagination } from '../components/filters/Pagination'
import { PokemonCard, PokemonCardSkeleton, resourceToCardPokemon } from '../components/pokemon/PokemonCard'
import { PokemonGrid } from '../components/pokemon/PokemonGrid'
import { ErrorState, SectionHeading, Skeleton } from '../components/ui/Feedback'
import { useAbility } from '../hooks/queries'
import { cleanFlavorText, formatName, longEffect } from '../utils/format'

const PAGE_SIZE = 24

export default function AbilityDetailPage() {
  const { name } = useParams<{ name: string }>()
  const { data: ability, isLoading, isError, refetch } = useAbility(name)
  const [page, setPage] = useState(1)

  if (isError) {
    return (
      <div className="container-app py-10">
        <ErrorState
          title="Ability not found"
          message={`There is no ability called "${name}".`}
          onRetry={() => refetch()}
        />
      </div>
    )
  }

  const totalPages = ability ? Math.ceil(ability.pokemon.length / PAGE_SIZE) : 0
  const pagePokemon = ability
    ? ability.pokemon.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : []
  const hiddenCount = ability ? ability.pokemon.filter((p) => p.is_hidden).length : 0

  return (
    <div className="container-app py-10">
      <Link
        to="/abilities"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-500 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        All abilities
      </Link>

      {isLoading || !ability ? (
        <div className="space-y-6">
          <Skeleton className="h-44" />
          <PokemonGrid>
            {Array.from({ length: 12 }, (_, i) => (
              <PokemonCardSkeleton key={i} />
            ))}
          </PokemonGrid>
        </div>
      ) : (
        <>
          <div className="card-surface mb-8 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500/10 text-brand-500">
                <Zap className="h-6 w-6" />
              </span>
              <div>
                <h1 className="font-display text-3xl font-extrabold capitalize tracking-tight">
                  {formatName(ability.name)}
                </h1>
                <p className="text-xs font-medium text-slate-400">
                  Introduced in {formatName(ability.generation.name)}
                  {!ability.is_main_series && ' · spin-off games only'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <div className="rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <Info className="h-3.5 w-3.5" />
                  Effect
                </p>
                <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {longEffect(ability.effect_entries) || 'No description available.'}
                </p>
                {ability.flavor_text_entries.length > 0 && (
                  <p className="mt-3 border-t border-slate-200 pt-3 text-xs italic text-slate-500 dark:border-white/10 dark:text-slate-400">
                    “{cleanFlavorText(
                      ability.flavor_text_entries.find((f) => f.language.name === 'en')?.flavor_text ?? '',
                    )}”
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                  <Users className="h-5 w-5 shrink-0 text-brand-500" />
                  <div>
                    <p className="text-xs text-slate-400">Pokémon with this ability</p>
                    <p className="font-display text-xl font-extrabold">{ability.pokemon.length}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-white/5">
                  <EyeOff className="h-5 w-5 shrink-0 text-brand-500" />
                  <div>
                    <p className="text-xs text-slate-400">As a hidden ability</p>
                    <p className="font-display text-xl font-extrabold">{hiddenCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <SectionHeading
            title="Pokémon with this ability"
            subtitle={`${ability.pokemon.length} Pokémon can have ${formatName(ability.name)}`}
          />
          <PokemonGrid>
            {pagePokemon.map((p, i) => (
              <PokemonCard key={p.pokemon.name} pokemon={resourceToCardPokemon(p.pokemon)} index={i} />
            ))}
          </PokemonGrid>
          <Pagination
            page={page}
            totalPages={totalPages}
            onChange={(p) => {
              setPage(p)
              window.scrollTo({ top: 460, behavior: 'smooth' })
            }}
          />
        </>
      )}
    </div>
  )
}