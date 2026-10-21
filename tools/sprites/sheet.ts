// Packs rendered frames into a sprite sheet + JSON atlas.
import { PNG } from 'pngjs';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { Px } from './raster';
import { CharSpec, render } from './rig';
import { AnimSet } from './poses';

export interface AtlasAnim { frames: { i: number; t: number; ph?: string }[]; loop: boolean }
export interface Atlas { id: string; cell: [number, number]; anchor: [number, number]; cols: number; count: number; anims: Record<string, AtlasAnim> }

export function writePng(path: string, px: Px, scale = 1, bg?: number): void {
  const png = new PNG({ width: px.w * scale, height: px.h * scale });
  const rgba = px.toRGBA();
  for (let y = 0; y < png.height; y++)
    for (let x = 0; x < png.width; x++) {
      const si = (Math.floor(y / scale) * px.w + Math.floor(x / scale)) * 4, di = (y * png.width + x) * 4;
      if (rgba[si + 3] === 0 && bg !== undefined) {
        png.data[di] = (bg >>> 24) & 255; png.data[di + 1] = (bg >>> 16) & 255; png.data[di + 2] = (bg >>> 8) & 255; png.data[di + 3] = 255;
      } else for (let k = 0; k < 4; k++) png.data[di + k] = rgba[si + k];
    }
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, PNG.sync.write(png));
}

export function buildSheet(spec: CharSpec, anims: AnimSet, cols = 12): { sheet: Px; atlas: Atlas } {
  const frames: Px[] = [];
  const atlas: Atlas = { id: spec.id, cell: spec.cell, anchor: [Math.floor(spec.cell[0] / 2), spec.ground], cols, count: 0, anims: {} };
  for (const [name, anim] of Object.entries(anims)) {
    atlas.anims[name] = { loop: anim.loop, frames: anim.frames.map((fr) => { frames.push(render(spec, fr.p)); return { i: frames.length - 1, t: fr.t, ...(fr.ph ? { ph: fr.ph } : {}) }; }) };
  }
  atlas.count = frames.length;
  const rows = Math.ceil(frames.length / cols);
  const sheet = new Px(cols * spec.cell[0], rows * spec.cell[1]);
  frames.forEach((fr, i) => sheet.draw(fr, (i % cols) * spec.cell[0], Math.floor(i / cols) * spec.cell[1]));
  return { sheet, atlas };
}
