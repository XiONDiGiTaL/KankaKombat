// Multiplayer acceptance tests: two independent browser contexts (separate storage, separate
// connections) play together through the real UI and the real Node server.
//  1. Dedicated server (server-authoritative): lobby, ready-up, start, fight a boss together.
//  2. Relay (host-authoritative, the GitHub Pages deployment model): street fight, shop
//     purchase validated by the host, disconnect + reconnect with the same token.
import { test, expect, Page, Browser } from '@playwright/test';
import { CHAPTERS } from '../src/shared/data/stages';

const WS = 'ws://localhost:8799';

// The tests walk the real New York street, so the anchors come from the shipped section
// rather than from numbers copied when the street was shorter: the bodega it shops at, the
// camera position the second wave locks to, and the index of the boss arena at the end.
const NY_STREET = CHAPTERS[0].sections[0];
const NY_BOSS = CHAPTERS[0].sections.length - 1;
const BODEGA_X = NY_STREET.shops.find((s) => s.shop === 'bodega')!.x;
const SECOND_WAVE_X = NY_STREET.waves[1].at;

interface Snapshot { phase: string; chapter: number; section: number; bossHp: number | null; players: { pid: string; money: number; bag: string[]; lives: number }[]; enemies: number; camX: number; lockX: number | null; me: { x: number; z: number; st: string } | null }

async function open(browser: Browser, query: string): Promise<{ page: Page; errors: string[] }> {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto('/' + query);
  await page.waitForFunction(() => document.querySelector('#title.show, #select.show'));
  return { page, errors };
}

async function state(page: Page): Promise<Snapshot | null> {
  return page.evaluate(() => {
    const kk = (window as unknown as { __kk: { client: { myId: string; latest(): any } | null } }).__kk;
    const v = kk.client?.latest();
    if (!v) return null;
    const boss = v.ents.find((e: any) => e.id === v.bossId);
    const meP = v.players.find((p: any) => p.pid === kk.client!.myId);
    const me = meP ? v.ents.find((e: any) => e.id === meP.id) : null;
    return {
      phase: v.phase, chapter: v.chapter, section: v.section, bossHp: boss ? boss.hp : null, camX: v.camX, lockX: v.lockX,
      players: v.players.map((p: any) => ({ pid: p.pid, money: p.money, bag: p.bag, lives: p.lives })),
      enemies: v.ents.filter((e: any) => !e.player && e.hp > 0).length,
      me: me ? { x: me.x, z: me.z, st: me.st } : null,
    };
  });
}

async function createRoom(page: Page, ch: number, se: number): Promise<string> {
  await page.click('#title');
  await page.click('[data-go=online]');
  await page.selectOption('#dbg-ch', String(ch));
  await page.selectOption('#dbg-se', String(se));
  await page.click('#create-room');
  await page.waitForFunction(() => /^[A-Z0-9]{5}$/.test(document.getElementById('room-code')!.textContent ?? ''));
  return (await page.textContent('#room-code'))!.trim();
}

async function joinAndStart(host: Page, guest: Page): Promise<void> {
  await guest.click('#join-room');
  await host.waitForFunction(() => document.querySelectorAll('#players li').length === 2, null, { timeout: 20_000 });
  await guest.waitForFunction(() => document.querySelectorAll('#players li').length === 2);
  await guest.click('#ready-btn');
  await host.click('#ready-btn');
  await host.waitForFunction(() => !(document.getElementById('start-btn') as HTMLButtonElement).disabled);
  await host.click('#start-btn');
  for (const p of [host, guest]) await p.waitForFunction(() => (window as any).__kk.client?.status === 'game', null, { timeout: 20_000 });
}

async function waitFor(page: Page, pred: (s: Snapshot) => boolean, timeout = 120_000): Promise<Snapshot> {
  const t0 = Date.now();
  for (;;) {
    const s = await state(page);
    if (s && pred(s)) return s;
    if (Date.now() - t0 > timeout) throw new Error('timed out; last state ' + JSON.stringify(s));
    await page.waitForTimeout(250);
  }
}

