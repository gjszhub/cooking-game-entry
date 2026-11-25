// Dapur Kilat — main: boot the game, run the loop, and stage screenshots.
// Play: ?shot= is absent. Staging: ?shot=title|play|serve|rush (&seed=N is
// accepted and ignored — staged scenes are fixed, so every render is stable).

import { CANVAS_W, CANVAS_H, RECIPES } from './config.js';
import { createState } from './state.js';
import { tick, handleKey, startRun } from './world.js';
import { render } from './render.js';
import { handleClick } from './input.js';
import { sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = createState();
window.__dapkil = { state }; // playtest hook: read the live state from outside

// ---------------------------------------------------------------- sound watch
// The world stays silent; this loop watches for changes and plays the blip.
const watch = { score: 0, lives: 3, level: 1, wokDone: false, grillDone: false, screen: 'title' };
function watchSounds() {
  if (state.muted) { Object.assign(watch, { score: state.score, lives: state.lives, level: state.level, wokDone: !!state.wok.done, grillDone: !!state.grill.done, screen: state.screen }); return; }
  if (state.score > watch.score) sfx.serve();
  if (state.lives < watch.lives) sfx.lost();
  if (state.level > watch.level) sfx.level();
  if (!watch.wokDone && state.wok.done) sfx.ready();
  if (!watch.grillDone && state.grill.done) sfx.ready();
  Object.assign(watch, { score: state.score, lives: state.lives, level: state.level, wokDone: !!state.wok.done, grillDone: !!state.grill.done, screen: state.screen });
  sfx.setMuted(state.muted);
}

// ---------------------------------------------------------------- input
canvas.addEventListener('click', (ev) => {
  const r = canvas.getBoundingClientRect();
  const x = (ev.clientX - r.left) * (CANVAS_W / r.width);
  const y = (ev.clientY - r.top) * (CANVAS_H / r.height);
  const before = state.score;
  handleClick(state, x, y);
  if (state.score === before) sfx.click();
  watchSounds();
});
window.addEventListener('keydown', (ev) => {
  const k = ev.key.toLowerCase();
  if ([' ', 'arrowup', 'arrowdown'].includes(k)) ev.preventDefault();
  const before = state.score;
  if (handleKey(state, k)) {
    if (state.score === before) sfx.click();
    watchSounds();
  }
});

// ---------------------------------------------------------------- staging
// Staged scenes are built from the public state shape, not from gameplay.
function makeOrder(recipeId, patience, maxPatience) {
  const recipe = RECIPES[recipeId];
  return { id: 900 + Math.floor(Math.random() * 90), recipe, patience, maxPatience: maxPatience || patience, born: 0, flash: 0 };
}
function stageScene(kind) {
  startRun(state);
  state.screen = 'play';
  if (kind === 'title') {
    state.screen = 'title';
    return;
  }
  if (kind === 'play') {
    // Cover: a busy kitchen one wok-finish from a serve.
    state.score = 1240; state.served = 6; state.combo = 2; state.comboLeft = 14;
    state.level = 2; state.lives = 3;
    state.orders = [makeOrder('mie-goreng', 28, 50), makeOrder('nasi-goreng', 40, 50), makeOrder('sate-ayam', 18, 46)];
    state.wok = { cooking: { ing: 'mie', t: 1.8, dur: 3 }, done: null };
    state.grill = { cooking: null, done: { ing: 'ayam', born: state.time, burned: false } };
    state.plate = ['ayam', 'cabai'];
    state.tray = ['sayur'];
    state.particles.push(
      { x: 513, y: 140, vx: 2, vy: -30, r: 4, color: 'rgba(255,255,255,0.55)', t: 0.3, life: 0.9 },
      { x: 500, y: 150, vx: -2, vy: -26, r: 3, color: 'rgba(255,255,255,0.5)', t: 0.5, life: 0.9 },
      { x: 779, y: 140, vx: 1, vy: -28, r: 3, color: 'rgba(255,255,255,0.5)', t: 0.2, life: 0.9 },
    );
    return;
  }
  if (kind === 'serve') {
    // A serve moment: the plate is complete, the ticket glows, points pop.
    state.score = 1560; state.served = 8; state.combo = 3; state.comboLeft = 16;
    state.level = 2; state.lives = 3;
    state.orders = [makeOrder('mie-goreng', 35, 50), makeOrder('nasi-goreng', 26, 50), makeOrder('sate-ayam', 44, 50)];
    state.wok = { cooking: null, done: { ing: 'nasi', born: state.time, burned: false } };
    state.grill = { cooking: { ing: 'cabai', t: 1.2, dur: 3 }, done: null };
    state.plate = ['mie', 'ayam', 'cabai'];
    state.tray = [];
    state.popups.push({ x: 194, y: 130, text: '+320', color: '#f2c14e', t: 0.2, life: 1.1 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      state.particles.push({ x: 194, y: 130, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70 - 30, r: 3, color: '#f2c14e', t: 0.1, life: 0.8 });
    }
    return;
  }
  if (kind === 'rush') {
    // Service rush: four tickets, two nearly out of patience, both stations hot.
    state.score = 2890; state.served = 13; state.combo = 4; state.comboLeft = 9;
    state.level = 3; state.lives = 2;
    state.orders = [
      makeOrder('nasi-geprek', 8, 42), makeOrder('mie-tektek', 9, 42),
      makeOrder('nasi-goreng', 24, 42), makeOrder('sate-ayam', 31, 42),
    ];
    state.wok = { cooking: { ing: 'nasi', t: 2.4, dur: 3 }, done: null };
    state.grill = { cooking: { ing: 'ayam', t: 0.8, dur: 3 }, done: { ing: 'cabai', born: state.time, burned: false } };
    state.plate = ['nasi', 'telur'];
    state.tray = ['cabai', 'sayur'];
    state.shake = 0;
    return;
  }
}

// ---------------------------------------------------------------- loop
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
let last = performance.now();

if (shot) {
  stageScene(shot);
  // Frozen staged frame: paint a few times so steam/particles settle, then flag.
  let frames = 0;
  const paint = () => {
    render(ctx, state);
    frames++;
    if (frames < 3) requestAnimationFrame(paint);
    else window.__shotReady = true;
  };
  requestAnimationFrame(paint);
} else {
  const frame = (now) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (state.screen === 'play') tick(state, dt);
    render(ctx, state);
    if (state.screen === 'over') {
      try {
        const best = Number(localStorage.getItem('dapurkilat_best') || 0);
        if (state.score > best) localStorage.setItem('dapurkilat_best', String(state.score));
      } catch { /* storage unavailable: ignore */ }
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
