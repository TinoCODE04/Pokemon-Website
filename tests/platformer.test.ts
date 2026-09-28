import test from 'node:test'
import assert from 'node:assert/strict'
import { World, PHYSICS } from '../src/game/platformer/world.ts'
import { readSave, finishLevel } from '../src/game/platformer/save.ts'
import { Input } from '../src/game/platformer/input.ts'
import { FixedClock } from '../src/game/platformer/clock.ts'

const step = (world: World, seconds: number) => {
  for (let i = 0; i < Math.round(seconds / PHYSICS.step); i++) world.update(PHYSICS.step)
}

test('invalid and partial saves safely recover valid defaults', () => {
  assert.equal(readSave('{').unlocked, 1)
  assert.equal(readSave('{"unlocked":99,"character":"oops","muted":"yes"}').unlocked, 1)
  assert.equal(readSave('{"version":1,"unlocked":2,"character":"mewtwo"}').character, 'mewtwo')
  const save = finishLevel(readSave(null), 1, 1200, 40, 6)
  assert.equal(save.unlocked, 2)
  assert.equal(finishLevel(save, 1, 900, 50, 4).best[1].score, 1200)
})

test('input merges multiple sources and produces only one press edge', () => {
  const input = new Input()
  input.set('sprint', 'ShiftLeft', true)
  input.set('sprint', 'ShiftLeft', true)
  assert.equal(input.consume('sprint'), true)
  assert.equal(input.consume('sprint'), false)
  input.set('sprint', 'ControlLeft', true)
  assert.equal(input.consume('sprint'), false)
  input.set('sprint', 'ShiftLeft', false)
  assert.equal(input.held('sprint'), true)
  input.clear()
  assert.equal(input.held('sprint'), false)
})

test('short and held jumps differ; ground remains stable at rest', () => {
  const high = new World(1, 'pikachu')
  const low = new World(1, 'pikachu')
  step(high, 0.1); step(low, 0.1)
  const ground = high.player.y
  high.input.set('jump', 'test', true); low.input.set('jump', 'test', true)
  step(high, 0.05); step(low, 0.05)
  low.input.set('jump', 'test', false)
  let highY = high.player.y, lowY = low.player.y
  for (let i = 0; i < 100; i++) {
    high.update(PHYSICS.step); low.update(PHYSICS.step)
    highY = Math.min(highY, high.player.y); lowY = Math.min(lowY, low.player.y)
  }
  assert.ok(lowY - highY > 45)
  high.input.clear(); step(high, 2)
  assert.equal(high.player.y, ground)
  assert.equal(high.player.grounded, true)
})

test('sprint moves faster and attack does not auto repeat when held', () => {
  const walk = new World(1, 'pikachu'), sprint = new World(1, 'pikachu')
  for (const w of [walk, sprint]) w.input.set('right', 'test', true)
  sprint.input.set('sprint', 'test', true)
  step(walk, 0.7); step(sprint, 0.7)
  assert.ok(sprint.player.x > walk.player.x + 50)
  assert.equal(sprint.attacksFired, 1)
})

test('ceiling and wall stop high speed movement without tunneling', () => {
  const w = new World(1, 'pikachu')
  w.platforms.push({ x: 180, y: 200, w: 20, h: 248, oneWay: false })
  w.input.set('right', 'test', true); w.input.set('sprint', 'test', true)
  step(w, 1)
  assert.ok(w.player.x + w.player.w <= 180)
  w.platforms.push({ x: 0, y: 365, w: 180, h: 20, oneWay: false })
  w.input.set('jump', 'test', true)
  step(w, 0.12)
  assert.ok(w.player.y >= 385)
})

test('coyote time and buffered landing accept nearby jump input', () => {
  const coyote = new World(1, 'pikachu')
  step(coyote, 0.1)
  coyote.player.x = 700; coyote.player.y = 410
  coyote.platforms = []
  step(coyote, 0.06)
  coyote.input.set('jump', 'test', true); step(coyote, 0.02)
  assert.ok(coyote.player.vy < -400)
  const buffered = new World(1, 'pikachu')
  buffered.player.y = 400; buffered.player.vy = 120
  buffered.input.set('jump', 'test', true)
  step(buffered, 0.1)
  assert.ok(buffered.player.vy < -400)
})

test('one way platform permits ascent and dropping through', () => {
  const w = new World(1, 'pikachu')
  w.platforms = [{ x: 0, y: 350, w: 300, h: 16, oneWay: true }, { x: 0, y: 448, w: 300, h: 100, oneWay: false }]
  w.player.y = 314; w.player.grounded = true
  step(w, 0.05)
  assert.equal(w.player.y, 314)
  w.input.set('down', 'test', true); step(w, 0.35)
  assert.ok(w.player.y > 350)
})

test('pause freezes all simulation timers; falling respawns once with invulnerability', () => {
  const w = new World(2, 'charmander')
  step(w, 0.1)
  w.paused = true
  const before = JSON.stringify({ p: w.player, enemies: w.enemies, t: w.time, platforms: w.platforms })
  step(w, 2)
  assert.equal(JSON.stringify({ p: w.player, enemies: w.enemies, t: w.time, platforms: w.platforms }), before)
  w.paused = false
  w.player.y = 700; step(w, 0.02)
  assert.equal(w.hp, 2)
  assert.ok(w.player.x < 200)
  assert.ok(w.player.invincible > 1)
})

