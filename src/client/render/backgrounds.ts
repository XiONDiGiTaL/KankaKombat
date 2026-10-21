// Procedural pixel-art backgrounds for every street. Each section is composed once into
// layered offscreen canvases (sky, far skyline, mid buildings, street façade, street floor)
// that scroll with parallax. Everything is integer rects, so it stays crisp.

import { SCREEN_H, SCREEN_W, STREET_TOP } from '../../shared/data/constants';
import { SectionDef } from '../../shared/data/stages';
import { SHOPS } from '../../shared/data/shops';
import { Rng } from '../../shared/sim/rng';
import { drawText } from './font';

export interface BgLayers { sky: HTMLCanvasElement; far: HTMLCanvasElement; mid: HTMLCanvasElement; near: HTMLCanvasElement; floor: HTMLCanvasElement; fg: HTMLCanvasElement; farF: number; midF: number; fgF: number }

type Ctx = CanvasRenderingContext2D;
const canvas = (w: number, h: number): [HTMLCanvasElement, Ctx] => {
  const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = h;
  const x = c.getContext('2d')!; x.imageSmoothingEnabled = false; return [c, x];
};
const R = (c: Ctx, x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
const OUT = '#1a1220';

/** Banded sky: discrete colour bands with a checker dither between them. */
function sky(c: Ctx, bands: string[], h: number, stars = 0, rng?: Rng): void {
  const bh = h / bands.length;
  bands.forEach((col, i) => {
    R(c, 0, i * bh, SCREEN_W, bh + 1, col);
    if (i > 0) { c.fillStyle = col; for (let x = 0; x < SCREEN_W; x += 2) c.fillRect(x + (i % 2), Math.round(i * bh) - 1, 1, 1); }
  });
  if (stars && rng) for (let i = 0; i < stars; i++) R(c, rng.int(0, SCREEN_W), rng.int(0, h * 0.6), 1, 1, rng.chance(0.3) ? '#fff6c0' : '#c8d0ff');
}

function disc(c: Ctx, cx: number, cy: number, r: number, col: string, top = false): void {
  c.fillStyle = col;
  for (let y = -r; y <= (top ? 0 : r); y++) { const w = Math.round(Math.sqrt(r * r - y * y)); c.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2 + 1, 1); }
}

function windows(c: Ctx, x: number, y: number, w: number, h: number, rng: Rng, lit: string, dark: string, ww = 3, wh = 4, gx = 3, gy = 4, litP = 0.5): void {
  for (let yy = y + gy; yy + wh < y + h - 2; yy += wh + gy)
    for (let xx = x + gx; xx + ww < x + w - 1; xx += ww + gx) R(c, xx, yy, ww, wh, rng.chance(litP) ? lit : dark);
}

function mosque(c: Ctx, x: number, base: number, s: number, col: string): void {
  R(c, x - 14 * s, base - 10 * s, 28 * s, 10 * s, col);
  disc(c, x, base - 10 * s, 10 * s, col, true);
  disc(c, x - 12 * s, base - 8 * s, 4 * s, col, true); disc(c, x + 12 * s, base - 8 * s, 4 * s, col, true);
  for (const mx of [x - 20 * s, x + 20 * s]) { R(c, mx - 1.5 * s, base - 34 * s, 3 * s, 34 * s, col); R(c, mx - 2.5 * s, base - 24 * s, 5 * s, 1.5 * s, col); R(c, mx - 0.5 * s, base - 40 * s, 1 * s, 6 * s, col); }
  R(c, x - 0.5, base - 22 * s, 1, 3 * s, col);
}

function palm(c: Ctx, x: number, base: number, h: number, trunk: string, leaf: string, leaf2: string): void {
  for (let i = 0; i < h; i++) R(c, x + Math.round(Math.sin(i / h * 1.6) * 3), base - i, 3, 1, i % 4 === 0 ? leaf2 === trunk ? trunk : '#5a3a1a' : trunk);
  const tx = x + Math.round(Math.sin(1.6) * 3) + 1, ty = base - h;
  for (const [dx, dy] of [[-1, 0], [1, 0], [-0.7, 0.5], [0.7, 0.5], [0, -0.4], [-0.9, -0.3], [0.9, -0.3]])
    for (let i = 0; i < 14; i++) R(c, tx + dx * i, ty + dy * i + (i * i) / 22, 2, 2, i % 3 ? leaf : leaf2);
}

function awning(c: Ctx, x: number, y: number, w: number, a: string, b: string): void {
  for (let i = 0; i < w; i += 4) R(c, x + i, y, 4, 6, (i / 4) % 2 ? a : b);
  for (let i = 0; i < w; i += 4) R(c, x + i + 1, y + 6, 2, 1, (i / 4) % 2 ? a : b);
  R(c, x, y - 1, w, 1, OUT);
}

function sign(c: Ctx, x: number, y: number, text: string, bg: string, fg: string): void {
  const w = text.length * 6 + 5;
  R(c, x - 1, y - 1, w + 2, 11, OUT);
  R(c, x, y, w, 9, bg);
  drawText(c, text, x + 3, y + 1, fg, { shadow: null });
}

interface Theme {
  sky: string[]; stars?: number;
  far: (c: Ctx, w: number, rng: Rng) => void;
  mid: (c: Ctx, w: number, rng: Rng) => void;
  facade: (c: Ctx, w: number, rng: Rng, sec: SectionDef) => void;
  floor: (c: Ctx, w: number, rng: Rng) => void;
  fg?: (c: Ctx, w: number, rng: Rng) => void;
  sun?: [number, number, number, string];
}

