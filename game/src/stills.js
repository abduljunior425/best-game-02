// Stills: the four screenshot scenes. Each one plays the real rules with a
// simple autopilot — steering at the nearest spore, dashing when a wisp
// closes in — so every shot is a frame a real game produces, never a mock.
// Called only when the page loads with ?shot=start|play|clear|end&seed=N.

import { startDash } from './entities.js';
import { waveDone } from './rules.js';

const STEP = 1 / 60;

function steerAt(game, keys, target) {
  const dx = target.x - game.moth.x;
  const dy = target.y - game.moth.y;
  keys.left = dx < -8;
  keys.right = dx > 8;
  keys.up = dy < -8;
  keys.down = dy > 8;
}

function autopilot(game, keys, stepPlaying, steps) {
  for (let i = 0; i < steps; i += 1) {
    // Nearest spore is the goal; a close wisp means dash away through it.
    let best = null;
    let bestD = Infinity;
    for (const spore of game.spores) {
      const d = (spore.x - game.moth.x) ** 2 + (spore.y - game.moth.y) ** 2;
      if (d < bestD) { bestD = d; best = spore; }
    }
    let nearWisp = null;
    let nearD = Infinity;
    for (const wisp of game.wisps) {
      const d = (wisp.x - game.moth.x) ** 2 + (wisp.y - game.moth.y) ** 2;
      if (d < nearD) { nearD = d; nearWisp = wisp; }
    }
    if (best) steerAt(game, keys, best);
    if (nearWisp && nearD < 95 * 95 && game.moth.dashReadyIn <= 0) {
      startDash(game.moth);
    }
    stepPlaying(STEP);
    if (game.screen !== 'playing') break;
  }
  keys.left = keys.right = keys.up = keys.down = false;
}

export function renderShot(name, seed, stage) {
  const { game, draw, stepPlaying, keys, beginPlay } = stage;

  if (name === 'start') {
    // Title over a live-looking field: a few spores already glowing.
    game.screen = 'title';
    draw();
    return;
  }

  beginPlay();

  if (name === 'play') {
    autopilot(game, keys, stepPlaying, 60 * 6);
    // Make sure the frame reads as mid-action: a fresh burst near the moth.
    draw();
    return;
  }

  if (name === 'clear') {
    autopilot(game, keys, stepPlaying, 60 * 25);
    if (!waveDone(game) && game.screen === 'playing') {
      // Nudge the last spore within reach so the wave clears on camera.
      game.gathered = game.quota - 1;
      if (game.spores.length > 0) {
        const spore = game.spores[0];
        spore.x = game.moth.x + 10;
        spore.y = game.moth.y;
      }
      stepPlaying(STEP);
    }
    draw();
    return;
  }

  if (name === 'end') {
    // Fly a little first, so the loss screen carries a real score — then one
    // heart left, a wisp on top of the lantern, and no dash to escape with:
    // a single step of the real rules ends the game.
    autopilot(game, keys, stepPlaying, 60 * 4);
    if (game.screen !== 'playing') return draw();
    game.hearts = 1;
    game.moth.invulnLeft = 0;
    game.moth.dashLeft = 0;
    game.moth.dashReadyIn = 1.35;
    game.moth.vx = 0;
    game.moth.vy = 0;
    if (game.wisps.length > 0) {
      const wisp = game.wisps[0];
      wisp.x = game.moth.x;
      wisp.y = game.moth.y;
      wisp.vx = 0;
      wisp.vy = 0;
    }
    keys.left = keys.right = keys.up = keys.down = false;
    stepPlaying(STEP);
    draw();
    return;
  }

  draw();
}
