// Supersampled pixel canvas. Shapes are rasterised on a 4x grid and then reduced to
// whole pixels, so curves, tapers and rotated props land on clean 1px steps instead of
// the blocky staircases you get from filling capsules directly at gameplay size.
// Detail work (eyes, laces, seams) is still written straight into the 1x result.

import { Px, RGBA } from './raster';

export class Hi {
  readonly buf: Uint32Array;
  readonly sw: number;
  readonly sh: number;

  constructor(readonly w: number, readonly h: number, readonly s = 4) {
    this.sw = w * s; this.sh = h * s;
    this.buf = new Uint32Array(this.sw * this.sh);
  }

  private sp(x: number, y: number, c: RGBA): void {
    if (x < 0 || y < 0 || x >= this.sw || y >= this.sh || !c) return;
    this.buf[y * this.sw + x] = c;
  }

  /** One whole game pixel (1x). */
  set(x: number, y: number, c: RGBA): void {
    const px = Math.round(x) * this.s, py = Math.round(y) * this.s;
    for (let j = 0; j < this.s; j++) for (let i = 0; i < this.s; i++) this.sp(px + i, py + j, c);
  }

  get(x: number, y: number): RGBA {
    const px = Math.round(x) * this.s + (this.s >> 1), py = Math.round(y) * this.s + (this.s >> 1);
    if (px < 0 || py < 0 || px >= this.sw || py >= this.sh) return 0;
    return this.buf[py * this.sw + px];
  }

  rect(x: number, y: number, w: number, h: number, c: RGBA): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  /** Filled ellipse, subpixel centre and radii. */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGBA): void {
    const s = this.s;
    const x0 = Math.floor((cx - rx) * s), x1 = Math.ceil((cx + rx) * s);
    const y0 = Math.floor((cy - ry) * s), y1 = Math.ceil((cy + ry) * s);
    const irx = 1 / (rx + 0.001), iry = 1 / (ry + 0.001);
    for (let y = y0; y <= y1; y++) {
      const py = (y + 0.5) / s, dy = (py - cy) * iry;
      for (let x = x0; x <= x1; x++) {
        const px = (x + 0.5) / s, dx = (px - cx) * irx;
        if (dx * dx + dy * dy <= 1) this.sp(x, y, c);
      }
    }
  }

  /** Round-capped segment of constant radius. */
  capsule(x0: number, y0: number, x1: number, y1: number, r: number, c: RGBA): void {
    this.taper(x0, y0, x1, y1, r, r, c);
  }

  /** Round-capped segment whose radius eases from r0 at the first joint to r1 at the second. */
  taper(x0: number, y0: number, x1: number, y1: number, r0: number, r1: number, c: RGBA): void {
    const s = this.s;
    const pad = Math.max(r0, r1) + 1;
    const sx = Math.floor((Math.min(x0, x1) - pad) * s), ex = Math.ceil((Math.max(x0, x1) + pad) * s);
    const sy = Math.floor((Math.min(y0, y1) - pad) * s), ey = Math.ceil((Math.max(y0, y1) + pad) * s);
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (let y = sy; y <= ey; y++) {
      const py = (y + 0.5) / s;
      for (let x = sx; x <= ex; x++) {
        const px = (x + 0.5) / s;
        let t = ((px - x0) * dx + (py - y0) * dy) / l2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const ex2 = px - (x0 + t * dx), ey2 = py - (y0 + t * dy);
        const r = r0 + (r1 - r0) * t;
        if (ex2 * ex2 + ey2 * ey2 <= r * r) this.sp(x, y, c);
      }
    }
  }

  /**
   * Continuous limb: a polyline whose half-width is given per point. The outline is built
   * as one closed polygon with averaged normals at the joints, so a bent arm or leg is a
   * single ribbon instead of stacked capsules with bulges where the segments meet.
   */
  limb(pts: [number, number, number][], c: RGBA): void {
    const n = pts.length;
    if (n < 2) return;
    const left: [number, number][] = [], right: [number, number][] = [];
    for (let i = 0; i < n; i++) {
      const p = pts[i], prev = pts[Math.max(0, i - 1)], next = pts[Math.min(n - 1, i + 1)];
      let dx = next[0] - prev[0], dy = next[1] - prev[1];
      const l = Math.hypot(dx, dy) || 1;
      dx /= l; dy /= l;
      const nx = -dy, ny = dx, w = p[2];
      left.push([p[0] + nx * w, p[1] + ny * w]);
      right.push([p[0] - nx * w, p[1] - ny * w]);
    }
    this.poly([...left, ...right.reverse()], c);
  }

  /** Convex or concave polygon (even-odd fill), subpixel vertices. */
  poly(pts: [number, number][], c: RGBA): void {
    const s = this.s;
    const ys = pts.map((p) => p[1]);
    const y0 = Math.floor(Math.min(...ys) * s), y1 = Math.ceil(Math.max(...ys) * s);
    for (let y = y0; y <= y1; y++) {
      const yc = (y + 0.5) / s, xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.floor(xs[k] * s), xb = Math.ceil(xs[k + 1] * s);
        for (let x = xa; x < xb; x++) this.sp(x, y, c);
      }
    }
  }

  /** Rotated rectangle: handy for laces, straps and props following a limb. */
  quad(cx: number, cy: number, w: number, h: number, angleDeg: number, c: RGBA): void {
    const a = (angleDeg * Math.PI) / 180, ca = Math.cos(a), sa = Math.sin(a);
    const hw = w / 2, hh = h / 2;
    const pt = (x: number, y: number): [number, number] => [cx + x * ca - y * sa, cy + x * sa + y * ca];
    this.poly([pt(-hw, -hh), pt(hw, -hh), pt(hw, hh), pt(-hw, hh)], c);
  }

  /** Reduce to whole pixels: each 1x pixel takes the dominant colour of its 4x4 sample block. */
  down(): Px {
    const out = new Px(this.w, this.h);
    const s = this.s, n = s * s, half = n / 2;
    const counts = new Map<number, number>();
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        counts.clear();
        let best = 0, bestN = 0, filled = 0;
        for (let j = 0; j < s; j++) {
          const row = (y * s + j) * this.sw + x * s;
          for (let i = 0; i < s; i++) {
            const c = this.buf[row + i];
            if (!c) continue;
            filled++;
            const k = (counts.get(c) ?? 0) + 1;
            counts.set(c, k);
            if (k > bestN) { bestN = k; best = c; }
          }
        }
        if (filled >= half) out.set(x, y, best);
      }
    return out;
  }
}
