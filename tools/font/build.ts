// Builds the game's own webfonts from the bitmap glyphs in src/client/render/font.ts.
// The DOM menus use these exact letterforms; no system font is ever used.
// Run with `npm run fonts`.

import { mkdirSync, writeFileSync } from 'node:fs';
import opentype from 'opentype.js';
import { FONT_DATA, parseGlyph } from '../../src/client/render/font';

type Mark = 'cedilla' | 'breve' | 'dot' | 'umlaut' | 'acute' | 'tilde' | 'circumflex';

const UPEM = 1000;
const PX = 100;
const OUT = 'public/fonts';

type Rect = [number, number, number, number]; // x, y, w, h in pixels (top-left origin)

function runRects(rows: string[]): Rect[] {
  const out: Rect[] = [];
  rows.forEach((row, y) => {
    let x = 0;
    while (x < row.length) {
      if (row[x] !== '#') { x++; continue; }
      let w = 1;
      while (x + w < row.length && row[x + w] === '#') w++;
      out.push([x, y, w, 1]);
      x += w;
    }
  });
  return out;
}

/** The composed letters' marks, taken from the same table the canvas draws, so the webfont
 *  and the bitmap text can never disagree. A cedilla hangs below the baseline row. */
function markRects(mark: Mark, wide: boolean, h: number): Rect[] {
  return FONT_DATA.marks(mark, wide).map(([x, y]) => [x, mark === 'cedilla' ? h + y : y, 1, 1] as Rect);
}

function pathFor(rects: Rect[], h: number): opentype.Path {
  const p = new opentype.Path();
  for (const [x, y, w, rh] of rects) {
    const x0 = x * PX, x1 = (x + w) * PX;
    const y1 = (h - y) * PX, y0 = (h - y - rh) * PX;
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.closePath();
  }
  return p;
}

function build(name: string, family: string, kind: 'hud' | 'title', w: number, h: number, adv: number, glyphs: Record<string, string[] | string>): void {
  const all: opentype.Glyph[] = [];
  const seen = new Set<number>();
  all.push(new opentype.Glyph({ name: '.notdef', advanceWidth: adv * PX, path: new opentype.Path() }));

  /** A glyph may serve several codepoints, but a codepoint must map to exactly one glyph:
   *  the cmap writer rejects duplicate ranges (e.g. I -> i and i -> i). */
  const claim = (codes: number[]): number[] => {
    const keep = codes.filter((c) => !seen.has(c));
    keep.forEach((c) => seen.add(c));
    return keep;
  };
  const add = (ch: string, rows: string[]) => {
    const code = ch.codePointAt(0)!;
    const lower = ch.toLowerCase();
    const unicodes = claim(lower !== ch ? [code, lower.codePointAt(0)!] : [code]);
    if (!unicodes.length) return;
    all.push(new opentype.Glyph({
      name: 'uni' + code.toString(16).toUpperCase().padStart(4, '0'),
      unicodes,
      advanceWidth: adv * PX,
      path: pathFor(runRects(rows), h),
    }));
  };

  for (const [ch, data] of Object.entries(glyphs)) {
    if (ch === ' ') continue;
    add(ch, Array.isArray(data) ? data : Array.from({ length: h }, (_, y) => data.slice(y * w, y * w + w).replace(/0/g, '.').replace(/1/g, '#')));
  }
  // space
  all.push(new opentype.Glyph({ name: 'space', unicodes: claim([32]), advanceWidth: adv * PX, path: new opentype.Path() }));

  // composed letters = base letter + mark (Turkish v1 set and the Spanish extension)
  for (const ch of [...Object.keys(FONT_DATA.turkish), ...Object.keys(FONT_DATA.accents)]) {
    const { base, mark } = parseGlyph(ch, kind);
    const src = glyphs[base];
    if (!src || !mark) continue;
    const rows = Array.isArray(src) ? src : Array.from({ length: h }, (_, y) => src.slice(y * w, y * w + w).replace(/0/g, '.').replace(/1/g, '#'));
    const path = pathFor([...runRects(rows), ...markRects(mark, kind === 'title', h)], h);
    const code = ch.codePointAt(0)!;
    const unicodes = claim([code, ch.toLowerCase().codePointAt(0)!]);
    if (!unicodes.length) continue;
    all.push(new opentype.Glyph({
      name: 'uni' + code.toString(16).toUpperCase().padStart(4, '0'),
      unicodes,
      advanceWidth: adv * PX, path,
    }));
  }

  const font = new opentype.Font({
    familyName: family,
    styleName: 'Regular',
    unitsPerEm: UPEM,
    ascender: (h + 2) * PX,
    descender: -3 * PX,
    glyphs: all,
  });
  mkdirSync(OUT, { recursive: true });
  const file = `${OUT}/${name}.ttf`;
  writeFileSync(file, Buffer.from(font.toArrayBuffer()));
  console.log(`font: ${file} (${all.length} glyphs)`);
}

build('kanka-title', 'Kanka Title', 'title', FONT_DATA.title.w, FONT_DATA.title.h, FONT_DATA.title.adv, FONT_DATA.title.glyphs);
build('kanka-hud', 'Kanka HUD', 'hud', FONT_DATA.hud.w, FONT_DATA.hud.h, FONT_DATA.hud.adv, FONT_DATA.hud.glyphs);
