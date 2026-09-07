import { motion } from 'framer-motion'
import { GitCompareArrows, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { extractId } from '../../api/pokeapi'
import type { Pokemon } from '../../api/types'
import { typeStyle } from '../../constants/types'
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
      whileHover={{ y: -4 }}
      className="group relative"
    >
      <Link
        to={`/pokemon/${pokemon.id}`}
        className="card-surface relative flex flex-col overflow-hidden p-4 transition-shadow duration-300 hover:shadow-xl"
        style={style ? { backgroundImage: `linear-gradient(160deg, ${style.soft}, transparent 55%)` } : undefined}
      >
        <div className="flex items-start justify-between">
          <span className="font-mono text-xs font-semibold text-slate-400 dark:text-slate-500">
            {formatDexNumber(pokemon.id)}
          </span>
          <div className="flex gap-1">
            <button
              aria-label={compared ? 'Remove from compare' : 'Add to compare'}
              aria-pressed={compared}
              disabled={!compared && isFull}
              onClick={(e) => {
                e.preventDefault()
                toggleCompare(pokemon.id)
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition',
                compared
                  ? 'bg-brand-500 text-white'
                  : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 disabled:opacity-40 dark:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-300',
              )}
            >
              <GitCompareArrows className="h-3.5 w-3.5" />
            </button>
            <button
              aria-label={favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={favorite}
              onClick={(e) => {
                e.preventDefault()
                toggleFavorite(pokemon.id)
              }}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-full transition active:scale-90',
                favorite
                  ? 'text-brand-500'
                  : 'text-slate-300 hover:bg-slate-100 hover:text-slate-500 dark:text-slate-600 dark:hover:bg-white/10 dark:hover:text-slate-300',
              )}
            >
              <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
            </button>
          </div>
        </div>

        <div className="relative mx-auto my-1 flex h-28 w-28 items-center justify-center sm:h-32 sm:w-32">
          {style && (
            <div
              className="absolute inset-0 scale-90 rounded-full opacity-0 blur-xl transition-opacity duration-300 group-hover:opacity-60"
              style={{ background: style.soft.replace('0.16', '0.5').replace('0.14', '0.45').replace('0.18', '0.5').replace('0.2', '0.55') }}
            />
          )}
          <img
            src={pokemon.image ?? artworkUrl(pokemon.id)}
            alt={formatName(pokemon.name)}
            loading="lazy"
            onError={(e) => {
              const el = e.currentTarget
              if (!el.dataset.fallback) {
                el.dataset.fallback = '1'
                el.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`
              }
            }}
            className="relative h-full w-full object-contain drop-shadow-md transition-transform duration-300 group-hover:scale-110"
          />
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