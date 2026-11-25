// Dapur Kilat — render: everything the player (and the judge) sees, drawn with
// canvas shapes only. No images, no network, no fonts to download.

import { CANVAS_W, CANVAS_H, COLORS, LAYOUT, INGREDIENTS, INGREDIENT_ORDER, RECIPES, RECIPE_ORDER, TUNING } from './config.js';
import { availableRecipes, matchingOrder, plateMatches } from './state.js';

// ---------------------------------------------------------------- helpers
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function text(ctx, s, x, y, size, color, weight, align) {
  ctx.fillStyle = color;
  ctx.font = `${weight || 700} ${size}px system-ui, "Segoe UI", Arial, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}
function outlinedText(ctx, s, x, y, size, color, weight, align) {
  ctx.font = `${weight || 900} ${size}px "Arial Black", system-ui, sans-serif`;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.lineWidth = Math.max(3, size / 7);
  ctx.strokeStyle = 'rgba(0,0,0,0.55)';
  ctx.strokeText(s, x, y);
  ctx.fillStyle = color;
  ctx.fillText(s, x, y);
}
function heart(ctx, x, y, s, fill) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 16, s / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-11, -4, -6, -12, 0, -6);
  ctx.bezierCurveTo(6, -12, 11, -4, 0, 5);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}
function flame(ctx, x, y, s, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s / 20, s / 20);
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.bezierCurveTo(-9, 2, -6, -8, 0, -12);
  ctx.bezierCurveTo(3, -6, 8, -2, 6, 4);
  ctx.bezierCurveTo(5, 8, 2, 11, 0, 10);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

/** Draw one ingredient's icon (raw or cooked) centred at x,y, size s. */
export function drawIngredientIcon(ctx, icon, x, y, s, cooked) {
  ctx.save();
  ctx.translate(x, y);
  const u = s / 40; // unit
  ctx.lineWidth = Math.max(1.5, 2 * u);
  if (icon === 'rice') {
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.ellipse(0, 8 * u, 17 * u, 7 * u, 0, 0, Math.PI * 2); ctx.fill(); // bowl
    ctx.fillStyle = cooked ? '#f7ead0' : '#f5e6c8';
    ctx.beginPath(); ctx.ellipse(0, 2 * u, 14 * u, 8 * u, 0, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-4 * u, -2 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(4 * u, -1 * u, 2.5 * u, 0, Math.PI * 2); ctx.fill();
  } else if (icon === 'noodle') {
    ctx.fillStyle = '#2e6da4';
    ctx.beginPath(); ctx.ellipse(0, 8 * u, 17 * u, 7 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = cooked ? '#f7c948' : '#f2c14e';
    ctx.lineWidth = 3.4 * u;
    ctx.beginPath();
    ctx.moveTo(-11 * u, 2 * u);
    ctx.bezierCurveTo(-6 * u, -4 * u, 0, 6 * u, 5 * u, 0);
    ctx.bezierCurveTo(9 * u, -4 * u, 12 * u, 3 * u, 11 * u, 4 * u);
    ctx.stroke();
    ctx.strokeStyle = '#e07840';
    ctx.beginPath(); ctx.moveTo(-8 * u, 5 * u); ctx.lineTo(8 * u, 5 * u); ctx.stroke();
  } else if (icon === 'egg') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath(); ctx.ellipse(0, 1 * u, 15 * u, 11 * u, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#e8d9a8'; ctx.lineWidth = 1.6 * u; ctx.stroke();
    ctx.fillStyle = cooked ? '#f0a13a' : '#ffd94d';
    ctx.beginPath(); ctx.arc(0, 1 * u, 6.5 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath(); ctx.arc(-2 * u, -1 * u, 2 * u, 0, Math.PI * 2); ctx.fill();
  } else if (icon === 'chicken') {
    ctx.fillStyle = cooked ? '#b85c1e' : '#e07840';
    ctx.beginPath(); ctx.ellipse(2 * u, 0, 12 * u, 10 * u, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff3e0'; ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.moveTo(-10 * u, 6 * u); ctx.lineTo(-16 * u, 12 * u); ctx.stroke();
    ctx.fillStyle = '#fff3e0';
    ctx.beginPath(); ctx.arc(-16 * u, 13 * u, 3.4 * u, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-13 * u, 15 * u, 3 * u, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath(); ctx.ellipse(6 * u, -4 * u, 5 * u, 2.4 * u, -0.5, 0, Math.PI * 2); ctx.fill();
  } else if (icon === 'chili') {
    ctx.strokeStyle = '#2e7d32'; ctx.lineWidth = 3 * u;
    ctx.beginPath(); ctx.moveTo(8 * u, -12 * u); ctx.quadraticCurveTo(12 * u, -16 * u, 14 * u, -12 * u); ctx.stroke();
    ctx.fillStyle = cooked ? '#a82318' : '#d9382b';
    ctx.beginPath();
    ctx.moveTo(8 * u, -11 * u);
    ctx.bezierCurveTo(-6 * u, -14 * u, -14 * u, -2 * u, -8 * u, 8 * u);
    ctx.bezierCurveTo(-4 * u, 14 * u, 4 * u, 12 * u, 8 * u, 4 * u);
    ctx.bezierCurveTo(11 * u, -2 * u, 10 * u, -8 * u, 8 * u, -11 * u);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(-3 * u, -2 * u, 4 * u, 7 * u, 0.5, 0, Math.PI * 2); ctx.fill();
  } else if (icon === 'greens') {
    ctx.fillStyle = '#2e7d32';
    ctx.beginPath(); ctx.ellipse(-6 * u, 2 * u, 8 * u, 5 * u, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4caf50';
    ctx.beginPath(); ctx.ellipse(5 * u, -2 * u, 9 * u, 5.5 * u, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#81c784';
    ctx.beginPath(); ctx.ellipse(2 * u, 6 * u, 7 * u, 4 * u, -0.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- zones
function drawBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  g.addColorStop(0, COLORS.wallTop);
  g.addColorStop(0.55, COLORS.wall);
  g.addColorStop(1, COLORS.floor);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  // wall tiles
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 80) {
    ctx.beginPath(); ctx.moveTo(x, 60); ctx.lineTo(x, 640); ctx.stroke();
  }
  for (let y = 140; y < 640; y += 80) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }
  // hanging lamps
  for (const x of [200, 640, 1080]) {
    ctx.strokeStyle = '#1d110a';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 26); ctx.stroke();
    ctx.fillStyle = COLORS.gold;
    ctx.beginPath(); ctx.arc(x, 34, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(242,193,78,0.12)';
    ctx.beginPath(); ctx.arc(x, 34, 34, 0, Math.PI * 2); ctx.fill();
  }
}

function drawHud(ctx, state) {
  const L = LAYOUT.hud;
  ctx.fillStyle = '#160c06';
  ctx.fillRect(L.x, L.y, L.w, L.h);
  // logo
  flame(ctx, 44, 30, 26, '#f07b1d');
  outlinedText(ctx, 'DAPUR KILAT', 64, 32, 26, '#fff6e0', 900);
  text(ctx, 'warung cepat saji', 64, 50, 11, '#c9a06a', 600);
  // score
  text(ctx, 'SKOR', 330, 22, 11, '#c9a06a', 700);
  outlinedText(ctx, String(state.score), 330, 44, 24, COLORS.gold, 900);
  // served
  text(ctx, 'TERSAJI', 480, 22, 11, '#c9a06a', 700);
  outlinedText(ctx, String(state.served), 480, 44, 24, '#fff6e0', 900);
  // level
  text(ctx, 'LEVEL', 590, 22, 11, '#c9a06a', 700);
  outlinedText(ctx, String(state.level), 590, 44, 24, '#7fd4ff', 900);
  // combo
  if (state.combo >= 2) {
    flame(ctx, 700, 30, 24, '#ff5722');
    outlinedText(ctx, `x${(1 + TUNING.comboStep * (state.combo - 1)).toFixed(2).replace(/\.?0+$/, '')}`, 716, 32, 22, '#ffab91', 900);
    text(ctx, `KOMBO ${state.combo}`, 716, 50, 11, '#ffab91', 700);
  }
  // lives
  for (let i = 0; i < TUNING.livesStart; i++) {
    heart(ctx, 1050 + i * 30, 30, 22, i < state.lives ? COLORS.red : 'rgba(255,255,255,0.18)');
  }
  // pause + sound buttons
  rr(ctx, 1150, 12, 52, 36, 8);
  ctx.fillStyle = '#3a2418'; ctx.fill();
  ctx.fillStyle = '#fff6e0';
  ctx.fillRect(1168, 22, 5, 16); ctx.fillRect(1179, 22, 5, 16);
  rr(ctx, 1210, 12, 52, 36, 8);
  ctx.fillStyle = '#3a2418'; ctx.fill();
  ctx.fillStyle = state.muted ? '#8f8f8f' : '#fff6e0';
  ctx.beginPath();
  ctx.moveTo(1224, 22); ctx.lineTo(1232, 22); ctx.lineTo(1240, 30); ctx.lineTo(1240, 30);
  ctx.lineTo(1240, 30); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(1222, 22); ctx.lineTo(1230, 22); ctx.lineTo(1238, 28); ctx.lineTo(1238, 32);
  ctx.lineTo(1230, 38); ctx.lineTo(1222, 38); ctx.closePath(); ctx.fill();
  if (!state.muted) {
    ctx.strokeStyle = '#fff6e0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(1242, 30, 5, -0.9, 0.9); ctx.stroke();
    ctx.beginPath(); ctx.arc(1242, 30, 9, -0.9, 0.9); ctx.stroke();
  } else {
    ctx.strokeStyle = '#d9382b'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(1240, 22); ctx.lineTo(1250, 38); ctx.stroke();
  }
}

function drawTicket(ctx, order, x, y, w, h, state) {
  const r = order.recipe;
  const frac = Math.max(0, order.patience / order.maxPatience);
  const urgent = order.patience < 12;
  const match = plateMatches(state.plate, r);
  ctx.save();
  if (urgent && state.screen === 'play') {
    const pulse = 0.5 + 0.5 * Math.sin(state.time * 8);
    ctx.shadowColor = `rgba(217,56,43,${0.35 + 0.4 * pulse})`;
    ctx.shadowBlur = 18;
  } else if (match) {
    ctx.shadowColor = 'rgba(76,175,80,0.8)';
    ctx.shadowBlur = 16;
  }
  rr(ctx, x, y, w, h, 10);
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.restore();
  // header
  ctx.fillStyle = match ? COLORS.greenDark : (urgent ? COLORS.red : '#b03a2e');
  rr(ctx, x, y, w, 30, 10);
  ctx.fillRect(x, y + 20, w, 10);
  text(ctx, r.name.toUpperCase(), x + 12, y + 16, 15, '#fff6e0', 800);
  text(ctx, match ? 'SAJIKAN!' : r.tag, x + w - 12, y + 16, 11, match ? '#a5d6a7' : '#ffd9a0', 800, 'right');
  // ingredients
  let ix = x + 14;
  for (const ingId of r.needs) {
    const ing = INGREDIENTS[ingId];
    const done = state.plate.includes(ingId);
    ctx.fillStyle = done ? '#dff0d8' : '#f3e2c2';
    rr(ctx, ix, y + 42, 66, 34, 8);
    ctx.fill();
    ctx.strokeStyle = done ? COLORS.greenDark : '#c9a06a';
    ctx.lineWidth = done ? 2 : 1;
    ctx.stroke();
    drawIngredientIcon(ctx, ing.icon, ix + 15, y + 59, 22, done);
    text(ctx, ing.name, ix + 30, y + 59, 11, COLORS.ink, 700);
    ix += 72;
  }
  // patience bar
  const bw = w - 24;
  ctx.fillStyle = '#e0cba6';
  rr(ctx, x + 12, y + h - 18, bw, 9, 4);
  ctx.fill();
  ctx.fillStyle = frac > 0.5 ? COLORS.green : frac > 0.25 ? COLORS.gold : COLORS.red;
  rr(ctx, x + 12, y + h - 18, Math.max(10, bw * frac), 9, 4);
  ctx.fill();
  outlinedText(ctx, `${Math.ceil(order.patience)} dtk`, x + w - 12, y + h - 13, 11, '#fff', 800, 'right');
}

function drawBoard(ctx, state) {
  const B = LAYOUT.board;
  rr(ctx, B.x - 8, B.y - 8, B.w + 16, B.h + 16, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  text(ctx, 'ORDER BOARD', B.x + 4, B.y - 20, 13, '#c9a06a', 800);
  if (state.orders.length === 0) {
    text(ctx, 'Belum ada pesanan…', B.x + 170, B.y + 60, 15, 'rgba(255,246,224,0.55)', 600, 'center');
    text(ctx, 'Siap-siap, pelanggan datang!', B.x + 170, B.y + 86, 12, 'rgba(255,246,224,0.4)', 600, 'center');
    return;
  }
  state.orders.forEach((order, i) => {
    drawTicket(ctx, order, B.x, B.y + i * (LAYOUT.ticket.h + LAYOUT.ticket.gap), LAYOUT.ticket.w, LAYOUT.ticket.h, state);
  });
}

function drawStation(ctx, state, name, rect, label, accepts) {
  const st = state[name];
  rr(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = '#241610';
  ctx.fill();
  ctx.strokeStyle = '#5a3a22';
  ctx.lineWidth = 2;
  ctx.stroke();
  text(ctx, label, rect.x + 14, rect.y + 18, 16, '#fff6e0', 800);
  text(ctx, accepts, rect.x + rect.w - 14, rect.y + 18, 11, '#c9a06a', 600, 'right');
  const cx = rect.x + rect.w / 2;
  const cy = rect.y + 78;
  // cook circle
  ctx.beginPath();
  ctx.arc(cx, cy, 42, 0, Math.PI * 2);
  ctx.fillStyle = '#160c06';
  ctx.fill();
  ctx.strokeStyle = st.cooking ? COLORS.gold : 'rgba(255,246,224,0.25)';
  ctx.lineWidth = 3;
  ctx.setLineDash(st.cooking ? [] : [6, 6]);
  ctx.stroke();
  ctx.setLineDash([]);
  if (st.cooking) {
    const ing = INGREDIENTS[st.cooking.ing];
    drawIngredientIcon(ctx, ing.icon, cx, cy, 44, false);
    const frac = st.cooking.t / st.cooking.dur;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
    ctx.strokeStyle = COLORS.gold;
    ctx.lineWidth = 5;
    ctx.stroke();
    // flames under the wok
    flame(ctx, cx - 18, rect.y + rect.h - 14, 14, '#ff5722');
    flame(ctx, cx + 18, rect.y + rect.h - 12, 12, '#ffb300');
  } else {
    text(ctx, 'kosong', cx, cy, 12, 'rgba(255,246,224,0.4)', 600, 'center');
  }
  // done slot
  const dx = rect.x + 45, dy = rect.y + 138, dw = rect.w - 90, dh = 48;
  rr(ctx, dx, dy, dw, dh, 8);
  ctx.fillStyle = st.done ? (st.done.burned ? '#3d1512' : '#2e4a22') : 'rgba(255,246,224,0.08)';
  ctx.fill();
  ctx.strokeStyle = st.done ? (st.done.burned ? COLORS.red : COLORS.green) : 'rgba(255,246,224,0.2)';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (st.done) {
    const ing = INGREDIENTS[st.done.ing];
    drawIngredientIcon(ctx, ing.icon, dx + 26, dy + dh / 2, 30, true);
    if (st.done.burned) {
      text(ctx, 'GOSONG — klik buang', dx + 48, dy + dh / 2, 12, '#ff8a80', 800);
    } else {
      text(ctx, `${ing.name} matang!`, dx + 48, dy + dh / 2 - 8, 13, '#fff6e0', 800);
      text(ctx, 'klik → ke piring', dx + 48, dy + dh / 2 + 10, 11, '#c9d6a0', 600);
    }
  } else {
    text(ctx, 'hasil masakan', dx + dw / 2, dy + dh / 2, 12, 'rgba(255,246,224,0.4)', 600, 'center');
  }
}

function drawPlate(ctx, state) {
  const P = LAYOUT.plate;
  rr(ctx, P.x, P.y, P.w, P.h, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  text(ctx, 'PIRING SAJI', P.x + 14, P.y + 18, 13, '#c9a06a', 800);
  const match = matchingOrder(state);
  const c = LAYOUT.plateCenter;
  ctx.save();
  if (match) {
    ctx.shadowColor = 'rgba(76,175,80,0.9)';
    ctx.shadowBlur = 22;
  }
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
  ctx.fillStyle = '#f7f3ea';
  ctx.fill();
  ctx.restore();
  ctx.beginPath();
  ctx.arc(c.x, c.y, c.r - 10, 0, Math.PI * 2);
  ctx.strokeStyle = '#d9c49a';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (state.plate.length === 0) {
    text(ctx, 'piring kosong', c.x, c.y, 13, '#a08a6a', 600, 'center');
  } else {
    const n = state.plate.length;
    state.plate.forEach((ingId, i) => {
      const ing = INGREDIENTS[ingId];
      const ang = -Math.PI / 2 + (i - (n - 1) / 2) * 0.9;
      const px = c.x + Math.cos(ang) * 30;
      const py = c.y + Math.sin(ang) * 26;
      drawIngredientIcon(ctx, ing.icon, px, py, 34, true);
    });
  }
  // plate slots
  for (let i = 0; i < TUNING.plateMax; i++) {
    const sx = P.x + P.w - 150 + i * 34;
    const sy = P.y + 30;
    ctx.beginPath();
    ctx.arc(sx, sy, 13, 0, Math.PI * 2);
    ctx.fillStyle = i < state.plate.length ? COLORS.green : 'rgba(255,246,224,0.15)';
    ctx.fill();
  }
  text(ctx, `${state.plate.length}/${TUNING.plateMax} bahan`, P.x + P.w - 14, P.y + 56, 11, '#c9a06a', 700, 'right');
  if (match) {
    outlinedText(ctx, `SIAP! Sajikan ${match.recipe.name}`, c.x, P.y + P.h - 16, 17, '#a5d6a7', 900, 'center');
  } else if (state.plate.length > 0) {
    text(ctx, 'Lengkapi sesuai resep di tiket', c.x, P.y + P.h - 16, 13, '#c9a06a', 600, 'center');
  } else {
    text(ctx, 'Klik bahan matang di stasiun untuk menaruh di piring', c.x, P.y + P.h - 16, 13, 'rgba(255,246,224,0.55)', 600, 'center');
  }
}

function drawMenu(ctx, state) {
  const M = LAYOUT.menu;
  rr(ctx, M.x - 8, M.y - 8, M.w + 16, M.h + 16, 12);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.fill();
  text(ctx, 'MENU HARI INI', M.x + 4, M.y - 20, 13, '#c9a06a', 800);
  const pool = availableRecipes(state.level);
  RECIPE_ORDER.forEach((id, i) => {
    const r = RECIPES[id];
    const y = M.y + i * 76;
    const locked = r.minLevel > state.level;
    const inPool = pool.includes(r);
    rr(ctx, M.x, y, M.w, 66, 10);
    ctx.fillStyle = locked ? 'rgba(255,246,224,0.05)' : inPool ? '#3a2418' : '#2b1a12';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,246,224,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
    text(ctx, locked ? `${r.name}  🔒 Lv ${r.minLevel}` : r.name, M.x + 12, y + 16, 14, locked ? '#8f8f8f' : '#fff6e0', 800);
    text(ctx, r.tag, M.x + M.w - 12, y + 16, 11, COLORS.gold, 700, 'right');
    let ix = M.x + 12;
    for (const ingId of r.needs) {
      const ing = INGREDIENTS[ingId];
      drawIngredientIcon(ctx, ing.icon, ix + 11, y + 46, 20, true);
      ix += 34;
    }
    text(ctx, `${r.base} poin`, M.x + M.w - 12, y + 46, 12, '#c9a06a', 700, 'right');
  });
}

function drawTray(ctx, state) {
  const T = LAYOUT.tray;
  text(ctx, 'TANGANMU', T.x + 4, T.y - 20, 13, '#c9a06a', 800);
  for (let i = 0; i < TUNING.trayMax; i++) {
    const x = T.x + 10 + i * (LAYOUT.traySlot.w + LAYOUT.traySlot.gap);
    const y = T.y + 14;
    rr(ctx, x, y, LAYOUT.traySlot.w, LAYOUT.traySlot.h, 10);
    ctx.fillStyle = 'rgba(255,246,224,0.08)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,246,224,0.25)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    const ingId = state.tray[i];
    if (ingId) {
      const ing = INGREDIENTS[ingId];
      drawIngredientIcon(ctx, ing.icon, x + 26, y + 32, 34, false);
      text(ctx, ing.name, x + 48, y + 26, 13, '#fff6e0', 700);
      text(ctx, ing.station === 'wok' ? '→ WOK' : '→ GRILL', x + 48, y + 46, 10, '#c9a06a', 700);
    }
  }
}

function drawComboPanel(ctx, state) {
  const C = LAYOUT.combo;
  rr(ctx, C.x, C.y, C.w, C.h, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  if (state.combo >= 2) {
    flame(ctx, C.x + 24, C.y + 26, 26, '#ff5722');
    text(ctx, `KOMBO x${state.combo}`, C.x + 44, C.y + 27, 16, '#ffab91', 800);
    const frac = Math.max(0, state.comboLeft / TUNING.comboWindowSeconds);
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    rr(ctx, C.x + 200, C.y + 18, 160, 12, 6);
    ctx.fill();
    ctx.fillStyle = '#ff5722';
    rr(ctx, C.x + 200, C.y + 18, Math.max(8, 160 * frac), 12, 6);
    ctx.fill();
    text(ctx, 'sajikan lagi!', C.x + 372, C.y + 27, 11, '#ffccbc', 600);
  } else {
    text(ctx, 'Sajikan 2 hidangan beruntun untuk menyalakan KOMBO', C.x + 16, C.y + 27, 13, 'rgba(255,246,224,0.55)', 600);
  }
}

function drawLog(ctx, state) {
  const L = LAYOUT.log;
  rr(ctx, L.x, L.y, L.w, L.h, 10);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  text(ctx, `Dimasak: ${state.stats.cooked}   Gosong: ${state.stats.burned}   Hangus: ${state.stats.lost}`, L.x + 14, L.y + 27, 13, '#c9a06a', 700);
}

function drawCounter(ctx, state) {
  const C = LAYOUT.counter;
  text(ctx, 'COUNTER BAHAN — klik untuk mengambil', C.x + 4, C.y - 20, 13, '#c9a06a', 800);
  INGREDIENT_ORDER.forEach((ingId, i) => {
    const ing = INGREDIENTS[ingId];
    const x = C.x + i * (LAYOUT.bin.w + LAYOUT.bin.gap);
    const y = C.y;
    rr(ctx, x, y, LAYOUT.bin.w, LAYOUT.bin.h, 12);
    ctx.fillStyle = COLORS.wood;
    ctx.fill();
    ctx.strokeStyle = COLORS.woodLight;
    ctx.lineWidth = 2;
    ctx.stroke();
    // shelf shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    rr(ctx, x + 8, y + 8, LAYOUT.bin.w - 16, 54, 8);
    ctx.fill();
    drawIngredientIcon(ctx, ing.icon, x + 44, y + 36, 52, false);
    text(ctx, ing.name, x + 78, y + 28, 17, '#fff6e0', 800);
    text(ctx, ing.station === 'wok' ? 'WOK' : 'GRILL', x + 78, y + 50, 12, COLORS.gold, 800);
    ctx.fillStyle = '#3a2418';
    rr(ctx, x + 14, y + 76, 56, 30, 8);
    ctx.fill();
    text(ctx, ing.key, x + 42, y + 92, 16, '#fff6e0', 800, 'center');
    text(ctx, 'klik / tombol', x + 78, y + 92, 11, '#e8c9a0', 600);
    // tray count of this ingredient
    const n = state.tray.filter((t) => t === ingId).length;
    if (n > 0) {
      ctx.fillStyle = COLORS.green;
      ctx.beginPath();
      ctx.arc(x + LAYOUT.bin.w - 20, y + 20, 13, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, String(n), x + LAYOUT.bin.w - 20, y + 21, 13, '#fff', 800, 'center');
    }
  });
}

function drawHint(ctx) {
  const H = LAYOUT.hint;
  text(ctx, 'Klik bahan (Q W E R T Y)  •  1 = Wok, 2 = Grill  •  Spasi = sajikan  •  P = jeda', H.x, H.y + 8, 12, 'rgba(255,246,224,0.45)', 600);
}

function drawParticles(ctx, state) {
  for (const pt of state.particles) {
    ctx.globalAlpha = Math.max(0, 1 - pt.t / pt.life);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawPopups(ctx, state) {
  for (const p of state.popups) {
    ctx.globalAlpha = Math.max(0, 1 - p.t / p.life);
    outlinedText(ctx, p.text, p.x, p.y, 24, p.color, 900, 'center');
  }
  ctx.globalAlpha = 1;
}

function drawBanner(ctx, state) {
  if (!state.banner) return;
  const b = state.banner;
  const a = b.t < 0.15 ? b.t / 0.15 : b.t > b.life - 0.3 ? Math.max(0, (b.life - b.t) / 0.3) : 1;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.fillStyle = 'rgba(22,12,6,0.85)';
  rr(ctx, 390, 300, 500, 76, 12);
  ctx.fill();
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 2;
  ctx.stroke();
  outlinedText(ctx, b.text, 640, 326, 26, COLORS.gold, 900, 'center');
  if (b.sub) text(ctx, b.sub, 640, 356, 14, '#fff6e0', 600, 'center');
  ctx.restore();
}

// ---------------------------------------------------------------- screens
function drawTitle(ctx, state) {
  // dimmed kitchen behind
  ctx.fillStyle = 'rgba(22,12,6,0.72)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  flame(ctx, 640, 150, 64, '#f07b1d');
  outlinedText(ctx, 'DAPUR KILAT', 640, 220, 72, '#fff6e0', 900, 'center');
  text(ctx, 'Warung cepat saji — masak, sajikan, jangan sampai gosong!', 640, 272, 20, COLORS.gold, 700, 'center');
  // how to play
  const lines = [
    '1. Klik bahan di counter untuk mengambilnya (maks 3).',
    '2. Klik WOK atau GRILL untuk memasak bahan yang cocok.',
    '3. Ambil masakan matang ke piring, lengkapi sesuai resep.',
    '4. Klik tiket pesanan yang cocok untuk menyajikan. Cepat = poin besar!',
  ];
  lines.forEach((ln, i) => text(ctx, ln, 640, 330 + i * 30, 16, '#fff6e0', 600, 'center'));
  // start button
  const B = LAYOUT.startButton;
  ctx.save();
  ctx.shadowColor = 'rgba(242,193,78,0.7)';
  ctx.shadowBlur = 18;
  rr(ctx, B.x, B.y, B.w, B.h, 14);
  ctx.fillStyle = COLORS.gold;
  ctx.fill();
  ctx.restore();
  outlinedText(ctx, 'MULAI MASAK', B.x + B.w / 2, B.y + B.h / 2 + 1, 26, '#2b1a12', 900, 'center');
  text(ctx, 'atau tekan Enter', 640, B.y + B.h + 28, 13, 'rgba(255,246,224,0.6)', 600, 'center');
  const best = Number(localStorage.getItem('dapurkilat_best') || 0);
  if (best > 0) text(ctx, `Skor terbaik: ${best}`, 640, B.y + B.h + 54, 14, COLORS.gold, 800, 'center');
}

function drawPause(ctx) {
  ctx.fillStyle = 'rgba(22,12,6,0.7)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  outlinedText(ctx, 'JEDA', 640, 360, 64, '#fff6e0', 900, 'center');
  text(ctx, 'Tekan P atau klik untuk lanjut', 640, 420, 18, COLORS.gold, 600, 'center');
}

function drawOver(ctx, state) {
  ctx.fillStyle = 'rgba(22,12,6,0.78)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  outlinedText(ctx, 'DAPUR TUTUP', 640, 300, 56, '#ff8a80', 900, 'center');
  text(ctx, state.overReason, 640, 350, 18, '#fff6e0', 600, 'center');
  text(ctx, `Level ${state.level}  •  ${state.served} hidangan tersaji  •  ${state.stats.burned} gosong`, 640, 384, 16, '#c9a06a', 600, 'center');
  const B = LAYOUT.startButton;
  rr(ctx, B.x, B.y, B.w, B.h, 14);
  ctx.fillStyle = COLORS.gold;
  ctx.fill();
  outlinedText(ctx, 'MAIN LAGI', B.x + B.w / 2, B.y + B.h / 2 + 1, 26, '#2b1a12', 900, 'center');
  text(ctx, 'atau tekan Enter', 640, B.y + B.h + 28, 13, 'rgba(255,246,224,0.6)', 600, 'center');
}

// ---------------------------------------------------------------- main entry
/** Paint one frame of the game onto ctx. */
export function render(ctx, state) {
  ctx.save();
  if (state.shake > 0) {
    ctx.translate((Math.random() - 0.5) * state.shake, (Math.random() - 0.5) * state.shake);
  }
  drawBackground(ctx);
  drawHud(ctx, state);
  drawBoard(ctx, state);
  drawStation(ctx, state, 'wok', LAYOUT.wok, 'WOK', 'Nasi · Mie · Telur');
  drawStation(ctx, state, 'grill', LAYOUT.grill, 'GRILL', 'Ayam · Cabai · Sayur');
  drawPlate(ctx, state);
  drawMenu(ctx, state);
  drawTray(ctx, state);
  drawComboPanel(ctx, state);
  drawLog(ctx, state);
  drawCounter(ctx, state);
  drawHint(ctx);
  drawParticles(ctx, state);
  drawPopups(ctx, state);
  drawBanner(ctx, state);
  ctx.restore();
  if (state.screen === 'title') drawTitle(ctx, state);
  if (state.screen === 'pause') drawPause(ctx);
  if (state.screen === 'over') drawOver(ctx, state);
}
