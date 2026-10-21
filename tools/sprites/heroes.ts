// B.T. and S.C.: the two playable protagonists, built from the supplied reference art.
// Head maps are hand-authored (right-facing three-quarter view); bodies come from the rig.

import { CharSpec } from './rig';
import { hex, shade } from './raster';

// ---------------------------------------------------------------- B.T.
// Long dark-brown hair, white collared shirt with red embroidery, blue jeans, brown shoes.
const BT_FRONT = [
  '....hhhhhhh.....',
  '..hhhhjjjjhhh...',
  '.hhhhjjhhhhhhh..',
  '.hhhjhhhhhhhhhh.',
  'hhhjhhhhhhhhhhhh',
  'hhhhhhhhhHHhhhhh',
  'hhhhhhhhHsssHhhh',
  'hhhhhhhHssssssHh',
  'hhhhhhHsHHsssHHh',
  'hhhhhhHsppsssppH',
  'hhhhhhHsepssseph',
  'hhhhhhHsppsssppH',
  'hhhhhhhsrssSssrh',
  'hhhhhhhssssSssh.',
  'hhhhhhhHsssmmsh.',
  '.hhhhhhhHsssSh..',
  '.hhhhhhh.HSS....',
];
const BT_BACK = [
  'hhhhhhhh.',
  'hhhhhhhhh',
  'hhHhhhhhh',
  'hhHhhjhhh',
  'hhHhhhhhh',
  'hHhhhhhhh',
  'hHhhhhhh.',
  'hHhhhjhh.',
  'hHhhhhh..',
  'Hhhhhhh..',
  'Hhhhhh...',
  '.Hhhh....',
  '..hh.....',
];

export const BT: CharSpec = {
  id: 'bt',
  cell: [64, 64], ground: 60,
  thigh: 7, shin: 7, legR: 2.5,
  uarm: 7, farm: 6, armR: 1.9,
  torsoLen: 12, shoulderW: 11, hipW: 10,
  skin: '#f2c29c',
  shirt: '#f4f1ea', shirtShade: '#c9c3b8', sleeve: 'long',
  pants: '#4a6fb5', pantsShade: '#33508a',
  shoes: '#7a4426', soles: '#3a2014',
  head: {
    front: BT_FRONT, back: BT_BACK, backAt: [-1, 9],
    pal: { h: '#3d2217', H: '#24130c', j: '#70432a', s: '#f2c29c', S: '#d69b76', r: '#ef9d8f', m: '#c4505c' },
    neck: [10, 16], eyes: [[8, 9], [13, 9]], mouth: [11, 14],
  },
  torsoDetail: (p, j) => {
    // collar and red embroidery on the shirt
    const red = hex('#d23c3c'), red2 = hex('#a52a35');
    const n = j.neck, h = j.hip;
    p.set(n[0] - 1, n[1] + 1, hex('#ffffff')); p.set(n[0] + 2, n[1] + 1, hex('#ffffff'));
    p.set(n[0], n[1] + 2, hex('#c9c3b8')); p.set(n[0] + 1, n[1] + 2, hex('#c9c3b8'));
    const cx = (n[0] + h[0]) / 2, cy = (n[1] + h[1]) / 2;
    p.set(cx + 2, cy - 2, red); p.set(cx + 3, cy - 1, red2); p.set(cx - 1, cy, red);
    p.set(cx + 1, cy + 2, red); p.set(cx + 3, cy + 3, red2); p.set(cx - 2, cy + 3, red);
    // button placket
    for (let i = 3; i < 12; i += 3) p.set(n[0] + 1 + (h[0] - n[0]) * (i / 13), n[1] + i, hex('#b8b0a4'));
  },
  accessories: [
    { layer: 'armF', draw: (p, j) => { p.set(j.elF[0], j.elF[1], hex('#d23c3c')); } },
  ],
};