const FACADE_TOP = 40;

function shopFront(c: Ctx, x: number, shopId: string, wall: string, trim: string, aw: [string, string]): void {
  const s = SHOPS[shopId];
  R(c, x - 40, FACADE_TOP + 20, 80, STREET_TOP - FACADE_TOP - 20, wall);
  R(c, x - 40, FACADE_TOP + 20, 80, 2, trim);
  const name = s.name.toUpperCase();
  const tw = Math.min(78, name.length * 6 + 4);
  R(c, x - tw / 2 - 1, FACADE_TOP + 25, tw + 2, 11, OUT); R(c, x - tw / 2, FACADE_TOP + 26, tw, 9, '#f6e8b8');
  drawText(c, name.length > 12 ? name.slice(0, 12) : name, x, FACADE_TOP + 27, '#7a2010', { shadow: null, align: 'center' });
  awning(c, x - 38, FACADE_TOP + 40, 76, aw[0], aw[1]);
  // open door with warm light
  R(c, x - 13, STREET_TOP - 38, 26, 38, OUT); R(c, x - 12, STREET_TOP - 37, 24, 37, '#f6c860'); R(c, x - 12, STREET_TOP - 37, 24, 6, '#ffe8a0');
  R(c, x - 8, STREET_TOP - 26, 16, 10, '#d8902a'); // counter
  for (const [i, col] of ['#d0202c', '#f6d838', '#6aa83a', '#2a6ad0'].entries()) R(c, x - 7 + i * 4, STREET_TOP - 30, 3, 4, col);
  // shop windows
  for (const wx of [x - 36, x + 16]) { R(c, wx - 1, STREET_TOP - 33, 22, 20, OUT); R(c, wx, STREET_TOP - 32, 20, 18, '#9ad0e8'); R(c, wx + 2, STREET_TOP - 30, 3, 10, '#d8f0ff'); }
}

function buildingRow(c: Ctx, w: number, rng: Rng, palette: string[], opts: { minH: number; maxH: number; lit: string; dark: string; trim?: string; balcony?: boolean; fireEscape?: boolean; signs?: string[]; signCols?: [string, string][]; awnings?: [string, string][]; skipAround?: number[] }): void {
  let x = 0;
  while (x < w) {
    const bw = rng.int(48, 96);
    const h = rng.int(opts.minH, opts.maxH);
    const top = STREET_TOP - h;
    const col = rng.pick(palette);
    R(c, x, top, bw, h, col);
    R(c, x, top, bw, 3, opts.trim ?? OUT);
    R(c, x + bw - 1, top, 1, h, OUT);
    windows(c, x + 2, top + 4, bw - 4, h - 30, rng, opts.lit, opts.dark, 4, 6, 5, 6, 0.4);
    if (opts.balcony) for (let yy = top + 16; yy < STREET_TOP - 34; yy += 12) { R(c, x + 4, yy, bw - 8, 1, OUT); for (let bx = x + 4; bx < x + bw - 4; bx += 3) R(c, bx, yy - 4, 1, 4, OUT); }
    if (opts.fireEscape) for (let yy = top + 14; yy < STREET_TOP - 30; yy += 14) { R(c, x + bw / 2 - 12, yy, 24, 1, '#2a2a30'); R(c, x + bw / 2 - 12, yy - 5, 1, 5, '#2a2a30'); R(c, x + bw / 2 + 11, yy - 5, 1, 5, '#2a2a30'); for (let i = 0; i < 12; i += 2) R(c, x + bw / 2 - 10 + i, yy + 2 + i, 2, 1, '#2a2a30'); }
    // ground floor: storefront
    const gf = STREET_TOP - 28;
    R(c, x, gf, bw, 28, opts.trim ?? '#3a3030');
    R(c, x + 4, gf + 8, bw - 8, 14, '#2a3a4a'); R(c, x + 6, gf + 10, 4, 10, '#4a6a8a');
    if (opts.awnings && rng.chance(0.7)) { const [a, b] = rng.pick(opts.awnings); awning(c, x + 2, gf - 4, bw - 4, a, b); }
    if (opts.signs && rng.chance(0.85)) { const t = rng.pick(opts.signs); const [bg, fg] = rng.pick(opts.signCols ?? [['#f6e8b8', '#7a2010']]); sign(c, x + 4, gf - 16, t, bg, fg); }
    x += bw;
  }
}

function cobble(c: Ctx, w: number, rng: Rng, a: string, b: string, line: string): void {
  R(c, 0, 0, w, SCREEN_H - STREET_TOP, a);
  for (let y = 0; y < SCREEN_H - STREET_TOP; y += 4) for (let x = (y / 4) % 2 ? 0 : 3; x < w; x += 6) { R(c, x, y, 5, 3, rng.chance(0.5) ? a : b); R(c, x, y + 3, 6, 1, line); }
}

function curb(c: Ctx, w: number, top: string, face: string): void {
  R(c, 0, 0, w, 3, top); R(c, 0, 3, w, 2, face);
  for (let x = 0; x < w; x += 16) R(c, x, 0, 1, 5, OUT);
}

