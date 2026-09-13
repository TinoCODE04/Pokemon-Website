import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('uses a cinematic still for the movie homepage atmosphere', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const atmosphere = css.match(/\.movies-atmosphere\s*\{[\s\S]*?\n  \}/)?.[0] ?? ''

  assert.match(atmosphere, /url\(['"]\/movies-hero-bg\.jpg['"]\)/)
})
