// Small hand-authored pixel maps for food, money, props, projectiles and vehicles,
// rasterised once into cached canvases with the same 1px outline as the characters.

const OUT = '#1a1220';

export interface PixelArt { rows: string[]; pal: Record<string, string>; outline?: boolean }

export const ART: Record<string, PixelArt> = {
  nutella: { rows: [
    '..wwwwwwww..',
    '.wWWWWWWWWw.',
    '.bbbbbbbbbb.',
    '.bwwwwwwwwb.',
    '.bwrrwwrrwb.',
    '.bwwrrrrwwb.',
    '.bwnnnnnnwb.',
    '.bwnggnggwb.',
    '.bwwwwwwwwb.',
    '.bbbbbbbbbb.',
  ], pal: { w: '#f6f2ea', W: '#c8c0b4', b: '#5a2e14', r: '#d0202c', n: '#3a1a0c', g: '#6aa83a' } },
  banana: { rows: [
    '.........kk.',
    '........yyk.',
    '.......yyy..',
    '......yyyY..',
    '.....yyyYY..',
    '..yyyyyYY...',
    'kyyyyYYY....',
    '.YYYYYY.....',
  ], pal: { y: '#f6d838', Y: '#c8a820', k: '#4a3a1a' } },
  baklava: { rows: [
    '....hhhh....',
    '..hhGgGghh..',
    '.hGgggggGGh.',
    'hhhhhhhhhhhh',
    'DddddddddddD',
    'DdDdDdDdDdDd',
    'DddddddddddD',
    '.DDDDDDDDDD.',
  ], pal: { h: '#e8b04a', G: '#5aa83a', g: '#3a8a2a', d: '#d89a3a', D: '#a8682a' } },
  sujuk: { rows: [
    '..rrrrrrrr..',
    '.rRrrwrrrRr.',
    'rRrwrrrrwrRr',
    'rrrrrrwrrrrr',
    'rRrrwrrrrrRk',
    '.rRrrrrwrRk.',
    '..rrrrrrrk..',
  ], pal: { r: '#a8282c', R: '#7a1a1e', w: '#f0d8c8', k: '#e8d8a8' } },
  lahmacun: { rows: [
    '...cccccc...',
    '.ccrrrrrrcc.',
    'ccrrgrrrrrcc',
    'crrrrrrgrrrc',
    'crgrrrrrrrrc',
    'crrrrrgrrrrc',
    'ccrrrrrrrgcc',
    '.ccrrrrrrcc.',
    '...cccccc...',
  ], pal: { c: '#e8c07a', r: '#c84a2a', g: '#4a9a3a' } },
  ayran: { rows: [
    '...bbbbbb...',
    '...wwwwww...',
    '..wwwwwwww..',
    '..wWwwwwWw..',
    '..wbbbbbbw..',
    '..wbwbbwbw..',
    '..wbbbbbbw..',
    '..wwwwwwww..',
    '..wWwwwwWw..',
    '...wwwwww...',
  ], pal: { w: '#f6f6f2', W: '#d0d4dc', b: '#2a6ad0' } },
  coinTRY: { rows: ['.ggg.', 'gGyGg', 'gyGyg', 'gGyGg', '.ggg.'], pal: { g: '#d8a820', G: '#f6e070', y: '#a87810' } },
  coinUSD: { rows: ['gggggggg', 'gGGgdGGg', 'gGgddgGg', 'gGGgdGGg', 'gggggggg'], pal: { g: '#3a8a3a', G: '#8ad08a', d: '#1a5a1a' } },
  lokma: { rows: ['.oo.', 'oOoo', 'oooo', '.oo.'], pal: { o: '#e0a030', O: '#fff0a0' } },
  orange: { rows: ['.gl.', 'oOoo', 'oooo', 'oooo', '.oo.'], pal: { o: '#f08a20', O: '#ffd080', g: '#3a8a2a', l: '#5ab04a' } },
  crate: { rows: [
    'bbbbbbbbbbbbbbbbbbbb',
    'bllllllllllllllllllb',
    'blDllllllllllllllDlb',
    'bllDlllllllllllDlllb',
    'blllDllllllllDllll.b',
    'bbbbbbbbbbbbbbbbbbbb',
    'bllllDllllllDllllllb',
    'blllllDllllDlllllllb',
    'bllllllDllDllllllllb',
    'blllllllDDlllllllllb',
    'bbbbbbbbbbbbbbbbbbbb',
    'bllllllDllDllllllllb',
    'bllllDllllllDllllllb',
    'blllDllllllllDlllllb',
    'bllDllllllllllDllllb',
    'bbbbbbbbbbbbbbbbbbbb',
  ].map((r) => r.replace(/\./g, 'l')), pal: { b: '#7a4a22', l: '#c8904a', D: '#9a6a32' } },
  barrel: { rows: [
    '..kkkkkkkkkkkk..',
    '.kbbbbbbbbbbbbk.',
    'kbbBbbbbbbbbbbbk',
    'kgggggggggggggggk'.slice(0, 16),
    'kbbBbbbbbbbbbbbk',
    'kbbBbbbbbbbbbbbk',
    'kbbBbbbbbbbbbbbk',
    'kgggggggggggggggk'.slice(0, 16),
    'kbbBbbbbbbbbbbbk',
    'kbbBbbbbbbbbbbbk',
    '.kbbbbbbbbbbbbk.',
    '..kkkkkkkkkkkk..',
  ], pal: { k: '#4a2a14', b: '#a8642a', B: '#d0904a', g: '#5a5a62' } },
  bin: { rows: [
    '.mmmmmmmmmmmmmm.',
    'mMMMMMMMMMMMMMMm',
    '.mmmmmmmmmmmmmm.',
    '.gGgggGgggGgggg.',
    '.gGgggGgggGgggg.',
    '.gGgggGgggGgggg.',
    '.gGgggGgggGgggg.',
    '.gGgggGgggGgggg.',
    '.gGgggGgggGgggg.',
    '.gGgggGgggGgggg.',
    '.gggggggggggggg.',
  ], pal: { m: '#6a6a72', M: '#9a9aa4', g: '#7a7a84', G: '#a4a4ae' } },
  cooler: { rows: [
    'wwwwwwwwwwwwwwwwww',
    'wWWWWWWkkkkWWWWWWw',
    'rrrrrrrrrrrrrrrrrr',
    'rRrrrrrrrrrrrrrrRr',
    'rRrrwwwwwwwwwrrrRr',
    'rRrrwbbbbbbbwrrrRr',
    'rRrrwwwwwwwwwrrrRr',
    'rRrrrrrrrrrrrrrrRr',
    'rrrrrrrrrrrrrrrrrr',
  ], pal: { w: '#f0f0f0', W: '#c8c8d0', r: '#c8302c', R: '#8a2020', k: '#3a3a3a', b: '#2a6ad0' } },
  debris: { rows: ['l.....b..l', '.lb..l..b.', 'b..l..lb..'], pal: { l: '#c8904a', b: '#7a4a22' } },
  taxi: { rows: [
    '..........kkkkkkkkkkkkkkkkkkk.........................',
    '.........kyyyyyyyyyyyyyyyyyyyk........................',
    '........kywwwwwwwkywwwwwwwwwwyk.......................',
    '.......kyywwwwwwwkywwwwwwwwwwwyk......................',
    '......kyyywwwwwwwkywwwwwwwwwwwwyk.....................',
    'kkkkkkyyyyyyyyyyyyyyyyyyyyyyyyyyykkkkkkkkkkkkkkkkkkk..',
    'kyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyk.',
    'kOyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyk',
    'kcyykkkkkkkkkkkyyyyyyyyyyyykkkkkkkkkkkkyyyyyyyyyyyyyRk',
    'kcyykckckckckckyyyyyyyyyyyykckckckckckkyyyyyyyyyyyyyRk',
    'kyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyk',
    'kkkkkk.....kkkkkkkkkkkkkkkkkkkkkkk.....kkkkkkkkkkkkkkk',
    '.....k.ttt.k.....................k.ttt.k..............',
    '......ttgtt.......................ttgtt...............',
    '.......ttt.........................ttt................',
  ], pal: { k: '#1a1a1a', y: '#f2c218', w: '#9ad0f0', c: '#f6f6f6', O: '#fff6a0', R: '#e02020', t: '#2a2a2a', g: '#8a8a8a' } },
  tram: { rows: [
    '.............kkkkkkkkkkkkkkkkkk..............................',
    '..............................k..............................',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
    'krrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrk',
    'krwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwrk',
    'krwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbrk',
    'krwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbbwrwbrk',
    'krwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwwwrwwrk',
    'kcccccccccccccccccccccccccccccccccccccccccccccccccccccccccccck',
    'krrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrk',
    'krrrryyyyrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrryyyyrrrrrk',
    'kRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRk',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '....ttt..ttt..............................ttt..ttt...........',
  ], pal: { k: '#1a1a1a', r: '#c8202a', R: '#8a1418', w: '#f0ead8', b: '#7ab0d0', c: '#f0ead8', y: '#f0c040', t: '#2a2a2a' } },
  bike: { rows: [
    '.........hh.........',
    '........hssh........',
    '........ssss........',
    '.......bbbbb........',
    '......bbbbbbb.......',
    '......bbbbb.ss......',
    '.......jjjj...s.....',
    '......jj..jj..kk....',
    '.....jj....jjkk.....',
    '..ooo....kkkkk.ooo..',
    '.o...o..k..k..o...o.',
    'o..k..ok...k.o..k..o',
    'o...k.o.....ko...k.o',
    '.o...o........o...o.',
    '..ooo..........ooo..',
  ], pal: { h: '#3a2a1a', s: '#d9a27a', b: '#2a6ad0', j: '#d8c8a0', k: '#c02a2a', o: '#1a1a1a' } },
  golfcart: { rows: [
    '..kkkkkkkkkkkkkkkkkkkkkkkkkkk...........',
    '..kgggggggggggggggggggggggggk...........',
    '..k.k....................k..k...........',
    '..k.k.......hhh..........k..k...........',
    '..k.k......hsssh.........k..k...........',
    '..k.k......sssss.........k..k...........',
    '..k.k.....wwwwwww........k..k...........',
    'kkkkkkkkkkkwwwwwwwkkkkkkkkkkkkkkkkkkkk..',
    'kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk.',
    'kwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwwk',
    'kGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGk',
    'kkk...kkkkkkkkkkkkkkkkkkkkkkk...kkkkkkkk',
    '...ttt.........................ttt......',
    '...ttt.........................ttt......',
  ], pal: { k: '#1a1a1a', g: '#3a8a3a', w: '#f6f6f2', G: '#c8c8c0', h: '#e8e8e8', s: '#f0c8a8', t: '#2a2a2a' } },
  fx_star: { rows: ['..y..', '.yYy.', 'yYYYy', '.yYy.', '..y..'], pal: { y: '#f6d838', Y: '#fff8c0' }, outline: false },
  arrow: { rows: ['ww....', 'wWw...', 'wWWw..', 'wWWWw.', 'wWWWWw', 'wWWWw.', 'wWWw..', 'wWw...', 'ww....'], pal: { w: '#f0c818', W: '#fff6a0' } },
  heart: { rows: ['.rr.rr.', 'rRrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], pal: { r: '#e0303c', R: '#ff9aa0' } },
  bag: { rows: ['..kkkk..', '.k....k.', 'bbbbbbbb', 'bBbbbbbb', 'bBbbbbbb', 'bbbbbbbb'], pal: { k: '#6a4a2a', b: '#b88a4a', B: '#e0b870' } },
};

const cache = new Map<string, HTMLCanvasElement>();

export function artCanvas(name: string, flip = false): HTMLCanvasElement {
  const key = name + (flip ? ':f' : '');
  const hit = cache.get(key);
  if (hit) return hit;
  const a = ART[name];
  const w = Math.max(...a.rows.map((r) => r.length)), h = a.rows.length;
  const pad = a.outline === false ? 0 : 1;
  const c = document.createElement('canvas');
  c.width = w + pad * 2; c.height = h + pad * 2;
  const ctx = c.getContext('2d')!;
  const filled: boolean[][] = Array.from({ length: c.height }, () => Array(c.width).fill(false));
  a.rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch === '.' || ch === ' ') return;
    const xx = flip ? w - 1 - x : x;
    ctx.fillStyle = a.pal[ch] ?? '#f0f';
    ctx.fillRect(xx + pad, y + pad, 1, 1);
    filled[y + pad][xx + pad] = true;
  }));
  if (pad) {
    ctx.fillStyle = OUT;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      if (filled[y][x]) continue;
      if (filled[y]?.[x - 1] || filled[y]?.[x + 1] || filled[y - 1]?.[x] || filled[y + 1]?.[x]) ctx.fillRect(x, y, 1, 1);
    }
  }
  cache.set(key, c);
  return c;
}
