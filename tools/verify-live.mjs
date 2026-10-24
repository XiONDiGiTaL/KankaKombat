// One-pass check of the live GitHub Pages build behind the xiondigital.net domain:
//   1. the legacy /KankaKombat/ path answers a real 301 to /kankakombat/
//   2. hashed assets carry an edge cache policy (and are served by Cloudflare at all)
//   3. the deployed fighter select renders the hero card, its two peeks and the four-tab
//      roster rail, steps between fighters, and loads with no console errors or 404s
//
// Usage: npm run verify:live [-- --url https://xiondigital.net/kankakombat/] [--keep-open]
// Exits 1 when any check fails, so CI (or a pre-ship ritual) can gate on it.
//
// The origin is GitHub Pages, so either the Cloudflare proxy is in front of it or it is not.
// This script reports that difference instead of assuming it: a missing cf-cache-status is a
// failure, not a pass, because a direct-to-Pages response cannot be cached at the edge.

import { chromium } from 'playwright';

const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const LIVE = new URL(arg('--url', 'https://xiondigital.net/kankakombat/'));
const ORIGIN = LIVE.origin;
const LEGACY = new URL('/KankaKombat/', ORIGIN);
const KEEP_OPEN = argv.includes('--keep-open');
const SHOT = '.freebuff/shots/verify-live-select.png';

