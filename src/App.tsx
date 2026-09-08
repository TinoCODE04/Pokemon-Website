import { AnimatePresence, motion } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { SearchModal } from './components/search/SearchModal'
import { Spinner } from './components/ui/Feedback'

const AbilityDetailPage = lazy(() => import('./pages/AbilityDetailPage'))
const AbilitiesPage = lazy(() => import('./pages/AbilitiesPage'))
const ComparePage = lazy(() => import('./pages/ComparePage'))
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'))
const GamesPage = lazy(() => import('./pages/GamesPage'))
const GenerationDetailPage = lazy(() => import('./pages/GenerationDetailPage'))
const GenerationsPage = lazy(() => import('./pages/GenerationsPage'))
const HomePage = lazy(() => import('./pages/HomePage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const PokedexPage = lazy(() => import('./pages/PokedexPage'))
const PokemonDetailPage = lazy(() => import('./pages/PokemonDetailPage'))
const TypeDetailPage = lazy(() => import('./pages/TypeDetailPage'))
const TypesPage = lazy(() => import('./pages/TypesPage'))

export default function App() {
  const location = useLocation()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const isTyping = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable
      if (event.key === '/' && !isTyping) {
        event.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener('keydown', openSearch)
    return () => window.removeEventListener('keydown', openSearch)
  }, [])

  useEffect(() => {
    const path = location.pathname
    const section = path === '/'
      ? 'Explore every Pokémon'
      : path.startsWith('/pokemon/')
        ? 'Pokémon details'
        : path.startsWith('/types/')
          ? 'Type details'
          : path.startsWith('/generations/')
            ? 'Generation details'
            : path.startsWith('/abilities/')
              ? 'Ability details'
              : path.slice(1).replace(/-/g, ' ') || 'Explorer'
    document.title = `${section.charAt(0).toUpperCase()}${section.slice(1)} | Pokémon Explorer`
  }, [location.pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[60] -translate-y-20 rounded-full bg-brand-500 px-4 py-2 text-sm font-bold text-white shadow-lg transition focus:translate-y-0"
      >
        Skip to main content
      </a>
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          id="main-content"
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
          <Suspense fallback={<Spinner label="Loading page…" />}>
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route path="/pokedex" element={<PokedexPage />} />
              <Route path="/pokemon/:id" element={<PokemonDetailPage />} />
              <Route path="/types" element={<TypesPage />} />
              <Route path="/types/:name" element={<TypeDetailPage />} />
              <Route path="/generations" element={<GenerationsPage />} />
              <Route path="/generations/:id" element={<GenerationDetailPage />} />
              <Route path="/abilities" element={<AbilitiesPage />} />
              <Route path="/abilities/:name" element={<AbilityDetailPage />} />
              <Route path="/compare" element={<ComparePage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
