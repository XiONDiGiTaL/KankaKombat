// Stage backdrops, drawn from the four approved stage concepts. Each section composes
// layered offscreen canvases (banded sky, far skyline, mid landmarks, street facades,
// fighting plane) that scroll at different speeds. Every pixel is an integer rect: no
// gradients, no anti-aliasing. Decorations stay behind the flat fighting plane.

import { SCREEN_H, SCREEN_W, STREET_TOP } from '../../shared/data/constants';
import { SectionDef, ShopSpot } from '../../shared/data/stages';
import { SHOPS, ShopStyle } from '../../shared/data/shops';
import { Rng } from '../../shared/sim/rng';
import { drawText, titleWidth } from './font';

export interface BgLayers { sky: HTMLCanvasElement; far: HTMLCanvasElement; mid: HTMLCanvasElement; near: HTMLCanvasElement; floor: HTMLCanvasElement; fg: HTMLCanvasElement; farF: number; midF: number; fgF: number }

type Ctx = CanvasRenderingContext2D;
const canvas = (w: number, h: number): [HTMLCanvasElement, Ctx] => {
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, h);
  const x = c.getContext('2d')!; x.imageSmoothingEnabled = false; return [c, x];
};
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => {
  c.fillStyle = col;
  c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
};
const P = (c: Ctx, x: number, y: number, col: string) => R(c, x, y, 1, 1, col);
const OUT = '#141019';

/** What the NYC storefronts advertise in neon. Drawn with the title font, so every letter
 *  and mark here must exist in the glyph tables — the coverage test in tests/font.test.ts
 *  paints this list, which is how the cent sign was found missing. */
export const NEON_WORDS = ['PIZZA', 'DELI', 'BAR', 'PAWN', 'LAUNDRY', '99¢', 'NAILS', 'LIQUOR'];

/** Banded sky with a one-pixel checker dither where two bands meet. */
function sky(c: Ctx, bands: string[], h: number, stars = 0, rng?: Rng): void {
  const bh = h / bands.length;
  bands.forEach((col, i) => {
    const y = Math.round(i * bh);
    R(c, 0, y, SCREEN_W, Math.ceil(bh) + 1, col);
    if (i > 0) {
      const prev = bands[i - 1];
      for (let x = 0; x < SCREEN_W; x += 2) {
        P(c, x + (i % 2), y - 1, prev);
        P(c, x + ((i + 1) % 2), y, col);
      }
    }
  });
  if (stars && rng) for (let i = 0; i < stars; i++) {
    const x = rng.int(0, SCREEN_W), y = rng.int(0, Math.floor(h * 0.55));
    P(c, x, y, rng.chance(0.4) ? '#fff6c0' : '#c8d0ff');
    if (rng.chance(0.12)) { P(c, x + 1, y, '#8a90c0'); P(c, x, y + 1, '#8a90c0'); }
  }
}

/** Long, thin cloud bars: the sunset and dawn streaks the concept strips use instead of puffs. */
function streakClouds(c: Ctx, w: number, rng: Rng, y0: number, y1: number, col: string, hi: string): void {
  for (let i = 0; i < Math.max(3, Math.round(w / 60)); i++) {
    const y = rng.int(y0, y1), x = rng.int(-20, w), len = rng.int(18, 70);
    R(c, x, y, len, 2, col);
    R(c, x + 4, y, Math.max(4, len - 12), 1, hi);
    if (rng.chance(0.4)) R(c, x + rng.int(0, Math.max(1, len - 12)), y - 2, rng.int(8, 22), 1, col);
  }
}

/** A few 1px spokes around a low sun, so the disc reads as light rather than a sticker. */
function sunRays(c: Ctx, cx: number, cy: number, r: number, col: string): void {
  c.globalAlpha = 0.2;
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 + 0.1;
    const x0 = cx + Math.cos(a) * (r + 3), y0 = cy + Math.sin(a) * (r + 3);
    const len = r + (k % 2 ? 16 : 8);
    for (let t = 0; t < len; t += 2) P(c, x0 + Math.cos(a) * t, y0 + Math.sin(a) * t, col);
  }
  c.globalAlpha = 1;
}

function disc(c: Ctx, cx: number, cy: number, r: number, col: string, top = false): void {
  c.fillStyle = col;
  for (let y = -r; y <= (top ? 0 : r); y++) {
    const w = Math.round(Math.sqrt(Math.max(0, r * r - y * y)));
    c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1);
  }
}

function glowDisc(c: Ctx, cx: number, cy: number, r: number, col: string, halo: string): void {
  c.globalAlpha = 0.18;
  disc(c, cx, cy, r + 8, halo);
  c.globalAlpha = 0.3;
  disc(c, cx, cy, r + 4, halo);
  c.globalAlpha = 1;
  disc(c, cx, cy, r, col);
}

function windows(c: Ctx, x: number, y: number, w: number, h: number, rng: Rng, lit: string, dark: string, ww = 3, wh = 4, gx = 4, gy = 5, litP = 0.5, frame = OUT): void {
  for (let yy = y + gy; yy + wh < y + h - 2; yy += wh + gy)
    for (let xx = x + gx; xx + ww < x + w - 1; xx += ww + gx) {
      R(c, xx - 1, yy - 1, ww + 2, wh + 2, frame);
      R(c, xx, yy, ww, wh, rng.chance(litP) ? lit : dark);
      if (rng.chance(0.3)) P(c, xx, yy, '#fff6d0');
    }
}

function cornice(c: Ctx, x: number, y: number, w: number, col: string, hi: string): void {
  R(c, x - 1, y - 2, w + 2, 2, OUT);
  R(c, x, y - 2, w, 1, hi);
  R(c, x, y, w, 2, col);
  R(c, x, y + 2, w, 1, OUT);
}

function fireEscape(c: Ctx, x: number, y: number, w: number, floors: number, col = '#2a2a32', hi = '#4a4a54'): void {
  for (let i = 0; i < floors; i++) {
    const yy = y + i * 10;
    R(c, x, yy, w, 1, hi); R(c, x, yy + 1, w, 1, col);
    for (let k = 0; k < w; k += 3) R(c, x + k, yy - 4, 1, 4, col);
    R(c, x, yy - 5, w, 1, hi);
    // diagonal ladder
    for (let k = 0; k < 8; k++) P(c, x + w - 1 - k, yy + 5 + k, col), P(c, x + w - 2 - k, yy + 5 + k, hi);
  }
}

function waterTower(c: Ctx, x: number, base: number, s: number, wood: string, dark: string, hi: string): void {
  R(c, x - 4 * s, base - 12 * s, 1 * s, 12 * s, dark);
  R(c, x + 4 * s, base - 12 * s, 1 * s, 12 * s, dark);
  for (let i = 0; i < 5; i++) { P(c, x - 4 * s, base - 10 * s + i * 2, hi); P(c, x + 4 * s, base - 10 * s + i * 2, hi); }
  R(c, x - 6 * s, base - 22 * s, 13 * s, 11 * s, wood);
  R(c, x - 6 * s, base - 22 * s, 13 * s, 1, hi);
  R(c, x - 6 * s, base - 12 * s, 13 * s, 1, dark);
  R(c, x - 7 * s, base - 24 * s, 15 * s, 2 * s, dark);
  R(c, x - 2 * s, base - 20 * s, 5 * s, 1, dark);
  for (let i = 0; i < 4; i++) R(c, x - 5 * s + i * 3 * s, base - 25 * s, 2 * s, 1, wood);
}

function awning(c: Ctx, x: number, y: number, w: number, a: string, b: string, scallop = true): void {
  R(c, x - 1, y - 1, w + 2, 8, OUT);
  for (let i = 0; i < w; i += 4) R(c, x + i, y, Math.min(4, w - i), 6, (i / 4) % 2 ? a : b);
  for (let i = 0; i < w; i += 4) R(c, x + i, y, Math.min(2, w - i), 1, '#ffffff30');
  if (scallop) for (let i = 0; i < w; i += 4) R(c, x + i + 1, y + 6, 2, 2, (i / 4) % 2 ? a : b);
  R(c, x, y + 7, w, 1, OUT);
}

function signBoard(c: Ctx, x: number, y: number, text: string, bg: string, fg: string, w?: number, font = false): void {
  const tw = Math.max(20, text.length * 6 + 6);
  // never draw lettering outside its board: the box grows to the text, whatever the caller asked for
  const ww = Math.max(w ?? tw, tw, font ? titleWidth(text) + 8 : 0);
  // signage keeps a flat fill (a two-tone bevel would darken the lower rows into the board)
  const hh = font ? 11 : 9;
  R(c, x - ww / 2 - 1, y - 1, ww + 2, hh + 2, OUT);
  R(c, x - ww / 2, y, ww, hh, bg);
  R(c, x - ww / 2, y, ww, 1, '#ffffff40');
  // long names on a narrow booth sign drop to the compact HUD face rather than
  // spilling the title lettering over both neighbours
  const titleFits = titleWidth(text) + 6 <= ww;
  if (font && titleFits) drawText(c, text, x, y + Math.round((hh - 8) / 2) + 1, fg, { align: 'center', shadow: null, font: 'title', flatTitle: true });
  else drawText(c, text, x, y + Math.round((hh - 7) / 2), fg, { align: 'center', shadow: null });
}

function palm(c: Ctx, x: number, base: number, h: number, trunk = '#7a5230', leaf = '#2a7a3a', leaf2 = '#3a9a4a'): void {
  for (let i = 0; i < h; i++) {
    const xx = x + Math.round(Math.sin(i / h * 1.8) * 3);
    R(c, xx, base - i, 3, 1, i % 5 === 0 ? '#5a3a1c' : trunk);
  }
  const tx = x + Math.round(Math.sin(1.8) * 3) + 1, ty = base - h;
  const dirs: [number, number][] = [[-1, 0.1], [1, 0.1], [-0.8, 0.55], [0.8, 0.55], [-0.45, 0.75], [0.45, 0.75], [-0.9, -0.25], [0.9, -0.25]];
  for (const [dx, dy] of dirs) for (let i = 1; i < 15; i++) {
    const px = tx + dx * i, py = ty + dy * i + (i * i) / 26;
    R(c, px, py, 2, 2, i % 3 ? leaf : leaf2);
    if (i % 2 === 0) R(c, px, py - 1, 1, 1, leaf2);
  }
  disc(c, tx, ty + 2, 2, '#4a3020');
}

function flagTR(c: Ctx, x: number, y: number): void {
  R(c, x, y, 1, 16, '#d8d8d0');
  R(c, x + 1, y + 1, 10, 7, '#d0202c');
  R(c, x + 4, y + 3, 3, 3, '#f6f6f2');
  P(c, x + 5, y + 4, '#d0202c');
}

function gull(c: Ctx, x: number, y: number): void {
  P(c, x, y, '#f0f0f0'); P(c, x + 1, y - 1, '#f0f0f0'); P(c, x + 2, y, '#d0d0d0');
  P(c, x + 3, y - 1, '#f0f0f0'); P(c, x + 4, y, '#f0f0f0');
}

// ---------------------------------------------------------------- storefronts
const STYLE = {
  ny: { wall: '#7a3428', trim: '#3a1a16', aw: ['#c82430', '#f0ece0'], signBg: '#141018', signFg: '#f0d838', win: '#f6d888' },
  izmir: { wall: '#e8d0a8', trim: '#8a5a3a', aw: ['#2a6ab0', '#f6f2ea'], signBg: '#f6ead0', signFg: '#8a2a1a', win: '#f6c860' },
  istanbul: { wall: '#d8b888', trim: '#6a4a2a', aw: ['#3a8a4a', '#f6f2ea'], signBg: '#2a2018', signFg: '#e8c040', win: '#f6d888' },
  tampa: { wall: '#f0e0c0', trim: '#c07a3a', aw: ['#3a8ac0', '#f6f6f2'], signBg: '#f6e8b8', signFg: '#3a5a8a', win: '#9ad8f0' },
} as const;

/** Standing shopkeeper behind a counter or in a doorway. Flat 1:1 pixel blocks, no outline,
 *  the same construction as the rest of the street art. */
function keeper(c: Ctx, x: number, base: number, o: { skin?: string; shirt?: string; hair?: string; apron?: string; hat?: 'cap' | 'flat' | 'none'; mustache?: boolean } = {}): void {
  const skin = o.skin ?? '#e8b088', shirt = o.shirt ?? '#4a6a9a', hair = o.hair ?? '#2a1a12';
  c.globalAlpha = 0.25; R(c, x - 6, base - 1, 13, 1, '#0e0812'); c.globalAlpha = 1;
  // legs + torso
  R(c, x - 4, base - 9, 3, 8, '#2a2a34'); R(c, x + 2, base - 9, 3, 8, '#2a2a34');
  R(c, x - 3, base - 10, 7, 2, '#1a1a22');
  R(c, x - 6, base - 22, 12, 13, shirt);
  R(c, x - 6, base - 22, 12, 1, '#ffffff28');
  R(c, x - 6, base - 12, 12, 1, '#00000030');
  if (o.apron) R(c, x - 4, base - 16, 8, 7, o.apron);
  // arms + hands
  R(c, x - 8, base - 21, 2, 8, shirt); R(c, x + 6, base - 21, 2, 8, shirt);
  R(c, x - 8, base - 14, 2, 2, skin); R(c, x + 6, base - 14, 2, 2, skin);
  // head
  R(c, x - 4, base - 30, 9, 8, skin);
  R(c, x - 4, base - 30, 9, 2, hair);
  R(c, x - 5, base - 28, 1, 4, hair); R(c, x + 5, base - 28, 1, 4, hair);
  P(c, x - 2, base - 25, '#1a1220'); P(c, x + 2, base - 25, '#1a1220');
  if (o.mustache) R(c, x - 2, base - 23, 5, 1, hair);
  if (o.hat === 'cap') { R(c, x - 5, base - 31, 11, 3, '#d02830'); R(c, x - 7, base - 28, 5, 1, '#a8202a'); }
  else if (o.hat === 'flat') { R(c, x - 5, base - 31, 11, 3, '#5a4a3a'); R(c, x - 6, base - 28, 13, 1, '#3a2e22'); }
}

/** Small paper lantern, the kind strung along İstanbul and İzmir shopfronts. */
function lantern(c: Ctx, x: number, y: number, body = '#e8b040', glow = '#fff0b0'): void {
  R(c, x, y, 1, 6, '#3a2a1a');
  R(c, x - 3, y + 6, 7, 2, body);
  R(c, x - 4, y + 8, 9, 6, body);
  R(c, x - 3, y + 9, 7, 2, glow);
  R(c, x - 4, y + 14, 9, 1, '#a8701a');
  P(c, x, y + 15, '#a8701a');
}

/** Produce crate: slatted wood with a heap of fruit or vegetables on top. */
function produceCrate(c: Ctx, x: number, base: number, cols: string[], w = 16): void {
  R(c, x, base - 8, w, 8, '#a8703a');
  R(c, x, base - 8, w, 1, '#c8904a');
  for (let i = 2; i < w - 1; i += 4) R(c, x + i, base - 8, 1, 8, '#7a4a22');
  R(c, x, base - 3, w, 1, '#7a4a22');
  for (let i = 1; i < w - 1; i += 3) for (let j = 0; j < 2; j++) P(c, x + i + j, base - 9 - (i % 2), cols[(i + j) % cols.length]);
}