// ---------------------------------------------------------------- S.C.
// Voluminous dark curly hair, full beard, black graphic tee (blue/red), dark jeans,
// silver chain and wristbands, red-accented sneakers.
const SC_FRONT = [
  '....hjhhjhhjhh......',
  '..hjhhhjhhhjhhjh....',
  '.hhjhhjhhjhhhjhhjh..',
  'hjhhjhhhjhhjhhhjhhh.',
  'hhhjhhjhhhjhhjhhjhhh',
  'hjhhhjhhjhhhjhhhjhhh',
  'hhhjhhhjhhhjhhjhhhhh',
  'hjhhhjhhhhHHHhhHHhh.',
  'hhhjhhhhHsssssssssh.',
  'hhjhhhhHsHHHsssHHHs.',
  'hjhhhhhSsppssssppss.',
  'hhhjhhhSsepssssepss.',
  '.hhhhhhSsppssssppSs.',
  '.hjhhhhSssssssSssss.',
  '..hhhhhHbsssssSSsbs.',
  '..hhhhhbbbHHHHHHbbb.',
  '...hhhbbbbbmmmmbbbb.',
  '....hhbbBbbbbbBbbb..',
  '.....HbbbbbBbbbbb...',
  '.......HbbbBbbbb....',
];

const chain = hex('#d8dde6'), chainD = hex('#8d95a3');

export const SC: CharSpec = {
  id: 'sc',
  cell: [64, 64], ground: 60,
  thigh: 7, shin: 7, legR: 2.9,
  uarm: 7, farm: 7, armR: 2.4,
  torsoLen: 13, shoulderW: 14, hipW: 11,
  skin: '#c48a5c',
  shirt: '#23232d', shirtShade: '#15151c', sleeve: 'short',
  pants: '#2c3f6e', pantsShade: '#1d2a4c',
  shoes: '#f0ece6', shoeAccent: '#d0283a', soles: '#d0283a',
  head: {
    front: SC_FRONT,
    pal: { h: '#1c1412', H: '#0d0908', j: '#46342a', s: '#c48a5c', S: '#9c6640', b: '#3b2a21', B: '#5a4033', m: '#7a3a34' },
    neck: [11, 18], eyes: [[9, 10], [16, 10]], mouth: [11, 16], mouthW: 4,
  },
  torsoDetail: (p, j) => {
    // blue-and-red chest graphic
    const n = j.neck, h = j.hip;
    const cx = Math.round((n[0] + h[0]) / 2) + 1, cy = Math.round((n[1] + h[1]) / 2) - 1;
    p.rect(cx - 2, cy - 2, 5, 4, hex('#2f6fd6'));
    p.rect(cx - 1, cy - 1, 3, 1, hex('#e0303c'));
    p.rect(cx - 2, cy + 1, 5, 1, hex('#e0303c'));
    p.set(cx + 2, cy - 2, hex('#7fb2ff'));
  },
  accessories: [
    {
      layer: 'torso', draw: (p, j) => {
        // silver chain around the neck
        const n = j.neck;
        for (let i = -3; i <= 4; i++) p.set(n[0] + i, n[1] + 2 + Math.round(Math.abs(i - 0.5) * -0.4 + 1.5), (i & 1) ? chain : chainD);
        p.set(n[0] + 1, n[1] + 4, chain);
      },
    },
    { layer: 'armF', draw: (p, j) => { const h = j.haF, e = j.elF; const t = 0.72; p.set(e[0] + (h[0] - e[0]) * t, e[1] + (h[1] - e[1]) * t, chain); p.set(e[0] + (h[0] - e[0]) * t + 1, e[1] + (h[1] - e[1]) * t, chainD); } },
    { layer: 'armB', draw: (p, j) => { const h = j.haB, e = j.elB; const t = 0.72; p.set(e[0] + (h[0] - e[0]) * t, e[1] + (h[1] - e[1]) * t, shade(chain, 0.78)); } },
  ],
};
