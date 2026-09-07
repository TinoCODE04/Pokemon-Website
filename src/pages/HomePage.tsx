import { motion } from 'framer-motion'
import {
  ArrowRight,
  Dices,
  GitCompareArrows,
  Grid3X3,
  Heart,
  Layers,
  Search,
  Sparkles,
  Swords,
} from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { extractId } from '../api/pokeapi'
import { useAllPokemon, useGenerations, usePokemonCount } from '../hooks/queries'
import { TYPE_ORDER, typeStyle } from '../constants/types'
import { artworkUrl } from '../utils/format'

const HERO_POKEMON = [
  { id: 6, className: 'right-[6%] top-8 h-40 w-40 sm:h-52 sm:w-52 lg:h-64 lg:w-64', delay: 0.1, float: 12 },
  { id: 25, className: 'right-[24%] bottom-10 h-28 w-28 sm:h-36 sm:w-36 lg:h-44 lg:w-44', delay: 0.25, float: 16 },
  { id: 448, className: 'right-[38%] top-16 hidden h-24 w-24 md:block lg:h-32 lg:w-32', delay: 0.4, float: 10 },
  { id: 94, className: 'right-[14%] bottom-[8%] hidden h-20 w-20 lg:block', delay: 0.55, float: 14 },
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

  const totalSpecies = speciesCount ?? 1025
  const genCount = generations?.count ?? 9

  const surprise = () => {
    if (!allPokemon || randomizing) return
    setRandomizing(true)
    const pick = allPokemon.results[Math.floor(Math.random() * allPokemon.results.length)]
    window.setTimeout(() => navigate(`/pokemon/${extractId(pick)}`), 250)
  }

  return (
    <div>
      {/* Hero */}
      <section className="dot-grid relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-slate-100 dark:border-white/10 dark:from-night-900 dark:to-night-950">
        <div className="container-app relative grid min-h-[520px] items-center gap-8 py-16 lg:grid-cols-2 lg:py-20">
          <div className="relative z-10 max-w-xl">
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.24 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Link
                to="/pokedex"
                className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/40"
              >
                <Grid3X3 className="h-4 w-4" />
                Open the Pokédex
              </Link>
              <button
                onClick={surprise}
                className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:shadow-md dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-white/30"
              >
                <Dices className={randomizing ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
                Surprise me
              </button>
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 px-2 py-3 text-sm font-semibold text-slate-500 transition hover:text-brand-500 dark:text-slate-400"
              >
                Compare Pokémon
                <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 flex flex-wrap gap-6 text-sm"
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
          </div>

          {/* Hero artwork cluster */}
          <div className="relative hidden h-[420px] sm:block lg:h-[480px]" aria-hidden>
            <div className="absolute right-[10%] top-1/2 h-72 w-72 -translate-y-1/2 rounded-full bg-gradient-to-br from-brand-500/20 via-amber-400/15 to-sky-400/20 blur-3xl" />
            {HERO_POKEMON.map((p) => (
              <motion.img
                key={p.id}
                src={artworkUrl(p.id)}
                alt=""
                initial={{ opacity: 0, y: 24, scale: 0.9 }}
                animate={{ opacity: 1, y: [0, -p.float, 0], scale: 1 }}
                transition={{
                  opacity: { duration: 0.5, delay: p.delay },
                  scale: { duration: 0.5, delay: p.delay },
                  y: { duration: 4 + p.delay * 2, repeat: Infinity, ease: 'easeInOut', delay: p.delay },
                }}
                className={`absolute object-contain drop-shadow-2xl ${p.className}`}
              />
            ))}
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