/** Double-handled burlap sack with a mound of spice on top. */
function spiceSack(c: Ctx, x: number, base: number, col: string): void {
  R(c, x + 1, base - 10, 9, 10, '#b89a6a');
  R(c, x + 1, base - 10, 9, 1, '#d0b482');
  R(c, x + 3, base - 12, 5, 2, col);
  R(c, x + 4, base - 13, 3, 1, col);
  R(c, x, base - 9, 1, 4, '#8a6a3a'); R(c, x + 10, base - 9, 1, 4, '#8a6a3a');
}

function shopFront(c: Ctx, spot: ShopSpot, style: keyof typeof STYLE): void {
  const shop = SHOPS[spot.shop];
  const s = STYLE[style];
  const x = spot.x, top = STREET_TOP - 64, W = 96;
  const left = x - W / 2;
  // wall, with the brick/stone coursing that suits the city
  R(c, left, top, W, STREET_TOP - top, s.wall);
  R(c, left, top, W, 2, s.trim);
  R(c, left, top, 2, STREET_TOP - top, s.trim); R(c, left + W - 2, top, 2, STREET_TOP - top, s.trim);
  if (style === 'ny') {
    for (let yy = top + 4; yy < STREET_TOP - 20; yy += 4) for (let xx = left + 3; xx < left + W - 2; xx += 5) P(c, xx + ((yy / 4) % 2 ? 2 : 0), yy, '#4a241e');
  } else {
    for (let yy = top + 4; yy < STREET_TOP - 18; yy += 5) R(c, left + 1, yy, W - 2, 1, '#00000018');
    for (let yy = top + 7; yy < STREET_TOP - 18; yy += 10) for (let xx = left + 6 + (yy % 20 ? 5 : 0); xx < left + W - 6; xx += 11) R(c, xx, yy, 6, 3, '#00000014');
  }
  cornice(c, left - 2, top, W + 4, s.trim, '#f6e8b8');

  // signboard with the shop's own name in the chunky title font
  signBoard(c, x, top + 4, shop.name, s.signBg, s.signFg, Math.min(W - 8, shop.name.length * 13 + 10), true);
  if (shop.id === 'bodega') {
    // the little window plate every bodega has: open all night
    R(c, x + 18, STREET_TOP - 32, 26, 6, '#141018');
    drawText(c, 'OPEN 24/7', x + 31, STREET_TOP - 31, '#f06a8a', { align: 'center', shadow: null });
  }

  // wide striped awning across the frontage, as on the reference sheet
  awning(c, left + 4, STREET_TOP - 40, W - 8, s.aw[0], s.aw[1]);

  // two lit display windows with shelves of goods
  for (const wx of [left + 6, x + 14]) {
    R(c, wx - 1, STREET_TOP - 34, 28, 33, OUT);
    R(c, wx, STREET_TOP - 33, 26, 31, s.win);
    R(c, wx, STREET_TOP - 33, 26, 2, '#fff6d0');
    for (let row = 0; row < 3; row++) {
      R(c, wx + 1, STREET_TOP - 27 + row * 8, 24, 1, '#7a4a2a');
      for (let i = 0; i < 7; i++) {
        const col = shop.id === 'bakkal' ? ['#e0b06a', '#c88a3a', '#8aa83a', '#f6e8c8'][(i + row) % 4]
          : shop.id === 'pazar' ? ['#d8a020', '#c02a2a', '#8a6a2a', '#e0c070'][(i + row) % 4]
            : ['#d0202c', '#2a6ad0', '#f0c818', '#5aa83a', '#f6f2ea'][(i + row) % 5];
        P(c, wx + 2 + i * 3, STREET_TOP - 29 + row * 8, col);
        P(c, wx + 2 + i * 3, STREET_TOP - 28 + row * 8, col);
      }
    }
    // glass sheen and a hand-lettered note taped inside
    R(c, wx + 2, STREET_TOP - 31, 2, 9, '#ffffff40');
    R(c, wx + 16, STREET_TOP - 20, 7, 4, '#fffaf0'); P(c, wx + 18, STREET_TOP - 18, '#c02a2a');
    R(c, wx + 1, STREET_TOP - 6, 24, 4, '#2a1a14');
  }

  // door with warm light spilling out and the keeper waiting inside
  R(c, left + W / 2 - 12, STREET_TOP - 34, 24, 34, OUT);
  R(c, left + W / 2 - 11, STREET_TOP - 33, 22, 33, '#2a1a14');
  R(c, left + W / 2 - 9, STREET_TOP - 30, 18, 30, '#f6c860');
  R(c, left + W / 2 - 9, STREET_TOP - 30, 18, 8, '#ffe8a0');
  keeper(c, left + W / 2, STREET_TOP - 2, { shirt: shop.id === 'bodega' ? '#8a2a34' : '#4a6a9a', apron: shop.id === 'pazar' ? '#6a8a4a' : undefined, hat: shop.id === 'bodega' ? 'cap' : 'none', mustache: shop.id === 'pazar' });
  c.globalAlpha = 0.55; R(c, left + W / 2 - 9, STREET_TOP - 30, 18, 9, '#f6c860'); c.globalAlpha = 1;
  R(c, left + W / 2 + 7, STREET_TOP - 18, 2, 2, '#f0c040');

  // per-shop street furniture, lifted from the reference sheet
  switch (shop.id) {
    case 'bodega': {
      // fruit stand either side of the door and a stack of crates
      produceCrate(c, left + 3, STREET_TOP - 1, ['#d0202c', '#e8a020', '#5aa83a']);
      produceCrate(c, left + 3, STREET_TOP - 9, ['#8ac8ff', '#f0c818', '#d0202c'], 12);
      R(c, left + W - 22, STREET_TOP - 1, 18, 6, '#a8703a');
      R(c, left + W - 22, STREET_TOP - 1, 18, 1, '#c8904a');
      R(c, left + W - 20, STREET_TOP - 6, 14, 5, '#8a5a2a');
      break;
    }
    case 'bakkal': {
      // bread boards under the awning, olive jars, and the flag on its pole
      R(c, left + 3, STREET_TOP - 10, 18, 3, '#8a5a2a');
      for (let i = 0; i < 4; i++) { disc(c, left + 6 + i * 4, STREET_TOP - 12, 2, '#d8a050'); P(c, left + 6 + i * 4, STREET_TOP - 13, '#f0c878'); }
      for (const jx of [left + W - 20, left + W - 13]) { R(c, jx, STREET_TOP - 12, 6, 12, '#8a9aa8'); R(c, jx, STREET_TOP - 13, 6, 2, '#c8d8e0'); R(c, jx + 1, STREET_TOP - 9, 4, 6, '#4a6a3a'); }
      R(c, left + W - 30, STREET_TOP - 56, 1, 22, '#e8e4d4'); flagTR(c, left + W - 29, STREET_TOP - 56);
      break;
    }
    case 'pazar': {
      // lanterns, spice sacks and a rolled carpet: bazaar, not a mini-mart
      lantern(c, left + 6, STREET_TOP - 52); lantern(c, left + W - 8, STREET_TOP - 52);
      spiceSack(c, left + 3, STREET_TOP - 1, '#d8901a'); spiceSack(c, left + 14, STREET_TOP - 1, '#a8301a');
      spiceSack(c, left + W - 22, STREET_TOP - 1, '#c8a020'); spiceSack(c, left + W - 11, STREET_TOP - 1, '#7a8a2a');
      R(c, left + W - 32, STREET_TOP - 22, 6, 21, '#8a2a3a'); R(c, left + W - 32, STREET_TOP - 22, 6, 2, '#c8604a');
      R(c, left + W - 32, STREET_TOP - 14, 6, 2, '#e0b040'); R(c, left + W - 32, STREET_TOP - 8, 6, 2, '#e0b040');
      break;
    }
    default: {
      // tacos: service counter, surfboard and a chilli string
      R(c, left + W - 15, STREET_TOP - 44, 5, 44, '#f6f2e6'); R(c, left + W - 17, STREET_TOP - 46, 9, 4, '#e05a4a');
      R(c, left + W - 14, STREET_TOP - 30, 3, 3, '#e05a4a');
      for (let i = 0; i < 6; i++) { P(c, left + W - 16, STREET_TOP - 40 + i * 6, '#d0202c'); P(c, left + W - 15, STREET_TOP - 38 + i * 6, '#5aa83a'); }
      R(c, left + 3, STREET_TOP - 12, 14, 12, '#f0c040'); R(c, left + 4, STREET_TOP - 11, 12, 9, '#2a3a48');
      for (let i = 0; i < 3; i++) P(c, left + 6 + i * 4, STREET_TOP - 8, '#f6e8c0');
      break;
    }
  }

  // pavement step and the warm pool of light it throws onto the walk
  R(c, x - 22, STREET_TOP - 1, 44, 2, '#c8b8a8');
  R(c, x - 22, STREET_TOP + 1, 44, 1, OUT);
  c.globalAlpha = 0.12; R(c, x - 20, STREET_TOP + 2, 40, 5, '#ffe8a0'); c.globalAlpha = 1;
}

function vendorBooth(c: Ctx, spot: ShopSpot, style: keyof typeof STYLE): void {
  const shop = SHOPS[spot.shop];
  const x = spot.x;
  // the stall signs carry the reference sheet's one-word labels, not the full menu name
  const label = ({ hotdog: 'HOT DOG', simit: 'SİMİT', cay: 'ÇAY', tacotruck: 'TACOS' } as Record<string, string>)[shop.id] ?? shop.name;
  if (shop.id === 'hotdog') {
    // red umbrella, steam trays and a vendor in a cap
    keeper(c, x + 26, STREET_TOP - 1, { shirt: '#f6f2ea', apron: '#c82430', hat: 'cap', mustache: true });
    R(c, x - 24, STREET_TOP - 24, 48, 3, OUT);
    R(c, x - 22, STREET_TOP - 21, 44, 13, '#d02830');
    R(c, x - 22, STREET_TOP - 21, 44, 2, '#f06a60');
    R(c, x - 20, STREET_TOP - 15, 40, 6, '#c02028');
    R(c, x - 17, STREET_TOP - 12, 34, 4, '#f6e8c8');
    for (let i = 0; i < 4; i++) R(c, x - 15 + i * 8, STREET_TOP - 11, 5, 2, '#b8501a');
    for (let i = 0; i < 3; i++) { R(c, x - 12 + i * 3, STREET_TOP - 20, 2, 3, ['#f0c818', '#d0202c', '#5aa83a'][i]); }
    R(c, x - 14, STREET_TOP - 6, 4, 6, '#2a2a30'); R(c, x + 10, STREET_TOP - 6, 4, 6, '#2a2a30');
    R(c, x - 8, STREET_TOP - 34, 2, 11, '#5a5a60');
    for (let i = -20; i <= 20; i += 4) R(c, x + i, STREET_TOP - 36, 4, 5, i % 8 ? '#d02830' : '#f6e8c8');
    R(c, x - 22, STREET_TOP - 37, 48, 2, OUT);
    for (let i = 0; i < 2; i++) { const sx2 = x + 4 + i * 4; c.globalAlpha = 0.4; disc(c, sx2, STREET_TOP - 40 - i * 3, 2 + i, '#ffffff'); c.globalAlpha = 1; }
  } else if (shop.id === 'simit') {
    // glass case of simit, stacked rings on the side, vendor in a flat cap
    keeper(c, x + 26, STREET_TOP - 1, { shirt: '#8a7a6a', apron: '#f6f2ea', hat: 'flat', mustache: true });
    R(c, x - 24, STREET_TOP - 18, 48, 3, OUT);
    R(c, x - 22, STREET_TOP - 16, 44, 11, '#7a4a22');
    R(c, x - 22, STREET_TOP - 16, 44, 2, '#b8824a');
    R(c, x - 20, STREET_TOP - 33, 40, 17, '#b8d8e8');
    R(c, x - 19, STREET_TOP - 32, 38, 15, '#e8f6ff');
    R(c, x - 19, STREET_TOP - 32, 38, 1, '#ffffff');
    for (let i = 0; i < 6; i++) { disc(c, x - 15 + i * 6, STREET_TOP - 25, 2, '#c88a3a'); P(c, x - 15 + i * 6, STREET_TOP - 25, '#f6d87a'); }
    R(c, x - 24, STREET_TOP - 8, 6, 8, '#8a5a2a');
    for (let i = 0; i < 3; i++) { disc(c, x - 21, STREET_TOP - 11 - i * 2, 2, '#c88a3a'); }
    R(c, x - 16, STREET_TOP - 6, 3, 6, '#2a2222'); R(c, x + 12, STREET_TOP - 6, 3, 6, '#2a2222');
    signBoard(c, x - 4, STREET_TOP - 47, label, '#f6ead0', '#8a2a1a', 40, true);
  } else if (shop.id === 'cay') {
    // tea stand: samovar, tulip glasses, dried chillies, vendor with a moustache
    keeper(c, x + 2, STREET_TOP - 20, { shirt: '#f6f2ea', apron: '#c82430', mustache: true, hat: 'none' });
    R(c, x - 24, STREET_TOP - 34, 48, 3, OUT);
    R(c, x - 22, STREET_TOP - 31, 44, 20, '#7a2a22');
    R(c, x - 22, STREET_TOP - 31, 44, 3, '#c84830');
    R(c, x - 22, STREET_TOP - 12, 44, 3, '#5a1a12');
    R(c, x - 20, STREET_TOP - 28, 14, 13, '#d8a030');
    R(c, x - 18, STREET_TOP - 31, 10, 3, '#f0c860');
    R(c, x - 15, STREET_TOP - 15, 2, 4, '#6a4a1a');
    for (let i = 0; i < 3; i++) { R(c, x + 8 + i * 4, STREET_TOP - 25, 2, 4, '#e8e8e0'); P(c, x + 8 + i * 4, STREET_TOP - 23, '#b05a20'); }
    for (let i = 0; i < 4; i++) { P(c, x - 3 + i * 4, STREET_TOP - 22, '#a8301a'); }
    R(c, x - 2, STREET_TOP - 30, 2, 14, '#2a2a2a');
    R(c, x - 4, STREET_TOP - 16, 10, 2, '#f0c040');
    for (let i = -22; i <= 22; i += 4) R(c, x + i, STREET_TOP - 38, 3, 5, i % 8 ? '#c82430' : '#f6e8c8');
    R(c, x - 24, STREET_TOP - 39, 48, 2, OUT);
    signBoard(c, x, STREET_TOP - 62, label, '#2a2018', '#e8c040', 44, true);
    R(c, x - 14, STREET_TOP - 50, 2, 12, '#3a2a1a'); R(c, x + 12, STREET_TOP - 50, 2, 12, '#3a2a1a');
  } else {
    // taco truck with the hatch open and the cook leaning out
    R(c, x - 38, STREET_TOP - 36, 76, 28, OUT);
    R(c, x - 36, STREET_TOP - 35, 72, 26, '#f0c040');
    R(c, x - 36, STREET_TOP - 35, 72, 8, '#e8a820');
    R(c, x - 36, STREET_TOP - 21, 72, 2, '#c88010');
    R(c, x - 28, STREET_TOP - 30, 38, 15, '#2a3a4a');
    R(c, x - 27, STREET_TOP - 29, 36, 13, '#f6e8c0');
    // the cook, just head and shoulders showing through the hatch
    R(c, x - 6, STREET_TOP - 25, 13, 5, '#3a8a4a');
    R(c, x - 4, STREET_TOP - 28, 7, 7, '#e8b088');
    R(c, x - 5, STREET_TOP - 29, 9, 2, '#2a1a12');
    R(c, x - 6, STREET_TOP - 32, 11, 3, '#d02830'); R(c, x - 8, STREET_TOP - 29, 4, 1, '#a8202a');
    P(c, x - 2, STREET_TOP - 26, '#1a1220'); P(c, x + 2, STREET_TOP - 26, '#1a1220');
    R(c, x - 2, STREET_TOP - 24, 5, 1, '#2a1a12');
    for (let i = 0; i < 4; i++) P(c, x - 24 + i * 8, STREET_TOP - 26, '#c02a2a');
    R(c, x - 24, STREET_TOP - 20, 30, 2, '#8a6a3a');
    R(c, x + 14, STREET_TOP - 30, 16, 16, '#2a3a4a');
    R(c, x + 15, STREET_TOP - 29, 14, 14, '#f6e8c0');
    for (let i = 0; i < 3; i++) R(c, x + 17, STREET_TOP - 26 + i * 4, 10, 1, '#8a6a3a');
    R(c, x - 32, STREET_TOP - 10, 11, 10, '#1a1a1a'); R(c, x + 18, STREET_TOP - 10, 11, 10, '#1a1a1a');
    R(c, x - 30, STREET_TOP - 8, 7, 6, '#8a8a90'); R(c, x + 20, STREET_TOP - 8, 7, 6, '#8a8a90');
    R(c, x - 24, STREET_TOP - 37, 2, 3, '#f0c040');
    for (let i = -30; i <= 26; i += 6) P(c, x + i, STREET_TOP - 38 - (i % 12 === 0 ? 1 : 0), '#f6e8c0');
    signBoard(c, x - 2, STREET_TOP - 44, label, '#f6e8b8', '#3a5a8a', 58, true);
    R(c, x - 40, STREET_TOP - 4, 80, 3, '#8a7a6a');
  }
  if (style !== 'ny') R(c, x - 24, STREET_TOP - 2, 48, 2, '#c8b8a8');
}