test('stomps bounce, side contacts damage once, and checkpoints respawn safely', () => {
  const w = new World(2, 'mewtwo')
  const enemy = w.enemies[0]
  w.player.x = enemy.x; w.player.y = enemy.y - w.player.h - 2; w.player.vy = 280
  step(w, 0.03)
  assert.equal(enemy.alive, false)
  assert.ok(w.player.vy < 0)
  const side = w.enemies.find(e => e.alive)!
  w.player.x = side.x; w.player.y = side.y; w.player.invincible = 0
  step(w, 0.02)
  assert.equal(w.hp, 2)
  step(w, 0.1)
  assert.equal(w.hp, 2)
  w.player.x = w.checkpoint.x; w.player.y = 412; w.player.vy = 0; step(w, 0.02)
  assert.equal(w.checkpoint.active, true)
  w.player.invincible = 0; w.player.y = 700; step(w, 0.02)
  assert.ok(Math.abs(w.player.x - w.checkpoint.x) < 40)
})

test('finishes all three levels at the goal and failure allows fresh challenge', () => {
  for (const id of [1, 2, 3]) {
    const w = new World(id, 'pikachu')
    w.enemies.forEach(e => { e.alive = false })
    w.player.x = w.level.goal; w.player.y = 412
    step(w, 0.02)
    assert.equal(w.status, 'won')
  }
  const w = new World(1, 'pikachu')
  for (let i = 0; i < 3; i++) { w.player.y = 700; step(w, 0.02) }
  assert.equal(w.status, 'lost')
  assert.equal(new World(1, 'pikachu').hp, 3)
})

test('all authored levels are traversable from spawn with ordinary movement and attacks', () => {
  for (const id of [1, 2, 3]) {
    const world = new World(id, 'pikachu')
    world.input.set('right', 'replay', true)
    let lastJump = -100
    for (let i = 0; i < 16000 && world.status === 'playing'; i++) {
      const p = world.player
      world.input.set('sprint', 'replay', i % 70 !== 0)
      const floor = world.platforms.find(s => !s.oneWay && p.x >= s.x && p.x < s.x + s.w)
      const edge = floor ? floor.x + floor.w : Infinity
      const trap = world.level.traps.find(t => t.x > p.x && t.x - p.x < 90)
      if ((edge - p.x < 100 || trap) && p.grounded) { world.input.set('jump', 'replay', true); lastJump = i }
      if (i - lastJump > 80) world.input.set('jump', 'replay', false)
      world.update(PHYSICS.step)
    }
    assert.equal(world.status, 'won', `level ${id} must be reachable`)
    assert.ok(world.collected > 0)
    if (id === 3) assert.equal(world.enemies.find(e => e.kind === 'guardian')?.alive, false)
  }
})

test('fixed step accumulator gives identical movement at 30, 60 and 144Hz', () => {
  const positions = [30, 60, 144].map(hz => {
    const world = new World(1, 'pikachu')
    world.input.set('right', 'test', true)
    const clock = new FixedClock()
    for (let i = 0; i < hz; i++) {
      clock.advance(1 / hz, dt => world.update(dt))
    }
    return world.player.x
  })
  assert.ok(Math.max(...positions) - Math.min(...positions) < 0.001)
})

test('moving platform carries a standing player while mobile direction and jump coexist', () => {
  const w = new World(2, 'pikachu')
  w.platforms = [{ x: 80, y: 350, w: 200, h: 20, oneWay: true, moving: { origin: 80, range: 80, speed: 1 } }]
  w.player.y = 314
  step(w, 0.2)
  assert.equal(w.player.grounded, true)
  assert.ok(w.player.x > 100)
  w.input.set('right', 'touch-1', true); w.input.set('jump', 'touch-2', true)
  step(w, 0.1)
  assert.ok(w.player.vx > 0 && w.player.vy < 0)
})

test('energy buffs expire, berries heal, hidden rewards score and respawn clears hostile shots', () => {
  const w = new World(1, 'mewtwo')
  w.hp = 2
  w.level.items = ['energy', 'berry', 'hidden'].map(kind => ({ x: 90, y: 412, w: 22, h: 24, kind, collected: false })) as typeof w.level.items
  step(w, 0.02)
  assert.equal(w.hp, 3); assert.ok(w.power > 11); assert.equal(w.score, 650)
  w.enemies = []; w.input.set('attack', 'test', true); step(w, 0.02)
  assert.equal(w.shots[0].power, 2)
  step(w, 12)
  assert.equal(w.power, 0)
  w.shots.push({ x: 91, y: 420, w: 14, h: 14, vx: 100, vy: 0, enemy: true, power: 1, life: 3 })
  w.player.y = 700; step(w, 0.02)
  assert.equal(w.shots.some(s => s.enemy && Math.abs(s.x - w.player.x) < 700), false)
})

test('fatal damage at the finish remains failure and cannot score or unlock victory', () => {
  const w = new World(2, 'pikachu')
  w.enemies = []
  w.hp = 1; w.player.x = w.level.goal; w.player.y = 412
  w.shots = [0, 1].map(() => ({ x: w.level.goal, y: 420, w: 14, h: 14, vx: 0, vy: 0, enemy: true, power: 1, life: 3 }))
  step(w, 0.02)
  assert.equal(w.status, 'lost')
  assert.equal(w.hp, 0)
  assert.equal(w.events.includes('win'), false)
  assert.equal(w.score, 0)
})
