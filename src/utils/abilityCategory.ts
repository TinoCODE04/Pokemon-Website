export type AbilityCategory =
  | 'fire'
  | 'water'
  | 'electric'
  | 'nature'
  | 'ice'
  | 'offense'
  | 'defense'
  | 'speed'
  | 'recovery'
  | 'sensory'
  | 'weather'
  | 'mental'
  | 'item'
  | 'trap'
  | 'mobility'
  | 'ghost'
  | 'explosive'
  | 'bond'
  | 'celebration'
  | 'special'

const EXACT_CATEGORIES: Partial<Record<string, AbilityCategory>> = {
  adaptability: 'special',
  aerilate: 'mobility',
  aftermath: 'explosive',
  'air-lock': 'weather',
  analytic: 'mental',
  'anger-point': 'offense',
  'anger-shell': 'defense',
  anticipation: 'sensory',
  'aqua-boost': 'water',
  'arena-trap': 'trap',
  'armor-tail': 'defense',
  'aroma-veil': 'defense',
  'as-one-glastrier': 'ice',
  'as-one-spectrier': 'ghost',
  'aura-break': 'special',
  'aura-guard': 'defense',
  'bad-dreams': 'mental',
  'ball-fetch': 'item',
  battery: 'electric',
  'battle-armor': 'defense',
  'battle-bond': 'bond',
  'beads-of-ruin': 'special',
  'beast-boost': 'offense',
  berserk: 'offense',
  'big-pecks': 'defense',
  'black-hole': 'special',
  bonanza: 'item',
  bulletproof: 'defense',
  calming: 'mental',
  celebrate: 'celebration',
  'cheek-pouch': 'item',
  'chilling-neigh': 'ice',
  chlorophyll: 'nature',
  'clear-body': 'defense',
  'shadow-tag': 'ghost',
}

const CATEGORY_RULES: { category: AbilityCategory; pattern: RegExp }[] = [
  { category: 'fire', pattern: /fire|flame|blaze|burn|magma|heat|coal/ },
  { category: 'water', pattern: /water|aqua|torrent|bubble|hydrat|rain-dish/ },
  { category: 'electric', pattern: /electric|volt|lightning|battery|motor|static|galvanize|transistor|charge/ },
  { category: 'nature', pattern: /grass|leaf|flower|seed|chlorophyll|harvest|herbivore|overgrow|forest|spore|pollen|ripen/ },
  { category: 'ice', pattern: /ice|snow|frost|chill|freeze|slush|refrigerate/ },
  { category: 'explosive', pattern: /aftermath|bomb|explode|detonat/ },
  { category: 'defense', pattern: /armor|armour|shield|guard|proof|shell|sturdy|defen|barrier|veil|coat|multiscale|solid-rock|filter|immunity/ },
  { category: 'speed', pattern: /speed|quick|swift|dash|sprint|momentum|unburden/ },
  { category: 'recovery', pattern: /heal|cure|regen|restore|medic|nurse|therapy|recovery|natural-cure|poison-heal/ },
  { category: 'sensory', pattern: /eye|vision|anticipation|perception|frisk|forewarn|sense|lens/ },
  { category: 'weather', pattern: /weather|cloud|air-lock|sand|drought|stream|forecast/ },
  { category: 'mental', pattern: /dream|sleep|mind|mood|calm|confidence|prankster|analytic/ },
  { category: 'item', pattern: /item|pickup|pouch|lunchbox|pack|fetch|gluttony/ },
  { category: 'trap', pattern: /trap|web|cage|shackle|arena|magnet-pull|stakeout/ },
  { category: 'mobility', pattern: /aerilate|wind|wing|levitate|air|flight|run|skater|climber|surfer|swim/ },
  { category: 'ghost', pattern: /ghost|spectrier|shadow|phantom|curse|haunt/ },
  { category: 'bond', pattern: /bond|symbiosis|friend|partner|as-one/ },
  { category: 'celebration', pattern: /celebrat|party|festival/ },
  { category: 'offense', pattern: /power|attack|strong|fist|claw|jaw|rage|anger|berserk|boost|force|blow|strike|sniper|beast/ },
]

export function abilityCategory(name: string): AbilityCategory {
  const normalized = name.trim().toLowerCase()
  const exact = EXACT_CATEGORIES[normalized]
  if (exact) return exact
  return CATEGORY_RULES.find((rule) => rule.pattern.test(normalized))?.category ?? 'special'
}
