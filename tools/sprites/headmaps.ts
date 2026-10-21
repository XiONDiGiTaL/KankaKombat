// Hand-authored hero heads. Each map is drawn 1:1 into a 20x22 box; the rig places the box
// on the neck joint and the expression pass repaints the eye / mouth pixels for hit, shout,
// blink and KO frames.
//
// Layout rule that matters: row 21 is the neck joint, so everything below the jaw (rows 15+)
// must be neck skin in `front`. Hair falls live in `back`, which is drawn behind the torso —
// otherwise the hair paints over the shoulders and the head reads twice its real size.
//
// legend
//  H hair        h hair shade     i hair highlight   T dyed tip      t tip shade
//  s skin        d skin shade      D skin deep
//  b brow        e eye             w eye highlight
//  n nose        l lip             L lip shade
//  S lens        f frame           g lens glint
//  j metal (gold on Muse, silver on S.C.)

export interface HeadMap {
  front: string[];
  back: string[];
  pal: Record<string, string>;
  eyes: [number, number][];
  mouth: [number, number];
}

// ---------------------------------------------------------------- B.T.
// Long wavy brown hair, centre-parted with locks over both temples, tan skin.
export const BT_HEAD: HeadMap = {
  pal: {
    H: '#4a2c1e', h: '#2a170f', i: '#7a4f34',
    s: '#eab48f', d: '#c98f68', D: '#a5714f',
    b: '#2a170f', e: '#1c1219', w: '#f7f2e8',
    n: '#c98f68', l: '#b8545c', L: '#7d2f38',
  },
  eyes: [[5, 9], [10, 9]],
  mouth: [8, 12],
  front: [
    '......HHHHHHHH......',
    '....HHHHHHHHHHHH....',
    '...HHiiHHHHHHiiHH...',
    '..HHiHHHHHHHHHHiHH..',
    '..HHiHHHHHHHHHHiHH..',
    '..HHHHHssssssHHHHH..',
    '.HHHHsssssssssHHHHh.',
    '.HHhHsssssssssHhhHH.',
    '.HHhsbbbssbbbsshhHH.',
    '.HHhseeesseesshhhHH.',
    '.HHhsweesseewsshhhHH',
    '.HHHssssssssssdhhHH.',
    '.HHhsssslllsssshhHH.',
    '.HHHhsssssssssdhhHH.',
    '.HHHh.sssdddss.hhhH.',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
  ],
  back: [
    '......HHHHHHHH......',
    '....HHHHHHHHHHHH....',
    '...HHiiHHHHHHiiHH...',
    '..HHiHHHHHHHHHHiHH..',
    '..HHiHHHHHHHHHHiHH..',
    '.HHHHHiHHHHHHiHHHHH.',
    '.HHHHHiHHHHHHiHHHHH.',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    '.hHHHHHHHHHHHHHHHHh.',
    '.hHHHHHHHHHHHHHHHHh.',
    '..HHiiH......HiiHH..',
    '..HHiiH......HiiHH..',
    '.HHHHH........HHHHH.',
    '.HHHHH........HHHHH.',
    '.HHHH..........HHHH.',
    '.HHHH..........HHHH.',
    '..HHH..........HHH..',
  ],
};

// ---------------------------------------------------------------- S.C.
// Voluminous curly black hair, full beard around a visible mouth, silver stud.
export const SC_HEAD: HeadMap = {
  pal: {
    H: '#211812', h: '#0d0a07', i: '#4a3828',
    s: '#c08152', d: '#9a6238', D: '#774825',
    b: '#0d0a07', e: '#1a1016', w: '#f2ece0',
    n: '#9a6238', l: '#8a4048', L: '#5f2a32',
    j: '#d8dde6',
  },
  eyes: [[6, 8], [10, 8]],
  mouth: [7, 11],
  front: [
    '.....HHHHHHHHHH.....',
    '...HHiiHHHHHHiiHH...',
    '..HHiHHHHHHHHHHiHH..',
    '.HHHHHiHHHHHHiHHHHH.',
    '.HHHHHiHHHHHHiHHHHH.',
    'iHHHHssssssssssHHHHi',
    'iHHHHssssssssssHHHHi',
    'HHHHssbbssssbbssHHHH',
    'HHHHsseesseessssHHHH',
    'HHHHssewsswessssHHHH',
    'HHHhssssnsssssshHHHH',
    'HHHhssHlllHssssshHHH',
    'HHHhssHLLLHssssshHHH',
    'HHHh.sHHHHHHHHs.hHHH',
    'HHHh..sHHHHHHs..hHHH',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
  ],
  back: [
    '.....HHHHHHHHHH.....',
    '...HHiiHHHHHHiiHH...',
    '..HHiHHHHHHHHHHiHH..',
    '.HHHHHiHHHHHHiHHHHH.',
    'HHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHH',
    'HHHHHHHHHHHHHHHHHHHH',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    '.hHHHHHHHHHHHHHHHHh.',
    '.hHHHHHHHHHHHHHHHHh.',
    '..hHHHHHHHHHHHHHHh..',
    '...hHHHHHHHHHHHHh...',
    '....hhHHHHHHHHhh....',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
    '....................',
  ],
};

// ---------------------------------------------------------------- MUSE
// Long wavy black hair with blue tips, shades, chinstrap beard + goatee, gold hoop.
export const MUSE_HEAD: HeadMap = {
  pal: {
    H: '#1a141f', h: '#0c0810', i: '#433a56', T: '#3a74d0', t: '#26509a',
    s: '#cf9566', d: '#a46c3e', D: '#82522c',
    b: '#0c0810', e: '#1c1219', w: '#f7f2e8',
    n: '#a46c3e', l: '#9a4a52', L: '#6b2c34',
    S: '#24223a', f: '#0e0c14', g: '#5a5a86', j: '#f0c040',
  },
  eyes: [[6, 9], [10, 9]],
  mouth: [8, 11],
  front: [
    '.....HHHHHHHHHH.....',
    '...HHiiHHHHHHiiHH...',
    '..HHiHHHHHHHHHHiHH..',
    '.HHHHHiHHHHHHiHHHHH.',
    '.HHHHHHssssssHHHHHH.',
    '.HHHHHssssssssHHHHH.',
    '.HHHHssssssssssHHHH.',
    '.HHHhffffffffffhHHH.',
    '.HHHhSSSfSSSSSShHHH.',
    '.HHHhgSSfSSgSShhHHH.',
    '.HHHhssssnssssshHHH.',
    '.HHHhssslllsssshHHH.',
    '.HHHhsssssssssshHHH.',
    '.HHHhsHssssssHshHHh.',
    '.HHHh.sHHssHHs.hhHH.',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
    '........ssss........',
  ],
  back: [
    '.....HHHHHHHHHH.....',
    '...HHiiHHHHHHiiHH...',
    '..HHiHHHHHHHHHHiHH..',
    '.HHHHHiHHHHHHiHHHHH.',
    '.HHHHHiHHHHHHiHHHHH.',
    '.HHHHHiHHHHHHiHHHHH.',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    'hHHHHHHHHHHHHHHHHHHh',
    '.hHHHHHHHHHHHHHHHHh.',
    '.hHHHHHHHHHHHHHHHHh.',
    '..HHiiH......HiiHH..',
    '..HHiiH......HiiHH..',
    '.HHHHH........HHHHH.',
    '.THHHH........HHHHT.',
    'tTHHH..........HHHtT',
    'tTTH............HTtT',
    '..TH............HT..',
  ],
};
