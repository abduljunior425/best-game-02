// Tones: every sound is synthesized with Web Audio — no audio files, no
// network. The game calls the small verbs below; nothing here knows the rules.

export function makeTones() {
  return { ctx: null, muted: false };
}

function ensure(tones) {
  if (!tones.ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    tones.ctx = new AC();
  }
  if (tones.ctx.state === 'suspended') tones.ctx.resume();
  return tones.ctx;
}

function blip(tones, freqA, freqB, seconds, kind, gain) {
  if (tones.muted) return;
  const ctx = ensure(tones);
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  const now = ctx.currentTime;
  osc.type = kind;
  osc.frequency.setValueAtTime(freqA, now);
  osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqB), now + seconds);
  amp.gain.setValueAtTime(gain, now);
  amp.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
  osc.connect(amp);
  amp.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + seconds + 0.02);
}

function noise(tones, seconds, gain, low) {
  if (tones.muted) return;
  const ctx = ensure(tones);
  if (!ctx) return;
  const size = Math.floor(ctx.sampleRate * seconds);
  const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < size; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / size);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = low;
  const amp = ctx.createGain();
  amp.gain.value = gain;
  src.connect(filter);
  filter.connect(amp);
  amp.connect(ctx.destination);
  src.start();
}

export const tones = {
  pickup(tonesState, combo) {
    const base = 520 + combo * 90;
    blip(tonesState, base, base * 1.6, 0.12, 'sine', 0.16);
  },
  dash(tonesState) {
    noise(tonesState, 0.22, 0.12, 1800);
  },
  banish(tonesState) {
    blip(tonesState, 300, 90, 0.25, 'sawtooth', 0.12);
    blip(tonesState, 880, 1320, 0.14, 'sine', 0.1);
  },
  hurt(tonesState) {
    blip(tonesState, 180, 55, 0.35, 'triangle', 0.22);
  },
  clear(tonesState) {
    const ctx = ensure(tonesState);
    if (!ctx || tonesState.muted) return;
    [523, 659, 784, 1047].forEach((freq, i) => {
      setTimeout(() => blip(tonesState, freq, freq, 0.22, 'sine', 0.14), i * 90);
    });
  },
  win(tonesState) {
    [523, 659, 784, 1047, 1319].forEach((freq, i) => {
      setTimeout(() => blip(tonesState, freq, freq * 1.01, 0.4, 'sine', 0.14), i * 130);
    });
  },
  lose(tonesState) {
    [392, 330, 262, 196].forEach((freq, i) => {
      setTimeout(() => blip(tonesState, freq, freq * 0.94, 0.3, 'triangle', 0.14), i * 150);
    });
  },
};
