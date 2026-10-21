// Enemy designs — one per city, straight from the approved sheets. Same rig, same
// outline and lighting rules as the heroes, so the whole cast reads as one game.

import { CharSpec, Joints } from './rig';
import { Px, hex, RGBA } from './raster';

type Detail = (p: Px, j: Joints, s: CharSpec) => void;
const torsoPx = (p: Px, s: CharSpec, fn: (x: number, y: number, c: RGBA) => RGBA | null) => {
  const sc = hex(s.shirt), sd = hex(s.shirtShade ?? s.shirt);
  p.recolor((x, y, c) => (c === sc || c === sd ? fn(x, y, c) : null));
};
const plaid = (a: string, b: string): Detail => (p, _j, s) => torsoPx(p, s, (x, y) => ((x % 5 === 0 || y % 4 === 0) ? hex(a) : (x + y) % 7 === 0 ? hex(b) : null));
const coatOpen = (inner: string, w = 2): Detail => (p, j) => {
  for (let i = 1; i < 13; i++) {
    const t = i / 13;
    const x = j.neck[0] + (j.hip[0] - j.neck[0]) * t + 1, y = j.neck[1] + (j.hip[1] - j.neck[1]) * t;
    for (let k = 0; k < w; k++) p.set(x + k, y, hex(inner));
  }
};
const vest = (outer: string, trim: string): Detail => (p, j, s) => {
  const n = j.neck, h = j.hip;
  torsoPx(p, s, (x, y, c) => {
    if (y < n[1] + 2) return null;
    const mid = (n[0] + h[0]) / 2;
    if (x > mid + 1) return hex(outer);
    if (x === Math.round(mid + 1)) return hex(trim);
    return c;
  });
  for (let i = 0; i < 5; i++) p.set(Math.round((n[0] + h[0]) / 2) + 1, n[1] + 3 + i * 2, hex(trim));
};

const base = (id: string, o: Partial<CharSpec> & { head: CharSpec['head'] }): CharSpec => ({
  id, cell: [64, 76], ground: 72,
  thigh: 11, shin: 11, legR: 2.6, uarm: 7.6, farm: 6.6, armR: 2.0, torsoLen: 15, shoulderW: 11, hipW: 10,
  skin: '#c48a5c', shirt: '#888', pants: '#334', shoes: '#2a2220', soles: '#1a1412', ...o,
} as CharSpec);

// ---------------------------------------------------------------- Dondurma Man (İstanbul)
const DONDURMA_SIDE = [
  '.......rrrrrr.......',
  '......rrrrrrrr......',
  '.....rrrrrrrrrr.....',
  '....RRRRRRRRRRRR....',
  '.....RRRRRRRRRR.....',
  '.....hhhhssssss.....',
  '....hhhhsssssssss...',
  '....hhhsssssssssss..',
  '....hhhssseessssss..',
  '....hhhsseessssssS..',
  '....hhhsssssssssSS..',
  '....hhhsssssssssSS..',
  '....hhsddddddddss...',
  '....hsdddddddddds...',
  '.....sssdddddssss...',
  '......ssssssssss....',
  '.......sssssss......',
  '........ssss........',
  '....................',
  '....................',
];

const dondurmaHead: CharSpec['head'] = {
  front: DONDURMA_SIDE,
  pal: { h: '#1e1612', H: '#0e0a08', j: '#3a2a1e', r: '#c8282a', R: '#8a1418', s: '#d9a27a', S: '#b07a56', e: '#20141a', m: '#8a3a34', d: '#22160f' },
  neck: [10, 16], eyes: [[12, 8]], mouth: [15, 12], mouthW: 3,
};