const THEMES: Record<string, Theme> = {
  // -------------------------------------------------------------- İstanbul: Kadıköy market at dusk
  ist_market: {
    sky: ['#2a1a4a', '#4a2a6a', '#8a3a7a', '#d0605a', '#f09a5a', '#f6c87a'], sun: [300, 108, 16, '#ffe0a0'],
    far: (c, w, rng) => {
      R(c, 0, 110, w, 30, '#3a5a8a'); for (let x = 0; x < w; x += 7) R(c, x + rng.int(0, 3), 112 + rng.int(0, 20), 4, 1, '#f6c87a');
      for (let x = 30; x < w; x += rng.int(110, 160)) mosque(c, x, 112, rng.chance(0.5) ? 1 : 0.8, '#3a2440');
      for (let x = 0; x < w; x += rng.int(14, 26)) R(c, x, 104 - rng.int(0, 10), rng.int(8, 16), 30, '#4a2e4a');
    },
    mid: (c, w, rng) => { for (let x = 0; x < w; x += rng.int(30, 50)) { const h = rng.int(30, 60), bw = rng.int(26, 44); R(c, x, STREET_TOP - h - 10, bw, h + 10, '#5a3a5a'); windows(c, x, STREET_TOP - h - 10, bw, h, rng, '#f6c860', '#3a2440', 2, 3, 4, 4, 0.35); } },
    facade: (c, w, rng, sec) => {
      buildingRow(c, w, rng, ['#d89a7a', '#e8c08a', '#b8a0c8', '#a8c8b0', '#e0a8a0'], { minH: 70, maxH: 96, lit: '#f6d888', dark: '#4a3a5a', trim: '#6a3a3a', balcony: true, signs: ['KASAP', 'BALIK', 'ÇAY', 'BAKKAL', 'LOKANTA', 'SİMİT', 'KUAFÖR', 'BÜFE'], signCols: [['#f6e8b8', '#a02020'], ['#2a6ad0', '#ffffff'], ['#c02a2a', '#f6e8b8']], awnings: [['#c02a2a', '#f6e8b8'], ['#2a7a3a', '#f6e8b8'], ['#2a5ab0', '#f6f6f6']] });
      for (const s of sec.shops) shopFront(c, s.x, s.shop, '#a86a4a', '#6a3a2a', ['#c02a2a', '#f6e8b8']);
      for (let x = 160; x < w; x += 260) { R(c, x, STREET_TOP - 22, 30, 10, '#8a5a2a'); for (let i = 0; i < 6; i++) R(c, x + 2 + i * 5, STREET_TOP - 26, 4, 4, rng.pick(['#e0303c', '#f08a20', '#f6d838', '#6aa83a'])); }
    },
    floor: (c, w, rng) => { cobble(c, w, rng, '#8a7a72', '#7a6a62', '#5a4a48'); curb(c, w, '#b8a8a0', '#6a5a58'); },
  },
  // -------------------------------------------------------------- İstanbul: Galata slope at night, with tram
  ist_tram: {
    sky: ['#0a0a24', '#14143a', '#1e1e4e', '#2a2a5e', '#3a3070'], stars: 70,
    far: (c, w) => {
      // Galata tower repeated far away
      for (let x = 120; x < w; x += 380) { R(c, x, 50, 18, 70, '#2a2440'); disc(c, x + 9, 50, 11, '#2a2440', true); R(c, x + 8, 30, 2, 10, '#2a2440'); for (let y = 60; y < 110; y += 10) R(c, x + 6, y, 2, 3, '#f6d888'); }
      R(c, 0, 108, w, 40, '#24203a');
    },
    mid: (c, w, rng) => { for (let x = 0; x < w; x += rng.int(28, 46)) { const h = rng.int(40, 70), bw = rng.int(26, 40); R(c, x, STREET_TOP - h, bw, h, '#2e2a4a'); windows(c, x, STREET_TOP - h, bw, h, rng, '#f6d070', '#1e1a34', 2, 3, 4, 4, 0.45); } },
    facade: (c, w, rng, sec) => {
      buildingRow(c, w, rng, ['#6a5a7a', '#7a6a5a', '#5a6a7a', '#7a5a5a'], { minH: 80, maxH: 96, lit: '#f6d070', dark: '#2a2440', trim: '#3a2a3a', balcony: true, signs: ['İSTİKLAL', 'PASAJ', 'MEYHANE', 'PLAK', 'KÜNEFE', 'DÖNER'], signCols: [['#f0c040', '#3a1a10'], ['#c02a2a', '#fff6e0'], ['#30c0a0', '#102a20']], awnings: [['#7a2a3a', '#e8c08a'], ['#2a3a6a', '#e8c08a']] });
      for (const s of sec.shops) shopFront(c, s.x, s.shop, '#5a4a6a', '#3a2a3a', ['#7a2a3a', '#e8c08a']);
      for (let x = 60; x < w; x += 140) { R(c, x, 60, 1, STREET_TOP - 60, '#1a1a24'); R(c, x - 3, 58, 7, 3, '#1a1a24'); R(c, x - 2, 61, 5, 2, '#fff0a0'); }
    },
    floor: (c, w, rng) => {
      cobble(c, w, rng, '#5a5468', '#4e4a5e', '#3a3648');
      curb(c, w, '#8a8498', '#4a4658');
      for (const z of [24, 38]) { R(c, 0, z, w, 2, '#b8b8c8'); R(c, 0, z + 2, w, 1, '#2a2838'); }
      for (let x = 0; x < w; x += 8) R(c, x, 26, 3, 12, '#3a3448');
    },
  },
  // -------------------------------------------------------------- İstanbul boss: rooftop over the Bosphorus
  ist_roof: {
    sky: ['#06061a', '#0e0e2a', '#16163a', '#20204a'], stars: 90, sun: [70, 40, 12, '#f6f0d0'],
    far: (c, w) => {
      R(c, 0, 104, w, 40, '#14203a');
      // suspension bridge with lights
      R(c, 0, 96, w, 2, '#3a3a5a'); for (const tx of [80, 300]) { R(c, tx, 60, 4, 40, '#3a3a5a'); }
      for (let x = 0; x < w; x++) { const y = 62 + Math.round(30 * Math.pow(((x - 190) / 110), 2)); if (y < 97) R(c, x, y, 1, 1, '#5a5a8a'); if (x % 9 === 0) R(c, x, 97, 1, 1, '#f6d070'); }
      for (let x = 0; x < w; x += 11) R(c, x, 108 + (x % 5), 3, 1, '#4a5a8a');
    },
    mid: (c, w, rng) => { for (let x = 0; x < w; x += rng.int(30, 60)) mosque(c, x, 128, 0.6, '#1a1a30'); },
    facade: (c, w) => {
      R(c, 0, STREET_TOP - 14, w, 14, '#4a4a58'); R(c, 0, STREET_TOP - 14, w, 2, '#6a6a7a');
      for (let x = 20; x < w; x += 140) { R(c, x, STREET_TOP - 46, 26, 32, '#5a5a6a'); disc(c, x + 13, STREET_TOP - 46, 13, '#6a6a7a', true); R(c, x + 4, STREET_TOP - 30, 18, 2, '#3a3a48'); }
      for (let x = 90; x < w; x += 200) { disc(c, x, STREET_TOP - 34, 8, '#c8c8d0'); R(c, x - 1, STREET_TOP - 26, 2, 12, '#8a8a98'); }
      for (let x = 0; x < w; x += 6) R(c, x, STREET_TOP - 22, 1, 8, '#2a2a34');
      R(c, 0, STREET_TOP - 23, w, 1, '#2a2a34');
    },
    floor: (c, w, rng) => { R(c, 0, 0, w, SCREEN_H - STREET_TOP, '#6a6a74'); for (let i = 0; i < w / 3; i++) R(c, rng.int(0, w), rng.int(0, 70), 2, 1, rng.chance(0.5) ? '#5a5a64' : '#7a7a84'); for (let x = 0; x < w; x += 32) R(c, x, 0, 1, 80, '#5a5a64'); },
  },
  // -------------------------------------------------------------- İzmir: Kordon seafront at sunset
  izm_kordon: {
    sky: ['#3a3a8a', '#7a4a9a', '#d05a6a', '#f08a4a', '#f6b85a', '#f6d88a'], sun: [250, 100, 20, '#fff0b0'],
    far: (c, w, rng) => {
      for (let x = 0; x < w; x += 2) R(c, x, 92 - Math.round(10 * Math.sin(x / 50) + 6 * Math.sin(x / 17)), 2, 30, '#6a4a7a');
      R(c, 0, 104, w, 40, '#3a6aa0'); for (let i = 0; i < w / 2; i++) R(c, rng.int(0, w), rng.int(106, 135), rng.int(2, 6), 1, rng.chance(0.3) ? '#f6d88a' : '#5a8ac0');
      for (let i = 0; i < 6; i++) { const x = rng.int(20, w - 20); R(c, x, 110, 12, 3, '#f0f0f0'); R(c, x + 5, 102, 1, 8, '#f0f0f0'); R(c, x + 6, 103, 4, 5, '#f6f6f6'); }
    },
    mid: (c, w) => { for (let x = 30; x < w; x += 60) palm(c, x, STREET_TOP - 10, 46, '#7a5a3a', '#2a7a3a', '#3a9a4a'); },
    facade: (c, w, _rng, sec) => {
      // promenade railing with the sea behind it
      R(c, 0, STREET_TOP - 12, w, 12, '#d8c8a8'); R(c, 0, STREET_TOP - 12, w, 1, '#f6ead0');
      for (let x = 0; x < w; x += 8) R(c, x, STREET_TOP - 26, 2, 14, '#3a5a6a');
      R(c, 0, STREET_TOP - 27, w, 2, '#3a5a6a');
      for (let x = 100; x < w; x += 220) { R(c, x, STREET_TOP - 50, 2, 38, '#2a3a4a'); R(c, x - 4, STREET_TOP - 52, 10, 3, '#2a3a4a'); R(c, x - 3, STREET_TOP - 49, 8, 2, '#fff0a0'); }
      for (const s of sec.shops) { R(c, s.x - 36, STREET_TOP - 56, 72, 56, '#f6f0e0'); shopFront(c, s.x, s.shop, '#f6f0e0', '#2a6ad0', ['#2a6ad0', '#f6f6f6']); }
      for (let x = 260; x < w; x += 300) { R(c, x, STREET_TOP - 18, 26, 4, '#7a4a2a'); R(c, x + 2, STREET_TOP - 14, 2, 6, '#5a3a1a'); R(c, x + 22, STREET_TOP - 14, 2, 6, '#5a3a1a'); }
    },
    floor: (c, w, rng) => {
      R(c, 0, 0, w, 80, '#c8b08a');
      for (let y = 0; y < 80; y += 8) for (let x = (y / 8) % 2 ? 0 : 8; x < w; x += 16) R(c, x, y, 15, 7, rng.chance(0.5) ? '#d8c09a' : '#c0a882');
      R(c, 0, 44, w, 18, '#c84a3a'); for (let x = 0; x < w; x += 40) { R(c, x + 10, 52, 12, 1, '#f6f6f6'); }
      curb(c, w, '#f0e6d0', '#a89070');
    },
  },
  // -------------------------------------------------------------- İzmir: Kemeraltı bazaar by day
  izm_bazaar: {
    sky: ['#4a8ad0', '#6aa8e0', '#8ac0ea', '#b0d8f0'],
    far: (c, w, rng) => { for (let x = 0; x < w; x += rng.int(16, 30)) { const h = rng.int(20, 50); R(c, x, 120 - h, rng.int(14, 26), h + 20, '#9ab0c8'); } for (let x = 60; x < w; x += 260) mosque(c, x, 118, 0.7, '#8aa0b8'); },
    mid: (c, w, rng) => { for (let x = 0; x < w; x += rng.int(30, 46)) { const h = rng.int(36, 56), bw = rng.int(26, 40); R(c, x, STREET_TOP - h, bw, h, rng.pick(['#e8d8b8', '#f0c8a0', '#d8e0e8'])); windows(c, x, STREET_TOP - h, bw, h, rng, '#5a7a9a', '#4a6a8a', 3, 4, 5, 5, 0.5); } },
    facade: (c, w, rng, sec) => {
      buildingRow(c, w, rng, ['#e8c890', '#f0d8b0', '#e0b890', '#d8c8a8'], { minH: 70, maxH: 90, lit: '#3a5a7a', dark: '#2a4a6a', trim: '#8a5a3a', signs: ['KEMERALTI', 'BOYOZ', 'KUMRU', 'LOKMA', 'GEVREK', 'KUMAŞ', 'BAHARAT'], signCols: [['#2a6ad0', '#ffffff'], ['#f6e8b8', '#7a2010'], ['#c02a2a', '#ffffff']], awnings: [['#2a6ad0', '#f6f6f6'], ['#e0a020', '#f6f6f6'], ['#c02a2a', '#f6f6f6']] });
      for (let x = 0; x < w; x += 24) { R(c, x, 44, 1, 10, '#5a3a1a'); R(c, x - 3, 54, 7, 6, rng.pick(['#c02a2a', '#2a6ad0', '#e0a020', '#3a9a4a', '#8a3a9a'])); }
      R(c, 0, 43, w, 1, '#5a3a1a');
      for (const s of sec.shops) shopFront(c, s.x, s.shop, '#c8905a', '#8a5a3a', ['#e0a020', '#f6f6f6']);
    },
    floor: (c, w, rng) => { cobble(c, w, rng, '#b8a080', '#a89070', '#8a7458'); curb(c, w, '#d8c8a8', '#8a7458'); },
  },
  // -------------------------------------------------------------- İzmir boss: Konak square, clock tower
  izm_stage: {
    sky: ['#2a2a6a', '#5a3a8a', '#a04a8a', '#e0607a', '#f69a6a'],
    far: (c, w) => {
      R(c, 0, 108, w, 30, '#3a5a90');
      const x = 190; R(c, x - 9, 30, 18, 80, '#e8d8b8'); R(c, x - 12, 104, 24, 6, '#d8c8a8'); disc(c, x, 30, 9, '#c8b898', true); R(c, x - 1, 16, 2, 6, '#c8b898');
      disc(c, x, 50, 5, '#f6f6f0'); R(c, x, 46, 1, 4, OUT); R(c, x, 50, 3, 1, OUT);
      for (let y = 62; y < 104; y += 10) { R(c, x - 6, y, 3, 5, '#7a5a3a'); R(c, x + 3, y, 3, 5, '#7a5a3a'); }
    },
    mid: (c, w) => { for (let x = 20; x < w; x += 90) palm(c, x, STREET_TOP - 8, 40, '#6a4a3a', '#2a6a3a', '#3a8a4a'); },
    facade: (c, w) => {
      R(c, 0, STREET_TOP - 10, w, 10, '#c8b898');
      for (let x = 0; x < w; x += 4) { const y = STREET_TOP - 50 + Math.round(8 * Math.sin(x / 30)); R(c, x, y, 1, 1, '#3a3a3a'); if (x % 16 === 0) R(c, x, y + 1, 2, 2, ['#f6d838', '#e0303c', '#30c0f0', '#6aea6a'][(x / 16) % 4]); }
      // promoter's stage
      R(c, 120, STREET_TOP - 40, 150, 30, '#3a2a4a'); R(c, 120, STREET_TOP - 40, 150, 3, '#f0c040');
      drawText(c, 'KORDON MAIN EVENT', 195, STREET_TOP - 32, '#f0c040', { align: 'center' });
    },
    floor: (c, w, rng) => { R(c, 0, 0, w, 80, '#b8a890'); for (let y = 0; y < 80; y += 10) for (let x = 0; x < w; x += 10) R(c, x + ((y / 10) % 2) * 5, y, 9, 9, rng.chance(0.5) ? '#c8b8a0' : '#a89880'); },
  },
  // -------------------------------------------------------------- New York: Flatbush Avenue at dusk
  nyc_street: {
    sky: ['#1a1a3a', '#2a2a5a', '#4a3a6a', '#8a4a6a', '#c86a5a'],
    far: (c, w, rng) => { for (let x = 0; x < w; x += rng.int(10, 22)) { const h = rng.int(40, 100); const bw = rng.int(10, 20); R(c, x, 130 - h, bw, h, '#2a2a4a'); windows(c, x, 130 - h, bw, h, rng, '#c8b060', '#2a2a4a', 1, 2, 2, 3, 0.4); if (rng.chance(0.15)) R(c, x + bw / 2, 130 - h - 12, 1, 12, '#2a2a4a'); } },
    mid: (c, w, rng) => { for (let x = 0; x < w; x += rng.int(30, 50)) { const h = rng.int(50, 80), bw = rng.int(28, 44); R(c, x, STREET_TOP - h, bw, h, '#4a2e3a'); windows(c, x, STREET_TOP - h, bw, h, rng, '#f0c860', '#2a1a24', 3, 3, 4, 5, 0.4); if (rng.chance(0.4)) { R(c, x + 6, STREET_TOP - h - 14, 12, 12, '#5a3a2a'); R(c, x + 5, STREET_TOP - h - 16, 14, 2, '#3a2a1a'); } } },
    facade: (c, w, rng, sec) => {
      buildingRow(c, w, rng, ['#8a3a2a', '#9a4a32', '#7a3428', '#6a3a3a'], { minH: 84, maxH: 96, lit: '#f0d070', dark: '#2a1a24', trim: '#3a2020', fireEscape: true, signs: ['DELI', 'PIZZA', 'LAUNDRY', 'BAGELS', '99 CENT', 'PAWN', 'CHECKS'], signCols: [['#f0d838', '#1a1a1a'], ['#e0303c', '#ffffff'], ['#30a060', '#ffffff']], awnings: [['#2a6a3a', '#f0f0f0'], ['#c02a2a', '#f0f0f0'], ['#2a3a8a', '#f0f0f0']] });
      for (const s of sec.shops) shopFront(c, s.x, s.shop, '#5a3a2a', '#2a1a14', ['#2a6a3a', '#f0f0f0']);
      for (let x = 30; x < w; x += 180) { // graffiti
        const cols = ['#e0303c', '#30c0f0', '#f6d838', '#e060c0', '#6aea6a'];
        for (let i = 0; i < 18; i++) R(c, x + i * 2, STREET_TOP - 24 + Math.round(3 * Math.sin(i / 2 + x)), 2, 4, cols[(i + x) % cols.length]);
      }
      for (let x = 110; x < w; x += 300) { R(c, x, STREET_TOP - 10, 6, 10, '#c02a2a'); R(c, x - 1, STREET_TOP - 11, 8, 2, '#c02a2a'); }
    },
    floor: (c, w) => {
      R(c, 0, 0, w, 20, '#9a9aa4'); for (let x = 0; x < w; x += 16) R(c, x, 0, 1, 20, '#7a7a84');
      curb(c, w, '#b8b8c0', '#6a6a74');
      R(c, 0, 20, w, 60, '#3a3a44');
      for (let x = 0; x < w; x += 40) R(c, x, 50, 20, 2, '#f0d838');
      for (let x = 300; x < w; x += 600) for (let i = 0; i < 8; i++) R(c, x + i * 8, 22, 5, 40, '#e8e8e8');
    },
  },
  // -------------------------------------------------------------- New York: subway platform
  nyc_subway: {
    sky: ['#1a1a20', '#22222a', '#2a2a34'],
    far: (c, w) => { R(c, 0, 0, w, 140, '#22222a'); },
    mid: (c, w) => { R(c, 0, 0, w, 140, '#2a2a34'); },
    facade: (c, w, rng, sec) => {
      R(c, 0, FACADE_TOP - 40, w, STREET_TOP - FACADE_TOP + 40, '#e8e8e0');
      for (let y = FACADE_TOP - 40; y < STREET_TOP; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < w; x += 8) R(c, x, y, 7, 3, rng.chance(0.08) ? '#c8c8c0' : '#f0f0e8');
      R(c, 0, 70, w, 10, '#2a7a3a'); R(c, 0, 82, w, 3, '#2a7a3a');
      for (let x = 60; x < w; x += 260) { R(c, x, 88, 80, 14, '#1a1a1a'); drawText(c, 'FLATBUSH AV', x + 40, 92, '#ffffff', { align: 'center' }); for (const [i, col] of ['#e0303c', '#e0303c', '#3a9a4a', '#3a9a4a'].entries()) disc(c, x + 96 + i * 12, 95, 5, col); for (const [i, n] of ['2', '3', '4', '5'].entries()) drawText(c, n, x + 94 + i * 12, 92, '#ffffff', { shadow: null }); }
      for (let x = 0; x < w; x += 120) { R(c, x, FACADE_TOP - 40, 12, STREET_TOP - FACADE_TOP + 40, '#3a5a8a'); R(c, x + 2, FACADE_TOP - 40, 2, STREET_TOP - FACADE_TOP + 40, '#5a7aaa'); }
      for (const s of sec.shops) shopFront(c, s.x, s.shop, '#8a6a4a', '#3a2a1a', ['#c02a2a', '#f0f0f0']);
      for (let x = 30; x < w; x += 70) R(c, x, 0, 30, 3, '#f6f0c0');
    },
    floor: (c, w) => {
      R(c, 0, 0, w, 80, '#8a8a92'); for (let x = 0; x < w; x += 20) R(c, x, 0, 1, 56, '#7a7a82');
      R(c, 0, 56, w, 6, '#f0d838'); for (let x = 0; x < w; x += 3) R(c, x, 57, 1, 4, '#c8b020');
      R(c, 0, 62, w, 18, '#1a1a1e'); R(c, 0, 66, w, 2, '#8a8a90'); R(c, 0, 74, w, 2, '#8a8a90');
    },
  },
  // -------------------------------------------------------------- New York boss: the boiler room
  nyc_ring: {
    sky: ['#140e10', '#1e1418', '#281a20'],
    far: (c, w) => { R(c, 0, 0, w, 140, '#1e1418'); },
    mid: (c, w, rng) => { for (let x = 0; x < w; x += 6) { const h = rng.int(18, 30); R(c, x, STREET_TOP - h, 5, h, '#120c0e'); disc(c, x + 2, STREET_TOP - h - 2, 3, '#120c0e'); } },
    facade: (c, w) => {
      R(c, 0, 0, w, STREET_TOP - 30, '#3a2a2a');
      for (let y = 0; y < STREET_TOP - 30; y += 6) for (let x = (y / 6) % 2 ? 0 : 6; x < w; x += 12) R(c, x, y, 11, 5, '#4a3030');
      for (const y of [20, 34]) { R(c, 0, y, w, 6, '#6a6a5a'); R(c, 0, y, w, 1, '#8a8a7a'); for (let x = 30; x < w; x += 70) R(c, x, y - 1, 4, 8, '#5a5a4a'); }
      for (let x = 0; x < w; x += 4) for (let y = STREET_TOP - 60; y < STREET_TOP - 28; y += 4) { R(c, x, y, 1, 1, '#6a6a6a'); R(c, x + 2, y + 2, 1, 1, '#6a6a6a'); }
      for (let x = 60; x < w; x += 140) { R(c, x, 0, 1, 50, '#2a2a2a'); R(c, x - 6, 50, 13, 4, '#3a3a3a'); R(c, x - 4, 54, 9, 2, '#fff0a0'); }
      drawText(c, 'NO RULES', 192, 70, '#e0303c', { align: 'center', scale: 2 });
    },
    floor: (c, w, rng) => { R(c, 0, 0, w, 80, '#4a4442'); for (let i = 0; i < w / 2; i++) R(c, rng.int(0, w), rng.int(0, 80), rng.int(1, 4), 1, rng.chance(0.5) ? '#3a3432' : '#5a5452'); R(c, 0, 0, w, 2, '#e0303c'); },
  },
  // -------------------------------------------------------------- Tampa: Ybor strip mall
  tpa_mall: {
    sky: ['#2a8ae0', '#4aa0e8', '#6ab8f0', '#90d0f6', '#b8e4fa'], sun: [330, 30, 14, '#fff6c0'],
    far: (c, w, rng) => { for (let x = 0; x < w; x += rng.int(20, 40)) R(c, x, 100 - rng.int(0, 40), rng.int(14, 24), 60, '#8ab8d8'); for (let i = 0; i < 4; i++) { const x = rng.int(0, w); R(c, x, 30 + i * 9, 26, 5, '#f6fbff'); R(c, x + 6, 26 + i * 9, 14, 5, '#f6fbff'); } },
    mid: (c, w) => { for (let x = 10; x < w; x += 50) palm(c, x, STREET_TOP - 30, 54, '#8a6a4a', '#3aa04a', '#5ac05a'); },
    facade: (c, w, rng, sec) => {
      let x = 0;
      const names = ['VAPE CITY', 'NAILS', 'PAWN', 'DENTIST', 'PIZZA', 'TAX PREP', 'TATTOO', 'CUBANOS', 'BAIT&TACKLE', 'MATTRESS'];
      while (x < w) {
        const bw = rng.int(64, 90);
        R(c, x, STREET_TOP - 56, bw, 56, rng.pick(['#f0e0c8', '#e8d0b8', '#f6e8d8', '#d8e8e0']));
        R(c, x, STREET_TOP - 56, bw, 10, rng.pick(['#e05a3a', '#3a8ac0', '#3aa06a', '#e0a020']));
        drawText(c, rng.pick(names), x + bw / 2, STREET_TOP - 54, '#ffffff', { align: 'center' });
        R(c, x + 6, STREET_TOP - 36, bw - 12, 26, '#4a7a9a'); R(c, x + 8, STREET_TOP - 34, 4, 22, '#8ac0e0');
        R(c, x + bw - 1, STREET_TOP - 56, 1, 56, '#8a7a6a');
        x += bw;
      }
      R(c, 0, STREET_TOP - 46, w, 2, '#c8b8a0');
      for (const s of sec.shops) shopFront(c, s.x, s.shop, '#f0d8b0', '#e05a3a', ['#e05a3a', '#f6f6f6']);
    },
    floor: (c, w) => { R(c, 0, 0, w, 14, '#d8d0c0'); curb(c, w, '#e8e0d0', '#a8a090'); R(c, 0, 14, w, 66, '#5a5a62'); for (let x = 0; x < w; x += 48) { R(c, x, 22, 2, 30, '#f0f0f0'); } },
  },
  // -------------------------------------------------------------- Tampa: Bayshore lot at sunset
  tpa_lot: {
    sky: ['#4a3aa0', '#a04a9a', '#e05a7a', '#f68a5a', '#f6b85a'], sun: [80, 96, 18, '#fff0a0'],
    far: (c, w, rng) => {
      R(c, 0, 106, w, 40, '#3a5a9a'); for (let i = 0; i < w / 3; i++) R(c, rng.int(0, w), rng.int(108, 135), rng.int(2, 5), 1, rng.chance(0.4) ? '#f6b85a' : '#5a7ab0');
      // Moorish minarets of a grand old hotel
      for (let x = 240; x < w; x += 420) { R(c, x - 40, 80, 80, 26, '#a05a5a'); for (const mx of [x - 34, x - 10, x + 14, x + 34]) { R(c, mx - 2, 64, 5, 18, '#a05a5a'); disc(c, mx, 64, 4, '#d8d8e0', true); R(c, mx, 56, 1, 5, '#d8d8e0'); } }
    },
    mid: (c, w) => { for (let x = 30; x < w; x += 70) palm(c, x, STREET_TOP - 6, 50, '#5a3a2a', '#2a5a3a', '#3a7a4a'); },
    facade: (c, w, _rng, sec) => {
      R(c, 0, STREET_TOP - 10, w, 10, '#c8a888'); R(c, 0, STREET_TOP - 10, w, 1, '#e8c8a8');
      for (let x = 0; x < w; x += 10) R(c, x, STREET_TOP - 18, 2, 8, '#f0f0f0');
      R(c, 0, STREET_TOP - 19, w, 2, '#f0f0f0');
      for (const s of sec.shops) { R(c, s.x - 40, STREET_TOP - 60, 80, 60, '#f6e0c0'); shopFront(c, s.x, s.shop, '#f6e0c0', '#3aa06a', ['#3aa06a', '#f6f6f6']); }
    },
    floor: (c, w) => { R(c, 0, 0, w, 80, '#4a4a54'); for (let x = 0; x < w; x += 40) { R(c, x, 4, 2, 24, '#f0f0f0'); R(c, x, 40, 2, 24, '#f0f0f0'); } R(c, 0, 32, w, 2, '#f0d838'); for (let x = 20; x < w; x += 160) { R(c, x, 12, 10, 6, '#3a3a40'); } },
  },
  // -------------------------------------------------------------- Tampa boss: swamp dock
  tpa_dock: {
    sky: ['#2a2a5a', '#4a3a6a', '#7a4a6a', '#a0605a'],
    far: (c, w, rng) => {
      R(c, 0, 96, w, 50, '#2a4a3a'); for (let i = 0; i < w / 3; i++) R(c, rng.int(0, w), rng.int(98, 135), rng.int(2, 6), 1, '#3a6a4a');
      for (let x = 0; x < w; x += rng.int(18, 30)) { R(c, x + 4, 50, 4, 50, '#2a2a20'); for (let i = 0; i < 4; i++) disc(c, x + 6 + rng.int(-8, 8), 52 + i * 6, 7, '#1a3a24'); for (let i = 0; i < 5; i++) R(c, x + rng.int(-4, 14), 56, 1, rng.int(10, 24), '#5a6a4a'); }
    },
    mid: (c, w) => { for (let x = 50; x < w; x += 170) { R(c, x, 118, 10, 2, '#2a3a20'); R(c, x + 1, 116, 2, 2, '#c8d040'); R(c, x + 6, 116, 2, 2, '#c8d040'); } },
    facade: (c, w) => {
      R(c, 0, STREET_TOP - 30, w, 30, '#2a4a3a');
      for (let x = 0; x < w; x += 30) R(c, x, STREET_TOP - 30, 4, 30, '#4a3424');
      R(c, 0, STREET_TOP - 32, w, 3, '#5a4030');
      R(c, 230, STREET_TOP - 46, 70, 16, '#8a8a90'); R(c, 240, STREET_TOP - 62, 20, 16, '#6a6a70'); disc(c, 280, STREET_TOP - 54, 9, '#5a5a60');
      drawText(c, 'GUS', 265, STREET_TOP - 42, '#e0303c', { align: 'center' });
    },
    floor: (c, w) => { R(c, 0, 0, w, 80, '#7a5a3a'); for (let y = 0; y < 80; y += 6) { R(c, 0, y, w, 1, '#4a3424'); for (let x = (y * 7) % 40; x < w; x += 40) R(c, x, y, 1, 6, '#5a4030'); } },
  },
};

