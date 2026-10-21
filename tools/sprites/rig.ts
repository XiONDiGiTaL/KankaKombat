// Skeletal pixel rig, v2.
//
// A character is a spec (proportions, palette, head map), a frame is a Pose. Body parts are
// rasterised on a 4x supersampled canvas and reduced to whole pixels. The important change
// over v1: parts are composited as ONE figure. Each part gets a coloured occlusion edge where
// it passes in front of the part behind it, and a single dark outline is drawn around the
// finished silhouette. Outlining every part separately is what used to slice black lines
// across shoulders and hips and make the limbs read as detached shapes.
//
// Limbs are built as continuous ribbons through their joints (shoulder-elbow-wrist,
// hip-knee-ankle) rather than stacked round capsules, so a bent arm or leg keeps an even
// width and a clean elbow/knee instead of a lump where two capsules overlap.

import { Px, RGBA, hex, shade, OUTLINE } from './raster';
import { Hi } from './hi';

export type Face = 'n' | 'hurt' | 'shout' | 'happy' | 'ko' | 'eat' | 'blink' | 'angry';

export interface Pose {
  bx?: number; by?: number;          // hip offset (by + = down)
  lean?: number;                     // torso lean in degrees (+ = forward)
  hx?: number; hy?: number;          // extra head offset
  af?: [number, number];             // front arm [shoulder angle, elbow bend]; 0 = down, 90 = forward
  ab?: [number, number];             // back arm
  lf?: [number, number];             // front leg [hip angle, knee bend]
  lb?: [number, number];
  fistF?: number; fistB?: number;    // fist radius override (bigger = impact)
  face?: Face;
  rot?: 0 | 90 | -90;                // whole-sprite rotation (lying down)
  dy?: number;                       // whole-sprite vertical offset after rotation (air / lying)
  dx?: number;
  hold?: string;                     // prop held in front hand
  holdAngle?: number;                // prop angle in degrees (0 = forward, -90 = up)
  footF?: number; footB?: number;    // shoe angle tweak (unused = flat)
}

export interface HeadDef {
  back?: string[];                   // layer drawn behind the torso (long hair)
  backAt?: [number, number];         // offset of back layer relative to head origin
  box?: [number, number];            // local canvas size for painted heads
  paint?: (back: boolean) => Px;     // paints a head in its own local canvas
  front?: string[];
  pal?: Record<string, string>;
  neck: [number, number];            // pixel in `front` that sits on the neck point
  eyes: [number, number][];          // top-left of each eye, for expressions
  eyeW?: number; eyeH?: number;      // eye box (default 2x3)
  mouth: [number, number];           // centre-left of mouth
  mouthW?: number;
  shades?: boolean;                  // eyes are covered: expressions only move the mouth
}

export interface Accessory {
  layer: 'torso' | 'armF' | 'armB' | 'head' | 'over';
  draw: (p: Px, j: Joints, s: CharSpec) => void;
}

export interface CharSpec {
  id: string;
  cell: [number, number];
  ground: number;                    // baseline y inside the cell
  thigh: number; shin: number; legR: number;
  uarm: number; farm: number; armR: number;
  torsoLen: number; shoulderW: number; hipW: number;
  belly?: number;                    // forward bulge of the torso (px)
  skin: string;
  shirt: string; shirtShade?: string; sleeve?: 'short' | 'long' | 'none';
  pants: string; pantsShade?: string; shorts?: boolean;
  shoes: string; shoeAccent?: string; soles?: string;
  head: HeadDef;
  accessories?: Accessory[];
  shades?: boolean;                  // eyes covered (sunglasses) – skip eye expressions
  torsoDetail?: (p: Px, j: Joints, s: CharSpec) => void;
  baseLean?: number;
  fistColor?: string;
  coat?: { color: string; len: number };
}

export interface Joints {
  hip: [number, number]; neck: [number, number];
  shF: [number, number]; shB: [number, number];
  elF: [number, number]; elB: [number, number];
  haF: [number, number]; haB: [number, number];
  hiF: [number, number]; hiB: [number, number];
  knF: [number, number]; knB: [number, number];
  ftF: [number, number]; ftB: [number, number];
  head: [number, number];
  lean: number;
}