const dondurmaSpec = (id: string, boss: boolean): CharSpec => base(id, {
  head: dondurmaHead, skin: '#d9a27a',
  shirt: '#f6f2ea', shirtShade: '#d0c8bc', sleeve: 'long',
  pants: '#1c1c2a', pantsShade: '#101018',
  shoes: '#2a2220', soles: '#14100e',
  belly: 3, shoulderW: 12, hipW: 11, armR: 2.2, legR: 2.8,
  torsoDetail: vest(boss ? '#8a1418' : '#c8282a', boss ? '#f0c040' : '#e8c040'),
});

// ---------------------------------------------------------------- NYC Bum
const BUM_SIDE = [
  '.....gggggggggg.....',
  '....gggggggggggg....',
  '...gggggggggggggg...',
  '...GGGGGGGGGGGGGG...',
  '...gggggggggggggg...',
  '....gggggggggggg....',
  '....hhssssssss......',
  '...hhsssssssssss....',
  '...hssseesssssss....',
  '...hsseesssssssS....',
  '...hssssssssssSS....',
  '...hsssssssssSSS....',
  '...hssdddddddsss....',
  '...hhddddddddddss...',
  '....hddddddddddd....',
  '.....ddddddddddd....',
  '......dddddddd......',
  '.......ddddd........',
  '....................',
  '....................',
];

const bumHead: CharSpec['head'] = {
  front: BUM_SIDE,
  pal: { h: '#3a322a', H: '#221c16', g: '#6a6a70', G: '#4a4a50', s: '#e0b48c', S: '#b88a64', e: '#20141a', m: '#7a3a34', d: '#5a4a3a' },
  neck: [9, 17], eyes: [[9, 8]], mouth: [13, 13], mouthW: 3,
};

const bumSpec = (id: string, boss: boolean): CharSpec => base(id, {
  head: bumHead, skin: '#e0b48c',
  shirt: boss ? '#5a4a30' : '#6a5a3a', shirtShade: boss ? '#3e3220' : '#4c3f26',
  sleeve: 'long', coat: { color: boss ? '#4c3c28' : '#5c4c32', len: 7 },
  pants: '#4a4a46', pantsShade: '#33332f',
  shoes: '#3a3028', soles: '#1e1812', fistColor: boss ? '#8a2020' : '#4a4a3a',
  baseLean: 5, belly: 2, shoulderW: 13, hipW: 11, armR: 2.5, legR: 2.8,
  torsoDetail: (p, j, s) => { coatOpen(boss ? '#8a7a50' : '#7a6a48', 3)(p, j, s); plaid('#8a7a50', '#4a3a24')(p, j, s); },
});

// ---------------------------------------------------------------- Tampa Man
const TAMPA_SIDE = [
  '....................',
  '....................',
  '......ssssssss......',
  '.....ssssssssss.....',
  'ww...ssssssssss.....',
  '.wwwwssssssssss.....',
  '..wwssssssssssss....',
  '...wssssssssssss....',
  '....ssggeeggssss....',
  '....ssggeeggsssS....',
  '....sssssssssssSS...',
  '....sssssssssssSS...',
  '....sssdddddssss....',
  '.....ssdddddssss....',
  '......sssssssss.....',
  '.......sssssss......',
  '........sssss.......',
  '....................',
  '....................',
  '....................',
];

const tampaHead: CharSpec['head'] = {
  front: TAMPA_SIDE,
  pal: { h: '#e8e8e8', H: '#b8b8c0', w: '#f0f0f0', s: '#e6bc94', S: '#c08c64', g: '#3a3a48', e: '#5a6a8a', m: '#8a4a44', d: '#d8d8d8' },
  neck: [10, 16], eyes: [[10, 8]], mouth: [14, 12], mouthW: 2,
};

