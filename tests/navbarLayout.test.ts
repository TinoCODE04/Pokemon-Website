import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

test('gives the desktop navbar wider breathing room at both edges', () => {
  const css = readFileSync(new URL('../src/index.css', import.meta.url), 'utf8')
  const navbarShell = css.match(/\.navbar-shell\s*\{[\s\S]*?\n  \}/)?.[0] ?? ''

  assert.match(navbarShell, /max-w-\[92rem\]/)
  assert.match(navbarShell, /lg:px-6/)
})

test('keeps desktop navbar groups separated while preserving the mobile menu', () => {
  const source = readFileSync(new URL('../src/components/layout/Navbar.tsx', import.meta.url), 'utf8')

  assert.match(source, /className="navbar-shell flex h-16 min-w-0 items-center justify-between gap-2 sm:gap-3"/)
  assert.match(source, /className="hidden items-center gap-1 xl:flex"/)
  assert.match(source, /className="flex shrink-0 items-center gap-1 sm:gap-1\.5"/)
  assert.match(source, /className="container-app overflow-x-auto/)
})
