import { AnimatePresence, motion } from 'framer-motion'
import { GitCompareArrows, Heart, Menu, Moon, Search, Sun, X } from 'lucide-react'
import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useFavorites } from '../../store/AppContext'
import { useTheme } from '../../hooks/useTheme'
import { cn } from '../../utils/cn'

const NAV_LINKS = [
  { to: '/', label: 'Home' },
  { to: '/pokedex', label: 'Pokédex' },
  { to: '/rankings', label: 'Top Rank' },
  { to: '/types', label: 'Types' },
  { to: '/generations', label: 'Generations' },
  { to: '/abilities', label: 'Abilities' },
  { to: '/compare', label: 'Compare' },
  { to: '/games', label: 'Games' },
  { to: '/favorites', label: 'Favorites' },
]

export function PokeballMark({ className }: { className?: string }) {
  return (
    <span className={cn('relative inline-block overflow-hidden rounded-full', className)} aria-hidden>
      <span className="absolute inset-0 rounded-full border-2 border-slate-800 bg-gradient-to-b from-brand-500 from-50% to-white to-50% dark:border-slate-200" />
      <span className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-slate-800 dark:bg-slate-200" />
      <span className="absolute left-1/2 top-1/2 h-[38%] w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-800 bg-white dark:border-slate-200" />
    </span>
  )
}

export function Navbar({ onOpenSearch }: { onOpenSearch: () => void }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { favorites } = useFavorites()
  const { theme, toggle } = useTheme()

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/80 backdrop-blur-xl dark:border-white/10 dark:bg-night-950/80">
      <nav className="container-app flex h-16 min-w-0 items-center justify-between gap-2 sm:gap-3">
        <Link to="/" className="flex shrink-0 items-center gap-2 sm:gap-2.5" onClick={() => setMobileOpen(false)}>
          <PokeballMark className="h-7 w-7 shrink-0" />
          <span className="truncate font-display text-base font-bold tracking-tight sm:text-lg">
            Pokémon <span className="hidden text-brand-500 sm:inline">Explorer</span>
          </span>
        </Link>

        <div className="hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) =>
                cn(
                  'relative whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'text-brand-600 dark:text-brand-300'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                )
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-full bg-brand-500/10 dark:bg-brand-500/20"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          <button
            onClick={onOpenSearch}
            className="hidden h-9 items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-700 sm:flex max-2xl:w-9 max-2xl:px-0 dark:border-white/10 dark:bg-white/5 dark:text-slate-400 dark:hover:border-white/20 dark:hover:text-slate-200"
            aria-label="Search Pokémon"
          >
            <Search className="h-4 w-4" />
            <span className="hidden 2xl:inline">Search</span>
            <kbd className="hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 2xl:inline dark:border-white/10 dark:bg-white/10 dark:text-slate-500">
              /
            </kbd>
          </button>
          <button
            onClick={onOpenSearch}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 sm:hidden dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Search Pokémon"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            onClick={toggle}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="flex"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.span>
            </AnimatePresence>
          </button>

          <Link
            to="/favorites"
            className="relative hidden h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 sm:flex dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Favorites"
          >
            <Heart className="h-5 w-5" />
            {favorites.length > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {favorites.length > 99 ? '99+' : favorites.length}
              </span>
            )}
          </Link>

          <Link
            to="/compare"
            className="hidden h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 md:flex dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Compare Pokémon"
          >
            <GitCompareArrows className="h-5 w-5" />
          </Link>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 md:hidden dark:text-slate-300 dark:hover:bg-white/10"
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      <div className="hidden border-t border-slate-200/70 md:block xl:hidden dark:border-white/10">
        <div className="container-app overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <nav className="flex h-11 min-w-[640px] items-center justify-between gap-1" aria-label="Primary navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'relative whitespace-nowrap rounded-full px-2.5 py-1.5 text-[13px] font-medium transition-colors',
                    isActive
                      ? 'text-brand-600 dark:text-brand-300'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {isActive && <span className="absolute inset-0 -z-10 rounded-full bg-brand-500/10 dark:bg-brand-500/20" />}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-slate-200 bg-white md:hidden dark:border-white/10 dark:bg-night-950"
          >
            <div className="container-app grid gap-1 py-3">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'rounded-xl px-4 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-300'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5',
                    )
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
