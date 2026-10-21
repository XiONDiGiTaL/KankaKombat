// Enemy and boss designs. Same rig, same outline and lighting rules as B.T. and S.C.,
// so the whole cast reads as one game.

import { CharSpec, Joints } from './rig';
import { Px, hex, shade, RGBA } from './raster';
import { makeHead, HeadOpts } from './headgen';

// ---------------------------------------------------------------- torso pattern helpers
type Detail = (p: Px, j: Joints, s: CharSpec) => void;
const torsoPx = (p: Px, s: CharSpec, fn: (x: number, y: number, c: RGBA) => RGBA | null) => {
  const sc = hex(s.shirt), sd = hex(s.shirtShade ?? s.shirt);
  p.recolor((x, y, c) => (c === sc || c === sd ? fn(x, y, c) : null));
};
const stripes = (col: string, every = 3): Detail => (p, _j, s) => torsoPx(p, s, (_x, y, c) => (y % every === 0 ? (c === hex(s.shirt) ? hex(col) : shade(hex(col), 0.8)) : null));
const dots = (col: string, col2?: string): Detail => (p, _j, s) => torsoPx(p, s, (x, y) => ((x * 3 + y * 5) % 7 === 0 ? hex(col) : col2 && (x * 5 + y * 3) % 11 === 0 ? hex(col2) : null));
const openJacket = (inner: string, w = 2): Detail => (p, j) => {
  for (let i = 1; i < 13; i++) { const t = i / 13; const x = j.neck[0] + (j.hip[0] - j.neck[0]) * t + 1, y = j.neck[1] + (j.hip[1] - j.neck[1]) * t; for (let k = 0; k < w; k++) p.set(x + k, y, hex(inner)); }
};
const apron = (col: string): Detail => (p, j, s) => {
  const top = j.neck[1] + 5;
  torsoPx(p, s, (x, y) => (y >= top && x >= j.hip[0] - 3 ? hex(col) : null));
  for (let y = j.hip[1]; y < j.hip[1] + 7; y++) for (let x = j.hip[0] - 2; x < j.hip[0] + 5 + (s.belly ?? 0) * 0.6; x++) p.set(x, y, hex(col));
};
const logo = (col: string, col2: string): Detail => (p, j) => { const cx = Math.round((j.neck[0] + j.hip[0]) / 2) + 1, cy = Math.round((j.neck[1] + j.hip[1]) / 2); p.rect(cx - 2, cy - 1, 4, 3, hex(col)); p.set(cx, cy, hex(col2)); };
const chain = (col = '#f0c840'): Detail => (p, j) => { for (let i = -2; i <= 3; i++) p.set(j.neck[0] + i, j.neck[1] + 2 + (Math.abs(i) < 2 ? 1 : 0), i % 2 ? hex(col) : shade(hex(col), 0.7)); };
const sash = (col: string): Detail => (p, j, s) => { for (let i = -(s.hipW / 2); i <= s.hipW / 2 + (s.belly ?? 0); i++) { p.set(j.hip[0] + i, j.hip[1] - 1, hex(col)); p.set(j.hip[0] + i, j.hip[1] - 2, shade(hex(col), 0.8)); } };
const suspenders = (col: string): Detail => (p, j) => { for (let i = 1; i < 13; i++) { const t = i / 13; p.set(j.neck[0] + (j.hip[0] - j.neck[0]) * t - 2, j.neck[1] + (j.hip[1] - j.neck[1]) * t, hex(col)); p.set(j.neck[0] + (j.hip[0] - j.neck[0]) * t + 3, j.neck[1] + (j.hip[1] - j.neck[1]) * t, hex(col)); } };
const vestTrim = (col: string, gold: string): Detail => (p, j, s) => {
  // dondurma vendor's embroidered vest: coloured panels with gold trim
  const front = j.hip[0] + 1;
  torsoPx(p, s, (x) => (x === front - 1 ? hex(gold) : x >= front ? hex('#f6f2ea') : null));
  void col;
};
const all = (...ds: Detail[]): Detail => (p, j, s) => ds.forEach((d) => d(p, j, s));

const SKIN = {
  tan: ['#d9a27a', '#b07a56'], olive: ['#c99468', '#a0704a'], light: ['#f0c8a8', '#cf9f80'], fair: ['#f6d4bc', '#d8ab90'],
  brown: ['#a8704a', '#80522f'], dark: ['#7a4a2e', '#5a3420'], ruddy: ['#e6a888', '#c0806a'],
};
const head = (skin: string[], o: Omit<HeadOpts, 'skin' | 'skinShade'>) => makeHead({ skin: skin[0], skinShade: skin[1], ...o });

