// Painted shop interiors (tools/art/import_shop.py → public/assets/shops/): a room ships
// its own backdrop and, when the backdrop does not already paint him, the keeper's counter
// atlas. A shop with no room art keeps the drawn interior, and there a keeper with an atlas
// is still drawn from it — Marcos behind the bodega counter — instead of from blocks.
//
// The atlas is 16 cells in a 4x4 grid, one row per keeper animation, and every frame is
// already scaled and cut at the bar's edge by the import — so a frame is blitted straight
// onto `counterY` with the cell's own anchor and needs no masking at runtime.

import { TICK_HZ } from '../../shared/data/constants';
import { ITEMS } from '../../shared/data/items';
import type { ShopDef } from '../../shared/data/shops';
import { fold, textWidth } from './font';

export interface KeeperAnim { frames: number[]; fps: number }
export interface KeeperAtlas {
  img: HTMLImageElement;
  cell: [number, number];
  anchor: [number, number];
  anims: Record<string, KeeperAnim>;
}
export interface ShopRoom {
  img: HTMLImageElement;
  w: number;
  h: number;
  counterY: number;   // room y of the bar's top edge, where the keeper's hands rest
  keeperX: number;    // room x of the keeper's centre line
  keeper: KeeperAtlas | null;
  board: ChalkBoard | null;   // the chalk menu on the wall, when the room painted one
}

/** The blank slate a room ships for its menu board, in room pixels. The art paints the
 *  frame and the slate; the words are chalked on at runtime so they are real text. */
export interface ChalkBoard { x: number; y: number; w: number; h: number }

// The board's handwriting, in board pixels: the header sits under the top frame, a chalk
// rule separates it from the counter, and each row takes the 8px line the speech bubble
// uses. Names are left-aligned, prices right-aligned in a column at the slate's edge.
const CHALK = { header: 5, rule: 14, first: 16, pitch: 8, ruleW: 19, padX: 4, gap: 3 };

interface ChalkLine { s: string; x: number; y: number }
/** One dish on the wall: its short name, its price, and the line it sits on. */
export interface ChalkRow { name: string; price: string; y: number }
export interface ChalkLayout {
  header: ChalkLine;
  rule: [number, number, number];
  rows: ChalkRow[];
  nameX: number;      // left edge of the names
  priceX: number;     // right edge of the price column
}

/** Where the writing goes, derived from the shop rather than typed in: the board lists the
 *  counter's own stock, in menu order, as many rows as the slate has room for. A row is the
 *  dish's first word (`Pastor Plate` → `PASTOR`) and its price — the wallet's numbers, since
 *  a chalk menu writes amounts and the printed menu below carries the city's symbol. A dish
 *  that is added, renamed or repriced moves the wall with it; a dish too wide for the slate
 *  (a long name beside a three-digit price) is skipped for the next one that fits. */
export function chalkLayout(b: ChalkBoard, shop: ShopDef): ChalkLayout {
  const cx = b.x + Math.floor(b.w / 2);
  const nameX = b.x + CHALK.padX;
  const priceX = b.x + b.w - CHALK.padX;
  const room = priceX - nameX;
  const bottom = b.y + b.h - 4;                  // the slate's last row
  const rows: ChalkRow[] = [];
  for (const id of shop.stock) {
    const y = b.y + CHALK.first + rows.length * CHALK.pitch;
    if (y + 7 > bottom) break;                   // no line left on the slate
    const name = fold(ITEMS[id].name.split(' ')[0]);
    const price = String(ITEMS[id].price);
    if (textWidth(name) + CHALK.gap + textWidth(price) > room) continue;
    rows.push({ name, price, y });
  }
  const left = cx - Math.floor(CHALK.ruleW / 2);
  return {
    header: { s: 'MENÚ', x: cx, y: b.y + CHALK.header },
    rule: [left, left + CHALK.ruleW - 1, b.y + CHALK.rule],
    rows,
    nameX,
    priceX,
  };
}

/** Shops that ship painted art, by shop id. */
const ROOMS = ['tacos', 'bakkal', 'pazar'];

/** Keeper sheets that ship a counter atlas, by the name their room and keeper use. */
const KEEPERS = ['lupe', 'marcos', 'husnu', 'kemal'];

const rooms = new Map<string, ShopRoom>();
const atlases = new Map<string, KeeperAtlas>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('failed to load ' + src)); i.src = src; });
}

interface RoomMeta { w: number; h: number; counterY: number; keeperX: number; keeper?: string; board?: [number, number, number, number] }
interface AtlasMeta { cell: [number, number]; anchor: [number, number]; anims: Record<string, KeeperAnim> }

/** `Hüsnü` → `husnu`: the keeper's name as the atlas files spell it. */
export function keeperKey(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '').replace(/ı/g, 'i');
}

/** Load every painted room and keeper atlas once; a missing file just leaves that shop
 *  drawn by hand, or its keeper drawn from blocks. */
export async function loadShopArt(base: string): Promise<void> {
  await Promise.all(KEEPERS.map(async (id) => {
    try {
      const meta = await fetch(`${base}${id}.json`).then((r) => r.json() as Promise<AtlasMeta>);
      const img = await loadImage(`${base}${id}.png`);
      atlases.set(id, { img, cell: meta.cell, anchor: meta.anchor, anims: meta.anims });
    } catch { /* no atlas: the keeper is drawn by hand */ }
  }));
  await Promise.all(ROOMS.map(async (id) => {
    try {
      const meta = await fetch(`${base}${id}.json`).then((r) => r.json() as Promise<RoomMeta>);
      const img = await loadImage(`${base}${id}.png`);
      const [bx, by, bw, bh] = meta.board ?? [0, 0, 0, 0];
      rooms.set(id, {
        img, w: meta.w, h: meta.h, counterY: meta.counterY, keeperX: meta.keeperX,
        keeper: (meta.keeper && atlases.get(meta.keeper)) || null,
        board: meta.board ? { x: bx, y: by, w: bw, h: bh } : null,
      });
    } catch { /* fall back to the drawn interior */ }
  }));
}

export function shopRoomFor(id: string): ShopRoom | null {
  return rooms.get(id) ?? null;
}

/** The counter atlas for a shop's keeper, or null when that shop still draws him. */
export function keeperAtlasFor(name: string): KeeperAtlas | null {
  return atlases.get(keeperKey(name)) ?? null;
}

/** The keeper cell to blit for `name` at game tick `tick`. Unknown names idle. */
export function keeperFrame(k: KeeperAtlas, name: string, tick: number): { img: HTMLImageElement; sx: number; sy: number; w: number; h: number } {
  const [cw, ch] = k.cell;
  const anim = k.anims[name] ?? k.anims.idle;
  const count = anim.frames.length || 1;
  const i = Math.floor((tick * anim.fps) / TICK_HZ) % count;
  const f = anim.frames[i];
  const cols = Math.max(1, Math.floor(k.img.width / cw));
  return { img: k.img, sx: (f % cols) * cw, sy: Math.floor(f / cols) * ch, w: cw, h: ch };
}
