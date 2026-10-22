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

  // ------------------------------------------------------------------ destructibles
  bin: { rows: [
    '............hh............',
    '...........h..h...........',
    '..........l....l..........',
    '..hhhhhhhhhhhhhhhhhhhhhh..',
    '..lhhhhhhhhhhhhhhhhhhhhl..',
    '..llllllllllllllllllllll..',
    '..bbbbbbbbbbbbbbbbbbbbbb..',
    '..mmmmmmmmmmmmmmmmmmmmmm..',
    '...bbbbbbbbbbbbbbbbbbbb...',
    '...mmmmmmmmmmmmmmmmmmmm...',
    '....mmmmmmmmmmmmmmmmmm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmrhlmbhlmbhlmmhm....',
    '....hlmrrlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmrhlmmhm....',
    '....hlmbhlmbhlmbrlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '...bbbbbbbbbbbbbbbbbbbb...',
    '...mmmmmmmmmmmmmmmmmmmm...',
    '...kkkkkkkkkkkkkkkkkkkk...',
  ], pal: { h: '#e0e0e8', l: '#b8b8c4', b: '#909098', m: '#5e5e6a', k: '#2a2430', r: '#9a6236', w: '#f6f6f2' } },
  bin_dmg: { rows: [
    '............hh............',
    '....llllllllllllllllllllll',
    '...bbbbbbbbbbbbbbbbbbbbbb.',
    '...hhhhhhhhhhhhhhhhhhhhhh.',
    '...lllllllllllllllllllll..',
    '...bbbbbbbbbbbbbbbbbbbbb..',
    '....bbbbbbbbbbbbbbbbbbb...',
    '....bbbbbbbbbbbbbbbbbbb...',
    '....mmmmmmmmmmmmmmmmmmm...',
    '....kkkkkkkkkkkkkkkkkk....',
    '....kkmmmmmmmmmmmmmmkk....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbkkmbhlmbhlmmhm....',
    '....hlmbkkkbhlmbhlmmhm....',
    '....hlmbhkkmhlmbhlmmhm....',
    '....hlmrhlmbhlmbhlmmhm....',
    '....hlmrrlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhkmmhm....',
    '....hlmbhlmbhlmbhkmmhm....',
    '....hlmbhlmbhlmbklmmhm....',
    '....hlrbhlmbhlmbhkmmhm....',
    '....hlmrhlmbhlmbhkkmhm....',
    '....hlmbhlmbhlmbklmmhm....',
    '....hlmbhlmbhlmbhkmmhm....',
    '....hlmbhlmbhlmrhkmmhm....',
    '....hlmbhlmbhlmbklmmhm....',
    '....hlmbhlmbhlmbhkmmhm....',
    '....hlmbhlmbhlmbhkmrhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '....hlmbhlmbhlmbhlmmhm....',
    '...bbbbbbbbbbbbbbbbbbbb...',
    '...mmmmmmmmmmmmmmmmmmmm...',
    '...kkkkkkkkkkkkkkkkkkkk...',
  ], pal: { h: '#e0e0e8', l: '#b8b8c4', b: '#909098', m: '#5e5e6a', k: '#2a2430', r: '#9a6236', w: '#f6f6f2' } },
  bin_broken: { rows: [
    '................................................',
    '................................................',
    '................................................',
    '.....................m....................m...l.',
    '....................mkmmmmmmmmmmmmmmmmmmmmmm....',
    '...................mkklmhhhhhhhhhhhhhhhhhhhmm...',
    '..................mkmkkkmbbbbbbbbbbbbbbmbbbmmm..',
    '..................mmmmkkmmmmmmmmmmmmmmmmmmmmmm..',
    '..................mmmmkkmhhhhhhhhhhhhhhhhhhbmm..',
    '..................mmmmkkmbbbbbbbbbbbbbbbbbbbmm..',
    '........hhkhh.....mmmmkkmmmmmmmmmmmmmmmmmmmmmm..',
    '.........klk.....mmmmmmkkmhhhhhhhhhhhhhhhhhbbmm.',
    '.....bllllllkkkkkkmmmmkkmbbbbbbbbbbbbbbbbbbbmm..',
    '....blllllllllllb.mmmmkkmmmmmmmmmmmmmmmmmmmmmm..',
    '...bbblllllllllbbbmmmmkkmhhhhhhhhhhhhhhhhhhbmm..',
    '...mbbbbbblbbbbbbmmmmmkkmbbbbbbbbbbbbbbbbbbbmm..',
    '....mbbbbbbbbbbbm.mkmklkmmmmmmmmmmmmmmmmmmmmmm..',
    '....mmmmmmbmmmmmm..mkkkmkkkkkkkkkkkkkkkkkkmmm...',
    '.www..mmmmmmmmm.....mkmmmmmmmmmmmmmmmmmmmmmm....',
    '.wwww.....m..........m..........hhh.......m.....',
    '.wwww......................r....lll.............',
    '..........................rrr.......w...........',
  ], pal: { h: '#e0e0e8', l: '#b8b8c4', b: '#909098', m: '#5e5e6a', k: '#2a2430', r: '#9a6236', w: '#f6f6f2' } },
  crate: { rows: [
    '................................',
    '.nnnnnnnnnnnnnnnnnnnnnnnnnnnnnn.',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    '.wnnnnnnnnnnnnnnnnnnnnnnnnnnnnw.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wddddddddddddddddddddddddddddw.',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wddddddddddddddddddddddddddddw.',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wddddddddddddddddddddddddddddw.',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wnwWWWWWWWWWWWWWWWWWWWWWWWWwnw.',
    '.dddddddddddddddddddddddddddddd.',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '................................',
  ], pal: { W: '#c8904a', w: '#a8703a', d: '#7a4a22', k: '#4a2a12', n: '#e0c090' } },
  crate_dmg: { rows: [
    '................................',
    '.nnnnnnnnnnnnnnnnnnnnnnnnnnnnnn.',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    '.wnnnnknnnnnnnnnnnnnnnnnnnnnnnw.',
    '.wwwWWWkWWWWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWkWkWWWWWWWWWWWWWWWWWwww.',
    '.wwwWWWWWWWkWWWWWWWWWWWWWnWWwww.',
    '.wdddddddddkddddddddddddddddddw.',
    '.wwwwwwwwwwwkwwwwwwwwwwwwwwwwww.',
    '.wwwWWWWWWWWkWWWWWWWWWWWdWWWwww.',
    '.wwwWWWWWWWWWkWWWWWWWWddWWWWwww.',
    '.wwwWWWWWWWWWWWWWkWWddWWWWWWwww.',
    '.wwwWWWWWWWWWWkkkdkdWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWkdddkWWWWWWWWwww.',
    '.wddddddddddddkdddddkdddddddddw.',
    '.wwwwwwwwwwwwwwkdddkwwwwwwwwwww.',
    '.wwwWWWWWWWWWWWkkdkkWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWkWWWWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWkWWWWWWWwww.',
    '.wwwWWWWWWWWWWWWWWWWWkWWWWWWwww.',
    '.wwwWWnWWWWWWWWWWWWWWWkkWWWWwww.',
    '.wddddddddddddddddddddddkdddddw.',
    '.wwwwwwwwwwwwwwwwwwwwwwwwwwwwww.',
    '.wwwWWWWWWWWWWWWWWWWWWWWWWWWwww.',
    '.wkwWWWWWWWWWWWWWWWWWWWWWWWWwkw.',
    '.dddddddddddddddddddddddddddddd.',
    '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
    '................................',
  ], pal: { W: '#c8904a', w: '#a8703a', d: '#7a4a22', k: '#4a2a12', n: '#e0c090' } },
  crate_broken: { rows: [
    '......................................................',
    '..............................n.......................',
    '.................n............n.......................',
    '.................Wn...........n.......................',
    '.................wn...........n.......................',
    '..................Wn.........nW..........n............',
    '.........n........wn.........nw.........nW............',
    '.........Wn........Wn........n.........nWw............',
    '.........wWnn......wn........n........nWw.............',
    '..........wWWn......Wn.......n........nw..............',
    '...........wwWn.....wn......nW.......nW...............',
    '.............wWn.....Wn.....nw......nWw...............',
    '..............wWn....wWn....n..nnnnnWw................',
    '...nn..........wWnn...wn....n..WWWWWw............nn...',
    '...WWnnn........wWWn...nnnn.n..WWWWw..........nnnWW...',
    '...wwWWWnnn......wwWn..wwww.n..WWWW.........nnWWWww...',
    '.....wwwWWWnnn.....wWn.wwww.n..WWWW......nnnWWwww.....',
    '........wwwWWWnn....wWnwwwwnW..WWWW.n.nnnWWWww........',
    '...........wwwWWnnn..wWwwwwnw.nWWWWnnnnnnnnnnnnn......',
    '..............wwWWWnnnwwwwwn.nWWWWWWnWWWWWWWWWnW......',
    '......nnnnnn....wwwWWWnwwwwWnWnddddWWWWWWWWWWWWW......',
    '..WWWWWWWWWWnnnnnnnnnwWddddwnnWWwwwddddddddddddd......',
    '..wwwwwwwwwwdWWWWWWWWnnnnnnnWWwdw.....................',
    '............wwwwwwwwwWWWWWWWww.........d...........d..',
  ], pal: { W: '#c8904a', w: '#a8703a', d: '#7a4a22', k: '#4a2a12', n: '#e0c090' } },
  box: { rows: [
    '..............................',
    '..............................',
    '..............................',
    '.........CCCC.....CCCC........',
    '...CCCCCCCCCCCCCCCCCCCCCCCC...',
    '...cccccccccccccccccccccccc...',
    '..CCCCCCCCCCCtTTCCCCCCCCCCdd..',
    '..CCCCCCCCCCCtTTCCCCCCCCCCdd..',
    '..CCCCCCCCCCCtTTCCCCCCCCCCdd..',
    '..dddddddddddtTTdddddddddddd..',
    '..CCCCCCCCCCCtTTCCCCCCCCCCCC..',
    '..CCccccccccctTTccccccccccdd..',
    '..CCccccccccctTTccccccccccdd..',
    '..CCccccccccctTTccccccccccdd..',
    '..CCccccccccctTTccccccccccdd..',
    '..CCccccccccctTTccccccccccdd..',
    '..CCccccccccctTTccccccccccdd..',
    '..CCccccccccctTTccccccccccdd..',
    '..CCccccccccctTTccccccccccdd..',
    '..CCkkccccccctTTccccccccccdd..',
    '..CCckccccccctTTccccccccccdd..',
    '..CCccccccccctTTccccccccccdd..',
    '..CCccccccccctTTccccccccccdd..',
    '..dddddddddddtTTdddddddddddd..',
    '..kkkkkkkkkkkkkkkkkkkkkkkkkk..',
    '..............................',
  ], pal: { c: '#c89456', C: '#e0b276', d: '#9a6a38', k: '#6a3f1c', T: '#efe6c8', t: '#d8cfae' } },
  box_dmg: { rows: [
    '..............................',
    '..............................',
    '........................d.....',
    '........................d.....',
    '...................d...d......',
    '..................dCCCdCCCC...',
    '..ccccccccc.......ccccdccc....',
    '..CCCCCCCCCccccccccccccccc....',
    '..kkkkkkkkkdddddddd...........',
    '..CCcccccccccTTTccccccccccdd..',
    '..CCcccccccccTTTccccccccccdd..',
    '..CCcccccccccTTTcccccccdccdd..',
    '..CCcccccccccTkTccccccdcccdd..',
    '..CCcccccccccTTkcccccccdccdd..',
    '..CCcccccccccTTTcccccccdccdd..',
    '..CCcccccccccTTTccccckkkkcdd..',
    '..CCcccccccccTTTcccccddddcdd..',
    '..CCcccccccccTTTcccccddddcdd..',
    '..CCcccccccctttTcccccddddcdd..',
    '..CCcccccccccTTTcccccddddcdd..',
    '..CCcccccccccTTTccccccdcccdd..',
    '..CCcccccccccTTTccccccccccdd..',
    '..dddddddddddTTTdddddddddddd..',
    '..kkkkkkkkkkkTTTkkkkkkkkkkkk..',
    '..............................',
    '..............................',
  ], pal: { c: '#c89456', C: '#e0b276', d: '#9a6a38', k: '#6a3f1c', T: '#efe6c8', t: '#d8cfae' } },
  box_broken: { rows: [
    '......................................................',
    '......................................................',
    '....................C.................................',
    '.....................c................................',
    '..........cCTTTTCCCCCCCCCCCCC.......C.................',
    '.........cccccccccccccccccccc........c................',
    '........dddddddddddddddddddd.CCCCCCCCCCCCCCCCCCCCc....',
    '.............................cccccccccccccccccccccc...',
    '..............................dddddddddddddddddddddd..',
    '..cCCCCCCCCCCCCCCCCCCCC...............................',
    '.ccckkkkkkccccccccccccc........TTTCCCCCCCCCCCCCCCc....',
    'dddddddddddddddddddddd.........cccccccccccccccccccc...',
    '................................dddddddddddddddddddd..',
    '............cCCCCCCCCCCCCCCCC.........................',
    '...........cccccccccccccccccc.........................',
    '......d...dddddddddddddddddd..d..............d........',
    '....CC....................CC....................CC....',
    '......................................................',
  ], pal: { c: '#c89456', C: '#e0b276', d: '#9a6a38', k: '#6a3f1c', T: '#efe6c8', t: '#d8cfae' } },
  barrel: { rows: [
    '..........................',
    '.............W............',
    '......WWWWWWWwWWWWWWW.....',
    '....WWWwwwwdwwwdwwwwWWW...',
    '...WWwwwWWWdWWWdWWWwwwWW..',
    '...wWWWwwwwdwwwdwwwwWWWw..',
    '...MMMMMMMMMMMMMMMMMMMM...',
    '...mkkkkkkkkkkkkkkkkkkm...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWdWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...MMMMMMMMMMMMMMMMMMMM...',
    '...mkkkkkkkkkkkkkkkkkkm...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWddWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...MMMMMMMMMMMMMMMMMMMM...',
    '...mkkkkkkkkkkkkkkkkkkm...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '....dddddddddddddddddd....',
    '.....kkkkkkkkkkkkkkkk.....',
    '..........................',
  ], pal: { W: '#b87838', w: '#98602a', d: '#74441c', k: '#3a2210', M: '#a8a8b4', m: '#6a6a76', l: '#d0d0da', i: '#8ac8ff' } },
  barrel_dmg: { rows: [
    '..........................',
    '.............W............',
    '......WWWWWWWwWWWWWWW.....',
    '....WWWwwwwdwwwdwwwwWWW...',
    '...WWwwwWWWdWWWdWWWwwwWW..',
    '...wWWWwwwwdwwwdwwwwWWWw..',
    '...MMMMMMMMMMMMMMMMMMMM...',
    '...mkkkkkkkkkkkkkkkkkkm...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWkWWdd...',
    '...wwWwWWWwWWWwkkkddWdd...',
    '...wwWwWWWwWWWkWWdwWWdd...',
    '...wwWwWWWwWWWwddWwWWdd...',
    '...MMMMMMMMMMMMMMMMMMMM...',
    '...mkkkkkkkkkkkkkkkkkkm...',
    '...wwWwWWWwWWWwWWdkkWdd...',
    '...wwkkWWWwWWWwkdddkWdd...',
    '...wwWwWWWwWWWwdddddWdd...',
    '...wwWddWWwWWWkkdddkkdd...',
    '...wwWwWWWwWWWwkkdkkWdd...',
    '...wwWwWWWwWWWwkkkkkidd...',
    '...wwWwWWWwWWWwWWkwWidd...',
    '...wwWwWWWwWWWwWWiwWidd...',
    '...wwWwWWWwWWWwWWiwiWdd...',
    '...MMMMMMMMMMMMMiMMMMMM...',
    '...mkkkkkkkkkkkkkkkkkkm...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '...wwWwWWWwWWWwWWWwWWdd...',
    '....dddddddddddddddddd....',
    '.....kkkkkkkkkkkkkkkk.....',
    '..........................',
  ], pal: { W: '#b87838', w: '#98602a', d: '#74441c', k: '#3a2210', M: '#a8a8b4', m: '#6a6a76', l: '#d0d0da', i: '#8ac8ff' } },
  barrel_broken: { rows: [
    '............................................',
    '............................................',
    '..................W.........................',
    '.........W........W.........................',
    '.........wW.......W........W................',
    '..........Wk......W........W................',
    '..W.......kwwwwwwwwwwww...Ww................',
    '..wWW.....kMMMMMMMMMMMM...W.................',
    '...wwW....kllllllllllll..Ww........W........',
    '.....wWW..kkkWWWWwWWWdW..W.......WWw..l.....',
    '......wwWkkkkkWWWwWWWdW.Ww......WwwlllMlll..',
    '........wwkkkWWWWwWWWdW.W.....WWw.llMMMMMll.',
    '..........kkkWWWWwWWWdWWw...WWww...lllMlll..',
    '..........kkkWWWWwWWWdWW...Www.M......l.....',
    '..........kddddddddddddw.WWMMMMmMMMM.WWWWW..',
    '...........k..wwWwW.W.W.WwMMmmmmmmmMMwwwww..',
    '.....dd.........w.w.w.WWWWWMMMMmMMMMw.......',
    '.......d.....dd.......wwwww....M............',
  ], pal: { W: '#b87838', w: '#98602a', d: '#74441c', k: '#3a2210', M: '#a8a8b4', m: '#6a6a76', l: '#d0d0da', i: '#8ac8ff' } },
  mailbox: { rows: [
    '........................',
    '........................',
    '........................',
    '........................',
    '...........b...kkkkkg...',
    '...hhhhhhhhhhhhrrrrrg...',
    '.BBBBBBBBBBBBBBrrrrrgB..',
    '..bbbbbbbbbbbbbrrrrrg...',
    '..bbbbbbbbbbbbbbbbbbg...',
    '.bBBbbbbbbbbbbbbbbbbgd..',
    '..BBbbbbbbbbbbbbbbbbgd..',
    '..BBbhhhhhhhhhhhhhbbgd..',
    '..BBbBBBBBBBBBBBBBbbgd..',
    '..BBbBBBBBBBBdddBBbbdd..',
    '..BBbBBBBBBBBdddBBbbdd..',
    '..BBbBBBBBBBBBBBBBbbdd..',
    '..BBbkkkkkkkkkkkkkbbdd..',
    '..BBbbbbbbbbbbbbbbbbdd..',
    '..kkkkkkkkkkkkkkkkkkkk..',
    '..........bbbb..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bgkg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '.....gggggggggggggg.....',
    '.....gggggggggggggg.....',
    '.....kkkkkkkkkkkkkk.....',
  ], pal: { b: '#3a5ac0', B: '#5a7ac8', d: '#26386e', k: '#1a2444', h: '#9ab4e8', w: '#f6f6f2', r: '#e03a3a', g: '#8a8a94' } },
  mailbox_dmg: { rows: [
    '........................',
    '........................',
    '...............rrrrr....',
    '...............rrrrr....',
    '...........b...rrrrrg...',
    '...hhhhhhhhhhhrrrrrrg...',
    '.BBBBBBkkBdBBBBrrrrrgB..',
    '..bbbbdbkkkbbbbrrrrrg...',
    '..bbbbbbbkbbbbbbbbbbg...',
    '.bBBbbddddbbbbbbbbbbgd..',
    '..BBbbbbbbbbbbbbbbbbgd..',
    '..BBbbbbbbbbbbbbbbbbgd..',
    '..Bddddbbbbbbbbbbbbbgd..',
    '..BBBBBbbbbbbbbbbbbbdd..',
    '..BBBBBbbbbbbbbbbbbbdd..',
    '..BBBBBbbbbbbbbbbbbbdd..',
    '..BBBBBbbbbbbbbbbbbbdd..',
    '..Bkkkkbbbbbbbbbbbbbdd..',
    '..kkkkkkkkkkkkkkkkkkkk..',
    '..........bbbb..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bgkg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '..........Bggg..........',
    '.....gggggggggggggg.....',
    '.....gggggggggggggg.....',
    '.....kkkkkkkkkkkkkk.....',
  ], pal: { b: '#3a5ac0', B: '#5a7ac8', d: '#26386e', k: '#1a2444', h: '#9ab4e8', w: '#f6f6f2', r: '#e03a3a', g: '#8a8a94' } },
  mailbox_broken: { rows: [
    '............................................',
    '...................................kkkkk....',
    '...................................rrrrr....',
    '.............hhhhhhhhhhhhhhhhhhhh..rrrrr....',
    '.............BBBBBBBBBBBBBBBBBBBd...g.......',
    '......hhhhhhdbbbbbbbbbbbbbbbbbbbd..g........',
    '......BBBBBBdbbkkkkkkkkkkkkbbbbbd.g.........',
    '......BBBBBBdbbkwwwwkkkkkkkbbbbbd...........',
    '......BBwwwBdbbkwggwkkkkkkkbbbbbd...........',
    '......BBwwwBdbbkwwwwkwwwwkkbbbbbd...........',
    '......BBBBBBdbbkkkkkkwgwwkkbbbbbd...........',
    '......BBBBBBdbbkkkkkkwwwwkkbbbbbd...........',
    '......BBBBBBdbbkkkkkkkkkkkkbbbbbd...........',
    '......kkkkkkdbbbbbbbbbbbbbbbbbbbd...........',
    '.ggggg.......kkkkkkkkkkkkkkkkkkkd...........',
    '.wddww........ddddgddddddddddddd............',
    '.wwwww............gggg.......ggggg..........',
    '........gg.........gggg......wwwww..........',
  ], pal: { b: '#3a5ac0', B: '#5a7ac8', d: '#26386e', k: '#1a2444', h: '#9ab4e8', w: '#f6f6f2', r: '#e03a3a', g: '#8a8a94' } },

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
};

