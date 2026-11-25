// Dapur Kilat — world: the rules. Every player action and every tick of the
// kitchen runs through here. Rendering only reads this state, never changes it.

import { INGREDIENTS, TUNING, KEYS } from './config.js';
import { spawnOrder, matchingOrder, servePoints } from './state.js';

// ---------------------------------------------------------------- helpers
function popup(state, x, y, text, color) {
  state.popups.push({ x, y, text, color: color || '#fff6e0', t: 0, life: 1.1 });
}
function burst(state, x, y, color, n) {
  for (let i = 0; i < (n || 10); i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 30 + Math.random() * 90;
    state.particles.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
      r: 2 + Math.random() * 4, color, t: 0, life: 0.5 + Math.random() * 0.4,
    });
  }
}
function steam(state, x, y) {
  state.particles.push({
    x: x + (Math.random() - 0.5) * 30, y, vx: (Math.random() - 0.5) * 8,
    vy: -28 - Math.random() * 20, r: 3 + Math.random() * 4,
    color: 'rgba(255,255,255,0.55)', t: 0, life: 0.9,
  });
}
function banner(state, text, sub) {
  state.banner = { text, sub: sub || '', t: 0, life: 1.6 };
}

// ---------------------------------------------------------------- actions
/** Take a raw ingredient from the counter into your hand. */
export function takeIngredient(state, ingId) {
  if (state.screen !== 'play') return false;
  if (state.tray.length >= TUNING.trayMax) {
    popup(state, 194, 540, 'Tangan penuh!', '#e88ca0');
    return false;
  }
  state.tray.push(ingId);
  return true;
}

/** Remove one item from your hand (click it again). */
export function dropTrayItem(state, index) {
  if (state.screen !== 'play') return false;
  if (index < 0 || index >= state.tray.length) return false;
  state.tray.splice(index, 1);
  return true;
}

/** Start cooking the first hand item this station accepts. */
export function startCooking(state, stationName) {
  if (state.screen !== 'play') return false;
  const station = state[stationName];
  if (station.cooking) return false; // one pan, one job
  const idx = state.tray.findIndex((id) => INGREDIENTS[id].station === stationName);
  if (idx < 0) {
    popup(state, stationName === 'wok' ? 513 : 779, 250, 'Bukan di sini!', '#e88ca0');
    return false;
  }
  const ing = state.tray.splice(idx, 1)[0];
  station.cooking = { ing, t: 0, dur: TUNING.cookSeconds };
  return true;
}

/** Take a finished dish off a station onto the plate. */
export function takeCooked(state, stationName) {
  if (state.screen !== 'play') return false;
  const station = state[stationName];
  if (!station.done) return false;
  if (state.plate.length >= TUNING.plateMax) {
    popup(state, 646, 300, 'Piring penuh!', '#e88ca0');
    return false;
  }
  state.plate.push(station.done.ing);
  station.done = null;
  return true;
}

/** Throw a burned dish away. */
export function discardBurned(state, stationName) {
  if (state.screen !== 'play') return false;
  const station = state[stationName];
  if (!station.done || !station.done.burned) return false;
  station.done = null;
  state.stats.burned++;
  popup(state, stationName === 'wok' ? 513 : 779, 250, 'Gosong dibuang', '#8f8f8f');
  return true;
}

/** Take one item off the plate (change your mind). */
export function dropPlateItem(state, index) {
  if (state.screen !== 'play') return false;
  if (index < 0 || index >= state.plate.length) return false;
  state.plate.splice(index, 1);
  return true;
}

/** Serve the plate to the first order it matches. Returns points or 0. */
export function serve(state) {
  if (state.screen !== 'play') return 0;
  const order = matchingOrder(state);
  if (!order) {
    popup(state, 646, 300, 'Belum cocok!', '#e88ca0');
    return 0;
  }
  const points = servePoints(order, state);
  state.score += points;
  state.served++;
  state.combo = state.time - state.lastServeAt <= TUNING.comboWindowSeconds ? state.combo + 1 : 1;
  state.lastServeAt = state.time;
  state.comboLeft = TUNING.comboWindowSeconds;
  state.plate = [];
  state.orders = state.orders.filter((o) => o.id !== order.id);
  const level = Math.floor(state.served / TUNING.servesPerLevel) + 1;
  if (level > state.level) {
    state.level = level;
    banner(state, `LEVEL ${level}!`, 'Pesanan makin ramai, sabar makin pendek');
  }
  popup(state, 194, 130, `+${points}`, '#f2c14e');
  burst(state, 194, 130, '#f2c14e', 16);
  burst(state, 646, 382, '#4caf50', 10);
  state.stats.cooked++;
  return points;
}

