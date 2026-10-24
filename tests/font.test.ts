// The fonts are bitmap tables, so a missing glyph is invisible until it renders as '?': these
// checks pin the extension contract down. tools/font/font_map.json is the append-only index
// the art pipeline writes to; the tables in font.ts must agree with it, no v1 slot may move,
// and every string the game actually paints must have a glyph for every character.
import { readFileSync } from 'node:fs';
import opentype from 'opentype.js';
import { afterAll, describe, expect, it, vi } from 'vitest';
import { FONT_DATA, drawText, fold, glyphIndex, hasGlyph, parseGlyph, setFontLocale } from '../src/client/render/font';
import { SHOPS } from '../src/shared/data/shops';
import { ITEMS, ITEM_IDS } from '../src/shared/data/items';
import { TR } from '../src/client/i18n';
import { CHAPTERS } from '../src/shared/data/stages';
import { NEON_WORDS } from '../src/client/render/backgrounds';
import { ENEMIES } from '../src/shared/data/enemies';

interface FontMap {
  title: { core: string; turkish: Record<string, number>; extension: Record<string, number> };
  hud: { core: string; extension: Record<string, number> };
  lowercase_tr: Record<string, string>;
  lowercase_intl: Record<string, string>;
  unmapped: string;
}
const map = JSON.parse(readFileSync('tools/font/font_map.json', 'utf8')) as FontMap;

const ACCEPTANCE = [
  'LUPE: ¡FRESH TORTILLAS, KANKA!',
  'MENÚ',
  '¡ÓRALE! ¿QUÉ TAL?',
  'ÇAY $20 · DONDURMA $85',
  'HÜSNÜ — İZMİR BAKKAL',
  'PASTOR PLATE $150 FULL',
];

/** Every canvas string the campaign can show, gathered from the data the renderer reads. */
function paintedStrings(): string[] {
  const out: string[] = [...ACCEPTANCE];
  for (const s of Object.values(SHOPS)) out.push(s.name, s.keeper, s.keeperLine, s.tagline);
  for (const id of ITEM_IDS) out.push(ITEMS[id].name);
  for (const ch of CHAPTERS) {
    out.push(ch.title, ch.city, ch.country, ch.intro);
    for (const se of ch.sections) out.push(se.name);
  }
  for (const e of Object.values(ENEMIES)) {
    out.push(e.name);
    if (e.boss) out.push(e.boss.title, e.boss.intro, e.boss.defeat);
  }
  return out;
}

afterAll(() => setFontLocale('en'));

describe('locale-aware uppercase folding', () => {
  it('uses Turkish rules in the Turkish UI without corrupting dotted and dotless i', () => {
    setFontLocale('tr');
    expect(fold('istanbul')).toBe('İSTANBUL');
    expect(fold('ılık')).toBe('ILIK');
    expect(fold('simit taze, çay demli')).toBe('SİMİT TAZE, ÇAY DEMLİ');
  });

  it('keeps Turkish proper nouns correct in the English UI', () => {
    setFontLocale('en');
    expect(fold('Hüsnü — İzmir')).toBe('HÜSNÜ — İZMİR');
    expect(fold('Simit')).toBe('SIMIT');          // no Turkish letter: English spelling
  });

  it('restores Spanish accents, ñ and the inverted marks instead of stripping them', () => {
    setFontLocale('en');
    expect(fold('¡Órale! ¿Qué tal, señor?')).toBe('¡ÓRALE! ¿QUÉ TAL, SEÑOR?');
    expect(fold('menú')).toBe('MENÚ');
    expect(fold('fresh tortillas, kanka!')).toBe('FRESH TORTILLAS, KANKA!');
  });
});

