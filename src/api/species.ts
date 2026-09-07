import { apiFetch } from './pokeapi'
import type { EvolutionChain, PokemonSpecies } from './types'

export function getPokemonSpecies(nameOrId: string | number) {
  return apiFetch<PokemonSpecies>(`pokemon-species/${nameOrId}`)
}

export function getEvolutionChain(id: string | number) {
  return apiFetch<EvolutionChain>(`evolution-chain/${id}`)
}