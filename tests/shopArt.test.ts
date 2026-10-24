// The painted taco shop ships as data: a room image plus Lupe's 16-cell atlas. These check
// the three things that would silently break the scene — the atlas frame math, the chalk
// board's writing fitting the slate the art leaves for it, and the versioned soundtrack
// URLs that keep a replaced master out of a year-long asset cache.
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { PNG } from 'pngjs';
import { chalkLayout, keeperFrame, keeperKey, type ChalkBoard, type KeeperAtlas } from '../src/client/render/shops';
import { fold, hasGlyph, textWidth } from '../src/client/render/font';
import { ITEMS, type ItemId } from '../src/shared/data/items';
import { SHOPS, type ShopDef } from '../src/shared/data/shops';
import { THEMES, musicUrl } from '../src/shared/data/music';
import { TICK_HZ } from '../src/shared/data/constants';

const atlas = (): KeeperAtlas => ({
  img: { width: 220 } as HTMLImageElement,
  cell: [55, 48],
  anchor: [27, 48],
  anims: {
    idle: { frames: [0, 1, 2, 3], fps: 5 },
    greet: { frames: [4, 5, 6, 7], fps: 10 },
  },
});

describe('keeper atlas', () => {
  it('steps through the frames of the named row at that row\'s rate', () => {
    const k = atlas();
    const first = keeperFrame(k, 'greet', 0);
    expect([first.sx, first.sy]).toEqual([0, 48]);          // frame 4: greeting row, first cell
    const next = keeperFrame(k, 'greet', TICK_HZ / 10);
    expect([next.sx, next.sy]).toEqual([55, 48]);           // frame 5: one cell to the right
  });

  it('loops, wraps rows by the sheet\'s column count, and idles on an unknown name', () => {
    const k = atlas();
    expect([keeperFrame(k, 'idle', 0).sx, keeperFrame(k, 'idle', TICK_HZ * 4).sx]).toEqual([0, 0]);
    expect(keeperFrame(k, 'idle', TICK_HZ / 5).sy).toBe(0);  // still the bust row
    expect(keeperFrame(k, 'never-shipped', 0).sy).toBe(0);  // no such row: the idle bust
  });
});

// The room art paints the board's frame and a blank slate; the game chalks it in with the
// HUD glyphs, reading the shop's own stock. So the writing has to fit the slate the art
// actually ships, and the rows have to be the counter's dishes at the counter's prices —
// a line that does not fit would spill onto the frame, and a typed-in dish could drift from
// the menu below the counter.
interface RoomMeta { w: number; h: number; counterY: number; board?: [number, number, number, number] }
const tacosMeta = JSON.parse(readFileSync('public/assets/shops/tacos.json', 'utf8')) as RoomMeta;
const board: ChalkBoard = (() => {
  const [x, y, w, h] = tacosMeta.board ?? [0, 0, 0, 0];
  return { x, y, w, h };
})();
const slate = { left: board.x + 3, right: board.x + board.w - 4, top: board.y + 3, bottom: board.y + board.h - 4 };
const layout = chalkLayout(board, SHOPS.tacos);

/** The name a board row uses: the dish's first word, folded the way the text layer draws it. */
const boardName = (id: ItemId) => fold(ITEMS[id].name.split(' ')[0]);

/** A shop that sells exactly these dishes, for testing the board against a changed stock. */
const stockOf = (...ids: ItemId[]): ShopDef => ({ ...SHOPS.tacos, stock: ids });

