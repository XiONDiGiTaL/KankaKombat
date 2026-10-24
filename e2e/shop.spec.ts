// Lupe's taco shop is the first shop painted from imported art instead of assembled from
// rectangles, so the check is literal: walk into it and compare the game canvas with the
// shipped room image. A regression that drops back to the drawn interior, or that fails to
// load the art, fails on the pixels.
import { test, expect, Page } from '@playwright/test';

interface Pos { x: number; z: number; screen: string }

async function startAt(page: Page, ch: number, se: number): Promise<void> {
  await page.goto('/?debug=1');
  await page.waitForFunction(() => document.querySelector('#title.show'));
  await page.click('#title');
  await page.click('[data-go=solo]');
  await page.selectOption('#dbg-ch', String(ch));
  // the section select is reset by its own change handler, so set it on the element itself
  await page.evaluate((s) => {
    const el = document.getElementById('dbg-se') as HTMLSelectElement;
    el.value = String(s);
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }, se);
  await page.click('#solo-start');
  await page.waitForFunction(() => (window as any).__kk?.client?.status === 'game', null, { timeout: 20_000 });
}

async function walkInto(page: Page, shopX: number): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < 40_000) {
    const s = await page.evaluate<Pos | null>(() => {
      const kk = (window as any).__kk;
      const v = kk.client?.latest();
      if (!v) return null;
      const meP = v.players.find((p: any) => p.pid === kk.client.myId);
      const me = meP && v.ents.find((e: any) => e.id === meP.id);
      return me ? { x: me.x, z: me.z, screen: kk.screen } : null;
    });
    if (!s) { await page.waitForTimeout(100); continue; }
    if (s.screen === 'shop') return;
    // stand at the door: the sim opens a shop only within 24 px of its spot and z < 16
    if (Math.abs(shopX - s.x) < 10 && Math.abs(4 - s.z) < 8) {
      await page.keyboard.press('KeyS');
      await page.waitForTimeout(150);
      continue;
    }
    const hold: string[] = [];
    if (Math.abs(shopX - s.x) >= 8) hold.push(shopX > s.x ? 'ArrowRight' : 'ArrowLeft');
    if (Math.abs(4 - s.z) >= 5) hold.push(4 > s.z ? 'ArrowDown' : 'ArrowUp');
    for (const k of hold) await page.keyboard.down(k);
    await page.waitForTimeout(Math.abs(shopX - s.x) > 60 ? 180 : 70);
    for (const k of hold) await page.keyboard.up(k);
  }
  throw new Error('could not walk into the shop');
}

test('Hüsnü\'s bakkal paints the supplied room with him behind the counter', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await startAt(page, 1, 1);              // İzmir, Kordon Çarşı: peaceful, bakkal at x=362
  await walkInto(page, 362);
  await expect(page.evaluate(() => (window as any).__kk.screen)).resolves.toBe('shop');

  const px = await page.evaluate(async () => {
    const img = new Image();
    img.src = './assets/shops/bakkal.png';
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = 384; cv.height = 126;
    cv.getContext('2d')!.drawImage(img, 0, 0);
    const ref = cv.getContext('2d')!.getImageData(0, 0, 384, 126).data;
    const game = (document.getElementById('screen') as HTMLCanvasElement).getContext('2d')!
      .getImageData(0, 0, 384, 216).data;
    const at = (d: Uint8ClampedArray, x: number, y: number) => {
      const i = (y * 384 + x) * 4;
      return [d[i], d[i + 1], d[i + 2]];
    };
    const dist = (x: number, y: number) => {
      const a = at(game, x, y), b = at(ref, x, y);
      return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    };
    return {
      // the greeting bubble sits over the top of the room, so sample below it
      room: [[4, 44], [150, 44], [330, 64], [300, 110], [234, 100]].map(([x, y]) => dist(x, y)),
      menu: at(game, 5, 130),
    };
  });

  for (const d of px.room) expect(d).toBeLessThan(20);
  expect(px.menu).toEqual([0xf6, 0xe8, 0xb8]);
  expect(errors).toEqual([]);
});