/** A shop standing on an imported stage strip: the strip already drew the street, so the shop
 *  is a free-standing booth rather than a facade cut into the wall. Striped awning, a counter
 *  with the goods on it, crates at the ends and the keeper behind — the bazaar booth the
 *  reference sheet is full of, which reads as a shop without fighting the painted skyline. */
function marketStall(c: Ctx, spot: ShopSpot, style: ShopStyle): void {
  const shop = SHOPS[spot.shop];
  const s = STYLE[style];
  const x = Math.round(spot.x), base = STREET_TOP - 1;
  const W = 60, left = x - W / 2;
  const label = ({ hotdog: 'HOT DOG', simit: 'SİMİT', cay: 'ÇAY', tacotruck: 'TACOS', bodega: 'BODEGA', bakkal: 'BAKKAL', pazar: 'PAZAR', tacos: 'TACOS', newsstand: 'NEWS' } as Record<string, string>)[shop.id] ?? shop.name;
  const goods = shop.id === 'bodega' || shop.id === 'newsstand' ? ['#d0202c', '#e8a020', '#5aa83a']
    : shop.id === 'bakkal' ? ['#e0b06a', '#c88a3a', '#8aa83a']
      : shop.id === 'pazar' ? ['#d8a020', '#c02a2a', '#8a6a2a', '#e0c070']
        : ['#f0c040', '#c02a2a', '#3a9a4a'];

  // shadow under the stall, so it sits on the pavement instead of floating
  c.globalAlpha = 0.3; R(c, left + 2, base, W - 4, 2, '#0e0812'); c.globalAlpha = 1;

  // the keeper behind the counter, head and shoulders over the boards
  keeper(c, x + 10, base - 8, {
    shirt: shop.id === 'bodega' ? '#8a2a34' : style === 'ny' ? '#4a6a9a' : '#c8a06a',
    apron: style === 'ny' ? '#f6f2ea' : '#6a8a4a',
    hat: style === 'ny' ? 'cap' : 'flat',
    mustache: style !== 'ny',
  });

  // back boards: dark interior with shelves of stock, kept low so the skyline stays visible
  R(c, left + 3, base - 30, W - 6, 20, '#3a2a1c');
  for (let row = 0; row < 2; row++) {
    R(c, left + 5, base - 24 + row * 8, W - 10, 1, '#6a4a2a');
    for (let i = 0; i < 9; i++) {
      P(c, left + 7 + i * 5, base - 26 + row * 8, goods[(i + row) % goods.length]);
      P(c, left + 7 + i * 5, base - 25 + row * 8, goods[(i + row + 1) % goods.length]);
    }
  }

  // striped awning over the booth, scalloped at the front edge
  awning(c, left, base - 38, W, s.aw[0], s.aw[1]);
  // posts down to the pavement
  R(c, left + 1, base - 32, 2, 32, '#4a3220'); R(c, left + W - 3, base - 32, 2, 32, '#4a3220');

  // counter: boards with the day's produce heaped on them and a paper price tag
  R(c, left + 1, base - 15, W - 2, 2, '#c8a878');
  R(c, left + 1, base - 13, W - 2, 13, '#8a5a32');
  for (let i = 2; i < W - 2; i += 5) R(c, left + i, base - 13, 1, 13, '#6a4222');
  R(c, left + 1, base - 3, W - 2, 2, '#5a3a1c');
  produceCrate(c, left + 3, base - 15, goods, 14);
  produceCrate(c, left + W - 19, base - 15, goods.slice().reverse(), 14);
  R(c, x + 2, base - 27, 8, 5, '#f6f2e6'); P(c, x + 4, base - 25, '#c02a2a');

  // crates and a sack stacked at the ends, and the shop's own sign above the awning
  produceCrate(c, left - 13, base, goods, 13);
  spiceSack(c, left + W + 2, base, goods[0]);
  signBoard(c, x, base - 53, label, s.signBg, s.signFg, Math.min(62, label.length * 7 + 10), true);

  // the warm pool of light the awning throws on the walk
  c.globalAlpha = 0.12; R(c, left + 2, base + 2, W - 4, 5, '#ffe8a0'); c.globalAlpha = 1;
}

/** Draw whatever shop art a stage owes a spot: the shop's own cart or stall for a vendor, a
 *  market booth for a storefront. World coordinates, so callers offset by the camera. */
export function drawShopBooth(c: Ctx, spot: ShopSpot, style: ShopStyle): void {
  if (SHOPS[spot.shop].venue === 'vendor') vendorBooth(c, spot, style);
  else marketStall(c, spot, style);
}

/** Which city's shop dressing a background theme wants. */
export function shopStyleFor(theme: string): ShopStyle {
  if (theme.startsWith('ny')) return 'ny';
  if (theme.startsWith('izm')) return 'izmir';
  if (theme.startsWith('ist')) return 'istanbul';
  return 'tampa';
}

// ---------------------------------------------------------------- street furniture
// The concepts put a lived-in band of clutter along the walk: hydrants, paper boxes, stacked
// produce, café chairs, coolers and bollards. It sits between the facades and the fighters, and
// it keeps clear of every shop door so an entrance always stays walkable.

/** Subway stair down to the platform: green ironwork, two globe lamps, the name plate and the
 *  warm haze that rises out of the stairwell. The signature piece of every NYC street. */
function subwayEntrance(c: Ctx, x: number): void {
  R(c, x - 3, STREET_TOP - 34, 58, 34, '#16201c');
  R(c, x, STREET_TOP - 31, 52, 31, '#20342a');
  R(c, x + 6, STREET_TOP - 27, 40, 23, '#0a100e');
  for (let i = 0; i < 40; i += 4) R(c, x + 6 + i, STREET_TOP - 27, 2, 23, '#16241c');
  R(c, x - 3, STREET_TOP - 36, 58, 3, '#4a7a4a');
  R(c, x - 3, STREET_TOP - 36, 58, 1, '#6aa86a');
  for (const gx of [x + 2, x + 47]) {
    R(c, gx, STREET_TOP - 46, 1, 10, '#2a3a2a');
    c.globalAlpha = 0.22; disc(c, gx, STREET_TOP - 48, 6, '#5ae87a'); c.globalAlpha = 1;
    disc(c, gx, STREET_TOP - 48, 3, '#5ae87a'); P(c, gx - 1, STREET_TOP - 49, '#d8ffe0');
  }
  signBoard(c, x + 26, STREET_TOP - 56, 'SUBWAY', '#f6e8b8', '#1a1a1a', 48);
  // steam leaking out of the grating on the stair
  c.globalAlpha = 0.16;
  for (let i = 0; i < 5; i++) disc(c, x + 20 + Math.sin(i * 1.4) * 6, STREET_TOP - 32 - i * 6, 4 + i, '#c8d8e8');
  c.globalAlpha = 1;
}

function hydrant(c: Ctx, x: number, b: number): void {
  R(c, x - 1, b - 2, 7, 2, '#8a2a20');
  R(c, x, b - 9, 5, 7, '#c8382c');
  R(c, x, b - 9, 2, 7, '#e0503c');
  R(c, x - 1, b - 10, 7, 2, '#e0503c');
  R(c, x + 1, b - 12, 3, 2, '#f0d8c0');
  R(c, x - 3, b - 7, 3, 2, '#a82a20'); R(c, x + 5, b - 7, 3, 2, '#a82a20');
  P(c, x + 2, b - 6, '#f08a7a');
}

function newsBox(c: Ctx, x: number, b: number, col: string): void {
  R(c, x, b - 13, 11, 13, col);
  R(c, x, b - 13, 11, 1, '#f0ece0');
  R(c, x + 2, b - 11, 7, 5, '#2a2634');
  R(c, x + 2, b - 5, 7, 3, '#e8e4d8');
  R(c, x, b - 1, 11, 1, '#1a1620');
  P(c, x + 8, b - 7, '#f0c040');
}

function wireBasket(c: Ctx, x: number, b: number): void {
  R(c, x, b - 12, 9, 12, '#33333d');
  for (let y = b - 11; y < b - 1; y += 2) R(c, x + 1, y, 7, 1, '#5a5a66');
  R(c, x, b - 13, 9, 2, '#22222a');
  R(c, x + 1, b - 11, 7, 2, '#11111a');
  R(c, x + 2, b - 8, 4, 2, '#8a8a94');
}

function sandwichBoard(c: Ctx, x: number, b: number): void {
  R(c, x, b - 16, 2, 16, '#5a3a1c'); R(c, x + 9, b - 16, 2, 16, '#5a3a1c');
  R(c, x + 1, b - 15, 9, 11, '#efe6c8');
  R(c, x + 1, b - 15, 9, 1, '#fffaf0');
  R(c, x + 2, b - 13, 7, 1, '#8a2a1a'); R(c, x + 2, b - 11, 5, 1, '#3a5a8a'); R(c, x + 2, b - 9, 6, 1, '#3a3a3a');
  R(c, x, b - 5, 11, 1, '#5a3a1c');
}

function bollard(c: Ctx, x: number, b: number): void {
  R(c, x, b - 10, 3, 10, '#2a2a34');
  R(c, x - 1, b - 11, 5, 2, '#4a4a56');
  P(c, x, b - 10, '#6a6a78');
}

function plantPot(c: Ctx, x: number, b: number): void {
  R(c, x, b - 8, 12, 8, '#a8603a'); R(c, x, b - 8, 12, 2, '#c87850');
  R(c, x + 1, b - 6, 10, 1, '#8a4a2a');
  disc(c, x + 6, b - 12, 6, '#2e6a32'); disc(c, x + 3, b - 10, 4, '#3a7a3a'); disc(c, x + 9, b - 10, 4, '#46843e');
  P(c, x + 5, b - 17, '#e8d040'); P(c, x + 8, b - 15, '#f06a8a');
}

function crateStack(c: Ctx, x: number, b: number, rng: Rng): void {
  const cols = [['#d0202c', '#e8a020', '#5aa83a'], ['#d8a020', '#8a3a9a', '#c02a2a'], ['#8ac8ff', '#f0c818', '#d0202c']];
  const n = rng.int(2, 3);
  for (let i = 0; i < n; i++) produceCrate(c, x + (i % 2) * 12, b - i * 8, cols[i % 3], 13);
  R(c, x + 1, b - 1, 25, 1, '#6a4a2a');
}

function cafeSet(c: Ctx, x: number, b: number): void {
  // small round table with a tea glass and two stools, like the ones on the quay
  R(c, x, b - 3, 18, 3, '#c8a878'); R(c, x, b - 3, 18, 1, '#e8d0ac');
  R(c, x + 8, b, 2, 5, '#7a5a38');
  R(c, x + 3, b - 7, 3, 4, '#f4f0e4'); P(c, x + 4, b - 6, '#b05a20');
  R(c, x - 7, b - 8, 5, 2, '#8a5a32'); R(c, x - 6, b - 6, 1, 6, '#5a3a1c'); R(c, x - 4, b - 6, 1, 6, '#5a3a1c');
  R(c, x + 21, b - 8, 5, 2, '#8a5a32'); R(c, x + 22, b - 6, 1, 6, '#5a3a1c'); R(c, x + 24, b - 6, 1, 6, '#5a3a1c');
}

function coolerBox(c: Ctx, x: number, b: number): void {
  R(c, x, b - 9, 14, 9, '#e8ece8');
  R(c, x, b - 9, 14, 2, '#3a8ac0');
  R(c, x + 1, b - 6, 12, 1, '#b8c0c0');
  R(c, x + 5, b - 12, 4, 3, '#c8c8c8');
  R(c, x, b - 1, 14, 1, '#8a908c');
}

function surfRack(c: Ctx, x: number, b: number, rng: Rng): void {
  R(c, x, b - 26, 2, 26, '#8a6a4a');
  for (let i = 0; i < 2; i++) {
    const bx = x + 2 + i * 5, col = rng.pick(['#e05a4a', '#3a8ac0', '#f0c850']);
    R(c, bx, b - 24, 4, 20, col); R(c, bx - 1, b - 24, 6, 3, '#f6f2e6');
    P(c, bx + 1, b - 14, '#f6f2e6');
  }
  R(c, x - 1, b - 2, 12, 2, '#a8703a');
}

type Furniture = 'ny' | 'izmir' | 'istanbul' | 'tampa';

