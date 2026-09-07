import { useQuery } from '@tanstack/react-query'
import { getAllPokemonEntries, getPokemon, getPokemonSpeciesCount } from '../api/pokemon'
import { getEvolutionChain, getPokemonSpecies } from '../api/species'
import { getType } from '../api/types'
import { getGeneration, getGenerations } from '../api/generations'
import { getAbility, getAbilityList } from '../api/abilities'

const STATIC_STALE = 1000 * 60 * 60 // 1h - PokéAPI data is effectively static

/** All ~1300 pokemon entries (id + name), for search/filter client-side. */
export function useAllPokemon() {
  return useQuery({
    queryKey: ['pokemon', 'all'],
    queryFn: getAllPokemonEntries,
    staleTime: STATIC_STALE,
  })
}

export function usePokemonCount() {
  return useQuery({
    queryKey: ['pokemon', 'species-count'],
    queryFn: getPokemonSpeciesCount,
    staleTime: STATIC_STALE,
    select: (d) => d.count,
  })
}

export function usePokemon(nameOrId: string | number | undefined) {
  return useQuery({
    queryKey: ['pokemon', 'detail', String(nameOrId)],
    queryFn: () => getPokemon(nameOrId!),
    enabled: nameOrId !== undefined && nameOrId !== '',
    staleTime: STATIC_STALE,
  })
}

export function usePokemonSpecies(nameOrId: string | number | undefined) {
  return useQuery({
    queryKey: ['pokemon-species', String(nameOrId)],
    queryFn: () => getPokemonSpecies(nameOrId!),
    enabled: nameOrId !== undefined && nameOrId !== '',
    staleTime: STATIC_STALE,
  })
}

export function useEvolutionChain(id: number | undefined) {
  return useQuery({
    queryKey: ['evolution-chain', id],
    queryFn: () => getEvolutionChain(id!),
    enabled: id !== undefined && id > 0,
    staleTime: STATIC_STALE,
  })
}

export function useType(name: string | undefined) {
  return useQuery({
    queryKey: ['type', name],
    queryFn: () => getType(name!),
    enabled: !!name,
    staleTime: STATIC_STALE,
  })
}

export function useGenerations() {
  return useQuery({
    queryKey: ['generations'],
    queryFn: getGenerations,
    staleTime: STATIC_STALE,
  })
}

export function useGeneration(idOrName: string | number | undefined) {
  return useQuery({
    queryKey: ['generation', String(idOrName)],
    queryFn: () => getGeneration(idOrName!),
    enabled: idOrName !== undefined && idOrName !== '',
    staleTime: STATIC_STALE,
  })
}

export function useAbilityList() {
  return useQuery({
    queryKey: ['abilities'],
    queryFn: getAbilityList,
    staleTime: STATIC_STALE,
  })
}

export function useAbility(nameOrId: string | number | undefined) {
  return useQuery({
    queryKey: ['ability', String(nameOrId)],
    queryFn: () => getAbility(nameOrId!),
    enabled: nameOrId !== undefined && nameOrId !== '',
    staleTime: STATIC_STALE,
  })
}