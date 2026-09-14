import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { SUPPORTED_LOCALES } from '../src/i18n/types.ts'

const REQUIRED_KEYS = [
  'rankings.title', 'rankings.subtitle', 'rankings.metric.total', 'rankings.loadError',
  'types.title', 'types.subtitle', 'types.detail.damageRelations', 'types.loadError',
  'generations.title', 'generations.subtitle', 'generations.detail.region', 'generations.loadError',
  'abilities.title', 'abilities.subtitle', 'abilities.detail.effect', 'abilities.loadError',
  'compare.title', 'compare.subtitle', 'compare.chooseTitle', 'compare.emptyTitle', 'compare.clearAll',
  'details.pokemon.about', 'details.pokemon.baseStats', 'details.pokemon.evolution', 'details.pokemon.moves',
] as const

function valueAt(resource: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((value, key) => (
    typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined
  ), resource)
}

test('encyclopedia translation keys exist in every locale', () => {
  for (const locale of SUPPORTED_LOCALES) {
    const resource = JSON.parse(readFileSync(
      new URL(`../src/i18n/locales/${locale}.json`, import.meta.url),
      'utf8',
    )) as Record<string, unknown>
    for (const key of REQUIRED_KEYS) {
      const value = valueAt(resource, key)
      assert.equal(typeof value, 'string', `${locale}: ${key}`)
      assert.ok((value as string).trim(), `${locale}: ${key}`)
    }
  }
})
