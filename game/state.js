// Dapur Kilat — state: what a run of the game is, and how new orders appear.
// Pure data + small helpers; the rules that change it live in world.js.

import { INGREDIENTS, RECIPES, RECIPE_ORDER, TUNING } from './config.js';

let nextOrderId = 1;

/** A fresh run: title screen first, then play. */
export function createState() {
  return {
    screen: 'title', // title | play | pause | over
    time: 0,         // seconds since the run started (play only)
    score: 0,
    served: 0,
    combo: 0,        // consecutive serves without a lost order
    comboLeft: 0,    // seconds left in the combo window
    lives: TUNING.livesStart,
    level: 1,
    orders: [],
    tray: [],        // raw ingredient ids in your hand (max TUNING.trayMax)
    wok: { cooking: null, done: null },   // { ing, t, dur } | { ing, born }
    grill: { cooking: null, done: null },
    plate: [],       // cooked ingredient ids on the plate
    popups: [],      // { x, y, text, color, t, life }
    particles: [],   // { x, y, vx, vy, r, color, t, life }
    shake: 0,        // screen-shake magnitude, decays to 0
    banner: null,    // { text, sub, t, life }
    spawnTimer: 4,   // first order arrives a few seconds after play starts
    lastServeAt: -999,
    muted: false,
    overReason: '',
    stats: { cooked: 0, burned: 0, lost: 0 },
  };
}

/** Recipes the current level may order. */
export function availableRecipes(level) {
  return RECIPE_ORDER.map((id) => RECIPES[id]).filter((r) => r.minLevel <= level);
}

/** One new order ticket for the board. */
export function spawnOrder(state, rng) {
  const pool = availableRecipes(state.level);
  const recipe = pool[Math.floor(rng() * pool.length)];
  const patience = TUNING.patienceFor(state.level);
  const order = {
    id: nextOrderId++,
    recipe,
    patience,
    maxPatience: patience,
    born: state.time,
    flash: 0, // hit-flash timer when served
  };
  state.orders.push(order);
  return order;
}

/** Does the plate hold exactly this recipe (same ingredients, any order)? */
export function plateMatches(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const have = [...plate].sort();
  const want = [...recipe.needs].sort();
  return have.every((ing, i) => ing === want[i]);
}

/** The first open order the current plate can serve, if any. */
export function matchingOrder(state) {
  for (const order of state.orders) {
    if (plateMatches(state.plate, order.recipe)) return order;
  }
  return null;
}

/** Score for serving `order` now, with the current combo. */
export function servePoints(order, state) {
  const patienceBonus = Math.round(100 * (order.patience / order.maxPatience));
  const mult = Math.min(TUNING.comboMaxMult, 1 + TUNING.comboStep * Math.max(0, state.combo));
  return Math.round((order.recipe.base + patienceBonus) * mult);
}

/** Ingredient ids of the counter, in display order. */
export function ingredientList() {
  return Object.values(INGREDIENTS);
}
