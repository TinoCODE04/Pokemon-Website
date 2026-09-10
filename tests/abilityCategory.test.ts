import test from 'node:test'
import assert from 'node:assert/strict'

test('assigns well-known abilities to meaningful visual categories', async () => {
  const { abilityCategory } = await import('../src/utils/abilityCategory.ts')

  const cases = [
    ['adaptability', 'special'],
    ['aerilate', 'mobility'],
    ['aftermath', 'explosive'],
    ['air-lock', 'weather'],
    ['analytic', 'mental'],
    ['anticipation', 'sensory'],
    ['aqua-boost', 'water'],
    ['arena-trap', 'trap'],
    ['armor-tail', 'defense'],
    ['battery', 'electric'],
    ['battle-bond', 'bond'],
    ['celebrate', 'celebration'],
  ] as const

  for (const [ability, category] of cases) {
    assert.equal(abilityCategory(ability), category, ability)
  }
})

test('classifies abilities through stable keyword rules', async () => {
  const { abilityCategory } = await import('../src/utils/abilityCategory.ts')

  const cases = [
    ['flame-body', 'fire'],
    ['water-absorb', 'water'],
    ['volt-absorb', 'electric'],
    ['chlorophyll', 'nature'],
    ['ice-scales', 'ice'],
    ['power-spot', 'offense'],
    ['friend-guard', 'defense'],
    ['speed-boost', 'speed'],
    ['healer', 'recovery'],
    ['compound-eyes', 'sensory'],
    ['sand-stream', 'weather'],
    ['bad-dreams', 'mental'],
    ['pickup', 'item'],
    ['shadow-tag', 'ghost'],
  ] as const

  for (const [ability, category] of cases) {
    assert.equal(abilityCategory(ability), category, ability)
  }
})

test('uses the special category when no semantic rule matches', async () => {
  const { abilityCategory } = await import('../src/utils/abilityCategory.ts')
  assert.equal(abilityCategory('unknown-ability-name'), 'special')
})
