// Hero heads, drawn from the hand-authored maps in headmaps.ts.
//
// The rig only needs a HeadDef: a paint function for the front and back layers, plus the
// eye / mouth rectangles the expression pass repaints. Because the maps are explicit, the
// silhouette, hairline, brows and outfit accessories stay identical in every frame.

import type { HeadDef } from './rig';
import { Px, RGBA, hex } from './raster';
import { HeadMap } from './headmaps';

export const HEAD_BOX: [number, number] = [20, 22];
const NECK: [number, number] = [10, 21];

export function makeHead(m: HeadMap): HeadDef {
  const pal: Record<string, RGBA> = {};
  for (const [k, v] of Object.entries(m.pal)) pal[k] = hex(v);
  return {
    box: HEAD_BOX,
    paint: (back: boolean) => {
      const L = new Px(HEAD_BOX[0], HEAD_BOX[1]);
      L.map(back ? m.back : m.front, pal, 0, 0);
      return L;
    },
    pal: { s: m.pal.s, M: m.pal.L ?? '#7a2430' },
    neck: NECK,
    eyes: m.eyes,
    eyeW: 2,
    eyeH: 2,
    mouth: m.mouth,
    mouthW: 3,
    shades: !!m.pal.S,
  };
}
