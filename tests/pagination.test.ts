import test from 'node:test'
import assert from 'node:assert/strict'
import { paginationWindow } from '../src/utils/pagination.ts'

test('shows the first ten pages and the final two pages near the beginning', () => {
  assert.deepEqual(paginationWindow(1, 57), [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '…', 56, 57,
  ])
})

test('centers five pages around the current page between both edges', () => {
  assert.deepEqual(paginationWindow(28, 57), [
    1, 2, '…', 26, 27, 28, 29, 30, '…', 56, 57,
  ])
})

test('shows the first two pages and final ten pages near the end', () => {
  assert.deepEqual(paginationWindow(55, 57), [
    1, 2, '…', 48, 49, 50, 51, 52, 53, 54, 55, 56, 57,
  ])
})

test('shows every page when the range is already compact', () => {
  assert.deepEqual(paginationWindow(3, 8), [1, 2, 3, 4, 5, 6, 7, 8])
})

test('introduces an ellipsis once the pagination reaches thirteen pages', () => {
  assert.deepEqual(paginationWindow(1, 13), [
    1, 2, 3, 4, 5, 6, 7, 8, 9, 10, '…', 12, 13,
  ])
})
