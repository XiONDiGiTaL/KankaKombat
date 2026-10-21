// Procedural head builder for the enemy / boss roster. Produces the same character-map
// HeadDef the hand-authored hero heads use, so everything goes through one pipeline.

import { HeadDef } from './rig';

export interface HeadOpts {
  skin: string; skinShade: string;
  hair: string; hairShade: string; hairHi?: string;
  style: 'short' | 'buzz' | 'bald' | 'slick' | 'mohawk' | 'long' | 'curly' | 'bun' | 'ponytail' | 'balding' | 'pompadour';
  hat?: 'fez' | 'flatcap' | 'beanie' | 'cap' | 'capback' | 'bandana' | 'sunhat' | 'visor' | 'trucker';
  hatColor?: string; hatShade?: string; hatAccent?: string;
  facial?: 'stubble' | 'mustache' | 'handlebar' | 'beard' | 'goatee' | 'whitebeard' | 'chops';
  facialColor?: string;
  eyes?: 'shades' | 'glasses' | 'angry' | 'normal';
  big?: boolean;                // bosses: wider, taller head
  wrinkles?: boolean;
  earring?: boolean;
  lips?: string;
  wide?: number;                // extra face width
}

type G = string[][];

export function makeHead(o: HeadOpts): HeadDef {
  const W = o.big ? 22 : 20, H = o.big ? 22 : 20;
  const g: G = Array.from({ length: H }, () => Array(W).fill('.'));
  const set = (x: number, y: number, c: string) => { if (x >= 0 && y >= 0 && x < W && y < H) g[y][x] = c; };
  const get = (x: number, y: number) => (x >= 0 && y >= 0 && x < W && y < H ? g[y][x] : '.');
  const ell = (cx: number, cy: number, rx: number, ry: number, c: string, keep?: (x: number, y: number) => boolean) => {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const dx = (x - cx) / (rx + 0.4), dy = (y - cy) / (ry + 0.4);
      if (dx * dx + dy * dy <= 1 && (!keep || keep(x, y))) set(x, y, c);
    }
  };
  const B = o.big ? 1 : 0, w = o.wide ?? 0;
  const cx = 11 + B, cy = 10 + B;
  // skull + face
  ell(cx, cy, 5.6 + B + w * 0.5, 6.2 + B, 's');
  ell(cx - 3.5, cy - 1, 4 + B, 5.5 + B, 's'); // back of the skull
  // jaw shading + ear
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (get(x, y) === 's' && (get(x, y + 1) === '.' || get(x - 1, y) === '.')) set(x, y, 'S');
  set(cx - 4, cy, 'S'); set(cx - 4, cy + 1, 'S'); set(cx - 5, cy, 's'); set(cx - 5, cy + 1, 'S');
  const ex1 = cx - 2, ex2 = cx + 3 + Math.round(w / 2), ey = cy - 1;
  // hair styles
  const hairTop = (rows: number, c = 'h') => ell(cx - 0.5, cy - 3 - B, 6.2 + B + w * 0.5, 4.6 + B, c, (x, y) => y <= cy - 8 + rows || (x < cx - 1 && y <= cy - 6 + rows));
  const backHair = (to: number) => { for (let y = cy - 6; y <= to; y++) for (let x = cx - 9; x <= cx - 4; x++) if (get(x, y) !== '.' ) set(x, y, 'h'); };
  switch (o.style) {
    case 'short': hairTop(3); backHair(cy + 2); break;
    case 'buzz': hairTop(2, 'H'); backHair(cy); break;
    case 'bald': break;
    case 'balding': for (let x = cx - 7; x <= cx - 3; x++) for (let y = cy - 2; y <= cy + 2; y++) if (get(x, y) !== '.') set(x, y, 'h'); break;
    case 'slick': hairTop(3); backHair(cy + 3); for (let x = cx - 4; x <= cx + 5; x += 3) set(x, cy - 6 - B, 'j'); break;
    case 'pompadour': hairTop(3); ell(cx + 2, cy - 7 - B, 5, 2.4, 'h'); backHair(cy + 2); set(cx + 4, cy - 8 - B, 'j'); set(cx + 1, cy - 8 - B, 'j'); break;
    case 'mohawk': for (let y = cy - 10 - B; y <= cy - 3; y++) for (let x = cx - 3; x <= cx + 1; x++) if (y < cy - 5 || get(x, y) !== '.') set(x, y, (x + y) % 3 ? 'h' : 'j'); break;
    case 'long': hairTop(4); backHair(cy + 6); for (let y = cy; y < H - 2; y++) for (let x = cx - 9; x <= cx - 4; x++) set(x, y, y % 3 ? 'h' : 'H'); break;
    case 'curly': ell(cx - 1, cy - 3, 8 + B, 6.4 + B, 'h', (_x, y) => y <= cy - 2); backHair(cy + 3); for (let y = 0; y < cy - 1; y++) for (let x = 0; x < W; x++) if (get(x, y) === 'h' && (x * 7 + y * 3) % 5 === 0) set(x, y, 'j'); break;
    case 'bun': hairTop(3); backHair(cy + 1); ell(cx - 5, cy - 8 - B, 2.4, 2.2, 'h'); break;
    case 'ponytail': hairTop(3); backHair(cy + 1); for (let y = cy - 3; y < cy + 6; y++) { set(cx - 9 - (y > cy + 2 ? 1 : 0), y, 'h'); set(cx - 8, y, 'H'); } break;
  }
  if (o.style !== 'bald' && o.style !== 'balding' && o.style !== 'mohawk') {
    // sideburn by the ear
    set(cx - 3, cy - 1, 'h'); set(cx - 3, cy, 'h');
  }
  // hats
  switch (o.hat) {
    case 'fez':
      for (let y = cy - 11 - B; y <= cy - 5; y++) for (let x = cx - 4 + (y < cy - 8 ? 1 : 0); x <= cx + 3 - (y < cy - 8 ? 1 : 0); x++) set(x, y, x <= cx - 2 ? 'R' : 'r');
      set(cx, cy - 12 - B, 'k'); set(cx - 1, cy - 11 - B, 'k'); set(cx - 2, cy - 10 - B, 'k'); set(cx - 3, cy - 9 - B, 'k'); set(cx - 3, cy - 8, 'k');
      break;
    case 'flatcap':
      ell(cx, cy - 6 - B, 6.6 + B, 2.4, 'r', (_x, y) => y <= cy - 5);
      for (let x = cx + 2; x <= cx + 8; x++) set(x, cy - 5, 'R');
      break;
    case 'beanie':
      ell(cx - 0.5, cy - 4 - B, 6.6 + B, 5, 'r', (_x, y) => y <= cy - 4);
      for (let x = cx - 7; x <= cx + 6; x++) set(x, cy - 4, 'R');
      break;
    case 'cap': case 'trucker':
      ell(cx - 0.5, cy - 4 - B, 6.4 + B, 4.4, 'r', (_x, y) => y <= cy - 5);
      if (o.hat === 'trucker') ell(cx + 1, cy - 7 - B, 3, 1.6, 'k', (_x, y) => y <= cy - 5);
      for (let x = cx + 3; x <= cx + 9; x++) set(x, cy - 5, 'R');
      break;
    case 'capback':
      ell(cx - 0.5, cy - 4 - B, 6.4 + B, 4.4, 'r', (_x, y) => y <= cy - 5);
      for (let x = cx - 9; x <= cx - 4; x++) set(x, cy - 5, 'R');
      break;
    case 'bandana':
      for (let x = cx - 6; x <= cx + 6; x++) { if (get(x, cy - 5) !== '.') set(x, cy - 5, 'r'); if (get(x, cy - 6) !== '.') set(x, cy - 6, 'r'); }
      set(cx - 8, cy - 4, 'r'); set(cx - 9, cy - 3, 'R'); set(cx - 8, cy - 3, 'r');
      break;
    case 'sunhat':
      ell(cx - 0.5, cy - 6 - B, 5.4 + B, 3, 'r', (_x, y) => y <= cy - 5);
      for (let x = cx - 10; x <= cx + 9; x++) { set(x, cy - 5, 'R'); }
      for (let x = cx - 5; x <= cx + 5; x++) set(x, cy - 6, 'k');
      break;
    case 'visor':
      for (let x = cx - 6; x <= cx + 9; x++) set(x, cy - 5, x > cx + 2 ? 'R' : 'r');
      break;
  }
  // eyes / brows
  const brow = o.eyes === 'angry' ? 1 : 0;
  const eyeBlock = (x: number) => {
    set(x, ey, 'p'); set(x + 1, ey, 'p'); set(x, ey + 1, 'e'); set(x + 1, ey + 1, 'p'); set(x, ey + 2, 'p'); set(x + 1, ey + 2, 'p');
    set(x - (brow ? 0 : 0), ey - 2 + (brow ? 1 : 0), 'H'); set(x + 1, ey - 2 + (brow ? 1 : 0) + (brow && x === ex1 ? 1 : 0), 'H');
  };
  eyeBlock(ex1); eyeBlock(ex2);
  if (o.eyes === 'shades') { for (let x = ex1 - 1; x <= ex2 + 2; x++) set(x, ey, 'k'); for (let x = ex1 - 1; x <= ex2 + 2; x++) if (x < ex1 + 2 || x > ex2 - 1) { set(x, ey + 1, 'k'); } set(ex1, ey + 1, 'q'); set(ex2, ey + 1, 'q'); for (const x of [ex1, ex1 + 1, ex2, ex2 + 1]) set(x, ey + 2, 's'); }
  if (o.eyes === 'glasses') { for (const x0 of [ex1 - 1, ex2 - 1]) { set(x0, ey - 1, 'g'); set(x0 + 3, ey - 1, 'g'); set(x0, ey + 3, 'g'); set(x0 + 3, ey + 3, 'g'); for (let x = x0; x <= x0 + 3; x++) { set(x, ey - 1, 'g'); set(x, ey + 3, 'g'); } } set(ex1 + 2, ey, 'g'); }
  // nose + mouth
  const nx = cx + 5 + Math.round(w / 2);
  set(nx, cy + 1, 's'); set(nx + 1, cy + 1, 'S'); set(nx - 1, cy + 2, 'S');
  const my = cy + 4;
  set(cx + 2, my, 'm'); set(cx + 3, my, 'm'); if (o.big) set(cx + 4, my, 'm');
  if (o.wrinkles) { set(ex1 - 1, ey + 3, 'S'); set(ex2 + 2, ey + 3, 'S'); set(cx, my - 1, 'S'); set(cx + 4, my - 1, 'S'); set(cx - 1, cy - 4, 'S'); set(cx + 2, cy - 4, 'S'); }
  // facial hair
  const F = 'f';
  switch (o.facial) {
    case 'stubble': for (let x = cx - 2; x <= cx + 5; x++) for (let y = my - 1; y <= my + 2; y++) if (get(x, y) === 's' || get(x, y) === 'S') if ((x + y) % 2) set(x, y, 'F'); break;
    case 'mustache': for (let x = cx + 1; x <= cx + 5; x++) set(x, my - 1, F); break;
    case 'handlebar':
      for (let x = cx; x <= cx + 6; x++) set(x, my - 1, F);
      for (let x = cx + 1; x <= cx + 5; x++) set(x, my - 2, F);
      set(cx - 1, my - 2, F); set(cx - 2, my - 2, F); set(cx - 2, my - 1, F);
      set(cx + 7, my - 2, F); set(cx + 7, my - 3, F); set(cx + 8, my - 4, F);
      break;
    case 'beard': case 'whitebeard':
      for (let y = my - 1; y < H; y++) for (let x = cx - 4; x <= cx + 6; x++) {
        const inFace = get(x, y) === 's' || get(x, y) === 'S' || get(x, y) === 'm';
        if (inFace && !(y === my && (x === cx + 1 || x === cx + 2))) set(x, y, (x + y) % 4 ? F : 'F');
      }
      for (let x = cx - 2; x <= cx + 5; x++) set(x, H - 3, F);
      for (let x = cx - 1; x <= cx + 4; x++) set(x, H - 2, F);
      break;
    case 'goatee': for (let y = my + 1; y <= my + 3; y++) for (let x = cx; x <= cx + 3; x++) set(x, y, F); for (let x = cx; x <= cx + 4; x++) set(x, my - 1, F); break;
    case 'chops': for (let y = cy - 1; y <= my + 1; y++) { set(cx - 3, y, F); set(cx - 2, y, F); } break;
  }
  if (o.earring) set(cx - 5, cy + 2, 'y');
  const front = g.map((r) => r.join(''));
  const pal: Record<string, string> = {
    s: o.skin, S: o.skinShade, h: o.hair, H: o.hairShade, j: o.hairHi ?? o.hair,
    r: o.hatColor ?? '#c02a2a', R: o.hatShade ?? '#7e1818', k: o.hatAccent ?? '#1a1a1a',
    f: o.facialColor ?? o.hair, F: o.facialColor ? o.facialColor : o.hairShade,
    m: o.lips ?? '#a0484e', g: '#3a3a48', q: '#6a8ab8', y: '#f0c840',
  };
  return { front, pal, neck: [cx, Math.min(H - 1, cy + 6 + B)], eyes: [[ex1, ey], [ex2, ey]], mouth: [cx + 2, my], mouthW: 2 };
}
