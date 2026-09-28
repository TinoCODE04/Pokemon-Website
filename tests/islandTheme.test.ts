import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('island explorer switches its 3D backdrop and surfaces with the active theme', () => {
  const css = readFileSync('src/components/island/island.css', 'utf8')

  assert.match(css, /\.island-shell\{[^}]*--island-stage-bg:/)
  assert.match(css, /\.dark \.island-shell\{[^}]*--island-stage-bg:/)
  assert.match(css, /\.island-stage\{[^}]*background:var\(--island-stage-bg\)/)
  assert.match(css, /\.island-toolbar\{[^}]*background:var\(--island-shell-bg\)/)
})
