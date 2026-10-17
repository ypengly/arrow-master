# Arrow Master

A 2D archery action game built with **TypeScript (strict) + Phaser 3 + Vite**.
Aim, charge, shoot, earn coins, upgrade, unlock levels and defeat bosses.

## Run

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build
```

No external assets are needed: all graphics are generated procedurally at startup and all audio is synthesized with WebAudio, so it runs fully offline after `npm install`.

## Controls

| Action | Desktop | Touch |
|---|---|---|
| Aim | Move mouse | Touch + drag |
| Charge / shoot | Hold, then release | Hold, then release |
| Pause | `ESC` | Pause button |
| Restart | `R` | Pause menu |
| Switch arrow | `1`-`8` or HUD buttons | HUD buttons |
| Strafe | `A` / `D` / arrows | - |
| Abilities (Armory) | `Q` Focus, `E` Mend | HUD buttons |

On phones, rotate to landscape. Dev-only debug keys (`npm run dev` only): `F1` overlay + hitboxes, `N` next level, `W` win, `B` spawn boss, `P` pause.

## Project layout

```
src/
  config/    game constants, weapons/upgrades, enemy loader, LevelManager (validation)
  data/      levels/level001..100.json, enemies/*.json, GameData.ts (achievements, daily challenges)
  entities/  Archer, Arrow, Enemy, Boss, Target, Projectile, Prop
  systems/   Aim, ArrowPhysics, Collision, Enemy, Wave, Combo, Score, Upgrade, PowerUp,
             Particle, Background, Audio, Save, Input, Achievement, Services
  scenes/    Boot, Preload, MainMenu, LevelSelect, Game, Pause, LevelComplete, GameOver,
             Upgrade, Armory, Settings
  ui/        Button, HUD, HealthBar, ProgressBar, UpgradeCard, LevelCard, Dialog
  utils/     math, physics, random, device, TextureFactory (procedural art)
tools/generate_data.py   regenerates the 100 levels and enemy JSON
```

## Data-driven content

* **New level**: add `src/data/levels/level101.json` (same shape as the others). It is validated and picked up automatically.
* **New enemy**: add an entry to `src/data/enemies/enemies.json` (stats, behavior, colors, accessory) and reference its key from a level. A texture is generated for it automatically.
* **New boss**: add to `bosses.json` with `abilities` from `spread | rain | summon | charge`.
* Invalid levels or unknown enemy types are skipped with a console warning instead of crashing.

## Game modes
Campaign (100 levels, boss every 10th), Endless, Time Attack, Precision (limited arrows), Boss Rush. Modes are launched from the Level Select screen.

## Optional real assets
Put files in `public/assets/...` and list them in `ASSET_MANIFEST` (`src/config/AssetConfig.ts`). Anything that is missing falls back to the built-in procedural art.