test('Lupe\'s counter is the painted room with her own keeper art', async ({ page }) => {
  const errors: string[] = [];
  const warned: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
    if (m.type() === 'warning' && m.text().includes('[font]')) warned.push(m.text());
  });

  await startAt(page, 3, 1);              // Tampa, Bayshore Promenade: peaceful, shop at x=208
  await walkInto(page, 208);
  await expect(page.evaluate(() => (window as any).__kk.screen)).resolves.toBe('shop');

  const px = await page.evaluate(async () => {
    const img = new Image();
    img.src = './assets/shops/tacos.png';
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = 384; cv.height = 126;
    const rc = cv.getContext('2d')!;
    rc.drawImage(img, 0, 0);
    const ref = rc.getImageData(0, 0, 384, 126).data;
    const game = (document.getElementById('screen') as HTMLCanvasElement).getContext('2d')!
      .getImageData(0, 0, 384, 216).data;
    const at = (d: Uint8ClampedArray, x: number, y: number) => {
      const i = (y * 384 + x) * 4;
      return [d[i], d[i + 1], d[i + 2]];
    };
    const dist = (x: number, y: number) => {
      const a = at(game, x, y), b = at(ref, x, y);
      return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    };
    // the chalk board is painted by the renderer, not the room: count its glyph pixels
    const meta = await fetch('./assets/shops/tacos.json').then((r) => r.json());
    const [bx, by, bw, bh] = meta.board ?? [0, 0, 0, 0];
    let chalk = 0;
    let priceChalk = 0;
    const isChalk = (x: number, y: number) => {
      const [r, g, b] = at(game, x, y);
      return r === 0xe9 && g === 0xe0 && b === 0xb6;
    };
    for (let y = by; y < by + bh; y++) {
      for (let x = bx; x < bx + bw; x++) {
        if (!isChalk(x, y)) continue;
        chalk++;
        // the price column sits at the slate's right edge, under the header
        if (x >= bx + bw - 24 && y >= by + 14) priceChalk++;
      }
    }
    return {
      // room only, below her two-line greeting bubble: shelves, counter front, wall
      room: [[4, 40], [150, 44], [180, 96], [330, 60], [300, 108]].map(([x, y]) => dist(x, y)),
      // her torso, which the room does not paint: must differ from the art underneath
      keeper: dist(272, 55),
      // the cream menu panel still starts under the room, unchanged
      menu: at(game, 5, 130),
      chalk,
      priceChalk,
    };
  });

  for (const d of px.room) expect(d).toBeLessThan(20);
  expect(px.keeper).toBeGreaterThan(60);
  expect(px.menu).toEqual([0xf6, 0xe8, 0xb8]);
  expect(px.chalk, 'the board is chalked with real glyphs').toBeGreaterThan(80);
  expect(px.priceChalk, 'the prices are chalked in their own column').toBeGreaterThan(20);
  expect(warned, 'every chalked character has a glyph').toEqual([]);
  expect(errors).toEqual([]);
});

