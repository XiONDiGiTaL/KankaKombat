// Skeletal pixel rig. A character is a spec (proportions, palette, head maps, accessories),
// a frame is a Pose. Each body part is rasterised into its own layer and outlined
// individually, which gives the internal dark edges typical of 16-bit sprites.

import { Px, RGBA, hex, shade, OUTLINE } from './raster';

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
  footF?: number; footB?: number;    // shoe angle tweak (unused = flat)
}

export interface HeadDef {
  back?: string[];                   // layer drawn behind the torso (long hair)
  backAt?: [number, number];         // offset of back layer relative to head origin
  front: string[];
  pal: Record<string, string>;
  neck: [number, number];            // pixel in `front` that sits on the neck point
  eyes: [number, number][];          // top-left of each 2x3 eye, for expressions
  mouth: [number, number];           // centre-left of mouth
  mouthW?: number;
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
  torsoDetail?: (p: Px, j: Joints, s: CharSpec) => void;
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

export function solve(s: CharSpec, p: Pose): Joints {
  const cx = Math.floor(s.cell[0] / 2);
  const legLen = s.thigh + s.shin;
  const hip: [number, number] = [cx + (p.bx ?? 0), s.ground - legLen - 2 + (p.by ?? 0)];
  const lean = p.lean ?? 0;
  const up: [number, number] = [Math.sin(rad(lean)), -Math.cos(rad(lean))];
  const neck = add(hip, [up[0] * s.torsoLen, up[1] * s.torsoLen]);
  const shoulder = add(hip, [up[0] * (s.torsoLen - 2), up[1] * (s.torsoLen - 2)]);
  const shF = add(shoulder, [2, 0]);
  const shB = add(shoulder, [-2, 0]);
  const [aF, eF] = p.af ?? [8, 10];
  const [aB, eB] = p.ab ?? [-8, 10];
  const elF = add(shF, dir(aF, s.uarm));
  const haF = add(elF, dir(aF + eF, s.farm));
  const elB = add(shB, dir(aB, s.uarm));
  const haB = add(elB, dir(aB + eB, s.farm));
  const hiF = add(hip, [1, 0]);
  const hiB = add(hip, [-2, 0]);
  const [lF, kF] = p.lf ?? [4, 0];
  const [lB, kB] = p.lb ?? [-4, 0];
  const knF = add(hiF, dir(lF, s.thigh));
  const ftF = add(knF, dir(lF - kF, s.shin));
  const knB = add(hiB, dir(lB, s.thigh));
  const ftB = add(knB, dir(lB - kB, s.shin));
  const head = add(neck, [p.hx ?? 0, (p.hy ?? 0) + 1]);
  return { hip, neck, shF, shB, elF, elB, haF, haB, hiF, hiB, knF, knB, ftF, ftB, head, lean };
}

function layer(s: CharSpec): Px {
  return new Px(s.cell[0], s.cell[1]);
}

function drawArm(s: CharSpec, j: Joints, front: boolean, fist: number | undefined): Px {
  const L = layer(s);
  const skin = hex(s.skin);
  const sh = front ? j.shF : j.shB, el = front ? j.elF : j.elB, ha = front ? j.haF : j.haB;
  const dark = front ? 1 : 0.78;
  const sleeveC = shade(hex(s.shirt), dark);
  const skinC = shade(skin, dark);
  const sleeve = s.sleeve ?? 'short';
  // upper arm
  if (sleeve === 'none') L.capsule(sh[0], sh[1], el[0], el[1], s.armR, skinC);
  else if (sleeve === 'short') {
    L.capsule(sh[0], sh[1], el[0], el[1], s.armR, skinC);
    const mid: [number, number] = [sh[0] + (el[0] - sh[0]) * 0.55, sh[1] + (el[1] - sh[1]) * 0.55];
    L.capsule(sh[0], sh[1], mid[0], mid[1], s.armR + 0.6, sleeveC);
  } else L.capsule(sh[0], sh[1], el[0], el[1], s.armR, sleeveC);
  // forearm
  if (sleeve === 'long') {
    const cuff: [number, number] = [el[0] + (ha[0] - el[0]) * 0.75, el[1] + (ha[1] - el[1]) * 0.75];
    L.capsule(el[0], el[1], cuff[0], cuff[1], s.armR, sleeveC);
    L.capsule(cuff[0], cuff[1], ha[0], ha[1], s.armR - 0.4, skinC);
  } else L.capsule(el[0], el[1], ha[0], ha[1], s.armR - 0.3, skinC);
  // fist
  L.ellipse(ha[0], ha[1], fist ?? 2, fist ?? 2, skinC);
  L.set(ha[0] + 1, ha[1] - 1, shade(skinC, 1.18));
  return L;
}

function drawLeg(s: CharSpec, j: Joints, front: boolean): Px {
  const L = layer(s);
  const dark = front ? 1 : 0.78;
  const pants = shade(hex(s.pants), dark);
  const pantsD = shade(hex(s.pantsShade ?? s.pants), dark * 0.82);
  const hi = front ? j.hiF : j.hiB, kn = front ? j.knF : j.knB, ft = front ? j.ftF : j.ftB;
  if (s.shorts) {
    const mid: [number, number] = [hi[0] + (kn[0] - hi[0]) * 0.9, hi[1] + (kn[1] - hi[1]) * 0.9];
    L.capsule(kn[0], kn[1], ft[0], ft[1], s.legR - 0.8, shade(hex(s.skin), dark));
    L.capsule(hi[0], hi[1], mid[0], mid[1], s.legR + 0.3, pants);
  } else {
    L.capsule(hi[0], hi[1], kn[0], kn[1], s.legR, pants);
    L.capsule(kn[0], kn[1], ft[0], ft[1], s.legR - 0.4, pants);
    // shading on the back edge of the leg
    L.recolor((x, _y, c) => (c === pants && x <= Math.min(hi[0], kn[0], ft[0]) - s.legR + 1.5 ? pantsD : null));
  }
  // shoe: flat, pointing forward
  const shoe = shade(hex(s.shoes), dark);
  const fx = Math.round(ft[0]), fy = Math.round(ft[1]);
  L.rect(fx - 2, fy - 1, 6, 3, shoe);
  L.rect(fx - 2, fy + 2, 6, 1, shade(hex(s.soles ?? '#e8e2d6'), dark));
  if (s.shoeAccent) L.rect(fx + 1, fy, 2, 2, shade(hex(s.shoeAccent), dark));
  return L;
}

function drawTorso(s: CharSpec, j: Joints): Px {
  const L = layer(s);
  const c = hex(s.shirt), cd = hex(s.shirtShade ?? '#000000');
  const lean = rad(j.lean);
  const ux = Math.sin(lean), uy = -Math.cos(lean); // spine up
  const px = -uy, py = ux;                        // perpendicular (forward)
  const hw = s.hipW / 2, sw = s.shoulderW / 2, b = s.belly ?? 0;
  const hip = j.hip, top: [number, number] = [hip[0] + ux * s.torsoLen, hip[1] + uy * s.torsoLen];
  const midY = 0.45;
  const mid: [number, number] = [hip[0] + ux * s.torsoLen * midY, hip[1] + uy * s.torsoLen * midY];
  const pts: [number, number][] = [
    [hip[0] - px * hw, hip[1] - py * hw + 1],
    [mid[0] - px * (hw + 0.5), mid[1] - py * (hw + 0.5)],
    [top[0] - px * sw, top[1] - py * sw],
    [top[0] + px * sw, top[1] + py * sw],
    [mid[0] + px * (hw + 0.5 + b), mid[1] + py * (hw + 0.5 + b)],
    [hip[0] + px * (hw + b * 0.6), hip[1] + py * (hw + b * 0.6) + 1],
  ];
  L.poly(pts, c);
  if (b > 0) L.ellipse(mid[0] + px * (hw * 0.4 + b * 0.5), mid[1] + 1, hw * 0.6 + b * 0.5, s.torsoLen * 0.36, c);
  // back-side shading strip
  if (s.shirtShade) L.recolor((x, _y, col) => (col === c && x <= Math.round(top[0] - sw + 2) && x <= Math.round(hip[0] - hw + 2) ? cd : null));
  // belt line
  const belt = shade(hex(s.pants), 0.7);
  for (let i = -hw; i <= hw + b * 0.6; i++) L.set(hip[0] + px * i, hip[1] + py * i, belt);
  s.torsoDetail?.(L, j, s);
  return L;
}

const FACE_PAL = { e: '#ffffff', p: '#20141a', m: '#a83a44', t: '#f6f2ee', x: '#20141a' };

function drawHead(s: CharSpec, j: Joints, face: Face, back: boolean): Px {
  const L = layer(s);
  const h = s.head;
  const pal: Record<string, RGBA> = {};
  for (const [k, v] of Object.entries({ ...FACE_PAL, ...h.pal })) pal[k] = hex(v);
  const ox = Math.round(j.head[0]) - h.neck[0], oy = Math.round(j.head[1]) - h.neck[1];
  if (back) {
    if (h.back) L.map(h.back, pal, ox + (h.backAt?.[0] ?? 0), oy + (h.backAt?.[1] ?? 0));
    return L;
  }
  L.map(h.front, pal, ox, oy);
  // expressions are drawn over the neutral face
  const skin = pal.s, dark = hex('#20141a'), mouthC = hex('#7a2430');
  const [mx, my] = h.mouth; const mw = h.mouthW ?? 2;
  const eyeClear = () => h.eyes.forEach(([ex, ey]) => L.rect(ox + ex, oy + ey, 2, 3, skin));
  switch (face) {
    case 'blink': eyeClear(); h.eyes.forEach(([ex, ey]) => L.rect(ox + ex, oy + ey + 2, 2, 1, dark)); break;
    case 'hurt':
      eyeClear();
      h.eyes.forEach(([ex, ey]) => { L.set(ox + ex, oy + ey + 1, dark); L.set(ox + ex + 1, oy + ey + 2, dark); L.set(ox + ex + 1, oy + ey, dark); });
      L.rect(ox + mx, oy + my, mw, 2, mouthC); break;
    case 'ko':
      eyeClear();
      h.eyes.forEach(([ex, ey]) => { L.set(ox + ex, oy + ey, dark); L.set(ox + ex + 1, oy + ey + 1, dark); L.set(ox + ex, oy + ey + 2, dark); L.set(ox + ex + 1, oy + ey + 2, skin); });
      L.rect(ox + mx, oy + my, mw, 1, mouthC); break;
    case 'shout': case 'angry':
      h.eyes.forEach(([ex, ey]) => L.rect(ox + ex - (face === 'angry' ? 0 : 0), oy + ey - 1, 2, 1, dark));
      L.rect(ox + mx, oy + my - 1, mw, 2, mouthC); L.rect(ox + mx, oy + my - 1, mw, 1, hex('#f6f2ee')); break;
    case 'happy':
      eyeClear();
      h.eyes.forEach(([ex, ey]) => { L.set(ox + ex, oy + ey + 1, dark); L.set(ox + ex + 1, oy + ey + 1, dark); L.set(ox + ex - 0, oy + ey + 2, skin); });
      L.rect(ox + mx, oy + my, mw + 1, 1, mouthC); break;
    case 'eat': L.rect(ox + mx, oy + my - 1, mw, 2, mouthC); break;
    default: break;
  }
  return L;
}

export const PROPS: Record<string, { rows: string[]; pal: Record<string, string>; at: [number, number] }> = {
  food: { rows: ['.cc.', 'cbbc', 'cbbc', '.cc.'], pal: { c: '#e8b04a', b: '#7a3b1a' }, at: [-1, -3] },
  cane: { rows: ['.ww', 'w.w', '..w', '..w', '..w', '..w', '..w', '..w', '..w', '..w', '..w', '..w'], pal: { w: '#6b4226' }, at: [-2, -3] },
  umbrella: { rows: ['.....r', '....r.', '...r..', '..r...', '.r....', 'h.....'], pal: { r: '#3a3f6b', h: '#c8b98a' }, at: [-1, -5] },
  cone: { rows: ['.pw.', 'pwwp', '.yy.', '.yy.', '..y.'], pal: { p: '#f5a6c0', w: '#fff4e4', y: '#e2a95a' }, at: [-2, -6] },
  sign: { rows: ['bbbbbbbb', 'bkkbbkkb', 'bbbbbbbb', 'bkbbkkbb', 'bbbbbbbb', '...ww...', '...ww...'], pal: { b: '#b48a5a', k: '#3a2a1a', w: '#7a5a3a' }, at: [-4, -7] },
  beads: { rows: ['g.g.g', '.g.g.', '..g..', '..g..', '..r..'], pal: { g: '#3fae7a', r: '#c23b3b' }, at: [-2, -1] },
};

function drawProp(s: CharSpec, j: Joints, name: string): Px {
  const L = layer(s);
  const pr = PROPS[name];
  if (!pr) return L;
  const pal: Record<string, RGBA> = {};
  for (const [k, v] of Object.entries(pr.pal)) pal[k] = hex(v);
  L.map(pr.rows, pal, Math.round(j.haF[0]) + pr.at[0], Math.round(j.haF[1]) + pr.at[1]);
  return L.outline();
}

export function render(s: CharSpec, p: Pose): Px {
  const j = solve(s, p);
  const out = layer(s);
  const acc = (l: Accessory['layer'], target: Px) => s.accessories?.filter((a) => a.layer === l).forEach((a) => a.draw(target, j, s));
  const face = p.face ?? 'n';
  const armB = drawArm(s, j, false, p.fistB); acc('armB', armB);
  out.draw(armB.outline());
  out.draw(drawHead(s, j, face, true).outline());
  out.draw(drawLeg(s, j, false).outline());
  out.draw(drawLeg(s, j, true).outline());
  const torso = drawTorso(s, j); acc('torso', torso);
  out.draw(torso.outline());
  const head = drawHead(s, j, face, false); acc('head', head);
  out.draw(head.outline());
  if (p.hold) out.draw(drawProp(s, j, p.hold));
  const armF = drawArm(s, j, true, p.fistF); acc('armF', armF);
  out.draw(armF.outline());
  const over = layer(s); acc('over', over); out.draw(over);
  let res = out;
  if (p.rot === 90) res = out.rot90cw();
  else if (p.rot === -90) res = out.rot90ccw();
  if (p.rot || p.dy || p.dx) {
    // re-seat rotated / shifted sprite inside the cell with its lowest pixel on the ground line
    const fixed = layer(s);
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
