# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

Open `index.html` directly in a browser — no build step, no server required. The game is two files: `index.html` (canvas shell) and `game.js` (all logic).

## Architecture

Everything lives in `game.js` (~1100 lines), organized into clearly-commented sections in this order:

1. **Canvas / resize** — full-viewport canvas, re-sized on window resize
2. **Input** — `keys` object (keyboard) and `mouse` object (position + buttons); both are globals read each frame
3. **Audio** — Web Audio API, lazily initialized on first click; `playSound(type)` dispatches from a config table of oscillator parameters
4. **Pixel sprites** — sprites are 2D arrays of color indices (`0` = transparent); `drawSprite` and `drawSpriteFlash` render them scaled by `SCALE = 3`. All sprite arrays and palettes are named constants (e.g. `PLAYER_A`, `G_PAL`). The `SPRITES` lookup object maps entity type strings to `{ frames, palette, radius }`.
5. **Level data** — `LEVELS` array defines each level's `name`, `bg` color, and `waves` (array of arrays of `{ type, count }` groups). `SCORE_VALUES` maps enemy types to point values.
6. **Game state globals** — `STATE` string (`'MENU'` | `'PLAYING'` | `'LEVEL_COMPLETE'` | `'GAME_OVER'`), plus entity arrays (`enemies`, `bullets`, `particles`) and wave-tracking counters.
7. **Factories** — `makePlayer()`, `makeEnemy(type, x, y)`, `makeBullet(...)`, `makeParticle(...)` return plain objects. No classes.
8. **Spawning / particle bursts** — `spawnWave(waveIndex)` populates `enemies`; `burstDeath`, `burstHit`, `muzzleFlash` push into `particles`.
9. **State init functions** — `enterMenu()`, `enterPlaying(lvl)`, `enterLevelComplete()`, `enterGameOver()` reset globals and set `STATE`.
10. **Update** — `update(dt)` dispatches to `updatePlaying(dt)` (which calls `updatePlayer`, `updateEnemies`, `updateBullets`, `updateParticles`, `checkCollisions`). Wave progression logic lives at the bottom of `updatePlaying`.
11. **Render** — `render()` dispatches to one of four `render*()` functions based on `STATE`. Screen shake is applied via `ctx.translate` inside a `ctx.save/restore` at the top of `render()`.
12. **Main loop** — `requestAnimationFrame` loop with delta-time capped at 50ms.

## Key conventions

**Entity lifecycle:** Entities are killed by setting `hp = 0` or `life = 0`. Cleanup happens at the end of `checkCollisions()` via `.filter()` on all three arrays — never splice mid-loop.

**Sprite rotation:** All sprites face right at angle 0. The render calls pass `angle - Math.PI / 2` to compensate for canvas's coordinate system (0 = right, but sprite "up" needs to become canvas "right").

**Adding a new enemy type:** Add sprite arrays + palette constant → add entry to `SPRITES` → add a config row in `makeEnemy`'s `cfg` object → add AI branch in `updateEnemies` → add death burst config in `burstDeath` → add `SCORE_VALUES` entry → reference it in `LEVELS` waves.

**Adding a level:** Append an object to `LEVELS` with `name`, `bg` (hex color), and `waves` (array of wave definitions). The wave/level progression logic reads `LEVELS.length` dynamically.

**Audio:** All sounds are synthesized — no files. To add a sound, add a key to the `cfg` object inside `playSound` with `{ wave, f0, f1, g0, dur }` and call `playSound('yourKey')`.

## Git workflow

After completing any changes: commit with a descriptive message and push to `origin main`.

```
git add <files>
git commit -m "..."
git push
```

Remote: `https://github.com/alexpadilla321-hub/retro-shooter`
