export interface PokemonSearchEntry {
  id: number
  name: string
}

const normalizeName = (name: string) => name.toLowerCase().replace(/[\s.'-]+/g, '')

export function getPokemonSuggestions(entries: readonly PokemonSearchEntry[], query: string, limit = 6): PokemonSearchEntry[] {
  const value = query.trim().toLowerCase()
  if (!value || limit < 1) return []
  if (/^#?\d+$/.test(value)) {
    const id = Number(value.replace('#', ''))
    return entries.filter(entry => entry.id === id).slice(0, limit)
  }
  const term = normalizeName(value)
  if (!term) return []
  const exact: PokemonSearchEntry[] = []
  const prefixes: PokemonSearchEntry[] = []
  const contains: PokemonSearchEntry[] = []
  for (const entry of entries) {
    const name = normalizeName(entry.name)
    if (name === term) exact.push(entry)
    else if (name.startsWith(term)) prefixes.push(entry)
    else if (name.includes(term)) contains.push(entry)
  }
  return [...exact, ...prefixes, ...contains].slice(0, limit)
}
