// Paint: every pixel the game draws — the wood, the lantern moth, the wisps,
// the spores, the embers and the HUD. No rules live here; it only reads state.

import { FIELD, LANTERN, PALETTE, SPORE, WAVES, WISP } from './tuning.js';

function glow(ctx, x, y, radius, colour, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, colour);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

export function paintField(ctx, time, fireflies) {
  ctx.fillStyle = PALETTE.ground;
  ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  // Soft mossy patches, fixed by the clock so they never jump around.
  for (let i = 0; i < 9; i += 1) {
    const px = ((i * 197) % 900) + 30;
    const py = ((i * 311) % 540) + 30;
    glow(ctx, px, py, 90 + (i % 3) * 30, '#12351d', 0.5);
  }
  // Tree silhouettes ringing the clearing.
  ctx.fillStyle = PALETTE.tree;
  for (let i = 0; i < 14; i += 1) {
    const tx = (i / 13) * FIELD.width;
    const sway = Math.sin(time * 0.5 + i) * 4;
    ctx.beginPath();
    ctx.moveTo(tx - 26 + sway, 0);
    ctx.lineTo(tx + sway, -46 - (i % 3) * 12);
    ctx.lineTo(tx + 26 + sway, 0);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(tx - 26 + sway, FIELD.height);
    ctx.lineTo(tx + sway, FIELD.height + 46 + (i % 3) * 12);
    ctx.lineTo(tx + 26 + sway, FIELD.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.strokeStyle = PALETTE.treeLine;
  ctx.lineWidth = 3;
  ctx.strokeRect(1.5, 1.5, FIELD.width - 3, FIELD.height - 3);
  // Ambient fireflies drifting through the dark.
  for (const fly of fireflies) {
    const tw = 0.35 + 0.6 * Math.abs(Math.sin(time * 1.3 + fly.phase));
    glow(ctx, fly.x, fly.y, 10, '#bfe08a', tw * 0.5);
    ctx.fillStyle = '#d9f2a8';
    ctx.beginPath();
    ctx.arc(fly.x, fly.y, 1.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function paintSpores(ctx, spores) {
  for (const spore of spores) {
    const bobY = Math.sin(spore.bob) * 3;
    const pulse = 0.7 + 0.3 * Math.sin(spore.pulse);
    glow(ctx, spore.x, spore.y + bobY, 26 * pulse, PALETTE.sporeGlow, 0.55);
    ctx.fillStyle = PALETTE.sporeCore;
    ctx.beginPath();
    ctx.arc(spore.x, spore.y + bobY, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 233, 163, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(spore.x, spore.y + bobY, 8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function paintWisps(ctx, wisps, time) {
  for (const wisp of wisps) {
    const r = WISP.radius * wisp.size;
    const squash = 1 + 0.12 * Math.sin(time * 2 + wisp.drift);
    glow(ctx, wisp.x, wisp.y, r * 2.4, '#7a4fd0', 0.35);
    ctx.fillStyle = PALETTE.wispBody;
    ctx.beginPath();
    ctx.ellipse(wisp.x, wisp.y, r, r * squash, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.wispEdge;
    ctx.lineWidth = 2;
    ctx.stroke();
    // Two watching eyes, always turned toward the lantern.
    const eyeDx = 5;
    const eyeDy = -3;
    ctx.fillStyle = PALETTE.wispEye;
    ctx.beginPath();
    ctx.arc(wisp.x - eyeDx, wisp.y + eyeDy, 3.2, 0, Math.PI * 2);
    ctx.arc(wisp.x + eyeDx, wisp.y + eyeDy, 3.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#efe2ff';
    ctx.beginPath();
    ctx.arc(wisp.x - eyeDx, wisp.y + eyeDy, 1.3, 0, Math.PI * 2);
    ctx.arc(wisp.x + eyeDx, wisp.y + eyeDy, 1.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function paintBursts(ctx, bursts) {
  for (const bit of bursts) {
    const left = 1 - bit.age / bit.life;
    ctx.globalAlpha = Math.max(0, left);
    ctx.fillStyle = bit.colour;
    ctx.beginPath();
    ctx.arc(bit.x, bit.y, bit.size * left + 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function paintLantern(ctx, moth, time) {
  const blink = moth.invulnLeft > 0 && Math.floor(time * 14) % 2 === 0;
  if (blink) return;
  const speed = Math.sqrt(moth.vx * moth.vx + moth.vy * moth.vy);
  const stretch = 1 + Math.min(0.35, speed / 900);
  glow(ctx, moth.x, moth.y, 74, PALETTE.lanternGlow, moth.dashLeft > 0 ? 0.9 : 0.55);
  ctx.save();
  ctx.translate(moth.x, moth.y);
  ctx.rotate(moth.face);
  ctx.scale(stretch, 1 / stretch);
  // Wings, beating.
  const flap = Math.sin(moth.wingBeat) * 7;
  ctx.fillStyle = PALETTE.lanternWing;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.ellipse(-2, -13 - flap * 0.4, 13, 6, -0.5, 0, Math.PI * 2);
  ctx.ellipse(-2, 13 + flap * 0.4, 13, 6, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  // Body and the bright core.
  ctx.fillStyle = '#8a6a2f';
  ctx.beginPath();
  ctx.ellipse(0, 0, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.lanternCore;
  ctx.beginPath();
  ctx.arc(5, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function paintHud(ctx, game) {
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.font = '700 22px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.hudText;
  ctx.fillText('Score ' + game.score, 16, 12);
  ctx.font = '600 16px system-ui, sans-serif';
  ctx.fillStyle = PALETTE.hudDim;
  ctx.fillText('Wave ' + game.wave + ' / ' + WAVES.total + '   ·   Spores ' + game.gathered + ' / ' + game.quota, 16, 42);
  // Hearts, top right.
  const hx = FIELD.width - 20;
  for (let i = 0; i < 3; i += 1) {
    const cx = hx - i * 34;
    const lit = i < game.hearts;
    ctx.fillStyle = lit ? '#ff8a7a' : 'rgba(255,138,122,0.22)';
    ctx.beginPath();
    ctx.arc(cx - 7, 24, 7, 0, Math.PI * 2);
    ctx.arc(cx + 7, 24, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(cx - 13, 27);
    ctx.lineTo(cx, 40);
    ctx.lineTo(cx + 13, 27);
    ctx.closePath();
    ctx.fill();
  }
  // Dash meter, bottom left.
  const ready = game.moth.dashReadyIn <= 0;
  const frac = ready ? 1 : 1 - game.moth.dashReadyIn / 1.35;
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(16, FIELD.height - 26, 150, 10);
  ctx.fillStyle = ready ? PALETTE.lanternGlow : '#7a8a6a';
  ctx.fillRect(16, FIELD.height - 26, 150 * frac, 10);
  ctx.fillStyle = PALETTE.hudDim;
  ctx.font = '600 13px system-ui, sans-serif';
  ctx.fillText(ready ? 'DASH READY — Space' : 'dash recharging…', 16, FIELD.height - 46);
  // Combo, bottom right.
  if (game.combo > 1) {
    ctx.textAlign = 'right';
    ctx.fillStyle = PALETTE.sporeGlow;
    ctx.font = '700 20px system-ui, sans-serif';
    ctx.fillText('COMBO ×' + game.combo.toFixed(1), FIELD.width - 16, FIELD.height - 48);
    ctx.fillStyle = PALETTE.hudDim;
    ctx.font = '600 13px system-ui, sans-serif';
    ctx.fillText('best ×' + game.bestCombo.toFixed(1), FIELD.width - 16, FIELD.height - 24);
    ctx.textAlign = 'left';
  }
  // Wave notice, centre top.
  if (game.noticeLeft > 0) {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.dawn;
    ctx.font = '700 24px system-ui, sans-serif';
    ctx.globalAlpha = Math.min(1, game.noticeLeft);
    ctx.fillText(game.notice, FIELD.width / 2, 74);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
  // Hurt flash.
  if (game.flash > 0) {
    ctx.fillStyle = 'rgba(255, 60, 40, ' + (game.flash * 0.5).toFixed(3) + ')';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }
}

function paintPanel(ctx, lines) {
  const w = 560;
  const h = 92 + lines.length * 30;
  const x = (FIELD.width - w) / 2;
  const y = (FIELD.height - h) / 2;
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  let cy = y + 22;
  for (const line of lines) {
    ctx.font = line.font;
    ctx.fillStyle = line.colour;
    ctx.fillText(line.text, FIELD.width / 2, cy);
    cy += line.step;
  }
  ctx.textAlign = 'left';
}

export function paintTitle(ctx) {
  paintPanel(ctx, [
    { text: 'WISPWOOD LANTERN', font: '800 40px system-ui, sans-serif', colour: PALETTE.dawn, step: 54 },
    { text: 'Gather the spores. Outrun the dark. Survive until dawn.', font: '600 17px system-ui, sans-serif', colour: PALETTE.hudText, step: 30 },
    { text: 'WASD / arrows or mouse to fly  ·  Space to dash through wisps', font: '500 15px system-ui, sans-serif', colour: PALETTE.hudDim, step: 26 },
    { text: 'Dash banishes wisps (+50)  ·  quick spores build a combo (up to ×4)', font: '500 15px system-ui, sans-serif', colour: PALETTE.hudDim, step: 26 },
    { text: 'Clear 6 waves to win  ·  3 hearts  ·  P pauses  ·  M mutes', font: '500 15px system-ui, sans-serif', colour: PALETTE.hudDim, step: 34 },
    { text: 'Press Space or click to begin', font: '700 18px system-ui, sans-serif', colour: PALETTE.lanternGlow, step: 30 },
  ]);
}

export function paintWon(ctx, game) {
  paintPanel(ctx, [
    { text: 'DAWN BREAKS', font: '800 40px system-ui, sans-serif', colour: PALETTE.dawn, step: 54 },
    { text: 'The wood is lit again — you gathered every spore and outlasted the dark.', font: '600 17px system-ui, sans-serif', colour: PALETTE.hudText, step: 30 },
    { text: 'Final score ' + game.score + '   ·   spores ' + game.collected + '   ·   wisps banished ' + game.banished, font: '600 16px system-ui, sans-serif', colour: PALETTE.hudDim, step: 26 },
    { text: 'Best combo ×' + game.bestCombo.toFixed(1), font: '600 16px system-ui, sans-serif', colour: PALETTE.hudDim, step: 34 },
    { text: 'Press R or click to fly again', font: '700 18px system-ui, sans-serif', colour: PALETTE.lanternGlow, step: 30 },
  ]);
}

export function paintOver(ctx, game) {
  paintPanel(ctx, [
    { text: 'THE LIGHT GOES OUT', font: '800 36px system-ui, sans-serif', colour: PALETTE.danger, step: 50 },
    { text: 'The wisps caught the lantern on wave ' + game.wave + ' of ' + WAVES.total + '.', font: '600 17px system-ui, sans-serif', colour: PALETTE.hudText, step: 30 },
    { text: 'Score ' + game.score + '   ·   spores ' + game.collected + '   ·   wisps banished ' + game.banished, font: '600 16px system-ui, sans-serif', colour: PALETTE.hudDim, step: 26 },
    { text: 'Best combo ×' + game.bestCombo.toFixed(1), font: '600 16px system-ui, sans-serif', colour: PALETTE.hudDim, step: 34 },
    { text: 'Press R or click to try again', font: '700 18px system-ui, sans-serif', colour: PALETTE.lanternGlow, step: 30 },
  ]);
}

export function paintPaused(ctx) {
  paintPanel(ctx, [
    { text: 'PAUSED', font: '800 36px system-ui, sans-serif', colour: PALETTE.hudText, step: 48 },
    { text: 'Press P or click to keep flying', font: '600 16px system-ui, sans-serif', colour: PALETTE.hudDim, step: 30 },
  ]);
}