describe('chalk menu board', () => {
  it('is a slate on the wall, above the counter', () => {
    expect(tacosMeta.board).toBeDefined();
    expect(board.x).toBeGreaterThan(0);
    expect(slate.right).toBeLessThan(tacosMeta.w);
    expect(slate.top).toBeGreaterThan(0);
    expect(slate.bottom).toBeLessThan(tacosMeta.counterY);
  });

  it('writes the header, the rule and every row inside the slate', () => {
    const head = textWidth(layout.header.s);
    expect(head).toBeLessThanOrEqual(slate.right - slate.left + 1);
    expect(layout.header.x - head / 2).toBeGreaterThanOrEqual(slate.left);
    expect(layout.header.x + head / 2).toBeLessThanOrEqual(slate.right + 1);
    expect(layout.header.y).toBeGreaterThanOrEqual(slate.top);
    expect(layout.rule[0]).toBeGreaterThanOrEqual(slate.left);
    expect(layout.rule[1]).toBeLessThanOrEqual(slate.right);
    expect(layout.rule[2]).toBeGreaterThan(layout.header.y + 7);   // under the header, not on it

    expect(layout.rows.length).toBeGreaterThan(0);
    for (const r of layout.rows) {
      expect(layout.nameX, `${r.name} starts on the slate`).toBeGreaterThanOrEqual(slate.left);
      const right = layout.nameX + textWidth(r.name) - 1;
      const priceLeft = layout.priceX - textWidth(r.price);
      expect(right, `${r.name} clears the price column`).toBeLessThan(priceLeft);
      expect(layout.priceX, `${r.price} ends on the slate`).toBeLessThanOrEqual(slate.right + 1);
      expect(r.y).toBeGreaterThan(layout.rule[2]);
      expect(r.y + 7, `${r.name} clears the bottom frame`).toBeLessThanOrEqual(slate.bottom);
    }
    // rows step down by one line and never overlap the row above
    layout.rows.slice(1).forEach((r, i) => expect(r.y - layout.rows[i].y).toBe(8));
  });

  it('lists the counter\'s own dishes at the counter\'s own prices', () => {
    for (const r of layout.rows) {
      const stocked = SHOPS.tacos.stock.find((id) => boardName(id) === r.name);
      expect(stocked, `${r.name} is on the shelf`).toBeDefined();
      expect(r.price, `${r.name} costs what the menu charges`).toBe(String(ITEMS[stocked!].price));
      expect(r.price).toMatch(/^\d+$/);          // the wall writes amounts, not the symbol
    }
  });

  it('drops a dish the slate cannot fit instead of overflowing it', () => {
    // Quesadilla beside its price is wider than the slate: the board must not squeeze it in
    expect(chalkLayout(board, stockOf('quesadilla')).rows).toEqual([]);
    // and a stock of one short dish is one row, not a stale list
    const one = chalkLayout(board, stockOf('elote')).rows;
    expect(one.map((r) => [r.name, r.price])).toEqual([['ELOTE', '70']]);
  });

  it('shows as many rows as the slate holds, never more', () => {
    const many = chalkLayout(board, stockOf('taco', 'elote', 'burrito', 'pastor', 'quesadilla', 'tortilla'));
    expect(many.rows.length).toBe(3);
    expect(many.rows.map((r) => r.name)).toEqual(['TACO', 'ELOTE', 'BURRITO']);
    for (const r of many.rows) expect(r.y + 7).toBeLessThanOrEqual(slate.bottom);
  });

  it('chalks only glyphs the HUD font draws', () => {
    const lines = [layout.header.s, ...layout.rows.flatMap((r) => [r.name, r.price])];
    for (const s of lines) {
      expect(textWidth(s), s).toBeGreaterThan(0);
      for (const ch of s) expect(hasGlyph('hud', ch), `glyph for ${ch}`).toBe(true);
    }
  });
});

// The counter drop: four keeper sheets cut into 4x4 atlases by tools/art/import_shop.py. A
// keeper whose atlas is missing, mis-gridded or anchored above the cell's bottom edge draws
// as a cropped head or a floating torso, so the shipped files are pinned here.
interface AtlasFile { cell: [number, number]; anchor: [number, number]; anims: Record<string, { frames: number[]; fps: number }> }
interface PaintedRoom { w: number; h: number; counterY: number; keeperX: number; keeper?: string }
const KEEPER_IDS = ['lupe', 'marcos', 'husnu', 'kemal'];
const keeperMeta = (id: string) => JSON.parse(readFileSync(`public/assets/shops/${id}.json`, 'utf8')) as AtlasFile;
const roomMeta = (id: string) => JSON.parse(readFileSync(`public/assets/shops/${id}.json`, 'utf8')) as PaintedRoom;

const rgba = (id: string) => {
  const png = PNG.sync.read(readFileSync(`public/assets/shops/${id}.png`));
  return { png, at: (x: number, y: number) => {
    const i = (y * png.width + x) * 4;
    return [png.data[i], png.data[i + 1], png.data[i + 2], png.data[i + 3]];
  } };
};

