import { PokeballMark } from './Navbar'
import { cn } from '../../utils/cn'

export function Footer({ isHomePage = false }: { isHomePage?: boolean }) {
  const year = new Date().getFullYear()

  return (
    <footer className={cn(
      'bg-white py-6 dark:bg-night-900',
      !isHomePage && 'border-t border-slate-200 dark:border-white/10',
    )}>
      <div className="container-app flex flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center gap-2.5">
          <PokeballMark className="h-6 w-6" />
          <div>
            <p className="font-display text-sm font-bold">Pokémon World</p>
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

        <p className="text-xs font-medium text-slate-400 dark:text-slate-500">© {year} Tino · Student &amp; Developer</p>
      </div>
    </footer>
  )
}
