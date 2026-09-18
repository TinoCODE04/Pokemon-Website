import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, weld, simplify, meshopt, textureCompress } from '@gltf-transform/functions'
import sharp from 'sharp'
import { MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer'
import { stat, rename, mkdir, access, readFile } from 'node:fs/promises'

await Promise.all([MeshoptEncoder.ready, MeshoptSimplifier.ready])
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })
let input = 'public/models/pokemon-island.raw.glb'
try { await access(input) } catch { input = 'output/island/pokemon-island.raw.glb' }
const output = 'public/models/pokemon-island.glb'
const document = await io.read(input)
// Procedural AO/color mixes are Blender-only. Preserve the authored base colors
// as standard PBR factors; retain the painted water texture unchanged.
const palette = JSON.parse(await readFile('public/models/island-palette.json', 'utf8'))
for (const material of document.getRoot().listMaterials()) {
  if (!material.getBaseColorTexture() && palette[material.getName()]) material.setBaseColorFactor(palette[material.getName()])
}
await document.transform(dedup(), weld(), simplify({ simplifier: MeshoptSimplifier, ratio: 0.4, error: 0.0005 }), prune(), textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 85 }), meshopt({ encoder: MeshoptEncoder, level: 'medium' }))
await io.write(output, document)
console.log(`Island GLB: ${((await stat(output)).size / 1024 / 1024).toFixed(2)} MB`)
// Keep the intermediate export out of Vite's public directory and production builds.
await mkdir('output/island', { recursive: true })
if (input.startsWith('public/')) await rename(input, 'output/island/pokemon-island.raw.glb')
let poster = 'public/models/island-poster.png'
try { await access(poster) } catch { poster = 'output/island/island-poster.png' }
await sharp(poster).webp({ quality: 85 }).toFile('public/models/island-poster.webp')
if (poster.startsWith('public/')) await rename(poster, 'output/island/island-poster.png')