const rad = (d: number) => (d * Math.PI) / 180;
const dir = (a: number, l: number): [number, number] => [Math.sin(rad(a)) * l, Math.cos(rad(a)) * l];
const add = (a: [number, number], b: [number, number]): [number, number] => [a[0] + b[0], a[1] + b[1]];
const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

export function solve(s: CharSpec, p: Pose): Joints {
  const cx = Math.floor(s.cell[0] / 2);
  const legLen = s.thigh + s.shin;
  const hip: [number, number] = [cx + (p.bx ?? 0), s.ground - legLen - 2 + (p.by ?? 0)];
  const lean = (p.lean ?? 0) + (s.baseLean ?? 0);
  const up: [number, number] = [Math.sin(rad(lean)), -Math.cos(rad(lean))];
  const neck = add(hip, [up[0] * s.torsoLen, up[1] * s.torsoLen]);
  const shoulder = add(hip, [up[0] * (s.torsoLen - 2), up[1] * (s.torsoLen - 2)]);
  // arms hang off the front/back edge of the ribcage, not out of its middle
  const shoulderX = Math.max(3.2, s.shoulderW * 0.36);
  const shF = add(shoulder, [shoulderX, 0]);
  const shB = add(shoulder, [-shoulderX, 0]);
  const [aF, eF] = p.af ?? [8, 12];
  const [aB, eB] = p.ab ?? [-6, 12];
  const elF = add(shF, dir(aF, s.uarm));
  const haF = add(elF, dir(aF + eF, s.farm));
  const elB = add(shB, dir(aB, s.uarm));
  const haB = add(elB, dir(aB + eB, s.farm));
  const hiF = add(hip, [2.4, 0]);
  const hiB = add(hip, [-2.4, 0]);
  const [lF, kF] = p.lf ?? [4, 0];
  const [lB, kB] = p.lb ?? [-4, 0];
  const knF = add(hiF, dir(lF, s.thigh));
  const ftF = add(knF, dir(lF - kF, s.shin));
  const knB = add(hiB, dir(lB, s.thigh));
  const ftB = add(knB, dir(lB - kB, s.shin));
  const head = add(neck, [p.hx ?? 0, (p.hy ?? 0) + 1]);
  return { hip, neck, shF, shB, elF, elB, haF, haB, hiF, hiB, knF, knB, ftF, ftB, head, lean };
}

function layer(s: CharSpec, sup = 4): Hi {
  return new Hi(s.cell[0], s.cell[1], sup);
}

const SUPER = 4;

// ---------------------------------------------------------------- compositing
/**
 * Composite one part onto the figure. Pixels of `part` that touch a part already in `out`
 * get a one-step darker version of their own colour: that is the occlusion edge that makes a
 * limb read as being in front of the body without an interior black outline.
 */
function merge(out: Px, part: Px, rim: RGBA = OUTLINE): void {
  const idx: number[] = [];
  for (let y = 0; y < part.h; y++)
    for (let x = 0; x < part.w; x++) {
      if (!part.data[y * part.w + x]) continue;
      if (!(out.get(x - 1, y) || out.get(x + 1, y) || out.get(x, y - 1) || out.get(x, y + 1))) continue;
      // only the contour: a pixel with all four neighbours inside the part is interior
      if (part.get(x - 1, y) && part.get(x + 1, y) && part.get(x, y - 1) && part.get(x, y + 1)) continue;
      idx.push(y * part.w + x);
    }
  for (const i of idx) part.data[i] = rim;
  out.draw(part);
}

/** Volume ramp on one colour: outline-adjacent shadow, mid shadow, base, lit edge. */
function volume(p: Px, base: RGBA, dark: RGBA, light: RGBA, mid = 0.9): void {
  const marks: [number, number, RGBA][] = [];
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (p.get(x, y) !== base) continue;
      const l = !p.get(x - 1, y), r = !p.get(x + 1, y);
      const u = !p.get(x, y - 1), d = !p.get(x, y + 1);
      if (l || d) marks.push([x, y, dark]);
      else if (r || u) marks.push([x, y, light]);
    }
  for (const [x, y, c] of marks) p.set(x, y, c);
  // a single softer band just inside the shadow edge; a second band turned to noise at
  // gameplay scale, which is why the concept sheets keep to three tones per material
  const soft: [number, number][] = [];
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (p.get(x, y) !== base) continue;
      if (p.get(x - 1, y) === dark || p.get(x, y + 1) === dark) soft.push([x, y]);
    }
  const midc = shade(base, mid);
  for (const [x, y] of soft) p.set(x, y, midc);
}

