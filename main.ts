// Dapur Kilat — entrypoint: hand the game to make.fun.
// Copies game/ and screenshots/ from beside this file into
// $MAKEFUN_OUTPUT_DIR (default /output), then writes /output/dossier.json
// with buildDossier from the kit's library (vendor/makefun-game.ts).
// Node 22, standard library only; no network, no installs.

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

function fail(message: string): never {
  console.error(`main.ts: ${message}`);
  process.exit(1);
}

const gameDir = join(root, 'game');
const shotsDir = join(root, 'screenshots');
if (!existsSync(join(gameDir, 'index.html'))) fail('game/index.html is missing');
if (!existsSync(shotsDir)) fail('screenshots/ is missing');

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });
cpSync(gameDir, join(outDir, 'game'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, CAPS);
writeFileSync(join(outDir, 'dossier.json'), dossier);

// Sanity check the handover before finishing: the dossier must parse, and the
// output must hold the game and every screenshot we meant to ship.
const parsed = JSON.parse(new TextDecoder().decode(dossier));
if (parsed.schema !== 'makefun/dossier/v1') fail('dossier.json has an unexpected schema');
if (!existsSync(join(outDir, 'game', 'index.html'))) fail('output lost game/index.html');
const shotNames = readdirSync(join(outDir, 'screenshots'))
  .filter((n) => !n.startsWith('.'));
if (shotNames.length < 3 || shotNames.length > 4) {
  fail(`expected 3-4 screenshots in the output, found ${shotNames.length}`);
}
for (const name of shotNames) {
  const { size } = statSync(join(outDir, 'screenshots', name));
  if (size > CAPS.screenshots.max_bytes) fail(`screenshot ${name} is ${size} bytes, over the cap`);
}
console.log(`dapur-kilat: game + ${shotNames.length} screenshots copied to ${outDir}; dossier.json ${dossier.length} bytes`);
