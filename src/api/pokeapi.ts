export const API_BASE_URL = 'https://pokeapi.co/api/v2'

export class PokeApiError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'PokeApiError'
    this.status = status
  }
}

export async function apiFetch<T>(endpoint: string): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}/${endpoint.replace(/^\//, '')}`

  let response: Response
  try {
    response = await fetch(url)
  } catch {
    throw new PokeApiError('Network error. Check your connection and try again.')
  }

  if (!response.ok) {
    if (response.status === 404) throw new PokeApiError('Requested resource was not found.', 404)
    throw new PokeApiError(`PokeAPI request failed (${response.status}). Try again in a moment.`, response.status)
  }

  return response.json() as Promise<T>
}

interface ResourceLike {
  url: string
}

/** Extracts the numeric id from a PokéAPI resource URL like ".../pokemon/25/" */
export function extractId(resource: ResourceLike | string): number {
  const url = typeof resource === 'string' ? resource : resource.url
  const match = url.match(/\/(\d+)\/?$/)
  return match ? Number(match[1]) : 0
}