// Dapur Kilat — configuration: canvas, layout, ingredients, recipes, tuning.
// Every pixel rect here is shared by render.js, input.js and the shot staging
// in main.js, so a click, a drawing and a screenshot always agree.

export const CANVAS_W = 1280;
export const CANVAS_H = 800;

// ---------------------------------------------------------------- palette
export const COLORS = {
  wall: '#2b1a12',
  wallTop: '#3a2418',
  floor: '#1d110a',
  wood: '#8a5a33',
  woodDark: '#6e4525',
  woodLight: '#a9743f',
  steel: '#b8c0c8',
  steelDark: '#7d868f',
  cream: '#fff6e0',
  paper: '#fff3d6',
  ink: '#2b1a12',
  inkSoft: '#6b4a2f',
  red: '#d9382b',
  redDark: '#a82318',
  green: '#4caf50',
  greenDark: '#2e7d32',
  gold: '#f2c14e',
  goldDark: '#c8932a',
  orange: '#e07840',
  blue: '#3e7cb1',
  pink: '#e88ca0',
  shadow: 'rgba(0,0,0,0.35)',
};

// ---------------------------------------------------------------- layout
// Fixed 1280x800 stage. Zones, top to bottom:
// HUD (0-60) | board+stations+menu (76-472) | tray+combo (488-540)
// | ingredient counter (648-776) | hint strip (780-800)
export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 60 },
  board: { x: 24, y: 76, w: 340, h: 460 },
  ticket: { w: 340, h: 104, gap: 10 },
  wok: { x: 388, y: 76, w: 250, h: 200 },
  grill: { x: 654, y: 76, w: 250, h: 200 },
  plate: { x: 388, y: 292, w: 516, h: 180 },
  plateCenter: { x: 646, y: 382, r: 72 },
  menu: { x: 928, y: 76, w: 328, h: 396 },
  tray: { x: 24, y: 548, w: 340, h: 92 },
  traySlot: { w: 100, h: 64, gap: 10 },
  combo: { x: 388, y: 488, w: 516, h: 52 },
  log: { x: 928, y: 488, w: 328, h: 52 },
  counter: { x: 24, y: 648, w: 1232, h: 128 },
  bin: { w: 190, h: 128, gap: 12 },
  hint: { x: 24, y: 782, w: 1232, h: 16 },
  startButton: { x: 510, y: 556, w: 260, h: 64 },
};

// ---------------------------------------------------------------- ingredients
// station: which cooking station turns the raw ingredient into a cooked one.
export const INGREDIENTS = {
  nasi:   { id: 'nasi',   name: 'Nasi',   key: 'Q', station: 'wok',   color: '#f5e6c8', dark: '#d9c49a', icon: 'rice' },
  mie:    { id: 'mie',    name: 'Mie',    key: 'W', station: 'wok',   color: '#f2c14e', dark: '#c8932a', icon: 'noodle' },
  telur:  { id: 'telur',  name: 'Telur',  key: 'E', station: 'wok',   color: '#fff8e7', dark: '#e8d9a8', icon: 'egg' },
  ayam:   { id: 'ayam',   name: 'Ayam',   key: 'R', station: 'grill', color: '#e07840', dark: '#a85428', icon: 'chicken' },
  cabai:  { id: 'cabai',  name: 'Cabai',  key: 'T', station: 'grill', color: '#d9382b', dark: '#8f1f16', icon: 'chili' },
  sayur:  { id: 'sayur',  name: 'Sayur',  key: 'Y', station: 'grill', color: '#4caf50', dark: '#2e7d32', icon: 'greens' },
};
export const INGREDIENT_ORDER = ['nasi', 'mie', 'telur', 'ayam', 'cabai', 'sayur'];

// ---------------------------------------------------------------- recipes
// needs: ingredient ids in any order. minLevel: from which level the dish
// may appear on the order board. base: score before patience/combo bonus.
export const RECIPES = {
  'nasi-goreng': { id: 'nasi-goreng', name: 'Nasi Goreng Kilat',  needs: ['nasi', 'telur', 'cabai'], base: 100, minLevel: 1, tag: 'Andalan' },
  'mie-goreng':  { id: 'mie-goreng',  name: 'Mie Goreng Pedas',   needs: ['mie', 'ayam', 'cabai'],   base: 100, minLevel: 1, tag: 'Pedas' },
  'sate-ayam':   { id: 'sate-ayam',   name: 'Sate Ayam Bakar',    needs: ['ayam', 'cabai', 'sayur'], base: 120, minLevel: 1, tag: 'Bakar' },
  'nasi-geprek': { id: 'nasi-geprek', name: 'Nasi Ayam Geprek',   needs: ['nasi', 'ayam', 'cabai', 'sayur'], base: 160, minLevel: 2, tag: 'Favorit' },
  'mie-tektek':  { id: 'mie-tektek',  name: 'Mie Tek-Tek Spesial', needs: ['mie', 'telur', 'ayam', 'sayur'],  base: 160, minLevel: 2, tag: 'Spesial' },
};
export const RECIPE_ORDER = ['nasi-goreng', 'mie-goreng', 'sate-ayam', 'nasi-geprek', 'mie-tektek'];

// ---------------------------------------------------------------- tuning
export const TUNING = {
  cookSeconds: 3.0,        // one ingredient on a station
  burnSeconds: 7.0,        // cooked food left on a station burns after this
  trayMax: 3,              // items your hand can carry
  plateMax: 4,             // items the plate can hold
  livesStart: 3,
  comboWindowSeconds: 20,  // serve again inside this window to keep the combo
  comboStep: 0.25,         // +25% score per combo step
  comboMaxMult: 3,
  servesPerLevel: 4,
  patienceBase: 50,        // seconds an order waits at level 1
  patienceMin: 34,
  spawnBase: 14,           // seconds between new orders at level 1
  spawnMin: 8,
  maxOrders: (level) => (level >= 3 ? 4 : level >= 2 ? 3 : 2),
  patienceFor: (level) => Math.max(TUNING.patienceMin, TUNING.patienceBase - (level - 1) * 4),
  spawnFor: (level) => Math.max(TUNING.spawnMin, TUNING.spawnBase - (level - 1) * 1.5),
};

// Key shortcuts: 1 = wok, 2 = grill, Space = serve first match, P = pause.
export const KEYS = {
  wok: '1',
  grill: '2',
  serve: ' ',
  pause: 'p',
};
