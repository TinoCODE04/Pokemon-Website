import { KEY_ACTION } from './input.ts'
import type { World } from './world.ts'
import { FixedClock } from './clock.ts'
import { render } from './art.ts'
import type { AudioBus } from './audio.ts'

export class Runtime {
  private frame = 0
  private disposed = false
  private last = 0
  private clock = new FixedClock()
  private lastHud = 0
  private ended = false
  private cleanup: (() => void)[] = []
  world: World
  private root: HTMLElement
  constructor(world: World, canvas: HTMLCanvasElement, root: HTMLElement, atlas: HTMLImageElement, audio: AudioBus, hud: () => void, pause: () => void, mute: () => void, finish: () => void) {
    this.world = world; this.root = root
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not create the game canvas in this browser.')
    const on = <K extends keyof WindowEventMap>(target: Window, key: K, handler: (event: WindowEventMap[K]) => void) => {
      target.addEventListener(key, handler); this.cleanup.push(() => target.removeEventListener(key, handler))
    }
    const typing = (target: EventTarget | null) => target instanceof HTMLElement && (target.matches('input, textarea, select') || target.isContentEditable)
    on(window, 'keydown', event => {
      if (typing(event.target) || !root.contains(document.activeElement)) return
      const action = KEY_ACTION[event.code]
      if (action || event.code === 'KeyP' || event.code === 'KeyM') event.preventDefault()
      if (event.code === 'KeyP' && !event.repeat) { pause(); return }
      if (event.code === 'KeyM' && !event.repeat) { mute(); return }
      if (action && !world.paused && !event.repeat) world.input.set(action, event.code, true)
    })
    on(window, 'keyup', event => { const action = KEY_ACTION[event.code]; if (action) world.input.set(action, event.code, false) })
    const loseFocus = () => { world.input.clear(); if (!world.paused && world.status === 'playing') pause() }
    on(window, 'blur', loseFocus)
    const visibility = () => { if (document.hidden) loseFocus() }
    document.addEventListener('visibilitychange', visibility); this.cleanup.push(() => document.removeEventListener('visibilitychange', visibility))
    const focusOut = (event: FocusEvent) => { if (!root.contains(event.relatedTarget as Node | null)) loseFocus() }
    root.addEventListener('focusout', focusOut); this.cleanup.push(() => root.removeEventListener('focusout', focusOut))
    const loop = (timestamp: number) => {
      if (this.disposed) return
      const elapsed = this.last ? Math.min((timestamp - this.last) / 1000, 0.1) : 0
      this.last = timestamp
      if (!world.paused && world.status === 'playing') {
        this.clock.advance(elapsed, dt => world.update(dt))
      } else this.clock.reset()
      render(ctx, world, atlas)
      for (const event of world.events.splice(0)) audio.play(event)
      if (timestamp - this.lastHud >= 100) { hud(); this.lastHud = timestamp }
      if (!this.ended && world.status !== 'playing') { this.ended = true; hud(); finish() }
      this.frame = requestAnimationFrame(loop)
    }
    this.frame = requestAnimationFrame(loop)
  }
  focus() { this.root.focus({ preventScroll: true }) }
  resetClock() { this.last = 0; this.clock.reset() }
  destroy() { this.disposed = true; cancelAnimationFrame(this.frame); this.world.input.clear(); this.cleanup.forEach(fn => fn()); this.cleanup = [] }
}
