import { motion, useAnimation } from 'framer-motion'
import { useQueries } from '@tanstack/react-query'
import {
  ArrowRight,
  Crown,
  Dices,
  GitCompareArrows,
  Grid3X3,
  Heart,
  Layers,
  Search,
  Sparkles,
  Swords,
} from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { extractId } from '../api/pokeapi'
import { getPokemon } from '../api/pokemon'
import { useAllPokemon, useGenerations, usePokemonCount } from '../hooks/queries'
import { RECENT_KEY, TYPE_ORDER, typeStyle } from '../constants/types'
import { artworkUrl } from '../utils/format'
import { useLocalStorage } from '../store/useLocalStorage'
import { PokemonCard, PokemonCardSkeleton, toCardPokemon } from '../components/pokemon/PokemonCard'
import { PokemonGrid } from '../components/pokemon/PokemonGrid'

type HeroTrick = 'roar' | 'bounce' | 'spin' | 'levitate' | 'dash-right' | 'dash-left'

interface HeroPokemonConfig {
  id: number
  name: string
  action: string
  trick: HeroTrick
  className: string
  delay: number
  float: number
}

const HERO_POKEMON: HeroPokemonConfig[] = [
  { id: 6, name: 'Charizard', action: 'roar', trick: 'roar', className: 'right-[17%] top-[17%] z-20 h-52 w-52 lg:h-72 lg:w-72', delay: 0.1, float: 8 },
  { id: 25, name: 'Pikachu', action: 'double-jump', trick: 'bounce', className: 'bottom-[7%] left-[29%] z-20 h-32 w-32 lg:h-44 lg:w-44', delay: 0.22, float: 10 },
  { id: 448, name: 'Lucario', action: 'spin-kick', trick: 'spin', className: 'left-[4%] top-[10%] z-10 h-28 w-28 lg:h-36 lg:w-36', delay: 0.34, float: 7 },
  { id: 150, name: 'Mewtwo', action: 'levitate', trick: 'levitate', className: 'right-0 top-[2%] z-10 h-28 w-28 lg:h-36 lg:w-36', delay: 0.46, float: 12 },
  { id: 381, name: 'Latios', action: 'dash', trick: 'dash-right', className: 'bottom-[3%] left-0 z-10 h-24 w-24 lg:h-32 lg:w-32', delay: 0.58, float: 8 },
  { id: 380, name: 'Latias', action: 'dash', trick: 'dash-left', className: 'bottom-[5%] right-0 z-10 h-24 w-24 lg:h-32 lg:w-32', delay: 0.7, float: 9 },
]

