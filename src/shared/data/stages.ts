// Campaign layout: four cities in story order — New York at night, İzmir at sunset,
// İstanbul in the morning, Tampa in the afternoon. Each chapter has two streets and a
// boss arena. Waves lock the camera when reached and release it when the street is clear.
//
// Shops sit on the painted stage strips, so their x values are not free: a strip tiles from
// world 0, and a painted doorway/stall repeats every tile width. Each shop spot therefore
// lands on `tile * n + anchor` for its strip (the anchors live in public/assets/stages/*.json,
// and tests/art.test.ts fails when a spot drifts off one). No two shops in a section share an
// anchor, so a street never shows the same storefront twice in a row.

import { Currency } from './currency';
import { ItemId } from './items';
import type { ThemeId } from './music';

export interface Spawn { e: string; side?: 'L' | 'R'; z?: number; delay?: number }
export interface Wave { at: number; spawn: Spawn[] }
export interface PropDef { kind: string; x: number; z: number; drop?: 'coin' | ItemId }
export interface ShopSpot { x: number; shop: string }
export interface HazardDef { kind: string; period: number; offset: number; z0: number; z1: number; warn: number; speed: number; damage: number; hitW?: number }
export interface FoodDef { item: ItemId; x: number; z: number }
export interface SectionDef {
  name: string;
  length: number;
  theme: string;               // background renderer key
  peace?: boolean;             // a walkable town stretch: no waves, no hazards, townsfolk
  training?: boolean;          // the practice room: no waves, no exit, a respawning dummy
  waves: Wave[];
  props: PropDef[];
  shops: ShopSpot[];
  food?: FoodDef[];
  hazards?: HazardDef[];
  boss?: string;
}
export interface ChapterDef {
  id: string;
  city: string;
  country: string;
  title: string;
  currency: Currency;
  music: ThemeId;             // supplied city theme, streamed for the whole chapter
  intro: string;
  sections: SectionDef[];
}

const W = (at: number, ...spawn: (string | Spawn)[]): Wave => ({ at, spawn: spawn.map((s) => (typeof s === 'string' ? { e: s } : s)) });
const L = (e: string, extra: Partial<Spawn> = {}): Spawn => ({ e, side: 'L', ...extra });