/** Scatter the chapter's pavement clutter along the near layer. */
function streetFurniture(c: Ctx, w: number, rng: Rng, sec: SectionDef, kind: Furniture): void {
  const doors = sec.shops.map((s) => s.x);
  for (let x = 40; x < w - 46; x += rng.int(74, 132)) {
    if (doors.some((d) => Math.abs(d - x) < 82)) continue;
    const b = STREET_TOP - 1, r = rng.int(0, 99);
    if (kind === 'ny') {
      if (r < 26) hydrant(c, x, b);
      else if (r < 48) newsBox(c, x, b, rng.pick(['#2a4a8a', '#8a2a2a', '#2a6a4a']));
      else if (r < 68) wireBasket(c, x, b);
      else if (r < 86) sandwichBoard(c, x, b);
      else bollard(c, x, b);
    } else if (kind === 'izmir') {
      if (r < 34) cafeSet(c, x, b);
      else if (r < 60) plantPot(c, x, b);
      else if (r < 82) crateStack(c, x, b, rng);
      else bollard(c, x, b);
    } else if (kind === 'istanbul') {
      if (r < 38) crateStack(c, x, b, rng);
      else if (r < 62) plantPot(c, x, b);
      else if (r < 84) cafeSet(c, x, b);
      else bollard(c, x, b);
    } else {
      if (r < 30) coolerBox(c, x, b);
      else if (r < 58) surfRack(c, x, b, rng);
      else if (r < 78) plantPot(c, x, b);
      else crateStack(c, x, b, rng);
    }
  }
}

// ---------------------------------------------------------------- atmosphere
/** Soft squashed ellipse, used for cloud lobes. */
function puff(c: Ctx, cx: number, cy: number, rx: number, ry: number, col: string): void {
  for (let y = -Math.round(ry); y <= Math.round(ry); y++) {
    const w = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    if (w > 0) R(c, cx - w, cy + y, w * 2, 1, col);
  }
}

/** Puffy cloud bank: overlapping lobes with a lit crown and a shaded belly. */
function clouds(c: Ctx, w: number, rng: Rng, y0: number, y1: number, body: string, hi: string, shade: string): void {
  const n = Math.max(2, Math.round(w / 190));
  for (let i = 0; i < n; i++) {
    const cx = rng.int(20, Math.max(21, w - 20)), cy = rng.int(y0, y1);
    const cw = rng.int(44, 92), ch = rng.int(4, 8);
    puff(c, cx, cy, cw * 0.5, ch, body);
    puff(c, cx - cw * 0.26, cy - ch * 0.55, cw * 0.3, ch * 0.85, body);
    puff(c, cx + cw * 0.24, cy - ch * 0.6, cw * 0.34, ch * 0.9, body);
    // lit crown + shaded belly
    for (let x = Math.round(cx - cw * 0.5); x < cx + cw * 0.5; x++) {
      const top = cy - Math.round(ch * (0.55 + 0.45 * Math.cos(((x - cx) / (cw * 0.5)) * 1.4)));
      R(c, x, top, 1, 1, hi);
      R(c, x, cy + ch - 1, 1, 1, shade);
    }
  }
}

/** A distant mountain range: layered silhouettes across the width. */
function ridge(c: Ctx, w: number, base: number, amp: number, freq: number, col: string, hi: string, peaks = 3): void {
  const ph = [0.7, 2.1, 4.3];
  for (let x = 0; x < w; x += 2) {
    let h = base;
    for (let k = 0; k < peaks; k++) h -= Math.round(amp / (k + 1.3) * (0.5 + 0.5 * Math.sin(x / (freq * (k + 1)) + ph[k])));
    R(c, x, h, 2, base - h + 30, col);
    P(c, x, h, hi);
  }
}

/** Sea or river with banded distance and a shimmering sun path. */
function sea(c: Ctx, w: number, top: number, bottom: number, cols: string[], sunX: number, sunCol: string, rng: Rng): void {
  const rows = bottom - top;
  for (let i = 0; i < rows; i++) {
    const t = i / rows;
    const ci = Math.min(cols.length - 1, Math.floor(t * cols.length));
    R(c, 0, top + i, w, 1, cols[ci]);
    // long, sparse ripple highlights so the water reads as bands, not noise
    if (i % 3 === 0) for (let x = rng.int(0, 40); x < w; x += rng.int(28, 64)) {
      R(c, x, top + i, rng.int(3, 9), 1, cols[Math.min(cols.length - 1, ci + 1)]);
    }
  }
  R(c, 0, top, w, 1, cols[cols.length - 1]);
  // sun path: broken horizontal dashes widening toward the viewer
  for (let i = 0; i < rows; i++) {
    const t = i / rows;
    const spread = 8 + t * 54;
    const dash = 2 + Math.round(t * 6);
    const count = 1 + Math.round(t * 5);
    for (let k = 0; k < count; k++) {
      const x = sunX - spread / 2 + (spread / Math.max(1, count)) * k + Math.round(Math.sin(i * 1.7 + k) * 3);
      R(c, x, top + i, dash, 1, i % 3 === 0 ? sunCol : cols[Math.min(cols.length - 1, 2)]);
    }
  }
}

/** Dense modern skyline: setbacks, antennae and sparse lit windows. */
function skyline(c: Ctx, w: number, rng: Rng, base: number, minH: number, maxH: number, col: string, col2: string, win: string[]): void {
  let x = -10;
  while (x < w) {
    const bw = rng.int(16, 40);
    const h = rng.int(minH, maxH);
    const top = base - h;
    R(c, x, top, bw, h, col);
    // setback crown
    if (rng.chance(0.35)) {
      const sh = rng.int(6, 18), sw = Math.max(6, bw - rng.int(6, 12));
      R(c, x + (bw - sw) / 2, top - sh, sw, sh, col2);
      if (rng.chance(0.4)) { R(c, x + bw / 2, top - sh - rng.int(4, 10), 1, 10, col2); P(c, x + bw / 2, top - sh - 1, '#e04040'); }
    }
    for (let yy = top + 2; yy < base - 2; yy += 3)
      for (let xx = x + 2; xx < x + bw - 2; xx += 3)
        if (rng.chance(0.32)) P(c, xx, yy, win[(xx + yy) % win.length]);
    x += bw + rng.int(0, 3);
  }
}

/** Neon sign with a soft halo, mounted on a facade. */
function neon(c: Ctx, x: number, y: number, text: string, fg: string, bg: string, w?: number): void {
  const ww = w ?? Math.max(20, text.length * 6 + 8);
  c.globalAlpha = 0.16;
  for (let k = 2; k >= 1; k--) R(c, x - ww / 2 - k, y - k, ww + k * 2, 11 + k * 2, fg);
  c.globalAlpha = 1;
  R(c, x - ww / 2 - 1, y - 1, ww + 2, 11, OUT);
  R(c, x - ww / 2, y, ww, 9, bg);
  drawText(c, text, x, y + 1, fg, { align: 'center', shadow: null });
  R(c, x - ww / 2, y, ww, 1, fg);
  R(c, x - ww / 2, y + 8, ww, 1, fg);
}

/** Zigzag fire escape with landings and a drop ladder. */
function fireEscapeFull(c: Ctx, x: number, y: number, w: number, floors: number, col = '#26262e', hi = '#4a4a56'): void {
  for (let i = 0; i < floors; i++) {
    const yy = y + i * 11;
    R(c, x, yy, w, 1, hi); R(c, x, yy + 1, w, 1, col);
    for (let k = 0; k < w; k += 3) R(c, x + k, yy - 6, 1, 6, col);
    R(c, x, yy - 7, w, 1, hi); R(c, x, yy - 6, w, 1, col);
    // stair run down to the next landing, alternating direction
    for (let k = 0; k < 9; k++) {
      const sx = i % 2 ? x + 2 + k : x + w - 3 - k;
      P(c, sx, yy + 2 + k, col); P(c, sx, yy + 2 + k, hi);
      if (k % 3 === 0) R(c, sx, yy + 2 + k, 1, 1, hi);
    }
  }
  R(c, x + 2, y + floors * 11, w - 4, 1, col);
}

/** Concrete sidewalk: slabs, joints, cracks and stains. */
function sidewalk(c: Ctx, w: number, y: number, h: number, base: string, joint: string, hi: string, rng: Rng): void {
  R(c, 0, y, w, h, base);
  R(c, 0, y, w, 1, hi);
  for (let x = 0; x < w; x += 26) { R(c, x, y, 1, h, joint); P(c, x + 1, y + 1, hi); }
  R(c, 0, y + Math.round(h * 0.55), w, 1, joint);
  for (let i = 0; i < w / 8; i++) P(c, rng.int(0, w), rng.int(y + 1, y + h - 1), rng.chance(0.5) ? joint : hi);
  for (let x = rng.int(0, 40); x < w; x += rng.int(80, 180)) {
    for (let k = 0; k < 6; k++) P(c, x + k, y + 2 + k % 3, joint);
  }
}

/** Asphalt with crosswalk, lane dashes, patches and puddles. */
function asphalt(c: Ctx, w: number, y: number, h: number, base: string, dark: string, light: string, rng: Rng, lane = true): void {
  R(c, 0, y, w, h, base);
  R(c, 0, y, w, 1, dark);
  for (let i = 0; i < w * 1.5; i++) P(c, rng.int(0, w), rng.int(y + 1, y + h - 1), rng.chance(0.6) ? dark : light);
  // tar patches
  for (let i = 0; i < w / 90; i++) {
    const px = rng.int(0, w), pw = rng.int(14, 40), ph = rng.int(3, 7);
    R(c, px, rng.int(y + 2, y + h - 8), pw, ph, dark);
  }
  if (lane) for (let x = 20; x < w; x += 90) R(c, x, y + Math.round(h * 0.55), 30, 2, '#c8b23a');
  // puddles that catch the sky
  for (let i = 0; i < w / 220; i++) {
    const px = rng.int(0, w), py = rng.int(y + h * 0.4, y + h - 6), pw = rng.int(16, 34);
    R(c, px, py, pw, 2, '#2a3244');
    R(c, px + 2, py, pw - 6, 1, '#4a5a74');
    P(c, px + pw - 4, py + 1, '#c8d8f0');
  }
}

// ---------------------------------------------------------------- themes
interface Theme {
  sky: string[]; stars?: number; sun?: [number, number, number, string];
  far: (c: Ctx, w: number, rng: Rng) => void;
  mid: (c: Ctx, w: number, rng: Rng) => void;
  near: (c: Ctx, w: number, rng: Rng, sec: SectionDef) => void;
  floor: (c: Ctx, w: number, rng: Rng) => void;
}

