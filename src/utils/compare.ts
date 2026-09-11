const COMPARED_STATS = [
  'hp',
  'attack',
  'defense',
  'special-attack',
  'special-defense',
  'speed',
] as const

type ComparedStat = (typeof COMPARED_STATS)[number]

export interface ComparisonPokemon {
  id: number
  name: string
  stats: Record<ComparedStat, number>
}

export interface ComparisonHighlight {
  label: 'Highest total' | 'Top offense' | 'Best defense' | 'Fastest'
  value: number
  leaders: string[]
}

export function getCompareColumnCount(selectedCount: number, maxCompare: number): number {
  if (selectedCount <= 0) return 1
  return Math.min(selectedCount + 1, maxCompare)
}

export function isComparisonReady(selectedCount: number, loadedCount: number, hasError: boolean): boolean {
  return selectedCount >= 2 && loadedCount === selectedCount && !hasError
}

export function addPokemonToCompare(current: number[], id: number, maxCompare: number): number[] {
  if (current.includes(id) || current.length >= maxCompare) return current
  return [...current, id]
}

export function getFocusRestoreTarget<T extends { isConnected: boolean }>(
  opener: T | null,
  fallback: T | null,
): T | null {
  return opener?.isConnected ? opener : fallback?.isConnected ? fallback : null
}

export function isPokemonBrowserActive(open: boolean, isFull: boolean): boolean {
  return open && !isFull
}

export function shouldClosePokemonBrowser(open: boolean, isFull: boolean): boolean {
  return open && isFull
}

export function paginateAvailablePokemon<T extends { id: number }>(
  entries: T[],
  excludedIds: number[],
  requestedPage: number,
  pageSize: number,
) {
  const excluded = new Set(excludedIds)
  const available = entries.filter((entry) => !excluded.has(entry.id))
  const safePageSize = Math.max(1, pageSize)
  const totalPages = Math.max(1, Math.ceil(available.length / safePageSize))
  const page = Math.min(Math.max(1, requestedPage), totalPages)
  const start = (page - 1) * safePageSize

  return {
    items: available.slice(start, start + safePageSize),
    page,
    totalPages,
    totalItems: available.length,
  }
}

export function getComparisonHighlights(pokemon: ComparisonPokemon[]): ComparisonHighlight[] {
  const metrics: { label: ComparisonHighlight['label']; value: (entry: ComparisonPokemon) => number }[] = [
    {
      label: 'Highest total',
      value: (entry) => COMPARED_STATS.reduce((total, stat) => total + entry.stats[stat], 0),
    },
    {
      label: 'Top offense',
      value: (entry) => Math.max(entry.stats.attack, entry.stats['special-attack']),
    },
    {
      label: 'Best defense',
      value: (entry) => Math.max(entry.stats.defense, entry.stats['special-defense']),
    },
    { label: 'Fastest', value: (entry) => entry.stats.speed },
  ]

  return metrics.map((metric) => {
    const values = pokemon.map((entry) => metric.value(entry))
    const value = Math.max(...values)
    return {
      label: metric.label,
      value,
      leaders: pokemon.filter((_, index) => values[index] === value).map((entry) => entry.name),
    }
  })
}
