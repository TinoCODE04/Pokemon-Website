import { motion } from 'framer-motion'
import { Crown, GitCompareArrows, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { extractId } from '../../api/pokeapi'
import type { Pokemon } from '../../api/types'
import { LEGENDARY_POKEMON_IDS, typeStyle } from '../../constants/types'
import { useCompare, useFavorites } from '../../store/AppContext'
import { cn } from '../../utils/cn'
import { artworkUrl, bestArtwork, formatDexNumber, formatName } from '../../utils/format'
import { TypeBadge } from './TypeBadge'

/** A Pokémon shown in grid cards. Either full detail data or a lightweight {id, name}. */
export interface CardPokemon {
  id: number
  name: string
  image?: string
  types?: string[]
}

export function toCardPokemon(p: Pokemon): CardPokemon {
  return {
    id: p.id,
    name: p.name,
    image: bestArtwork(p.sprites),
    types: p.types.map((t) => t.type.name),
  }
}

export function resourceToCardPokemon(resource: { name: string; url: string }): CardPokemon {
  const id = extractId(resource)
  return { id, name: resource.name, image: artworkUrl(id) }
}

export function PokemonCard({ pokemon, index = 0 }: { pokemon: CardPokemon; index?: number }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { inCompare, toggleCompare, isFull } = useCompare()
  const primary = pokemon.types?.[0]
  const style = primary ? typeStyle(primary) : null
  const favorite = isFavorite(pokemon.id)
  const compared = inCompare(pokemon.id)
  const legendary = LEGENDARY_POKEMON_IDS.has(pokemon.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{ y: -4 }}
      className={cn(
        'card-surface group relative flex flex-col overflow-hidden p-4 transition-shadow duration-300 hover:shadow-xl',
        legendary && 'border-amber-400/45 shadow-amber-500/5 hover:shadow-amber-500/15',
      )}
      style={style ? {
        backgroundImage: legendary
          ? `linear-gradient(135deg, rgba(251,191,36,0.13), transparent 42%), linear-gradient(155deg, ${style.soft}, transparent 60%)`
          : `linear-gradient(155deg, ${style.soft}, transparent 58%)`,
      } : undefined}
    >
      <div className="relative z-10 flex items-start justify-between">
        <div className="flex items-center gap-1.5 pt-2">
          <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
            {formatDexNumber(pokemon.id)}
          </span>
          {legendary && (
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-400/20 text-amber-600 dark:text-amber-300"
              title="Legendary Pokémon"
              aria-label="Legendary Pokémon"
            >
              <Crown className="h-3 w-3 fill-current" />
            </span>
          )}
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            aria-label={compared ? 'Remove from compare' : isFull ? 'Compare list is full' : 'Add to compare'}
            aria-pressed={compared}
            disabled={!compared && isFull}
            title={!compared && isFull ? 'Compare list is full (maximum 3)' : undefined}
            onClick={() => toggleCompare(pokemon.id)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition',
              compared
                ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200',
            )}
          >
            <GitCompareArrows className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
            aria-pressed={favorite}
            onClick={() => toggleFavorite(pokemon.id)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-full transition active:scale-90',
              favorite
                ? 'bg-brand-500/10 text-brand-500'
                : 'text-slate-400 hover:bg-slate-100 hover:text-brand-500 dark:text-slate-500 dark:hover:bg-white/10',
            )}
          >
            <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
          </button>
        </div>
      </div>

      <Link
        to={`/pokemon/${pokemon.id}`}
        aria-label={`View ${formatName(pokemon.name)} details`}
        className="relative -mx-1 -mb-1 mt-1 flex flex-1 flex-col rounded-xl px-1 pb-1"
      >
        <div className="pokemon-stage relative mx-auto flex h-32 w-32 items-center justify-center sm:h-36 sm:w-36">
          {style && (
            <div
              className="absolute inset-1 scale-90 rounded-full opacity-30 blur-2xl transition duration-500 group-hover:scale-105 group-hover:opacity-65"
              style={{ background: style.soft.replace('0.16', '0.5').replace('0.14', '0.45').replace('0.18', '0.5').replace('0.2', '0.55') }}
            />
          )}
          <span
            className="pokemon-shadow absolute bottom-2 left-1/2 h-3 w-20 -translate-x-1/2 rounded-full bg-slate-950/30 blur-md dark:bg-black/50"
            style={{ animationDelay: `${-(pokemon.id % 7) * 0.35}s` }}
          />
          <div className="pokemon-float relative h-full w-full" style={{ animationDelay: `${-(pokemon.id % 7) * 0.35}s` }}>
            <img
              src={pokemon.image ?? artworkUrl(pokemon.id)}
              alt={formatName(pokemon.name)}
              loading="lazy"
              onError={(e) => {
                const el = e.currentTarget
                if (!el.dataset.fallback) {
                  el.dataset.fallback = '1'
                  el.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
                } else {
                  el.onerror = null
                  el.src = '/favicon.svg'
                }
              }}
              className="h-full w-full object-contain drop-shadow-[0_16px_14px_rgba(15,23,42,0.28)] transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-110"
            />
          </div>
        </div>

        <h3 className="text-center font-display text-base font-bold capitalize leading-tight">
          {formatName(pokemon.name)}
        </h3>

        {pokemon.types && (
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t} size="sm" />
            ))}
          </div>
        )}
      </Link>
    </motion.div>
  )
}

export function PokemonCardSkeleton() {
  return (
    <div className="card-surface flex flex-col items-center p-4">
      <div className="h-4 w-12 self-start animate-pulse rounded bg-slate-200 dark:bg-white/10" />
      <div className="my-3 h-28 w-28 animate-pulse rounded-full bg-slate-200 sm:h-32 sm:w-32 dark:bg-white/10" />
      <div className="h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-white/10" />
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
        <div className="h-5 w-14 animate-pulse rounded-full bg-slate-200 dark:bg-white/10" />
      </div>
    </div>
  )
}