/** Bresenham line, 1px, clipped to the canvas. */
function line(p: Px, x0: number, y0: number, x1: number, y1: number, c: RGBA): void {
  let x = Math.round(x0), y = Math.round(y0);
  const ex = Math.round(x1), ey = Math.round(y1);
  const dx = Math.abs(ex - x), dy = -Math.abs(ey - y);
  const sx = x < ex ? 1 : -1, sy = y < ey ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    p.set(x, y, c);
    if (x === ex && y === ey) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

// ---------------------------------------------------------------- arms
function drawArm(s: CharSpec, j: Joints, front: boolean, fist: number | undefined): Px {
  const dim = front ? 1 : 0.86;
  const skin = shade(hex(s.skin), dim);
  const skinD = shade(skin, 0.74);
  const skinL = shade(skin, 1.13);
  const shirt = shade(hex(s.shirt), dim);
  const shirtD = shade(shirt, 0.72);
  const shirtL = shade(shirt, 1.12);

  const H = layer(s, SUPER);
  const sh = front ? j.shF : j.shB, el = front ? j.elF : j.elB, ha = front ? j.haF : j.haB;
  const r = s.armR;
  const sleeve = s.sleeve ?? 'short';

  // one continuous arm: deltoid, elbow, tapered forearm
  H.limb([
    [sh[0], sh[1], r * 1.18],
    [el[0], el[1], r * 0.96],
    [lerp(el, ha, 0.55)[0], lerp(el, ha, 0.55)[1], r * 0.83],
    [ha[0], ha[1], r * 0.74],
  ], skin);

  // fist: compact block with a knuckle ridge
  const fr = (fist ?? 1.85) + (s.fistColor ? 0.45 : 0);
  H.ellipse(ha[0], ha[1], fr, fr * 0.94, skin);

  // sleeve: deltoid cap, then a hem band
  if (sleeve !== 'none') {
    if (sleeve === 'long') {
      const end = lerp(el, ha, 0.9);
      H.limb([
        [sh[0], sh[1], r + 0.75],
        [el[0], el[1], r + 0.5],
        [end[0], end[1], r + 0.55],
      ], shirt);
    } else {
      const end = lerp(sh, el, 0.62);
      H.limb([[sh[0], sh[1], r + 0.8], [end[0], end[1], r + 0.75]], shirt);
    }
  }

  const p = H.down();
  volume(p, skin, skinD, skinL);
  if (sleeve !== 'none') volume(p, shirt, shirtD, shirtL);

  // elbow crease, only on bare arms (sleeves cover it)
  if (sleeve !== 'long') {
    const eu: [number, number] = [(el[0] - sh[0]) / (s.uarm || 1), (el[1] - sh[1]) / (s.uarm || 1)];
    const ep: [number, number] = [-eu[1], eu[0]];
    line(p, el[0] - ep[0] * 1.1, el[1] - ep[1] * 1.1, el[0] + ep[0] * 0.9, el[1] + ep[1] * 0.9, skinD);
  } else {
    // cuff line at the wrist
    const wr = lerp(el, ha, 0.88);
    p.set(wr[0], wr[1], shirtD);
    p.set(wr[0] + (front ? 1 : 0), wr[1], shirtD);
  }

  // knuckles and thumb
  p.set(ha[0] - 1, ha[1] - 1, skinL); p.set(ha[0] + 1, ha[1] - 1, skinL);
  p.set(ha[0], ha[1] + fr * 0.8, skinD);
  p.set(ha[0] - fr * 0.85, ha[1] + 0.5, shade(skin, 0.94));
  return p;
}

// ---------------------------------------------------------------- legs
function drawShoe(H: Hi, ax: number, ay: number, angle: number, s: CharSpec, dim: number): void {
  const shoe = shade(hex(s.shoes), dim);
  const shoeD = shade(shoe, 0.7);
  const shoeL = shade(shoe, 1.14);
  const sole = shade(hex(s.soles ?? '#e8e2d6'), dim);
  const soleD = shade(sole, 0.66);
  const accent = s.shoeAccent ? shade(hex(s.shoeAccent), dim) : shoeD;

  const ca = Math.cos((angle * Math.PI) / 180), sa = Math.sin((angle * Math.PI) / 180);
  const P = (x: number, y: number): [number, number] => [ax + x * ca - y * sa, ay + x * sa + y * ca];

  // low-profile high-top: ankle shaft, instep, rounded toe
  H.poly([
    P(-2.4, -3.2), P(-0.2, -3.7), P(1.8, -2.4), P(3.5, -1.8),
    P(4.3, -0.8), P(4.4, 0.4), P(-2.5, 0.4), P(-2.7, -1.3),
  ], shoe);
  // toe cap and heel counter
  H.poly([P(2.7, -1.6), P(4.2, -0.6), P(4.3, 0.3), P(2.5, 0.3)], shoeD);
  H.poly([P(-2.6, -1.4), P(-1.4, -1.5), P(-1.2, 0.3), P(-2.6, 0.3)], accent);
  // collar + laces
  H.quad(...P(-1.2, -3.1), 3.8, 0.9, angle, shoeL);
  for (let i = 0; i < 2; i++) H.quad(...P(0.1 + i * 1.3, -2.5 + i * 0.5), 1.3, 0.7, angle, shoeL);
  // midsole + outsole
  H.poly([P(-2.7, 0.2), P(4.4, 0.2), P(4.4, 1.0), P(-2.7, 1.0)], sole);
  H.poly([P(-2.7, 0.9), P(4.4, 0.9), P(4.2, 1.6), P(-2.5, 1.6)], shade(soleD, 0.58));
}

function drawLeg(s: CharSpec, j: Joints, front: boolean): Px {
  const dim = front ? 1 : 0.82;
  const pants = shade(hex(s.pants), dim);
  const pantsD = shade(pants, 0.72);
  const pantsL = shade(pants, 1.14);
  const skin = shade(hex(s.skin), dim);
  const skinD = shade(skin, 0.76);
  const skinL = shade(skin, 1.12);

  const H = layer(s, SUPER);
  const hi = front ? j.hiF : j.hiB, kn = front ? j.knF : j.knB, ft = front ? j.ftF : j.ftB;
  const r = s.legR;
  const vx = ft[0] - kn[0], vy = ft[1] - kn[1];
  const vl = Math.hypot(vx, vy) || 1;
  const ank: [number, number] = [ft[0] - (vx / vl) * 2.2, ft[1] - (vy / vl) * 2.2];

  if (s.shorts) {
    const cuff = lerp(hi, kn, 0.72);
    H.limb([[hi[0], hi[1], r + 1.5], [cuff[0], cuff[1], r + 1.1]], pants);
    H.limb([[cuff[0], cuff[1], r * 0.98], [kn[0], kn[1], r * 0.88], [ank[0], ank[1], r * 0.74]], skin);
  } else {
    // baggy thigh easing into a slimmer calf: one ribbon, no knee bulge
    H.limb([
      [hi[0], hi[1], r + 0.6],
      [lerp(hi, kn, 0.45)[0], lerp(hi, kn, 0.45)[1], r + 0.2],
      [kn[0], kn[1], r * 0.9],
      [ank[0], ank[1], r * 0.76],
    ], pants);
  }

  // shoe follows the shin: local +x points along the foot
  const fx = vy / vl, fy = -vx / vl;
  const angle = (Math.atan2(fy, fx) * 180) / Math.PI;
  drawShoe(H, ank[0], ank[1], angle, s, dim);

  const p = H.down();
  volume(p, pants, pantsD, pantsL);
  if (s.shorts) volume(p, skin, skinD, skinL);

  // knee crease + a soft seam down the thigh
  const kx = (kn[0] - hi[0]) / (s.thigh || 1), ky = (kn[1] - hi[1]) / (s.thigh || 1);
  const kpx = -ky, kpy = kx;
  line(p, kn[0] - kpx * 1.2, kn[1] - kpy * 1.2, kn[0] + kpx * 0.8, kn[1] + kpy * 0.8, pantsD);
  return p;
}

// ---------------------------------------------------------------- torso
function drawTorso(s: CharSpec, j: Joints): Px {
  const shirt = hex(s.shirt), shirtD = shade(shirt, 0.7), shirtL = shade(shirt, 1.13);
  const H = layer(s, SUPER);
  const lean = rad(j.lean);
  const ux = Math.sin(lean), uy = -Math.cos(lean); // spine up
  const px = -uy, py = ux;                        // perpendicular (forward)
  const hw = s.hipW / 2, sw = s.shoulderW / 2, b = s.belly ?? 0;
  const hip = j.hip;
  const at = (t: number, side: number): [number, number] =>
    [hip[0] + ux * s.torsoLen * t + px * side, hip[1] + uy * s.torsoLen * t + py * side];

  // chest wider than the waist, hem falling straight over the belt
  const pts: [number, number][] = [
    at(-0.02, -hw - 0.6), at(0.2, -hw - 0.3), at(0.62, -sw + 1.1), at(0.95, -sw - 0.3),
    at(1.0, -sw + 2.2), at(1.0, sw - 2.2), at(0.95, sw + 0.3), at(0.64, sw - 0.6 + b * 0.3),
    at(0.28, hw + 1.3 + b * 0.5), at(-0.02, hw + 0.7 + b * 0.4),
  ];
  H.poly(pts, shirt);
  // rounded shoulders
  H.ellipse(at(0.94, -sw + 2.4)[0], at(0.94, -sw + 2.4)[1], 2.3, 2.1, shirt);
  H.ellipse(at(0.94, sw - 2.4)[0], at(0.94, sw - 2.4)[1], 2.3, 2.1, shirt);
  if (b > 0) H.ellipse(at(0.42, hw * 0.35 + b * 0.6)[0], at(0.42, hw * 0.35 + b * 0.6)[1], hw * 0.55 + b * 0.4, 2.8, shirt);

  // coat tails behind the hips
  if (s.coat) {
    const cc = hex(s.coat.color), l = s.coat.len;
    H.poly([
      [hip[0] - px * (hw + 1), hip[1] - 1], [hip[0] + px * (hw + 1 + b * 0.6), hip[1] - 1],
      [hip[0] + px * (hw + 2.4) + 1, hip[1] + l], [hip[0] - px * (hw + 3.4) - 1, hip[1] + l],
    ], cc);
  }

  const p = H.down();
  volume(p, shirt, shirtD, shirtL);

  // hem shadow: one row of dark above the belt line
  for (let i = -Math.round(hw + b * 0.8); i <= Math.round(hw + b * 0.8); i++) {
    const x = hip[0] + px * i, y = hip[1] + py * i;
    if (p.get(x, y) === shirt || p.get(x, y) === shirtL) p.set(x, y, shirtD);
  }
  // a fold from the armpit to the waist keeps the torso from reading as a slab
  const f0 = at(0.66, sw - 1.4), f1 = at(0.16, hw + 0.2);
  line(p, f0[0], f0[1], f1[0], f1[1], shade(shirt, 0.86));
  s.torsoDetail?.(p, j, s);
  return p;
}

// ---------------------------------------------------------------- head
const FACE_PAL = { e: '#ffffff', p: '#20141a', m: '#a83a44', t: '#f6f2ee', x: '#20141a' };

function drawHead(s: CharSpec, j: Joints, face: Face, back: boolean): Px {
  const h = s.head;
  const pal: Record<string, RGBA> = {};
  for (const [k, v] of Object.entries({ ...FACE_PAL, ...(h.pal ?? {}) })) pal[k] = hex(v);
  const ox = Math.round(j.head[0]) - h.neck[0], oy = Math.round(j.head[1]) - h.neck[1];
  if (h.paint) {
    const L = h.paint(back);
    const out = new Px(s.cell[0], s.cell[1]);
    out.draw(L, ox, oy);
    if (back) return out;
    if (face !== 'n') drawExpression(out, h, face, ox, oy);
    return out;
  }
  const L = layer(s, 1).down();
  if (back) {
    if (h.back) L.map(h.back, pal, ox + (h.backAt?.[0] ?? 0), oy + (h.backAt?.[1] ?? 0));
    return L;
  }
  L.map(h.front!, pal, ox, oy);
  drawExpression(L, h, face, ox, oy);
  return L;
}

/** Redraw the eye / mouth on a finished head for hurt, shout, ko, happy, blink. */
function drawExpression(L: Px, h: HeadDef, face: Face, ox: number, oy: number): void {
  const skin = hex(h.pal?.s ?? '#e0b48c'), dark = hex('#1a1220'), mouthC = hex(h.pal?.M ?? '#7a2430');
  const [mx, my] = h.mouth; const mw = h.mouthW ?? 2;
  const ew = h.eyeW ?? 2, eh = h.eyeH ?? 3;
  const drawEyes = (fn: (ex: number, ey: number) => void) => { if (h.shades) return; h.eyes.forEach(([ex, ey]) => fn(ex, ey)); };
  const clearAll = () => drawEyes((ex, ey) => L.rect(ox + ex, oy + ey, ew, eh, skin));
  const closeMouth = () => L.rect(ox + mx, oy + my, mw, 1, mouthC);
  switch (face) {
    case 'blink':
      clearAll();
      drawEyes((ex, ey) => L.rect(ox + ex, oy + ey + eh - 2, ew, 1, dark));
      break;
    case 'hurt':
      clearAll();
      drawEyes((ex, ey) => {
        for (let i = 0; i < ew; i++) L.set(ox + ex + i, oy + ey + Math.min(eh - 1, i), dark);
        for (let i = 0; i < Math.min(ew, eh); i++) L.set(ox + ex + i, oy + ey + eh - 1 - Math.min(eh - 1, i), dark);
      });
      L.rect(ox + mx, oy + my - 1, mw, 2, mouthC);
      break;
    case 'ko':
      clearAll();
      drawEyes((ex, ey) => {
        for (let i = 0; i < Math.min(ew, eh); i++) { L.set(ox + ex + i, oy + ey + i, dark); L.set(ox + ex + i, oy + ey + eh - 1 - i, dark); }
      });
      closeMouth();
      break;
    case 'shout': case 'angry':
      clearAll();
      drawEyes((ex, ey) => {
        L.rect(ox + ex, oy + ey + 1, ew, 1, dark);
        L.rect(ox + ex, oy + ey, ew, 1, face === 'angry' ? dark : skin);
      });
      L.rect(ox + mx, oy + my - 1, mw, 2, mouthC); L.rect(ox + mx, oy + my - 1, mw, 1, hex('#f6f2ee'));
      break;
    case 'happy':
      clearAll();
      drawEyes((ex, ey) => {
        for (let i = 0; i < ew; i++) L.set(ox + ex + i, oy + ey + 1 + Math.abs(i - Math.floor(ew / 2)), dark);
      });
      L.rect(ox + mx, oy + my, mw + 1, 1, mouthC); L.set(ox + mx + mw, oy + my + 1, mouthC);
      break;
    case 'eat':
      clearAll();
      drawEyes((ex, ey) => L.rect(ox + ex, oy + ey + eh - 2, ew, 1, dark));
      L.rect(ox + mx, oy + my - 1, mw, 2, mouthC);
      break;
    default: break;
  }
}

export const PROPS: Record<string, { rows: string[]; pal: Record<string, string>; at: [number, number] }> = {
  food: { rows: ['.cc.', 'cbbc', 'cbbc', '.cc.'], pal: { c: '#e8b04a', b: '#7a3b1a' }, at: [-1, -3] },
  cane: { rows: ['ww', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.', 'w.'], pal: { w: '#8a5a2a' }, at: [-1, -2] },
  umbrella: { rows: ['.....r', '....r.', '...r..', '..r...', '.r....', 'h.....'], pal: { r: '#3a3f6b', h: '#c8b98a' }, at: [-1, -5] },
  cone: { rows: ['.pw.', 'pwwp', '.yy.', '.yy.', '..y.'], pal: { p: '#f5a6c0', w: '#fff4e4', y: '#e2a95a' }, at: [-2, -6] },
  sign: { rows: ['bbbbbbbb', 'bkkbbkkb', 'bbbbbbbb', 'bkbbkkbb', 'bbbbbbbb', '...ww...', '...ww...'], pal: { b: '#b48a5a', k: '#3a2a1a', w: '#7a5a3a' }, at: [-4, -7] },
  beads: { rows: ['g.g.g', '.g.g.', '..g..', '..g..', '..r..'], pal: { g: '#3fae7a', r: '#c23b3b' }, at: [-2, -1] },
};

function drawDondurma(s: CharSpec, j: Joints, angle: number): Px {
  const L = new Px(s.cell[0], s.cell[1]);
  const H = layer(s, SUPER);
  const hx = Math.round(j.haF[0]), hy = Math.round(j.haF[1]);
  const a = rad(angle);
  const dx = Math.cos(a), dy = Math.sin(a);
  const len = 20;
  // long metal stick
  for (let i = 2; i <= len; i++) {
    const x = Math.round(hx + dx * i), y = Math.round(hy + dy * i);
    L.set(x, y, hex('#b8bcc8'));
    L.set(x + 1, y, hex('#7a7e8a'));
  }
  // the dondurma itself: a fat cream swirl with a highlight and a drip
  const tx = Math.round(hx + dx * (len + 2)), ty = Math.round(hy + dy * (len + 2));
  H.ellipse(tx, ty, 3.2, 4.2, hex('#f6f0d8'));
  H.ellipse(tx, ty - 1, 2.2, 2.6, hex('#fffdf0'));
  L.draw(H.down());
  L.set(tx - 1, ty + 3, hex('#efe6c8'));
  L.set(tx + 1, ty + 4, hex('#f6f0d8'));
  return L.outline();
}

function drawProp(s: CharSpec, j: Joints, name: string, angle = -70): Px {
  if (name === 'dondurma') return drawDondurma(s, j, angle);
  const L = new Px(s.cell[0], s.cell[1]);
  const pr = PROPS[name];
  if (!pr) return L;
  const pal: Record<string, RGBA> = {};
  for (const [k, v] of Object.entries(pr.pal)) pal[k] = hex(v);
  const up = j.haF[1] < j.elF[1] - 2;
  const rows = up ? [...pr.rows].reverse() : pr.rows;
  L.map(rows, pal, Math.round(j.haF[0]) + pr.at[0], Math.round(j.haF[1]) + (up ? -rows.length - pr.at[1] : pr.at[1]));
  return L.outline();
}

export function render(s: CharSpec, p: Pose): Px {
  const j = solve(s, p);
  const out = new Px(s.cell[0], s.cell[1]);
  const acc = (l: Accessory['layer'], target: Px) => s.accessories?.filter((a) => a.layer === l).forEach((a) => a.draw(target, j, s));
  const face = p.face ?? 'n';

  // back to front: hair, back arm, back leg, torso, front leg, head, prop, front arm
  merge(out, drawHead(s, j, face, true));
  const armB = drawArm(s, j, false, p.fistB); acc('armB', armB);
  merge(out, armB);
  merge(out, drawLeg(s, j, false));
  const torso = drawTorso(s, j); acc('torso', torso);
  merge(out, torso);
  merge(out, drawLeg(s, j, true));
  const head = drawHead(s, j, face, false); acc('head', head);
  merge(out, head);
  if (p.hold) merge(out, drawProp(s, j, p.hold, p.holdAngle));
  const armF = drawArm(s, j, true, p.fistF); acc('armF', armF);
  merge(out, armF);
  const over = new Px(s.cell[0], s.cell[1]); acc('over', over); merge(out, over);

  // one outline around the whole figure
  out.outline();

  let res = out;
  if (p.rot === 90) res = out.rot90cw();
  else if (p.rot === -90) res = out.rot90ccw();
  if (p.rot || p.dy || p.dx) {
    // re-seat rotated / shifted sprite inside the cell with its lowest pixel on the ground line
    const fixed = new Px(s.cell[0], s.cell[1]);
    const b = res.bounds();
    if (b) {
      const ox = Math.round((s.cell[0] - (b.x1 - b.x0 + 1)) / 2) - b.x0 + (p.dx ?? 0);
      const oy = p.rot ? s.ground - b.y1 + (p.dy ?? 0) : (p.dy ?? 0);
      fixed.draw(res, ox, oy);
    }
    res = fixed;
  }
  return res;
}

export { OUTLINE };
