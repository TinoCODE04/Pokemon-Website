import { Input } from './input.ts'
import { createLevel } from './levels.ts'
import type { Rect, Platform } from './levels.ts'
import type { Character } from './save.ts'

export const PHYSICS = { step: 1 / 120, acceleration: 2100, deceleration: 2600, walk: 230, sprint: 365, gravity: 1550, jump: 620, jumpCut: 225, terminal: 900, coyote: 0.1, buffer: 0.1, invincible: 1.65, attackCooldown: 0.42 }
export const overlap = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
const approach = (from: number, to: number, by: number) => from < to ? Math.min(from + by, to) : Math.max(from - by, to)
export interface Player extends Rect { vx: number; vy: number; grounded: boolean; facing: number; invincible: number; attack: number; crouching: boolean }
export interface Shot extends Rect { vx: number; vy: number; enemy: boolean; life: number; power: number }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; color: string }
export type SoundEvent = 'jump' | 'collect' | 'hurt' | 'attack' | 'hit' | 'checkpoint' | 'win' | 'land'

export class World {
  level: ReturnType<typeof createLevel>
  platforms: Platform[]
  enemies: ReturnType<typeof createLevel>['enemies']
  input = new Input()
  character: Character
  player: Player = { x: 90, y: 412, w: 26, h: 36, vx: 0, vy: 0, grounded: false, facing: 1, invincible: 0, attack: 0, crouching: false }
  checkpoint: { x: number; active: boolean }
  hp = 3
  score = 0
  collected = 0
  time = 0
  camera = 0
  power = 0
  cooldown = 0
  attacksFired = 0
  paused = false
  status: 'playing' | 'won' | 'lost' = 'playing'
  shots: Shot[] = []
  particles: Particle[] = []
  events: SoundEvent[] = []
  notice = ''
  noticeTime = 0
  private coyote = 0
  private buffer = 0
  private drop = 0
  private support: Platform | null = null