const results = [];
const record = (name, ok, detail) => {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `\n      ${detail}` : ''}`);
};

// ---------------------------------------------------------------- 1. redirect
async function checkRedirect() {
  let res;
  try {
    res = await fetch(LEGACY, { redirect: 'manual', headers: { 'cache-control': 'no-cache' } });
  } catch (err) {
    record('legacy redirect', false, `${LEGACY.href} threw ${err.message}`);
    return;
  }
  const location = res.headers.get('location') ?? '';
  const isRedirect = res.status === 301 || res.status === 308;
  const target = location ? new URL(location, LEGACY) : null;
  const pointsAtApp = !!target && target.pathname.replace(/\/+$/, '') === '/kankakombat';
  record(
    'legacy redirect',
    isRedirect && pointsAtApp,
    `${LEGACY.pathname} -> ${res.status}${location ? ' ' + location : ' (no Location header)'}` +
      (isRedirect && !pointsAtApp ? ' — redirects somewhere unexpected' : ''),
  );
}

// ---------------------------------------------------------------- 2. edge cache
async function checkCache() {
  let html;
  let page;
  try {
    page = await fetch(LIVE, { headers: { 'cache-control': 'no-cache' } });
    html = await page.text();
  } catch (err) {
    record('edge cache', false, `${LIVE.href} threw ${err.message}`);
    return;
  }
  const server = page.headers.get('server') ?? '(none)';
  const cfRay = page.headers.get('cf-ray');
  const assets = [...html.matchAll(/(?:src|href)="([^"]*\/assets\/[^"]+\.(?:js|css))"/g)].map((m) => m[1]);
  const assetPath = assets[0] ?? null;

  let asset = null;
  if (assetPath) {
    const url = new URL(assetPath, LIVE);
    try {
      asset = { url, res: await fetch(url, { headers: { 'cache-control': 'no-cache' } }) };
    } catch (err) {
      record('edge cache', false, `asset ${url.pathname} threw ${err.message}`);
      return;
    }
  }

  const cacheControl = asset?.res.headers.get('cache-control') ?? '';
  const cfStatus = asset?.res.headers.get('cf-cache-status') ?? '';
  const age = asset?.res.headers.get('age');
  const longLived = /immutable|max-age=(\d{6,})/i.test(cacheControl);
  const behindEdge = !!cfRay || !!cfStatus;

  const detail = [
    `html: server=${server}${cfRay ? ` cf-ray=${cfRay}` : ''}`,
    asset ? `asset ${asset.url.pathname}: cache-control=${cacheControl || '(none)'} cf-cache-status=${cfStatus || '(none)'}${age ? ` age=${age}` : ''}` : 'no hashed asset found in index.html',
  ].join('\n      ');

  record('edge cache', behindEdge && longLived && /HIT|REVALIDATED|MISS/i.test(cfStatus), detail);
}

// ---------------------------------------------------------------- 3. live select
async function checkSelect() {
  const exe = process.env.PW_CHROMIUM || chromium.executablePath();
  let browser;
  try {
    browser = await chromium.launch({ executablePath: exe, args: ['--autoplay-policy=no-user-gesture-required'] });
  } catch (err) {
    record(
      'live fighter select',
      false,
      `could not launch a browser at ${exe}: ${err.message.split('\n')[0]}\n` +
        '      install one with `npx playwright install chromium`, or point PW_CHROMIUM at a Chrome/Edge binary',
    );
    return;
  }
  const errors = [];
  const failed = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', (r) => failed.push(`${r.url()} ${r.failure()?.errorText ?? ''}`.trim()));
    page.on('response', (r) => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}`); });

    const url = new URL(LIVE.href);
    url.searchParams.set('room', arg('--room', 'ABCDE'));
    await page.goto(url.href, { waitUntil: 'load', timeout: 45_000 });
    await page.waitForSelector('#select.show', { timeout: 45_000 });
    await page.waitForTimeout(1200);

    // the select is one hero card cycled by the peeks and the name rail: check the card is
    // painted, the two peeks are painted, the rail marks one current fighter - and that
    // stepping right really lands on a different fighter.
    const info = await page.evaluate(() => {
      const colours = (cv) => {
        if (!(cv instanceof HTMLCanvasElement)) return 0;
        const data = cv.getContext('2d')?.getImageData(0, 0, cv.width, cv.height).data ?? new Uint8Array();
        const seen = new Set();
        for (let i = 0; i < data.length; i += 4 * 37) seen.add(`${data[i]},${data[i + 1]},${data[i + 2]}`);
        return seen.size;
      };
      const card = document.querySelector('#cards .card');
      const cv = card?.querySelector('canvas');
      const peeks = ['peek-prev', 'peek-next'].map((id) => {
        const el = document.getElementById(id);
        const pcv = el?.querySelector('canvas');
        return { fighter: el?.dataset.f ?? '', colours: colours(pcv), cssW: Math.round(pcv?.getBoundingClientRect().width ?? 0) };
      });
      return {
        card: {
          fighter: card?.dataset.f ?? '',
          name: card?.querySelector('h3')?.textContent ?? '',
          canvas: cv instanceof HTMLCanvasElement ? { w: cv.width, h: cv.height } : null,
          colours: colours(cv),
        },
        peeks,
        tabs: document.querySelectorAll('#rail .rtab').length,
        active: document.querySelectorAll('#rail .rtab.on').length,
        shown: document.querySelector('.screen.show')?.id ?? '',
        title: document.title,
      };
    });
    const before = info.card.fighter;
    await page.click('#peek-next');
    await page.waitForTimeout(300);
    const after = await page.evaluate(() => document.querySelector('#cards .card')?.dataset.f ?? '');

    const rendered = !!info.card.canvas && info.card.canvas.w >= 100 && info.card.canvas.h >= 100 && info.card.colours > 8;
    const peeks = info.peeks.every((p) => p.fighter && p.colours > 4);
    const rail = info.tabs === 4 && info.active === 1;
    const cycles = !!before && !!after && after !== before;

    await page.screenshot({ path: SHOT });
    const detail = [
      `screen=${info.shown} card=${info.card.fighter || '?'} ${info.card.name || '(no name)'} ` +
        `${info.card.canvas ? `${info.card.canvas.w}x${info.card.canvas.h}` : 'no canvas'} / ${info.card.colours} colours`,
      `peeks=${info.peeks.map((p) => `${p.fighter || '?'} ${p.colours} colours`).join(', ') || 'none'} ` +
        `rail=${info.tabs} tabs, ${info.active} current; step right: ${before || '?'} -> ${after || '?'}`,
      `screenshot: ${SHOT}`,
      errors.length ? `console errors: ${errors.slice(0, 4).join(' | ')}` : '',
      failed.length ? `failed requests: ${failed.slice(0, 4).join(' | ')}` : '',
    ].filter(Boolean).join('\n      ');

    record('live fighter select', rendered && peeks && rail && cycles && errors.length === 0 && failed.length === 0, detail);
    if (KEEP_OPEN) await page.pause();
  } catch (err) {
    record('live fighter select', false, err.message.split('\n').slice(0, 3).join(' | '));
  } finally {
    await browser.close();
  }
}

console.log(`verifying ${LIVE.href}\n`);
await checkRedirect();
await checkCache();
await checkSelect();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
if (failed.length) {
  console.log('failed: ' + failed.map((r) => r.name).join(', '));
  console.log('Redirect and cache checks need the Cloudflare proxy and rules from docs/cloudflare.md.');
}
process.exit(failed.length ? 1 : 0);
