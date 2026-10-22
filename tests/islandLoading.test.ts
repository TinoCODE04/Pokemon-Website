import assert from 'node:assert/strict'
import test from 'node:test'
import { getIslandProfile, shouldAutoLoadIsland } from '../src/utils/islandLoading.ts'

test('loads the island automatically only on a desktop without data saving', () => {
  assert.equal(shouldAutoLoadIsland({ compact: false, coarsePointer: false, saveData: false }), true)
  assert.equal(shouldAutoLoadIsland({ compact: true, coarsePointer: false, saveData: false }), false)
  assert.equal(shouldAutoLoadIsland({ compact: false, coarsePointer: true, saveData: false }), false)
  assert.equal(shouldAutoLoadIsland({ compact: false, coarsePointer: false, saveData: true }), false)
  assert.equal(shouldAutoLoadIsland({ compact: false, coarsePointer: false, saveData: false, effectiveType: '2g' }), false)
})

test('touch, narrow screens and constrained connections use the mobile asset', () => {
  const desktop = { compact: false, coarsePointer: false, saveData: false }
  assert.equal(getIslandProfile(desktop), 'desktop')
  for (const environment of [{ ...desktop, compact: true }, { ...desktop, coarsePointer: true }, { ...desktop, saveData: true }, { ...desktop, effectiveType: '2g' }]) assert.equal(getIslandProfile(environment), 'mobile')
})
