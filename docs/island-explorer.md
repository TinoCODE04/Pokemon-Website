# Legendary Island

The home page places the interactive island immediately below the existing hero,
before feature cards. `/home` redirects to the canonical home route `/`.

The source is `pokemon_island_regirock_redesigned.blend`. It is never modified by
the export process. The shipped model is `public/models/pokemon-island.glb`
(about 15 MiB), with 34 individually selectable Pokémon and Meshopt compression.
The water texture is embedded WebP; other colors are portable PBR base colors.
Blender-only procedural ambient occlusion is approximated by the web lighting.

## Rebuild assets

From the repository root, using Blender 5.2 and installed npm dependencies:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' -b pokemon_island_regirock_redesigned.blend --python scripts/export-island.py
node scripts/optimize-island.mjs
node --test tests/islandAsset.test.ts
```

The exporter makes shared mesh data independent, caps subdivision/bevel detail,
merges scenery, preserves Pokémon IDs as glTF extras, and renders a poster.
The optimizer reduces geometry, transfers procedural base colors, compresses the
water texture, and moves large intermediate files into ignored `output/island/`.
No external CDN or API is required to load the island.

## Controls and lifecycle

- Drag to orbit; wheel/pinch or plus/minus buttons to zoom.
- Click visible Pokémon, or open the illustrated picker to choose any of the 34.
  Search by name or Pokédex number; use Tab or arrow keys to browse, Enter to
  select, and Escape to close. Selection returns focus to the picker trigger.
- The picker, toolbar selection, and discovery card use local 160px WebP artwork
  in `public/images/island-pokemon/`. Regenerate with
  `node scripts/download-island-artwork.mjs` (requires network access).
- Selection frames and highlights the Pokémon and links to its existing Pokédex page.
- Reset restores the overview; Orbit toggles automatic rotation.
- Expand opens a larger view; Escape closes it and focus returns to the opener.
- Reduced motion disables initial automatic rotation and camera transitions.
- The Three.js module and GLB load only near the viewport. Rendering pauses offscreen
  and in hidden tabs, with a capped pixel ratio and approximately 30 fps ceiling.
- Unmount disposes GPU resources and event listeners. Load/WebGL errors show the
  rendered poster, retry control, and a Pokédex link.

Implementation uses Three.js [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
and [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).
