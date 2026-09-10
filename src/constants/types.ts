import type { LucideIcon } from 'lucide-react'
import {
  Bug,
  Circle,
  Crown,
  Droplets,
  Feather,
  Flame,
  Gem,
  Ghost,
  Hand,
  Leaf,
  Moon,
  Mountain,
  Shield,
  Skull,
  Snowflake,
  Sparkles,
  Wand2,
  Zap,
} from 'lucide-react'

export interface TypeStyle {
  /** Solid accent color for the type */
  color: string
  /** Soft translucent tint for card backgrounds */
  soft: string
  /** Tailwind-friendly gradient stops */
  gradient: [string, string]
  icon: LucideIcon
}

export const TYPE_ORDER = [
  'normal',
  'fire',
  'water',
  'electric',
  'grass',
  'ice',
  'fighting',
  'poison',
  'ground',
  'flying',
  'psychic',
  'bug',
  'rock',
  'ghost',
  'dragon',
  'dark',
  'steel',
  'fairy',
] as const

export type TypeName = (typeof TYPE_ORDER)[number]

export const TYPE_MASCOTS: Record<TypeName, { id: number; name: string }> = {
  normal: { id: 143, name: 'Snorlax' },
  fire: { id: 6, name: 'Charizard' },
  water: { id: 9, name: 'Blastoise' },
  electric: { id: 25, name: 'Pikachu' },
  grass: { id: 3, name: 'Venusaur' },
  ice: { id: 144, name: 'Articuno' },
  fighting: { id: 68, name: 'Machamp' },
  poison: { id: 24, name: 'Arbok' },
  ground: { id: 383, name: 'Groudon' },
  flying: { id: 18, name: 'Pidgeot' },
  psychic: { id: 150, name: 'Mewtwo' },
  bug: { id: 12, name: 'Butterfree' },
  rock: { id: 248, name: 'Tyranitar' },
  ghost: { id: 94, name: 'Gengar' },
  dragon: { id: 149, name: 'Dragonite' },
  dark: { id: 197, name: 'Umbreon' },
  steel: { id: 376, name: 'Metagross' },
  fairy: { id: 700, name: 'Sylveon' },
}

export function typeMascot(name: string) {
  return TYPE_MASCOTS[name as TypeName] ?? TYPE_MASCOTS.normal
}

export const TYPE_STYLES: Record<TypeName, TypeStyle> = {
  normal: { color: '#8a8a7a', soft: 'rgba(168,167,122,0.16)', gradient: ['#a8a77a', '#c6c6a7'], icon: Circle },
  fire: { color: '#ee8130', soft: 'rgba(238,129,48,0.16)', gradient: ['#ee8130', '#f7a26b'], icon: Flame },
  water: { color: '#6390f0', soft: 'rgba(99,144,240,0.16)', gradient: ['#6390f0', '#8fb0f5'], icon: Droplets },
  electric: { color: '#e6b800', soft: 'rgba(247,208,44,0.2)', gradient: ['#f7d02c', '#fae078'], icon: Zap },
  grass: { color: '#63bb5b', soft: 'rgba(122,199,76,0.16)', gradient: ['#7ac74c', '#a2d98a'], icon: Leaf },
  ice: { color: '#6bc5c2', soft: 'rgba(150,217,214,0.2)', gradient: ['#96d9d6', '#bce4e2'], icon: Snowflake },
  fighting: { color: '#c22e28', soft: 'rgba(194,46,40,0.14)', gradient: ['#c22e28', '#d66a65'], icon: Hand },
  poison: { color: '#a33ea1', soft: 'rgba(163,62,161,0.14)', gradient: ['#a33ea1', '#c06fbe'], icon: Skull },
  ground: { color: '#d2973d', soft: 'rgba(226,191,101,0.2)', gradient: ['#e2bf65', '#ebd197'], icon: Mountain },
  flying: { color: '#a98ff3', soft: 'rgba(169,143,243,0.16)', gradient: ['#a98ff3', '#c6b3f7'], icon: Feather },
  psychic: { color: '#f95587', soft: 'rgba(249,85,135,0.14)', gradient: ['#f95587', '#fb8bac'], icon: Wand2 },
  bug: { color: '#91a119', soft: 'rgba(166,185,26,0.16)', gradient: ['#a6b91a', '#c6d16e'], icon: Bug },
  rock: { color: '#b6a136', soft: 'rgba(182,161,54,0.18)', gradient: ['#b6a136', '#d1c17d'], icon: Gem },
  ghost: { color: '#735797', soft: 'rgba(115,87,151,0.16)', gradient: ['#735797', '#9b83bd'], icon: Ghost },
  dragon: { color: '#6f35fc', soft: 'rgba(111,53,252,0.14)', gradient: ['#6f35fc', '#9b78fd'], icon: Crown },
  dark: { color: '#5a5366', soft: 'rgba(112,87,70,0.18)', gradient: ['#705746', '#8f7a6d'], icon: Moon },
  steel: { color: '#8f9fb3', soft: 'rgba(183,183,206,0.2)', gradient: ['#b7b7ce', '#d1d1e0'], icon: Shield },
  fairy: { color: '#ec8fe6', soft: 'rgba(214,133,173,0.16)', gradient: ['#d685ad', '#e9b3cd'], icon: Sparkles },
}

// The 71 Legendary species through Generation IX, plus the three Galarian bird forms.
// Mythical Pokémon and Paradox Pokémon are intentionally kept separate.
export const LEGENDARY_POKEMON_IDS = new Set([
  144, 145, 146, 150,
  243, 244, 245, 249, 250,
  377, 378, 379, 380, 381, 382, 383, 384,
  480, 481, 482, 483, 484, 485, 486, 487, 488,
  638, 639, 640, 641, 642, 643, 644, 645, 646,
  716, 717, 718,
  772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800,
  888, 889, 890, 891, 892, 894, 895, 896, 897, 898, 905,
  1001, 1002, 1003, 1004, 1007, 1008, 1014, 1015, 1016, 1017, 1024,
  10169, 10170, 10171,
])

export function typeStyle(name: string): TypeStyle {
  return TYPE_STYLES[name as TypeName] ?? TYPE_STYLES.normal
}

export const MAX_COMPARE = 3
export const FAVORITES_KEY = 'px-favorites'
export const COMPARE_KEY = 'px-compare'
export const THEME_KEY = 'px-theme'
export const RECENT_KEY = 'px-recently-viewed'