const base = (id: string, o: Partial<CharSpec> & { head: CharSpec['head']; skin: string }): CharSpec => ({
  id, cell: [64, 64], ground: 60,
  thigh: 7, shin: 7, legR: 2.6, uarm: 7, farm: 6, armR: 2.0, torsoLen: 12, shoulderW: 11, hipW: 10,
  shirt: '#888', pants: '#334', shoes: '#2a2220', soles: '#1a1412', ...o,
} as CharSpec);

const boss = (id: string, o: Partial<CharSpec> & { head: CharSpec['head']; skin: string }): CharSpec => base(id, {
  cell: [84, 84], ground: 80, thigh: 9, shin: 9, legR: 3.4, uarm: 9, farm: 8, armR: 2.8, torsoLen: 16, shoulderW: 16, hipW: 13, ...o,
});

export const ENEMY_SPECS: CharSpec[] = [
  // ------------------------------------------------------------ İstanbul
  base('abi', { skin: SKIN.olive[0], head: head(SKIN.olive, { hair: '#1e1612', hairShade: '#0e0a08', style: 'slick', facial: 'mustache', eyes: 'angry' }), shirt: '#2a2626', shirtShade: '#1a1616', sleeve: 'long', pants: '#3a3a48', torsoDetail: openJacket('#e8e4dc', 3) }),
  base('kazim', { skin: SKIN.tan[0], head: head(SKIN.tan, { hair: '#2a1e18', hairShade: '#140e0a', style: 'balding', facial: 'mustache', eyes: 'angry', wide: 1 }), shirt: '#b8302c', shirtShade: '#8a2420', belly: 4, shoulderW: 14, hipW: 12, armR: 2.6, legR: 3.0, pants: '#3a3430', torsoDetail: apron('#f0ece4') }),
  base('selo', { skin: SKIN.olive[0], head: head(SKIN.olive, { hair: '#1a1410', hairShade: '#0c0806', style: 'short', hat: 'capback', hatColor: '#2a4ab0', hatShade: '#1a2e70', facial: 'stubble', eyes: 'angry' }), shirt: '#1e1e24', shirtShade: '#121216', sleeve: 'long', pants: '#1e1e24', shoulderW: 10, hipW: 9, armR: 1.8, legR: 2.3, shoes: '#f0f0f0', soles: '#c0c0c0', torsoDetail: stripes('#e8e8e8', 99) , accessories: [{ layer: 'armF', draw: (p, j) => p.capsule(j.shF[0], j.shF[1] + 1, j.elF[0], j.elF[1] + 1, 0.4, hex('#e8e8e8')) }] }),
  base('riza', {
    skin: SKIN.ruddy[0], head: head(SKIN.ruddy, { hair: '#2a1c14', hairShade: '#140c08', style: 'short', hat: 'fez', hatColor: '#c8202c', hatShade: '#8a1018', hatAccent: '#1a1a1a', facial: 'handlebar', facialColor: '#1a120e', wide: 1 }),
    shirt: '#c02a2a', shirtShade: '#8a1c1c', sleeve: 'long', belly: 6, shoulderW: 14, hipW: 13, armR: 2.6, legR: 3.2, thigh: 6, shin: 7,
    pants: '#1c1c2a', pantsShade: '#101018', shoes: '#c02a2a', soles: '#601010',
    torsoDetail: all(vestTrim('#c02a2a', '#e8c040'), sash('#e8c040')),
    accessories: [{ layer: 'armF', draw: (p, j) => p.capsule(j.elF[0], j.elF[1], j.haF[0], j.haF[1], 1.4, hex('#f6f2ea')) }, { layer: 'armB', draw: (p, j) => p.capsule(j.elB[0], j.elB[1], j.haB[0], j.haB[1], 1.4, hex('#c4c0b8')) }],
  }),
  // ------------------------------------------------------------ İzmir
  base('mert', { skin: SKIN.tan[0], head: head(SKIN.tan, { hair: '#3a2a1a', hairShade: '#20160c', style: 'short', hat: 'bandana', hatColor: '#2a6ad0', hatShade: '#1a4a90', facial: 'stubble' }), shirt: '#f0f0f0', shirtShade: '#c8ccd4', pants: '#d8c8a0', shorts: true, shoes: '#2a6ad0', soles: '#f0f0f0', shoulderW: 10, armR: 1.8, legR: 2.3, torsoDetail: stripes('#2a4ab0', 3) }),
  base('kenan', { skin: SKIN.olive[0], head: head(SKIN.olive, { hair: '#1a1410', hairShade: '#0c0806', style: 'buzz', facial: 'goatee', eyes: 'angry' }), shirt: '#f0c830', shirtShade: '#c09a18', sleeve: 'none', shoulderW: 14, hipW: 11, armR: 2.6, pants: '#30405a', torsoDetail: logo('#c02a2a', '#f0f0f0') }),
  base('gokhan', { skin: SKIN.light[0], head: head(SKIN.light, { hair: '#2a2018', hairShade: '#140e0a', style: 'slick', eyes: 'shades' }), shirt: '#c02a3a', shirtShade: '#8a1a28', sleeve: 'long', pants: '#202028', torsoDetail: all(stripes('#f0f0f0', 99), openJacket('#f0f0f0', 1)), accessories: [{ layer: 'armF', draw: (p, j) => p.capsule(j.shF[0] + 1, j.shF[1], j.elF[0] + 1, j.elF[1], 0.3, hex('#f0f0f0')) }] }),
  base('leyla', { skin: SKIN.tan[0], head: head(SKIN.tan, { hair: '#3a2014', hairShade: '#200e08', hairHi: '#6a3a20', style: 'ponytail', lips: '#c0404c' }), shirt: '#e86a9a', shirtShade: '#b84a74', sleeve: 'long', shoulderW: 9, hipW: 9, armR: 1.7, legR: 2.3, pants: '#2a3a6a', shoes: '#f0f0f0', torsoDetail: apron('#f6ecd8') }),
  // ------------------------------------------------------------ New York
  base('punk', { skin: SKIN.fair[0], head: head(SKIN.fair, { hair: '#30d060', hairShade: '#1a9040', style: 'mohawk', eyes: 'angry', earring: true }), shirt: '#1a1a1e', shirtShade: '#0e0e12', sleeve: 'long', pants: '#30406a', shoes: '#1a1a1a', torsoDetail: all(openJacket('#c02a2a', 2), dots('#9a9aa8')) }),
  base('brick', { skin: SKIN.brown[0], head: head(SKIN.brown, { hair: '#1a1410', hairShade: '#0c0806', style: 'buzz', hat: 'beanie', hatColor: '#3a3a40', hatShade: '#242428', facial: 'beard', eyes: 'angry', wide: 1 }), shirt: '#70747c', shirtShade: '#50545c', sleeve: 'long', belly: 2, shoulderW: 15, hipW: 12, armR: 2.8, legR: 3.1, pants: '#2a2a30', torsoDetail: logo('#e8e8e8', '#30406a') }),
  base('vinny', { skin: SKIN.light[0], head: head(SKIN.light, { hair: '#141010', hairShade: '#060404', hairHi: '#3a3434', style: 'pompadour', eyes: 'shades' }), shirt: '#6a2a90', shirtShade: '#4a1a68', sleeve: 'long', pants: '#6a2a90', pantsShade: '#4a1a68', shoes: '#f0f0f0', torsoDetail: all(openJacket('#e8d8c8', 2), chain()) }),
  base('sal', {
    skin: SKIN.dark[0], head: head(SKIN.dark, { hair: '#c8c8c8', hairShade: '#8a8a8a', style: 'short', hat: 'beanie', hatColor: '#d8a020', hatShade: '#a07010', facial: 'whitebeard', facialColor: '#d8d8d8', eyes: 'glasses' }),
    shirt: '#7a5a3a', shirtShade: '#5a3e24', sleeve: 'long', pants: '#4a4a3a', shoes: '#3a2a1a', coat: { color: '#7a5a3a', len: 9 }, fistColor: '#5a6a3a',
    torsoDetail: (p, j) => { for (let i = -3; i <= 3; i++) { p.set(j.neck[0] + i, j.neck[1] + 2, hex(i % 2 ? '#c02a2a' : '#e8c040')); p.set(j.neck[0] + i, j.neck[1] + 3, hex(i % 2 ? '#e8c040' : '#c02a2a')); } p.rect(j.neck[0] + 2, j.neck[1] + 4, 2, 5, hex('#c02a2a')); },
  }),
  // ------------------------------------------------------------ Tampa
  base('gator', { skin: SKIN.ruddy[0], head: head(SKIN.ruddy, { hair: '#7a5a30', hairShade: '#4a3418', style: 'short', hat: 'trucker', hatColor: '#3a8a3a', hatShade: '#24602a', hatAccent: '#f0f0f0', facial: 'stubble', facialColor: '#7a5a30' }), shirt: '#4aa04a', shirtShade: '#2e7a30', sleeve: 'none', pants: '#7a7a4a', shorts: true, shoes: '#f0f0f0', torsoDetail: logo('#1a5a1a', '#f0f0f0') }),
  base('kyle', { skin: SKIN.fair[0], head: head(SKIN.fair, { hair: '#e8c060', hairShade: '#b08a30', hairHi: '#fff0a0', style: 'long', hat: 'capback', hatColor: '#e04a8a', hatShade: '#a02a5a' }), shirt: '#30c0c0', shirtShade: '#1a9090', pants: '#3a3a8a', shorts: true, shoes: '#1a1a1a', soles: '#f0f0f0', torsoDetail: dots('#f0f040', '#e04a8a') }),
  base('lou', { skin: SKIN.ruddy[0], head: head(SKIN.ruddy, { hair: '#5a3a20', hairShade: '#3a2410', style: 'bald', eyes: 'shades', facial: 'chops', wide: 2 }), shirt: '#f08a30', shirtShade: '#c06a18', belly: 5, shoulderW: 15, hipW: 13, armR: 2.9, legR: 3.2, thigh: 6, pants: '#d8c8a0', shorts: true, shoes: '#3a2a1a', torsoDetail: dots('#f0f0f0', '#30a060') }),
  base('cindy', { skin: SKIN.tan[0], head: head(SKIN.tan, { hair: '#c86a20', hairShade: '#8a4410', hairHi: '#f09a40', style: 'ponytail', hat: 'visor', hatColor: '#f08a20', hatShade: '#c0601a', lips: '#d04a5a' }), shirt: '#f6f2ea', shirtShade: '#d0c8bc', sleeve: 'none', shoulderW: 9, hipW: 9, armR: 1.7, legR: 2.3, pants: '#3a7ac0', shorts: true, shoes: '#f0f0f0', torsoDetail: logo('#f08a20', '#4aa04a') }),
  base('earl', {
    skin: SKIN.fair[0], head: head(SKIN.fair, { hair: '#f0f0f0', hairShade: '#b8b8c0', style: 'balding', facial: 'mustache', facialColor: '#f0f0f0', eyes: 'glasses', wrinkles: true }),
    shirt: '#c8b88a', shirtShade: '#a0905e', sleeve: 'short', pants: '#a8946a', pantsShade: '#80704a', shoes: '#4a3a2a', baseLean: 6, thigh: 6, shin: 7,
    torsoDetail: all(dots('#a0905e'), (p, j) => { p.set(j.neck[0] - 1, j.neck[1] + 1, hex('#f0f0f0')); p.set(j.neck[0] + 2, j.neck[1] + 1, hex('#f0f0f0')); }),
    accessories: [{ layer: 'armF', draw: (p, j) => { p.set(j.haF[0] - 1, j.haF[1] - 3, hex('#e0c040')); } }],
  }),
  // ------------------------------------------------------------ bosses
  boss('kemal', {
    skin: SKIN.olive[0], head: head(SKIN.olive, { hair: '#141010', hairShade: '#060404', style: 'short', hat: 'flatcap', hatColor: '#3a3430', hatShade: '#242020', facial: 'handlebar', facialColor: '#141010', eyes: 'angry', big: true, wide: 1 }),
    shirt: '#1e1c22', shirtShade: '#121016', sleeve: 'long', pants: '#1e1c22', coat: { color: '#1e1c22', len: 14 }, shoes: '#3a2a1a', belly: 2,
    torsoDetail: all(openJacket('#f0ece4', 3), chain('#d8d8e0')),
  }),
  boss('selim', {
    skin: SKIN.tan[0], head: head(SKIN.tan, { hair: '#1a1210', hairShade: '#0a0606', hairHi: '#4a3a30', style: 'pompadour', eyes: 'shades', facial: 'goatee', big: true }),
    shirt: '#f4f0e8', shirtShade: '#ccc6ba', sleeve: 'long', pants: '#f4f0e8', pantsShade: '#ccc6ba', shoes: '#c02a3a', soles: '#f0f0f0', shoulderW: 14, hipW: 11, armR: 2.4, legR: 2.9,
    torsoDetail: all(openJacket('#f06aa0', 3), chain()),
  }),
  boss('malone', {
    skin: SKIN.brown[0], head: head(SKIN.brown, { hair: '#1a1410', hairShade: '#0c0806', style: 'bald', facial: 'goatee', eyes: 'angry', big: true, earring: true }),
    shirt: '#f0f0f0', shirtShade: '#c8c8d0', sleeve: 'none', pants: '#3a3a48', fistColor: '#c8202c', shoulderW: 17, armR: 3.2,
    torsoDetail: suspenders('#c8202c'),
  }),
  boss('gus', {
    skin: SKIN.ruddy[0], head: head(SKIN.ruddy, { hair: '#6a4a2a', hairShade: '#4a3018', style: 'short', hat: 'trucker', hatColor: '#2a7a3a', hatShade: '#1a5a24', hatAccent: '#f0f0f0', facial: 'beard', facialColor: '#6a4a2a', big: true, wide: 2 }),
    shirt: '#3a9a5a', shirtShade: '#246a3a', belly: 7, shoulderW: 18, hipW: 15, armR: 3.4, legR: 3.6, thigh: 8, pants: '#d8c8a0', shorts: true, shoes: '#4a3a2a',
    torsoDetail: dots('#f0e060', '#e04a4a'),
  }),
];
