import { useQueries } from '@tanstack/react-query'
import { ArrowRight, Heart, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getPokemon } from '../api/pokemon'
import { PokemonCard, PokemonCardSkeleton, toCardPokemon } from '../components/pokemon/PokemonCard'
import { PokemonGrid } from '../components/pokemon/PokemonGrid'
import { EmptyState } from '../components/ui/Feedback'
import { useFavorites } from '../store/AppContext'

export default function FavoritesPage() {
  const { favorites, clearFavorites } = useFavorites()

  const queries = useQueries({
    queries: favorites.map((id) => ({
      queryKey: ['pokemon', 'detail', String(id)],
      queryFn: () => getPokemon(id),
      staleTime: 1000 * 60 * 60,
    })),
  })

  return (
    <div className="container-app py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            Favorites
            <Heart className="h-6 w-6 fill-brand-500 text-brand-500" />
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
            {favorites.length === 0
              ? 'Pokémon you favorite will live here, saved on this device.'
              : `${favorites.length} Pokémon in your collection.`}
          </p>
        </div>
        {favorites.length > 0 && (
          <button
            onClick={clearFavorites}
            className="inline-flex items-center gap-2 rounded-full border border-red-200 px-4 py-2 text-sm font-bold text-red-500 transition hover:bg-red-50 dark:border-red-500/30 dark:hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </button>
        )}
      </div>

      {favorites.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-6 w-6" />}
          title="No favorites yet"
          message="Tap the heart on any Pokémon card or detail page to build your collection."
          action={
            <Link
              to="/pokedex"
              className="mt-2 inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-600"
            >
              Browse Pokédex
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      ) : (
        <PokemonGrid>
          {queries.map((q, i) =>
            q.data ? (
              <PokemonCard key={favorites[i]} pokemon={toCardPokemon(q.data)} index={i} />
            ) : (
              <PokemonCardSkeleton key={favorites[i]} />
            ),
          )}
        </PokemonGrid>
      )}
    </div>
  )
}