// Boot: wires the canvas, the loop and the screens together. A fixed-step
// update keeps the rules identical at any frame rate; drawing follows.

import { FIELD, PALETTE } from './tuning.js';
import { makeRng, range } from './rng.js';
import {
  banishWisp,
  clearWave,
  collectSpore,
  freshGame,
  hurtLantern,
  refillSpores,
  scoreLine,
  tickCombo,
  waveDone,
} from './rules.js';
import {
  makeBurst,
  makeWisp,
  sporeTouchGap,
  startDash,
  stepBursts,
  stepLantern,
  stepSpores,
  stepWisps,
  touching,
  wispTouchGap,
} from './entities.js';
import {
  paintBursts,
  paintField,
  paintHud,
  paintLantern,
  paintOver,
  paintPaused,
  paintSpores,
  paintTitle,
  paintWisps,
  paintWon,
} from './paint.js';
import { attachKeys, consumePress, makeKeys } from './keys.js';
import { makeTones, tones } from './tones.js';

const canvas = document.getElementById('stage');
const ctx = canvas.getContext('2d');
const spoken = document.getElementById('spoken');

const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number(params.get('seed') || '7');

let game = freshGame(seed);
let keys = makeKeys();
let sound = makeTones();
let paused = false;
let fireflies = [];
let last = performance.now();
let spokenAt = 0;

function seedFireflies(rng) {
  fireflies = [];
  for (let i = 0; i < 26; i += 1) {
    fireflies.push({
      x: range(rng, 20, FIELD.width - 20),
      y: range(rng, 20, FIELD.height - 20),
      phase: range(rng, 0, Math.PI * 2),
      drift: range(rng, 0.2, 0.9),
    });
  }
}

function resize() {
  const scale = Math.min(window.innerWidth / FIELD.width, window.innerHeight / FIELD.height);
  canvas.width = Math.round(FIELD.width * scale * window.devicePixelRatio);
  canvas.height = Math.round(FIELD.height * scale * window.devicePixelRatio);
  canvas.style.width = Math.round(FIELD.width * scale) + 'px';
  canvas.style.height = Math.round(FIELD.height * scale) + 'px';
}

function say(text) {
  const now = performance.now();
  if (now - spokenAt < 900) return;
  spokenAt = now;
  spoken.textContent = text;
}

function restart() {
  game = freshGame((Math.random() * 1e9) | 0);
  seedFireflies(makeRng(game.seed));
  paused = false;
  say('A new night in the wispwood. Gather the spores.');
}

function beginPlay() {
  if (game.screen === 'title') {
    game.screen = 'playing';
    say('Fly with WASD or the mouse. Space dashes.');
  }
}

function tap() {
  if (game.screen === 'title') beginPlay();
  else if (game.screen === 'won' || game.screen === 'over') restart();
  else if (paused) paused = false;
}

attachKeys(canvas, keys, tap);
window.addEventListener('resize', resize);
resize();
seedFireflies(makeRng(seed));

// Any page error becomes visible in the title, so a headless check can see it.
window.addEventListener('error', (event) => {
  document.title = 'PAGEERROR: ' + event.message;
});

function handlePresses() {
  if (consumePress(keys, 'Space')) {
    if (game.screen === 'title') beginPlay();
    else if (game.screen === 'playing' && !paused) {
      if (startDash(game.moth)) {
        tones.dash(sound);
        game.bursts.push(...makeBurst(game.moth.x, game.moth.y, PALETTE.ember, 10, 160));
      }
    }
  }
  if (consumePress(keys, 'KeyR')) {
    if (game.screen === 'won' || game.screen === 'over') restart();
  }
  if (consumePress(keys, 'KeyP')) {
    if (game.screen === 'playing') paused = !paused;
  }
  if (consumePress(keys, 'KeyM')) {
    sound.muted = !sound.muted;
    say(sound.muted ? 'Sound off.' : 'Sound on.');
  }
  if (consumePress(keys, 'Enter')) {
    if (game.screen === 'title') beginPlay();
    else if (game.screen === 'won' || game.screen === 'over') restart();
  }
}

