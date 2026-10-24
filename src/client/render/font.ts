// The game's own bitmap fonts, transcribed from ConceptArt/font_lettering_sheet.png,
// then extended with the Spanish/Turkish glyphs in assets/source/font_extension_sheet.png.
// TITLE: chunky 7x8 arcade caps for headers, prices and signage.
// HUD:    compact 5x7 white caps for body text and numbers.
// Nothing in the UI uses a system or default font.
//
// Glyph order is append-only (see tools/font/font_map.json): the v1 tables below keep
// their shapes and positions, and the extension glyphs are appended after them — title
// 57-73, HUD 36-59 (letters first, then the punctuation and copy marks the sheets
// lacked). Nothing here renumbers a v1 glyph.

const HUD_W = 5, HUD_H = 7;
const TITLE_W = 7, TITLE_H = 8;

// ------------------------------------------------------------------ HUD 5x7
const H: Record<string, string> = {
  A: '01110100011000111111100011000110001', B: '11110100011000111110100011000111110', C: '01110100011000010000100001000101110',
  D: '11110100011000110001100011000111110', E: '11111100001000011110100001000011111', F: '11111100001000011110100001000010000',
  G: '01110100011000010111100011000101111', H: '10001100011000111111100011000110001', I: '01110001000010000100001000010001110',
  J: '00111000100001000010000101001001100', K: '10001100101010011000101001001010001', L: '10000100001000010000100001000011111',
  M: '10001110111010110101100011000110001', N: '10001110011010110011100011000110001', O: '01110100011000110001100011000101110',
  P: '11110100011000111110100001000010000', Q: '01110100011000110001101011001001101', R: '11110100011000111110101001001010001',
  S: '01111100001000001110000010000111110', T: '11111001000010000100001000010000100', U: '10001100011000110001100011000101110',
  V: '10001100011000110001100010101000100', W: '10001100011000110101101011010101010', X: '10001100010101000100010101000110001',
  Y: '10001100010101000100001000010000100', Z: '11111000010001000100010001000011111',
  '0': '01110100011001110101110011000101110', '1': '00100011000010000100001000010001110', '2': '01110100010000100010001000100011111',
  '3': '11111000100010000010000011000101110', '4': '00010001100101010010111110001000010', '5': '11111100001111000001000011000101110',
  '6': '00110010001000011110100011000101110', '7': '11111000010001000100010000100001000', '8': '01110100011000101110100011000101110',
  '9': '01110100011000101111000010001001100',
  '.': '00000000000000000000000000110001100', ',': '00000000000000000000001100010001000', '!': '00100001000010000100001000000000100',
  '?': '01110100010000100010001000000000100', ':': '00000011000110000000011000110000000', '-': '00000000000000011111000000000000000',
  '+': '00000001000010011111001000010000000', '/': '00001000010001000100010001000010000', "'": '00100001000100000000000000000000000',
  '(': '00010001000100001000010000010000010', ')': '01000001000001000010000100010001000', '%': '11001110010001000100010001001110011',
  '$': '00100011111010001110001011111000100', '₺': '01000010110110011011011000100100110', '#': '01010010101111101010111110101001010',
  '<': '00010001000100010000010000010000010', '>': '01000001000001000001000100010001000', '=': '00000000001111100000111110000000000',
  '*': '00000001001010101110101010010000000', '"': '01010010100000000000000000000000000', '&': '01100100101010001000101011001001101',
  '♥': '00000010101111111111011100010000000', '▶': '01000011000111001111011100110001000', '◀': '00010001100111011110011100011000010',
  '▲': '00000000000010001110111110000000000', '▼': '00000000001111101110001000000000000', '×': '00000100010101000100010101000100000',
  '·': '00000000000000000100000000000000000',
  // inverted marks (font_extension sheet, HUD 42 / 43): dot on top, the stroke below
  '¡': '00100000000010000100001000010000100', '¿': '00100000000010000010000011000101110',
  // punctuation the v1 sheet lacked (HUD 52-54): a weighted em dash, the hyphen's measure
  // for the en dash, and the comma turned up for the curly apostrophe
  '—': '00000000000000011111111110000000000', '–': '00000000000000011111000000000000000',
  '’': '00110001000100000000000000000000000',
  // the last DOM-copy gaps (HUD 55-58)
  ';': '00000001000000000000001100010001000', '…': '00000000000000000000000000000010101',
  '©': '01110100011011010100101101000101110', 'Ø': '01110100011001110101110011000101110',
  // the cent sign on the NYC storefront banners: the v1 C with a stroke through it
  '¢': '00100011101010010100101000111000100',
  ' ': '00000000000000000000000000000000000',
};

