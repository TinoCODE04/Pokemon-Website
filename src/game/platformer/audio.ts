import type { SoundEvent } from './world.ts'

const NOTES: Record<SoundEvent, number[]> = { jump: [330, 550], collect: [660, 880], hurt: [180, 100], attack: [440, 220], hit: [240, 140], checkpoint: [440, 550, 660], win: [523, 659, 784, 1046], land: [90] }
export class AudioBus {
  private context: AudioContext | null = null
  muted = false
  unlock() {
    try { this.context ??= new AudioContext(); if (!this.muted) void this.context.resume().catch(() => {}) } catch { /* Audio is optional. */ }
  }
  setMuted(muted: boolean) {
    this.muted = muted
    if (this.context) void (muted ? this.context.suspend() : this.context.resume()).catch(() => {})
  }
  play(event: SoundEvent) {
    const context = this.context
    if (!context || this.muted || context.state !== 'running') return
    NOTES[event].forEach((frequency, i) => {
      const oscillator = context.createOscillator(), gain = context.createGain(), when = context.currentTime + i * 0.07
      oscillator.type = event === 'hurt' ? 'sawtooth' : 'square'; oscillator.frequency.setValueAtTime(frequency, when)
      gain.gain.setValueAtTime(0.025, when); gain.gain.exponentialRampToValueAtTime(0.001, when + 0.09)
      oscillator.connect(gain); gain.connect(context.destination); oscillator.start(when); oscillator.stop(when + 0.1)
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect() }
    })
  }
  pause() { if (this.context) void this.context.suspend().catch(() => {}) }
  destroy() { if (this.context) void this.context.close().catch(() => {}); this.context = null }
}