const FEATURE_TILES = [
  {
    to: '/pokedex',
    icon: Grid3X3,
    title: 'Complete Pokédex',
    text: 'Every Pokémon from all nine generations, with artwork, stats, evolutions and moves.',
    accent: 'from-brand-500/15 to-brand-500/5 text-brand-500',
  },
  {
    to: '/types',
    icon: Swords,
    title: 'Type matchups',
    text: 'Explore all 18 types with full offensive and defensive effectiveness charts.',
    accent: 'from-sky-500/15 to-sky-500/5 text-sky-500',
  },
  {
    to: '/compare',
    icon: GitCompareArrows,
    title: 'Side-by-side compare',
    text: 'Put up to three Pokémon head to head across every base stat.',
    accent: 'from-violet-500/15 to-violet-500/5 text-violet-500',
  },
  {
    to: '/favorites',
    icon: Heart,
    title: 'Your favorites',
    text: 'Build a personal collection that stays saved on this device.',
    accent: 'from-rose-500/15 to-rose-500/5 text-rose-500',
  },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { data: allPokemon } = useAllPokemon()
  const { data: generations } = useGenerations()
  const { data: speciesCount } = usePokemonCount()
  const [randomizing, setRandomizing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [recentlyViewed] = useLocalStorage<number[]>(RECENT_KEY, [])
  const recentQueries = useQueries({
    queries: recentlyViewed.map((id) => ({
      queryKey: ['pokemon', 'detail', String(id)],
      queryFn: () => getPokemon(id),
      staleTime: 1000 * 60 * 60,
    })),
  })

  const totalSpecies = speciesCount ?? 1025
  const genCount = generations?.count ?? 9

  const surprise = () => {
    if (!allPokemon || randomizing) return
    setRandomizing(true)
    const pick = allPokemon.results[Math.floor(Math.random() * allPokemon.results.length)]
    window.setTimeout(() => navigate(`/pokemon/${extractId(pick)}`), 250)
  }

  const searchPokedex = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = searchQuery.trim()
    navigate(query ? `/pokedex?q=${encodeURIComponent(query)}` : '/pokedex')
  }

  return (
    <div>
      {/* Hero */}
      <section className="hero-atmosphere relative overflow-hidden border-b border-slate-200 dark:border-white/10">
        <div className="pointer-events-none absolute inset-0 opacity-40" aria-hidden>
          <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full border border-brand-500/15" />
          <div className="absolute -right-8 -top-16 h-72 w-72 rounded-full border border-sky-400/10" />
        </div>
        <div className="container-app relative grid min-h-[480px] items-center gap-8 py-12 lg:grid-cols-2 lg:py-16">
          <div className="relative z-10 min-w-0 max-w-xl">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-brand-500/25 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-600 dark:text-brand-300"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Powered by PokéAPI — {totalSpecies.toLocaleString()} species
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.08 }}
              className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl"
            >
              Explore the world of{' '}
              <span className="bg-gradient-to-r from-brand-500 via-amber-500 to-sky-500 bg-clip-text text-transparent">
                Pokémon
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.16 }}
              className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300"
            >
              A modern Pokédex and encyclopedia: browse every species, dive into stats and
              evolutions, master type matchups, and compare your favorites side by side.
            </motion.p>

            <motion.form
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.22 }}
              onSubmit={searchPokedex}
              className="mt-7 flex max-w-xl items-center gap-2 rounded-2xl border border-slate-200 bg-white/90 p-2 shadow-xl shadow-slate-900/5 backdrop-blur dark:border-white/15 dark:bg-white/8 dark:shadow-black/20"
            >
              <Search className="ml-2 h-5 w-5 shrink-0 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search by name or Pokédex number"
                aria-label="Search the Pokédex"
                className="h-11 min-w-0 flex-1 bg-transparent px-1 text-base outline-none placeholder:text-slate-400"
              />
              <button
                type="submit"
                className="inline-flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-brand-500 px-3 text-sm font-bold text-white shadow-md shadow-brand-500/25 transition hover:bg-brand-600 sm:w-auto sm:px-5"
              >
                <span className="hidden sm:inline">Search</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </motion.form>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.3 }}
              className="mt-4 flex flex-wrap items-center gap-2 sm:gap-3"
            >
              <Link
                to="/pokedex"
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-300 bg-white/70 px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-brand-400 hover:text-brand-500 dark:border-white/15 dark:bg-white/5 dark:text-slate-200"
              >
                <Grid3X3 className="h-4 w-4" />
                Browse all
              </Link>
              <Link
                to="/pokedex?legendary=1"
                className="group relative inline-flex min-h-11 items-center gap-2 overflow-hidden rounded-full border border-amber-400/40 bg-amber-400/10 px-5 py-2.5 text-sm font-extrabold text-amber-700 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-400/20 hover:shadow-lg hover:shadow-amber-500/10 dark:text-amber-300"
              >
                <span className="absolute -left-5 top-0 h-full w-8 -skew-x-12 bg-white/25 blur-sm transition-transform duration-500 group-hover:translate-x-48" />
                <Crown className="relative h-4 w-4" />
                <span className="relative">Legendary Pokémon</span>
              </Link>
              <button
                onClick={surprise}
                className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-white/70 hover:text-brand-500 dark:text-slate-300 dark:hover:bg-white/8"
              >
                <Dices className={randomizing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                Surprise me
              </button>
              <Link
                to="/compare"
                className="inline-flex min-h-11 items-center gap-2 px-2 py-2.5 text-sm font-semibold text-slate-500 transition hover:text-brand-500 dark:text-slate-400"
              >
                Compare Pokémon
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-7 flex flex-wrap gap-5 text-sm sm:gap-6"
            >
              {[
                [totalSpecies.toLocaleString(), 'Species'],
                [String(genCount), 'Generations'],
                ['18', 'Types'],
                ['360+', 'Abilities'],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-display text-2xl font-extrabold">{value}</p>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{label}</p>
                </div>
              ))}
            </motion.div>

            <div className="mt-7 grid grid-cols-3 gap-2 sm:hidden" role="group" aria-label="Interactive Pokémon team">
              <p className="col-span-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Sparkles className="h-3.5 w-3.5 text-accent-500" />
                Tap a Pokémon
              </p>
              {HERO_POKEMON.map((pokemon) => (
                <InteractiveHeroPokemon key={pokemon.id} pokemon={pokemon} compact />
              ))}
            </div>
          </div>

          {/* Hero artwork cluster */}
          <div className="relative hidden h-[410px] sm:block lg:h-[450px]" role="group" aria-label="Interactive Pokémon team">
            <div className="absolute right-[10%] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-500/20 via-amber-400/15 to-sky-400/20 blur-3xl" />
            {HERO_POKEMON.map((p) => (
              <InteractiveHeroPokemon key={p.id} pokemon={p} />
            ))}
            <div className="pointer-events-none absolute left-1/2 top-1 -translate-x-1/2 rounded-full border border-white/10 bg-slate-950/35 px-3 py-1.5 text-xs font-semibold text-slate-500 backdrop-blur dark:text-slate-400">
              <span className="flex items-center gap-1.5 whitespace-nowrap">
                <Sparkles className="h-3.5 w-3.5 text-accent-500" />
                Click a Pokémon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Feature tiles */}
      <section className="container-app py-14">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURE_TILES.map((tile, i) => (
            <motion.div
              key={tile.to}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Link
                to={tile.to}
                className="card-surface group flex h-full flex-col gap-3 p-5 transition-shadow hover:shadow-lg"
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${tile.accent}`}
                >
                  <tile.icon className="h-5 w-5" />
                </span>
                <h3 className="font-display font-bold">{tile.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{tile.text}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-1 text-xs font-bold text-brand-500 opacity-0 transition group-hover:opacity-100">
                  Explore <ArrowRight className="h-3.5 w-3.5" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {recentlyViewed.length > 0 && (
        <section className="container-app pb-4">
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">Recently viewed</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Continue exploring where you left off.</p>
            </div>
            <Link to="/pokedex" className="text-sm font-bold text-brand-500 hover:underline">Browse all</Link>
          </div>
          <PokemonGrid>
            {recentQueries.map((query, index) => query.data
              ? <PokemonCard key={recentlyViewed[index]} pokemon={toCardPokemon(query.data)} index={index} />
              : <PokemonCardSkeleton key={recentlyViewed[index]} />)}
          </PokemonGrid>
        </section>
      )}

      {/* Types overview */}
      <section className="border-y border-slate-200 bg-white py-14 dark:border-white/10 dark:bg-night-900">
        <div className="container-app">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
                Master every type
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Eighteen types, each with unique strengths and weaknesses.
              </p>
            </div>
            <Link
              to="/types"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-500 transition hover:gap-2.5"
            >
              All types <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 lg:grid-cols-9">
            {TYPE_ORDER.map((type, i) => {
              const style = typeStyle(type)
              const Icon = style.icon
              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.25, delay: i * 0.02 }}
                >
                  <Link
                    to={`/types/${type}`}
                    className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-2 py-4 transition hover:-translate-y-1 hover:shadow-md dark:border-white/10 dark:bg-white/5"
                  >
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-full text-white shadow-sm transition-transform group-hover:scale-110"
                      style={{ background: `linear-gradient(135deg, ${style.gradient[0]}, ${style.gradient[1]})` }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="text-xs font-semibold capitalize text-slate-600 dark:text-slate-300">
                      {type}
                    </span>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Generations preview */}
      <section className="container-app py-14">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              Journey through the generations
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              From Kanto to Paldea — every region, every era.
            </p>
          </div>
          <Link
            to="/generations"
            className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-500 transition hover:gap-2.5"
          >
            All generations <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <GenerationPreview />
      </section>

      {/* CTA band */}
      <section className="container-app pb-16">
        <div className="dot-grid relative overflow-hidden rounded-3xl bg-gradient-to-br from-night-900 to-night-950 px-6 py-12 text-center text-white sm:px-12 dark:border dark:border-white/10">
          <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-brand-500/25 blur-3xl" />
          <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-sky-500/20 blur-3xl" />
          <Layers className="mx-auto h-8 w-8 text-accent-500" />
          <h2 className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">
            Ready to catch up on every Pokémon?
          </h2>
          <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300">
            Search over one thousand species instantly, or browse the full National Pokédex with
            filters for type, generation and more.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/pokedex"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-900 shadow-lg transition hover:bg-slate-100"
            >
              <Search className="h-4 w-4" />
              Start exploring
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

function InteractiveHeroPokemon({ pokemon, compact = false }: { pokemon: HeroPokemonConfig; compact?: boolean }) {
  const controls = useAnimation()
  const [burst, setBurst] = useState(0)

  const playTrick = () => {
    controls.stop()
    setBurst((value) => value + 1)

    const animations = {
      roar: {
        y: [0, -16, 0],
        rotate: [0, -4, 4, 0],
        scale: [1, 1.13, 1],
        transition: { duration: 0.72, ease: 'easeOut' as const },
      },
      bounce: {
        y: [0, -38, 0, -18, 0],
        rotate: [0, -7, 6, -3, 0],
        scale: [1, 1.06, 1, 1.03, 1],
        transition: { duration: 0.85, ease: 'easeOut' as const },
      },
      spin: {
        y: [0, -18, 0],
        rotate: [0, -18, 360],
        scale: [1, 1.1, 1],
        transition: { duration: 0.75, ease: 'easeInOut' as const },
      },
      levitate: {
        y: [0, -34, -26, 0],
        rotate: [0, -5, 5, 0],
        scale: [1, 1.12, 1.08, 1],
        transition: { duration: 1, ease: 'easeInOut' as const },
      },
      'dash-right': {
        x: [0, 42, -12, 0],
        y: [0, -10, 0],
        rotate: [0, -10, 4, 0],
        scale: [1, 1.08, 1],
        transition: { duration: 0.62, ease: 'easeOut' as const },
      },
      'dash-left': {
        x: [0, -42, 12, 0],
        y: [0, -10, 0],
        rotate: [0, 10, -4, 0],
        scale: [1, 1.08, 1],
        transition: { duration: 0.62, ease: 'easeOut' as const },
      },
    }

    void controls.start(animations[pokemon.trick])
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.88 }}
      animate={{ opacity: 1, y: [0, -pokemon.float, 0], scale: 1 }}
      transition={{
        opacity: { duration: 0.45, delay: pokemon.delay },
        scale: { duration: 0.45, delay: pokemon.delay },
        y: { duration: 4.2 + pokemon.delay, repeat: Infinity, ease: 'easeInOut', delay: pokemon.delay },
      }}
      whileHover={{ scale: 1.07 }}
      whileTap={{ scale: 0.94 }}
      onClick={playTrick}
      aria-label={`Make ${pokemon.name} ${pokemon.action}`}
      title={`Click ${pokemon.name}`}
      className={`${compact ? 'relative mx-auto h-20 w-20' : `absolute ${pokemon.className}`} touch-manipulation rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-400`}
    >
      {burst > 0 && (
        <motion.span
          key={burst}
          className="pointer-events-none absolute inset-[18%] rounded-full border-2 border-accent-400/80"
          initial={{ opacity: 0.9, scale: 0.35 }}
          animate={{ opacity: 0, scale: 1.45 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}
      <motion.img
        animate={controls}
        src={artworkUrl(pokemon.id)}
        alt=""
        draggable={false}
        onError={(event) => { event.currentTarget.style.display = 'none' }}
        className="pointer-events-none h-full w-full select-none object-contain drop-shadow-2xl"
      />
    </motion.button>
  )
}

function GenerationPreview() {
  const { data, isLoading } = useGenerations()
  const count = data?.count ?? 9
  const gens = Array.from({ length: count }, (_, i) => i + 1)
  const regionNames: Record<number, string> = {
    1: 'Kanto',
    2: 'Johto',
    3: 'Hoenn',
    4: 'Sinnoh',
    5: 'Unova',
    6: 'Kalos',
    7: 'Alola',
    8: 'Galar',
    9: 'Paldea',
  }
  const genStarters: Record<number, [number, number, number]> = {
    1: [1, 4, 7],
    2: [152, 155, 158],
    3: [252, 255, 258],
    4: [387, 390, 393],
    5: [495, 498, 501],
    6: [650, 653, 656],
    7: [722, 725, 728],
    8: [810, 813, 816],
    9: [906, 909, 912],
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 lg:grid-cols-9">
        {gens.map((g) => (
          <div key={g} className="card-surface h-36 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-3 gap-3 lg:grid-cols-9">
      {gens.map((gen, i) => (
        <motion.div
          key={gen}
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.3, delay: i * 0.04 }}
        >
          <Link
            to={`/generations/${gen}`}
            className="card-surface group flex h-full flex-col items-center gap-1 p-4 text-center transition hover:-translate-y-1 hover:shadow-lg"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-500">
              Gen {['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'][gen - 1] ?? gen}
            </span>
            <div className="my-1 flex -space-x-3">
              {(genStarters[gen] ?? [1, 4, 7]).map((id) => (
                <img
                  key={id}
                  src={artworkUrl(id)}
                  alt=""
                  loading="lazy"
                  className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 object-contain p-0.5 transition group-hover:scale-110 dark:border-night-900 dark:bg-white/10"
                />
              ))}
            </div>
            <span className="text-sm font-bold">{regionNames[gen] ?? `Gen ${gen}`}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
