/** "25" -> "#0025" */
export function formatDexNumber(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}

/** "mr-mime" -> "Mr. Mime", "deoxys-normal" -> "Deoxys" */
export function formatName(name: string): string {
  const special: Record<string, string> = {
    'mr-mime': 'Mr. Mime',
    'mime-jr': 'Mime Jr.',
    'mr-rime': 'Mr. Rime',
    'type-null': 'Type: Null',
    'tapu-koko': 'Tapu Koko',
    'tapu-lele': 'Tapu Lele',
    'tapu-bulu': 'Tapu Bulu',
    'tapu-fini': 'Tapu Fini',
    'ho-oh': 'Ho-Oh',
    'porygon-z': 'Porygon-Z',
    'jangmo-o': 'Jangmo-o',
    'hakamo-o': 'Hakamo-o',
    'kommo-o': 'Kommo-o',
    'nidoran-f': 'Nidoran F',
    'nidoran-m': 'Nidoran M',
    'farfetchd': "Farfetch'd",
    'sirfetchd': "Sirfetch'd",
  }
  if (special[name]) return special[name]

  // Strip form suffixes for display ("charizard-mega-x" -> "Charizard Mega X" stays, that's fine)
  return name
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

/** decimeters -> "1.7 m" */
export function formatHeight(dm: number): string {
  return `${(dm / 10).toFixed(1)} m`
}

/** hectograms -> "90.5 kg" */
export function formatWeight(hg: number): string {
  return `${(hg / 10).toFixed(1)} kg`
}

/** height in decimeters -> ft/in string: "5'07\"" */
export function formatHeightImperial(dm: number): string {
  const totalInches = dm * 3.937
  const feet = Math.floor(totalInches / 12)
  const inches = Math.round(totalInches % 12)
  return `${feet}'${String(inches).padStart(2, '0')}"`
}

export function formatWeightImperial(hg: number): string {
  return `${(hg * 0.220462).toFixed(1)} lbs`
}

/** Official artwork URL without an extra API call. */
export function artworkUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`
}

/** Fallback sprite URL. */
export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
}

export function bestArtwork(sprites: {
  front_default: string | null
  other?: { 'official-artwork'?: { front_default: string | null }; home?: { front_default: string | null } }
}): string {
  return (
    sprites.other?.['official-artwork']?.front_default ??
    sprites.other?.home?.front_default ??
    sprites.front_default ??
    ''
  )
}

const STAT_LABELS: Record<string, string> = {
  hp: 'HP',
  attack: 'Attack',
  defense: 'Defense',
  'special-attack': 'Sp. Atk',
  'special-defense': 'Sp. Def',
  speed: 'Speed',
}

export function statLabel(name: string): string {
  return STAT_LABELS[name] ?? name
}

const STAT_COLORS: Record<string, string> = {
  hp: '#63bb5b',
  attack: '#ee8130',
  defense: '#e0b104',
  'special-attack': '#6390f0',
  'special-defense': '#a98ff3',
  speed: '#f95587',
}

export function statColor(name: string): string {
  return STAT_COLORS[name] ?? '#8a8a7a'
}

/** Clean up PokéAPI flavor text (form feeds, newlines, odd spacing). */
export function cleanFlavorText(text: string): string {
  return text.replace(/\f/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim()
}

export function englishFlavorText(
  entries: { flavor_text: string; language: { name: string } }[],
): string {
  const en = entries.filter((e) => e.language.name === 'en')
  const latest = en[en.length - 1]
  return latest ? cleanFlavorText(latest.flavor_text) : ''
}

export function englishGenus(genera: { genus: string; language: { name: string } }[]): string {
  return genera.find((g) => g.language.name === 'en')?.genus ?? ''
}

export function shortEffect(
  entries: { short_effect: string; language: { name: string } }[],
): string {
  const en = entries.find((e) => e.language.name === 'en')
  return en ? en.short_effect : ''
}

export function longEffect(entries: { effect: string; language: { name: string } }[]): string {
  const en = entries.find((e) => e.language.name === 'en')
  return en ? cleanFlavorText(en.effect) : ''
}