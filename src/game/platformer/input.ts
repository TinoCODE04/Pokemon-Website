export type Action = 'left' | 'right' | 'jump' | 'down' | 'sprint' | 'attack'

export const KEY_ACTION: Record<string, Action> = {
  KeyA: 'left', ArrowLeft: 'left', KeyD: 'right', ArrowRight: 'right',
  KeyW: 'jump', ArrowUp: 'jump', KeyS: 'down', ArrowDown: 'down',
  ShiftLeft: 'sprint', ShiftRight: 'sprint', ControlLeft: 'sprint', ControlRight: 'sprint',
}

export class Input {
  private sources = new Map<Action, Set<string>>()
  private edges = new Set<Action>()
  set(action: Action, source: string, pressed: boolean) {
    const sources = this.sources.get(action) ?? new Set<string>()
    if (pressed) {
      if (sources.size === 0) this.edges.add(action)
      sources.add(source)
    } else sources.delete(source)
    this.sources.set(action, sources)
  }
  held(action: Action) { return (this.sources.get(action)?.size ?? 0) > 0 }
  consume(action: Action) { const had = this.edges.has(action); this.edges.delete(action); return had }
  clear() { this.sources.clear(); this.edges.clear() }
}
