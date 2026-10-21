// The three playable heroes, built from the approved concept sheets.
//
// Proportions: ~2.9 heads tall, shoulders a little wider than the hair, long legs with a
// short torso, hands hanging at the hips. Outfits follow the concept art: B.T. in a white
// button-up with a red cross sleeve patch, S.C. in a black tee with a red/blue emblem and a
// silver chain, MUSE in a black tee with gold links, shades and blue-tipped hair.

import { CharSpec } from './rig';
import { makeHead } from './heroheads';
import { BT_HEAD, SC_HEAD, MUSE_HEAD } from './headmaps';
import { hex } from './raster';

const CELL: [number, number] = [64, 76];
const GROUND = 72;

// helper: point `k` of the way from the neck down to the hip
const along = (n: [number, number], h: [number, number], k: number): [number, number] => [
  Math.round(n[0] + (h[0] - n[0]) * k),
  Math.round(n[1] + (h[1] - n[1]) * k),
];

// ---------------------------------------------------------------- B.T.
const btWhite = hex('#ffffff'), btSeam = hex('#c9c2b4'), btShadeC = hex('#ded8cb');

export const BT: CharSpec = {
  id: 'bt',
  cell: CELL, ground: GROUND,
  thigh: 12, shin: 12, legR: 3.05,
  uarm: 8.5, farm: 7.5, armR: 2.35,
  torsoLen: 17.5, shoulderW: 17, hipW: 11,
  skin: '#eab48f',
  shirt: '#f7f4ec', shirtShade: '#cdc5b6', sleeve: 'long',
  pants: '#4a6fb5', pantsShade: '#2c4780',
  shoes: '#f4f4f0', shoeAccent: '#2a5ac0', soles: '#d8d8d4',
  head: makeHead(BT_HEAD),
  torsoDetail: (p, j) => {
    const n = j.neck, h = j.hip;
    // shirt collar: two clean leaves with a dark vee between them
    for (let i = 0; i < 3; i++) {
      p.set(n[0] - 3 + i, n[1] + i, btWhite);
      p.set(n[0] + 3 - i, n[1] + i, btWhite);
      p.set(n[0] - 2 + i, n[1] + i + 1, btSeam);
      p.set(n[0] + 2 - i, n[1] + i + 1, btSeam);
    }
    p.set(n[0], n[1] + 3, btShadeC); p.set(n[0] + 1, n[1] + 3, btShadeC);
    // placket, with three buttons sitting on it
    const [bx0, by0] = along(n, h, 0.24), [bx1, by1] = along(n, h, 0.9);
    for (let y = by0; y <= by1; y++) p.set(bx0, y, btSeam);
    for (const k of [0.34, 0.55, 0.76]) {
      const [x, y] = along(n, h, k);
      p.set(x, y, hex('#8a8272')); p.set(x + 1, y, btSeam);
    }
    void bx1; void by1;
    // cuff band on the back wrist
    p.set(j.haB[0], j.haB[1] - 2, btSeam);
  },
  accessories: [
    // red cross patch on the upper front sleeve
    {
      layer: 'armF', draw: (p, j) => {
        const s = j.shF, e = j.elF;
        const x = Math.round(s[0] + (e[0] - s[0]) * 0.42) + 1;
        const y = Math.round(s[1] + (e[1] - s[1]) * 0.42);
        p.rect(x, y - 1, 3, 1, hex('#d23c3c'));
        p.rect(x + 1, y - 2, 1, 3, hex('#d23c3c'));
        p.set(x + 1, y - 1, hex('#f7f4ec'));
      },
    },
  ],
};

// ---------------------------------------------------------------- S.C.
const chain = hex('#d8dde6'), chainD = hex('#8d95a3');

