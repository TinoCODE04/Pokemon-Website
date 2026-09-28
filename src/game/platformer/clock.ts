import { PHYSICS } from './world.ts'

export class FixedClock {
  private accumulator = 0
  advance(elapsed: number, simulate: (dt: number) => void) {
    this.accumulator += Math.max(0, Math.min(elapsed, 0.1))
    // Tolerate rounding at refresh rates that do not divide evenly into 120Hz.
    while (this.accumulator + 1e-12 >= PHYSICS.step) {
      simulate(PHYSICS.step)
      this.accumulator -= PHYSICS.step
    }
  }
  reset() { this.accumulator = 0 }
}
