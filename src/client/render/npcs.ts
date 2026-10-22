// Townsfolk atlas (tools/art/import_npcs.py): eight pedestrians, four stride frames each.
// They are scenery only - pure client-side ambience, never simulated, never collided with.

export interface NpcAtlas {
  cell: [number, number];
  cols: number;
  rows: number;
  ids: string[];
  anchor: [number, number];
}

export interface NpcFrame { img: HTMLImageElement | HTMLCanvasElement; sx: number; sy: number; w: number; h: number }

let atlas: NpcAtlas | null = null;
let sheet: HTMLImageElement | null = null;
let mirrored: HTMLCanvasElement | null = null;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('failed to load ' + src)); i.src = src; });
}

function mirror(img: HTMLImageElement): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  cv.width = img.width; cv.height = img.height;
  const c = cv.getContext('2d')!;
  c.save(); c.translate(img.width, 0); c.scale(-1, 1); c.drawImage(img, 0, 0); c.restore();
  return cv;
}

/** Loads the crowd atlas; a missing file is not fatal - the streets just stay empty. */
export async function loadNpcs(base: string): Promise<void> {
  try {
    const meta = await (await fetch(`${base}npcs.json`)).json() as NpcAtlas;
    const img = await loadImage(`${base}npcs.png`);
    atlas = meta; sheet = img; mirrored = mirror(img);
  } catch {
    atlas = null; sheet = null; mirrored = null;
  }
}

export function npcIds(): string[] { return atlas?.ids ?? []; }

export function npcAnchor(): [number, number] { return atlas?.anchor ?? [30, 60]; }

/** One stride frame of a pedestrian, mirrored when walking left. */
export function npcFrame(id: string, frame: number, flip = false): NpcFrame | null {
  if (!atlas || !sheet || !mirrored) return null;
  const row = atlas.ids.indexOf(id);
  if (row < 0) return null;
  const [cw, ch] = atlas.cell;
  const col = ((frame % atlas.cols) + atlas.cols) % atlas.cols;
  return { img: flip ? mirrored : sheet, sx: col * cw, sy: row * ch, w: cw, h: ch };
}