const tampaSpec = (id: string, boss: boolean): CharSpec => base(id, {
  head: tampaHead, skin: '#e6bc94',
  shirt: boss ? '#7ab0d0' : '#9ac8e8', shirtShade: boss ? '#4a80a8' : '#6a9ac0', sleeve: 'short',
  pants: '#b8a47a', pantsShade: '#94805a', shorts: true,
  shoes: '#6a4a32', soles: '#e8e2d8',
  belly: 3, baseLean: 5, shoulderW: 12, hipW: 12, armR: 2.2, thigh: 6,
  torsoDetail: (p, j) => { p.set(j.neck[0] + 1, j.neck[1] + 1, hex('#3a5a7a')); p.set(j.neck[0] + 2, j.neck[1] + 1, hex('#3a5a7a')); },
  accessories: [
    // white socks + sandal straps
    { layer: 'torso', draw: (p, j) => { for (const ft of [j.ftF, j.ftB]) { p.rect(ft[0] - 1, ft[1] - 3, 3, 3, hex('#f0f0ec')); } } },
    { layer: 'armF', draw: (p, j) => { const h = j.haF; p.set(h[0], h[1], hex('#3a3a3a')); } },
  ],
});

// ---------------------------------------------------------------- Bıyıklı Fehmi
const FEHMI_SIDE = [
  '......rrrrrrrr......',
  '.....rrrrrrrrrr.....',
  '.....rrrrrrrrrr.....',
  '......RRRRRRRR......',
  '.......RRRRRR.......',
  '.....hhhhsssss......',
  '....hhhhssssssss....',
  '....hhhssssssssss...',
  '....hhhssseessss....',
  '....hhhsseessssS....',
  '....hhhssssssssS....',
  '....hhhssssssssSS...',
  '...ddhsssssssssSS...',
  '..dddddssssssssss...',
  '.ddddddddssssssss...',
  '..ddddddd.ssssss....',
  '....dddd...ssss.....',
  '...........ss.......',
  '....................',
  '....................',
];

const fehmiHead: CharSpec['head'] = {
  front: FEHMI_SIDE,
  pal: { h: '#1a1410', H: '#0c0806', r: '#c8282a', R: '#8a1418', s: '#c99468', S: '#a0704a', e: '#20141a', m: '#7a3a34', d: '#16100c' },
  neck: [10, 16], eyes: [[11, 8]], mouth: [14, 12], mouthW: 2,
};

const fehmiSpec = (id: string, boss: boolean): CharSpec => base(id, {
  head: fehmiHead, skin: '#c99468',
  shirt: '#f2eee4', shirtShade: '#ccc6ba', sleeve: 'long',
  pants: '#2a2a30', pantsShade: '#1a1a1e',
  shoes: '#3a2a1e', soles: '#1a120c',
  belly: 4, shoulderW: 13, hipW: 12, armR: 2.3, legR: 2.9,
  torsoDetail: (p, j, s) => {
    // dark waistcoat with gold buttons over the white shirt
    const n = j.neck, h = j.hip;
    const mid = Math.round((n[0] + h[0]) / 2);
    torsoPx(p, s, (x) => (x > mid - 1 ? hex(boss ? '#14141a' : '#20202a') : null));
    for (let i = 0; i < 4; i++) p.set(mid + 2, n[1] + 3 + i * 2, hex('#e8c040'));
  },
  accessories: [
    // the tea glass and saucer never leave his hand
    { layer: 'armF', draw: (p, j) => {
      const [x, y] = j.haF;
      p.rect(x - 1, y - 6, 3, 4, hex('#e8e8e0'));
      p.rect(x - 1, y - 4, 3, 2, hex('#b05a20'));
      p.rect(x - 1, y - 3, 3, 1, hex('#e8a040'));
      p.rect(x - 2, y - 2, 5, 1, hex('#f0f0e8'));
    } },
  ],
});

export const ENEMY_SPECS: CharSpec[] = [
  dondurmaSpec('dondurma', false),
  dondurmaSpec('dondurma_boss', true),
  bumSpec('bum', false),
  bumSpec('bum_boss', true),
  tampaSpec('tampa', false),
  tampaSpec('tampa_boss', true),
  fehmiSpec('fehmi', false),
  fehmiSpec('fehmi_boss', true),
];
