import { apiFetch } from './pokeapi'
import type { Ability, NamedAPIResource, PaginatedResponse } from './types'

export function getAbilityList() {
  return apiFetch<PaginatedResponse<NamedAPIResource>>('ability?limit=400&offset=0')
}

export function getAbility(nameOrId: string | number) {
  return apiFetch<Ability>(`ability/${nameOrId}`)
}