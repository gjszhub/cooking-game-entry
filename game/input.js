// Dapur Kilat — input: turn mouse clicks and keys into world actions.
// Hit areas mirror LAYOUT in config.js exactly, so what you see is clickable.

import { LAYOUT, INGREDIENT_ORDER, TUNING } from './config.js';
import { takeIngredient, dropTrayItem, startCooking, takeCooked, discardBurned, dropPlateItem, serve, startRun } from './world.js';

function inRect(x, y, r) {
  return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
}
function inCircle(x, y, cx, cy, r) {
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

/** Handle a click at canvas coordinates (x, y). Returns true if consumed. */
export function handleClick(state, x, y) {
  // HUD buttons
  if (inRect(x, y, { x: 1150, y: 12, w: 52, h: 36 })) {
    if (state.screen === 'play') state.screen = 'pause';
    else if (state.screen === 'pause') state.screen = 'play';
    return true;
  }
  if (inRect(x, y, { x: 1210, y: 12, w: 52, h: 36 })) {
    state.muted = !state.muted;
    return true;
  }

  // title / game-over: the big button
  if (state.screen === 'title' || state.screen === 'over') {
    if (inRect(x, y, LAYOUT.startButton)) startRun(state);
    return true;
  }
  if (state.screen === 'pause') {
    state.screen = 'play';
    return true;
  }
  if (state.screen !== 'play') return false;

  // order tickets: serve if the plate matches, otherwise nudge
  for (let i = 0; i < state.orders.length; i++) {
    const ty = LAYOUT.board.y + i * (LAYOUT.ticket.h + LAYOUT.ticket.gap);
    if (inRect(x, y, { x: LAYOUT.board.x, y: ty, w: LAYOUT.ticket.w, h: LAYOUT.ticket.h })) {
      serve(state);
      return true;
    }
  }

  // stations: cook circle starts cooking; done slot takes/discards the dish
  for (const [name, rect] of [['wok', LAYOUT.wok], ['grill', LAYOUT.grill]]) {
    const cx = rect.x + rect.w / 2;
    if (inCircle(x, y, cx, rect.y + 78, 48)) {
      startCooking(state, name);
      return true;
    }
    const done = { x: rect.x + 45, y: rect.y + 138, w: rect.w - 90, h: 48 };
    if (inRect(x, y, done)) {
      const st = state[name];
      if (st.done && st.done.burned) discardBurned(state, name);
      else takeCooked(state, name);
      return true;
    }
    if (inRect(x, y, rect)) return true; // station body: consume, no action
  }

  // plate: click a plated item to take it off; click the plate to serve
  const pc = LAYOUT.plateCenter;
  if (inCircle(x, y, pc.x, pc.y, pc.r + 6)) {
    const n = state.plate.length;
    if (n > 0) {
      // remove the item nearest the click, else serve
      let best = -1, bestD = 1e9;
      state.plate.forEach((_, i) => {
        const ang = -Math.PI / 2 + (i - (n - 1) / 2) * 0.9;
        const px = pc.x + Math.cos(ang) * 30;
        const py = pc.y + Math.sin(ang) * 26;
        const d = (x - px) ** 2 + (y - py) ** 2;
        if (d < bestD) { bestD = d; best = i; }
      });
      if (best >= 0 && bestD < 30 * 30) dropPlateItem(state, best);
      else serve(state);
    }
    return true;
  }

  // tray: click a carried item to put it back
  for (let i = 0; i < TUNING.trayMax; i++) {
    const sx = LAYOUT.tray.x + 10 + i * (LAYOUT.traySlot.w + LAYOUT.traySlot.gap);
    if (inRect(x, y, { x: sx, y: LAYOUT.tray.y + 14, w: LAYOUT.traySlot.w, h: LAYOUT.traySlot.h })) {
      dropTrayItem(state, i);
      return true;
    }
  }

  // ingredient counter bins
  for (let i = 0; i < INGREDIENT_ORDER.length; i++) {
    const bx = LAYOUT.counter.x + i * (LAYOUT.bin.w + LAYOUT.bin.gap);
    if (inRect(x, y, { x: bx, y: LAYOUT.counter.y, w: LAYOUT.bin.w, h: LAYOUT.bin.h })) {
      takeIngredient(state, INGREDIENT_ORDER[i]);
      return true;
    }
  }

  return false;
}
