import { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { COMPARE_KEY, FAVORITES_KEY, MAX_COMPARE } from '../constants/types'
import { addPokemonToCompare } from '../utils/compare'
import { useLocalStorage } from './useLocalStorage'

interface FavoritesContextValue {
  favorites: number[]
  isFavorite: (id: number) => boolean
  toggleFavorite: (id: number) => void
  clearFavorites: () => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useLocalStorage<number[]>(FAVORITES_KEY, [])

  const isFavorite = useCallback((id: number) => favorites.includes(id), [favorites])
  const toggleFavorite = useCallback(
    (id: number) => {
      setFavorites((prev) => (prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]))
    },
    [setFavorites],
  )
  const clearFavorites = useCallback(() => setFavorites([]), [setFavorites])

  const value = useMemo(
    () => ({ favorites, isFavorite, toggleFavorite, clearFavorites }),
    [favorites, isFavorite, toggleFavorite, clearFavorites],
  )
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites(): FavoritesContextValue {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider')
  return ctx
}

interface CompareContextValue {
  compare: number[]
  inCompare: (id: number) => boolean
  addToCompare: (id: number) => void
  toggleCompare: (id: number) => void
  removeFromCompare: (id: number) => void
  clearCompare: () => void
  isFull: boolean
}

const CompareContext = createContext<CompareContextValue | null>(null)

export function CompareProvider({ children }: { children: ReactNode }) {
  const [compare, setCompare] = useLocalStorage<number[]>(COMPARE_KEY, [])

  const inCompare = useCallback((id: number) => compare.includes(id), [compare])
  const addToCompare = useCallback(
    (id: number) => setCompare((prev) => addPokemonToCompare(prev, id, MAX_COMPARE)),
    [setCompare],
  )
  const toggleCompare = useCallback(
    (id: number) => {
      setCompare((prev) => {
        if (prev.includes(id)) return prev.filter((c) => c !== id)
        return addPokemonToCompare(prev, id, MAX_COMPARE)
      })
    },
    [setCompare],
  )
  const removeFromCompare = useCallback(
    (id: number) => setCompare((prev) => prev.filter((c) => c !== id)),
    [setCompare],
  )
  const clearCompare = useCallback(() => setCompare([]), [setCompare])

  const value = useMemo(
    () => ({ compare, inCompare, addToCompare, toggleCompare, removeFromCompare, clearCompare, isFull: compare.length >= MAX_COMPARE }),
    [compare, inCompare, addToCompare, toggleCompare, removeFromCompare, clearCompare],
  )
  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

export function useCompare(): CompareContextValue {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}