// The counter drop gives the shops that never had a painted room a keeper drawn from his own
// sheet: Marcos works the block-built bodega, and Kemal's cart is baked into the pazar room he
// sells from. Both are checked on the canvas, because a missing atlas silently falls back to
// the little block figure and nothing errors.
test('Marcos works the bodega counter from his own atlas', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await startAt(page, 0, 2);              // New York, Flatbush Plaza: peaceful, bodega at x=707
  await walkInto(page, 707);
  await expect(page.evaluate(() => (window as any).__kk.screen)).resolves.toBe('shop');

  const px = await page.evaluate(async () => {
    const img = new Image();
    img.src = './assets/shops/marcos.png';
    await img.decode();
    const meta = await fetch('./assets/shops/marcos.json').then((r) => r.json());
    const [cw, ch] = meta.cell;
    const [ax, ay] = meta.anchor;
    const atlas = document.createElement('canvas');
    atlas.width = img.width; atlas.height = img.height;
    atlas.getContext('2d')!.drawImage(img, 0, 0);
    const ap = atlas.getContext('2d')!.getImageData(0, 0, img.width, img.height).data;
    const canvas = document.getElementById('screen') as HTMLCanvasElement;
    const read = () => canvas.getContext('2d')!.getImageData(0, 0, 384, 216).data;
    const at = (d: Uint8ClampedArray, x: number, y: number) => {
      const i = (y * 384 + x) * 4;
      return [d[i], d[i + 1], d[i + 2]];
    };
    // where the renderer puts his cell: anchor on the counter's top board, x at the counter
    const left = 250 - ax, top = 98 - ay;
    // The greet row animates, so his cap bobs a pixel or two between frames: compare the
    // brightest cap pixel in a small window instead of one fixed pixel, which would land on
    // the cap's shadow in one frame and on its rim light in the next.
    const peak = (d: Uint8ClampedArray, x0: number, y0: number, w: number) => {
      let best = [0, 0, 0];
      for (let y = y0 - 2; y <= y0 + 2; y++) for (let x = x0 - 2; x <= x0 + 2; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 2] > best[2]) best = [d[i], d[i + 1], d[i + 2]];
      }
      return best;
    };
    const head = peak(read(), 250, top + 9, 384);  // his cap, in every row of the sheet
    // the greeting row plays first, so two samples a beat apart must differ
    const before = read();
    await new Promise((r) => setTimeout(r, 260));
    const after = read();
    let changed = 0;
    for (let y = top + 4; y < 98; y++) for (let x = left; x < left + cw; x++) {
      const i = (y * 384 + x) * 4;
      if (Math.abs(before[i] - after[i]) + Math.abs(before[i + 1] - after[i + 1]) > 30) changed++;
    }
    // the same window of the shipped atlas itself, for the cap colour to be compared against
    const atlasCap = peak(ap, ax, 9, img.width);
    return {
      head,
      atlasCap,
      changed,
      counter: at(read(), 160, 110),       // the drawn counter front is still the room's
      menu: at(read(), 5, 130),
      cell: [cw, ch],
    };
  });

  // his blue cap, not the block figure's skin and hair: blue-dominant and from the atlas
  expect(px.head[2]).toBeGreaterThan(110);
  expect(px.head[2]).toBeGreaterThan(px.head[0] + 60);
  expect(px.atlasCap[2]).toBeGreaterThan(110);
  expect(Math.abs(px.head[2] - px.atlasCap[2])).toBeLessThanOrEqual(45);
  expect(px.cell[1]).toBe(45);             // 40 px of bust + the headroom padding
  expect(px.changed, 'the atlas animates').toBeGreaterThan(40);
  expect(px.counter).toEqual([0x7a, 0x2a, 0x22]);
  expect(px.menu).toEqual([0xf6, 0xe8, 0xb8]);
  expect(errors).toEqual([]);
});

test('Kemal sells from his own cart on the pazar waterfront', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  await startAt(page, 2, 1);              // İstanbul, Kadıköy Meydanı: peaceful, pazar at x=45
  await walkInto(page, 45);
  await expect(page.evaluate(() => (window as any).__kk.screen)).resolves.toBe('shop');

  const px = await page.evaluate(async () => {
    const img = new Image();
    img.src = './assets/shops/pazar.png';
    await img.decode();
    const cv = document.createElement('canvas');
    cv.width = 384; cv.height = 126;
    cv.getContext('2d')!.drawImage(img, 0, 0);
    const ref = cv.getContext('2d')!.getImageData(0, 0, 384, 126).data;
    const meta = await fetch('./assets/shops/pazar.json').then((r) => r.json());
    const game = (document.getElementById('screen') as HTMLCanvasElement).getContext('2d')!
      .getImageData(0, 0, 384, 216).data;
    const at = (d: Uint8ClampedArray, x: number, y: number) => {
      const i = (y * 384 + x) * 4;
      return [d[i], d[i + 1], d[i + 2]];
    };
    const dist = (x: number, y: number) => {
      const a = at(game, x, y), b = at(ref, x, y);
      return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
    };
    return {
      // the waterfront around the cart, away from the bubble, the keeper and the hero
      room: [[30, 110], [330, 40], [100, 40], [350, 100], [300, 20], [370, 120]].map(([x, y]) => dist(x, y)),
      // his cart's front boards, painted into the room under the counter line
      cart: at(game, meta.keeperX, meta.counterY + 10),
      // his flat cap and face, which the room does not paint
      cap: at(game, meta.keeperX, meta.counterY - 42),
      face: dist(meta.keeperX + 4, meta.counterY - 28),
      menu: at(game, 5, 130),
    };
  });

  for (const d of px.room) expect(d).toBeLessThan(20);
  expect(px.cart[0]).toBeGreaterThan(140);           // the cart is red...
  expect(px.cart[0]).toBeGreaterThan(px.cart[1] + 80);
  expect(px.cap[0] + px.cap[1] + px.cap[2]).toBeLessThan(200);   // ...and he wears his black cap
  expect(px.face, 'Kemal stands over his cart').toBeGreaterThan(60);
  expect(px.menu).toEqual([0xf6, 0xe8, 0xb8]);
  expect(errors).toEqual([]);
});
