export type Character = 'pikachu' | 'charmander' | 'mewtwo'
export interface Best { score: number; time: number; collected: number }
export interface Save { version: 1; unlocked: number; character: Character; muted: boolean; best: Record<number, Best> }
export const SAVE_KEY = 'px-super-pokemon-v1'
export const defaults = (): Save => ({ version: 1, unlocked: 1, character: 'pikachu', muted: false, best: {} })

export function readSave(raw: string | null): Save {
  const result = defaults()
  try {
    const value = JSON.parse(raw ?? '{}')
    if (!value || typeof value !== 'object' || value.version !== 1) return result
    if (Number.isInteger(value.unlocked) && value.unlocked >= 1 && value.unlocked <= 3) result.unlocked = value.unlocked
    if (['pikachu', 'charmander', 'mewtwo'].includes(value.character)) result.character = value.character
    if (typeof value.muted === 'boolean') result.muted = value.muted
    for (const id of [1, 2, 3]) {
      const best = value.best?.[id]
      if (best && [best.score, best.time, best.collected].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0)) result.best[id] = { score: best.score, time: best.time, collected: best.collected }
    }
  } catch { /* Corrupt storage is treated as a new save. */ }
  return result
}
export function loadSave(): Save { try { return readSave(localStorage.getItem(SAVE_KEY)) } catch { return defaults() } }
export function storeSave(save: Save) { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); return true } catch { return false } }
export function finishLevel(save: Save, id: number, score: number, time: number, collected: number): Save {
  const next = { ...save, unlocked: Math.max(save.unlocked, Math.min(3, id + 1)), best: { ...save.best } }
  const previous = next.best[id]
  if (!previous || score > previous.score || (score === previous.score && time < previous.time)) next.best[id] = { score, time, collected }
  return next
}
