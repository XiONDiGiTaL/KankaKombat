// The supplied stage strips (tools/art/import_stages.py → public/assets/stages/): one wide
// painted scene per district, scrolled 1:1 behind the fighters and tiled along the section.
//
// A strip also carries the shops it paints: the bodega doorway, the bazaar stalls, the taco
// truck's hatch. Because the tile repeats from world x=0, every painted shop sits at a known
// world x, and the section's shop spots are authored on those coordinates — so the storefront
// on screen is the one you can walk into. `paintedShop` tells the renderer which spots already
// have art and which still need a stall drawn on the pavement.

export interface StageShop {
  x: number;                        // shop anchor in tile pixels
  kind: 'store' | 'vendor';         // a doorway you enter, or a booth you walk up to
}

export interface StageMeta {
  w: number;          // tile width in world pixels
  h: number;          // always SCREEN_H
  ground: number;     // STREET_TOP the art was anchored to
  scale: number;
  shops: StageShop[];
}

export interface StageArt { img: HTMLImageElement; meta: StageMeta }

/** How close a shop spot has to be to a painted anchor to count as the same shop. */
const SNAP = 6;

/** Strips whose panorama has no lettering and no one-way landmarks: they are repeated
 *  alternately mirrored (ping-pong), so every join is edge-to-edge with its own reflection
 *  and the sky, water and pavement run on without a seam. Strips with readable signs (New
 *  York, the platform signage, the taco truck) repeat straight, because a mirrored sign is
 *  worse than a join. */
export const MIRRORED: ReadonlySet<string> = new Set(['bosphorus', 'kordon', 'bazaar']);

/** Which strip backs which background theme. Sections without an entry keep the hand-drawn
 *  backdrops (the boss arenas and Ybor, which have no supplied strip). */
export const STAGE_FOR: Record<string, string> = {
  ny_street: 'ny',
  ny_block: 'ny',
  ny_plaza: 'ny',
  ny_subway: 'subway',
  izm_kordon: 'kordon',
  izm_plaza: 'kordon',
  izm_bazaar: 'bazaar',
  ist_market: 'bazaar',
  ist_plaza: 'bosphorus',
  ist_galata: 'bosphorus',
  tpa_boardwalk: 'tampa',
  tpa_plaza: 'tampa',
  gym: 'gym',
};

const stages = new Map<string, StageArt>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('failed to load ' + src)); i.src = src; });
}

/** Load every strip once; a missing file just leaves that district on its drawn backdrop. */
export async function loadStages(base: string): Promise<void> {
  await Promise.all([...new Set(Object.values(STAGE_FOR))].map(async (id) => {
    try {
      const [meta, img] = await Promise.all([
        fetch(`${base}${id}.json`).then((r) => r.json() as Promise<StageMeta>),
        loadImage(`${base}${id}.png`),
      ]);
      stages.set(id, { img, meta: { ...meta, shops: meta.shops ?? [] } });
    } catch { /* fall back to the procedural backdrop */ }
  }));
}

export function stageFor(theme: string): StageArt | null {
  const id = STAGE_FOR[theme];
  return id ? stages.get(id) ?? null : null;
}

/** Strip id behind a background theme, when it has one. */
export function stageIdFor(theme: string): string | null {
  return STAGE_FOR[theme] ?? null;
}

/** True when the strip already paints a shop at this world x, so the renderer draws no booth
 *  of its own on top of it. The tile repeats every `w` from world 0, and mirrored stages flip
 *  every other tile, so the anchor of an odd tile is measured from that tile's far edge. */
export function paintedShop(art: StageArt, worldX: number, mirrored = false): boolean {
  const t = art.meta.w;
  const n = Math.floor(worldX / t);
  const local = worldX - n * t;
  // odd tiles on a mirrored strip show the art back to front, so anchors measure from the right
  const x = mirrored && Math.abs(n % 2) === 1 ? t - local : local;
  return art.meta.shops.some((s) => Math.abs(x - s.x) <= SNAP);
}
