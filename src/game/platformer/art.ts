import type { World } from './world.ts'
import type { Character } from './save.ts'

export const CHARACTER_INFO: Record<Character, { name: string; english: string; type: string; color: string; row: number; description: string }> = {
  pikachu: { name: 'Pikachu', english: 'Pikachu', type: 'Electric', color: '#f6cc53', row: 0, description: 'Let a little Thunderbolt light the way.' },
  charmander: { name: 'Charmander', english: 'Charmander', type: 'Fire', color: '#f49769', row: 1, description: 'A little flame and a lot of courage.' },
  mewtwo: { name: 'Mewtwo', english: 'Mewtwo', type: 'Psychic', color: '#bda2eb', row: 2, description: 'Let the power of your mind lead the way.' },
}
const THEMES = {
  grass: { sky: '#bce7e6', far: '#b2d3bd', mid: '#83baa0', hill: '#62a783', leaf: '#448963', grass: '#8ac95d', dirt: '#ae8b68' },
  forest: { sky: '#a8cdc3', far: '#769d8b', mid: '#507f6e', hill: '#3b6e56', leaf: '#315d4f', grass: '#6ca861', dirt: '#7c7560' },
  cave: { sky: '#292c46', far: '#363750', mid: '#4a4661', hill: '#5d5572', leaf: '#726783', grass: '#978cb1', dirt: '#5d586e' },
}
function block(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string) {
  ctx.fillStyle = color; ctx.fillRect(Math.round(x), Math.round(y), w, h)
}
function polygon(ctx: CanvasRenderingContext2D, points: number[][], color: string) {
  ctx.fillStyle = color; ctx.beginPath(); points.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill()
}
function tree(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, color: string) {
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(scale, scale)
  block(ctx, -7, -10, 14, 105, '#6b7d67'); block(ctx, -1, -10, 4, 105, '#829076')
  polygon(ctx, [[-60, 15], [-60, -14], [-42, -14], [-42, -45], [-22, -45], [-22, -68], [20, -68], [20, -48], [40, -48], [40, -22], [62, -22], [62, 16], [40, 16], [40, 34], [-38, 34], [-38, 15]], color)
  block(ctx, -38, -34, 26, 12, '#ffffff13'); block(ctx, -20, -53, 30, 10, '#ffffff17'); block(ctx, 20, -5, 22, 12, '#0000000d')
  ctx.restore()
}
function ball(ctx: CanvasRenderingContext2D, x: number, y: number, hidden = false) {
  block(ctx, x + 4, y, 12, 3, '#344b57'); block(ctx, x + 1, y + 3, 18, 14, '#344b57'); block(ctx, x + 4, y + 17, 12, 3, '#344b57')
  block(ctx, x + 4, y + 3, 12, 6, hidden ? '#d6ae48' : '#ee796d'); block(ctx, x + 4, y + 11, 12, 6, '#fff5dc')
  block(ctx, x + 8, y + 8, 5, 5, '#344b57'); block(ctx, x + 9, y + 9, 3, 3, '#fff9e9')
}
export function render(ctx: CanvasRenderingContext2D, world: World, atlas: HTMLImageElement) {
  const { level, camera, time } = world, t = THEMES[level.theme]
  ctx.imageSmoothingEnabled = false
  block(ctx, 0, 0, 960, 540, t.sky)
  if (level.theme !== 'cave') {
    block(ctx, 776 - camera * 0.06, 52, 54, 54, '#fff1c4'); block(ctx, 784 - camera * 0.06, 44, 38, 70, '#fff1c4')
    for (let i = -1; i < 8; i++) {
      const x = i * 260 - (camera * 0.12 % 260), y = 68 + ((i + 3) % 3) * 26
      block(ctx, x + 20, y, 50, 16, '#f1f5dc'); block(ctx, x, y + 14, 108, 20, '#f1f5dc'); block(ctx, x + 14, y + 32, 82, 6, '#d8ebd4')
    }
  }
  for (let i = -1; i < 7; i++) {
    const x = i * 270 - (camera * 0.2 % 270)
    polygon(ctx, [[x - 40, 420], [x - 40, 255], [x, 255], [x, 222], [x + 35, 222], [x + 35, 180], [x + 65, 180], [x + 65, 150], [x + 105, 150], [x + 105, 182], [x + 145, 182], [x + 145, 218], [x + 188, 218], [x + 188, 265], [x + 240, 265], [x + 290, 420]], t.far)
  }
  if (level.theme === 'cave') {
    for (let i = 0; i < 9; i++) {
      const x = i * 150 - (camera * 0.35 % 150)
      polygon(ctx, [[x, 0], [x + 85, 0], [x + 45, 100 + i % 3 * 30]], t.mid)
      polygon(ctx, [[x, 448], [x + 35, 260], [x + 85, 448]], t.mid)
      block(ctx, x + 35, 280, 5, 60, '#928daa44')
    }
    for (let i = 0; i < 18; i++) block(ctx, ((i * 127 + 23) - camera * 0.4 + 3000) % 960, 130 + i % 5 * 40, 3, 3, '#b8acc5')
  } else {
    for (let i = -1; i < 10; i++) tree(ctx, i * 170 - (camera * 0.35 % 170), 287 + i % 2 * 25, 0.8, t.mid)
    block(ctx, 0, 390, 960, 58, '#82bfb3'); block(ctx, 0, 402, 960, 3, '#c3ded3')
    for (let i = -1; i < 8; i++) tree(ctx, i * 230 - (camera * 0.6 % 230), 351, 0.75, t.hill)
    for (let i = 0; i < 30; i++) block(ctx, (i * 66 - camera * 0.5 + 4000) % 960, 422 + i % 3 * 6, 20, 2, '#b8dbd0')
  }
  ctx.save(); ctx.translate(-Math.round(camera), 0)
  for (const s of world.platforms) {
    if (s.x + s.w < camera || s.x > camera + 960) continue
    block(ctx, s.x, s.y, s.w, s.h, s.oneWay ? '#6d8475' : t.dirt)
    block(ctx, s.x, s.y, s.w, 8, s.moving ? '#d5c782' : t.grass)
    block(ctx, s.x, s.y + 8, s.w, 4, '#314d4944')
    if (s.oneWay) {
      for (let x = s.x + 8; x < s.x + s.w - 4; x += 24) block(ctx, x, s.y + 12, 10, 4, '#a0b29a')
      if (!s.moving) { block(ctx, s.x + 18, s.y + s.h, 5, 22, '#6d8475'); block(ctx, s.x + s.w - 23, s.y + s.h, 5, 22, '#6d8475') }
    } else {
      for (let x = s.x + 9; x < s.x + s.w; x += 32) {
        block(ctx, x, s.y - 4, 3, 6, t.grass)
        for (let y = s.y + 25; y < 540; y += 28) { block(ctx, x + (y % 2) * 6, y, 8, 4, '#ffffff15'); block(ctx, x + 12, y + 12, 5, 5, '#00000011') }
      }
      if (level.theme !== 'cave') for (let x = s.x + 35; x < s.x + s.w; x += 140) {
        block(ctx, x, s.y - 16, 3, 16, '#5a9354'); block(ctx, x - 3, s.y - 18, 9, 5, '#f3d497'); block(ctx, x, s.y - 20, 3, 9, '#f3d497')
        block(ctx, x + 60, s.y - 9, 22, 9, t.leaf); block(ctx, x + 65, s.y - 15, 12, 7, t.leaf)
      }
    }
  }
  for (const trap of level.traps) for (let x = trap.x; x < trap.x + trap.w; x += 16) {
    polygon(ctx, [[x, 448], [x + 8, 426], [x + 16, 448]], '#b99ed9'); block(ctx, x + 7, 432, 3, 12, '#e4cbff')
  }
  for (const sign of level.signs) {
    if (sign.x < camera - 320 || sign.x > camera + 1000) continue
    ctx.font = '13px "Microsoft YaHei", sans-serif'
    const width = ctx.measureText(sign.text).width + 22
    block(ctx, sign.x - 4, sign.y - 3, width + 8, 32, '#385d5a35')
    block(ctx, sign.x, sign.y, width, 25, level.theme === 'cave' ? '#3c3855' : '#f7f0d6')
    ctx.fillStyle = level.theme === 'cave' ? '#f1e8fb' : '#3f6356'; ctx.fillText(sign.text, sign.x + 11, sign.y + 17)
  }
  const checkpoint = world.checkpoint
  block(ctx, checkpoint.x + 8, 382, 5, 65, '#4b6657')
  polygon(ctx, [[checkpoint.x + 13, 383], [checkpoint.x + 48, 383], [checkpoint.x + 39, 407], [checkpoint.x + 13, 407]], checkpoint.active ? '#efbd53' : '#a8c2af')
  block(ctx, level.goal + 12, 338, 7, 110, '#536c65')
  polygon(ctx, [[level.goal + 19, 342], [level.goal + 83, 342], [level.goal + 65, 378], [level.goal + 19, 378]], '#ee7869')
  ball(ctx, level.goal + 32, 349)
  block(ctx, level.goal - 15, 441, 70, 7, '#e0d3a7')
  for (const item of level.items) if (!item.collected) {
    const y = item.y + Math.round(Math.sin(time * 3 + item.x) * 3)
    if (item.kind === 'ball' || item.kind === 'hidden') {
      if (item.kind === 'hidden') { ctx.globalAlpha = 0.38 + Math.sin(time * 4) * 0.1; block(ctx, item.x - 6, y - 6, 30, 30, '#fff1ae'); ctx.globalAlpha = 1 }
      ball(ctx, item.x, y, item.kind === 'hidden')
    } else if (item.kind === 'berry') {
      block(ctx, item.x + 6, y, 9, 5, '#68a974'); block(ctx, item.x + 2, y + 7, 18, 14, '#e891a5'); block(ctx, item.x + 6, y + 4, 10, 21, '#e891a5'); block(ctx, item.x + 5, y + 9, 4, 5, '#ffbec8')
    } else {
      polygon(ctx, [[item.x + 12, y], [item.x + 1, y + 14], [item.x + 10, y + 14], [item.x + 6, y + 26], [item.x + 22, y + 9], [item.x + 13, y + 9]], CHARACTER_INFO[world.character].color)
      block(ctx, item.x - 4, y + 10, 3, 3, '#fff6bb')
    }
  }
  for (const e of world.enemies) if (e.alive) {
    const row = e.kind === 'patrol' ? 3 : e.kind === 'ranged' ? 4 : 5
    const size = e.kind === 'guardian' ? 68 : 46
    ctx.drawImage(atlas, Math.floor(time * 5) % 2 * 48, row * 48, 48, 48, Math.round(e.x + e.w / 2 - size / 2), Math.round(e.y + e.h - size + (e.kind === 'ranged' ? Math.sin(time * 3) * 3 : 0)), size, size)
    if (e.kind === 'guardian') { block(ctx, e.x - 8, e.y - 18, 64, 6, '#353247'); block(ctx, e.x - 6, e.y - 16, e.hp * 20, 2, '#e69aa8') }
  }
  const p = world.player
  if (p.invincible === 0 || Math.floor(time * 13) % 2 === 0) {
    const frame = p.invincible > 0 ? 5 : p.attack > 0 ? 4 : !p.grounded ? 3 : Math.abs(p.vx) > 20 ? 1 + Math.floor(time * 10) % 2 : 0
    ctx.save(); ctx.translate(Math.round(p.x + p.w / 2), Math.round(p.y + p.h)); ctx.scale(p.facing, 1)
    if (world.power > 0) { ctx.globalAlpha = 0.3; block(ctx, -26, -48, 52, 50, CHARACTER_INFO[world.character].color); ctx.globalAlpha = 1 }
    ctx.drawImage(atlas, frame * 48, CHARACTER_INFO[world.character].row * 48, 48, 48, -27, p.crouching ? -32 : -49, 54, p.crouching ? 35 : 54)
    ctx.restore()
  }
  for (const shot of world.shots) {
    const color = shot.enemy ? '#c6a8ec' : CHARACTER_INFO[world.character].color
    block(ctx, shot.x - Math.sign(shot.vx) * 12, shot.y + 4, 15, 6, `${color}88`)
    block(ctx, shot.x + 2, shot.y, shot.w - 4, shot.h, color); block(ctx, shot.x, shot.y + 3, shot.w, shot.h - 6, color)
    block(ctx, shot.x + 4, shot.y + 3, 6, 5, '#fff7dd')
  }
  for (const part of world.particles) { ctx.globalAlpha = Math.min(1, part.life * 3); block(ctx, part.x, part.y, 4, 4, part.color) }
  ctx.globalAlpha = 1
  // Subtle foreground leaves establish a third parallax layer without hiding hazards.
  if (level.theme !== 'cave') for (let i = 0; i < 7; i++) {
    const x = i * 450 - camera * 1.12
    block(ctx, x, 510, 80, 30, '#3b735d'); block(ctx, x + 15, 498, 44, 20, '#3b735d')
  }
  ctx.restore()
}