/** On-screen footprint of every hazard vehicle, in world pixels. The imported four-frame
 *  strips land at exactly these sizes (see tools/art/import_hazards.py), the renderer draws
 *  into the box, and the simulation's hitW matches it, so the art, the danger and the
 *  collision are one thing. A ~68px fighter is the yardstick. */
export const HAZARD_SIZE: Record<string, [number, number]> = {
  taxi: [112, 76],
  tram: [89, 107],
  bike: [72, 79],
  golfcart: [70, 65],
  delivery: [53, 56],
};

/** Footprint a hazard's art is drawn into; unknown kinds fall back to taxi-ish proportions. */
export function hazardSize(kind: string): [number, number] {
  return HAZARD_SIZE[kind] ?? [80, 44];
}

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

/** The imported four-frame hazard strips (the artist pages), keyed by hazard kind. */
const HAZARD_SHEETS = ['golfcart', 'taxi', 'tram', 'bike', 'delivery'];

/** Load the food icons and every hazard sprite strip. Items are sliced into standalone 18px
 *  canvases so the rest of the renderer can keep asking artCanvas() for a name. */
export async function loadProps(base: string): Promise<void> {
  const load = async (name: string) => {
    const [meta, img] = await Promise.all([
      fetch(`${base}${name}.json`).then((r) => r.json()),
      loadImage(`${base}${name}.png`),
    ]);
    return { meta, img };
  };
  const [items, ...strips] = await Promise.all([load('items'), ...HAZARD_SHEETS.map(load)]);

  const [icw, ich] = items.meta.cell as [number, number];
  (items.meta.ids as string[]).forEach((id, i) => {
    const cv = document.createElement('canvas'); cv.width = icw; cv.height = ich;
    cv.getContext('2d')!.drawImage(items.img, i * icw, 0, icw, ich, 0, 0, icw, ich);
    itemTiles.set(id, cv);
  });

  HAZARD_SHEETS.forEach((name, i) => {
    const strip = strips[i];
    const cell = strip.meta.cell as [number, number];
    props.set(name, { img: strip.img, cell, count: strip.meta.count, flipped: mirrorStrip(strip.img, cell, strip.meta.count) });
  });
}

/** A frame of an imported strip (the hazard vehicles), for drawing in the world. */
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