const THEMES: Record<string, Theme> = {
  // ================================================================ NEW YORK (night)
  ny_street: {
    sky: ['#16122f', '#1e1740', '#2a1c4c', '#402856', '#5e3458', '#8a4658', '#b86a52'], stars: 55, sun: [330, 32, 15, '#f8f2d4'],
    far: (c, w, rng) => {
      // Manhattan across the river: layered towers fading into the dusk haze
      skyline(c, w, rng, 132, 46, 104, '#231b3c', '#2d2348', ['#f4ca62', '#8ac8ff', '#f0a0b0']);
      // one landmark spire with lit crown
      for (let bx = 120; bx < w; bx += 470) {
        R(c, bx, 30, 3, 74, '#2d2348'); P(c, bx + 1, 20, '#f8e0a0');
        for (let y = 34; y < 100; y += 6) R(c, bx + 3, y, 10, 3, '#2d2348');
        R(c, bx + 13, 26, 3, 78, '#2d2348'); P(c, bx + 14, 16, '#f8e0a0');
      }
      // bridge silhouette on the water line
      for (let bx = 6; bx < w; bx += 560) {
        R(c, bx, 96, 150, 3, '#2a2244');
        R(c, bx + 12, 74, 5, 24, '#2a2244'); R(c, bx + 66, 66, 5, 32, '#2a2244'); R(c, bx + 122, 74, 5, 24, '#2a2244');
        for (let x = 0; x < 150; x++) {
          const y = 96 - Math.round(24 * Math.sin((x / 150) * Math.PI * 2));
          P(c, bx + x, y, '#2a2244');
          if (x % 6 === 0) for (let k = y + 1; k < 96; k += 2) P(c, bx + x, k, '#251e3c');
        }
      }
      // haze
      for (let i = 0; i < 14; i++) { c.globalAlpha = 0.10 + i * 0.02; R(c, 0, 118 + i, w, 1, '#8a6288'); }
      c.globalAlpha = 1;
      clouds(c, w, rng, 86, 108, '#4a2f56', '#7a4a62', '#35203f');
    },
    mid: (c, w, rng) => {
      let x = -12;
      while (x < w) {
        const bw = rng.int(50, 80), h = rng.int(64, 100), top = 136 - h;
        const wall = rng.pick(['#4e2a26', '#572f28', '#432322', '#60352b']);
        R(c, x, top, bw, h, wall);
        // brick courses
        for (let yy = top + 3; yy < 134; yy += 4)
          for (let xx = x + 1; xx < x + bw - 1; xx += 5) P(c, xx + ((yy / 4) % 2 ? 2 : 0), yy, '#3a1d1c');
        R(c, x, top, bw, 2, '#33191a');
        cornice(c, x, top, bw, '#33191a', '#8a5a48');
        // window grid with sills, air conditioners and the odd TV glow
        for (let wy = top + 7; wy < 118; wy += 12) {
          for (let wx = x + 5; wx < x + bw - 9; wx += 11) {
            const lit = rng.chance(0.55);
            const col = rng.chance(0.15) ? '#7ac8e8' : rng.chance(0.2) ? '#f0a0b0' : '#f2c460';
            R(c, wx - 1, wy - 1, 8, 10, '#2a1618');
            R(c, wx, wy, 6, 8, lit ? col : '#241a24');
            R(c, wx, wy, 6, 1, lit ? '#fff0c0' : '#2e2030');
            R(c, wx - 2, wy + 9, 10, 1, '#8a6a5a');
            if (rng.chance(0.18)) { R(c, wx + 1, wy + 7, 5, 3, '#8a8a90'); R(c, wx + 1, wy + 7, 5, 1, '#b8b8c0'); }
          }
        }
        if (rng.chance(0.65)) fireEscapeFull(c, x + 8, top + 30, Math.min(40, bw - 20), 4);
        if (rng.chance(0.55)) waterTower(c, x + bw - 13, top + 3, 1, '#6a4a32', '#3a2418', '#a0744c');
        if (rng.chance(0.4)) { R(c, x + bw - 6, top - 12, 1, 12, '#2a2a32'); P(c, x + bw - 6, top - 13, '#e04040'); }
        // laundry line across the alley
        if (rng.chance(0.3)) {
          const ly = top + rng.int(20, 50);
          R(c, x, ly, bw, 1, '#3a3a44');
          for (let k = 4; k < bw - 4; k += 7) R(c, x + k, ly + 1, 4, 5, rng.pick(['#e8e4d8', '#c84a4a', '#4a7ac8', '#e8c85a']));
        }
        x += bw + rng.int(1, 5);
      }
      // rooftop signs
      for (let bx = 60; bx < w; bx += 320) {
        R(c, bx, 34, 74, 16, '#241820');
        drawText(c, rng.pick(['HOTEL', 'DINER', 'KANKA']), bx + 37, 38, '#f0c860', { align: 'center', shadow: null });
        R(c, bx + 8, 50, 2, 8, '#241820'); R(c, bx + 64, 50, 2, 8, '#241820');
      }
    },
    near: (c, w, rng, sec) => {
      let x = 0;
      while (x < w) {
        const bw = rng.int(62, 96), top = rng.int(56, 84);
        const wall = rng.pick(['#7a3a2c', '#6a3026', '#864234', '#5e2a24']);
        R(c, x, top, bw, STREET_TOP - top, wall);
        // brick texture + soot under the cornice
        for (let yy = top + 4; yy < STREET_TOP - 30; yy += 4)
          for (let xx = x + 1; xx < x + bw - 1; xx += 5) P(c, xx + ((yy / 4) % 2 ? 2 : 0), yy, '#4a241e');
        R(c, x, top, bw, 2, '#33181a');
        cornice(c, x, top, bw, '#33181a', '#c08a68');
        // upper windows
        for (let wy = top + 8; wy < top + 34; wy += 12)
          for (let wx = x + 5; wx < x + bw - 9; wx += 12) {
            const lit = rng.chance(0.45);
            R(c, wx - 1, wy - 1, 9, 11, '#2a1618');
            R(c, wx, wy, 7, 9, lit ? '#f2c460' : '#241a26');
            R(c, wx, wy, 7, 1, lit ? '#ffeab0' : '#2e2030');
            R(c, wx + 3, wy, 1, 9, '#2a1618');
            R(c, wx - 2, wy + 10, 11, 1, '#c09878');
            if (rng.chance(0.25)) { R(c, wx + 1, wy + 2, 5, 4, rng.pick(['#8a3a4a', '#3a5a8a', '#c8c8b8'])); }
          }
        // ground floor: shop window, door, roll-up grille
        R(c, x + 2, STREET_TOP - 30, bw - 4, 30, '#241a1c');
        R(c, x + 5, STREET_TOP - 26, bw - 34, 21, '#f6cf7a');
        R(c, x + 5, STREET_TOP - 26, bw - 34, 2, '#fff0c0');
        for (let i = 0; i < 5; i++) R(c, x + 7 + i * 6, STREET_TOP - 20, 4, 4, rng.pick(['#d0202c', '#2a6ad0', '#f0c818', '#5aa83a', '#e8e0d0']));
        R(c, x + 6, STREET_TOP - 16, bw - 36, 1, '#c89040');
        R(c, x + bw - 24, STREET_TOP - 28, 20, 28, '#1a1214');
        R(c, x + bw - 22, STREET_TOP - 26, 16, 24, rng.chance(0.4) ? '#2a3a32' : '#3a2420');
        for (let i = 0; i < 24; i += 2) P(c, x + bw - 22 + (i % 16), STREET_TOP - 26 + i, '#4a3a32');
        // awning + neon
        if (rng.chance(0.7)) awning(c, x + 4, STREET_TOP - 34, bw - 30, rng.pick(['#8a2228', '#24503a', '#2a2a5e']), '#e8dcc8');
        const fg = rng.pick(['#f0d838', '#f06a8a', '#5ae8c0', '#8ac8ff']);
        neon(c, x + bw / 2, top + 6, rng.pick(NEON_WORDS), fg, '#141018', Math.max(24, Math.min(bw - 10, 78)));
        // standpipe + trash bags against the wall
        R(c, x + 3, STREET_TOP - 8, 2, 8, '#a03028'); R(c, x + 2, STREET_TOP - 10, 4, 2, '#c84038');
        if (rng.chance(0.5)) { disc(c, x + bw - 8, STREET_TOP - 3, 4, '#2a2a34'); disc(c, x + bw - 4, STREET_TOP - 2, 3, '#22222c'); }
        x += bw + rng.int(1, 4);
      }
      for (const s of sec.shops) {
        if (SHOPS[s.shop].venue === 'store') shopFront(c, s, 'ny'); else vendorBooth(c, s, 'ny');
      }
      // subway entrance with green globes and steam
      subwayEntrance(c, Math.min(w - 72, 236));
      // overhead wires + string of bare bulbs
      for (let bx = 0; bx < w; bx += 140) {
        for (let x2 = 0; x2 < 140; x2++) { const y = 46 + Math.round(6 * Math.sin(x2 / 22)); P(c, bx + x2, y, '#241c24'); }
        for (let bx2 = 10; bx2 < 140; bx2 += 26) { const y = 52 + Math.round(6 * Math.sin(bx2 / 22)); R(c, bx + bx2, y, 1, 3, '#241c24'); P(c, bx + bx2, y + 3, '#ffe8a0'); }
      }
    },
    floor: (c, w, rng) => {
      sidewalk(c, w, 0, 13, '#9a9aa4', '#6e6e7a', '#c2c2cc', rng);
      R(c, 0, 13, w, 3, '#4c4c56');
      R(c, 0, 13, w, 1, '#b8b8c2');
      asphalt(c, w, 16, 64, '#33333c', '#2a2a33', '#42424c', rng);
      // crosswalk near the left edge of each screen
      for (let x = 10; x < w; x += 384) for (let k = 0; k < 6; k++) R(c, x + k * 11, 20, 5, 52, '#8a8a94');
      for (let x = 10; x < w; x += 384) for (let k = 0; k < 6; k++) R(c, x + k * 11, 20, 5, 1, '#a8a8b2');
      // manholes and drain grates
      for (let x = 60; x < w; x += 240) {
        disc(c, x, 44, 7, '#2a2a32'); disc(c, x, 44, 5, '#3a3a44');
        for (let k = -4; k <= 4; k += 2) R(c, x + k, 40, 1, 9, '#2a2a32');
      }
      for (let x = 100; x < w; x += 200) {
        R(c, x, 12, 14, 3, '#22222a');
        for (let k = 0; k < 14; k += 2) R(c, x + k, 12, 1, 3, '#4a4a56');
      }
    },
  },

  ny_block: {
    sky: ['#0c0c22', '#121236', '#181844', '#202052', '#282460'], stars: 70, sun: [70, 34, 14, '#f6f0c8'],
    far: (c, w, rng) => {
      R(c, 0, 96, w, 40, '#181834');
      for (let x = 0; x < w; x += rng.int(12, 28)) {
        const h = rng.int(30, 84), bw = rng.int(10, 20);
        R(c, x, 132 - h, bw, h, '#12122c');
        windows(c, x, 132 - h, bw, h, rng, '#e8c860', '#12122c', 1, 2, 2, 3, 0.3, '#12122c');
      }
    },
    mid: (c, w, rng) => {
      for (let x = 0; x < w; x += rng.int(52, 80)) {
        const bw = rng.int(44, 68), h = rng.int(60, 88), top = 132 - h;
        R(c, x, top, bw, h, '#4a2a2a'); cornice(c, x, top, bw, '#2a1818', '#7a4a3a');
        windows(c, x + 3, top + 5, bw - 6, h - 26, rng, '#f2c860', '#241a24', 4, 5, 6, 7, 0.35, '#2a1612');
        if (rng.chance(0.7)) fireEscape(c, x + 10, top + 24, bw - 20, 4);
        if (rng.chance(0.4)) waterTower(c, x + 14, top, 1, '#6a4a30', '#3a2416', '#9a6a44');
      }
    },
    near: (c, w, rng, sec) => {
      let x = 0;
      while (x < w) {
        const bw = rng.int(64, 96), top = rng.int(50, 80);
        R(c, x, top, bw, STREET_TOP - top, rng.pick(['#7a3428', '#6a2e24', '#8a4030']));
        cornice(c, x, top, bw, '#3a1a16', '#b07a5a');
        windows(c, x + 4, top + 6, bw - 8, 44, rng, '#f2c860', '#2a1a22', 4, 6, 6, 7, 0.3, '#2a1612');
        R(c, x + 4, 108, bw - 8, 28, '#2a1a18');
        R(c, x + 10, 112, bw - 40, 18, '#f2c860');
        for (let i = 0; i < 3; i++) P(c, x + 14 + i * 6, 118, ['#d0202c', '#2a6ad0', '#5aa83a'][i]);
        R(c, x + bw - 22, 110, 14, 26, '#1a1214');
        signBoard(c, x + bw / 2, 98, rng.pick(['LIQUOR', 'BAGELS', 'CHECKS', 'PIZZA', 'NAILS']), '#141018', rng.pick(['#f0d838', '#f06a8a', '#5ae8c0']));
        x += bw + 2;
      }
      for (const s of sec.shops) {
        if (SHOPS[s.shop].venue === 'store') shopFront(c, s, 'ny'); else vendorBooth(c, s, 'ny');
      }
      // the block's own subway stair, so this street carries the same landmark as Flatbush
      for (let sx2 = 210; sx2 < w - 80; sx2 += 660) subwayEntrance(c, sx2);
      // steam vent
      R(c, 0, STREET_TOP - 1, 0, 0, OUT);
      const vx = Math.min(w - 40, 860);
      R(c, vx, STREET_TOP - 6, 14, 6, '#5a5a64');
      for (let i = 0; i < 3; i++) { R(c, vx + 2 + i * 4, STREET_TOP - 8, 3, 2, '#2a2a32'); }
      c.globalAlpha = 0.25;
      for (let i = 0; i < 6; i++) disc(c, vx + 6 + Math.sin(i) * 4, STREET_TOP - 16 - i * 5, 3 + i, '#c8d8e8');
      c.globalAlpha = 1;
    },
    floor: (c, w, rng) => {
      R(c, 0, 0, w, 14, '#8a8a94');
      for (let x = 0; x < w; x += 20) R(c, x, 0, 1, 14, '#6a6a74');
      R(c, 0, 14, w, 3, '#5a5a64');
      R(c, 0, 17, w, 63, '#3a3a44');
      for (let x = 30; x < w; x += 180) { R(c, x, 54, 26, 2, '#d8c840'); }
      for (let i = 0; i < w / 2; i++) P(c, rng.int(0, w), rng.int(19, 79), rng.chance(0.4) ? '#32323c' : '#464650');
    },
  },

  ny_boss: {
    sky: ['#0a0a12', '#0e0e18', '#12121e'],
    far: (c, w, rng) => { R(c, 0, 0, w, 136, '#12121e'); for (let x = 0; x < w; x += 6) { const h = rng.int(18, 30); R(c, x, STREET_TOP - h, 5, h, '#0a0a12'); disc(c, x + 2, STREET_TOP - h - 2, 3, '#0a0a12'); } },
    mid: (c, w, rng) => {
      R(c, 0, 0, w, STREET_TOP, '#2a1e1e');
      for (let y = 0; y < STREET_TOP; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < w; x += 12) R(c, x, y, 11, 5, rng.chance(0.12) ? '#3a2828' : '#332222');
      for (const y of [22, 46, 92]) { R(c, 0, y, w, 7, '#5a5a4a'); R(c, 0, y, w, 2, '#8a8a7a'); for (let x = 20; x < w; x += 64) R(c, x, y - 2, 5, 11, '#4a4a3a'); }
      for (let x = 0; x < w; x += 4) for (let y = 70; y < 104; y += 4) { P(c, x, y, '#6a6a6a'); P(c, x + 2, y + 2, '#6a6a6a'); }
    },
    near: (c, w, _rng) => {
      R(c, 0, 104, w, STREET_TOP - 104, '#3a2a2a');
      for (let x = 30; x < w; x += 110) { R(c, x, 0, 1, 50, '#2a2a2a'); R(c, x - 6, 50, 13, 4, '#3a3a3a'); R(c, x - 4, 54, 9, 2, '#fff0a0'); }
      for (let x = 0; x < w; x += 26) { R(c, x, 116, 22, 18, '#5a4a3a'); R(c, x + 2, 118, 18, 2, '#7a6a5a'); }
      signBoard(c, 192, 74, 'NO RULES', '#1a0e10', '#e0303c', 70, true);
      R(c, 0, 104, w, 2, '#e0303c');
    },
    floor: (c, w, rng) => {
      R(c, 0, 0, w, 80, '#4a4442');
      for (let i = 0; i < w / 2; i++) R(c, rng.int(0, w), rng.int(0, 80), rng.int(1, 4), 1, rng.chance(0.5) ? '#3a3432' : '#5a5452');
      R(c, 0, 0, w, 2, '#e0303c');
      R(c, 0, 2, w, 3, '#2a2422');
    },
  },

  // ================================================================ İZMİR (sunset)
  izm_kordon: {
    sky: ['#2a1e5e', '#3a2470', '#4e2a7a', '#6a3079', '#8a3c74', '#a84a68', '#c25e5a', '#dc7a4c', '#f0a052'], sun: [250, 86, 15, '#fff0c0'],
    far: (c, w, rng) => {
      // Karşıyaka hills across the bay, two ridges deep
      ridge(c, w, 96, 18, 96, '#6a4a7e', '#8a5f92');
      ridge(c, w, 104, 12, 58, '#54396a', '#6f4b7c');
      clouds(c, w, rng, 18, 52, '#6a3a74', '#a8607e', '#4a2a5e');
      streakClouds(c, w, rng, 26, 82, '#a8557e', '#d88a7a');
      clouds(c, w, rng, 54, 76, '#8a4272', '#c86a76', '#5e3266');
      // the bay: sunset water with a shimmering path down the middle
      sea(c, w, 104, 142, ['#b87e8a', '#c47a7e', '#cc7a76', '#d8846a', '#e29460', '#eea45c'], 250, '#ffe6a8', rng);
      // ferry crossing with a wake
      for (let fx = 40; fx < w; fx += 330) {
        R(c, fx, 118, 46, 7, '#f2f2ec'); R(c, fx + 5, 111, 20, 8, '#fbfbf6');
        R(c, fx + 7, 113, 5, 4, '#3a5a8a'); R(c, fx + 15, 113, 5, 4, '#3a5a8a');
        R(c, fx + 2, 119, 42, 2, '#3a5a8a');
        // the stern flag every Kordon ferry flies
        R(c, fx + 27, 104, 1, 7, '#e8e4d4');
        R(c, fx + 28, 105, 7, 4, '#d0202c');
        R(c, fx + 31, 106, 2, 2, '#f6f6f2'); P(c, fx + 32, 106, '#d0202c');
        R(c, fx - 6, 126, 58, 1, '#f6d8a0');
        for (let i = 0; i < 4; i++) P(c, fx + 10 + i * 8, 116, '#fff2c8');
        for (let i = 0; i < 12; i++) R(c, fx - 10 - i * 3, 127 + (i % 3), 2, 1, '#ffd9a0');
      }
      // gulls
      for (let i = 0; i < 7; i++) gull(c, rng.int(10, w - 10), rng.int(40, 74));
    },
    mid: (c, w, rng) => {
      // the opposite shore: a low band of houses and cypresses
      for (let x = 0; x < w; x += rng.int(14, 30)) {
        const hw = rng.int(12, 26), hh = rng.int(3, 9);
        R(c, x, 100 - hh, hw, hh + 6, rng.pick(['#8a6a86', '#95728e', '#7e6280']));
        R(c, x, 100 - hh, hw, 1, '#a8838f');
        if (rng.chance(0.3)) P(c, x + 3, 100 - hh - 3, '#6a4a6e');
        for (let k = 2; k < hw - 2; k += 4) P(c, x + k, 100 - hh + 2, '#f2c07a');
      }
      // palms first, so the buildings and tower sit in front of them
      for (let px = 10; px < w; px += 92) palm(c, px, 106, rng.int(24, 34), '#6a4a30', '#2a6a3a', '#3f8f4a');
      // quay skyline: clock tower, mosque with minarets, low stone buildings
      for (let bx = 40; bx < w; bx += 420) {
        // clock tower (Saat Kulesi)
        const tx = bx + 40;
        R(c, tx - 9, 44, 19, 58, '#e6cda4');
        R(c, tx - 9, 44, 2, 58, '#f6e4c4'); R(c, tx + 8, 44, 2, 58, '#c2a880');
        R(c, tx - 12, 100, 25, 4, '#cdb28c');
        R(c, tx - 13, 41, 27, 4, '#cdb28c');
        R(c, tx - 7, 30, 15, 12, '#e6cda4');
        disc(c, tx, 30, 7, '#cdb28c', true);
        R(c, tx - 1, 24, 3, 7, '#b89a74'); P(c, tx, 22, '#e8d0a8');
        for (const cx of [tx - 4, tx + 4]) { disc(c, cx, 37, 3, '#f8f4e8'); P(c, cx, 35, '#3a2a1a'); P(c, cx + 1, 37, '#3a2a1a'); }
        for (let i = -1; i <= 1; i++) { R(c, tx + i * 6 - 2, 84, 4, 16, '#8a7458'); disc(c, tx + i * 6, 84, 2, '#8a7458', true); }
        for (let y = 50; y < 82; y += 10) { R(c, tx - 6, y, 3, 6, '#8a7458'); R(c, tx + 4, y, 3, 6, '#8a7458'); }
        // mosque: dome + two minarets
        const mx = tx + 92;
        R(c, mx - 26, 88, 54, 14, '#e2cfae');
        R(c, mx - 21, 84, 42, 5, '#d8c3a2');
        disc(c, mx, 88, 17, '#cdb28e', true);
        for (let x = -17; x <= 17; x += 2) P(c, mx + x, 88 - Math.round(Math.sqrt(Math.max(0, 289 - x * x))) + 1, '#8a7050');
        R(c, mx - 19, 76, 38, 12, '#e2cfae');
        for (let i = 0; i < 3; i++) { R(c, mx - 9 + i * 8, 82, 4, 6, '#8a7050'); disc(c, mx - 7 + i * 8, 82, 2, '#8a7050', true); }
        for (const ax of [mx - 32, mx + 32]) {
          R(c, ax, 58, 4, 44, '#e6d2b2'); R(c, ax - 1, 58, 6, 3, '#cdb28c');
          disc(c, ax + 2, 58, 4, '#c8b08e', true); R(c, ax + 1, 51, 2, 8, '#c8b08e'); P(c, ax + 1, 49, '#e8d0a8');
          R(c, ax + 5, 62, 3, 1, '#c02a2a');
        }
        // low stone houses behind the parapet
        for (let hx = mx + 46; hx < tx + 190; hx += 34) {
          R(c, hx, 98, 30, 8, rng.pick(['#d8c3a0', '#cbb190', '#e0cdad']));
          R(c, hx, 94, 30, 4, '#a8745a');
          for (let i = 0; i < 3; i++) R(c, hx + 4 + i * 9, 99, 5, 5, '#5a4636');
        }
        // reflections of the shore lights on the water
        for (let rx = tx - 16; rx < tx + 196; rx += 26) {
          const len = rng.int(4, 10);
          for (let k = 0; k < len; k++) P(c, rx + (k % 3 === 0 ? 1 : 0), 107 + k, k < 3 ? '#f2c890' : '#cf9078');
        }
      }
      // warm haze along the horizon
      for (let i = 0; i < 6; i++) { c.globalAlpha = 0.06; R(c, 0, 96 + i * 2, w, 2, '#f6c07a'); }
      c.globalAlpha = 1;
    },
    near: (c, w, _rng, sec) => {
      // stone parapet at the water's edge
      R(c, 0, STREET_TOP - 12, w, 12, '#cdb894');
      R(c, 0, STREET_TOP - 13, w, 1, '#f0dcbc');
      R(c, 0, STREET_TOP - 12, w, 2, '#b8a17e');
      for (let x = 0; x < w; x += 22) R(c, x, STREET_TOP - 10, 1, 10, '#b8a17e');
      // iron railing on top of the parapet
      for (let x = 0; x < w; x += 8) {
        R(c, x, STREET_TOP - 26, 1, 13, '#22403a');
        P(c, x, STREET_TOP - 27, '#4a8a6a');
      }
      R(c, 0, STREET_TOP - 27, w, 1, '#22403a');
      R(c, 0, STREET_TOP - 26, w, 1, '#4a8a6a');
      for (let x = 0; x < w; x += 44) { R(c, x, STREET_TOP - 30, 3, 17, '#22403a'); R(c, x - 1, STREET_TOP - 31, 5, 2, '#3a6a5a'); }
      // lamp posts with warm globes and Turkish flags
      for (let x = 100; x < w; x += 240) {
        R(c, x, STREET_TOP - 62, 2, 36, '#1e2a28');
        c.globalAlpha = 0.18; disc(c, x, STREET_TOP - 64, 9, '#ffe8a0'); c.globalAlpha = 1;
        R(c, x - 3, STREET_TOP - 66, 8, 4, '#fff0b0');
        P(c, x - 2, STREET_TOP - 67, '#fffbe0');
        R(c, x - 4, STREET_TOP - 70, 10, 2, '#1e2a28');
        R(c, x + 3, STREET_TOP - 86, 1, 16, '#e8e4d4');
        flagTR(c, x + 4, STREET_TOP - 86);
      }
      // benches facing the sea
      for (let x = 200; x < w; x += 260) {
        R(c, x, STREET_TOP - 16, 24, 2, '#8a5a32');
        R(c, x + 1, STREET_TOP - 21, 22, 2, '#8a5a32');
        R(c, x + 1, STREET_TOP - 19, 22, 1, '#6a4322');
        R(c, x + 2, STREET_TOP - 14, 2, 3, '#3a3a40'); R(c, x + 20, STREET_TOP - 14, 2, 3, '#3a3a40');
      }
      for (const s of sec.shops) {
        if (SHOPS[s.shop].venue === 'store') shopFront(c, s, 'izmir'); else vendorBooth(c, s, 'izmir');
      }
    },
    floor: (c, w, rng) => {
      // stone quay paving: small warm slabs, a brick edging strip, subtle joints
      R(c, 0, 0, w, 80, '#b39a7c');
      for (let y = 0; y < 80; y += 6) {
        for (let x = (y / 6) % 2 ? 0 : 7; x < w; x += 14) {
          const tone = rng.chance(0.5) ? '#bfa688' : '#ab9274';
          R(c, x, y, 13, 5, tone);
          R(c, x, y, 13, 1, rng.chance(0.35) ? '#cbb294' : tone);
          P(c, x + 12, y + 4, '#8f7a5e');
        }
      }
      R(c, 0, 0, w, 2, '#cdb492');
      R(c, 0, 0, w, 1, '#e3caa8');
      R(c, 0, 34, w, 6, '#a85642');
      R(c, 0, 34, w, 1, '#c06850');
      R(c, 0, 39, w, 1, '#8a4032');
      for (let x = 0; x < w; x += 26) P(c, x, 36, '#e0c8a4');
      for (let i = 0; i < w / 10; i++) P(c, rng.int(0, w), rng.int(2, 78), rng.chance(0.6) ? '#a08a6c' : '#c4ac8c');
      // cafe tables and stacked chairs along the quay
      for (let x = 40; x < w; x += 210) {
        R(c, x, 3, 18, 3, '#c8a878'); R(c, x, 3, 18, 1, '#e8d0ac');
        R(c, x + 2, 6, 2, 9, '#7a5a38'); R(c, x + 14, 6, 2, 9, '#7a5a38');
        R(c, x + 5, 0, 3, 3, '#f4f0e4'); P(c, x + 6, 1, '#b05a20');
        R(c, x + 22, 2, 9, 2, '#c8a878'); R(c, x + 23, 4, 1, 8, '#7a5a38'); R(c, x + 29, 4, 1, 8, '#7a5a38');
        R(c, x + 23, 0, 7, 3, '#3a5a8a'); P(c, x + 24, 1, '#5a7aa8');
      }
    },
  },

  izm_bazaar: {
    sky: ['#6a9ad0', '#8ab0e0', '#a8c8ea', '#c8e0f6'],
    far: (c, w, rng) => {
      for (let x = 0; x < w; x += rng.int(18, 32)) { const h = rng.int(20, 46); R(c, x, 122 - h, rng.int(14, 26), h + 12, '#9ab0c8'); }
      for (let x = 60; x < w; x += 300) { R(c, x - 16, 96, 32, 26, '#b8c8d8'); disc(c, x, 96, 11, '#b8c8d8', true); R(c, x - 24, 78, 2, 20, '#b8c8d8'); R(c, x + 22, 78, 2, 20, '#b8c8d8'); }
    },
    mid: (c, w, rng) => {
      for (let x = 0; x < w; x += rng.int(34, 52)) {
        const bw = rng.int(28, 44), h = rng.int(40, 62);
        R(c, x, STREET_TOP - h, bw, h, rng.pick(['#e8d8b8', '#f0c8a0', '#d8e0e8']));
        windows(c, x, STREET_TOP - h, bw, h, rng, '#5a7a9a', '#4a6a8a', 3, 4, 5, 5, 0.5);
      }
    },
    near: (c, w, rng, sec) => {
      let x = 0;
      while (x < w) {
        const bw = rng.int(56, 84), top = rng.int(54, 80);
        R(c, x, top, bw, STREET_TOP - top, rng.pick(['#e8c890', '#f0d8b0', '#e0b890']));
        R(c, x, top, bw, 3, '#8a5a3a'); cornice(c, x, top, bw, '#8a5a3a', '#f6e8c8');
        windows(c, x + 4, top + 8, bw - 8, 34, rng, '#3a5a7a', '#2a4a6a', 3, 4, 5, 5, 0.45, '#6a4a2a');
        R(c, x + 4, STREET_TOP - 30, bw - 8, 30, '#8a5a3a');
        R(c, x + 8, STREET_TOP - 26, bw - 34, 20, '#3a5a7a');
        R(c, x + 10, STREET_TOP - 24, bw - 38, 16, '#f6e0b0');
        for (let i = 0; i < 5; i++) P(c, x + 12 + i * 5, STREET_TOP - 18, ['#c02a2a', '#e0a020', '#3a8a4a', '#8a3a9a'][i % 4]);
        R(c, x + bw - 18, STREET_TOP - 28, 12, 28, '#5a3a1a'); R(c, x + bw - 16, STREET_TOP - 26, 8, 26, '#2a1a10');
        awning(c, x + 4, STREET_TOP - 34, bw - 8, rng.pick(['#2a6ab0', '#c02a2a', '#e0a020']), '#f6f2ea');
        signBoard(c, x + bw / 2, STREET_TOP - 44, rng.pick(['BAHARAT', 'KUMRU', 'LOKUM', 'GEVREK', 'KUMAŞ']), '#f6e8b8', '#7a2010');
        x += bw + 2;
      }
      // hanging bunting
      for (let bx = 0; bx < w; bx += 20) { P(c, bx, 44 + Math.round(4 * Math.sin(bx / 40)), '#5a3a1a'); }
      for (let bx = 6; bx < w; bx += 20) R(c, bx, 46 + Math.round(4 * Math.sin(bx / 40)), 7, 5, ['#c02a2a', '#2a6ad0', '#e0a020', '#3a9a4a'][(bx / 20) % 4]);
      for (const s of sec.shops) { if (SHOPS[s.shop].venue === 'store') shopFront(c, s, 'istanbul'); else vendorBooth(c, s, 'istanbul'); }
    },
    floor: (c, w, rng) => {
      R(c, 0, 0, w, 80, '#b8a080');
      for (let y = 0; y < 80; y += 4) for (let x = (y / 4) % 2 ? 0 : 3; x < w; x += 6) { R(c, x, y, 5, 3, rng.chance(0.5) ? '#b8a080' : '#a89070'); R(c, x, y + 3, 6, 1, '#8a7458'); }
      R(c, 0, 0, w, 3, '#d8c8a8'); R(c, 0, 3, w, 2, '#8a7458');
    },
  },

  izm_boss: {
    sky: ['#2a2a6a', '#5a3a8a', '#a04a8a', '#e0607a', '#f69a6a'], sun: [120, 88, 20, '#ffe0a0'],
    far: (c, w, rng) => {
      R(c, 0, 104, w, 32, '#3a5a90');
      for (let x = 0; x < w; x += 2) { const h = 96 - Math.round(10 * Math.sin(x / 44) + 6 * Math.sin(x / 13)); R(c, x, h, 2, 34, '#6a4a7a'); }
      for (let x = 44; x < w; x += 340) {
        R(c, x - 9, 28, 18, 84, '#e8d8b8'); R(c, x - 12, 108, 24, 6, '#d8c8a8');
        disc(c, x, 28, 9, '#c8b898', true); R(c, x - 1, 14, 2, 6, '#c8b898');
        disc(c, x, 48, 5, '#f6f6f0'); R(c, x, 44, 1, 4, OUT); R(c, x, 48, 3, 1, OUT);
        for (let y = 60; y < 104; y += 10) { R(c, x - 6, y, 3, 5, '#7a5a3a'); R(c, x + 3, y, 3, 5, '#7a5a3a'); }
        P(c, x, 12, '#c8b898'); P(c, x - 1, 13, '#c8b898'); P(c, x + 1, 13, '#c8b898');
      }
      for (let x = 20; x < w; x += 100) palm(c, x, 112, rng.int(34, 46), '#6a4a30', '#2a6a3a', '#3a8a4a');
    },
    mid: (c, w, _rng) => {
      R(c, 0, 112, w, 24, '#d8c8a8');
      for (let x = 0; x < w; x += 5) P(c, x, 112 + (x % 4), '#c8b898');
      for (let x = 40; x < w; x += 180) { R(c, x, 92, 22, 20, '#c8b8a0'); R(c, x + 2, 94, 18, 2, '#f6ead0'); }
    },
    near: (c, w, _rng) => {
      R(c, 0, STREET_TOP - 12, w, 12, '#c8b898');
      for (let x = 0; x < w; x += 4) { const y = STREET_TOP - 56 + Math.round(9 * Math.sin(x / 28)); P(c, x, y, '#3a3a3a'); if (x % 16 === 0) { R(c, x, y + 1, 2, 2, ['#f6d838', '#e0303c', '#30c0f0', '#6aea6a'][(x / 16) % 4]); } }
      R(c, 110, STREET_TOP - 38, 160, 26, '#3a2a4a'); R(c, 110, STREET_TOP - 38, 160, 2, '#f0c040');
      drawText(c, 'KORDON MAIN EVENT', 190, STREET_TOP - 32, '#f0c040', { align: 'center', shadow: null });
      R(c, 118, STREET_TOP - 12, 144, 12, '#2a1a3a');
      for (let x = 0; x < w; x += 220) flagTR(c, x + 20, STREET_TOP - 48);
    },
    floor: (c, w, rng) => {
      R(c, 0, 0, w, 80, '#b8a890');
      for (let y = 0; y < 80; y += 10) for (let x = 0; x < w; x += 10) R(c, x + ((y / 10) % 2) * 5, y, 9, 9, rng.chance(0.5) ? '#c8b8a0' : '#a89880');
    },
  },

  // ================================================================ ISTANBUL (morning)
  ist_market: {
    sky: ['#3a8ad8', '#5aa0e0', '#7ab8ea', '#9ad0f4', '#bce0fa'],
    far: (c, w, rng) => {
      // warm morning haze over the Bosphorus, with the thin cloud bars the concept strip uses
      c.globalAlpha = 0.18; R(c, 0, 58, w, 34, '#f6d8a0'); c.globalAlpha = 1;
      streakClouds(c, w, rng, 20, 60, '#c8dcf0', '#f6fbff');
      R(c, 0, 96, w, 40, '#3a6aa0');
      for (let i = 0; i < w / 2; i++) R(c, rng.int(0, w), rng.int(98, 132), rng.int(2, 7), 1, '#5a8ac0');
      // Bosphorus bridge + ferry
      R(c, 0, 76, w, 2, '#8a9aa8');
      for (let x = 30; x < w; x += 180) { R(c, x, 44, 3, 32, '#8a9aa8'); R(c, x - 2, 42, 7, 3, '#8a9aa8'); }
      for (let x = 0; x < w; x++) { const y = 50 + Math.round(26 * Math.pow((x % 180 - 90) / 90, 2)); if (y < 78) P(c, x, y, '#9aaab8'); }
      const fx = 200;
      R(c, fx, 104, 40, 6, '#f6f6f2'); R(c, fx + 5, 98, 16, 7, '#f6f6f2');
      for (let i = 0; i < 4; i++) R(c, fx + 7 + i * 4, 100, 3, 3, '#3a5a8a');
      R(c, fx - 2, 110, 44, 1, '#d8c8a8');
    },
    mid: (c, w, rng) => {
      R(c, 0, 116, w, 20, '#c8b8a0');
      // mosque domes and pencil minarets, tall enough to read over the market roofs
      for (let x = 40; x < w; x += 150) {
        R(c, x, 64, 54, 52, '#d8c8b8'); disc(c, x + 27, 64, 20, '#c8b8a8', true);
        for (let dx = -18; dx <= 18; dx += 2) P(c, x + 27 + dx, 64 - Math.round(Math.sqrt(Math.max(0, 400 - dx * dx))) + 1, '#8a7a68');
        for (const mx of [x - 14, x + 62]) {
          R(c, mx, 44, 4, 72, '#d8c8b8'); disc(c, mx + 2, 44, 4, '#b8a898', true);
          R(c, mx + 1, 36, 2, 8, '#b8a898'); P(c, mx + 1, 34, '#e8d0a8');
        }
        for (let i = 0; i < 3; i++) { R(c, x + 14 + i * 12, 70, 5, 10, '#8a7a68'); disc(c, x + 16 + i * 12, 70, 3, '#8a7a68', true); }
        windows(c, x + 6, 84, 42, 26, rng, '#5a6a8a', '#4a5a7a', 3, 4, 4, 4, 0.4);
      }
      // Galata tower
      for (let x = 300; x < w; x += 460) {
        R(c, x - 14, 34, 28, 82, '#b8a898'); R(c, x - 16, 110, 32, 6, '#a89888');
        disc(c, x, 34, 12, '#9a8a78', true); R(c, x - 2, 14, 4, 8, '#9a8a78'); R(c, x - 1, 8, 2, 6, '#8a7a68');
        for (let y = 44; y < 108; y += 12) { R(c, x - 8, y, 3, 5, '#5a4a3a'); R(c, x + 5, y, 3, 5, '#5a4a3a'); }
        R(c, x - 4, 50, 8, 5, '#6a5a4a');
      }
      for (let x = 16; x < w; x += 120) palm(c, x, 118, rng.int(30, 40), '#6a4a30', '#2a6a3a', '#3a8a4a');
      for (let i = 0; i < 5; i++) gull(c, rng.int(20, w - 20), rng.int(20, 56));
    },
    near: (c, w, rng, sec) => {
      // shadowed back wall of the market: starts at the tallest roofline, so no dark bar floats
      // above the buildings against the bright sky
      R(c, 0, 54, w, STREET_TOP - 54, '#7a5838');
      for (let yy = 56; yy < STREET_TOP; yy += 6) R(c, 0, yy, w, 1, '#6a4a2e');
      for (let xx = 0; xx < w; xx += 26) R(c, xx, 54, 1, 18, '#5a3e26');
      let x = 0;
      while (x < w) {
        const bw = rng.int(62, 94), top = rng.int(54, 82);
        R(c, x, top, bw, STREET_TOP - top, rng.pick(['#d8b888', '#c8a878', '#e0c098', '#c09a70']));
        R(c, x, top, bw, 2, '#6a4a2a');
        cornice(c, x, top, bw, '#6a4a2a', '#f0d8b0');
        windows(c, x + 4, top + 6, bw - 8, STREET_TOP - top - 34, rng, '#3a5a7a', '#2a3a52', 3, 4, 5, 5, 0.4, '#5a3a1a');
        // market stall ground floor
        R(c, x + 2, STREET_TOP - 30, bw - 4, 30, '#6a4a2a');
        R(c, x + 5, STREET_TOP - 26, bw - 30, 20, '#3a2a1a');
        for (let i = 0; i < 5; i++) R(c, x + 7 + i * 6, STREET_TOP - 20, 4, 4, ['#e0a020', '#c02a2a', '#3a9a4a', '#d8d0b0', '#8a3a9a'][i]);
        awning(c, x + 3, STREET_TOP - 36, bw - 6, rng.pick(['#c02a2a', '#3a8a4a', '#2a6ab0']), '#f6f2ea');
        signBoard(c, x + bw / 2, STREET_TOP - 46, rng.pick(['ÇARŞI', 'BAHARAT', 'ÇAY', 'LOKUM', 'PEYNİR']), '#2a2018', '#e8c040');
        x += bw + 2;
      }
      for (const s of sec.shops) { if (SHOPS[s.shop].venue === 'store') shopFront(c, s, 'istanbul'); else vendorBooth(c, s, 'istanbul'); }
      // hanging lanterns beneath the eaves
      for (let lx = 30; lx < w; lx += 96) {
        R(c, lx, 54, 1, 12, '#3a2a1a'); R(c, lx - 3, 66, 7, 5, '#e8b040'); R(c, lx - 2, 67, 5, 2, '#fff0b0'); P(c, lx, 71, '#c88020');
      }
    },
    floor: (c, w, rng) => {
      R(c, 0, 0, w, 80, '#8a7a66');
      for (let y = 0; y < 80; y += 5) for (let x = (y / 5) % 2 ? 0 : 4; x < w; x += 8) { R(c, x, y, 7, 4, rng.chance(0.5) ? '#9a8a76' : '#82725e'); R(c, x, y + 4, 8, 1, '#6a5a48'); }
      R(c, 0, 0, w, 3, '#b8a888'); R(c, 0, 3, w, 2, '#6a5a48');
    },
  },

  ist_galata: {
    sky: ['#2a6ab0', '#4a8ad0', '#6aa8e0', '#8ac0ea', '#a8d4f4'],
    far: (c, w, _rng) => {
      R(c, 0, 92, w, 44, '#3a6a9a');
      for (let x = 0; x < w; x += 2) { const h = 90 - Math.round(8 * Math.sin(x / 50)); R(c, x, h, 2, 42, '#4a6a8a'); }
      for (let x = 80; x < w; x += 360) {
        R(c, x - 12, 40, 24, 60, '#b8a898'); disc(c, x, 40, 10, '#a89888', true); R(c, x - 2, 22, 4, 8, '#a89888');
        for (let y = 48; y < 98; y += 10) { R(c, x - 6, y, 3, 4, '#5a4a3a'); R(c, x + 4, y, 3, 4, '#5a4a3a'); }
      }
    },
    mid: (c, w, rng) => {
      for (let x = 0; x < w; x += rng.int(30, 44)) {
        const bw = rng.int(26, 38), h = rng.int(44, 70), top = 120 - h;
        R(c, x, top, bw, h, rng.pick(['#7a5a4a', '#8a6a5a', '#6a4a3a']));
        windows(c, x + 2, top + 4, bw - 4, h - 8, rng, '#f0d070', '#2a1e1a', 2, 3, 3, 4, 0.3);
      }
    },
    near: (c, w, rng, sec) => {
      let x = 0;
      while (x < w) {
        const bw = rng.int(58, 88), top = rng.int(52, 78);
        R(c, x, top, bw, STREET_TOP - top, rng.pick(['#7a5a4a', '#6a4a3a', '#8a6a5a']));
        cornice(c, x, top, bw, '#3a2a1a', '#c8a888');
        windows(c, x + 4, top + 6, bw - 8, 40, rng, '#f0d070', '#2a1e1a', 3, 4, 5, 5, 0.35, '#2a1a12');
        R(c, x + 4, STREET_TOP - 28, bw - 8, 28, '#3a2a1a');
        R(c, x + 8, STREET_TOP - 24, bw - 36, 18, '#f0d070');
        R(c, x + 8, STREET_TOP - 24, bw - 36, 2, '#fff0b0');
        R(c, x + bw - 18, STREET_TOP - 26, 12, 26, '#1a1210');
        awning(c, x + 4, STREET_TOP - 34, bw - 8, rng.pick(['#7a2a3a', '#2a3a6a']), '#e8c08a');
        signBoard(c, x + bw / 2, STREET_TOP - 44, rng.pick(['MEYHANE', 'PLAK', 'KÜNEFE', 'PASAJ', 'DÖNER']), '#2a1a12', '#f0c040');
        x += bw + 2;
      }
      for (const s of sec.shops) { if (SHOPS[s.shop].venue === 'store') shopFront(c, s, 'istanbul'); else vendorBooth(c, s, 'istanbul'); }
      for (let tx = 60; tx < w; tx += 160) { // tram wires
        R(c, tx, 40, 1, 14, '#2a2a2a'); R(c, tx - 3, 54, 7, 2, '#2a2a2a');
      }
    },
    floor: (c, w, rng) => {
      R(c, 0, 0, w, 80, '#6a5a4e');
      for (let y = 0; y < 80; y += 4) for (let x = (y / 4) % 2 ? 0 : 3; x < w; x += 6) { R(c, x, y, 5, 3, rng.chance(0.5) ? '#7a6a5e' : '#625248'); P(c, x, y + 3, '#4a3a32'); }
      R(c, 0, 26, w, 2, '#b8b8c8'); R(c, 0, 28, w, 1, '#2a2838');
      for (let x = 0; x < w; x += 8) R(c, x, 20, 3, 8, '#4a3a32');
    },
  },

  ist_boss: {
    sky: ['#2a6ab0', '#4a8ad0', '#6aa8e0', '#8ac0ea', '#b0d8f6'], sun: [70, 40, 16, '#fff6d0'],
    far: (c, w, rng) => {
      R(c, 0, 100, w, 36, '#3a6a9a');
      for (let x = 0; x < w; x += 2) { const h = 92 - Math.round(9 * Math.sin(x / 40)); R(c, x, h, 2, 44, '#4a6a8a'); }
      for (let x = 60; x < w; x += 280) { R(c, x - 12, 42, 24, 56, '#b8a898'); disc(c, x, 42, 10, '#a89888', true); R(c, x - 2, 24, 4, 8, '#a89888'); }
      for (let i = 0; i < 6; i++) gull(c, rng.int(20, w - 20), rng.int(24, 58));
    },
    mid: (c, w, rng) => {
      for (let x = 0; x < w; x += rng.int(30, 50)) { const bw = rng.int(26, 40), h = rng.int(40, 62); R(c, x, 120 - h, bw, h, '#5a4a5a'); windows(c, x, 120 - h, bw, h, rng, '#f0d070', '#2a1e2a', 2, 3, 3, 4, 0.3); }
    },
    near: (c, w) => {
      R(c, 0, STREET_TOP - 16, w, 16, '#8a7a6a');
      for (let x = 0; x < w; x += 10) R(c, x, STREET_TOP - 30, 2, 15, '#3a3a4a');
      R(c, 0, STREET_TOP - 31, w, 2, '#3a3a4a');
      R(c, 0, STREET_TOP - 29, w, 1, '#8a9aaa');
      for (let x = 30; x < w; x += 120) { R(c, x, STREET_TOP - 46, 26, 16, '#6a5a4a'); R(c, x + 2, STREET_TOP - 44, 22, 2, '#8a7a6a'); }
      for (let x = 0; x < w; x += 6) P(c, x, STREET_TOP - 17, '#6a5a4a');
    },
    floor: (c, w, rng) => {
      R(c, 0, 0, w, 80, '#7a6a5e');
      for (let y = 0; y < 80; y += 6) for (let x = (y / 6) % 2 ? 0 : 5; x < w; x += 10) { R(c, x, y, 9, 5, rng.chance(0.5) ? '#8a7a6e' : '#6e5e52'); }
      R(c, 0, 0, w, 3, '#a89888');
    },
  },

  // ================================================================ TAMPA (afternoon)
  tpa_boardwalk: {
    sky: ['#1c74c8', '#2a86d6', '#3a9ae2', '#54b0ea', '#74c6f0', '#9cd8f6', '#c2e8fa'], sun: [322, 36, 16, '#fff6d0'],
    far: (c, w, rng) => {
      // the afternoon sun, high and hard, with rays across the top of the sky
      sunRays(c, 322, 36, 16, '#fff6c0');
      // the gulf: deep blue at the horizon, turquoise closer in
      sea(c, w, 92, 138, ['#1e6fa8', '#2a7fb4', '#2f8fbe', '#3aa2c8', '#4cb6d2'], 322, '#fff2c0', rng);
      R(c, 0, 92, w, 1, '#bfe6f2');
      // sailboats on the horizon
      for (let bx = 60; bx < w; bx += 210) {
        R(c, bx, 102, 12, 2, '#f6f6f0'); R(c, bx + 5, 94, 1, 9, '#e8e8e0');
        R(c, bx + 6, 95, 5, 6, '#fbfbf6'); R(c, bx + 1, 96, 4, 5, '#f2f2ea');
        R(c, bx - 2, 105, 16, 1, '#cfe8f2');
      }
      // a far pier with a ferris wheel
      for (let px = 40; px < w; px += 480) {
        R(c, px, 88, 120, 3, '#c9b394');
        for (let x = 4; x < 120; x += 14) R(c, px + x, 91, 2, 8, '#a89070');
        disc(c, px + 96, 76, 13, '#e8e2d0'); disc(c, px + 96, 76, 11, '#f6f2e6');
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          P(c, px + 96 + Math.round(Math.cos(a) * 11), 76 + Math.round(Math.sin(a) * 11), '#c9b394');
          P(c, px + 96 + Math.round(Math.cos(a) * 6), 76 + Math.round(Math.sin(a) * 6), '#c9b394');
        }
        R(c, px + 92, 88, 2, 4, '#a89070'); R(c, px + 100, 88, 2, 4, '#a89070');
      }
      clouds(c, w, rng, 24, 56, '#a8d8f2', '#e6f6ff', '#8ac4e6');
      for (let i = 0; i < 6; i++) gull(c, rng.int(10, w - 10), rng.int(28, 70));
    },
    mid: (c, w, rng) => {
      // palm line and beach furniture along the sand
      for (let x = 6; x < w; x += rng.int(38, 58)) palm(c, x, 126, rng.int(40, 58), '#8a6a4a', '#2a7a3a', '#4aa050');
      for (let x = 40; x < w; x += 120) {
        // beach umbrella + towel
        R(c, x, 110, 1, 16, '#c8c8c8');
        for (let k = 0; k < 5; k++) R(c, x - 9 + k * 4, 106 + (k % 2), 4, 4, k % 2 ? '#f6e8d8' : '#e05a4a');
        R(c, x - 10, 106, 21, 2, '#f6e8d8');
        R(c, x + 4, 122, 12, 3, rng.pick(['#4aa0d8', '#f0c850', '#e06a8a']));
      }
      // lifeguard tower
      // lifeguard tower, raised so its cabin and flag clear the pastel roofs in front of it
      for (let x = 180; x < w; x += 520) {
        R(c, x, 64, 26, 32, '#f6f4ee'); R(c, x, 64, 26, 4, '#e05a4a');
        R(c, x - 4, 58, 34, 6, '#dcd8cc'); R(c, x + 6, 68, 14, 9, '#4a7a9a');
        R(c, x - 2, 96, 4, 22, '#c8c4b8'); R(c, x + 24, 96, 4, 22, '#c8c4b8');
        for (let k = 0; k < 3; k++) R(c, x - 2 + k * 12, 100 + k * 5, 30 - k * 12, 2, '#c8c4b8');
        R(c, x + 30, 42, 2, 22, '#8a8a90'); R(c, x + 32, 42, 9, 6, '#e0303c');
      }
      for (let i = 0; i < 4; i++) { const x = rng.int(20, w - 20); R(c, x, rng.int(22, 58), 26, 5, '#f6fbff'); R(c, x + 6, rng.int(18, 54), 14, 5, '#f6fbff'); }
    },
    near: (c, w, rng, sec) => {
      const walls = ['#f4ddc9', '#cbe9da', '#dcd4ea', '#f8ecc4', '#f2d2c0'];
      let x = 0;
      while (x < w) {
        const bw = rng.int(64, 96), top = rng.int(58, 84);
        const wall = rng.pick(walls);
        R(c, x, top, bw, STREET_TOP - top, wall);
        R(c, x, top, bw, 3, '#8a7a6a');
        R(c, x, top - 4, bw, 4, '#6a5a4a');
        for (let i = 0; i < bw; i += 4) P(c, x + i, top - 3, '#8a7a6a');
        // pastel siding + shutters
        for (let y = top + 6; y < STREET_TOP - 32; y += 4) R(c, x + 2, y, bw - 4, 1, '#00000010');
        for (let wy = top + 8; wy < top + 36; wy += 12)
          for (let wx = x + 6; wx < x + bw - 12; wx += 14) {
            R(c, wx - 1, wy - 1, 10, 12, '#8a7a6a');
            R(c, wx, wy, 8, 10, rng.chance(0.5) ? '#7ab8d8' : '#3a5a6a');
            R(c, wx, wy, 8, 1, '#b8e2f2');
            P(c, wx + 4, wy + 1, '#e8f6ff');
          }
        // shop front: big window, striped awning, doorway
        R(c, x + 4, STREET_TOP - 30, bw - 8, 30, '#8a7a6a');
        R(c, x + 7, STREET_TOP - 27, bw - 34, 21, '#2a4a58');
        R(c, x + 8, STREET_TOP - 26, bw - 36, 19, '#9ad0e8');
        R(c, x + 8, STREET_TOP - 26, bw - 36, 2, '#c8ecf6');
        for (let i = 0; i < 3; i++) P(c, x + 12 + i * 8, STREET_TOP - 22, '#f6fbff');
        R(c, x + bw - 20, STREET_TOP - 28, 15, 28, '#6a5a4a');
        R(c, x + bw - 18, STREET_TOP - 26, 11, 26, '#2a3a48');
        awning(c, x + 4, STREET_TOP - 36, bw - 26, rng.pick(['#3a8ac0', '#e05a3a', '#3aa06a']), '#f6f6f2');
        signBoard(c, x + bw / 2, STREET_TOP - 46, rng.pick(['SURF', 'CUBANOS', 'BIKES', 'ICE CREAM', 'SHELLS']), '#f6e8b8', '#3a5a8a');
        // surfboards leaning on the wall and a planter
        R(c, x + bw - 46, STREET_TOP - 22, 4, 22, '#e05a4a'); R(c, x + bw - 49, STREET_TOP - 26, 10, 5, '#f6f2e6');
        P(c, x + bw - 44, STREET_TOP - 14, '#f6f2e6');
        R(c, x + 3, STREET_TOP - 6, 10, 6, '#8a5a3a'); R(c, x + 4, STREET_TOP - 8, 8, 3, '#4aa050');
        x += bw + rng.int(1, 4);
      }
      for (const s of sec.shops) { if (SHOPS[s.shop].venue === 'store') shopFront(c, s, 'tampa'); else vendorBooth(c, s, 'tampa'); }
      // low wooden railing at the back of the boardwalk
      R(c, 0, STREET_TOP - 10, w, 2, '#8a6a4a');
      for (let x2 = 0; x2 < w; x2 += 14) R(c, x2, STREET_TOP - 14, 2, 6, '#8a6a4a');
    },
    floor: (c, w, rng) => {
      // weathered boardwalk planks running along the walk
      R(c, 0, 0, w, 80, '#c2a172');
      for (let y = 0; y < 80; y += 7) {
        R(c, 0, y, w, 6, rng.chance(0.5) ? '#cdac7c' : '#bd9c6e');
        R(c, 0, y, w, 1, '#dcc094');
        R(c, 0, y + 6, w, 1, '#8a6c46');
        for (let x = (y / 7) % 2 ? 0 : 18; x < w; x += 36) {
          R(c, x, y, 1, 6, '#9c7c50');
          P(c, x + 2, y + 2, '#8a6c46'); P(c, x + 2, y + 4, '#8a6c46');
        }
      }
      R(c, 0, 0, w, 2, '#e0c69c');
      for (let i = 0; i < w / 4; i++) P(c, rng.int(0, w), rng.int(2, 78), rng.chance(0.5) ? '#b0905f' : '#d8bc90');
      for (let x = 30; x < w; x += 240) R(c, x, 30, 26, 2, '#e8dcc0');
    },
  },

  tpa_ybor: {
    sky: ['#3a8ad8', '#5aa0e0', '#7ab8ea', '#a0d0f2'],
    far: (c, w, rng) => {
      R(c, 0, 104, w, 32, '#4a8ac0');
      for (let x = 0; x < w; x += rng.int(20, 38)) { const h = rng.int(20, 44); R(c, x, 120 - h, rng.int(14, 24), h + 12, '#8ab8d8'); }
      for (let i = 0; i < 4; i++) { const x = rng.int(0, w); R(c, x, 24 + i * 8, 26, 5, '#f6fbff'); R(c, x + 6, 20 + i * 8, 14, 5, '#f6fbff'); }
    },
    mid: (c, w, rng) => {
      for (let x = 8; x < w; x += 54) palm(c, x, 124, rng.int(40, 54), '#8a6a4a', '#3aa04a', '#5ac05a');
    },
    near: (c, w, rng, sec) => {
      // Ybor brick strip with neon signs
      let x = 0;
      while (x < w) {
        const bw = rng.int(58, 88), top = rng.int(54, 78);
        R(c, x, top, bw, STREET_TOP - top, rng.pick(['#8a3a2a', '#9a4a32', '#7a3428']));
        R(c, x, top, bw, 2, '#3a1a12');
        cornice(c, x, top, bw, '#3a1a12', '#b86a4a');
        windows(c, x + 4, top + 6, bw - 8, 36, rng, '#f0c860', '#2a1a18', 3, 5, 5, 6, 0.35, '#2a1612');
        R(c, x + 4, STREET_TOP - 30, bw - 8, 30, '#2a1a18');
        R(c, x + 8, STREET_TOP - 26, bw - 34, 20, '#4a7a9a');
        R(c, x + 9, STREET_TOP - 25, bw - 36, 18, '#9ad0e8');
        R(c, x + bw - 18, STREET_TOP - 28, 12, 28, '#1a1210');
        awning(c, x + 4, STREET_TOP - 36, bw - 8, rng.pick(['#e05a3a', '#3a8ac0', '#e0a020']), '#f6f6f2');
        signBoard(c, x + bw / 2, STREET_TOP - 46, rng.pick(['CIGARS', 'TAPAS', 'RADIO', 'BAR', 'CAFÉ']), '#1a1012', rng.pick(['#f0d838', '#f06a8a', '#5ae8c0']));
        x += bw + 2;
      }
      for (const s of sec.shops) { if (SHOPS[s.shop].venue === 'store') shopFront(c, s, 'tampa'); else vendorBooth(c, s, 'tampa'); }
      for (let x2 = 0; x2 < w; x2 += 16) { R(c, x2, STREET_TOP - 6, 3, 6, '#8a6a4a'); }
    },
    floor: (c, w, rng) => {
      R(c, 0, 0, w, 80, '#8a8478');
      for (let y = 0; y < 80; y += 16) for (let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) R(c, x, y, 31, 15, rng.chance(0.5) ? '#9a9488' : '#7a7468');
      R(c, 0, 0, w, 3, '#b8b2a6');
    },
  },

  tpa_boss: {
    sky: ['#3a8ad8', '#5aa0e0', '#7ab8ea', '#a0d0f2', '#c8e8fa'], sun: [300, 50, 20, '#fff6c0'],
    far: (c, w, rng) => {
      R(c, 0, 100, w, 36, '#2a7ab8');
      for (let i = 0; i < w / 2; i++) R(c, rng.int(0, w), rng.int(102, 132), rng.int(2, 7), 1, '#5aa8d8');
      for (let i = 0; i < 6; i++) { const x = rng.int(20, w - 20); R(c, x, rng.int(24, 60), 26, 4, '#f6fbff'); R(c, x + 6, rng.int(20, 56), 14, 4, '#f6fbff'); }
      for (let x = 40; x < w; x += 90) palm(c, x, 128, rng.int(38, 52), '#8a6a4a', '#3aa04a', '#5ac05a');
    },
    mid: (c, w, _rng) => {
      R(c, 0, 116, w, 20, '#2a5a7a');
      for (let x = 0; x < w; x += 3) P(c, x, 118 + (x % 5), '#3a7a9a');
      for (let x = 100; x < w; x += 300) { R(c, x, 68, 8, 48, '#8a6a4a'); R(c, x - 4, 64, 16, 4, '#5a3a2a'); }
    },
    near: (c, w) => {
      R(c, 0, STREET_TOP - 8, w, 8, '#8a6a4a');
      for (let x = 20; x < w; x += 60) { R(c, x, STREET_TOP - 22, 3, 14, '#6a4a2a'); R(c, x - 3, STREET_TOP - 24, 9, 3, '#6a4a2a'); }
      R(c, 0, STREET_TOP - 9, w, 2, '#6a4a2a');
      for (let x = 0; x < w; x += 8) R(c, x, STREET_TOP - 4, 4, 4, '#a8825a');
    },
    floor: (c, w, _rng) => {
      R(c, 0, 0, w, 80, '#a8885a');
      for (let y = 0; y < 80; y += 6) { R(c, 0, y, w, 1, '#6a4a2a'); for (let x = (y / 6) % 2 ? 0 : 12; x < w; x += 24) R(c, x, y, 1, 6, '#8a6a3a'); }
      for (let x = 0; x < w; x += 40) R(c, x, 30, 40, 1, '#c8a870');
      R(c, 0, 0, w, 3, '#c8a870');
    },
  },
};

