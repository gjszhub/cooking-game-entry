# Dapur Kilat — Warung Cepat Saji

[![make.fun](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/gjszhub/cooking-game-entry/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/gjszhub/cooking-game-entry/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137)

A complete, original 2D cooking game that runs offline in a desktop browser
from static files. You run a small Indonesian street-food kitchen: orders
land on the order board, you grab ingredients from the counter, cook them on
the wok or the grill, assemble the dish on the plate, and serve before the
customer's patience runs out. Serve fast to build a combo; lose three orders
and the kitchen closes.

Five original recipes (Nasi Goreng Kilat, Mie Goreng Pedas, Sate Ayam Bakar,
Nasi Ayam Geprek, Mie Tek-Tek Spesial), two cooking stations with their own
ingredients, cook timers, burnt food to throw away, rising difficulty
(more orders, shorter patience, four-ingredient dishes from level 2), and
instant feedback on every action: floating score popups, steam, flames,
screen shake, and a service rush you can read at a glance.

## How to play

- Click an ingredient on the counter (or press Q W E R T Y) to take it.
  Your hand holds up to 3.
- Click the WOK (key 1) or GRILL (key 2) to cook what it accepts:
  wok takes Nasi, Mie, Telur; grill takes Ayam, Cabai, Sayur.
- Click a finished dish on a station to move it to the plate.
  Food left on a station too long burns — click it to throw it away.
- When the plate holds exactly a ticket's recipe, the ticket glows green:
  click it (or press Space) to serve. Fast serves pay more.
- P = pause. Three lost orders end the run.

## Play it locally

```sh
# serve game/ on localhost, then open it in desktop Chrome
python3 -m http.server 8123 --directory game
# or: node --run serve  (any static server works; the game makes no network requests)
```

Staged screenshots (real renders of the game's own code):

```sh
# ?shot=title | play | serve | rush
http://localhost:8123/?shot=play
```

## Files

- `game/` — the playable game as static files: `index.html`, `style.css`,
  and one module per job (`config.js`, `state.js`, `world.js`, `render.js`,
  `input.js`, `audio.js`, `main.js`). Vanilla JavaScript only, no libraries,
  no external assets; all art is drawn with canvas shapes.
- `screenshots/` — 4 real renders of the game in the browser.
- `main.ts` — the hand-in program (Node 22, stdlib only): copies `game/`
  and `screenshots/` to `$MAKEFUN_OUTPUT_DIR` (default `/output`) and
  writes `/output/dossier.json` with `buildDossier` from
  `vendor/makefun-game.ts`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
