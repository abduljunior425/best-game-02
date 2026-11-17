// Wispwood Lantern for best-game-01 (Node 22, standard library only).
// The game is plain static files under game/ — an index page and ES modules,
// no library, no build step, no network request — and this program hands it
// in: it copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with the vendored make.fun
// library, the summary the judge reads.
//
// Play it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// Caps from the gate, so a local run refuses exactly what the scorer refuses:
// at most 4 screenshots, each at most 256 KiB; game/ at most 993 entries and
// 48 MiB in all, no path under it over 1000 bytes; the dossier text at most
// 160 KiB. Only the text cap shapes the bytes the dossier carries.
const DOSSIER_LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function outputDir() {
  return process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
}

function copyTree(from, to) {
  mkdirSync(dirname(to), { recursive: true });
  cpSync(from, to, { recursive: true });
}

function main() {
  const root = fileURLToPath(new URL('.', import.meta.url));
  const out = outputDir();
  mkdirSync(out, { recursive: true });
  copyTree(join(root, 'game'), join(out, 'game'));
  const shots = join(root, 'screenshots');
  if (existsSync(shots)) copyTree(shots, join(out, 'screenshots'));
  writeFileSync(join(out, 'dossier.json'), buildDossier(out, DOSSIER_LIMITS));
}

main();
