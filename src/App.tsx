import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { SearchModal } from './components/search/SearchModal'
import AbilityDetailPage from './pages/AbilityDetailPage'
import AbilitiesPage from './pages/AbilitiesPage'
import ComparePage from './pages/ComparePage'
import FavoritesPage from './pages/FavoritesPage'
import GenerationDetailPage from './pages/GenerationDetailPage'
import GenerationsPage from './pages/GenerationsPage'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import PokedexPage from './pages/PokedexPage'
import PokemonDetailPage from './pages/PokemonDetailPage'
import TypeDetailPage from './pages/TypeDetailPage'
import TypesPage from './pages/TypesPage'

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

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar onOpenSearch={() => setSearchOpen(true)} />
      <AnimatePresence mode="wait" initial={false}>
        <motion.main
          key={location.pathname}
          className="flex-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.16 }}
        >
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
            <Route path="/favorites" element={<FavoritesPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </motion.main>
      </AnimatePresence>
      <Footer />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  )
}
