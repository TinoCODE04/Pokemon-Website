import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('shipped island preserves 34 selectable Pokémon and stays within the web budget', () => {
  const bytes = readFileSync('public/models/pokemon-island.glb')
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
