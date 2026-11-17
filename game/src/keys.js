// Keys: keyboard and pointer state, translated into field coordinates.
// The game reads this object; it never touches the DOM itself.

import { FIELD } from './tuning.js';

export function makeKeys() {
  return {
    left: false,
    right: false,
    up: false,
    down: false,
    pointerDown: false,
    pointerX: null,
    pointerY: null,
    pressed: new Set(),
  };
}

const KEYMAP = {
  ArrowLeft: 'left',
  KeyA: 'left',
  ArrowRight: 'right',
  KeyD: 'right',
  ArrowUp: 'up',
  KeyW: 'up',
  ArrowDown: 'down',
  KeyS: 'down',
};

export function attachKeys(canvas, keys, onTap) {
  function scalePointer(event) {
    const rect = canvas.getBoundingClientRect();
    const sx = FIELD.width / rect.width;
    const sy = FIELD.height / rect.height;
    keys.pointerX = (event.clientX - rect.left) * sx;
    keys.pointerY = (event.clientY - rect.top) * sy;
  }

  window.addEventListener('keydown', (event) => {
    const mapped = KEYMAP[event.code];
    if (mapped) {
      keys[mapped] = true;
      event.preventDefault();
    }
    if (!event.repeat) keys.pressed.add(event.code);
  });
  window.addEventListener('keyup', (event) => {
    const mapped = KEYMAP[event.code];
    if (mapped) keys[mapped] = false;
  });
  canvas.addEventListener('pointerdown', (event) => {
    keys.pointerDown = true;
    scalePointer(event);
    onTap();
  });
  window.addEventListener('pointerup', () => {
    keys.pointerDown = false;
  });
  canvas.addEventListener('pointermove', (event) => {
    if (keys.pointerDown) scalePointer(event);
  });
  window.addEventListener('blur', () => {
    keys.left = keys.right = keys.up = keys.down = false;
    keys.pointerDown = false;
  });
}

export function consumePress(keys, code) {
  if (keys.pressed.has(code)) {
    keys.pressed.delete(code);
    return true;
  }
  return false;
}
