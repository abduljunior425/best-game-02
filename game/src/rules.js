// Rules: the score, the combo, the hearts and the waves. Pure state — no
// drawing and no browser here, so a scene or a test can drive it directly.

import { FIELD, HEARTS, SPORE, WAVES, WISP } from './tuning.js';
import { makeLantern, makeSpore, makeWisp } from './entities.js';
import { makeRng } from './rng.js';

export function freshGame(seed) {
  const rng = makeRng(seed);
  const game = {
    seed,
    rng,
    moth: makeLantern(),
    spores: [],
    wisps: [],
    bursts: [],
    score: 0,
    combo: 1,
    comboLeft: 0,
    bestCombo: 1,
    hearts: HEARTS.start,
    wave: 1,
    gathered: 0,
    quota: waveQuota(1),
    banished: 0,
    collected: 0,
    time: 0,
    screen: 'title',
    flash: 0,
    notice: '',
    noticeLeft: 0,
  };
  refillSpores(game, 9);
  spawnWaveWisps(game);
  return game;
}

export function waveQuota(wave) {
  return WAVES.quotaBase + (wave - 1) * WAVES.quotaPerWave;
}

export function waveWispCount(wave) {
  return Math.min(WISP.maxOnField, WAVES.wispsBase + (wave - 1) * WAVES.wispsPerWave);
}

export function refillSpores(game, count) {
  for (let i = 0; i < count; i += 1) {
    game.spores.push(makeSpore(game.rng));
  }
}

export function spawnWaveWisps(game) {
  const want = waveWispCount(game.wave);
  while (game.wisps.length < want) {
    game.wisps.push(makeWisp(game.rng, game.wave));
  }
}

export function collectSpore(game, spore) {
  game.collected += 1;
  game.gathered += 1;
  if (game.comboLeft > 0) {
    game.combo = Math.min(SPORE.comboCap, game.combo + SPORE.comboStep);
  } else {
    game.combo = 1;
  }
  game.comboLeft = SPORE.comboWindow;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  const gained = Math.round(SPORE.basePoints * game.combo);
  game.score += gained;
  return gained;
}

export function banishWisp(game, wisp) {
  game.banished += 1;
  const gained = WISP.banishPoints;
  game.score += gained;
  return gained;
}

export function hurtLantern(game) {
  if (game.moth.invulnLeft > 0) return false;
  game.hearts -= 1;
  game.combo = 1;
  game.comboLeft = 0;
  game.moth.invulnLeft = 1.4;
  game.flash = 0.35;
  if (game.hearts <= 0) {
    game.screen = 'over';
    return true;
  }
  return false;
}

export function waveDone(game) {
  return game.gathered >= game.quota;
}

export function clearWave(game) {
  const bonus = WAVES.clearBonus + (game.wave - 1) * WAVES.clearBonusPerWave;
  game.score += bonus;
  if (game.wave >= WAVES.total) {
    game.screen = 'won';
    return { bonus, won: true };
  }
  game.wave += 1;
  game.gathered = 0;
  game.quota = waveQuota(game.wave);
  game.notice = 'Wave ' + game.wave + ' — the dark thickens';
  game.noticeLeft = 2.4;
  refillSpores(game, 4);
  spawnWaveWisps(game);
  return { bonus, won: false };
}

export function tickCombo(game, dt) {
  if (game.comboLeft > 0) {
    game.comboLeft -= dt;
    if (game.comboLeft <= 0) {
      game.combo = 1;
    }
  }
  if (game.flash > 0) game.flash -= dt;
  if (game.noticeLeft > 0) game.noticeLeft -= dt;
}

export function scoreLine(game) {
  return 'Score ' + game.score + '  ·  Wave ' + game.wave + '/' + WAVES.total +
    '  ·  Spores ' + game.gathered + '/' + game.quota;
}
