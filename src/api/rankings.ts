export interface RankingStats {
  hp: number
  attack: number
  defense: number
  specialAttack: number
  specialDefense: number
  speed: number
}

export interface PokemonRanking {
  id: number
  name: string
  speciesId: number
  isDefault: boolean
  total: number
  stats: RankingStats
}

const EMPTY_STATS = (): RankingStats => ({
  hp: 0,
  attack: 0,
  defense: 0,
  specialAttack: 0,
  specialDefense: 0,
  speed: 0,
})

const STAT_KEYS: Record<number, keyof RankingStats> = {
  1: 'hp',
  2: 'attack',
  3: 'defense',
  4: 'specialAttack',
  5: 'specialDefense',
  6: 'speed',
}

export async function getPokemonRankings(): Promise<PokemonRanking[]> {
  const [pokemonResponse, statsResponse] = await Promise.all([
    fetch('/data/pokemon.csv'),
    fetch('/data/pokemon_stats.csv'),
  ])

  if (!pokemonResponse.ok || !statsResponse.ok) {
    throw new Error('The ranking data could not be loaded.')
  }

  const [pokemonCsv, statsCsv] = await Promise.all([
    pokemonResponse.text(),
    statsResponse.text(),
  ])

  const pokemon = new Map<number, Omit<PokemonRanking, 'stats' | 'total'>>()
  for (const line of pokemonCsv.trim().split(/\r?\n/).slice(1)) {
    const [idValue, name, speciesIdValue, , , , , isDefaultValue] = line.split(',')
    const id = Number(idValue)
    if (!id || !name) continue
    pokemon.set(id, {
      id,
      name,
      speciesId: Number(speciesIdValue),
      isDefault: isDefaultValue === '1',
    })
  }

  const stats = new Map<number, RankingStats>()
  for (const line of statsCsv.trim().split(/\r?\n/).slice(1)) {
    const [pokemonIdValue, statIdValue, baseStatValue] = line.split(',')
    const pokemonId = Number(pokemonIdValue)
    const key = STAT_KEYS[Number(statIdValue)]
    if (!pokemonId || !key) continue
    const entry = stats.get(pokemonId) ?? EMPTY_STATS()
    entry[key] = Number(baseStatValue)
    stats.set(pokemonId, entry)
  }

  return [...pokemon.values()]
    .map((entry) => {
      const baseStats = stats.get(entry.id) ?? EMPTY_STATS()
      const total = Object.values(baseStats).reduce((sum, value) => sum + value, 0)
      return { ...entry, stats: baseStats, total }
    })
    .filter((entry) => entry.total > 0)
    .sort((a, b) => b.total - a.total || a.id - b.id)
}
