import { ArrowLeft, Shield, Sword } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { Pagination } from '../components/filters/Pagination'
import { PokemonCard, PokemonCardSkeleton, resourceToCardPokemon } from '../components/pokemon/PokemonCard'
import { PokemonGrid } from '../components/pokemon/PokemonGrid'
import { ErrorState, SectionHeading } from '../components/ui/Feedback'
import { useType } from '../hooks/queries'
import { TYPE_ORDER, typeMascot, typeStyle } from '../constants/types'
import { cn } from '../utils/cn'
import { spriteUrl } from '../utils/format'
import { useState } from 'react'

const PAGE_SIZE = 24

export default function TypeDetailPage() {
  const { name } = useParams<{ name: string }>()
  const typeQuery = useType(name)
  const [page, setPage] = useState(1)

  if (typeQuery.isError) {
    return (
      <div className="container-app py-10">
        <ErrorState
          title="Type not found"
          message={`There is no type called "${name}".`}
          onRetry={() => typeQuery.refetch()}
        />
      </div>
    )
  }

  const type = typeQuery.data
  const style = typeStyle(name ?? 'normal')
  const mascot = typeMascot(name ?? 'normal')

  const totalPages = type ? Math.ceil(type.pokemon.length / PAGE_SIZE) : 0
  const pagePokemon = type
    ? type.pokemon.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : []

  return (
    <div className="container-app py-10">
      <Link
        to="/types"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-500 dark:text-slate-400"
      >
        <ArrowLeft className="h-4 w-4" />
        All types
      </Link>

      {/* Header */}
      <div
        className="card-surface relative mb-8 overflow-hidden p-6 sm:p-8"
        style={{ backgroundImage: `linear-gradient(140deg, ${style.soft}, transparent 65%)` }}
      >
        <div
          className="absolute -right-10 -top-10 h-48 w-48 rounded-full opacity-20 blur-3xl"
          style={{ background: style.color }}
        />
        <div className="flex flex-wrap items-center gap-5">
          <span className="relative flex h-24 w-24 shrink-0 items-center justify-center">
            <span className="absolute inset-x-4 bottom-2 h-3 rounded-full bg-slate-900/15 blur-sm dark:bg-black/30" />
            <img
              src={spriteUrl(mascot.id)}
              alt=""
              width="96"
              height="96"
              className="pixel-sprite relative h-24 w-24 object-contain drop-shadow-lg"
              onError={(event) => { event.currentTarget.style.display = 'none' }}
            />
          </span>
          <div>
            <h1 className="font-display text-3xl font-extrabold capitalize tracking-tight sm:text-4xl">
              {name}
            </h1>
            {type && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {type.pokemon.length} Pokémon · {type.moves.length} moves · introduced in{' '}
                {type.generation.name.replace('-', ' ')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Matchups */}
      {type && (
        <div className="mb-10 grid gap-5 lg:grid-cols-2">
          <MatchupCard
            title="Offensive"
            icon={<Sword className="h-4 w-4" />}
            groups={[
              { label: 'Super effective against', types: type.damage_relations.double_damage_to, tone: 'good' },
              { label: 'Not very effective against', types: type.damage_relations.half_damage_to, tone: 'meh' },
              { label: 'No effect against', types: type.damage_relations.no_damage_to, tone: 'bad' },
            ]}
          />
          <MatchupCard
            title="Defensive"
            icon={<Shield className="h-4 w-4" />}
            groups={[
              { label: 'Weak to (takes 2×)', types: type.damage_relations.double_damage_from, tone: 'bad' },
              { label: 'Resists (takes ½×)', types: type.damage_relations.half_damage_from, tone: 'good' },
              { label: 'Immune to (takes 0×)', types: type.damage_relations.no_damage_from, tone: 'meh' },
            ]}
          />
        </div>
      )}

      {/* Pokémon with this type */}
      <SectionHeading title={`Pokémon with the ${name} type`} />
      {!type ? (
        <PokemonGrid>
          {Array.from({ length: 12 }, (_, i) => (
            <PokemonCardSkeleton key={i} />
          ))}
        </PokemonGrid>
      ) : (
        <>
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
              window.scrollTo({ top: 400, behavior: 'smooth' })
            }}
          />
        </>
      )}
    </div>
  )
}

function MatchupCard({
  title,
  icon,
  groups,
}: {
  title: string
  icon: React.ReactNode
  groups: {
    label: string
    types: { name: string; url: string }[]
    tone: 'good' | 'bad' | 'meh'
  }[]
}) {
  return (
    <section className="card-surface p-5">
      <h2 className="mb-4 flex items-center gap-2 font-display text-base font-bold">
        <span className="text-brand-500">{icon}</span>
        {title}
      </h2>
      <div className="space-y-4">
        {groups.map((group) => (
          <div key={group.label}>
            <p
              className={cn(
                'mb-1.5 text-xs font-bold uppercase tracking-wide',
                group.tone === 'good' && 'text-emerald-600 dark:text-emerald-400',
                group.tone === 'bad' && 'text-red-500 dark:text-red-400',
                group.tone === 'meh' && 'text-slate-400',
              )}
            >
              {group.label}
            </p>
            {group.types.length === 0 ? (
              <p className="text-xs text-slate-400">None</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {group.types
                  .filter((t) => (TYPE_ORDER as readonly string[]).includes(t.name))
                  .map((t) => (
                    <TypeChip key={t.name} name={t.name} />
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}

function TypeChip({ name }: { name: string }) {
  const style = typeStyle(name)
  return (
    <Link
      to={`/types/${name}`}
      className="rounded-full px-3 py-1 text-xs font-bold capitalize text-white shadow-sm transition hover:scale-105"
      style={{ background: style.color }}
    >
      {name}
    </Link>
  )
}

