# Legendary Island

The home page places the interactive island immediately below the existing hero,
before feature cards. `/home` redirects to the canonical home route `/`.

The source is `pokemon_island_regirock_redesigned.blend`. It is never modified by
the export process. The original `public/models/pokemon-island.glb` is retained
for reference. Production uses content-hashed profiles from `src/data/islandAssets.ts`:

| Profile | Download bytes | Triangles |
| --- | ---: | ---: |
| Light — mobile / touch / constrained connection | 7,282,676 | 1,574,199 |
| Standard — desktop default, also selectable on mobile | 9,153,144 | 2,080,502 |
| Original | 15,364,064 | 2,080,502 |

All profiles preserve 34 individually selectable Pokémon and authored material colors.
The water texture is embedded WebP; other colors are portable PBR base colors.
Blender-only procedural ambient occlusion is approximated by the web lighting.

## Rebuild assets

From the repository root, using Blender 5.2 and installed npm dependencies:

```powershell
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' -b pokemon_island_regirock_redesigned.blend --python scripts/export-island.py
node scripts/optimize-island.mjs
node scripts/build-island-profiles.mjs
& 'C:/Program Files/Blender Foundation/Blender 5.2/blender.exe' -b pokemon_island_regirock_redesigned.blend --python scripts/export-island-preview.py
node --test tests/islandAsset.test.ts
```

The exporter makes shared mesh data independent, caps subdivision/bevel detail,
merges scenery, preserves Pokémon IDs as glTF extras, and renders a poster.
The optimizer reduces geometry, transfers procedural base colors, compresses the
water texture, and moves large intermediate files into ignored `output/island/`.
No external CDN or API is required to load the island.

The higher-detail profiles replace the earlier 2.46 MB / 4.12 MB variants as of
2026-10-28. Light uses a 0.55 target ratio and a strict 0.0002 error budget,
retaining about 76% of the original triangles. Standard skips simplification
entirely and preserves all original triangles; deduplication, vertex welding and
Meshopt packaging reduce its download to about 9.15 MB without further decimation.
Both use quantization, so neither is claimed to be bit-identical to the source.
The builder keeps textured water topology intact and uses 16-bit position
precision to avoid thin surface artifacts. Filenames contain their SHA-256 prefix. Remove superseded
profile files after generating replacements; retain the original GLB.
The preview exporter projects Pokémon centers using the source camera at the
poster's 1400 × 850 resolution. Neither script saves the Blender source.

## Controls and lifecycle

- Drag to orbit; wheel/pinch or plus/minus buttons to zoom.
- Click a poster marker or a visible 3D Pokémon, or open the illustrated picker to
  choose any of the 34. Preview selection and the picker need no model download,
  and remain usable during loading, after cancellation, and if WebGL fails.
  Search by name or Pokédex number; use Tab or arrow keys to browse, Enter to
  select, and Escape to close. Selection returns focus to the picker trigger.
- The picker, toolbar selection, and discovery card use local 160px WebP artwork
  in `public/images/island-pokemon/`. Regenerate with
  `node scripts/download-island-artwork.mjs` (requires network access).
- Selection frames and highlights the Pokémon and links to its existing Pokédex page.
- Reset restores the overview; Orbit toggles automatic rotation.
- Expand opens a larger view; Escape closes it and focus returns to the opener.
- Reduced motion disables initial automatic rotation and camera transitions.
- Desktop standard loads near the viewport. Mobile/touch, data-saving and 2G
  connections use the lightweight profile after an explicit Enter 3D action.
  Device conditions are checked again before automatic activation. Either detail
  profile can be chosen explicitly; the original is never downloaded automatically.
- Download displays real byte progress, then a separate preparation state. Ready
  follows decoding, shader compilation and the initial render. The download has
  a 120-second timeout for the larger, higher-detail downloads. Cancel aborts the network stream and disposes the scene;
  retry creates a fresh scene. Loading never forces fullscreen.
- On mobile, Open 3D expands the prepared scene; returning inline pauses its
  render loop. Use preview releases GPU resources completely. Rendering also
  pauses offscreen and in hidden tabs. DPR is capped at 2 on both mobile and
  desktop, with approximately 30 fps maximum. Antialiasing is enabled on both.
  Higher-density phone screens render at twice the CSS canvas dimensions rather
  than the old 1× mobile resolution. These settings prioritize visual detail;
  performance still depends on the user's device.
- Unmount cancels pending downloads and disposes resources and event listeners.
  Load/WebGL errors preserve the clickable poster and picker, with a retry control.

## Caching and verification

Versioned profiles use `cache: 'force-cache'`. `vercel.json` supplies one-year
immutable headers only for versioned profile filenames; other hosts should
provide equivalent headers. The original and fixed-name poster are not marked
immutable. Changed model bytes produce a new URL. No deployment was performed.

Local Chrome measurements for the current profiles, 5 Mbps downstream / 80 ms
latency, 390 × 640 phone viewport, device DPR 3 / render DPR 2, cold model URLs
and the Three.js runtime preloaded (desktop GPU emulation, not a real-phone benchmark):

| Profile | Model download | Preparation / first render | Model readiness |
| --- | ---: | ---: | ---: |
| Light | 12.12 s | 0.56 s | 12.68 s |
| Standard | 15.34 s | 0.59 s | 15.93 s |

These higher-detail profiles intentionally trade the previous small downloads
for more geometry and sharper rendering. Timings exclude other page/runtime
resources and do not guarantee live-host performance. Caching still depends on
the host's response headers; verify immutable-cache headers and reuse on the
deployed host after publishing.

Validation covers 320–667px touch layouts, real network cancellation, failed-load
retry, preview entries for all 34 Pokémon, optional fullscreen, mobile DPR,
desktop auto-load, desktop-to-mobile resizing, and focus retention when switching
to 3D. Original, mobile and desktop overview renders and Mew, Mewtwo and Arceus
close-ups were compared. Asset budgets, palette/IDs, stream cancellation/failures
and device policy are covered by the `tests/island*.test.ts` tests.

Implementation uses Three.js [GLTFLoader](https://threejs.org/docs/pages/GLTFLoader.html)
and [OrbitControls](https://threejs.org/docs/pages/OrbitControls.html).
