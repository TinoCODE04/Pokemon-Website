import { mkdir, readFile, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const { pokemon } = JSON.parse(await readFile('public/models/island-manifest.json', 'utf8'))
const directory = 'public/images/island-pokemon'
await mkdir(directory, { recursive: true })
// Small local images keep the picker independent of runtime CDN availability.
for (let offset = 0; offset < pokemon.length; offset += 4) {
  await Promise.all(pokemon.slice(offset, offset + 4).map(async ({ id }) => {
    const response = await fetch(`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`)
    if (!response.ok) throw new Error(`Artwork ${id}: HTTP ${response.status}`)
    await sharp(Buffer.from(await response.arrayBuffer())).resize(160, 160, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 82 }).toFile(`${directory}/${id}.webp`)
  }))
}
await writeFile(`${directory}/SOURCE.txt`, 'Pokémon official artwork distributed by PokeAPI/sprites.\nSource: https://github.com/PokeAPI/sprites/tree/master/sprites/pokemon/other/official-artwork\nPokémon and Pokémon character names are trademarks of Nintendo, Creatures Inc. and GAME FREAK inc.\nResized to 160 × 160 WebP for the Legendary Island picker.\n')
console.log(`Saved ${pokemon.length} island Pokémon thumbnails.`)
