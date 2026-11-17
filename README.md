[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/c/best-game-01)
[![rank](https://make.fun/badge/best-game-01/abduljunior425/best-game-02/rank.svg)](https://make.fun/c/best-game-01)
[![reward](https://make.fun/badge/best-game-01/abduljunior425/best-game-02/reward.svg)](https://make.fun/c/best-game-01)

# Wispwood Lantern

A complete arena-survival game for make.fun's **best-game-01** bounty: guide a
lantern moth through a dark wood, gather the glowing spores, dash through the
shadow wisps that hunt you, and survive six waves until dawn breaks. It runs
offline in a desktop browser from its own static files — no build step, no
network request, no library.

## How to play

- **Fly** with WASD or the arrow keys, or hold the mouse button and steer
  toward the pointer.
- **Gather spores** for points. Spores gathered close together build a combo,
  up to ×4 — a hit or a slow stretch resets it.
- **Dash** with Space: a burst of speed that banishes any wisp it passes
  through (+50 points) and leaves you briefly untouchable. It recharges in
  about a second and a third.
- **Survive the wisps**: they drift at a distance and chase when you come
  close. A touch costs a heart — three hearts, then the light goes out.
- **Clear a wave** by gathering its spore quota, for a bonus that grows each
  wave. Clear all six waves and dawn breaks: you win.
- **P** pauses, **M** mutes the sound, **R** restarts after a win or a loss.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. Or open `game/index.html` directly from disk.

## Layout

- `main.ts` — the entry program: copies `game/` and `screenshots/` to
  `/output` and writes `dossier.json` with the vendored make.fun library.
- `game/index.html` — the page: one canvas and the status line screen readers
  announce.
- `game/src/tuning.js` — every tuning number and colour in one place.
- `game/src/rng.js` — a small seeded random source, so scenes can be replayed.
- `game/src/entities.js` — the rules of moving things: the lantern moth, the
  wisps, the spores and the ember bursts. No drawing.
- `game/src/rules.js` — the score, the combo, the hearts and the waves. No
  drawing, no browser.
- `game/src/paint.js` — drawing only: the wood, the creatures, the HUD and
  the title, win, loss and pause panels.
- `game/src/keys.js` — keyboard and pointer input, translated to field
  coordinates.
- `game/src/tones.js` — synthesized sound effects (Web Audio, no files).
- `game/src/stills.js` — the screenshot scenes: an autopilot plays the real
  rules so each shot is a frame a real game produces
  (`?shot=start|play|clear|end&seed=N`).
- `game/src/boot.js` — boot and the fixed-step loop, the screens, the wiring.
- `vendor/makefun-game.ts` — the kit's dossier library, copied unchanged.
- `shots.json` — the four screenshots and the scene each one shows.
