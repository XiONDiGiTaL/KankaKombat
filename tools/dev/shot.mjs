// Dev: open the game in headless Chromium, run some steps, take screenshots, print console errors.
// usage: node tools/dev/shot.mjs <url> <outprefix> [actions-json]
import { chromium } from '@playwright/test';
const [url, out, actionsJson] = process.argv.slice(2);
const actions = actionsJson ? JSON.parse(actionsJson) : [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage({ viewport: { width: 1152, height: 700 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.type() + ': ' + m.text()); });
page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
await page.goto(url);
await page.waitForTimeout(1500);
let n = 0;
for (const a of actions) {
  if (a.wait) await page.waitForTimeout(a.wait);
  if (a.press) await page.keyboard.press(a.press);
  if (a.down) await page.keyboard.down(a.down);
  if (a.up) await page.keyboard.up(a.up);
  if (a.click) await page.click(a.click);
  if (a.fill) await page.fill(a.fill[0], a.fill[1]);
  if (a.eval) console.log('eval:', JSON.stringify(await page.evaluate(a.eval)));
  if (a.shot) { await page.screenshot({ path: `${out}-${a.shot}.png` }); n++; }
  if (a.canvas) { const b64 = await page.evaluate(() => document.getElementById('screen').toDataURL()); const fs = await import('node:fs'); fs.writeFileSync(`${out}-${a.canvas}.png`, Buffer.from(b64.split(',')[1], 'base64')); }
}
console.log('errors:', errors.length ? errors.join('\n') : 'none');
await browser.close();
