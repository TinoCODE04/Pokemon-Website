import type { Pokemon } from '../api/types'
import { LEGENDARY_POKEMON_IDS } from '../constants/types'

export interface BattleMove {
  id: string
  name: string
  type: string
  power: number
  accuracy: number
  category: 'physical' | 'special'
  description: string
  priority?: number
}

export interface DamageResult {
  damage: number
  effectiveness: number
  critical: boolean
  missed: boolean
}

const TYPE_MOVES: Record<string, BattleMove> = {
  normal: { id: 'body-slam', name: 'Body Slam', type: 'normal', power: 85, accuracy: 100, category: 'physical', description: 'The user crashes into the target with its whole body.' },
  fire: { id: 'flamethrower', name: 'Flamethrower', type: 'fire', power: 90, accuracy: 100, category: 'special', description: 'A reliable stream of intense fire with strong base power.' },
  water: { id: 'surf', name: 'Surf', type: 'water', power: 90, accuracy: 100, category: 'special', description: 'A powerful wave surges across the arena and strikes the target.' },
  electric: { id: 'thunderbolt', name: 'Thunderbolt', type: 'electric', power: 90, accuracy: 100, category: 'special', description: 'A strong bolt of electricity blasts the target.' },
  grass: { id: 'energy-ball', name: 'Energy Ball', type: 'grass', power: 90, accuracy: 100, category: 'special', description: 'The user gathers natural energy into a concentrated sphere.' },
  ice: { id: 'ice-beam', name: 'Ice Beam', type: 'ice', power: 90, accuracy: 100, category: 'special', description: 'A chilling beam of energy cuts through the target.' },
  fighting: { id: 'aura-sphere', name: 'Aura Sphere', type: 'fighting', power: 80, accuracy: 100, category: 'special', description: 'The user releases a focused blast of aura that never misses here.' },
  poison: { id: 'sludge-bomb', name: 'Sludge Bomb', type: 'poison', power: 90, accuracy: 100, category: 'special', description: 'A heavy blast of poisonous sludge strikes the target.' },
  ground: { id: 'earth-power', name: 'Earth Power', type: 'ground', power: 90, accuracy: 100, category: 'special', description: 'The ground erupts beneath the target with concentrated force.' },
  flying: { id: 'air-slash', name: 'Air Slash', type: 'flying', power: 75, accuracy: 95, category: 'special', description: 'A sharp blade of compressed air slices toward the target.' },
  psychic: { id: 'psychic', name: 'Psychic', type: 'psychic', power: 90, accuracy: 100, category: 'special', description: 'A powerful telekinetic force overwhelms the target.' },
  bug: { id: 'x-scissor', name: 'X-Scissor', type: 'bug', power: 80, accuracy: 100, category: 'physical', description: 'The user crosses its claws or blades in a cutting attack.' },
  rock: { id: 'rock-slide', name: 'Rock Slide', type: 'rock', power: 75, accuracy: 90, category: 'physical', description: 'Large rocks tumble down on the target with heavy impact.' },
  ghost: { id: 'shadow-ball', name: 'Shadow Ball', type: 'ghost', power: 80, accuracy: 100, category: 'special', description: 'A dark sphere of ghostly energy is launched at the target.' },
  dragon: { id: 'dragon-pulse', name: 'Dragon Pulse', type: 'dragon', power: 85, accuracy: 100, category: 'special', description: 'The target is struck by a powerful shock wave of draconic energy.' },
  dark: { id: 'dark-pulse', name: 'Dark Pulse', type: 'dark', power: 80, accuracy: 100, category: 'special', description: 'The user releases a wave charged with dark energy.' },
  steel: { id: 'flash-cannon', name: 'Flash Cannon', type: 'steel', power: 80, accuracy: 100, category: 'special', description: 'The user gathers light and fires it as a metallic blast.' },
  fairy: { id: 'moonblast', name: 'Moonblast', type: 'fairy', power: 95, accuracy: 100, category: 'special', description: 'The user attacks with energy borrowed from the moon.' },
}

const QUICK_ATTACK: BattleMove = {
  id: 'quick-attack', name: 'Quick Attack', type: 'normal', power: 40, accuracy: 100, category: 'physical', description: 'A lightning-fast strike that acts before regular moves.', priority: 1,
}
const SWIFT: BattleMove = { id: 'swift', name: 'Swift', type: 'normal', power: 60, accuracy: 100, category: 'special', description: 'Star-shaped rays track the target for a dependable hit.' }
const SLASH: BattleMove = { id: 'slash', name: 'Slash', type: 'normal', power: 70, accuracy: 100, category: 'physical', description: 'The target is cut with a swift physical slash.' }
const POWER_GEM: BattleMove = { id: 'power-gem', name: 'Power Gem', type: 'rock', power: 80, accuracy: 100, category: 'special', description: 'A polished ray of gemstone-like light strikes the target.' }