/** Street furniture for the peaceful stretches: benches, planters and lamps along the walk,
 *  so a town section reads as a place to linger rather than a fight waiting to happen. */
function plazaDressing(c: CanvasRenderingContext2D, w: number): void {
  for (let x = 86; x < w - 60; x += 214) {
    R(c, x, STREET_TOP - 15, 30, 2, '#8a6238');
    R(c, x, STREET_TOP - 12, 30, 3, '#5e3f24');
    R(c, x + 2, STREET_TOP - 9, 2, 9, '#33241a');
    R(c, x + 26, STREET_TOP - 9, 2, 9, '#33241a');
    for (let k = 0; k < 3; k++) R(c, x + 3 + k * 9, STREET_TOP - 14, 1, 2, '#a87a4a');
    const px = x + 62;
    R(c, px, STREET_TOP - 9, 18, 9, '#8a5a3a');
    R(c, px, STREET_TOP - 10, 18, 2, '#a8703a');
    disc(c, px + 9, STREET_TOP - 15, 8, '#2e6a32');
    disc(c, px + 5, STREET_TOP - 12, 6, '#3a7a3a');
    disc(c, px + 13, STREET_TOP - 12, 6, '#46843e');
    P(c, px + 4, STREET_TOP - 18, '#e8d040');
    // lamp post between the benches
    const lx = x + 122;
    R(c, lx, STREET_TOP - 42, 2, 42, '#2a2a32');
    R(c, lx - 4, STREET_TOP - 44, 10, 3, '#3a3a44');
    R(c, lx - 3, STREET_TOP - 48, 8, 4, '#f2d888');
    c.globalAlpha = 0.18; disc(c, lx + 1, STREET_TOP - 46, 12, '#ffe8a0'); c.globalAlpha = 1;
  }
}

