import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { ISLAND_PREVIEW } from '../src/data/islandPreview.ts'
import { ISLAND_ASSETS } from '../src/data/islandAssets.ts'

test('shipped island preserves 34 selectable Pokémon and stays within the web budget', () => {
  const bytes = readFileSync('public/models/pokemon-island.glb')
  assert.equal(createHash('sha256').update(bytes).digest('hex'), '7bb5eba8ca97d47c8b975b9f48a98be9414f29a40cb5106f42d5faa25fa2cdec', 'the original reference model must remain unchanged')
  assert.equal(bytes.readUInt32LE(0), 0x46546c67)
  assert.equal(bytes.readUInt32LE(4), 2)
  assert.ok(bytes.length < 15 * 1024 * 1024, 'GLB must stay under 15 MB')
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
  const pokemon = json.nodes.filter((node: { extras?: { pokemonId?: number } }) => node.extras?.pokemonId)
  assert.equal(new Set(pokemon.map((node: { extras: { pokemonId: number } }) => node.extras.pokemonId)).size, 34)
  assert.ok(pokemon.some((node: { extras: { pokemonId: number } }) => node.extras.pokemonId === 493))
  assert.ok(json.meshes.reduce((count: number, mesh: { primitives: unknown[] }) => count + mesh.primitives.length, 0) < 500)
  assert.ok(!json.buffers.some((buffer: { uri?: string }) => buffer.uri), 'GLB must be self-contained')
  const colored = json.materials.filter((material: { pbrMetallicRoughness?: { baseColorFactor?: number[] } }) =>
    material.pbrMetallicRoughness?.baseColorFactor?.slice(0, 3).some((value: number) => value < 0.8))
  assert.ok(colored.length > 40, 'Blender procedural colors must survive as GLB PBR colors')
})

test('mobile and desktop island profiles preserve all Pokémon with smaller versioned downloads', () => {
  for (const profile of ['mobile', 'desktop']) {
    const asset = ISLAND_ASSETS[profile as keyof typeof ISLAND_ASSETS]
    const name = asset.url.split('/').at(-1)!
    assert.match(name, new RegExp(`^pokemon-island-${profile}-[a-f0-9]{12}\\.glb$`))
    const bytes = readFileSync(`public/models/${name}`)
    assert.equal(asset.bytes, bytes.byteLength)
    assert.ok(name.includes(createHash('sha256').update(bytes).digest('hex').slice(0, 12)))
    const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
    const original = readFileSync('public/models/pokemon-island.glb')
    const originalJson = JSON.parse(original.subarray(20, 20 + original.readUInt32LE(12)).toString())
    const ids = (data: typeof json) => data.nodes.filter((node: { extras?: { pokemonId?: number } }) => node.extras?.pokemonId).map((node: { extras: { pokemonId: number } }) => node.extras.pokemonId).sort()
    assert.deepEqual(ids(json), ids(originalJson))
    const [minBytes, maxBytes] = profile === 'mobile' ? [6_500_000, 7_500_000] : [8_500_000, 10_500_000]
    assert.ok(bytes.length >= minBytes && bytes.length <= maxBytes, `${profile}: ${bytes.length} bytes must fit the higher-detail download budget`)
    const countTriangles = (data: typeof json) => data.meshes.flatMap((mesh: { primitives: { indices: number }[] }) => mesh.primitives).reduce((total: number, primitive: { indices: number }) => total + data.accessors[primitive.indices].count / 3, 0)
    const triangles = countTriangles(json)
    if (profile === 'desktop') assert.equal(triangles, countTriangles(originalJson), 'Standard must preserve every original triangle')
    else assert.ok(triangles >= countTriangles(originalJson) * 0.7, 'Light must retain at least 70% of the original geometric detail')
    assert.equal(asset.triangles, triangles)
    assert.ok(json.materials.length > 40, 'retain the authored color palette')
    const texturedTriangles = (data: typeof json) => data.meshes.flatMap((mesh: { primitives: { material: number; indices: number }[] }) => mesh.primitives).filter((primitive: { material: number }) => data.materials[primitive.material]?.pbrMetallicRoughness?.baseColorTexture).reduce((total: number, primitive: { indices: number }) => total + data.accessors[primitive.indices].count / 3, 0)
    assert.equal(texturedTriangles(json), texturedTriangles(originalJson), 'water topology must survive simplification')
  }
})

test('the no-download preview covers all 34 real Pokémon inside the poster', () => {
  const bytes = readFileSync('public/models/pokemon-island.glb')
  const json = JSON.parse(bytes.subarray(20, 20 + bytes.readUInt32LE(12)).toString())
  const modelIds = json.nodes.filter((node: { extras?: { pokemonId?: number } }) => node.extras?.pokemonId).map((node: { extras: { pokemonId: number } }) => node.extras.pokemonId).sort()
  assert.deepEqual(ISLAND_PREVIEW.pokemon.map((entry) => entry.id).sort(), modelIds)
  for (const entry of ISLAND_PREVIEW.pokemon) assert.ok(entry.x > 0 && entry.x < 100 && entry.y > 0 && entry.y < 100, entry.name)
})