  constructor(id: number, character: Character) {
    this.level = createLevel(id); this.platforms = this.level.platforms; this.enemies = this.level.enemies
    this.checkpoint = { x: this.level.checkpoint, active: false }; this.character = character
  }
  toast(text: string) { this.notice = text; this.noticeTime = 3 }
  burst(x: number, y: number, color: string, count = 12) {
    for (let i = 0; i < count; i++) this.particles.push({ x, y, vx: Math.cos(i * 2.4) * (40 + i * 7), vy: -50 - (i % 5) * 25, life: 0.6, color })
  }
  private fire() {
    if (this.cooldown > 0 || this.player.crouching) return
    const p = this.player
    this.shots.push({ x: p.x + (p.facing > 0 ? p.w : -16), y: p.y + 12, w: this.power > 0 ? 24 : 16, h: 14, vx: p.facing * 570, vy: 0, enemy: false, life: 1.2, power: this.power > 0 ? 2 : 1 })
    this.cooldown = this.power > 0 ? 0.22 : PHYSICS.attackCooldown; p.attack = 0.2; this.attacksFired++; this.events.push('attack')
  }
  private hurt(fall = false) {
    if (this.status !== 'playing') return
    if (!fall && this.player.invincible > 0) return
    this.hp--; this.events.push('hurt'); this.burst(this.player.x, this.player.y, '#fa7b85')
    if (this.hp <= 0) { this.status = 'lost'; this.input.clear(); return }
    this.player.invincible = PHYSICS.invincible
    if (fall) {
      this.player.x = this.checkpoint.active ? this.checkpoint.x : 90
      this.player.y = 412; this.player.h = 36; this.player.crouching = false
      this.player.vx = 0; this.player.vy = 0; this.player.grounded = false
      this.support = null; this.coyote = 0; this.buffer = 0; this.drop = 0
      this.shots = this.shots.filter(s => !s.enemy || Math.abs(s.x - this.player.x) > 700)
      for (const enemy of this.enemies) if (Math.abs(enemy.x - this.player.x) < 260) {
        enemy.cooldown = 2.5
        if (Math.abs(enemy.x - this.player.x) < 90) enemy.x = this.player.x + 130
      }
      this.toast('Back in action! You are briefly invincible.')
    } else { this.player.vx = -this.player.facing * 200; this.player.vy = -280; this.player.grounded = false }
  }
  private hitEnemy(enemy: typeof this.enemies[number], damage: number) {
    enemy.hp -= damage; this.events.push('hit'); this.burst(enemy.x + 15, enemy.y, '#fce68b')
    if (enemy.hp <= 0) { enemy.alive = false; this.score += enemy.kind === 'guardian' ? 600 : 150 }
    else { enemy.cooldown = 1.3; this.toast(`The guardian has ${enemy.hp} HP left.`) }
  }
  update(dt: number) {
    if (this.paused || this.status !== 'playing') return
    this.time += dt; this.power = Math.max(0, this.power - dt); this.cooldown = Math.max(0, this.cooldown - dt)
    this.noticeTime = Math.max(0, this.noticeTime - dt)
    const p = this.player
    p.invincible = Math.max(0, p.invincible - dt); p.attack = Math.max(0, p.attack - dt)
    this.drop = Math.max(0, this.drop - dt)
    for (const platform of this.platforms) {
      platform.dx = 0
      if (platform.moving) {
        const next = platform.moving.origin + Math.sin(this.time * platform.moving.speed) * platform.moving.range
        platform.dx = next - platform.x; platform.x = next
      }
    }
    if (p.grounded && this.support?.moving) p.x += this.support.dx ?? 0
    this.coyote = p.grounded ? PHYSICS.coyote : Math.max(0, this.coyote - dt)
    this.buffer = this.input.consume('jump') ? PHYSICS.buffer : Math.max(0, this.buffer - dt)
    if (this.input.consume('sprint') || this.input.consume('attack')) this.fire()
    const down = this.input.held('down')
    if (down && p.grounded && this.support?.oneWay) { this.drop = 0.25; p.y += 3; p.grounded = false; this.coyote = 0 }
    if (down && p.grounded && !p.crouching) { p.y += 12; p.h = 24; p.crouching = true }
    if ((!down || !p.grounded) && p.crouching) {
      const standing = { ...p, y: p.y - 12, h: 36 }
      if (!this.platforms.some(s => !s.oneWay && overlap(standing, s))) { p.y -= 12; p.h = 36; p.crouching = false }
    }
    const direction = Number(this.input.held('right')) - Number(this.input.held('left'))
    if (direction) p.facing = direction
    const max = p.crouching ? 90 : this.input.held('sprint') ? PHYSICS.sprint : PHYSICS.walk
    p.vx = approach(p.vx, direction * max, (direction ? PHYSICS.acceleration : PHYSICS.deceleration) * dt)
    if (this.buffer > 0 && this.coyote > 0 && !down) {
      p.vy = -PHYSICS.jump; p.grounded = false; this.coyote = 0; this.buffer = 0; this.support = null; this.events.push('jump')
      this.burst(p.x + 13, p.y + p.h, '#c6eeb8', 5)
    }
    if (!this.input.held('jump') && p.vy < -PHYSICS.jumpCut) p.vy = -PHYSICS.jumpCut
    p.vy = Math.min(PHYSICS.terminal, p.vy + PHYSICS.gravity * dt)
    const oldX = p.x
    p.x += p.vx * dt
    for (const s of this.platforms) if (!s.oneWay && overlap(p, s)) {
      if (p.vx > 0 && oldX + p.w <= s.x + 1) p.x = s.x - p.w
      else if (p.vx < 0 && oldX >= s.x + s.w - 1) p.x = s.x + s.w
      p.vx = 0
    }
    p.x = Math.max(0, Math.min(this.level.width - p.w, p.x))
    const previousY = p.y, wasGrounded = p.grounded
    p.y += p.vy * dt; p.grounded = false; this.support = null
    for (const s of this.platforms) {
      if (p.x + p.w <= s.x || p.x >= s.x + s.w) continue
      if (s.oneWay && (this.drop > 0 || p.vy < 0)) continue
      if (p.vy >= 0 && previousY + p.h <= s.y + 0.5 && p.y + p.h >= s.y) {
        p.y = s.y - p.h; p.vy = 0; p.grounded = true; this.support = s
      } else if (!s.oneWay && p.vy < 0 && previousY >= s.y + s.h - 0.5 && p.y <= s.y + s.h) {
        p.y = s.y + s.h; p.vy = 0
      }
    }
    if (!wasGrounded && p.grounded) { this.events.push('land'); this.burst(p.x + 13, p.y + p.h, '#e1d0ab', 5) }
    if (p.y > 620) { this.hurt(true); return }
    if (!this.checkpoint.active && Math.abs(p.x - this.checkpoint.x) < 45 && p.y > 330 && p.grounded) {
      this.checkpoint.active = true; this.score += 100; this.events.push('checkpoint'); this.toast('Checkpoint reached! Your adventure is saved.')
    }
    for (const item of this.level.items) if (!item.collected && overlap(p, item)) {
      item.collected = true; this.events.push('collect'); this.burst(item.x, item.y, '#fbd865')
      if (item.kind === 'ball') { this.score += 100; this.collected++ }
      if (item.kind === 'berry') { this.hp = Math.min(3, this.hp + 1); this.score += 50; this.toast('Oran Berry! One heart restored.') }
      if (item.kind === 'energy') { this.power = 12; this.score += 100; this.toast('Elemental boost! Stronger attacks for 12 seconds.') }
      if (item.kind === 'hidden') { this.score += 500; this.collected++; this.toast('Hidden treasure found! +500') }
    }
    for (const e of this.enemies) if (e.alive) {
      e.cooldown = Math.max(0, e.cooldown - dt)
      if (e.kind === 'patrol') {
        const nextX = e.x + e.vx * dt
        const foot = { x: nextX + (e.vx > 0 ? e.w + 3 : -5), y: e.y + e.h + 1, w: 3, h: 5 }
        const nextBody = { ...e, x: nextX }
        if (!this.platforms.some(s => overlap(foot, s)) || this.platforms.some(s => !s.oneWay && overlap(nextBody, s)) || Math.abs(nextX - e.home) > e.range) e.vx *= -1
        else e.x = nextX
      } else if (e.cooldown === 0 && Math.abs(p.x - e.x) < 620) {
        const direction = p.x > e.x ? 1 : -1
        this.shots.push({ x: e.x + 10, y: e.y + 6, w: 14, h: 14, vx: direction * (e.kind === 'guardian' ? 240 : 180), vy: 0, life: 3.5, enemy: true, power: 1 })
        e.cooldown = e.kind === 'guardian' ? 1.15 : 2
      }
      if (overlap(p, e)) {
        if (p.vy > 0 && previousY + p.h <= e.y + 8) { this.hitEnemy(e, 1); p.y = e.y - p.h; p.vy = -420; p.grounded = false }
        else this.hurt()
      }
    }
    if (this.hp <= 0) return
    for (const trap of this.level.traps) if (overlap(p, trap)) { this.hurt(); if (this.hp <= 0) return }
    for (const shot of this.shots) {
      shot.x += shot.vx * dt; shot.y += shot.vy * dt; shot.life -= dt
      if (this.platforms.some(s => !s.oneWay && overlap(shot, s))) shot.life = 0
      if (shot.life <= 0) continue
      if (shot.enemy && overlap(p, shot)) { this.hurt(); shot.life = 0; if (this.hp <= 0) return }
      if (!shot.enemy) for (const enemy of this.enemies) if (enemy.alive && overlap(shot, enemy)) { this.hitEnemy(enemy, shot.power); shot.life = 0; break }
    }
    this.shots = this.shots.filter(s => s.life > 0)
    for (const part of this.particles) { part.x += part.vx * dt; part.y += part.vy * dt; part.vy += 380 * dt; part.life -= dt }
    this.particles = this.particles.filter(p => p.life > 0)
    this.camera = approach(this.camera, Math.max(0, Math.min(this.level.width - 960, p.x - 300)), 500 * dt)
    if (this.status === 'playing' && this.hp > 0 && p.x >= this.level.goal && p.grounded) {
      if (this.enemies.some(e => e.kind === 'guardian' && e.alive)) this.toast('Defeat the cave guardian before you finish!')
      else { this.status = 'won'; this.score += this.hp * 200 + Math.max(0, 600 - Math.floor(this.time * 3)); this.events.push('win'); this.input.clear() }
    }
  }
}