test('dedicated server: two browsers join a lobby and defeat a boss together', async ({ browser }) => {
  const q = `?server=${WS}&debug=1&autopilot=1`;
  const A = await open(browser, q);
  const code = await createRoom(A.page, 0, 2);
  const B = await open(browser, `${q}&room=${code}`);
  await expect(B.page.locator('#join-code')).toHaveValue(code);
  await joinAndStart(A.page, B.page);

  // both clients are in the same boss arena with both players
  const a0 = await waitFor(A.page, (s) => s.phase === 'boss');
  const b0 = await waitFor(B.page, (s) => s.phase === 'boss');
  expect(a0.section, 'the last section of the chapter is the boss arena').toBe(NY_BOSS);
  expect(b0.section).toBe(a0.section);
  expect(a0.chapter).toBe(0); expect(b0.chapter).toBe(0);
  expect(a0.bossHp, 'the boss is on the field').not.toBeNull();
  expect(a0.players.length).toBe(2); expect(b0.players.length).toBe(2);
  expect(a0.players.map((p) => p.pid).sort()).toEqual(b0.players.map((p) => p.pid).sort());

  // the bots (driving real inputs in each browser) beat the boss; both clients see the same result
  await waitFor(A.page, (s) => s.phase === 'bossdown' || s.phase === 'chapterclear', 200_000);
  const b1 = await waitFor(B.page, (s) => s.phase === 'bossdown' || s.phase === 'chapterclear', 20_000);
  expect(b1.bossHp === null || b1.bossHp === 0).toBe(true);
  // money is authoritative: both clients agree on every wallet
  await A.page.waitForTimeout(800);
  const sa = (await state(A.page))!, sb = (await state(B.page))!;
  for (const p of sa.players) expect(sb.players.find((x) => x.pid === p.pid)!.money).toBe(p.money);
  expect(sa.players.reduce((n, p) => n + p.money, 0)).toBeGreaterThanOrEqual(120); // the boss purse, once
  expect(A.errors).toEqual([]); expect(B.errors).toEqual([]);
});