// ------------------------------------------------------------------ TITLE 7x8
const T: Record<string, string[]> = {
  A: ['.#####.', '##...##', '##...##', '##...##', '#######', '##...##', '##...##', '##...##'],
  B: ['######.', '##...##', '##...##', '##...##', '######.', '##...##', '##...##', '######.'],
  C: ['.#####.', '##...##', '##.....', '##.....', '##.....', '##.....', '##...##', '.#####.'],
  D: ['#####..', '##..##.', '##...##', '##...##', '##...##', '##...##', '##..##.', '#####..'],
  E: ['#######', '##.....', '##.....', '##.....', '#####..', '##.....', '##.....', '#######'],
  F: ['#######', '##.....', '##.....', '##.....', '#####..', '##.....', '##.....', '##.....'],
  G: ['.#####.', '##...##', '##.....', '##.....', '##..###', '##...##', '##...##', '.#####.'],
  H: ['##...##', '##...##', '##...##', '##...##', '#######', '##...##', '##...##', '##...##'],
  I: ['.#####.', '...##..', '...##..', '...##..', '...##..', '...##..', '...##..', '.#####.'],
  J: ['..#####', '....##.', '....##.', '....##.', '....##.', '....##.', '##..##.', '.####..'],
  K: ['##...##', '##..##.', '##.##..', '####...', '###....', '##.##..', '##..##.', '##...##'],
  L: ['##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '##.....', '#######'],
  M: ['##...##', '###.###', '#######', '##.#.##', '##...##', '##...##', '##...##', '##...##'],
  N: ['##...##', '###..##', '####.##', '##.####', '##..###', '##...##', '##...##', '##...##'],
  O: ['.#####.', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.'],
  P: ['######.', '##...##', '##...##', '##...##', '######.', '##.....', '##.....', '##.....'],
  Q: ['.#####.', '##...##', '##...##', '##...##', '##...##', '##.#.##', '##..##.', '.####.#'],
  R: ['######.', '##...##', '##...##', '##...##', '######.', '##.##..', '##..##.', '##...##'],
  S: ['.#####.', '##...##', '##.....', '.#####.', '.....##', '.....##', '##...##', '.#####.'],
  T: ['#######', '...##..', '...##..', '...##..', '...##..', '...##..', '...##..', '...##..'],
  U: ['##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.'],
  V: ['##...##', '##...##', '##...##', '##...##', '.##.##.', '.##.##.', '..###..', '...#...'],
  W: ['##...##', '##...##', '##...##', '##.#.##', '##.#.##', '#######', '###.###', '##...##'],
  X: ['##...##', '##...##', '.##.##.', '..###..', '..###..', '.##.##.', '##...##', '##...##'],
  Y: ['##...##', '##...##', '.##.##.', '..###..', '...##..', '...##..', '...##..', '...##..'],
  Z: ['#######', '.....##', '....##.', '...##..', '..##...', '.##....', '##.....', '#######'],
  '0': ['.#####.', '##...##', '##..###', '##.#.##', '###..##', '##...##', '##...##', '.#####.'],
  '1': ['...##..', '..###..', '.####..', '...##..', '...##..', '...##..', '...##..', '.#####.'],
  '2': ['.#####.', '##...##', '....##.', '...##..', '..##...', '.##....', '##.....', '#######'],
  '3': ['#######', '....##.', '...##..', '..####.', '.....##', '.....##', '##...##', '.#####.'],
  '4': ['....##.', '...###.', '..####.', '.##.##.', '##..##.', '#######', '....##.', '....##.'],
  '5': ['#######', '##.....', '######.', '.....##', '.....##', '.....##', '##...##', '.#####.'],
  '6': ['..####.', '.##....', '##.....', '######.', '##...##', '##...##', '##...##', '.#####.'],
  '7': ['#######', '.....##', '....##.', '...##..', '..##...', '..##...', '..##...', '..##...'],
  '8': ['.#####.', '##...##', '##...##', '.#####.', '##...##', '##...##', '##...##', '.#####.'],
  '9': ['.#####.', '##...##', '##...##', '##...##', '.######', '.....##', '....##.', '.####..'],
  '.': ['.......', '.......', '.......', '.......', '.......', '.......', '...##..', '...##..'],
  ',': ['.......', '.......', '.......', '.......', '.......', '...##..', '...##..', '..#....'],
  '!': ['...##..', '...##..', '...##..', '...##..', '...##..', '...##..', '.......', '...##..'],
  '?': ['.#####.', '##...##', '....##.', '...##..', '..##...', '..##...', '.......', '..##...'],
  "'": ['...##..', '...##..', '...#...', '.......', '.......', '.......', '.......', '.......'],
  '"': ['..##.##', '..##.##', '..#..#.', '.......', '.......', '.......', '.......', '.......'],
  ':': ['.......', '...##..', '...##..', '.......', '...##..', '...##..', '.......', '.......'],
  '-': ['.......', '.......', '.......', '.#####.', '.......', '.......', '.......', '.......'],
  '+': ['.......', '...##..', '...##..', '.#####.', '...##..', '...##..', '.......', '.......'],
  '/': ['.....##', '....##.', '...##..', '..##...', '..##...', '.##....', '##.....', '.......'],
  '&': ['.###...', '##.##..', '##.##..', '.###...', '##.#.##', '##..###', '##...##', '.###.##'],
  '$': ['...##..', '.#####.', '##.##..', '.#####.', '..##.##', '.#####.', '...##..', '.......'],
  '₺': ['..##...', '#######', '..##...', '.#.#.#.', '..##...', '.#.#.#.', '..##...', '.......'],
  '×': ['.......', '##...##', '.##.##.', '..###..', '.##.##.', '##...##', '.......', '.......'],
  '(': ['....##.', '...##..', '..##...', '..##...', '..##...', '...##..', '....##.', '.......'],
  ')': ['.##....', '..##...', '...##..', '...##..', '...##..', '..##...', '.##....', '.......'],
  '%': ['##...##', '##..##.', '...##..', '..##...', '.##....', '##...##', '......#', '.......'],
  // inverted marks (font_extension sheet, title 62 / 63): dot on top, the stroke below
  '¡': ['...##..', '.......', '...##..', '...##..', '...##..', '...##..', '...##..', '...##..'],
  '¿': ['..##...', '.......', '..##...', '..##...', '...##..', '....##.', '##...##', '.#####.'],
  // punctuation the v1 sheet lacked (title 65-67), same design as the HUD marks
  '—': ['.......', '.......', '.......', '#######', '#######', '.......', '.......', '.......'],
  '–': ['.......', '.......', '.......', '#######', '.......', '.......', '.......', '.......'],
  '’': ['..##...', '..#....', '.#.....', '.......', '.......', '.......', '.......', '.......'],
  // the last gaps (title 68-72): the separator dot and the copy marks
  '·': ['.......', '.......', '.......', '..##...', '..##...', '.......', '.......', '.......'],
  ';': ['.......', '...##..', '.......', '.......', '.......', '...##..', '...##..', '..#....'],
  '…': ['.......', '.......', '.......', '.......', '.......', '.......', '##.#.##', '.......'],
  '©': ['.#####.', '##...##', '#.##..#', '#.#...#', '#.##..#', '##...##', '.#####.', '.......'],
  'Ø': ['.#####.', '##...##', '##..###', '##.#.##', '###..##', '##...##', '.#####.', '.......'],
  // the cent sign on the storefront banners (title 74): the stroke's ends clear the C
  '¢': ['...#...', '.#####.', '##.#..#', '##.#...', '##.#...', '##.#..#', '.#####.', '...#...'],
  '♥': ['.......', '.##.##.', '#######', '#######', '.#####.', '..###..', '...#...', '.......'],
  '★': ['...##..', '...##..', '.#####.', '#######', '.#####.', '.##.##.', '##...##', '.......'],
  ' ': ['.......', '.......', '.......', '.......', '.......', '.......', '.......', '.......'],
};

type Mark = 'cedilla' | 'breve' | 'dot' | 'umlaut' | 'acute' | 'tilde' | 'circumflex';

// Turkish marks, drawn relative to the glyph origin. The base letter is unchanged.
const TURKISH: Record<string, { base: string; mark: Mark }> = {
  Ç: { base: 'C', mark: 'cedilla' }, Ğ: { base: 'G', mark: 'breve' }, İ: { base: 'I', mark: 'dot' },
  Ö: { base: 'O', mark: 'umlaut' }, Ş: { base: 'S', mark: 'cedilla' }, Ü: { base: 'U', mark: 'umlaut' },
};

// Spanish letters the v1 sheet never drew: the same base letter with the extension
// sheet's mark above it (the title sheet has no Í of its own, so it borrows İ's dot).
const ACCENTS: Record<string, { base: string; mark: Mark; titleMark?: Mark }> = {
  Á: { base: 'A', mark: 'acute' }, É: { base: 'E', mark: 'acute' }, Í: { base: 'I', mark: 'acute', titleMark: 'dot' },
  Ó: { base: 'O', mark: 'acute' }, Ú: { base: 'U', mark: 'acute' }, Ñ: { base: 'N', mark: 'tilde' },
  Â: { base: 'A', mark: 'circumflex' },
};

/** The base glyph and the mark above/below it for a composed letter. */
export function parseGlyph(ch: string, font: 'hud' | 'title' = 'hud'): { base: string; mark?: Mark } {
  const t = TURKISH[ch];
  if (t) return { base: t.base, mark: t.mark };
  const a = ACCENTS[ch];
  if (!a) return { base: ch };
  return { base: a.base, mark: font === 'title' && a.titleMark ? a.titleMark : a.mark };
}

// ------------------------------------------------------------- append-only index
/** The 15 title symbols that fill slots 36-50, in the order the lettering sheet draws
 *  them. Everything the v1 font already had keeps its slot; the extension glyphs are
 *  appended after the Turkish block, exactly as font_map.json says. */
const TITLE_SYMBOLS = ['!', '?', '.', ',', ':', '"', "'", '-', '+', '×', '/', '%', '♥', '★', ')'];
const TURKISH_ORDER = ['Ç', 'Ğ', 'İ', 'Ö', 'Ş', 'Ü'];
const TITLE_EXT: Record<string, number> = {
  Á: 57, É: 58, Ó: 59, Ú: 60, Ñ: 61, '¡': 62, '¿': 63, $: 64,
  '—': 65, '–': 66, '’': 67, '·': 68, ';': 69, '…': 70, '©': 71, 'Ø': 72, 'Â': 73,
  '¢': 74,
};
const HUD_EXT: Record<string, number> = {
  Á: 36, É: 37, Í: 38, Ó: 39, Ú: 40, Ñ: 41, '¡': 42, '¿': 43,
  Ç: 44, Ğ: 45, İ: 46, Ö: 47, Ş: 48, Ü: 49, $: 50, '&': 51,
  '—': 52, '–': 53, '’': 54, ';': 55, '…': 56, '©': 57, 'Ø': 58, 'Â': 59,
  '¢': 60,
};

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const DIGITS = '0123456789'.split('');

/** The slot a character occupies in a font's append-only order, or -1 when the v1 font
 *  draws it without it ever being indexed (₺, parentheses, ★ in HUD, …). */
export function glyphIndex(font: 'hud' | 'title', ch: string): number {
  const ext = font === 'title' ? TITLE_EXT : HUD_EXT;
  if (ch in ext) return ext[ch];
  const alpha = ALPHA.indexOf(ch);
  if (alpha >= 0) return alpha;
  const digit = DIGITS.indexOf(ch);
  if (digit >= 0) return 26 + digit;
  if (font === 'title') {
    const sym = TITLE_SYMBOLS.indexOf(ch);
    if (sym >= 0) return 36 + sym;
    const tr = TURKISH_ORDER.indexOf(ch);
    if (tr >= 0) return 51 + tr;
  }
  return -1;
}

/** True when the font has a glyph for this (already composed) character. */
export function hasGlyph(font: 'hud' | 'title', ch: string): boolean {
  const { base } = parseGlyph(ch, font);
  return font === 'title' ? Object.hasOwn(T, base) : Object.hasOwn(H, base);
}

// ------------------------------------------------------------- text case
let uiLocale: 'en' | 'tr' = 'en';

/** Set by i18n.applyLang; the canvas text layer folds in the UI's locale. */
export function setFontLocale(lang: 'en' | 'tr'): void { uiLocale = lang; }

const TURKISH_LETTERS = /[ÇĞİÖŞÜçğıöşü]/;

/** Uppercase a string for the bitmap fonts. Plain `toUpperCase()` is wrong for Turkish —
 *  it turns `i` into `I`, and the dotted capital is a different letter. Turkish folding is
 *  used when the UI is Turkish, and also for any string carrying a Turkish letter (so
 *  İzmir and Hüsnü stay correct in the English UI); everything else folds per Unicode. */
export function fold(s: string): string {
  const turkish = uiLocale === 'tr' || TURKISH_LETTERS.test(s);
  let out = '';
  for (const ch of s) out += turkish && ch === 'i' ? 'İ' : ch === 'ı' ? 'I' : ch.toUpperCase();
  return out;
}

const warned = new Set<string>();

/** A character with no glyph draws '?' — and says so once, naming the string, rather than
 *  quietly substituting or dropping it. */
function warnMissing(font: 'hud' | 'title', ch: string, s: string): void {
  const key = `${font}:${ch}`;
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(`[font] no ${font} glyph for ${JSON.stringify(ch)} (U+${ch.codePointAt(0)!.toString(16).toUpperCase().padStart(4, '0')}) in ${JSON.stringify(s)} — drawing '?'`);
}

function hudGlyph(ch: string, s: string): string {
  if (Object.hasOwn(H, ch)) return H[ch];
  warnMissing('hud', ch, s);
  return H['?'];
}

export function textWidth(s: string, scale = 1): number {
  return Math.max(0, s.length * (HUD_W + 1) * scale - scale);
}

export function titleWidth(s: string, scale = 1): number {
  return Math.max(0, s.length * (TITLE_W + 2) * scale - 2 * scale);
}

function markPixels(mark: Mark, wide = false): [number, number][] {
  switch (mark) {
    case 'dot': return [[1, -2], [2, -2]];
    case 'umlaut': return [[0, -2], [1, -2], [3, -2], [4, -2]];
    case 'breve': return [[0, -2], [1, -3], [2, -3], [3, -3], [4, -2]];
    case 'cedilla': return [[1, 1], [2, 1], [1, 2], [0, 2]];
    // the extension sheet's accents are a two-pixel-thick stroke that sits on the cap; the
    // title cell is two pixels wider than the HUD cell, so its mark shifts one pixel right
    case 'acute': return wide ? [[2, -1], [3, -1], [3, -2], [4, -2]] : [[1, -1], [2, -1], [2, -2], [3, -2]];
    case 'tilde': return wide ? [[1, -2], [2, -2], [3, -1], [4, -2], [5, -2]] : [[0, -2], [1, -2], [2, -1], [3, -2], [4, -2]];
    case 'circumflex': return wide ? [[2, -1], [3, -2], [4, -1]] : [[1, -1], [2, -2], [3, -1]];
  }
}

function drawMark(ctx: CanvasRenderingContext2D, mark: Mark | undefined, ox: number, oy: number, sc: number, rowH: number, color: string, wide: boolean): void {
  if (!mark) return;
  ctx.fillStyle = color;
  for (const [mx, my] of markPixels(mark, wide)) {
    const yy = mark === 'cedilla' ? oy + rowH * sc + my * sc : oy + my * sc;
    ctx.fillRect(ox + mx * sc, yy, sc, sc);
  }
}

interface TextOpts { scale?: number; shadow?: string | null; align?: 'left' | 'center' | 'right'; outline?: boolean; font?: 'hud' | 'title'; color2?: string; flatTitle?: boolean }

/** Blend two hex colours; anything unparseable is returned unchanged, so a bad option
 *  degrades to the flat colour rather than to black. */
function mix(a: string, b: string, t: number): string {
  const parse = (h: string): [number, number, number] | null => {
    const s = h.replace('#', '');
    const full = s.length === 3 ? s.split('').map((x) => x + x).join('') : s;
    if (full.length !== 6 || /[^0-9a-f]/i.test(full)) return null;
    return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
  };
  const ca = parse(a), cb = parse(b);
  if (!ca || !cb) return a;
  return '#' + ca.map((v, i) => Math.round(v + (cb[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

function outlinePasses(sc: number): [number, number][] {
  return [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1], [-1, -1], [1, -1], [-1, 1]].map(([x, y]) => [x * sc, y * sc]);
}

export function drawText(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = '#fff', opts: TextOpts = {}): void {
  const title = opts.font === 'title';
  const sc = opts.scale ?? 1;
  const str = fold(s);
  const gw = title ? TITLE_W : HUD_W, gh = title ? TITLE_H : HUD_H, adv = title ? TITLE_W + 2 : HUD_W + 1;
  const w = title ? titleWidth(str, sc) : textWidth(str, sc);
  const ox = Math.round(opts.align === 'center' ? x - w / 2 : opts.align === 'right' ? x - w : x);
  const oy = Math.round(y);
  const sh = opts.shadow === undefined ? '#1a1220' : opts.shadow;
  const shadowCol = sh ?? '#1a1220';

  // the reference title lettering is a two-tone gold: a lit top edge over a shaded base
  const fillTop = opts.color2 ?? mix(color, '#ffffff', 0.45);
  const fillBottom = mix(color, '#000000', 0.28);

  const pass = (dx: number, dy: number, col: string) => {
    ctx.fillStyle = col;
    let cx = ox;
    for (const ch of str) {
      const { base, mark } = parseGlyph(ch, title ? 'title' : 'hud');
      if (title) {
        const rows = Object.hasOwn(T, base) ? T[base] : (warnMissing('title', base, s), T['?']);
        for (let ry = 0; ry < gh; ry++) {
          ctx.fillStyle = col === color && !opts.flatTitle ? (ry < 2 ? fillTop : ry >= gh - 2 ? fillBottom : col) : col;
          const row = rows[ry];
          for (let rx = 0; rx < gw; rx++) if (row[rx] === '#') ctx.fillRect(cx + rx * sc + dx, oy + ry * sc + dy, sc, sc);
        }
        ctx.fillStyle = col;
        drawMark(ctx, mark, cx + dx, oy + dy, sc, gh, col, true);
      } else {
        const g = hudGlyph(base, s);
        for (let i = 0; i < HUD_W * HUD_H; i++) if (g.charCodeAt(i) === 49) ctx.fillRect(cx + (i % HUD_W) * sc + dx, oy + Math.floor(i / HUD_W) * sc + dy, sc, sc);
        drawMark(ctx, mark, cx + dx, oy + dy, sc, gh, col, false);
      }
      cx += adv * sc;
    }
  };

  if (title) {
    // deep drop shadow, near-black outline, then the fill (gold with a bright top edge)
    pass(sc * 2, sc * 2, '#0e0812');
    for (const [dx, dy] of outlinePasses(sc)) pass(dx, dy, shadowCol);
    pass(0, 0, color);
  } else if (opts.outline) {
    for (const [dx, dy] of outlinePasses(sc)) pass(dx, dy, shadowCol);
    pass(0, 0, color);
  } else if (sh) {
    pass(sc, sc, shadowCol);
    pass(0, 0, color);
  } else pass(0, 0, color);
}

/** Title-font convenience wrapper used by headers, banners and signage. */
export function drawTitle(ctx: CanvasRenderingContext2D, s: string, x: number, y: number, color = '#f0c818', opts: TextOpts = {}): void {
  drawText(ctx, s, x, y, color, { ...opts, font: 'title' });
}

/** Glyph data for the build-time webfont generator (tools/font/build.ts). */
export const FONT_DATA = {
  hud: { w: HUD_W, h: HUD_H, adv: HUD_W + 1, glyphs: H as Record<string, string> },
  title: { w: TITLE_W, h: TITLE_H, adv: TITLE_W + 2, glyphs: T as Record<string, string[]> },
  turkish: TURKISH,
  accents: ACCENTS,
  marks: markPixels,
};