const TYPE_MATCHUPS: Record<string, { double?: string[]; half?: string[]; none?: string[] }> = {
  normal: { half: ['rock', 'steel'], none: ['ghost'] },
  fire: { double: ['grass', 'ice', 'bug', 'steel'], half: ['fire', 'water', 'rock', 'dragon'] },
  water: { double: ['fire', 'ground', 'rock'], half: ['water', 'grass', 'dragon'] },
  electric: { double: ['water', 'flying'], half: ['electric', 'grass', 'dragon'], none: ['ground'] },
  grass: { double: ['water', 'ground', 'rock'], half: ['fire', 'grass', 'poison', 'flying', 'bug', 'dragon', 'steel'] },
  ice: { double: ['grass', 'ground', 'flying', 'dragon'], half: ['fire', 'water', 'ice', 'steel'] },
  fighting: { double: ['normal', 'ice', 'rock', 'dark', 'steel'], half: ['poison', 'flying', 'psychic', 'bug', 'fairy'], none: ['ghost'] },
  poison: { double: ['grass', 'fairy'], half: ['poison', 'ground', 'rock', 'ghost'], none: ['steel'] },
  ground: { double: ['fire', 'electric', 'poison', 'rock', 'steel'], half: ['grass', 'bug'], none: ['flying'] },
  flying: { double: ['grass', 'fighting', 'bug'], half: ['electric', 'rock', 'steel'] },
  psychic: { double: ['fighting', 'poison'], half: ['psychic', 'steel'], none: ['dark'] },
  bug: { double: ['grass', 'psychic', 'dark'], half: ['fire', 'fighting', 'poison', 'flying', 'ghost', 'steel', 'fairy'] },
  rock: { double: ['fire', 'ice', 'flying', 'bug'], half: ['fighting', 'ground', 'steel'] },
  ghost: { double: ['psychic', 'ghost'], half: ['dark'], none: ['normal'] },
  dragon: { double: ['dragon'], half: ['steel'], none: ['fairy'] },
  dark: { double: ['psychic', 'ghost'], half: ['fighting', 'dark', 'fairy'] },
  steel: { double: ['ice', 'rock', 'fairy'], half: ['fire', 'water', 'electric', 'steel'] },
  fairy: { double: ['fighting', 'dragon', 'dark'], half: ['fire', 'poison', 'steel'] },
}

const QUICK_ROSTER = [
  3, 6, 9, 25, 26, 38, 59, 65, 68, 94, 130, 131, 134, 135, 136, 143, 149,
  154, 157, 160, 196, 197, 212, 229, 248, 254, 257, 260, 282, 306, 330, 350,
  373, 376, 445, 448, 462, 468, 475, 497, 500, 503, 530, 635, 637, 658, 700,
  706, 724, 727, 730, 745, 778, 812, 815, 818, 887, 908, 911, 914, 937, 998,
]

export function getStat(pokemon: Pokemon, name: string): number {
  return pokemon.stats.find((entry) => entry.stat.name === name)?.base_stat ?? 60
}

export function getBattleMoves(pokemon: Pokemon): BattleMove[] {
  const typeMoves = pokemon.types.map((entry) => TYPE_MOVES[entry.type.name]).filter(Boolean)
  const physical = getStat(pokemon, 'attack') >= getStat(pokemon, 'special-attack')
  const coverage = pokemon.types.some((entry) => entry.type.name === 'rock') ? SWIFT : POWER_GEM
  const pool = [...typeMoves, physical ? SLASH : SWIFT, coverage, QUICK_ATTACK]
  return pool.filter((move, index) => pool.findIndex((entry) => entry.id === move.id) === index).slice(0, 4)
}

export function getMaxHp(pokemon: Pokemon, boss = false): number {
  const base = Math.round(150 + getStat(pokemon, 'hp') * 0.8)
  return boss ? Math.round(base * 1.13) : base
}

export function getEffectiveness(moveType: string, defenderTypes: string[]): number {
  const relation = TYPE_MATCHUPS[moveType] ?? {}
  return defenderTypes.reduce((multiplier, type) => {
    if (relation.none?.includes(type)) return 0
    if (relation.double?.includes(type)) return multiplier * 2
    if (relation.half?.includes(type)) return multiplier * 0.5
    return multiplier
  }, 1)
}

export function calculateDamage(attacker: Pokemon, defender: Pokemon, move: BattleMove, bossBoost = 1): DamageResult {
  if (Math.random() * 100 >= move.accuracy) {
    return { damage: 0, effectiveness: 1, critical: false, missed: true }
  }

  const attackName = move.category === 'physical' ? 'attack' : 'special-attack'
  const defenseName = move.category === 'physical' ? 'defense' : 'special-defense'
  // Compress raw stat gaps so type choices matter and low-stat Pokémon remain viable.
  const attack = 88 + getStat(attacker, attackName) * 0.32
  const defense = 88 + getStat(defender, defenseName) * 0.32
  const effectiveness = getEffectiveness(move.type, defender.types.map((entry) => entry.type.name))
  const stab = attacker.types.some((entry) => entry.type.name === move.type) ? 1.35 : 1
  const critical = Math.random() < 0.08
  const variance = 0.88 + Math.random() * 0.12
  const raw = (((22 * move.power * attack) / Math.max(defense, 1)) / 50 + 2)
    * effectiveness * stab * (critical ? 1.5 : 1) * variance * bossBoost

  return {
    damage: effectiveness === 0 ? 0 : Math.max(1, Math.round(raw)),
    effectiveness,
    critical,
    missed: false,
  }
}

export function chooseAiMove(attacker: Pokemon, defender: Pokemon): BattleMove {
  const moves = getBattleMoves(attacker)
  const scored = moves.map((move) => {
    const effectiveness = getEffectiveness(move.type, defender.types.map((entry) => entry.type.name))
    const stab = attacker.types.some((entry) => entry.type.name === move.type) ? 1.25 : 1
    return { move, score: move.power * effectiveness * stab * (0.82 + Math.random() * 0.36) }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.move ?? QUICK_ATTACK
}

export function pickOpponentId(mode: 'quick' | 'legendary', playerId: number): number {
  const roster = mode === 'legendary'
    ? [...LEGENDARY_POKEMON_IDS].filter((id) => id <= 1025)
    : QUICK_ROSTER
  const choices = roster.filter((id) => id !== playerId)
  return choices[Math.floor(Math.random() * choices.length)] ?? 6
}
