# Super Pokémon

## Integration and design

The existing site uses React 19, TypeScript, Vite 8, React Router, and Tailwind. `src/game/battle.ts` implements turn-based battles; the project did not have a reusable platform-game physics engine. There are no account, reward, or leaderboard APIs.

Keep the battle game on `/games`, add a Super Pokémon entry, and lazy-load `/games/super-pokemon`. The game uses a standalone Canvas 2D renderer and framework-independent TypeScript simulation without adding runtime dependencies. React handles the English-language menus, HUD, and multi-touch controls. Physics runs at a fixed 120 Hz. Simulation state and input stay outside React's per-frame rendering cycle.

Pikachu, Charmander, and Mewtwo share the same movement settings and have distinct Electric, Fire, and Psychic attacks. The three levels are Pallet Town Meadows, Viridian Forest, and Mt. Moon Cave. Enemies can be stomped or hit; the cave guardian needs three hits. Elemental energy strengthens attacks for 12 seconds. Shift/Ctrl share one action: press once to fire and hold to sprint; key repeat does not fire additional attacks.

Versioned local storage holds level unlocks, best scores, character choice, and sound preference. Corrupt or unavailable storage falls back safely. Pausing, losing focus, or hiding the tab freezes simulation time; returning to the game requires manual resume. Leaving the route disposes the animation frame, listeners, inputs, and audio context.

## Implementation plan

- [x] 1. Route, entry point, welcome and character/level selection, pause/results, and safe save data.
- [x] 2. Fixed-step movement, variable jump height, collisions, one-way platforms, and scrolling camera.
- [x] 3. A complete first level with a tutorial and finish.
- [x] 4. Enemies, attacks, collectibles, health, checkpoints, and respawning.
- [x] 5. Forest moving platforms and hidden rewards; cave hazards and guardian.
- [x] 6. Local pixel animations, parallax backgrounds, synthesized sound, and multi-touch controls.
- [x] 7. Automated checks, production build, lint, browser playthroughs, and screenshots.

## Assets

### Menu visual update · September 29, 2026

The welcome screen uses the actual meadow scenery with large partner sprites, a yellow play button, and locally hosted Pixelify Sans Bold (`public/fonts/pixelify`, SIL Open Font License). The font remains available when external font requests fail. Menus hide the inactive gameplay HUD and scenery omits collectibles and enemies. Gameplay removes the outer focus outline, in-world instruction signs, attack/boost text, notification labels, and the repeated status footer. Health, score, collectibles, the timer, and game controls remain visible; detailed instructions are available through Full controls and the pause menu.

Character selection uses elemental colors and a visible selected state. Journey selection shows static Canvas previews of each real level and names the preceding journey required to unlock it. Decorative journey numbers, step numbers, and the header's numbered range are removed. On phones, selection cards use horizontal rows and menus grow with their content. Reduced-motion preferences disable the partner entrance animation.

Visual and interaction evidence is recorded by `../.qa/super-ui-check.mjs`: desktop, phone, tablet, landscape, small phone, dark theme, and an external-font-blocked scenario. The game simulation tests pass (15/15). The project build and lint pass; the full test suite has an existing failure in `tests/islandTheme.test.ts`, whose expected island CSS variables are absent from the committed island stylesheet.

`public/super-pokemon/sprites.png` is a locally generated placeholder atlas. Backgrounds, platforms, collectibles, and effects are drawn in Canvas. The Web Audio API synthesizes short sound effects. Gameplay does not rely on externally hosted image links.

Assets available for future replacement: refined frame-by-frame art for the three partners; a Grass-type patrol enemy; a ranged Ghost-type enemy; the cave guardian; environment tiles and parallax layers for all three levels; Poké Balls, berries, elemental energy; and original music and sound effects. Preserve the atlas layout, or adjust the frame mapping in `art.ts`. Collision boxes are independent of sprite dimensions.

## Verification results

