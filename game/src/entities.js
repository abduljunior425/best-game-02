// Entities: the lantern moth, the shadow wisps, the glowing spores and the
// ember particles. This file moves things and detects touches; the score,
// hearts and waves live in rules.js, and nothing here draws a pixel.

import { FIELD, LANTERN, SPORE, WISP } from './tuning.js';
import { clamp, distance, range } from './rng.js';

export function makeLantern() {
  return {
    x: FIELD.width / 2,
    y: FIELD.height / 2,
    vx: 0,
    vy: 0,
    face: -Math.PI / 2,
    dashLeft: 0,
    dashReadyIn: 0,
    invulnLeft: 0,
    trail: 0,
    wingBeat: 0,
  };
}

export function makeSpore(rng) {
  const margin = 46;
  return {
    x: range(rng, margin, FIELD.width - margin),
    y: range(rng, margin, FIELD.height - margin),
    pulse: range(rng, 0, Math.PI * 2),
    bob: range(rng, 0, Math.PI * 2),
  };
}

export function makeWisp(rng, wave) {
  // Wisps arrive from a random edge so the player always sees them coming.
  const side = Math.floor(rng() * 4);
  const pad = 30;
  let x = pad;
  let y = pad;
  if (side === 0) { x = range(rng, pad, FIELD.width - pad); y = pad; }
  if (side === 1) { x = FIELD.width - pad; y = range(rng, pad, FIELD.height - pad); }
  if (side === 2) { x = range(rng, pad, FIELD.width - pad); y = FIELD.height - pad; }
  if (side === 3) { x = pad; y = range(rng, pad, FIELD.height - pad); }
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    drift: range(rng, 0, Math.PI * 2),
    speed: WISP.chaseSpeed + wave * WISP.chaseSpeedPerWave,
    wobble: range(rng, 1.4, 2.6),
    size: range(rng, 0.85, 1.15),
  };
}

export function makeBurst(x, y, colour, count, speed) {
  const bits = [];
  for (let i = 0; i < count; i += 1) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.35 + Math.random() * 0.65);
    bits.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.55 + Math.random() * 0.45,
      age: 0,
      colour,
      size: 2 + Math.random() * 3.5,
    });
  }
  return bits;
}

export function stepLantern(moth, keys, dt) {
  // Steering: arrow keys / WASD push, holding the pointer pulls toward it.
  let pushX = 0;
  let pushY = 0;
  if (keys.left) pushX -= 1;
  if (keys.right) pushX += 1;
  if (keys.up) pushY -= 1;
  if (keys.down) pushY += 1;
  if (keys.pointerDown && keys.pointerX !== null) {
    const dx = keys.pointerX - moth.x;
    const dy = keys.pointerY - moth.y;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > 12) {
      pushX += dx / d;
      pushY += dy / d;
    }
  }
  const len = Math.sqrt(pushX * pushX + pushY * pushY);
  if (len > 1) { pushX /= len; pushY /= len; }

  if (moth.dashLeft > 0) {
    moth.dashLeft -= dt;
    moth.trail -= dt;
    if (moth.trail <= 0) {
      moth.trail = 0.03;
      moth.ember = true;
    }
  } else {
    moth.vx += pushX * LANTERN.accel * dt;
    moth.vy += pushY * LANTERN.accel * dt;
    const drag = Math.exp(-LANTERN.drag * dt);
    moth.vx *= drag;
    moth.vy *= drag;
    const speed = Math.sqrt(moth.vx * moth.vx + moth.vy * moth.vy);
    if (speed > LANTERN.topSpeed) {
      moth.vx = (moth.vx / speed) * LANTERN.topSpeed;
      moth.vy = (moth.vy / speed) * LANTERN.topSpeed;
    }
  }
  moth.x = clamp(moth.x + moth.vx * dt, LANTERN.radius, FIELD.width - LANTERN.radius);
  moth.y = clamp(moth.y + moth.vy * dt, LANTERN.radius, FIELD.height - LANTERN.radius);
  if (Math.abs(moth.vx) + Math.abs(moth.vy) > 12) {
    moth.face = Math.atan2(moth.vy, moth.vx);
  }
  if (moth.dashReadyIn > 0) moth.dashReadyIn -= dt;
  if (moth.invulnLeft > 0) moth.invulnLeft -= dt;
  moth.wingBeat += dt * (6 + Math.min(10, Math.sqrt(moth.vx * moth.vx + moth.vy * moth.vy) / 30));
}

export function startDash(moth) {
  if (moth.dashReadyIn > 0 || moth.dashLeft > 0) return false;
  const speed = Math.sqrt(moth.vx * moth.vx + moth.vy * moth.vy);
  const dir = speed > 20 ? Math.atan2(moth.vy, moth.vx) : moth.face;
  moth.vx = Math.cos(dir) * LANTERN.dashSpeed;
  moth.vy = Math.sin(dir) * LANTERN.dashSpeed;
  moth.dashLeft = LANTERN.dashTime;
  moth.dashReadyIn = LANTERN.dashCooldown;
  moth.invulnLeft = Math.max(moth.invulnLeft, LANTERN.dashInvuln);
  moth.trail = 0;
  return true;
}

export function stepWisps(wisps, moth, dt, time) {
  for (const wisp of wisps) {
    const d = distance(wisp.x, wisp.y, moth.x, moth.y);
    let tx;
    let ty;
    if (d < WISP.chaseRange) {
      // Close in: chase the lantern, with a wobble so the path is dodgeable.
      const wob = Math.sin(time * wisp.wobble + wisp.drift) * 0.55;
      const ang = Math.atan2(moth.y - wisp.y, moth.x - wisp.x) + wob;
      tx = Math.cos(ang);
      ty = Math.sin(ang);
    } else {
      // Far away: drift lazily, so the field feels alive but fair.
      const ang = wisp.drift + Math.sin(time * 0.4 + wisp.drift) * 0.8;
      tx = Math.cos(ang);
      ty = Math.sin(ang);
    }
    const target = d < WISP.chaseRange ? wisp.speed : WISP.driftSpeed;
    wisp.vx += (tx * target - wisp.vx) * Math.min(1, dt * 2.4);
    wisp.vy += (ty * target - wisp.vy) * Math.min(1, dt * 2.4);
    wisp.x = clamp(wisp.x + wisp.vx * dt, WISP.radius, FIELD.width - WISP.radius);
    wisp.y = clamp(wisp.y + wisp.vy * dt, WISP.radius, FIELD.height - WISP.radius);
  }
}

export function stepSpores(spores, dt) {
  for (const spore of spores) {
    spore.pulse += dt * 3;
    spore.bob += dt * 1.7;
  }
}

export function stepBursts(bursts, dt) {
  for (const bit of bursts) {
    bit.age += dt;
    bit.x += bit.vx * dt;
    bit.y += bit.vy * dt;
    bit.vx *= Math.exp(-2.2 * dt);
    bit.vy *= Math.exp(-2.2 * dt);
  }
  return bursts.filter((bit) => bit.age < bit.life);
}

export function touching(a, b, gap) {
  return distance(a.x, a.y, b.x, b.y) < gap;
}

export function sporeTouchGap() {
  return SPORE.pickupRadius + LANTERN.radius * 0.4;
}

export function wispTouchGap(wisp) {
  return (WISP.radius * wisp.size + LANTERN.radius) * 0.82;
}
