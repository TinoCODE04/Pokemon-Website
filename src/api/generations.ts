import { apiFetch } from './pokeapi'
import type { Generation, NamedAPIResource, PaginatedResponse } from './types'

export function getGenerations() {
  return apiFetch<PaginatedResponse<NamedAPIResource>>('generation?limit=20')
}

export function getGeneration(idOrName: string | number) {
  return apiFetch<Generation>(`generation/${idOrName}`)
}