Environment: Windows, Chrome 153, and Playwright Core 1.58.2. No Browser-plugin browsers were available, so Playwright used the locally installed Chrome. Test tooling lives outside the project in the workspace `.qa` folder; no project dependencies were added.

Desktop viewports: 1440×1050 and 1366×900. Emulated phone viewports: 390×844 and 844×390, including actual Chrome DevTools multi-touch events. Real phones and Safari were not tested. Browser playthroughs used keyboard and touch input to navigate the levels; assertions only read simulation state.

| Check | Evidence |
| --- | --- |
| Entry → character → level → game → results | Chrome walkthrough of the complete flow; the existing battle entry remains available. |
| WASD, arrow keys, and short/long jumps | Short jump reached y≈368; long jump reached y≈292. Both direction-key sets moved the player. |
| Sprint, attack, and repeat prevention | Holding Shift and Ctrl together fired once. Holding mobile sprint for 0.67 s moved about 207 px and fired once. The separate attack button fired independently. |
| Ground, walls, ceiling, one-way platforms, stomps, damage, and checkpoints | Fifteen simulation tests cover collision, platform drop-through, moving-platform carry, stomp bounce, invulnerability, and checkpoint respawn. Browser playthroughs activated forest/cave checkpoints and confirmed side-contact damage. |
| All three levels are beatable | Completed each level from the start using the arrow keys, jump, and Ctrl. Example scores: 2625 / 3169 / 3516. Checkpoints activated in levels two and three. |
| Failure, respawn, and retry | Deliberately fell into pits in Chrome: health changed 3→2→1→0, respawned at the start, showed failure results, and retry restored three hearts. |
| Pause, mute, focus loss, and resume | Verified P, M, on-screen buttons, blur, search-input focus loss, manual resume, and frozen simulation/cooldown timers. |
| Hidden browser tab | In headless Chrome, changing tabs reported `hidden=false`. Simulating a hidden `visibilitychange` event confirmed automatic pause. A real tab-visibility change still needs manual verification. |
| Multi-touch movement and jump | Held two touch points simultaneously: x90→136 and y412→307. Releasing both returned the character to the ground and cleared input. |
| Phone orientation and fullscreen | Canvas keeps a 16:9 ratio with no horizontal overflow. Fullscreen shows the playfield, HUD, and touch controls together. The pause menu exposes the complete controls guide. |
| Refresh and route re-entry | Restored all three unlocks, best scores, Mewtwo selection, and muted sound. Leaving removed the canvas; re-entering created a single canvas. |
| Load failure and corrupt save | Blocked the local atlas to verify the error screen, then restored the request and retried successfully. Invalid JSON recovered to the default Pikachu save. |
| Typing in an input | Typed `wasdpm` in the site search box. The game paused when focus left; typed characters did not trigger shortcuts. |
| Existing routes | Home, Pokédex, Movies, Compare, Favorites, and Games mounted without a Vite error overlay or uncaught page errors. |
| Automated checks | `npm.cmd test`: 71/71; `npm.cmd run build`: passed; `npm.cmd run lint`: no errors, with six existing Fast Refresh warnings. |

The game module is lazy-loaded: about 38 KB of JavaScript (about 14.5 KB gzipped). The local sprite atlas is 4,765 bytes. The existing 3D island bundle still produces its prior approximately 664 KB chunk-size warning.

Code map: `levels.ts` contains level layouts; `world.ts` contains simulation rules and physics settings; `clock.ts` runs the fixed step; `runtime.ts` manages browser lifecycle; `input.ts` merges input sources; `art.ts` draws pixel art; `audio.ts` synthesizes sound; `save.ts` handles local saves; `SuperPokemonPage.tsx` provides the page flow.

The workspace contained a deleted `tests/encyclopediaTranslations.test.ts` file unrelated to this game; it was left untouched. The count above reflects the 71 tests runnable in the current workspace.
