# Island loading implementation plan

Goal: let visitors explore all 34 Pokémon immediately, with smaller optional 3D downloads and a cancellable, truthful loading flow.

Approved design: clickable preview first on mobile; separate mobile/desktop assets; preserve the original GLB; download/preparation/ready states; cancellation; versioned caching; lower mobile rendering cost.

- [x] Generate content-hashed mobile and desktop GLBs with glTF Transform. Keep Pokémon IDs, geometry bounds and colors; verify mobile <4 MB and <400,000 triangles.
- [x] Generate preview coordinates from the source camera and retain all 34 Pokémon in the picker before WebGL loads.
- [x] Add streamed, abortable downloads with real byte progress and immutable asset URLs; test cancellation, incomplete responses and HTTP failures.
- [x] Integrate loading phases, GPU preparation, mobile pixel budget, preview selection, retry and optional expansion without blocking page browsing.
- [x] Validate assets and interactions in desktop/mobile browsers, compare original and optimized geometry visually, measure constrained-network downloads, and run tests/lint/build.

Result: mobile 2.46 MB / 366,238 triangles, desktop 4.12 MB / 774,153 triangles. All 34 Pokémon preserved, original unchanged. 80 tests and 15 production-browser checks passed; build succeeded, lint has only the six existing Fast Refresh warnings. Under 5 Mbps / 80 ms simulated networking with the runtime preloaded, original model readiness was 26.44 s and mobile readiness was 4.47 s. See `docs/island-explorer.md` for conditions and caching/deployment limits.

Files: asset pipeline in `scripts/build-island-profiles.mjs`; generated manifests in `src/data`; lifecycle in `islandScene.ts`; UI in `IslandExplorer.tsx` / `island.css`; transport in `src/utils/islandDownload.ts`; deployment cache headers in `vercel.json`; asset/transport/browser regression checks.