export const CHAPTERS: ChapterDef[] = [
  {
    id: 'nyc', city: 'NEW YORK', country: 'USA', title: 'Chapter 1: Concrete Jungle', currency: 'USD', music: 'nyc',
    intro: 'The last jar of Nutella in Brooklyn went missing at midnight. The trail starts on Flatbush.',
    sections: [
      {
        name: 'Flatbush Avenue', length: 1340, theme: 'ny_street',
        waves: [W(140, 'bum', 'bum'), W(520, 'bum', L('bum'), 'bum'), W(900, 'bum', 'bum', L('bum'))],
        props: [
          { kind: 'bin', x: 300, z: 14, drop: 'coin' },
          { kind: 'crate', x: 700, z: 50, drop: 'banana' },
          { kind: 'box', x: 1040, z: 22, drop: 'ayran' },
          { kind: 'mailbox', x: 1240, z: 44, drop: 'lahmacun' },
        ],
        shops: [{ x: 707, shop: 'bodega' }],
      },
      {
        // the transport zone: down the subway stairs, along the platform, up the far end.
        // No waves — it is a stretch you walk through, with the map wall as its landmark and
        // one newsstand booth on the platform (the strip paints no shop, so one is built here).
        name: 'Broadway–Lafayette', length: 700, theme: 'ny_subway',
        waves: [],
        props: [],
        shops: [{ x: 520, shop: 'newsstand' }],
      },
      {
        name: 'Flatbush Plaza', length: 1180, theme: 'ny_plaza', peace: true,
        waves: [],
        props: [
          { kind: 'bin', x: 260, z: 18, drop: 'coin' },
          { kind: 'crate', x: 520, z: 48, drop: 'banana' },
          { kind: 'box', x: 820, z: 22, drop: 'ayran' },
        ],
        shops: [{ x: 707, shop: 'bodega' }, { x: 400, shop: 'hotdog' }],
        food: [{ item: 'lahmacun', x: 940, z: 30 }],
      },
      {
        name: 'Bedford Row', length: 1260, theme: 'ny_block',
        waves: [W(120, 'bum', L('bum')), W(460, 'bum', 'bum', 'bum'), W(820, 'bum', L('bum'), 'bum')],
        props: [
          { kind: 'barrel', x: 420, z: 20, drop: 'sujuk' },
          { kind: 'bin', x: 760, z: 52, drop: 'coin' },
          { kind: 'box', x: 980, z: 18, drop: 'baklava' },
          { kind: 'crate', x: 1180, z: 46, drop: 'nutella' },
        ],
        // a hot dog cart under the fire escapes — the strip paints no cart, so the renderer
        // stands one on this spot (only the bodega doorway is painted, at x 132 + 575n)
        shops: [{ x: 932, shop: 'hotdog' }],
        hazards: [{ kind: 'taxi', period: 840, offset: 480, z0: 46, z1: 62, warn: 110, speed: 7, damage: 16, hitW: 112 }],
      },
      { name: 'The Boiler Room', length: 640, theme: 'ny_boss', waves: [], props: [], shops: [], boss: 'bum_boss' },
    ],
  },
  {
    id: 'izmir', city: 'İZMİR', country: 'TÜRKİYE', title: 'Chapter 2: Aegean Sunset', currency: 'TRY', music: 'izmir',
    intro: 'The ferry lands at sunset. Fehmi is holding court at the tea house on the Kordon.',
    sections: [
      {
        name: 'Kordon Boyu', length: 1340, theme: 'izm_kordon',
        waves: [W(140, 'fehmi', 'fehmi'), W(500, 'fehmi', L('fehmi'), 'fehmi'), W(900, 'fehmi', 'fehmi', 'fehmi', L('fehmi'))],
        props: [
          { kind: 'crate', x: 340, z: 16, drop: 'coin' },
          { kind: 'barrel', x: 760, z: 50, drop: 'ayran' },
          { kind: 'box', x: 1060, z: 24, drop: 'banana' },
          { kind: 'bin', x: 1240, z: 46, drop: 'baklava' },
        ],
        shops: [{ x: 362, shop: 'bakkal' }],
        hazards: [
          { kind: 'bike', period: 760, offset: 300, z0: 46, z1: 60, warn: 90, speed: 5, damage: 10, hitW: 72 },
          // a börek courier cutting across the seaside lane with a box on the rack
          { kind: 'delivery', period: 640, offset: 120, z0: 18, z1: 32, warn: 80, speed: 4.2, damage: 9, hitW: 53 },
        ],
      },
      {
        name: 'Kordon Çarşı', length: 1180, theme: 'izm_plaza', peace: true,
        waves: [],
        props: [
          { kind: 'crate', x: 280, z: 20, drop: 'coin' },
          { kind: 'barrel', x: 560, z: 44, drop: 'ayran' },
          { kind: 'bin', x: 880, z: 16, drop: 'baklava' },
        ],
        shops: [{ x: 362, shop: 'bakkal' }, { x: 900, shop: 'simit' }],
        food: [{ item: 'banana', x: 960, z: 28 }],
      },
      {
        name: 'Kemeraltı Bazaar', length: 1300, theme: 'izm_bazaar',
        waves: [W(120, 'fehmi', L('fehmi'), 'fehmi'), W(480, 'fehmi', 'fehmi', 'fehmi'), W(860, 'fehmi', L('fehmi'), 'fehmi')],
        props: [
          { kind: 'crate', x: 420, z: 48, drop: 'sujuk' },
          { kind: 'box', x: 800, z: 20, drop: 'lahmacun' },
          { kind: 'barrel', x: 1180, z: 40, drop: 'nutella' },
        ],
        // two of Kemeraltı's own stalls, a hundred and fifty paces apart
        shops: [{ x: 97, shop: 'simit' }, { x: 250, shop: 'bakkal' }],
        hazards: [{ kind: 'delivery', period: 700, offset: 420, z0: 20, z1: 34, warn: 90, speed: 4, damage: 9, hitW: 53 }],
      },
      { name: 'Saat Kulesi Square', length: 640, theme: 'izm_boss', waves: [], props: [], shops: [], boss: 'fehmi_boss' },
    ],
  },
  {
    id: 'istanbul', city: 'İSTANBUL', country: 'TÜRKİYE', title: 'Chapter 3: Bosphorus Morning', currency: 'TRY', music: 'istanbul',
    intro: 'Morning in Kadıköy. The Dondurma Man is already twirling his stick by the ferry dock.',
    sections: [
      {
        name: 'Kadıköy Çarşı', length: 1340, theme: 'ist_market',
        waves: [W(140, 'dondurma', 'dondurma'), W(500, 'dondurma', L('dondurma'), 'dondurma'), W(900, 'dondurma', 'dondurma', L('dondurma'))],
        props: [
          { kind: 'crate', x: 320, z: 18, drop: 'coin' },
          { kind: 'box', x: 720, z: 48, drop: 'lahmacun' },
          { kind: 'barrel', x: 1060, z: 24, drop: 'ayran' },
          { kind: 'mailbox', x: 1240, z: 44, drop: 'sujuk' },
        ],
        // Kadıköy Çarşı runs along the bazaar strip: the shops are two of its stalls
        shops: [{ x: 175, shop: 'pazar' }, { x: 1016, shop: 'cay' }],
      },
      {
        name: 'Kadıköy Meydanı', length: 1180, theme: 'ist_plaza', peace: true,
        waves: [],
        props: [
          { kind: 'box', x: 260, z: 22, drop: 'coin' },
          { kind: 'crate', x: 540, z: 46, drop: 'lahmacun' },
          { kind: 'mailbox', x: 820, z: 18, drop: 'sujuk' },
        ],
        shops: [{ x: 45, shop: 'pazar' }, { x: 345, shop: 'cay' }],
        food: [{ item: 'nutella', x: 950, z: 26 }],
      },
      {
        name: 'Galata Morning', length: 1260, theme: 'ist_galata',
        waves: [W(120, 'dondurma', L('dondurma'), 'dondurma'), W(460, 'dondurma', 'dondurma', 'dondurma'), W(820, 'dondurma', L('dondurma'), 'dondurma')],
        props: [
          { kind: 'bin', x: 400, z: 50, drop: 'coin' },
          { kind: 'crate', x: 720, z: 20, drop: 'baklava' },
          { kind: 'box', x: 1120, z: 42, drop: 'nutella' },
        ],
        shops: [{ x: 1103, shop: 'cay' }],
        hazards: [
          { kind: 'tram', period: 900, offset: 400, z0: 24, z1: 38, warn: 120, speed: 6, damage: 18, hitW: 89 },
          // the same food courier, this time downhill on Galata's cobbles
          { kind: 'delivery', period: 720, offset: 240, z0: 48, z1: 62, warn: 90, speed: 4.4, damage: 9, hitW: 53 },
        ],
      },
      { name: 'Galata Rooftop', length: 640, theme: 'ist_boss', waves: [], props: [], shops: [], boss: 'dondurma_boss' },
    ],
  },
  {
    id: 'tampa', city: 'TAMPA', country: 'FLORIDA, USA', title: 'Chapter 4: Sunshine State', currency: 'USD', music: 'tampa',
    intro: 'The last jar is on a Tampa pier, guarded by a man who has never lost a cane fight.',
    sections: [
      {
        name: 'Bayshore Boardwalk', length: 940, theme: 'tpa_boardwalk',
        waves: [W(140, 'tampa', 'tampa'), W(500, 'tampa', L('tampa'), 'tampa')],
        props: [
          { kind: 'bin', x: 260, z: 20, drop: 'coin' },
          { kind: 'crate', x: 470, z: 48, drop: 'banana' },
          { kind: 'box', x: 700, z: 18, drop: 'ayran' },
          { kind: 'mailbox', x: 860, z: 44, drop: 'sujuk' },
        ],
        // the taco truck the strip paints, hatch open, right on the boardwalk
        shops: [{ x: 400, shop: 'tacos' }],
        hazards: [{ kind: 'golfcart', period: 800, offset: 360, z0: 40, z1: 56, warn: 100, speed: 4.5, damage: 12, hitW: 70 }],
      },
      {
        name: 'Bayshore Promenade', length: 1180, theme: 'tpa_plaza', peace: true,
        waves: [],
        props: [
          { kind: 'bin', x: 280, z: 18, drop: 'coin' },
          { kind: 'crate', x: 560, z: 44, drop: 'banana' },
          { kind: 'barrel', x: 860, z: 22, drop: 'baklava' },
        ],
        shops: [{ x: 208, shop: 'tacos' }, { x: 1000, shop: 'tacotruck' }],
        food: [{ item: 'lahmacun', x: 980, z: 30 }],
      },
      {
        name: 'Ybor Strip', length: 1260, theme: 'tpa_ybor',
        waves: [W(120, 'tampa', L('tampa'), 'tampa'), W(460, 'tampa', 'tampa', 'tampa'), W(820, 'tampa', L('tampa'), 'tampa')],
        props: [
          { kind: 'barrel', x: 420, z: 46, drop: 'baklava' },
          { kind: 'crate', x: 760, z: 18, drop: 'lahmacun' },
          { kind: 'bin', x: 1140, z: 40, drop: 'nutella' },
        ],
        shops: [{ x: 980, shop: 'tacotruck' }],
      },
      { name: 'The Last Pier', length: 640, theme: 'tpa_boss', waves: [], props: [], shops: [], boss: 'tampa_boss' },
    ],
  },
];

/** The practice room off the main menu. It is deliberately not part of CHAPTERS: the campaign
 *  advances through the four cities and never walks into the gym, and the flow tests keep
 *  measuring only the story sections. The training flag tells the simulation to skip waves,
 *  exits and hazards and to keep the dummy coming back. */
export const TRAINING: SectionDef = {
  name: "Dragon's Den Gym",
  length: 503,                 // one painted strip wide: the room never repeats
  theme: 'gym',
  training: true,
  waves: [],
  props: [],
  shops: [],
};

/** Resolve a section anywhere in the game. Training is a mode of its own, not a chapter, so
 *  callers that only have a snapshot need this rather than indexing CHAPTERS directly. */
export function sectionAt(ch: number, se: number, training = false): SectionDef {
  if (training) return TRAINING;
  return CHAPTERS[ch]?.sections[se] ?? CHAPTERS[0].sections[0];
}

/** Every destructible takes three hits: intact → damaged → smashed. */
export const PROP_HP: Record<string, number> = { crate: 3, barrel: 3, bin: 3, box: 3, mailbox: 3 };
