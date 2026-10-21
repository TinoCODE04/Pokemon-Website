import assert from 'node:assert/strict'
import test from 'node:test'
import { shouldAutoLoadIsland } from '../src/utils/islandLoading.ts'

test('loads the island automatically only on a desktop without data saving', () => {
  assert.equal(shouldAutoLoadIsland({ compact: false, coarsePointer: false, saveData: false }), true)
  assert.equal(shouldAutoLoadIsland({ compact: true, coarsePointer: false, saveData: false }), false)
  assert.equal(shouldAutoLoadIsland({ compact: false, coarsePointer: true, saveData: false }), false)
  assert.equal(shouldAutoLoadIsland({ compact: false, coarsePointer: false, saveData: true }), false)
})
