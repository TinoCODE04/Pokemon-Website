import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

test('uses the Pokémon World brand throughout current product surfaces', () => {
  const surfaces = [
    read('../index.html'),
    read('../src/App.tsx'),
    read('../src/components/layout/Navbar.tsx'),
    read('../src/components/layout/Footer.tsx'),
    read('../src/pages/HomePage.tsx'),
    read('../README.md'),
  ]

  for (const surface of surfaces) {
    assert.doesNotMatch(surface, /Pok(?:é|e)mon Explorer/)
  }

  assert.match(read('../index.html'), /<title>Pokémon World — Explore, Battle &amp; Discover<\/title>/)
  assert.match(read('../src/App.tsx'), /Pokémon World — Explore, Battle & Discover/)
  assert.match(read('../src/App.tsx'), /\| Pokémon World/)
  assert.match(read('../src/components/layout/Navbar.tsx'), /Pokémon[\s\S]*World/)
  assert.match(read('../src/components/layout/Footer.tsx'), /Pokémon World/)
})

test('uses pokemon-world as the npm package name', () => {
  const packageJson = JSON.parse(read('../package.json')) as { name: string }
  const packageLock = JSON.parse(read('../package-lock.json')) as {
    name: string
    packages: Record<string, { name?: string }>
  }

  assert.equal(packageJson.name, 'pokemon-world')
  assert.equal(packageLock.name, 'pokemon-world')
  assert.equal(packageLock.packages[''].name, 'pokemon-world')
})
