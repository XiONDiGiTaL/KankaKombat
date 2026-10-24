// Grab, throw and combo have to work from the real input layer, not only inside the
// simulation: these drive the built app in the practice room with the shipped keyboard
// bindings and with a synthetic standard-mapping pad, and read the outcome back off the
// authoritative snapshots. The room's dummy stands still on its mark, so nothing here
// depends on an enemy's AI rolling the right way.
//
// Both tests walk the player from the starting mat (x 150) into the dummy's reach (x 300)
// before pressing anything, because a grab that lands out of range proves nothing.
import { test, expect, Page } from '@playwright/test';

interface Look {
  x: number;
  st: string;
  atk: string | null;
  dummy: string | null;
  dummyX: number;
  chain: number;
}

/** The local body, the dummy and the HUD combo count, straight from the client snapshot. */
const look = (page: Page) => page.evaluate((): Look | null => {
  const kk = (window as any).__kk;
  const v = kk?.client?.latest();
  if (!v) return null;
  const me = v.players.find((p: any) => p.pid === kk.client.myId);
  const body = v.ents.find((e: any) => e.id === me?.id);
  const dummy = v.ents.find((e: any) => e.def === 'dummy');
  return {
    x: body?.x ?? -1,
    st: body?.st ?? '',
    atk: body?.atk ?? null,
    dummy: dummy?.st ?? null,
    dummyX: dummy?.x ?? -1,
    chain: kk.renderer.combos.get(me?.id)?.n ?? 0,
  };
});

function watch(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  return errors;
}

/** Title → select → B.T. → the Dragon's Den gym, on a live street. */
async function startTraining(page: Page): Promise<void> {
  await page.waitForFunction(() => document.querySelector('#title.show'));
  await page.click('#title');
  await page.click('[data-go=solo]');
  await page.waitForFunction(() => document.querySelector('#select.show'));
  await page.click('#rail .rtab[data-tab="bt"]');
  await page.click('#training-start');
  await page.waitForFunction(() => {
    const v = (window as any).__kk?.client?.latest();
    return v?.training === true && v.phase === 'play';
  }, null, { timeout: 20_000 });
  await page.waitForFunction(() => (window as any).__kk.screen === 'none');
}

/** Hold a direction until the body is a step short of the dummy, then let go. */
async function walkIntoReach(page: Page, hold: () => Promise<void>, release: () => Promise<void>): Promise<number> {
  await hold();
  await page.waitForFunction(() => {
    const kk = (window as any).__kk;
    const v = kk?.client?.latest();
    const me = v?.players.find((p: any) => p.pid === kk.client.myId);
    const body = v?.ents.find((e: any) => e.id === me?.id);
    const dummy = v?.ents.find((e: any) => e.def === 'dummy');
    return !!body && !!dummy && body.x >= dummy.x - 22;
  }, null, { timeout: 10_000 });
  await release();
  const now = await look(page);
  return now?.x ?? -1;
}

/** Record every attack the body performs, sampled faster than a chain step lasts. */
async function startRecording(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as any;
    w.__seen = [];
    clearInterval(w.__seenTimer);
    w.__seenTimer = setInterval(() => {
      const kk = w.__kk;
      const v = kk?.client?.latest();
      const me = v?.players.find((p: any) => p.pid === kk.client.myId);
      const body = v?.ents.find((e: any) => e.id === me?.id);
      if (body?.atk && !w.__seen.includes(body.atk)) w.__seen.push(body.atk);
    }, 20);
  });
}

async function stopRecording(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const w = window as any;
    clearInterval(w.__seenTimer);
    return w.__seen as string[];
  });
}

/** Wait for the local body to hold a state for a moment (dodge and jump are short). */
async function bodyIs(page: Page, states: string[], timeout = 2_000): Promise<void> {
  await page.waitForFunction((want) => {
    const kk = (window as any).__kk;
    const v = kk?.client?.latest();
    const me = v?.players.find((p: any) => p.pid === kk.client.myId);
    const body = v?.ents.find((e: any) => e.id === me?.id);
    return !!body && (want as string[]).includes(body.st);
  }, states, { timeout });
}

