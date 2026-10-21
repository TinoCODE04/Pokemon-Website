import { ArrowRight, ArrowUpRight, ChevronRight, Code2, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Seo } from '../components/Seo'
import { PokeballMark } from '../components/layout/Navbar'
import { CREATOR } from '../data/about'

const EXPLORE_LINKS = [
  { to: '/pokedex', title: 'Discover every detail', text: 'Browse Pokémon, explore types and generations, and look closer at stats, abilities and evolutions.' },
  { to: '/compare', title: 'Find your favorites', text: 'Compare Pokémon side by side, then save the ones you love to your own collection.' },
  { to: '/games', title: 'Make time for a little adventure', text: 'Try a Quick Battle, take on a Legendary Challenge, or jump into Super Pokémon.' },
] as const

export default function AboutPage() {
  return (
    <div className="container-app pb-14 pt-6 sm:pb-20 sm:pt-9">
      <Seo
        title="About us"
        description="Meet Tino, the student and developer behind Pokémon World. Discover the project, explore the source code and get in touch."
        path="/about"
      />

      <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-sm text-slate-500 sm:mb-12 dark:text-slate-400">
        <Link to="/" className="inline-flex items-center hover:text-brand-600 dark:hover:text-brand-300">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span aria-current="page">About us</span>
      </nav>

      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16">
        <div className="contents lg:block">
          <header className="min-w-0 lg:pb-12">
            <h1 className="max-w-2xl text-balance font-display text-4xl font-extrabold leading-[1.1] tracking-tight sm:text-5xl xl:text-6xl">
              The story behind <span className="text-brand-600 dark:text-brand-400">Pokémon World.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              A personal project for curious Trainers. Explore a new Pokémon, find your next favorite, or enjoy a friendly battle — all in one place.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/pokedex" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-brand-700">
                Explore the Pokédex <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <a href={CREATOR.repositoryUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-sm font-bold transition hover:border-brand-500 hover:text-brand-600 dark:border-slate-600 dark:hover:text-brand-300">
                <Code2 className="h-4 w-4" aria-hidden="true" /> View source code
                <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
              </a>
            </div>
          </header>

          <section aria-labelledby="about-explore-heading" className="order-2 min-w-0 border-t border-slate-200 pt-8 lg:order-none dark:border-white/10">
            <h2 id="about-explore-heading" className="font-display text-2xl font-bold tracking-tight">A world worth exploring.</h2>
            <div className="mt-3 divide-y divide-slate-200 dark:divide-white/10">
              {EXPLORE_LINKS.map((item) => (
                <Link key={item.to} to={item.to} className="group flex items-center gap-5 py-5">
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-bold transition-colors group-hover:text-brand-600 dark:group-hover:text-brand-300">{item.title}</h3>
                    <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{item.text}</p>
                  </div>
                  <ArrowRight className="ml-auto h-5 w-5 shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-brand-600 dark:group-hover:text-brand-300" aria-hidden="true" />
                </Link>
              ))}
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Prefer a movie night? <Link to="/movies" className="font-semibold text-brand-600 underline decoration-brand-500/40 underline-offset-4 hover:decoration-brand-600 dark:text-brand-300">Explore the Pokémon movie collection.</Link>
            </p>
          </section>
        </div>

        <aside aria-labelledby="about-creator-heading" className="order-1 min-w-0 rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 lg:order-none dark:border-white/10 dark:bg-night-900">
          <PokeballMark className="mb-6 h-14 w-14" />
          <h2 id="about-creator-heading" className="font-display text-3xl font-bold tracking-tight">Hi, I’m {CREATOR.name}.</h2>
          <p className="mt-2 font-medium text-brand-600 dark:text-brand-300">{CREATOR.role}</p>
          <p className="mt-5 text-sm leading-7 text-slate-600 dark:text-slate-300">{CREATOR.introduction}</p>

          <h3 className="mb-2 mt-8 font-display text-lg font-bold">Find me online</h3>
          <div className="divide-y divide-slate-200 dark:divide-white/10">
            {CREATOR.socialLinks.map((platform) => (
              <a key={platform.name} href={platform.href} target="_blank" rel="noopener noreferrer" aria-label={`Follow ${CREATOR.name} on ${platform.name}`} className="group flex min-h-20 items-center gap-3 py-4">
                <img src={platform.icon} alt="" width="24" height="24" className="h-6 w-6 shrink-0 opacity-80 dark:invert" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold group-hover:text-brand-600 dark:group-hover:text-brand-300">{platform.name}</span>
                  <span className="mt-0.5 block break-words text-sm text-slate-500 dark:text-slate-400">{platform.handle}</span>
                </span>
                <ArrowUpRight className="ml-auto h-4 w-4 shrink-0 text-slate-400 group-hover:text-brand-600 dark:group-hover:text-brand-300" aria-hidden="true" />
              </a>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-12 grid gap-10 border-t border-slate-200 pt-10 sm:mt-16 sm:pt-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:gap-16 dark:border-white/10">
        <section aria-labelledby="about-notes-heading">
          <h2 id="about-notes-heading" className="font-display text-2xl font-bold tracking-tight">A few things to know.</h2>
          <dl className="mt-6 space-y-6 text-sm leading-relaxed">
            <div>
              <dt className="font-semibold">Made possible by open data</dt>
              <dd className="mt-1 text-slate-600 dark:text-slate-400">Pokémon data comes from <a href="https://pokeapi.co" target="_blank" rel="noopener noreferrer" className="font-semibold text-brand-600 underline underline-offset-4 dark:text-brand-300">PokéAPI</a>. Movie references are listed on each movie’s detail page.</dd>
            </div>
            <div>
              <dt className="font-semibold">Your collection stays with your browser</dt>
              <dd className="mt-1 text-slate-600 dark:text-slate-400">Favorites, comparison picks and preferences are saved on this device. They don’t sync across devices, and clearing site data removes them.</dd>
            </div>
            <div>
              <dt className="font-semibold">An independent fan project</dt>
              <dd className="mt-1 text-slate-600 dark:text-slate-400">Pokémon World is a personal, fan-made project and is not an official Pokémon website. It’s built with React, TypeScript and Tailwind CSS.</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="about-feedback-heading" className="self-start rounded-2xl bg-brand-50 p-6 sm:p-8 dark:bg-brand-500/10">
          <MessageSquare className="mb-4 h-6 w-6 text-brand-600 dark:text-brand-300" aria-hidden="true" />
          <h2 id="about-feedback-heading" className="font-display text-2xl font-bold tracking-tight">Have an idea?</h2>
          <p className="mt-3 text-sm leading-7 text-slate-700 dark:text-slate-300">Spotted a bug, a missing detail or something you’d love to see? Share it on GitHub with the page link and a short description.</p>
          <a href={CREATOR.feedbackUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 items-center gap-2 font-semibold text-brand-700 underline decoration-brand-500/40 underline-offset-4 hover:decoration-brand-700 dark:text-brand-300">
            Share feedback <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>
      </div>
    </div>
  )
}
