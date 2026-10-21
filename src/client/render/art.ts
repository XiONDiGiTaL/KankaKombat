// Hand-authored pixel maps for food, money, props (three states each), vehicles and
// HUD portraits. Rasterised once into cached canvases with the same 1px near-black
// outline as the character sprites, on a limited palette.

const OUT = '#1a1220';

export interface PixelArt { rows: string[]; pal: Record<string, string>; outline?: boolean }

export const ART: Record<string, PixelArt> = {
  // ------------------------------------------------------------------ food
  lahmacun: { rows: [
    '....llllllll....',
    '..llllrrrrllll..',
    '.llrrrrggrrrrll.',
    'llrrgrrrrrrrgrrl',
    'lrrrrrrgrrrrrrrl',
    'lrrrgrrrrrrgrrrl',
    'llrrrrrrrgrrrrll',
    '.llrrrgrrrrrrll.',
    '..llllrrrrllll..',
    '....llllllll....',
  ], pal: { l: '#e8c07a', r: '#c85a2a', g: '#5aa83a' } },
  ayran: { rows: [
    '..wwwwwwww..',
    '.wWWWWWWWWw.',
    '.wwwwwwwwww.',
    '.wbbbbbbbbw.',
    '.wbbbbbbbbw.',
    '.wBBBBBBBBw.',
    '.wwwwwwwwww.',
    '.wWWWWWWWWw.',
    '.wwwwwwwwww.',
    '.wWWWWWWWWw.',
    '..wwwwwwww..',
    '...wwwwww...',
  ], pal: { w: '#f6f6f2', W: '#d4d8e0', b: '#5ab0e8', B: '#a8d8f8' } },
  nutella: { rows: [
    '..wwwwwwww..',
    '.wWWWWWWWWw.',
    '.wwwwwwwwww.',
    '.bbbbbbbbbb.',
    '.bwwwwwwwwb.',
    '.bwrrwwrrwb.',
    '.bwrrrrrrwb.',
    '.bwnnnnnnwb.',
    '.bwwwwwwwwb.',
    '.bbbbbbbbbb.',
    '..bbbbbbbb..',
  ], pal: { w: '#f6f2ea', W: '#c8c0b4', b: '#5a2e14', r: '#d0202c', n: '#2a1206' } },
  banana: { rows: [
    '.......kky..',
    '......kyyy..',
    '.....kyyyY..',
    '....kyyyY...',
    '...kyyyY....',
    '..kyyyY.....',
    '.kyyyY..yyy.',
    'kyyyY..kyyyk',
    'kyYY..kyyyY.',
    '.kk..kyyyY..',
    '.....kkkk...',
  ], pal: { y: '#f6d838', Y: '#c8a820', k: '#6a4a1a' } },
  baklava: { rows: [
    '..ggghhhhggg..',
    '.ghhGhhhhGhhg.',
    'hhhhhhhhhhhhhh',
    'dDdddddddddddD',
    'dDDDDDDDDDDDDd',
    '.dDdddddddddD.',
    '..DDDDDDDDDD..',
  ], pal: { g: '#5aa83a', h: '#e8b04a', G: '#f6d87a', d: '#d89a3a', D: '#a8682a' } },
  sujuk: { rows: [
    '..rrrrrrrr..',
    '.rRRrrrrRRr.',
    'rRrrwrrrrrRr',
    'rRrrrrrrwrrr',
    'rrwrrrrrrrRr',
    'rRrrrrwrrrrr',
    '.rRrrrrrrRr.',
    '..rrrrrrrr..',
  ], pal: { r: '#a8282c', R: '#6a1216', w: '#e8c8a8' } },
  coinUSD: { rows: ['.ggggg.', 'gYYYgGg', 'gYGgGGg', 'gGGGGGg', 'gGGGGGg', 'gGGGGGg', '.ggggg.'], pal: { g: '#a87a10', G: '#d8a820', Y: '#fff0a0' } },
  coinTRY: { rows: ['.ggggg.', 'gYYYgGg', 'gYggGGg', 'gGGGGGg', 'gGgGGGg', 'gGGGGGg', '.ggggg.'], pal: { g: '#a87a10', G: '#e8b820', Y: '#fff0a0' } },
  fx_star: { rows: ['..y..', '.yYy.', 'yYYYy', '.yYy.', '..y..'], pal: { y: '#f6d838', Y: '#fff8c0' }, outline: false },
  heart: { rows: ['.rr.rr.', 'rRrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], pal: { r: '#e0303c', R: '#ff9aa0' } },
  bag: { rows: ['..kkkk..', '.k....k.', 'bbbbbbbb', 'bBbbbbbb', 'bBbbbbbb', 'bbbbbbbb'], pal: { k: '#6a4a2a', b: '#b88a4a', B: '#e0b870' } },
  cursor: { rows: ['y....', 'yy...', 'yyy..', 'yyyy.', 'yyy..', 'yy...', 'y....'], pal: { y: '#f0c818' }, outline: true },

  // ------------------------------------------------------------------ destructibles: bin
  bin: { rows: [
    '............hhhh............',
    '...kkkkkkkkkhhhhkkkkkkkkk...',
    '....hbbhbbhbbhbbhbbhbbh.....',
    '....bmbbmbbmbbmbbmbbmbbm....',
    '...kkkkkkkkkkkkkkkkkkkkkk...',
    '...kkkkkkkkkkkkkkkkkkkkkkk..',
    '...mmhlhhllblbbbbmbmmmkmkk..',
    '...mmhlhhllblbbbbmbmmmkmkk..',
    '...mmhlhhllblbbbbmbmmmkmkk..',
    '...mmhlhhrlblbbbbmbmmmkmkk..',
    '.kkmmhlhhlrblbbbbmbmmmkmkkk.',
    '.mkmmhlhhllblbbbbmbmmmkmkkm.',
    '.kk.mmhlhlllbbbbmbbmmkmkkkk.',
    '....mmhlhlllbbbbmbbmmkmkk...',
    '....mmhlhlllbbbbmbbmmkmkk...',
    '....mmhlhlllbbbbmbbrmkmkk...',
    '....mmhlhlllbbbbmbbmrkmkk...',
    '....mmhlhlllbbbbmbbmmkmkk...',
    '....mmhlhhllbbbbmbbmmkmkk...',
    '....mmhlhhllbbbbmbbmmkmkk...',
    '....mmhlrhllbbbbmbbmmkmkk...',
    '....mmhlhhllbbbbmbbmmkmkk...',
    '....mmhlhhllbbbbmbbmmkmkk...',
    '....mmhlhhllbbbbmbbmmkmkk...',
    '.....mhhlhlllmbmbbmmkmmk....',
    '.....mhrlhlllmbmbbmmkmmk....',
    '.....mhhlhlllmbmbbrmkmmk....',
    '.....mmhlhlllmbmbbmmkmkk....',
    '.....mmhlhlllmbmbbmmkmkk....',
    '.....mmhlhlllmbmbbmmkmkk....',
    '.....mmhlhlllmbmbbmmkmkk....',
    '.....kkkkkkkkkkkkkkkkkk.....',
    '.....kkkkkkkkkkkkkkkkkk.....',
    '.......kkkk......kkkk.......',
    '.......kkkk......kkkk.......',
  ], pal: { k: '#1a1220', m: '#4a4a54', b: '#6a6a76', l: '#9a9aa6', h: '#c8c8d2', r: '#8a5a3a' } },
  bin_dmg: { rows: [
    '............hhhh............',
    '...kkkkkkkkkhhhhkkkkkkkkk...',
    '....hbbhbbhbbhbbhbbhbbh.....',
    '....bmbbmbbmbbmbbmbbmbbm....',
    '...kkkkkkkkkkkkkkkkkkkkkk...',
    '...kkkkkkkkkkkkkkkkkkkkkkk..',
    '...mmhlhhllblbbbbmbmmmkmkk..',
    '...mmhlhhllblbbbkmbmmmkmkk..',
    '...mmhlhhllblbbbbmbmmmkmkk..',
    '...mmhlhhrlblbbbkmbmmmkmkk..',
    '.kkmmhlhhlrblbbbbmbmmmkmkkk.',
    '.mkmmhlhhllblbbbkmbmmmkmkkm.',
    '.kk.mmhlhlllbbbbmbbmmkmkkkk.',
    '....mmhlhlllbbbbmbbmmkkkk...',
    '....mmhlhlllbbbbmbbmmkmkk...',
    '....mmhlhlllbbbbmbbrmkkkk...',
    '....mmhlhlllbbbbmbbmrkmkk...',
    '....mmhlhlllbbbbmbbmmkkkk...',
    '....mmhlhhlkbbbbmbbmmkmkk...',
    '....mmhlhkkkkkbbmbbmmkkkk...',
    '....mmhlrkkkrkbbmbbmmkmkk...',
    '....mmhlhkkkrkkbmbbmmkkkk...',
    '....mmhlhkkkkrbbmbbmmkmkk...',
    '....mmhlhkkkkkbbmbbmmkmkk...',
    '.....mhhlhlklmbmbbmmkmmk....',
    '.....mhrlhlllmbmbbmmkmmk....',
    '.....mhhlhlllmbmbbrmkmmk....',
    '.....mmhlhlllmbmbbmmkmkk....',
    '.....mmhlhlllmbmbbmmkmkk....',
    '.....mmhlhlllmbmbbmmkmkk....',
    '.....mmhlhlllmbmbbmmkmkk....',
    '.....kkkkkkkkkkkkkkkkkk.....',
    '.....kkkkkkkkkkkkkkkkkk.....',
    '.......kkkk......kkkk.......',
    '.......kkkk......kkkk.......',
  ], pal: { k: '#1a1220', m: '#4a4a54', b: '#6a6a76', l: '#9a9aa6', h: '#c8c8d2', r: '#8a5a3a' } },
  bin_broken: { rows: [
    '..mm......mm..',
    '.mMMm....mMMm.',
    '..gg..gg..gg..',
    '.gGg.gGGg.gGg.',
    'gGgg.gGGg.ggGg',
    'gg.g.gGgg.g.gg',
    '..gGg.gg.gGg..',
    '...gg....gg...',
  ], pal: { m: '#5a5a64', M: '#9a9aa4', g: '#6a6a74', G: '#a4a4ae' } },

  // ------------------------------------------------------------------ crate
  crate: { rows: [
    '..............................',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '.kdWWWWWWWWWWWWWWWWWWWWWWWWdk.',
    '.kdnnWWWWWWWWWWWWWWWWWWWWWnnk.',
    '.kdWWWWWWWWWWWWWWWWWWWWWWWWdk.',
    '.kdWWWWWWWWWWWWWWWWWWWWWWWWdk.',
    '.kdWddWWWWWWWWWWWWWWWWWWddWdk.',
    '.kdWWddWWWWWWWWWWWWWWWWddWWdk.',
    '.kdWWWddWWWWWWWWWWWWWWddWWWdk.',
    '.kddddddddddddddddddddddddddk.',
    '.kdWWWWWWddWWWWWWWWddWWWWWWdk.',
    '.kdwwwwwwwddwwwwwwddwwwwwwwdk.',
    '.kdwwwwwwwwddwwwwddwwwwwwwwdk.',
    '.kdnnwwwwwwwddwwddwwwwwwwwnnk.',
    '.kdwwwwwwwwwwwddwwwwwwwwwwwdk.',
    '.kddddddddddddddddddddddddddk.',
    '.kdWWWWWWWWWddWWddWWWWWWWWWdk.',
    '.kdWWWWWWWWddWWWWddWWWWWWWWdk.',
    '.kdWWWWWWWddWWWWWWddWWWWWWWdk.',
    '.kdWWWWWddWWWWWWWWWWddWWWWWdk.',
    '.kdWWWWddWWWWWWWWWWWWddWWWWdk.',
    '.kddddddddddddddddddddddddddk.',
    '.kdWWddWWWWWWWWWWWWWWWWddWWdk.',
    '.kdwddwwwwwwwwwwwwwwwwwwddwdk.',
    '.kdwwwwwwwwwwwwwwwwwwwwwwwwdk.',
    '.kddddddddddddddddddddddddddk.',
    '.kknnkkkkkkkkkkkkkkkkkkkkknnk.',
    '..............................',
  ], pal: { k: '#1a1220', w: '#a8703a', W: '#c8904a', d: '#7a4a22', n: '#e0c090' } },
  crate_dmg: { rows: [
    '..............................',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '.kdWWWWWWWWWWWWWWWWWWWWWWWWdk.',
    '.kdnnWWWWWWWWWWWWWWWWWWWWWnnk.',
    '.kdWWWWWWWWWWWWWWWWWWWWWWWWdk.',
    '.kdWWWWWWWWWWWWWWWWWWWWWWWWdk.',
    '.kdWddWWWWWWWWWWWWWWWWWWddWdk.',
    '.kdWWddWWWWWWWWWWWWWWWWddWWdk.',
    '.kdWWWddWWWWWWWWWWWWWWddWWWdk.',
    '.kddddddddddddddddddddddddddk.',
    '.kdWWWWWWddWWWkkkWWddWWWWWWdk.',
    '.kdwwwwwwwddkkkkkkkdwwwwwwwdk.',
    '.kdwwwwwwdwdkkkkkkkwwwwwwwwdk.',
    '.kdnnwwwwwwkkkkkkkkkwwwwwwnnk.',
    '.kdwwwwwwwwwkkkkkkkwwwwwwwwdk.',
    '.kddddddddddkkkkkkkdddddddddk.',
    '.kdWWWWWWWWWddkkkdWWdWWWWWWdk.',
    '.kdWWWWWWWWddWWWWddWWdWWWWWdk.',
    '.kdWWWWWWWddWWWWWWddWWWWWWWdk.',
    '.kdWWWWWddWWWWWWWWWWddWWWWWdk.',
    '.kdWWWWddWWWWWWWWWWWWddWWWWdk.',
    '.kddddddddddddddddddddddddddk.',
    '.kdWWddWWWWWWWWWWWWWWWWddWWdk.',
    '.kdwddwwwwwwwwwwwwwwwwwwddwdk.',
    '.kdwwwwwwwwwwwwwwwwwwwwwwwwdk.',
    '.kddddddddddddddddddddddddddk.',
    '.kknnkkkkkkkkkkkkkkkkkkkkknnk.',
    '..............................',
  ], pal: { k: '#1a1220', w: '#a8703a', W: '#c8904a', d: '#7a4a22', n: '#e0c090' } },
  crate_broken: { rows: [
    '...l....l....l..',
    '..lDl..lDl..lDl.',
    '.l...l.l..l.l..l',
    'l..l...l...l...l',
    '..l..l..l..l..l.',
    '.l..l..l..l..l..',
    'l....l....l....l',
  ], pal: { l: '#b87a3a', D: '#8a5224' } },

  // ------------------------------------------------------------------ cardboard box
  box: { rows: [
    '............................',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '.kddddCCCCCCtTTtCCCCCCddddk.',
    '.kddddddddddtTTtddddddddddk.',
    '.kddddddddddtTTtddddddddddk.',
    '.kddddddddddtTTtddddddddddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kccCCCCCCcctTTtccccccccddk.',
    '.kccCddddCcctTTtccccccccddk.',
    '.kccCddddCcctTTtccccccccddk.',
    '.kccCddddCcctTTtccccccccddk.',
    '.kccCCCCCCcctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kccddddddcctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kddddddddddddddddddddddddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '............................',
  ], pal: { k: '#1a1220', c: '#c89456', C: '#e0b276', d: '#9a6a38', t: '#d8cfae', T: '#efe6c8' } },
  box_dmg: { rows: [
    '............................',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '.kddddCCCCCCtTTtCCCCCCddddk.',
    '.kddddddddddtTTtddddddddddk.',
    '.kddddddddddtTTtddddddddddk.',
    '.kddddddddddtTTtddddddddddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtckkkkkdcddk.',
    '.kccCCCCCCcctTTtckkkkkdcddk.',
    '.kccCddddCcctTTtckkkkkdcddk.',
    '.kccCddddCcctTTtckkkkkdcddk.',
    '.kccCddddCcctTTtckkkkkdcddk.',
    '.kccCCCCCCcctTTtckkkkkdcddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kccddddddcctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kddddddddddddddddddddddddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kcccccccccctTTtccccccccddk.',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '............................',
  ], pal: { k: '#1a1220', c: '#c89456', C: '#e0b276', d: '#9a6a38', t: '#d8cfae', T: '#efe6c8' } },
  box_broken: { rows: [
    '..ll...ll..ll..',
    '.l..l.l..l.l..l',
    'l....l....l....l',
    '.l..l..l....l..',
    '..ll....ll.....',
  ], pal: { l: '#c08a4a', L: '#d8a86a' } },

  // ------------------------------------------------------------------ barrel
  barrel: { rows: [
    '..........................',
    '..........hhhhhhhhh.......',
    '......hhhdddddddddddhhh...',
    '....kkhhdddddddddddddhhkk.',
    '....hhkkkkkkkkhkkkkkkkkmm.',
    '....hhhhRRRRbbkbbbmmmmmmm.',
    '....hhhhRRRRbbbbbbmmmmmmm.',
    '....mmmmmmmmmmmmmmmmmmmmm.',
    '...hkkkkkkkkkkkkkkkkkkkkkm',
    '...hhhhhRRRRbbbbbbbmmmmmmm',
    '...hhhhhRRRRbbbbbbbmmmmmmm',
    '...hhhhhrRRRbbbbbbbmmmmmmm',
    '...hhhhhRrRRbbbbbbbmmmmmmm',
    '...hhhhhrRRRbbbbbbbmmmmmmm',
    '..hhhhhRRRRRbbbbbbbmmmmmmm',
    '..hhhhhRRRRRbbbbbbbmmmmmmm',
    '..hhhhhRRRRRbbbbbbbmmmmmmm',
    '..mmmmmmmmmmmmmmmmmmmmmmmm',
    '..kkkkkkkkkkkkkkkkkkkkkkkk',
    '..hhhhhRRRRRbbbbbbbmmmmmmm',
    '..hhhhhRRRRRbbbbbbbmmmmmmm',
    '..hhhhhRRRRRbbbbbbrmmmmmmm',
    '..hhhhhRRRRRbbbbbbbrmmmmmm',
    '...hhhhhRRRRbbbbbbrmmmmmmm',
    '...hhhhhRRRRbbbbbbbmmmmmmm',
    '...hhhhrRRRRbbbbbbbmmmmmmm',
    '...hhhrhRRRRbbbbbbbmmmmmmm',
    '...hhhhhRRRRbbbbbbbmmmmmmm',
    '...mmmmmmmmmmmmmmmmmmmmmmm',
    '...kkkkkkkkkkkkkkkkkkkkkkk',
    '....hhhhRRRRbbbbbbmmmmmmm.',
    '....hhhhRRRRbbbbbbmmmmmmm.',
    '....hhhhRRRRbbbbbbmmmmmmm.',
    '.....hhhRRRRbbbbbbmmmmmmm.',
    '..........................',
    '..........................',
  ], pal: { k: '#1a1220', m: '#5a6a78', b: '#7a8a98', R: '#8a9aa8', h: '#aab8c4', l: '#c8d4dc', r: '#8a5a3a', d: '#2a3038' } },
  barrel_dmg: { rows: [
    '..........................',
    '..........hhhhhhhhh.......',
    '......hhhdddddddddddhhh...',
    '....kkhhdddddddddddddhhkk.',
    '....hhkkkkkkkkhkkkkkkkkmm.',
    '....hhhhRRRRbbkbbbmmmmmmm.',
    '....hhhhRRRRbbbbbbmmmmmmm.',
    '....mmmmmmmmmmmmmmmmmmmmm.',
    '...hkkkkkkkkkkkkkkkkkkkkkm',
    '...hhhhhRkRRbbbbbbbmmmmmmm',
    '...hhhhhRkRRbbbbbbbmmmmmmm',
    '...hhhhhrkRRbbbbbbbmmmmmmm',
    '...hhhhhRkRRbbbbbbbmmmmmmm',
    '...hhhhhrkRRbbbbbbbmmmmmmm',
    '..hhhhhRRkRRbbbbbbbmmmmmmm',
    '..hhhhhRRRRRbbbbbbbmmmmmmm',
    '..hhhhhRRRRRbbbbbbbmmmmmmm',
    '..mmmmmmmmmmmmmmmmmmmmmmmm',
    '..kkkkkkkkkkkkkkkkkkkkkkkk',
    '..hhhhhRRRRRbbbkkrkkmmmmmm',
    '..hhhhhRRRRRbbkkrrrkkmmmmm',
    '..hhhhhRRRRRbbkrrrrrkmmmmm',
    '..hhhhhRRRRRbbkrrrrrkmmmmm',
    '...hhhhhRRRRbkrrrrrrrkmmmm',
    '...hhhhhRRRRbbkrrrrrkmmmmm',
    '...hhhhrRRRRbbkrrrrrkmmmmm',
    '...hhhrhRRRRbbkkrrrkkmmmmm',
    '...hhhhhRRRRbbbkkrkkmmmmmm',
    '...mmmmmmmmmmmmmmkmmmmmmmm',
    '...kkkkkkkkkkkkkkkkkkkkkkk',
    '....hhhhRRRRbbbbbbmmmmmmm.',
    '....hhhhRRRRbbbbbbmmmmmmm.',
    '....hhhhRRRRbbbbbbmmmmmmm.',
    '.....hhhRRRRbbbbbbmmmmmmm.',
    '..........................',
    '..........................',
  ], pal: { k: '#1a1220', m: '#5a6a78', b: '#7a8a98', R: '#8a9aa8', h: '#aab8c4', l: '#c8d4dc', r: '#8a5a3a', d: '#2a3038' } },
  barrel_broken: { rows: [
    '..bb......bb..',
    '.bBBb....bBBb.',
    'bb..bb..bb..bb',
    '.b..bbbb..bb..',
    '..bb....bb....',
    '.bb..bb..bb...',
    'bb..bBBb..bb..',
  ], pal: { b: '#a8642a', B: '#d0904a' } },

  // ------------------------------------------------------------------ mailbox
  mailbox: { rows: [
    '....................',
    '....................',
    '....................',
    '..........b.........',
    '...BBBBBBBBBBBBBB...',
    '....bbbbbbbbbbbbb...',
    '..kkbbbbbbbbbbbbbk..',
    '..kbbbbbbbbbbbbbbb..',
    '..kBbbbbbbbbbbbbkrr.',
    '..kBbbbbbbbbbbbbkrr.',
    '..kBbbbbbbbbbbbdkk..',
    '..kBbbbbbbbbbbddkk..',
    '..kBbbbbbbbbbbddkk..',
    '..kBbbbbbbbbbbddkk..',
    '..kBbdddddddddddkk..',
    '..kBbBBBBBBBBBBdbk..',
    '..kBbBBBBhhBBBBdbk..',
    '..kBbBBBBBBBBBBdbk..',
    '..kkkkkkkkkkkkkkkk..',
    '....................',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '......kkkkkkkk......',
    '....................',
  ], pal: { k: '#1a1220', b: '#3a5aa8', B: '#5a7ac8', d: '#2a3f78', h: '#c8d4e8', w: '#8a8a94', r: '#e03a3a' } },
  mailbox_dmg: { rows: [
    '....................',
    '....................',
    '....................',
    '..........b.........',
    '...BBBBBBBBBBBBBB...',
    '....bbbbbbbbdbbbb...',
    '..kkbbbbbbbbdbbbbk..',
    '..kbbbbbbbbbdbbbbb..',
    '..kBbbkkkkkkdbbbkrr.',
    '..kBbbkkkkkddbbbkrr.',
    '..kBbbkkkkkkdbbdkk..',
    '..kBbbkkkkkkdbddkk..',
    '..kBbbkkkkkkbbddkk..',
    '..kBbbbbbbbbbbddkk..',
    '..kBbdddddddddddkk..',
    '..kBbBBBBBBBBBBdbk..',
    '..kBbBBBBhhBBBBdbk..',
    '..kBbBBBBBBBBBBdbk..',
    '..kkkkkkkkkkkkkkkk..',
    '....................',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '........Bddd........',
    '......kkkkkkkk......',
    '....................',
  ], pal: { k: '#1a1220', b: '#3a5aa8', B: '#5a7ac8', d: '#2a3f78', h: '#c8d4e8', w: '#8a8a94', r: '#e03a3a' } },
  mailbox_broken: { rows: [
    '..............',
    '..bbbbbb......',
    '.bBBBBBb..bb..',
    'bBBBBBBBbbBBb.',
    '.bbbbbbbbBBBb.',
    '..bBBb..bbbb..',
    '.bBBBBb.......',
    'bb....bb......',
  ], pal: { b: '#2a3a7a', B: '#3a5ac0' } },

  debris: { rows: ['l.....b..l', '.lb..l..b.', 'b..l..lb..'], pal: { l: '#c8904a', b: '#7a4a22' } },
  sparkle: { rows: ['..y..', '.yYy.', 'yYYYy', '.yYy.', '..y..'], pal: { y: '#fff6c0', Y: '#ffffff' }, outline: false },
  arrow: { rows: ['yy....', 'yYy...', 'yYYy..', 'yYYYy.', 'yYYYYy', 'yYYYy.', 'yYYy..', 'yYy...', 'yy....'], pal: { y: '#c89a08', Y: '#f0c818' } },

  // ------------------------------------------------------------------ HUD portraits (front busts)
  portrait_bt: { rows: [
    '...hhhhhhhhhh...',
    '..hhhhhhhhhhhh..',
    '.hhhhHhhhhhhhhh.',
    'hhhhhHhhhhhhhhhh',
    'hhhhHhhhhhhhhhhh',
    'hhhHhhhssssshhhh',
    'hhhHhhssssssshhh',
    'hhhHhhsseessshhh',
    'hhhHhhsseessshhh',
    'hhhHhhssssssshhh',
    'hhhHhhssmmssshhh',
    'hhhHhhssssssshhh',
    'hhhHhhhssssshhhh',
    'hhhHhhhhssshhhhh',
    'hhhHhhhhhhhhhhhh',
    'hhHhhhhhhhhhhhhh',
    '.hhhhhhhhhhhhhh.',
    '..hhhhhhhhhhhh..',
  ], pal: { h: '#3d2217', H: '#24130c', s: '#f2c29c', e: '#2a1a14', m: '#c4505c' } },
  portrait_sc: { rows: [
    '..hhh.hhhhhhhh..',
    '.hhhhhhhhhhhhhh.',
    'hhhhjhhhhhhhhhhh',
    'hhhhhhhhjhhhhhhh',
    'hhHhhhhhhhhhhhhh',
    'hhHhhhhhssssshhh',
    'hhHhhhhssssssshh',
    'hhHhhhsseesssshh',
    'hhHhhhsseesssShh',
    'hhHhhhsssssssShh',
    'hhHhhhsssmmssShh',
    'hhHhhhsddddddShh',
    'hhHhhhsddddddShh',
    'hhHhhhhddddddhhh',
    'hhHhhhhhddddhhhh',
    'hhHhhhhhhhhhhhhh',
    '.hhhhhhhhhhhhhh.',
    '..hhhhhhhhhhhh..',
  ], pal: { h: '#1c1412', H: '#0d0908', j: '#46342a', s: '#c48a5c', S: '#9c6640', e: '#f6f2ea', m: '#7a3a34', d: '#2a1c15' } },

  // ------------------------------------------------------------------ vehicles / hazards
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
};

/** Resolve a destructible's art for its current hit state. */
export function propArt(kind: string, hp: number, maxHp = 3): string {
  if (hp <= 0) return `${kind}_broken`;
  if (hp < maxHp - 1) return `${kind}_dmg`;
  return kind;
}

const cache = new Map<string, HTMLCanvasElement>();

// ---------------------------------------------------------------- imported props
// The food icons and the golf cart come from the artists' pages (tools/art/import_props.py)
// rather than the pixel maps above, so they are loaded as small atlases at boot.
export interface PropFrame { img: HTMLImageElement | HTMLCanvasElement; sx: number; sy: number; w: number; h: number }

interface PropSheet { img: HTMLImageElement; cell: [number, number]; count: number; flipped: HTMLCanvasElement }
const props = new Map<string, PropSheet>();
const itemTiles = new Map<string, HTMLCanvasElement>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error('failed to load ' + src)); i.src = src; });
}