describe('keeper atlases', () => {
  it('spells a keeper\'s name the way the atlas files do', () => {
    expect(keeperKey('Lupe')).toBe('lupe');
    expect(keeperKey('Marcos')).toBe('marcos');
    expect(keeperKey('Hüsnü')).toBe('husnu');
    expect(keeperKey('Kemal')).toBe('kemal');
    expect(keeperKey('Ayşe')).toBe('ayse');
    expect(keeperKey('Şükrü')).toBe('sukru');
  });

  it('ships a 4x4 grid of cells with every frame of all four rows', () => {
    for (const id of KEEPER_IDS) {
      const meta = keeperMeta(id);
      const { png } = rgba(id);
      const [cw, ch] = meta.cell;
      expect([png.width, png.height], id).toEqual([cw * 4, ch * 4]);
      expect(meta.anchor[0], `${id} anchor x`).toBeGreaterThan(0);
      expect(meta.anchor[0], `${id} anchor x`).toBeLessThan(cw);
      expect(meta.anchor[1], `${id} anchor sits on the cell's bottom edge`).toBe(ch);
      const frames = Object.values(meta.anims).flatMap((a) => a.frames);
      expect(frames, `${id} frames`).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
      for (const a of Object.values(meta.anims)) expect(a.fps, `${id} fps`).toBeGreaterThan(0);
    }
  });

  it('puts the same-size head in every cell, with room above it to spare', () => {
    for (const id of KEEPER_IDS) {
      const [cw, ch] = keeperMeta(id).cell;
      const { at } = rgba(id);
      for (let f = 0; f < 16; f++) {
        const ox = (f % 4) * cw, oy = Math.floor(f / 4) * ch;
        // the padding rows above the head are empty, so a taller pose is never clipped
        for (let y = 0; y < 3; y++) {
          for (let x = 0; x < cw; x++) expect(at(ox + x, oy + y)[3], `${id} frame ${f} row ${y}`).toBe(0);
        }
        // and every cell carries a figure, not an empty tile
        let ink = 0;
        for (let y = 4; y < ch; y++) for (let x = 0; x < cw; x++) if (at(ox + x, oy + y)[3] > 0) ink++;
        expect(ink, `${id} frame ${f} has a figure`).toBeGreaterThan(200);
      }
    }
  });

  it('draws every shop that has a counter atlas from it', () => {
    const atlased = new Set(KEEPER_IDS);
    // the bodega is drawn from blocks, so its keeper only has the atlas; the taco shop and the
    // pazar paint rooms that name theirs; the bakkal keeps its painted figure until it is redrawn
    for (const shop of [SHOPS.bodega, SHOPS.tacos, SHOPS.pazar]) {
      expect(atlased, `${shop.id}'s keeper`).toContain(keeperKey(shop.keeper));
    }
    expect(roomMeta('tacos').keeper).toBe('lupe');
    expect(roomMeta('pazar').keeper).toBe('kemal');
    expect(roomMeta('bakkal').keeper).toBeUndefined();
  });
});

// Kemal's pazar is a street cart, not a counter: the room is the waterfront with his own cart
// baked in at the counter line, so his atlas and the room have to meet at exactly that line.
describe('pazar cart', () => {
  const room = roomMeta('pazar');
  const { at } = rgba('pazar');

  it('ships a 384x126 waterfront with the cart below the counter line', () => {
    expect([room.w, room.h]).toEqual([384, 126]);
    expect(room.counterY).toBeGreaterThan(60);
    expect(room.counterY).toBeLessThan(112);
    expect(room.keeperX).toBeGreaterThan(120);
    expect(room.keeperX).toBeLessThan(300);
    // the cart's front boards sit under the counter line: red, board after board
    for (const dy of [4, 10]) {
      const [r, g, b] = at(room.keeperX, room.counterY + dy);
      expect(r, `counter +${dy} is the cart`).toBeGreaterThan(120);
      expect(r, `counter +${dy} is red`).toBeGreaterThan(g + 60);
      expect(r).toBeGreaterThan(b + 60);
    }
    // and the cart is furniture, not sky: the room above it is the pale waterfront
    const above = at(room.keeperX, room.counterY - 30);
    expect(above[0] + above[1] + above[2]).toBeGreaterThan(240);
  });
});

describe('soundtrack URLs', () => {
  it('carry a version so a replaced master is not answered from the year-long asset cache', () => {
    for (const id of Object.keys(THEMES) as (keyof typeof THEMES)[]) {
      const theme = THEMES[id];
      expect(theme.rev).toBeGreaterThanOrEqual(1);
      expect(musicUrl(id)).toBe(`./assets/music/${theme.file}?v=${theme.rev}`);
    }
  });
});
