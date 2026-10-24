// Fighter select is a plain cycle: every fighter is a stop on one card, LEFT/RIGHT walk it
// both ways, and the fighter on the card is the one FIGHT! starts. The old screen hid two
// fighters behind the other two - UP on a card swapped it to its secret and nothing swapped
// it back, so a revealed card (and a saved pick) could strand the player on it. These tests
// pin down that the roster can always be walked off any fighter, in either direction.
import { test, expect, Page } from '@playwright/test';

const NAMES = ['B.T.', 'S.C.', 'OZZI', 'AYNUR'];

function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

async function toSelect(page: Page): Promise<void> {
  await page.waitForFunction(() => document.querySelector('#title.show'));
  await page.click('#title');
  await page.click('[data-go=solo]');
  await page.waitForFunction(() => document.querySelector('#select.show'));
}

async function openSelect(page: Page): Promise<string[]> {
  const errors = watch(page);
  await page.goto('/?debug=1');
  await toSelect(page);
  return errors;
}

/** The name on the hero card, trimmed. */
const shown = async (page: Page) => ((await page.textContent('#cards .card h3')) ?? '').trim();

test('the roster cycles through all four fighters, both ways', async ({ page }) => {
  const errors = await openSelect(page);
  expect(await shown(page)).toBe('B.T.');

  const seen: string[] = [];
  for (let i = 0; i < 4; i++) {
    seen.push(await shown(page));
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(60);
  }
  expect(seen, 'every fighter is a stop, and the fourth press wraps').toEqual(NAMES);
  expect(await shown(page), 'wrapped back to the first').toBe('B.T.');

  // LEFT steps back the other way, so nothing is one-way
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(60);
  expect(await shown(page)).toBe('AYNUR');

  // the peek tiles name their neighbour and step toward it
  expect((await page.textContent('#peek-prev .nm'))?.trim()).toBe('OZZI');
  expect((await page.textContent('#peek-next .nm'))?.trim()).toBe('B.T.');
  await page.click('#peek-next');
  await page.waitForTimeout(60);
  expect(await shown(page)).toBe('B.T.');

  // the rail jumps straight to a fighter and marks exactly one as current
  await page.click('#rail .rtab[data-tab="ozzi"]');
  await page.waitForTimeout(60);
  expect(await shown(page)).toBe('OZZI');
  expect(await page.$$eval('#rail .rtab.on', (els) => els.map((e) => (e.textContent ?? '').trim()))).toEqual(['OZZI']);

  expect(errors).toEqual([]);
});

test('steps off Aynur back to B.T. and starts the fight as B.T.', async ({ page }) => {
  const errors = await openSelect(page);
  // the reported trap: B.T.'s card became Aynur and could not be changed back
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(60);
  expect(await shown(page)).toBe('AYNUR');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(60);
  expect(await shown(page)).toBe('B.T.');

  await page.click('#solo-start');
  await page.waitForFunction(() => (window as any).__kk?.client?.latest()?.players?.length > 0, null, { timeout: 20_000 });
  const armed = await page.evaluate(() => {
    const kk = (window as any).__kk;
    const v = kk.client.latest();
    const me = v.players.find((p: any) => p.pid === kk.client.myId);
    const ent = v.ents.find((e: any) => e.id === me?.id);
    return { picked: kk.fighter, playerFighter: me?.fighter, def: ent?.def };
  });
  expect(armed.picked).toBe('bt');
  expect(armed.playerFighter, 'the lobby pick the sim received').toBe('bt');
  expect(armed.def, 'the body on the street').toBe('bt');
  expect(errors).toEqual([]);
});

test('every fighter on the roster can start a solo run', async ({ page }) => {
  const errors = watch(page);
  for (const id of ['bt', 'sc', 'ozzi', 'aynur']) {
    await page.goto('/?debug=1');
    await toSelect(page);
    await page.click(`#rail .rtab[data-tab="${id}"]`);
    await page.waitForTimeout(60);
    await page.click('#solo-start');
    await page.waitForFunction(() => (window as any).__kk?.client?.latest()?.players?.length > 0, null, { timeout: 20_000 });
    const armed = await page.evaluate(() => {
      const kk = (window as any).__kk;
      const v = kk.client.latest();
      const me = v.players.find((p: any) => p.pid === kk.client.myId);
      const ent = v.ents.find((e: any) => e.id === me?.id);
      return { playerFighter: me?.fighter, def: ent?.def, hp: ent?.maxHp };
    });
    expect(armed.playerFighter, `${id} pick`).toBe(id);
    expect(armed.def, `${id} body on the street`).toBe(id);
    expect(armed.hp, `${id} health`).toBeGreaterThan(90);
  }
  expect(errors).toEqual([]);
});

test('a saved pick from before still loads and can be cycled off', async ({ page }) => {
  const errors = watch(page);
  // the stale save that used to open the menu on Ozzi with no way back. It has to be in place
  // before the app boots, because boot writes the settings it loaded straight back out.
  await page.addInitScript(() => {
    if (!localStorage.getItem('kankakombat.settings.v1')) {
      localStorage.setItem('kankakombat.settings.v1', JSON.stringify({ fighter: 'ozzi' }));
    }
  });
  await page.goto('/?debug=1');
  await toSelect(page);
  expect(await shown(page), 'the saved fighter is the card that opens').toBe('OZZI');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(60);
  expect(await shown(page)).toBe('AYNUR');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(60);
  expect(await shown(page)).toBe('B.T.');
  // and the choice persists, so a refresh opens on B.T. again
  await page.reload();
  await toSelect(page);
  expect(await shown(page)).toBe('B.T.');
  expect(errors).toEqual([]);
});
