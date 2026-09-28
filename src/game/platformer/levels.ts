export interface Rect { x: number; y: number; w: number; h: number }
export interface Platform extends Rect { oneWay: boolean; moving?: { origin: number; range: number; speed: number }; dx?: number }
export type ItemKind = 'ball' | 'berry' | 'energy' | 'hidden'
export interface Item extends Rect { kind: ItemKind; collected: boolean }
export interface Enemy extends Rect { kind: 'patrol' | 'ranged' | 'guardian'; vx: number; alive: boolean; hp: number; cooldown: number; home: number; range: number }
export interface Level {
  id: number; name: string; subtitle: string; theme: 'grass' | 'forest' | 'cave'; width: number; goal: number
  platforms: Platform[]; items: Item[]; enemies: Enemy[]; traps: Rect[]; checkpoint: number
  signs: { x: number; y: number; text: string }[]
}
const ground = (x: number, w: number): Platform => ({ x, y: 448, w, h: 160, oneWay: false })
const ledge = (x: number, y: number, w = 150, oneWay = true): Platform => ({ x, y, w, h: 20, oneWay })
const balls = (x: number, y: number, count = 4): Item[] => Array.from({ length: count }, (_, i) => ({ x: x + i * 36, y, w: 18, h: 18, kind: 'ball', collected: false }))
const item = (x: number, y: number, kind: ItemKind): Item => ({ x, y, w: 22, h: 24, kind, collected: false })
const enemy = (x: number, kind: Enemy['kind'] = 'patrol', y = 418): Enemy => ({ x, y, w: kind === 'guardian' ? 48 : 30, h: kind === 'guardian' ? 48 : 30, vx: -45, kind, alive: true, hp: kind === 'guardian' ? 3 : 1, cooldown: 1.5, home: x, range: 160 })

export function createLevel(id: number): Level {
  if (id === 2) return {
    id, name: 'Viridian Forest', subtitle: 'Explore the treetops and discover hidden gifts.', theme: 'forest', width: 3900, goal: 3760, checkpoint: 1850,
    platforms: [ground(0, 820), ground(950, 620), ground(1680, 780), ground(2600, 1300), ledge(330, 360), ledge(550, 280), ledge(760, 320, 180),
      { ...ledge(1410, 355, 180), moving: { origin: 1410, range: 150, speed: 0.9 } }, ledge(2040, 350), ledge(2240, 265), ledge(2450, 330, 200), ledge(2880, 350), ledge(3090, 270), ledge(3320, 350)],
    items: [...balls(190, 400), ...balls(550, 245), ...balls(1000, 400), ...balls(2050, 315), ...balls(3090, 235), ...balls(3510, 400), item(660, 225, 'hidden'), item(1170, 414, 'energy'), item(1890, 414, 'berry'), item(2340, 230, 'hidden')],
    enemies: [enemy(600), enemy(1100, 'ranged'), enemy(2050), enemy(2840), enemy(3440, 'ranged')], traps: [],
    signs: [{ x: 180, y: 355, text: 'Poké Balls hide in the treetops!' }, { x: 1280, y: 390, text: 'Wait for the platform, then jump.' }, { x: 1770, y: 370, text: 'CHECKPOINT · Adventure saved!' }],
  }
  if (id === 3) return {
    id, name: 'Mt. Moon Cave', subtitle: 'Leap over crystal traps and face the cave guardian.', theme: 'cave', width: 4300, goal: 4140, checkpoint: 2200,
    platforms: [ground(0, 640), ground(760, 630), ground(1530, 410), ground(2070, 750), ground(2960, 1340), ledge(400, 360), ledge(630, 335), ledge(1050, 350), ledge(1360, 330, 180), ledge(1700, 340), ledge(1920, 350, 190), ledge(2450, 350), ledge(2720, 325, 180), ledge(2980, 350), ledge(3280, 335)],
    items: [...balls(180, 400), ...balls(650, 300, 3), ...balls(1060, 315), ...balls(1720, 305), ...balls(2470, 315), ...balls(3300, 300), item(2250, 414, 'berry'), item(3510, 414, 'energy'), item(3380, 280, 'hidden')],
    enemies: [enemy(510), enemy(1120, 'ranged'), enemy(1740), enemy(2550, 'ranged'), enemy(3210), enemy(3930, 'guardian', 400)],
    traps: [{ x: 920, y: 433, w: 64, h: 15 }, { x: 2340, y: 433, w: 64, h: 15 }, { x: 3110, y: 433, w: 64, h: 15 }],
    signs: [{ x: 190, y: 350, text: 'Glowing crystals hurt. Jump over!' }, { x: 2110, y: 365, text: 'CHECKPOINT · Berries ahead!' }, { x: 3630, y: 350, text: 'Guardian: 3 hits · Shift / Ctrl' }],
  }
  return {
    id: 1, name: 'Pallet Town Meadows', subtitle: 'Every great journey starts with a first jump.', theme: 'grass', width: 3300, goal: 3140, checkpoint: 1750,
    platforms: [ground(0, 920), ground(1030, 750), ground(1890, 560), ground(2560, 740), ledge(420, 360), ledge(650, 295), ledge(900, 355, 180), ledge(1280, 360), ledge(1650, 350, 240), ledge(2090, 350), ledge(2370, 350, 220), ledge(2760, 355)],
    items: [...balls(190, 400), ...balls(420, 325), ...balls(650, 260), ...balls(1070, 400), ...balls(1680, 315), ...balls(2110, 315), ...balls(2810, 320), item(570, 414, 'energy'), item(1810, 315, 'berry'), item(730, 230, 'hidden')],
    enemies: [enemy(740), enemy(1360), enemy(2160, 'ranged'), enemy(2870)], traps: [],
    signs: [{ x: 115, y: 340, text: 'Move with A / D or ← / →' }, { x: 425, y: 260, text: 'W / ↑ Jump · Hold to leap higher' }, { x: 660, y: 370, text: 'Shift / Ctrl: hold to sprint, tap to fire' }, { x: 1110, y: 350, text: 'Jump on enemies to defeat them!' }, { x: 2650, y: 285, text: 'The finish is just ahead!' }],
  }
}

export const LEVEL_INFO = [1, 2, 3].map(id => { const { name, subtitle, theme } = createLevel(id); return { id, name, subtitle, theme } })