/** Waits for the body to be free again, so the next action is not swallowed. */
async function settled(page: Page): Promise<void> {
  await bodyIs(page, ['idle', 'walk', 'run'], 3_000);
}

/** The dummy back on its mark and out of the invulnerable window the respawn grants it.
 *  Swinging during that window looks identical on screen but lands nothing, so the combo
 *  count would stay at zero. */
async function dummyReady(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const d = (window as any).__kk.client.latest().ents.find((e: any) => e.def === 'dummy');
    return !!d && d.st === 'idle' && Math.abs(d.x - 300) < 1 && (d.flags & 1) === 0;
  }, null, { timeout: 12_000 });
}

/** The HUD chain counter, waited for rather than sampled once: the count only exists from
 *  the second landed hit, and the window is a second long. */
async function chainAtLeast(page: Page, n: number): Promise<number> {
  await page.waitForFunction((want) => {
    const kk = (window as any).__kk;
    const v = kk.client.latest();
    const me = v.players.find((p: any) => p.pid === kk.client.myId);
    return (kk.renderer.combos.get(me?.id)?.n ?? 0) >= (want as number);
  }, n, { timeout: 2_000 });
  return ((await look(page))?.chain ?? 0);
}

test('keyboard: jump, dodge and block answer on their shipped keys', async ({ page }) => {
  const errors = watch(page);
  await page.goto('/?debug=1');
  await startTraining(page);

  await page.keyboard.press('a');
  await bodyIs(page, ['jump']);
  await settled(page);

  await page.keyboard.press('d');
  await bodyIs(page, ['dodge']);
  await settled(page);

  await page.keyboard.down('c');
  await bodyIs(page, ['block']);
  await page.keyboard.up('c');
  await settled(page);
  expect(errors).toEqual([]);
});

test('keyboard: walk in, grab, throw and chain the light combo on the practice dummy', async ({ page }) => {
  const errors = watch(page);
  await page.goto('/?debug=1');
  await startTraining(page);

  const x = await walkIntoReach(
    page,
    () => page.keyboard.down('ArrowRight'),
    () => page.keyboard.up('ArrowRight'),
  );
  expect(x, 'walked up to the dummy').toBeGreaterThan(270);

  // S is GRAB: the clinch takes hold of the dummy
  await page.keyboard.press('s');
  await page.waitForFunction(() => (window as any).__kk.client.latest().ents.some((e: any) => e.def === 'dummy' && e.st === 'held'), null, { timeout: 3_000 });
  expect((await look(page))?.st).toBe('hold');

  // X is HEAVY: while holding, that is the throw. The dummy leaves the clinch and is flung.
  await page.keyboard.press('x');
  await page.waitForFunction(() => {
    const v = (window as any).__kk.client.latest();
    const d = v.ents.find((e: any) => e.def === 'dummy');
    return !!d && ['thrown', 'knock', 'down'].includes(d.st);
  }, null, { timeout: 4_000 });
  const thrown = (await look(page))!;
  expect(thrown.dummyX, 'the throw moved the dummy off its mark').not.toBe(300);

  // it stands back up on its mark, which is where the combo is landed
  await dummyReady(page);

  // Z chains light 1 → 4 while each press lands inside the previous recovery
  await startRecording(page);
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('z');
    await page.waitForTimeout(130);
  }
  const chain = await chainAtLeast(page, 2);
  const seen = await stopRecording(page);
  expect(seen, 'the light chain ran its four links').toEqual(expect.arrayContaining(['bt_l1', 'bt_l2', 'bt_l3', 'bt_l4']));
  expect(chain, 'the HUD counts the landed chain').toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});

