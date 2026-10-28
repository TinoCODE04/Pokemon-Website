import test from 'node:test'
import assert from 'node:assert/strict'
import { getPokemonSuggestions } from '../src/utils/pokemonSearch.ts'

const entries = [
  { id: 26, name: 'raichu' },
  { id: 10080, name: 'pikachu-rock-star' },
  { id: 25, name: 'pikachu' },
  { id: 172, name: 'pichu' },
  { id: 122, name: 'mr-mime' },
  { id: 778, name: 'mimikyu-disguised' },
  { id: 6, name: 'charizard' },
]

test('typing pika shows Pikachu and its matching forms before submitting', () => {
  assert.deepEqual(getPokemonSuggestions(entries, 'pika').map(entry => entry.id), [10080, 25])
})

test('an exact Pokémon name ranks ahead of alternate forms', () => {
  assert.deepEqual(getPokemonSuggestions(entries, '  PIKACHU ').map(entry => entry.id), [25, 10080])
})

test('prefix matches rank ahead of matches inside a name', () => {
  const matches = [{ id: 1, name: 'mega-pikachu' }, ...entries]
  assert.deepEqual(getPokemonSuggestions(matches, 'pika').map(entry => entry.id), [10080, 25, 1])
})

test('a padded Pokédex number with or without a hash matches the exact ID', () => {
  assert.deepEqual(getPokemonSuggestions(entries, '0025'), [{ id: 25, name: 'pikachu' }])
  assert.deepEqual(getPokemonSuggestions(entries, '#0025'), [{ id: 25, name: 'pikachu' }])
  assert.deepEqual(getPokemonSuggestions(entries, '2'), [])
})

test('names can be typed with spaces or punctuation', () => {
  assert.deepEqual(getPokemonSuggestions(entries, 'Mr. Mime'), [{ id: 122, name: 'mr-mime' }])
})

test('empty or unmatched input produces no suggestions', () => {
  assert.deepEqual(getPokemonSuggestions(entries, '  '), [])
  assert.deepEqual(getPokemonSuggestions(entries, 'zzzzpokemon'), [])
})

test('suggestions are bounded without reordering the source entries', () => {
  const original = entries.map(entry => ({ ...entry }))
  assert.equal(getPokemonSuggestions(entries, 'chu', 2).length, 2)
  getPokemonSuggestions(entries, 'pikachu')
  assert.deepEqual(entries, original)
})