export const SC: CharSpec = {
  id: 'sc',
  cell: CELL, ground: GROUND,
  thigh: 12, shin: 12, legR: 3.25,
  uarm: 8.6, farm: 7.6, armR: 2.6,
  torsoLen: 17, shoulderW: 18.5, hipW: 12.5,
  skin: '#c08152',
  shirt: '#23232d', shirtShade: '#12121a', sleeve: 'short',
  pants: '#2c3f6e', pantsShade: '#1a2546',
  shoes: '#f0ece6', shoeAccent: '#d0283a', soles: '#d0283a',
  head: makeHead(SC_HEAD),
  torsoDetail: (p, j) => {
    const n = j.neck, h = j.hip;
    // ribbed collar
    for (let i = -4; i <= 4; i++) p.set(n[0] + i, n[1] + 1, hex('#3c3c4a'));
    for (let i = -3; i <= 3; i++) p.set(n[0] + i, n[1] + 2, hex('#2c2c38'));
    // red/blue emblem printed on the chest: a compact shield, not a sticker
    const [x, y] = along(n, h, 0.44);
    for (let i = 0; i < 5; i++) p.set(x - 2 + i, y, hex('#c8303a'));
    for (let i = 1; i < 4; i++) p.set(x - 1 + i, y + 1, hex('#2f5aa8'));
    p.set(x, y + 2, hex('#2f5aa8')); p.set(x + 1, y + 2, hex('#c8303a'));
    p.set(x + 2, y + 1, hex('#8a1e26'));
    // sleeve hems
    p.rect(Math.round(j.haB[0]) - 1, Math.round(j.haB[1]) - 2, 3, 1, hex('#34343f'));
  },
  accessories: [
    // silver cuban chain across the chest
    {
      layer: 'torso', draw: (p, j) => {
        const n = j.neck;
        for (let i = -5; i <= 5; i++) {
          const y = n[1] + 1 + (i === 0 ? 3 : Math.abs(i) <= 2 ? 2 : 1);
          p.set(n[0] + i, y, (i & 1) ? chain : chainD);
          if (i === 0) p.set(n[0], y + 1, chain);
        }
      },
    },
    { layer: 'armF', draw: (p, j) => { const h = j.haF, e = j.elF; const t = 0.76; p.set(e[0] + (h[0] - e[0]) * t, e[1] + (h[1] - e[1]) * t, chain); p.set(e[0] + (h[0] - e[0]) * t + 1, e[1] + (h[1] - e[1]) * t, chainD); } },
    { layer: 'armB', draw: (p, j) => { const h = j.haB, e = j.elB; const t = 0.76; p.set(e[0] + (h[0] - e[0]) * t, e[1] + (h[1] - e[1]) * t, chainD); } },
  ],
};

// ---------------------------------------------------------------- MUSE
const gold = hex('#f0c040'), goldD = hex('#b8860b');

export const MUSE: CharSpec = {
  id: 'muse',
  cell: CELL, ground: GROUND,
  thigh: 12, shin: 12, legR: 3.0,
  uarm: 8.4, farm: 7.4, armR: 2.35,
  torsoLen: 17.5, shoulderW: 17, hipW: 10.8,
  skin: '#cf9566',
  shirt: '#262630', shirtShade: '#131320', sleeve: 'short',
  pants: '#30303c', pantsShade: '#1a1a24',
  shoes: '#f4f4f0', shoeAccent: '#2a5ac0', soles: '#d8d8d4',
  head: makeHead(MUSE_HEAD),
  torsoDetail: (p, j) => {
    const n = j.neck, h = j.hip;
    // ribbed collar and a small chest print
    for (let i = -4; i <= 4; i++) p.set(n[0] + i, n[1] + 1, hex('#3e3e4c'));
    const [x, y] = along(n, h, 0.5);
    p.rect(x - 1, y, 3, 1, hex('#3a3a48'));
    p.rect(x - 2, y + 1, 5, 1, hex('#333342'));
    // dropped shoulder line
    p.rect(Math.round(j.haB[0]) - 1, Math.round(j.haB[1]) - 2, 3, 1, hex('#34343f'));
  },
  accessories: [
    {
      layer: 'torso', draw: (p, j) => {
        const n = j.neck;
        for (let i = -5; i <= 5; i++) {
          const y = n[1] + 1 + (i === 0 ? 3 : Math.abs(i) <= 2 ? 2 : 1);
          p.set(n[0] + i, y, (i & 1) ? gold : goldD);
        }
        p.set(n[0], n[1] + 4, gold);
      },
    },
    { layer: 'armB', draw: (p, j) => { const h = j.haB, e = j.elB; const t = 0.72; p.set(e[0] + (h[0] - e[0]) * t, e[1] + (h[1] - e[1]) * t, gold); } },
    {
      layer: 'armF', draw: (p, j) => {
        const h = j.haF, e = j.elF; const t = 0.72;
        const x = e[0] + (h[0] - e[0]) * t, y = e[1] + (h[1] - e[1]) * t;
        // black smartwatch with a blue screen edge
        p.set(x, y, hex('#0c0c12')); p.set(x + 1, y, hex('#0c0c12')); p.set(x, y + 1, hex('#2a6ad0'));
        p.set(x - 1, y, hex('#3a3a46'));
      },
    },
  ],
};
