import { apiFetch } from './pokeapi'

export interface NamedAPIResource {
  name: string
  url: string
}

export interface PaginatedResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface PokemonSprites {
  front_default: string | null
  front_shiny: string | null
  back_default: string | null
  back_shiny: string | null
  front_female: string | null
  other?: {
    'official-artwork'?: { front_default: string | null; front_shiny: string | null }
    dream_world?: { front_default: string | null }
    home?: { front_default: string | null; front_shiny: string | null }
    showdown?: { front_default: string | null; back_default: string | null }
  }
}

export interface Pokemon {
  id: number
  name: string
  height: number
  weight: number
  base_experience: number | null
  is_default: boolean
  sprites: PokemonSprites
  types: { slot: number; type: NamedAPIResource }[]
  abilities: { ability: NamedAPIResource; is_hidden: boolean; slot: number }[]
  stats: { base_stat: number; effort: number; stat: NamedAPIResource }[]
  moves: {
    move: NamedAPIResource
    version_group_details: {
      level_learned_at: number
      move_learn_method: NamedAPIResource
      version_group: NamedAPIResource
    }[]
  }[]
  species: NamedAPIResource
  cries: { latest: string | null; legacy: string | null }
  held_items: { item: NamedAPIResource }[]
}

export interface PokemonSpecies {
  id: number
  name: string
  order: number
  genera: { genus: string; language: NamedAPIResource }[]
  flavor_text_entries: { flavor_text: string; language: NamedAPIResource; version: NamedAPIResource }[]
  evolution_chain: { url: string }
  habitat: NamedAPIResource | null
  generation: NamedAPIResource
  capture_rate: number
  growth_rate: NamedAPIResource
  is_legendary: boolean
  is_mythical: boolean
  is_baby: boolean
  gender_rate: number
  egg_groups: NamedAPIResource[]
  color: NamedAPIResource
  shape: NamedAPIResource | null
  evolves_from_species: NamedAPIResource | null
  varieties: { is_default: boolean; pokemon: NamedAPIResource }[]
}

export interface EvolutionDetail {
  min_level: number | null
  item: NamedAPIResource | null
  trigger: NamedAPIResource
  held_item: NamedAPIResource | null
  known_move: NamedAPIResource | null
  min_happiness: number | null
  min_affection: number | null
  min_beauty: number | null
  time_of_day: string
  location: NamedAPIResource | null
  needs_overworld_rain: boolean
  turn_upside_down: boolean
  gender: number | null
  relative_physical_stats: number | null
  party_species: NamedAPIResource | null
  party_type: NamedAPIResource | null
  trade_species: NamedAPIResource | null
}

export interface ChainLink {
  species: NamedAPIResource
  evolves_to: ChainLink[]
  evolution_details: EvolutionDetail[]
}

export interface EvolutionChain {
  id: number
  chain: ChainLink
}

export interface DamageRelations {
  double_damage_from: NamedAPIResource[]
  double_damage_to: NamedAPIResource[]
  half_damage_from: NamedAPIResource[]
  half_damage_to: NamedAPIResource[]
  no_damage_from: NamedAPIResource[]
  no_damage_to: NamedAPIResource[]
}

export interface PokemonType {
  id: number
  name: string
  damage_relations: DamageRelations
  pokemon: { slot: number; pokemon: NamedAPIResource }[]
  moves: NamedAPIResource[]
  generation: NamedAPIResource
}

export interface Generation {
  id: number
  name: string
  main_region: NamedAPIResource
  pokemon_species: NamedAPIResource[]
  types: NamedAPIResource[]
  moves: NamedAPIResource[]
  abilities: NamedAPIResource[]
  version_groups: NamedAPIResource[]
}

export interface Ability {
  id: number
  name: string
  is_main_series: boolean
  effect_entries: { effect: string; short_effect: string; language: NamedAPIResource }[]
  flavor_text_entries: { flavor_text: string; language: NamedAPIResource }[]
  pokemon: { is_hidden: boolean; slot: number; pokemon: NamedAPIResource }[]
  generation: NamedAPIResource
}

export function getTypeList() {
  return apiFetch<PaginatedResponse<NamedAPIResource>>('type?limit=30')
}

export function getType(name: string | number) {
  return apiFetch<PokemonType>(`type/${name}`)
}