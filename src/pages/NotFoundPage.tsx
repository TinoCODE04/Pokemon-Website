import { Home, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { artworkUrl } from '../utils/format'

export default function NotFoundPage() {
  return (
    <div className="container-app flex flex-col items-center py-20 text-center">
      <img
        src={artworkUrl(54)}
        alt="A very confused Psyduck"
        className="h-44 w-44 object-contain opacity-90"
      />
      <p className="mt-2 font-mono text-sm font-bold text-brand-500">Error 404</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
        A wild missing page appeared!
      </h1>
      <p className="mt-3 max-w-md text-sm text-slate-500 dark:text-slate-400">
        This route does not exist in the tall grass. Head back to safety, or search for the
        Pokémon you were actually looking for.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-500/30 transition hover:bg-brand-600"
        >
          <Home className="h-4 w-4" />
          Back home
        </Link>
        <Link
          to="/pokedex"
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-600 transition hover:border-brand-400 hover:text-brand-500 dark:border-white/15 dark:text-slate-300"
        >
          <Search className="h-4 w-4" />
          Open Pokédex
        </Link>
      </div>
    </div>
  )
}