test('controller: the standard pad walks, grabs, throws and combos with no keyboard', async ({ page }) => {
  const errors = watch(page);
  // A standard-mapping pad the page can drive: 17 buttons and two sticks, exactly what the
  // input layer reads through navigator.getGamepads().
  await page.addInitScript(() => {
    const state = {
      buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
      axes: [0, 0, 0, 0],
    };
    (window as any).__pad = {
      press(i: number) {
        state.buttons[i] = { pressed: true, value: 1 };
      },
      idle() {
        state.buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
      },
    };
    const pad = {
      id: 'Test Pad (STANDARD GAMEPAD)',
      index: 0,
      connected: true,
      mapping: 'standard',
      timestamp: 0,
      get buttons() { return state.buttons; },
      get axes() { return state.axes; },
    };
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => [pad] });
  });

  await page.goto('/?debug=1');
  await startTraining(page);

  // standard mapping: A=0 jump, B=1 grab, X=2 light, Y=3 heavy, LB=4 dodge, RB=5 block, d-pad=12..15
  const D = { A: 0, B: 1, X: 2, Y: 3, RIGHT: 15 };
  const hold = (i: number) => page.evaluate((b) => (window as any).__pad.press(b), i);
  const release = () => page.evaluate(() => (window as any).__pad.idle());
  /** One pad press, held long enough for the 60 Hz sampler to see an edge and released
   *  for long enough to arm the next one. */
  const tap = async (i: number, holdMs = 110, gapMs = 110) => {
    await hold(i);
    await page.waitForTimeout(holdMs);
    await release();
    await page.waitForTimeout(gapMs);
  };

  // d-pad right walks; releasing the d-pad leaves the body on its feet, not stuck walking
  const x = await walkIntoReach(page, () => hold(D.RIGHT), release);
  expect(x, 'the pad walked the body into reach').toBeGreaterThan(270);
  // releasing the d-pad settles the body instead of leaving it stuck walking
  await page.waitForFunction(() => {
    const kk = (window as any).__kk;
    const v = kk.client.latest();
    const me = v.players.find((p: any) => p.pid === kk.client.myId);
    const body = v.ents.find((e: any) => e.id === me?.id);
    return !!body && body.st !== 'walk' && body.st !== 'run';
  }, null, { timeout: 2_000 });

  // B is GRAB
  await tap(D.B);
  await page.waitForFunction(() => (window as any).__kk.client.latest().ents.some((e: any) => e.def === 'dummy' && e.st === 'held'), null, { timeout: 3_000 });
  expect((await look(page))?.st).toBe('hold');

  // Y is HEAVY, which is the throw inside a clinch
  await tap(D.Y);
  await page.waitForFunction(() => {
    const d = (window as any).__kk.client.latest().ents.find((e: any) => e.def === 'dummy');
    return !!d && ['thrown', 'knock', 'down'].includes(d.st);
  }, null, { timeout: 4_000 });

  await dummyReady(page);

  // X is LIGHT: four pad presses chain the same four-hit string
  await startRecording(page);
  // press inside the previous recovery, like a player drumming the button (the keyboard
  // test uses the same 120 ms cadence)
  for (let i = 0; i < 4; i++) await tap(D.X, 60, 60);
  const chain = await chainAtLeast(page, 2);
  const seen = await stopRecording(page);
  expect(seen, 'the pad drove the whole light chain').toEqual(expect.arrayContaining(['bt_l1', 'bt_l2', 'bt_l3', 'bt_l4']));
  expect(chain, 'the HUD counts the pad-driven chain').toBeGreaterThanOrEqual(2);

  // the rest of the pad's gameplay buttons: A jumps, LB dodges, RB blocks while held.
  // The chain's last link has to finish recovering first, or the jump press lands while
  // the body is still busy (jump is not one of the buffered actions).
  await settled(page);
  await tap(D.A);
  await bodyIs(page, ['jump']);
  await settled(page);

  await tap(4);
  await bodyIs(page, ['dodge']);
  await settled(page);

  await hold(5);
  await bodyIs(page, ['block']);
  await release();
  await settled(page);
  expect(errors).toEqual([]);
});