describe('append-only glyph indices', () => {
  it('keeps every v1 slot where it was and appends the extension after it', () => {
    for (const font of ['title', 'hud'] as const) {
      const m = map[font];
      [...m.core].forEach((ch, i) => expect(glyphIndex(font, ch), `${font} ${ch}`).toBe(i));
      if (font === 'title') for (const [ch, i] of Object.entries(map.title.turkish)) expect(glyphIndex(font, ch)).toBe(i);
      for (const [ch, i] of Object.entries(m.extension)) expect(glyphIndex(font, ch), `${font} ${ch}`).toBe(i);
      // every indexed slot must actually draw
      const indexed = [...m.core, ...Object.keys(m.extension), ...(font === 'title' ? Object.keys(map.title.turkish) : [])];
      for (const ch of indexed) expect(hasGlyph(font, ch), `${font} ${ch} draws`).toBe(true);
    }
    // the extension fills exactly the documented slots, nothing interleaved
    expect(Object.values(map.title.extension).sort((a, b) => a - b)).toEqual([57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74]);
    expect(Object.values(map.hud.extension).sort((a, b) => a - b)).toEqual([36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60]);
  });

  it('leaves the v1 letterforms exactly as they shipped', () => {
    // pinned rows straight from the v1 tables: the extension adds glyphs, never restyles
    expect(FONT_DATA.hud.glyphs.A).toBe('01110100011000111111100011000110001');
    expect(FONT_DATA.hud.glyphs.I).toBe('01110001000010000100001000010001110');
    expect(FONT_DATA.hud.glyphs.$).toBe('00100011111010001110001011111000100');
    expect(FONT_DATA.title.glyphs.A).toEqual(['.#####.', '##...##', '##...##', '##...##', '#######', '##...##', '##...##', '##...##']);
    expect(FONT_DATA.title.glyphs['!']).toEqual(['...##..', '...##..', '...##..', '...##..', '...##..', '...##..', '.......', '...##..']);
    expect(FONT_DATA.title.glyphs.$).toEqual(['...##..', '.#####.', '##.##..', '.#####.', '..##.##', '.#####.', '...##..', '.......']);
  });

  it('composes the new letters from untouched v1 base glyphs', () => {
    for (const ch of ['Á', 'É', 'Í', 'Ó', 'Ú', 'Ñ']) {
      const g = parseGlyph(ch, 'hud');
      expect(hasGlyph('hud', ch), ch).toBe(true);
      expect(g.mark, ch).toBe(ch === 'Ñ' ? 'tilde' : 'acute');
      expect(hasGlyph('hud', g.base), `${ch} base`).toBe(true);
    }
    expect(parseGlyph('Í', 'title')).toEqual({ base: 'I', mark: 'dot' }); // title borrows İ (53)
  });
});

/** drawText only ever touches fillStyle and fillRect, so a recorder stands in for canvas. */
function render(s: string, opts: Parameters<typeof drawText>[5] = {}): [number, number][] {
  const px: [number, number][] = [];
  const ctx = {
    fillStyle: '',
    fillRect: (x: number, y: number) => { px.push([x, y]); },
  } as unknown as CanvasRenderingContext2D;
  drawText(ctx, s, 0, 10, '#fff', { shadow: null, ...opts });
  return px;
}

const above = (px: [number, number][], y: number) => px.filter(([, py]) => py < y);

