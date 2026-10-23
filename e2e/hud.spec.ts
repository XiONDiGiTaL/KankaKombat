// HUD / menu acceptance tests: one key press must be one action, and the first-street
// control card can be dismissed by hand. Both run against the built app and the real server,
// but solo play stays local, so no room or second client is involved.
//
// The pause loop these cover was reported from play: Enter on RESUME closed the menu and
// reopened it in the same press, so the only way out was Escape.
import { test, expect, Page } from '@playwright/test';

interface Kk { screen: string; paused: boolean; legendT: number }

const screenOf = (page: Page) => page.locator('#pause');

async function startSolo(page: Page): Promise<void> {
  await page.goto('/?debug=1');
  await page.click('#title');
  await page.click('[data-go=solo]');
  await page.click('#solo-start');
  await page.waitForFunction(() => (window as unknown as { __kk?: Kk }).__kk?.screen === 'none');
}

test('Enter and Space each toggle the pause once', async ({ page }) => {
  await startSolo(page);

  await page.keyboard.press('Enter');
  await expect(screenOf(page)).toHaveClass(/show/);

  await page.keyboard.press('Enter');
  await expect(screenOf(page)).not.toHaveClass(/show/);
  // a press that leaked into the game would reopen the menu on the next tick
  await page.waitForTimeout(400);
  await expect(screenOf(page)).not.toHaveClass(/show/);
  expect(await page.evaluate(() => (window as unknown as { __kk: Kk }).__kk.paused)).toBe(false);

  await page.keyboard.press('Enter'); // Space and Enter both confirm RESUME
  await expect(screenOf(page)).toHaveClass(/show/);
  await page.keyboard.press(' ');
  await expect(screenOf(page)).not.toHaveClass(/show/);
  await page.waitForTimeout(400);
  await expect(screenOf(page)).not.toHaveClass(/show/);
});

test('the control card closes on its chip and leaves play running', async ({ page }) => {
  await startSolo(page);
  const chip = page.locator('#legend-close');
  await expect(chip).toBeVisible();

  await chip.click();
  await expect(chip).toBeHidden();
  expect(await page.evaluate(() => (window as unknown as { __kk: Kk }).__kk.legendT)).toBe(0);
  expect(await page.evaluate(() => (window as unknown as { __kk: Kk }).__kk.screen)).toBe('none');
});

test('the control card is gone within a few seconds on its own', async ({ page }) => {
  await startSolo(page);
  await expect(page.locator('#legend-close')).toBeVisible();
  // 5.5 s of card plus the 0.75 s tail fade; the old timer held it for over 11 s
  await expect(page.locator('#legend-close')).toBeHidden({ timeout: 9000 });
  expect(await page.evaluate(() => (window as unknown as { __kk: Kk }).__kk.legendT)).toBe(0);
});
