import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ART, HAZARD_SIZE, hazardSize } from '../src/client/render/art';
import { MIRRORED, paintedShop, STAGE_FOR, type StageArt } from '../src/client/render/stages';
import { CHAPTERS } from '../src/shared/data/stages';

// The hand-authored maps in `src/client/render/art.ts` are rasterised at boot, so a ragged row
// or a missing palette entry shows up in game as a torn sprite or a magenta pixel, never as an
// error. These checks pin the invariants down instead.

describe('pixel art tables', () => {
  it('every map is rectangular and only uses colours from its palette', () => {
    for (const [name, a] of Object.entries(ART)) {
      const widths = new Set(a.rows.map((r) => r.length));
      expect([...widths], `${name} has rows of one width`).toHaveLength(1);
      const unknown = new Set<string>();
      for (const row of a.rows) for (const ch of row) if (ch !== '.' && ch !== ' ' && !(ch in a.pal)) unknown.add(ch);
      expect([...unknown], `${name} has no unmapped colour keys`).toEqual([]);
    }
  });

  it('gives every destructible an intact, damaged and smashed map', () => {
    for (const kind of ['bin', 'crate', 'box', 'barrel', 'mailbox']) {
      expect(ART[kind], kind).toBeDefined();
      expect(ART[`${kind}_dmg`], `${kind} damaged`).toBeDefined();
      expect(ART[`${kind}_broken`], `${kind} smashed`).toBeDefined();
      // the wreckage is a wide pile, not a single small prop
      expect(ART[`${kind}_broken`].rows[0].length, `${kind} smashed width`).toBeGreaterThan(ART[kind].rows[0].length);
    }
  });

  it('declares a player-scale footprint for every hazard, matching its hit box', () => {
    for (const ch of CHAPTERS) {
      for (const se of ch.sections) {
        for (const h of se.hazards ?? []) {
          const [w, hh] = hazardSize(h.kind);
          expect(HAZARD_SIZE[h.kind], `${h.kind} has a footprint`).toBeDefined();
          // nothing a fighter can be knocked down by should read smaller than the fighter
          expect(hh, `${h.kind} is tall enough to see`).toBeGreaterThanOrEqual(44);
          expect(w, `${h.kind} is wide enough to see`).toBeGreaterThanOrEqual(44);
          // a vehicle hits exactly the strip its art covers
          expect(h.hitW, `${h.kind} hit width`).toBe(w);
        }
      }
    }
  });
});

// The imported stage strips (tools/art/import_stages.py) paint their own shop doorways and
// stalls, and the campaign places its shops on those painted spots: the strip tiles from world
// x=0, so an anchor at `x` repeats at `x + w * n`. A spot that drifts off an anchor puts a shop
// marker over bare wall, and two spots on one anchor show the same storefront twice.
interface StageMetaFile { w: number; h: number; ground: number; scale: number; shops: { x: number; kind: 'store' | 'vendor' }[] }
const SNAP = 6;
const strips = [...new Set(Object.values(STAGE_FOR))];
const meta = (id: string): StageMetaFile => JSON.parse(readFileSync(`public/assets/stages/${id}.json`, 'utf8')) as StageMetaFile;
const art = (id: string): StageArt => ({ img: null as unknown as HTMLImageElement, meta: meta(id) });
/** Signed distance from a world x to the nearest painted anchor of this strip's tile. */
const offAnchor = (m: StageMetaFile, x: number): number => {
  const local = ((x % m.w) + m.w) % m.w;
  return Math.min(...m.shops.map((s) => Math.abs(local - s.x)));
};
/** The painted anchor a spot stands on, if any (null when the renderer must draw a booth). */
const anchorOf = (m: StageMetaFile, id: string, x: number): number | null => {
  if (!paintedShop(art(id), x, MIRRORED.has(id))) return null;
  const t = m.w, n = Math.floor(x / t), local = x - n * t;
  const seen = MIRRORED.has(id) && Math.abs(n % 2) === 1 ? t - local : local;
  return m.shops.findIndex((s) => Math.abs(seen - s.x) <= SNAP);
};

describe('stage strips', () => {
  it('ships a tileable strip with anchors inside its width', () => {
    for (const id of strips) {
      const m = meta(id);
      expect(m.w, id).toBeGreaterThan(320);
      for (const s of m.shops) {
        expect(s.x, `${id} anchor`).toBeGreaterThanOrEqual(0);
        expect(s.x, `${id} anchor`).toBeLessThan(m.w);
        expect(['store', 'vendor'], `${id} anchor kind`).toContain(s.kind);
      }
      // anchors follow each other along the street, never stacked on one spot
      const xs = m.shops.map((s) => s.x);
      expect(xs, `${id} anchors sorted`).toEqual([...xs].sort((a, b) => a - b));
      for (let i = 1; i < xs.length; i++) expect(xs[i] - xs[i - 1], `${id} anchor spacing`).toBeGreaterThanOrEqual(40);
    }
  });

  it('puts every shop spot on a painted anchor or clear of the art, never half over it', () => {
    for (const ch of CHAPTERS) {
      for (const se of ch.sections) {
        const id = STAGE_FOR[se.theme];
        if (!id) continue;
        const m = meta(id);
        for (const shop of se.shops) {
          expect(shop.x, `${se.name} shop inside the street`).toBeGreaterThan(40);
          expect(shop.x, `${se.name} shop inside the street`).toBeLessThan(se.length - 40);
          const d = m.shops.length ? offAnchor(m, shop.x) : 99;
          // either it stands on the painted shop, or the renderer draws a booth well clear of it
          expect(d <= SNAP || d >= 40, `${se.name} ${shop.shop}@${shop.x} is ${Math.round(d)}px off the nearest anchor`).toBe(true);
          // a mirrored strip flips every other tile, so a painted shop only exists on even ones
          if (MIRRORED.has(id) && d <= SNAP) {
            expect(Math.floor(shop.x / m.w) % 2, `${se.name} ${shop.shop}@${shop.x} sits on an unmirrored tile`).toBe(0);
          }
        }
      }
    }
  });

  it('never paints two of the same shop frontage into one street', () => {
    for (const ch of CHAPTERS) {
      for (const se of ch.sections) {
        const id = STAGE_FOR[se.theme];
        if (!id) continue;
        const m = meta(id);
        const painted = se.shops.map((s) => anchorOf(m, id, s.x)).filter((a): a is number => a !== null && a >= 0);
        // one storefront per street: two spots on the same anchor would paint the same shop twice
        expect(new Set(painted).size, `${se.name} distinct painted shops`).toBe(painted.length);
      }
    }
  });
});
