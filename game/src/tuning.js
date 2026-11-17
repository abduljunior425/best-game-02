// Wispwood Lantern — every tuning number and colour in one place.
// Change a value here and the whole game retunes: nothing else holds a magic number.

export const FIELD = { width: 960, height: 600 };

export const LANTERN = {
  radius: 15,
  accel: 1500,
  topSpeed: 300,
  drag: 3.2,
  dashSpeed: 720,
  dashTime: 0.18,
  dashCooldown: 1.35,
  dashInvuln: 0.45,
  hurtInvuln: 1.4,
};

export const SPORE = {
  radius: 9,
  pickupRadius: 26,
  basePoints: 10,
  comboWindow: 2.6,
  comboStep: 0.5,
  comboCap: 4,
};

export const WISP = {
  radius: 17,
  driftSpeed: 46,
  chaseSpeed: 96,
  chaseSpeedPerWave: 9,
  chaseRange: 210,
  banishPoints: 50,
  maxOnField: 14,
};

export const WAVES = {
  total: 6,
  quotaBase: 6,
  quotaPerWave: 3,
  wispsBase: 3,
  wispsPerWave: 2,
  clearBonus: 150,
  clearBonusPerWave: 50,
};

export const HEARTS = { start: 3, max: 3 };

export const PALETTE = {
  sky: '#070d08',
  ground: '#0b1a10',
  groundEdge: '#0e2415',
  tree: '#0a1f12',
  treeLine: '#14301e',
  sporeCore: '#ffe9a3',
  sporeGlow: '#ffb52e',
  lanternCore: '#fff6cf',
  lanternGlow: '#ffc94d',
  lanternWing: '#ffd97a',
  wispBody: '#1b1430',
  wispEye: '#c86bff',
  wispEdge: '#5b3a8c',
  ember: '#ff9d45',
  hudText: '#e8f5d8',
  hudDim: '#9db894',
  panel: 'rgba(6, 16, 9, 0.86)',
  panelEdge: '#3f6b34',
  danger: '#ff6b5e',
  dawn: '#ffd98a',
};