describe('text layer', () => {
  it('draws the composed mark above the v1 base letter', () => {
    const a = render('A');
    const acute = render('Á');
    expect(above(a, 10)).toEqual([]);
    expect(above(acute, 10).length).toBeGreaterThan(0);
    expect(acute.length).toBeGreaterThan(a.length);
  });

  it('gives the title the borrowed dot for Í and the HUD a real acute', () => {
    expect(FONT_DATA.marks('dot', true)).toHaveLength(2);      // İ's dot, the title's borrowed Í
    expect(FONT_DATA.marks('acute', false)).toHaveLength(4);    // the HUD's real acute
  });

  it('works from the authored mixed-case string and draws ¡ and ¿', () => {
    setFontLocale('en');
    const fromLower = render('¡órale! ¿qué tal?');
    const fromUpper = render('¡ÓRALE! ¿QUÉ TAL?');
    expect(fromLower).toEqual(fromUpper);
    expect(fromLower.length).toBeGreaterThan(render('¡ORALE! ¿QUE TAL?').length);
  });

  it('draws the em dash heavier than the en dash, and the curly quote at the cap', () => {
    const em = render('—'), en = render('–'), quote = render('’');
    expect(em).toHaveLength(10);               // 5 x 2 rows
    expect(en).toHaveLength(5);                // 5 x 1 row
    expect(em.length).toBeGreaterThan(en.length);
    expect(new Set(quote.map(([, y]) => y))).toEqual(new Set([10, 11, 12])); // top of the cell
    expect(quote).toHaveLength(4);
    for (const ch of ['—', '–', '’']) expect(hasGlyph('title', ch) && hasGlyph('hud', ch), ch).toBe(true);
  });

  it('draws the copy marks, the separator dot and the circumflex', () => {
    for (const ch of [';', '…', '©', 'Ø', 'Â']) expect(hasGlyph('hud', ch) && hasGlyph('title', ch), ch).toBe(true);
    expect(hasGlyph('title', '·')).toBe(true);
    expect(parseGlyph('Â', 'hud')).toEqual({ base: 'A', mark: 'circumflex' });
    expect(render('©').length).toBeGreaterThan(0);
    expect(above(render('Â'), 10)).toHaveLength(3);        // the circumflex sits above the A
  });

  it("draws '?' for an unmapped character and warns once, naming the string", () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const euro = render('A€B');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(String(warn.mock.calls[0][0])).toContain('U+20AC');
    expect(String(warn.mock.calls[0][0])).toContain('A€B');
    expect(euro).toEqual(render('A?B'));       // the unmapped cell draws the fallback
    render('A€B');                             // second sighting: no new warning
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });
});

describe('glyph coverage', () => {
  it('has a real glyph for every acceptance string character', () => {
    const gaps = new Set<string>();
    for (const s of ACCEPTANCE) for (const ch of fold(s)) if (ch !== ' ' && !hasGlyph('hud', ch)) gaps.add(ch);
    expect([...gaps]).toEqual([]);
  });

  it('leaves no authored string without a glyph, DOM copy included', () => {
    const gaps = new Set<string>();
    for (const s of [...Object.keys(TR), ...Object.values(TR), ...paintedStrings()]) {
      for (const ch of fold(s)) if (ch !== ' ' && !hasGlyph('hud', ch)) gaps.add(ch);
    }
    expect([...gaps]).toEqual([]);
  });

  it('covers every string the campaign paints, dashes and curly quotes included', () => {
    const gaps = new Set<string>();
    for (const s of paintedStrings()) {
      for (const ch of fold(s)) {
        if (ch !== ' ' && !hasGlyph('hud', ch)) gaps.add(ch);
      }
    }
    expect([...gaps]).toEqual([]);
  });

  it('paints the storefront neon, cent sign included', () => {
    const gaps = new Set<string>();
    // the signs are title lettering, so the title is the font that must carry them
    for (const word of NEON_WORDS) for (const ch of fold(word)) if (ch !== ' ' && !hasGlyph('title', ch)) gaps.add(ch);
    expect([...gaps]).toEqual([]);
  });

  it('ships the inverted marks as ordinary glyphs, dot on top', () => {
    for (const ch of ['¡', '¿']) expect(hasGlyph('title', ch) && hasGlyph('hud', ch), ch).toBe(true);
  });

  it('carries the same characters in the DOM webfonts (npm run fonts)', () => {
    const ttf = (file: string) => {
      const buf = readFileSync(file);
      return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
    };
    const hud = ttf('public/fonts/kanka-hud.ttf');
    const title = ttf('public/fonts/kanka-title.ttf');
    const missing = (font: opentype.Font, chars: string) => [...chars].filter((ch) => font.charToGlyphIndex(ch) === 0);
    expect(missing(hud, 'ÁÉÍÓÚÑ¡¿ÇĞİÖŞÜ$&·—–’;…©ØÂ¢')).toEqual([]);
    expect(missing(title, 'ÁÉÓÚÑ¡¿ÇĞİÖŞÜ$—–’;…©ØÂ&₺·¢')).toEqual([]);
  });
});