test('relay (host-authoritative): street fight, a host-validated purchase, disconnect and reconnect', async ({ browser }) => {
  const q = `?relay=${WS}&debug=1&autopilot=1`;
  const A = await open(browser, q);
  const code = await createRoom(A.page, 0, 0);
  const B = await open(browser, `${q}&room=${code}`);
  await joinAndStart(A.page, B.page);

  // fight through the first two waves together. Wait for the second wave's lock to be lifted:
  // a shop only opens on a free camera, and stopping at the wave's own x proves it is cleared
  // instead of racing the moment just before it spawns.
  await waitFor(A.page, (s) => s.phase === 'play' && s.lockX === null && s.enemies === 0 && s.camX >= SECOND_WAVE_X, 200_000);
  const s1 = (await state(A.page))!;
  const g1 = (await state(B.page))!;
  for (const p of s1.players) expect(g1.players.find((x) => x.pid === p.pid)!.money).toBe(p.money);
  expect(s1.players.reduce((n, p) => n + p.money, 0)).toBeGreaterThan(0);

  // the guest takes over its controls and walks into the bodega (no third wave yet: it starts
  // further down the street, so the walk to the shop stays in the open stretch)
  await B.page.evaluate(() => { (window as any).__kk.autopilot = null; });
  await A.page.evaluate(() => { (window as any).__kk.autopilot = null; });
  const keys: Record<string, string> = { L: 'ArrowLeft', R: 'ArrowRight', U: 'ArrowUp', D: 'ArrowDown' };
  const t0 = Date.now();
  let inShop = false;
  while (!inShop && Date.now() - t0 < 60_000) {
    const s = (await state(B.page))!;
    if (!s.me) { await B.page.waitForTimeout(200); continue; }
    const dx = BODEGA_X - s.me.x, dz = 4 - s.me.z;
    if (Math.abs(dx) < 14 && Math.abs(dz) < 8 && ['idle', 'walk', 'run'].includes(s.me.st)) {
      await B.page.keyboard.press('KeyS');
      inShop = await B.page.waitForFunction(() => (window as any).__kk.screen === 'shop', null, { timeout: 2_000 }).then(() => true, () => false);
      continue;
    }
    const hold: string[] = [];
    if (Math.abs(dx) >= 10) hold.push(dx > 0 ? keys.R : keys.L);
    if (Math.abs(dz) >= 6) hold.push(dz > 0 ? keys.D : keys.U);
    for (const k of hold) await B.page.keyboard.down(k);
    await B.page.waitForTimeout(Math.abs(dx) > 60 ? 250 : 90);
    for (const k of hold) await B.page.keyboard.up(k);
  }
  expect(inShop, 'guest reached the shop: ' + JSON.stringify(await state(B.page))).toBe(true);
  const before = (await state(B.page))!;
  const myPid = await B.page.evaluate(() => (window as any).__kk.client.myId as string);
  const mine = before.players.find((p) => p.pid === myPid)!;
  // bananas ($40) are the second item; press "buy" twice fast: only one may go through
  await B.page.keyboard.press('ArrowDown');
  await B.page.waitForTimeout(100);
  await B.page.keyboard.press('KeyZ');
  await B.page.keyboard.press('KeyZ');
  await B.page.waitForTimeout(1200);
  const after = (await state(B.page))!;
  const mineAfter = after.players.find((p) => p.pid === myPid)!;
  if (mine.money >= 40) {
    expect(mineAfter.money).toBe(mine.money - 40);
    expect(mineAfter.bag).toEqual([...mine.bag, 'banana']);
  } else {
    expect(mineAfter.money).toBe(mine.money); // rejected by the host
    await expect.poll(() => B.page.evaluate(() => (window as any).__kk.shopMsg)).toContain('NOT ENOUGH');
  }
  // the host (authority) sees exactly the same wallet and bag
  await A.page.waitForTimeout(500);
  const hostView = (await state(A.page))!.players.find((p) => p.pid === myPid)!;
  expect(hostView.money).toBe(mineAfter.money);
  expect(hostView.bag).toEqual(mineAfter.bag);
  await B.page.keyboard.press('KeyS');
  await B.page.waitForFunction(() => (window as any).__kk.screen !== 'shop');

  // disconnect: the host keeps playing alone
  await B.page.reload();
  await A.page.waitForFunction(() => (window as any).__kk.client.latest().players.length === 1, null, { timeout: 20_000 });
  // reconnect from the same tab (same session token): the same player comes back with its wallet and bag
  await B.page.waitForFunction(() => document.querySelector('#select.show'));
  await B.page.click('#join-room');
  await A.page.waitForFunction(() => (window as any).__kk.client.latest().players.length === 2, null, { timeout: 20_000 });
  await B.page.waitForFunction(() => (window as any).__kk.client?.status === 'game', null, { timeout: 20_000 });
  const back = (await waitFor(B.page, (s) => s.players.length === 2, 10_000)).players.find((p) => p.pid === myPid)!;
  expect(back.money).toBe(mineAfter.money);
  expect(back.bag).toEqual(mineAfter.bag);
  expect(A.errors).toEqual([]);
  expect(B.errors.filter((e) => !/WebSocket|ERR_/.test(e))).toEqual([]);
});

test('joining a room that does not exist gives a clear error', async ({ browser }) => {
  const B = await open(browser, `?server=${WS}&room=ZZZZZ`);
  await B.page.click('#join-room');
  await expect(B.page.locator('#toast')).toContainText(/Room not found/i, { timeout: 10_000 });
});
