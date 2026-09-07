import { apiFetch } from './pokeapi'
import type { NamedAPIResource, PaginatedResponse, Pokemon } from './types'

/** Every Pokémon entry (default + alternate forms). Powers search and client-side filtering. */
export function getAllPokemonEntries() {
  return apiFetch<PaginatedResponse<NamedAPIResource>>('pokemon?limit=100000&offset=0')
}

/** Lightweight count of all species. */
export function getPokemonSpeciesCount() {
  return apiFetch<PaginatedResponse<NamedAPIResource>>('pokemon-species?limit=1&offset=0')
}

export function getPokemon(nameOrId: string | number) {
  return apiFetch<Pokemon>(`pokemon/${nameOrId}`)
}