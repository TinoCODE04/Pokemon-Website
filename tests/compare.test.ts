import test from 'node:test'
import assert from 'node:assert/strict'
import {
  addPokemonToCompare,
  getFocusRestoreTarget,
  isPokemonBrowserActive,
  shouldClosePokemonBrowser,
  getCompareColumnCount,
  getComparisonHighlights,
  isComparisonReady,
  paginateAvailablePokemon,
} from '../src/utils/compare.ts'

test('adds a Pokémon idempotently without exceeding the comparison limit', () => {
  assert.deepEqual(addPokemonToCompare([6], 25, 3), [6, 25])
  assert.deepEqual(addPokemonToCompare([6, 25], 25, 3), [6, 25])
  assert.deepEqual(addPokemonToCompare([6, 25, 150], 9, 3), [6, 25, 150])
})

test('restores focus to the opener or a stable fallback when the opener was removed', () => {
  const opener = { isConnected: true, name: 'slot' }
  const removedOpener = { isConnected: false, name: 'add' }
  const fallback = { isConnected: true, name: 'clear' }

  assert.equal(getFocusRestoreTarget(opener, fallback), opener)
  assert.equal(getFocusRestoreTarget(removedOpener, fallback), fallback)
})

test('deactivates the Pokémon browser when another tab fills the comparison', () => {
  assert.equal(isPokemonBrowserActive(true, false), true)
  assert.equal(isPokemonBrowserActive(true, true), false)
  assert.equal(isPokemonBrowserActive(false, false), false)
})

test('closes the underlying browser state when an open comparison becomes full', () => {
  assert.equal(shouldClosePokemonBrowser(true, true), true)
  assert.equal(shouldClosePokemonBrowser(true, false), false)
  assert.equal(shouldClosePokemonBrowser(false, true), false)
})

test('keeps an add slot in the same row until all three compare slots are filled', () => {
  assert.equal(getCompareColumnCount(1, 3), 2)
  assert.equal(getCompareColumnCount(2, 3), 3)
  assert.equal(getCompareColumnCount(3, 3), 3)
})

test('summarizes total, offense, defense, and speed leaders', () => {
  const pokemon = [
    {
      id: 6,
      name: 'charizard',
      stats: {
        hp: 78,
        attack: 84,
        defense: 78,
        'special-attack': 109,
        'special-defense': 85,
        speed: 100,
      },
    },
    {
      id: 9,
      name: 'blastoise',
      stats: {
        hp: 79,
        attack: 83,
        defense: 100,
        'special-attack': 85,
        'special-defense': 105,
        speed: 78,
      },
    },
  ]

  assert.deepEqual(getComparisonHighlights(pokemon), [
    { label: 'Highest total', value: 534, leaders: ['charizard'] },
    { label: 'Top offense', value: 109, leaders: ['charizard'] },
    { label: 'Best defense', value: 105, leaders: ['blastoise'] },
    { label: 'Fastest', value: 100, leaders: ['charizard'] },
  ])
})

test('preserves every leader when a comparison highlight is tied', () => {
  const pokemon = [
    {
      id: 25,
      name: 'pikachu',
      stats: {
        hp: 35,
        attack: 55,
        defense: 40,
        'special-attack': 50,
        'special-defense': 50,
        speed: 90,
      },
    },
    {
      id: 26,
      name: 'raichu',
      stats: {
        hp: 60,
        attack: 90,
        defense: 55,
        'special-attack': 90,
        'special-defense': 80,
        speed: 90,
      },
    },
  ]

  const fastest = getComparisonHighlights(pokemon).find((item) => item.label === 'Fastest')
  assert.deepEqual(fastest, {
    label: 'Fastest',
    value: 90,
    leaders: ['pikachu', 'raichu'],
  })
})

test('waits for every selected Pokémon before declaring comparison leaders', () => {
  assert.equal(isComparisonReady(3, 2, false), false)
  assert.equal(isComparisonReady(3, 3, true), false)
  assert.equal(isComparisonReady(3, 3, false), true)
})

test('paginates browsable Pokémon while excluding current comparison choices', () => {
  const entries = [1, 2, 3, 4, 5, 6].map((id) => ({ id, name: `pokemon-${id}` }))

  assert.deepEqual(paginateAvailablePokemon(entries, [2, 5], 2, 2), {
    items: [
      { id: 4, name: 'pokemon-4' },
      { id: 6, name: 'pokemon-6' },
    ],
    page: 2,
    totalPages: 2,
    totalItems: 4,
  })
})

test('clamps a browsable Pokémon page after exclusions reduce the result count', () => {
  const entries = [1, 2, 3, 4].map((id) => ({ id, name: `pokemon-${id}` }))

  assert.deepEqual(paginateAvailablePokemon(entries, [3, 4], 99, 2), {
    items: [
      { id: 1, name: 'pokemon-1' },
      { id: 2, name: 'pokemon-2' },
    ],
    page: 1,
    totalPages: 1,
    totalItems: 2,
  })
})
