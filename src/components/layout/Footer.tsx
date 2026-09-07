import { Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PokeballMark } from './Navbar'

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white py-10 dark:border-white/10 dark:bg-night-900">
      <div className="container-app flex flex-col items-center gap-6 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <PokeballMark className="h-6 w-6" />
          <div>
            <p className="font-display text-sm font-bold">Pokémon Explorer</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Data from{' '}
              <a
                href="https://pokeapi.co"
                target="_blank"
                rel="noreferrer"
                className="font-medium text-brand-500 hover:underline"
              >
                PokéAPI
              </a>
            </p>
          </div>
        </div>

        <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
          <Link className="transition hover:text-brand-500" to="/pokedex">Pokédex</Link>
          <Link className="transition hover:text-brand-500" to="/types">Types</Link>
          <Link className="transition hover:text-brand-500" to="/generations">Generations</Link>
          <Link className="transition hover:text-brand-500" to="/abilities">Abilities</Link>
          <Link className="transition hover:text-brand-500" to="/compare">Compare</Link>
          <Link className="transition hover:text-brand-500" to="/favorites">Favorites</Link>
        </nav>

        <p className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          Built with <Heart className="h-3.5 w-3.5 fill-brand-500 text-brand-500" /> for trainers
        </p>
      </div>
    </footer>
  )
}