/** Start a fresh run from the title screen. */
export function startRun(state) {
  const fresh = { screen: 'play', time: 0, spawnTimer: 4 };
  Object.assign(state, fresh);
  state.score = 0; state.served = 0; state.combo = 0; state.comboLeft = 0;
  state.lives = TUNING.livesStart; state.level = 1; state.orders = [];
  state.tray = []; state.wok = { cooking: null, done: null };
  state.grill = { cooking: null, done: null }; state.plate = [];
  state.popups = []; state.particles = []; state.shake = 0;
  state.banner = { text: 'BUKA DAPUR!', sub: 'Klik bahan di counter, masak, sajikan', t: 0, life: 1.8 };
  state.lastServeAt = -999; state.overReason = '';
  state.stats = { cooked: 0, burned: 0, lost: 0 };
}

// ---------------------------------------------------------------- tick
/** Advance the kitchen by dt seconds. Called only while screen is 'play'. */
export function tick(state, dt) {
  state.time += dt;

  // combo window
  if (state.comboLeft > 0) {
    state.comboLeft -= dt;
    if (state.comboLeft <= 0) state.combo = 0;
  }

  // new orders arrive on a timer that quickens with level
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    if (state.orders.length < TUNING.maxOrders(state.level)) {
      const order = spawnOrder(state, Math.random);
      banner(state, 'PESANAN BARU!', order.recipe.name);
    }
    state.spawnTimer = TUNING.spawnFor(state.level);
  }

  // order patience drains; an expired order costs a life
  for (const order of [...state.orders]) {
    order.patience -= dt;
    if (order.patience <= 0) {
      state.orders = state.orders.filter((o) => o.id !== order.id);
      state.lives--;
      state.combo = 0;
      state.comboLeft = 0;
      state.stats.lost++;
      state.shake = 14;
      banner(state, 'PESANAN HANGUS!', `${order.recipe.name} keburu pergi`);
      popup(state, 194, 130, '-1 NYAWA', '#d9382b');
      if (state.lives <= 0) {
        state.screen = 'over';
        state.overReason = `Dapur tutup — ${state.served} hidangan tersaji, skor ${state.score}`;
      }
    }
  }

  // cooking progress on both stations
  for (const name of ['wok', 'grill']) {
    const st = state[name];
    if (st.cooking) {
      st.cooking.t += dt;
      if (Math.random() < dt * 6) {
        steam(state, name === 'wok' ? 513 : 779, name === 'wok' ? 150 : 150);
      }
      if (st.cooking.t >= st.cooking.dur) {
        st.done = { ing: st.cooking.ing, born: state.time, burned: false };
        st.cooking = null;
      }
    }
    if (st.done && !st.done.burned && state.time - st.done.born > TUNING.burnSeconds) {
      st.done.burned = true;
      popup(state, name === 'wok' ? 513 : 779, 250, 'GOSONG!', '#d9382b');
    }
  }

  // popups float up and fade; particles drift and fade; shake decays
  for (const p of state.popups) { p.t += dt; p.y -= dt * 34; }
  state.popups = state.popups.filter((p) => p.t < p.life);
  for (const pt of state.particles) {
    pt.t += dt; pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.vy += 60 * dt;
  }
  state.particles = state.particles.filter((pt) => pt.t < pt.life);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);
  if (state.banner) {
    state.banner.t += dt;
    if (state.banner.t > state.banner.life) state.banner = null;
  }
}

/** Keyboard shortcuts, by key value (already lowercased by the caller). */
export function handleKey(state, key) {
  if (key === KEYS.pause) {
    if (state.screen === 'play') state.screen = 'pause';
    else if (state.screen === 'pause') state.screen = 'play';
    return true;
  }
  if (state.screen === 'title' && (key === 'enter' || key === ' ')) {
    startRun(state);
    return true;
  }
  if (state.screen === 'over' && (key === 'enter' || key === ' ')) {
    startRun(state);
    return true;
  }
  if (state.screen !== 'play') return false;
  if (key === KEYS.serve) { serve(state); return true; }
  if (key === KEYS.wok) { startCooking(state, 'wok'); return true; }
  if (key === KEYS.grill) { startCooking(state, 'grill'); return true; }
  const ing = Object.values(INGREDIENTS).find((g) => g.key.toLowerCase() === key);
  if (ing) { takeIngredient(state, ing.id); return true; }
  return false;
}
