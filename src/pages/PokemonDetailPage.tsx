import { motion } from 'framer-motion'
import {
  ArrowLeft,
  ArrowRight,
  Dna,
  GitCompareArrows,
  Heart,
  Ruler,
  Sparkles,
  Volume2,
  Weight,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { extractId, PokeApiError } from '../api/pokeapi'
import { EvolutionChainView } from '../components/pokemon/EvolutionChain'
import { TypeBadge } from '../components/pokemon/TypeBadge'
import { StatBars } from '../components/charts/StatBars'
import { StatRadarChart, pokemonToRadarSeries } from '../components/charts/StatRadarChart'
import { ErrorState, Skeleton, Spinner } from '../components/ui/Feedback'
import { useEvolutionChain, usePokemon, usePokemonSpecies } from '../hooks/queries'
import { useCompare, useFavorites } from '../store/AppContext'
import { RECENT_KEY, typeStyle } from '../constants/types'
import { useLocalStorage } from '../store/useLocalStorage'
import { cn } from '../utils/cn'
import {
  bestArtwork,
  englishFlavorText,
  englishGenus,
  formatDexNumber,
  formatHeight,
  formatHeightImperial,
  formatName,
  formatWeight,
  formatWeightImperial,
} from '../utils/format'

export default function PokemonDetailPage() {
  const { id } = useParams<{ id: string }>()
  const pokemonQuery = usePokemon(id)
  const pokemon = pokemonQuery.data

  const speciesQuery = usePokemonSpecies(pokemon?.species.name)
  const species = speciesQuery.data

  const chainId = species ? extractId(species.evolution_chain) : undefined
  const chainQuery = useEvolutionChain(chainId)

  const { isFavorite, toggleFavorite } = useFavorites()
  const { inCompare, toggleCompare, isFull } = useCompare()
  const [showShiny, setShowShiny] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [, setRecentlyViewed] = useLocalStorage<number[]>(RECENT_KEY, [])

  useEffect(() => {
    if (!pokemon) return
    setRecentlyViewed((previous) => [pokemon.id, ...previous.filter((item) => item !== pokemon.id)].slice(0, 6))
  }, [pokemon, setRecentlyViewed])

  if (pokemonQuery.isError) {
    const isMissing = pokemonQuery.error instanceof PokeApiError && pokemonQuery.error.status === 404
    return (
      <div className="container-app py-10">
        <ErrorState
          title={isMissing ? 'Pokémon not found' : 'Could not load this Pokémon'}
          message={isMissing
            ? 'This Pokémon does not exist. Check the name or Pokédex number and try again.'
            : 'The connection to PokéAPI failed. Check your connection and try again.'}
          onRetry={() => pokemonQuery.refetch()}
        />
        <div className="mt-4 text-center">
          <Link to="/pokedex" className="text-sm font-semibold text-brand-500 hover:underline">
            Back to Pokédex
          </Link>
        </div>
      </div>
    )
  }

  if (!pokemon) {
    return (
      <div className="container-app space-y-6 py-8">
        <Skeleton className="h-8 w-40" />
        <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Skeleton className="h-96" />
          <div className="space-y-4">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </div>
    )
  }

  const primaryType = pokemon.types[0]?.type.name ?? 'normal'
  const style = typeStyle(primaryType)
  const favorite = isFavorite(pokemon.id)
  const compared = inCompare(pokemon.id)
  const flavorText = species ? englishFlavorText(species.flavor_text_entries) : ''
  const genus = species ? englishGenus(species.genera) : ''

  const image =
    showShiny && pokemon.sprites.other?.['official-artwork']?.front_shiny
      ? pokemon.sprites.other['official-artwork'].front_shiny
      : bestArtwork(pokemon.sprites)

  const playCry = () => {
    const src = pokemon.cries.latest ?? pokemon.cries.legacy
    if (!src) return
    if (!audioRef.current) audioRef.current = new Audio()
    audioRef.current.src = src
    audioRef.current.volume = 0.4
    audioRef.current.play().catch(() => {})
  }

  const prevId = pokemon.id > 1 ? pokemon.id - 1 : null
  const nextId = pokemon.id < 10277 ? pokemon.id + 1 : null

  return (
    <div>
      {/* Hero band tinted by primary type */}
      <div
        className="border-b border-slate-200 dark:border-white/10"
        style={{
          background: `linear-gradient(135deg, ${style.soft}, transparent 60%), linear-gradient(0deg, transparent, transparent)`,
        }}
      >
        <div className="container-app py-6 lg:py-10">
          <div className="mb-5 flex items-center justify-between gap-3">
            <Link
              to="/pokedex"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 transition hover:text-brand-500 dark:text-slate-400"
            >
              <ArrowLeft className="h-4 w-4" />
              Pokédex
            </Link>
            <div className="flex items-center gap-1">
              {prevId && (
                <Link
                  to={`/pokemon/${prevId}`}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-white/70 hover:text-brand-500 dark:text-slate-400 dark:hover:bg-white/10"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {formatDexNumber(prevId)}
                </Link>
              )}
              {nextId && (
                <Link
                  to={`/pokemon/${nextId}`}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 transition hover:bg-white/70 hover:text-brand-500 dark:text-slate-400 dark:hover:bg-white/10"
                >
                  {formatDexNumber(nextId)}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
          </div>

          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            {/* Artwork */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45 }}
              className="relative mx-auto w-full max-w-sm"
            >
              <div
                className="absolute inset-6 rounded-full blur-3xl"
                style={{ background: style.soft.replace('0.16', '0.6').replace('0.14', '0.55').replace('0.18', '0.6').replace('0.2', '0.65') }}
              />
              <div className="card-surface relative overflow-hidden p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.5),transparent_62%)] dark:bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_62%)]" />
                <div className="pokemon-stage relative mx-auto h-64 w-64 sm:h-80 sm:w-80">
                  <span className="pokemon-shadow absolute bottom-4 left-1/2 h-5 w-36 -translate-x-1/2 rounded-full bg-slate-950/30 blur-lg dark:bg-black/60" />
                  <img
                    src={image}
                    alt={formatName(pokemon.name)}
                    className="pokemon-float relative h-full w-full object-contain drop-shadow-[0_24px_20px_rgba(15,23,42,0.32)]"
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
                  />
                </div>
                <div className="relative mt-2 flex items-center justify-center gap-2">
                  {pokemon.sprites.other?.['official-artwork']?.front_shiny && (
                    <button
                      onClick={() => setShowShiny((v) => !v)}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition',
                        showShiny
                          ? 'border-amber-400 bg-amber-400/15 text-amber-600 dark:text-amber-300'
                          : 'border-slate-200 text-slate-500 hover:border-amber-300 hover:text-amber-500 dark:border-white/10 dark:text-slate-400',
                      )}
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      {showShiny ? 'Shiny!' : 'Shiny'}
                    </button>
                  )}
                  {(pokemon.cries.latest || pokemon.cries.legacy) && (
                    <button
                      onClick={playCry}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:border-brand-300 hover:text-brand-500 dark:border-white/10 dark:text-slate-400"
                    >
                      <Volume2 className="h-3.5 w-3.5" />
                      Cry
                    </button>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Identity */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
            >
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-sm font-bold text-slate-400">
                  {formatDexNumber(pokemon.id)}
                </span>
                {species?.is_legendary && (
                  <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-bold text-amber-600 dark:text-amber-300">
                    Legendary
                  </span>
                )}
                {species?.is_mythical && (
                  <span className="rounded-full bg-violet-400/15 px-2.5 py-0.5 text-xs font-bold text-violet-600 dark:text-violet-300">
                    Mythical
                  </span>
                )}
                {species?.is_baby && (
                  <span className="rounded-full bg-pink-400/15 px-2.5 py-0.5 text-xs font-bold text-pink-600 dark:text-pink-300">
                    Baby
                  </span>
                )}
              </div>

              <h1 className="mt-1 font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                {formatName(pokemon.name)}
              </h1>
              {genus && (
                <p className="mt-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">{genus}</p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {pokemon.types.map((t) => (
                  <TypeBadge key={t.type.name} type={t.type.name} size="lg" linked />
                ))}
              </div>

              {flavorText && (
                <p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {flavorText}
                </p>
              )}

              <div className="mt-6 grid max-w-md grid-cols-2 gap-3">
                <div className="card-surface flex items-center gap-3 p-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                    <Ruler className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Height</p>
                    <p className="text-sm font-bold">
                      {formatHeight(pokemon.height)}{' '}
                      <span className="font-medium text-slate-400">({formatHeightImperial(pokemon.height)})</span>
                    </p>
                  </div>
                </div>
                <div className="card-surface flex items-center gap-3 p-3.5">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-slate-300">
                    <Weight className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <p className="text-xs text-slate-400">Weight</p>
                    <p className="text-sm font-bold">
                      {formatWeight(pokemon.weight)}{' '}
                      <span className="font-medium text-slate-400">({formatWeightImperial(pokemon.weight)})</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <button
                  onClick={() => toggleFavorite(pokemon.id)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition',
                    favorite
                      ? 'bg-brand-500 text-white shadow-brand-500/30 hover:bg-brand-600'
                      : 'border border-slate-300 bg-white text-slate-600 hover:border-brand-300 hover:text-brand-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-200',
                  )}
                >
                  <Heart className={cn('h-4 w-4', favorite && 'fill-current')} />
                  {favorite ? 'Favorited' : 'Add to favorites'}
                </button>
                <button
                  onClick={() => toggleCompare(pokemon.id)}
                  disabled={!compared && isFull}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50',
                    compared
                      ? 'bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900'
                      : 'border border-slate-300 bg-white text-slate-600 hover:border-slate-400 dark:border-white/15 dark:bg-white/5 dark:text-slate-200',
                  )}
                >
                  <GitCompareArrows className="h-4 w-4" />
                  {compared ? 'In compare list' : isFull ? 'Compare list full' : 'Add to compare'}
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Body sections */}
      <div className="container-app grid gap-6 py-10 lg:grid-cols-2">
        <section className="card-surface p-5 sm:p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold">
            <Dna className="h-5 w-5 text-brand-500" />
            Base stats
          </h2>
          <div className="grid items-center gap-4 sm:grid-cols-2">
            <StatBars pokemon={pokemon} compact />
            <StatRadarChart
              series={[pokemonToRadarSeries(pokemon, style.color)]}
            />
          </div>
        </section>

        <section className="card-surface p-5 sm:p-6">
          <h2 className="mb-4 font-display text-lg font-bold">Abilities</h2>
          <div className="space-y-2.5">
            {pokemon.abilities.map((a) => (
              <Link
                key={a.ability.name}
                to={`/abilities/${a.ability.name}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 transition hover:border-brand-300 hover:bg-brand-500/5 dark:border-white/10 dark:hover:border-brand-500/40"
              >
                <span className="text-sm font-semibold capitalize">{formatName(a.ability.name)}</span>
                {a.is_hidden && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:bg-white/10 dark:text-slate-400">
                    Hidden
                  </span>
                )}
              </Link>
            ))}
          </div>

          {species && (
            <>
              <h3 className="mb-3 mt-6 font-display text-sm font-bold uppercase tracking-wide text-slate-400">
                Training
              </h3>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <dt className="text-xs text-slate-400">Catch rate</dt>
                  <dd className="mt-0.5 font-bold">{species.capture_rate}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <dt className="text-xs text-slate-400">Growth rate</dt>
                  <dd className="mt-0.5 font-bold capitalize">{formatName(species.growth_rate.name)}</dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <dt className="text-xs text-slate-400">Habitat</dt>
                  <dd className="mt-0.5 font-bold capitalize">
                    {species.habitat ? formatName(species.habitat.name) : 'Unknown'}
                  </dd>
                </div>
                <div className="rounded-xl bg-slate-50 p-3 dark:bg-white/5">
                  <dt className="text-xs text-slate-400">Egg groups</dt>
                  <dd className="mt-0.5 font-bold capitalize">
                    {species.egg_groups.map((g) => formatName(g.name)).join(', ') || '—'}
                  </dd>
                </div>
              </dl>
            </>
          )}
        </section>

        <section className="card-surface p-5 sm:p-6 lg:col-span-2">
          <h2 className="mb-2 font-display text-lg font-bold">Evolution chain</h2>
          {speciesQuery.isLoading ? (
            <Spinner label="Loading species data…" />
          ) : (
            <EvolutionChainView
              chain={chainQuery.data?.chain}
              isLoading={chainQuery.isLoading}
              isError={chainQuery.isError}
            />
          )}
        </section>

        <section className="card-surface p-5 sm:p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold">
            Moves <span className="text-sm font-semibold text-slate-400">({pokemon.moves.length})</span>
          </h2>
          <MovesList moves={pokemon.moves} />
        </section>
      </div>
    </div>
  )
}

function MovesList({ moves }: { moves: import('../api/types').Pokemon['moves'] }) {
  const [expanded, setExpanded] = useState(false)
  // De-dupe by move name, keep lowest level learned.
  const seen = new Map<string, { name: string; level: number; method: string }>()
  for (const m of moves) {
    for (const vg of m.version_group_details) {
      const key = m.move.name
      const existing = seen.get(key)
      const level = vg.level_learned_at
      if (!existing || (level > 0 && (existing.level === 0 || level < existing.level))) {
        seen.set(key, {
          name: key,
          level,
          method: vg.move_learn_method.name,
        })
      }
    }
  }
  const list = [...seen.values()].sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
  const shown = expanded ? list : list.slice(0, 48)

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {shown.map((m) => (
          <span
            key={m.name}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize dark:border-white/10 dark:bg-white/5"
            title={m.level > 0 ? `Learned at level ${m.level} via ${formatName(m.method)}` : `Learned via ${formatName(m.method)}`}
          >
            {formatName(m.name)}
            {m.level > 0 && (
              <span className="rounded bg-slate-200 px-1 font-mono text-[10px] font-bold text-slate-500 dark:bg-white/10 dark:text-slate-400">
                {m.level}
              </span>
            )}
          </span>
        ))}
      </div>
      {list.length > 48 && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-4 text-sm font-bold text-brand-500 hover:underline"
        >
          {expanded ? 'Show fewer' : `Show all ${list.length} moves`}
        </button>
      )}
    </div>
  )
}