function stepPlaying(dt) {
  game.time += dt;
  tickCombo(game, dt);
  stepLantern(game.moth, keys, dt);
  stepWisps(game.wisps, game.moth, dt, game.time);
  stepSpores(game.spores, dt);
  game.bursts = stepBursts(game.bursts, dt);
  for (const fly of fireflies) {
    fly.x += Math.sin(game.time * fly.drift + fly.phase) * 8 * dt;
    fly.y += Math.cos(game.time * fly.drift * 0.8 + fly.phase) * 6 * dt;
  }

  // Spore pickups.
  for (let i = game.spores.length - 1; i >= 0; i -= 1) {
    const spore = game.spores[i];
    if (touching(game.moth, spore, sporeTouchGap())) {
      game.spores.splice(i, 1);
      const gained = collectSpore(game, spore);
      tones.pickup(sound, game.combo);
      game.bursts.push(...makeBurst(spore.x, spore.y, PALETTE.sporeGlow, 8, 120));
      if (game.gathered % 3 === 0) say(scoreLine(game));
      if (waveDone(game)) {
        const result = clearWave(game);
        if (result.won) {
          tones.win(sound);
          say('Dawn breaks. You win with ' + game.score + ' points.');
        } else {
          tones.clear(sound);
          game.bursts.push(...makeBurst(game.moth.x, game.moth.y, PALETTE.dawn, 24, 220));
          say('Wave cleared. Bonus ' + result.bonus + ' points.');
        }
        refillSpores(game, 2);
        break;
      }
    }
  }

  // Wisps: a dash banishes, a touch hurts.
  for (let i = game.wisps.length - 1; i >= 0; i -= 1) {
    const wisp = game.wisps[i];
    if (!touching(game.moth, wisp, wispTouchGap(wisp))) continue;
    if (game.moth.dashLeft > 0) {
      game.wisps.splice(i, 1);
      const gained = banishWisp(game, wisp);
      tones.banish(sound);
      game.bursts.push(...makeBurst(wisp.x, wisp.y, '#b388ff', 18, 200));
      say('Wisp banished, +' + gained + ' points.');
    } else if (hurtLantern(game)) {
      tones.lose(sound);
      game.bursts.push(...makeBurst(game.moth.x, game.moth.y, PALETTE.danger, 22, 240));
      say('The light goes out. Final score ' + game.score + '.');
    } else {
      tones.hurt(sound);
      game.bursts.push(...makeBurst(game.moth.x, game.moth.y, PALETTE.danger, 12, 180));
      say('Hit! ' + game.hearts + ' hearts left.');
    }
  }

  // Keep the field stocked: a few spores always drift in, and a wisp
  // always remains to keep the pressure on.
  if (game.spores.length < 5) refillSpores(game, 3);
  if (game.wisps.length < 2 && game.screen === 'playing') {
    game.wisps.push(makeWisp(game.rng, game.wave));
  }
}

function draw() {
  const scale = canvas.width / FIELD.width;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  paintField(ctx, game.time, fireflies);
  paintSpores(ctx, game.spores);
  paintWisps(ctx, game.wisps, game.time);
  paintBursts(ctx, game.bursts);
  paintLantern(ctx, game.moth, game.time);
  if (game.screen === 'playing' || game.screen === 'won' || game.screen === 'over') {
    paintHud(ctx, game);
  }
  if (game.screen === 'title') paintTitle(ctx);
  else if (game.screen === 'won') paintWon(ctx, game);
  else if (game.screen === 'over') paintOver(ctx, game);
  else if (paused) paintPaused(ctx);
}

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  handlePresses();
  if (!shotName && game.screen === 'playing' && !paused) stepPlaying(dt);
  if (!shotName) draw();
  if (!shotName) requestAnimationFrame(frame);
}

// Screenshot scenes live in stills.js; boot only hands them the stage.
if (shotName) {
  import('./stills.js').then((stills) => stills.renderShot(shotName, seed, {
    canvas,
    ctx,
    game,
    fireflies,
    draw,
    stepPlaying,
    keys,
    restart,
    beginPlay,
  }));
} else {
  requestAnimationFrame(frame);
}
