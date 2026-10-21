// 1x finishing passes: volume shading on a flat silhouette, lines for seams / strands.
// Everything here works on whole pixels so the result stays crisp.

import { Px, RGBA } from './raster';

/**
 * Light the top/right edge, shade the bottom/left edge. Applied after a silhouette has
 * been filled, this is what turns a flat capsule into a limb with a 3-tone ramp.
 */
export function bevel(p: Px, base: RGBA, dark: RGBA, light: RGBA): void {
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
}

/** Bresenham line, 1px. */
export function line(p: Px, x0: number, y0: number, x1: number, y1: number, c: RGBA): void {
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

/** Recolour any pixel in `from` to `to`, but only where `where` allows it. */
export function swap(p: Px, from: RGBA[], to: RGBA, where?: (x: number, y: number) => boolean): void {
  const set = new Set(from);
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (!set.has(p.get(x, y))) continue;
      if (where && !where(x, y)) continue;
      p.set(x, y, to);
    }
}

/** Darken the pixels of one colour that touch the back/bottom of a shape by one step. */
export function innerShade(p: Px, base: RGBA, dark: RGBA, dx = -1, dy = 0): void {
  const marks: [number, number][] = [];
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (p.get(x, y) !== base) continue;
      if (!p.get(x + dx, y + dy)) marks.push([x, y]);
    }
  for (const [x, y] of marks) p.set(x, y, dark);
}

/** Brighten the pixels of one colour that touch the light/front edge. */
export function edgeLight(p: Px, base: RGBA, light: RGBA, dx = 1, dy = 0): void {
  const marks: [number, number][] = [];
  for (let y = 0; y < p.h; y++)
    for (let x = 0; x < p.w; x++) {
      if (p.get(x, y) !== base) continue;
      if (!p.get(x + dx, y + dy)) marks.push([x, y]);
    }
  for (const [x, y] of marks) p.set(x, y, light);
}