export function buildBackground(theme: string, sec: SectionDef, seed: number): BgLayers {
  const t = THEMES[theme] ?? THEMES.ist_market;
  const rng = new Rng(seed);
  const len = Math.max(sec.length, SCREEN_W);
  const farF = 0.15, midF = 0.45, fgF = 1.3;
  const [sk, skc] = canvas(SCREEN_W, STREET_TOP); sky(skc, t.sky, STREET_TOP, t.stars ?? 0, rng);
  if (t.sun) { const [x, y, r, col] = t.sun; disc(skc, x, y, r, col); disc(skc, x, y, r - 3, '#fffbe8'); }
  const [far, fc] = canvas(SCREEN_W + (len - SCREEN_W) * farF + 2, STREET_TOP); t.far(fc, far.width, rng);
  const [mid, mc] = canvas(SCREEN_W + (len - SCREEN_W) * midF + 2, STREET_TOP); t.mid(mc, mid.width, rng);
  const [near, nc] = canvas(len, STREET_TOP); t.facade(nc, len, rng, sec);
  const [floor, flc] = canvas(len, SCREEN_H - STREET_TOP); t.floor(flc, len, rng);
  const [fg, fgc] = canvas(SCREEN_W + (len - SCREEN_W) * fgF + 2, SCREEN_H);
  if (t.fg) t.fg(fgc, fg.width, rng);
  return { sky: sk, far, mid, near, floor, fg, farF, midF, fgF };
}
