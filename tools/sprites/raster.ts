// Tiny RGBA pixel rasterizer used by the sprite generator. No anti-aliasing anywhere:
// every primitive writes whole pixels so sheets stay crisp at any integer scale.

export type RGBA = number; // 0xRRGGBBAA

export function hex(c: string): RGBA {
  const h = c.replace('#', '');
  const v = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
  return ((v << 8) | 0xff) >>> 0;
}

export function shade(c: RGBA, f: number): RGBA {
  const r = (c >>> 24) & 255, g = (c >>> 16) & 255, b = (c >>> 8) & 255;
  const k = (x: number) => Math.max(0, Math.min(255, Math.round(f > 1 ? x + (255 - x) * (f - 1) : x * f)));
  return ((k(r) << 24) | (k(g) << 16) | (k(b) << 8) | 0xff) >>> 0;
}

export const OUTLINE = hex('#1a1220');

export class Px {
  readonly data: Uint32Array;
  constructor(readonly w: number, readonly h: number) {
    this.data = new Uint32Array(w * h);
  }
  get(x: number, y: number): RGBA {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[y * this.w + x];
  }
  set(x: number, y: number, c: RGBA): void {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.data[y * this.w + x] = c;
  }
  rect(x: number, y: number, w: number, h: number, c: RGBA): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }
  /** Filled ellipse centred on (cx, cy). */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: RGBA): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
  }
  /** Thick segment with round caps: every pixel within r of the segment. */
  capsule(x0: number, y0: number, x1: number, y1: number, r: number, c: RGBA): void {
    const minX = Math.floor(Math.min(x0, x1) - r), maxX = Math.ceil(Math.max(x0, x1) + r);
    const minY = Math.floor(Math.min(y0, y1) - r), maxY = Math.ceil(Math.max(y0, y1) + r);
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    for (let y = minY; y <= maxY; y++)
      for (let x = minX; x <= maxX; x++) {
        let t = ((x - x0) * dx + (y - y0) * dy) / l2;
        t = Math.max(0, Math.min(1, t));
        const ex = x - (x0 + t * dx), ey = y - (y0 + t * dy);
        if (ex * ex + ey * ey <= r * r + 0.2) this.set(x, y, c);
      }
  }
  /** Convex or concave polygon fill (even-odd, pixel centres). */
  poly(pts: [number, number][], c: RGBA): void {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const yc = y + 0.5, xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
        if ((ay <= yc && by > yc) || (by <= yc && ay > yc)) xs.push(ax + ((yc - ay) / (by - ay)) * (bx - ax));
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2)
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, c);
    }
  }
  /** Stamp a character map. `.` and space are transparent. */
  map(rows: string[], pal: Record<string, RGBA>, ox: number, oy: number, flip = false): void {
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '.' || ch === ' ') continue;
        const c = pal[ch];
        if (c === undefined) throw new Error(`palette missing '${ch}'`);
        this.set(flip ? ox + row.length - 1 - x : ox + x, oy + y, c);
      }
    }
  }
  /** Recolour every opaque pixel that matches `test`. */
  recolor(test: (x: number, y: number, c: RGBA) => RGBA | null): void {
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        const c = this.data[y * this.w + x];
        if (!c) continue;
        const n = test(x, y, c);
        if (n !== null) this.data[y * this.w + x] = n;
      }
  }
  /** Add a 1px outline around all opaque pixels (4-neighbourhood). */
  outline(c: RGBA = OUTLINE): this {
    const add: number[] = [];
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++) {
        if (this.data[y * this.w + x]) continue;
        if (this.get(x - 1, y) || this.get(x + 1, y) || this.get(x, y - 1) || this.get(x, y + 1)) add.push(y * this.w + x);
      }
    for (const i of add) this.data[i] = c;
    return this;
  }
  /** Composite `src` over this canvas at an offset. */
  draw(src: Px, ox = 0, oy = 0): void {
    for (let y = 0; y < src.h; y++)
      for (let x = 0; x < src.w; x++) {
        const c = src.data[y * src.w + x];
        if (c) this.set(ox + x, oy + y, c);
      }
  }
  /** Rotate 90 degrees counter-clockwise (exact, pixel-perfect). */
  rot90ccw(): Px {
    const o = new Px(this.h, this.w);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.data[(this.w - 1 - x) * o.w + y] = this.data[y * this.w + x];
    return o;
  }
  rot90cw(): Px {
    const o = new Px(this.h, this.w);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) o.data[x * o.w + (this.h - 1 - y)] = this.data[y * this.w + x];
    return o;
  }
  bounds(): { x0: number; y0: number; x1: number; y1: number } | null {
    let x0 = this.w, y0 = this.h, x1 = -1, y1 = -1;
    for (let y = 0; y < this.h; y++)
      for (let x = 0; x < this.w; x++)
        if (this.data[y * this.w + x]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    return x1 < 0 ? null : { x0, y0, x1, y1 };
  }
  toRGBA(): Uint8Array {
    const out = new Uint8Array(this.w * this.h * 4);
    for (let i = 0; i < this.data.length; i++) {
      const c = this.data[i];
      out[i * 4] = (c >>> 24) & 255; out[i * 4 + 1] = (c >>> 16) & 255; out[i * 4 + 2] = (c >>> 8) & 255; out[i * 4 + 3] = c & 255;
    }
    return out;
  }
}