// The peaceful stretches are the same neighbourhoods with the fight taken out, so they reuse
// their chapter's street art and add plaza furniture in buildBackground. The keys stay
// distinct: chapters reference them separately and a section's look is never shared by accident.
THEMES.ny_plaza = THEMES.ny_block;
THEMES.izm_plaza = THEMES.izm_bazaar;
THEMES.ist_plaza = THEMES.ist_galata;
THEMES.tpa_plaza = THEMES.tpa_boardwalk;

export function buildBackground(theme: string, sec: SectionDef, seed: number): BgLayers {
  const t = THEMES[theme] ?? THEMES.ny_street;
  const rng = new Rng(seed);
  const len = Math.max(sec.length, SCREEN_W);
  const farF = 0.15, midF = 0.45, fgF = 1.3;
  const [sk, skc] = canvas(SCREEN_W, STREET_TOP);
  sky(skc, t.sky, STREET_TOP, t.stars ?? 0, rng);
  if (t.sun) glowDisc(skc, t.sun[0], t.sun[1], t.sun[2], t.sun[3], t.sun[3]);
  const [far, fc] = canvas(SCREEN_W + (len - SCREEN_W) * farF + 2, STREET_TOP); t.far(fc, far.width, rng);
  const [mid, mc] = canvas(SCREEN_W + (len - SCREEN_W) * midF + 2, STREET_TOP); t.mid(mc, mid.width, rng);
  const [near, nc] = canvas(len, STREET_TOP); t.near(nc, len, rng, sec);
  // pavement clutter for the whole chapter, keeping the boss arenas as bare as they read
  if (!sec.boss) {
    const kind: Furniture = theme.startsWith('izm_') ? 'izmir' : theme.startsWith('ist_') ? 'istanbul' : theme.startsWith('tpa_') ? 'tampa' : 'ny';
    streetFurniture(nc, len, rng, sec, kind);
  }
  if (sec.peace) plazaDressing(nc, len);
  const [floor, flc] = canvas(len, SCREEN_H - STREET_TOP); t.floor(flc, len, rng);
  const [fg] = canvas(SCREEN_W + (len - SCREEN_W) * fgF + 2, SCREEN_H);
  return { sky: sk, far, mid, near, floor, fg, farF, midF, fgF };
}