function mirrorStrip(img: HTMLImageElement, cell: [number, number], count: number): HTMLCanvasElement {
  const [cw, ch] = cell;
  const cv = document.createElement('canvas'); cv.width = img.width; cv.height = img.height;
  const c = cv.getContext('2d')!;
  for (let i = 0; i < count; i++) {
    const sx = i * cw;
    c.save(); c.translate(sx + cw, 0); c.scale(-1, 1); c.drawImage(img, sx, 0, cw, ch, 0, 0, cw, ch); c.restore();
  }
  return cv;
}

/** Load the food icons and the golf cart. Items are sliced into standalone 18px canvases so
 *  the rest of the renderer can keep asking artCanvas() for a name. */
export async function loadProps(base: string): Promise<void> {
  const load = async (name: string) => {
    const [meta, img] = await Promise.all([
      fetch(`${base}${name}.json`).then((r) => r.json()),
      loadImage(`${base}${name}.png`),
    ]);
    return { meta, img };
  };
  const [items, cart] = await Promise.all([load('items'), load('golfcart')]);

  const [icw, ich] = items.meta.cell as [number, number];
  (items.meta.ids as string[]).forEach((id, i) => {
    const cv = document.createElement('canvas'); cv.width = icw; cv.height = ich;
    cv.getContext('2d')!.drawImage(items.img, i * icw, 0, icw, ich, 0, 0, icw, ich);
    itemTiles.set(id, cv);
  });

  const cell = cart.meta.cell as [number, number];
  props.set('golfcart', { img: cart.img, cell, count: cart.meta.count, flipped: mirrorStrip(cart.img, cell, cart.meta.count) });
}

/** A frame of a multi-frame prop (currently only the golf cart), for drawing in the world. */
export function propFrame(name: string, frame: number, flip = false): PropFrame | null {
  const p = props.get(name);
  if (!p) return null;
  const [cw, ch] = p.cell;
  const i = ((frame % p.count) + p.count) % p.count;
  return { img: flip ? p.flipped : p.img, sx: i * cw, sy: 0, w: cw, h: ch };
}

/** Draw an imported item icon at a size that is not a whole multiple of its tile. */
export function drawItem(c: CanvasRenderingContext2D, id: string, x: number, y: number, w: number, h: number): void {
  const a = artCanvas(id);
  const was = c.imageSmoothingEnabled;
  c.imageSmoothingEnabled = true;
  c.drawImage(a, x, y, w, h);
  c.imageSmoothingEnabled = was;
}

export function artCanvas(name: string, flip = false): HTMLCanvasElement {
  const key = name + (flip ? ':f' : '');
  const hit = cache.get(key);
  if (hit) return hit;
  const imported = itemTiles.get(name);
  if (imported) { cache.set(key, imported); return imported; }
  const a = ART[name] ?? ART.debris;
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
  cache.set(name, c);
  return c;
}
