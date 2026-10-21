// Campaign layout: four cities in story order — New York at night, İzmir at sunset,
// İstanbul in the morning, Tampa in the afternoon. Each chapter has two streets and a
// boss arena. Waves lock the camera when reached and release it when the street is clear.
// Every street also carries one shop frontage or one street-vendor booth.

import { Currency } from './currency';
import { ItemId } from './items';

export interface Spawn { e: string; side?: 'L' | 'R'; z?: number; delay?: number }
export interface Wave { at: number; spawn: Spawn[] }
export interface PropDef { kind: string; x: number; z: number; drop?: 'coin' | ItemId }
export interface ShopSpot { x: number; shop: string }
export interface HazardDef { kind: string; period: number; offset: number; z0: number; z1: number; warn: number; speed: number; damage: number }
export interface FoodDef { item: ItemId; x: number; z: number }
export interface SectionDef {
  name: string;
  length: number;
  theme: string;               // background renderer key
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
  music: string;
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
        name: 'Flatbush Avenue', length: 1600, theme: 'ny_street',
        waves: [W(140, 'bum', 'bum'), W(520, 'bum', L('bum'), 'bum'), W(900, 'bum', 'bum', L('bum')), W(1150, 'bum', 'bum', 'bum', L('bum'))],
        props: [
          { kind: 'bin', x: 300, z: 14, drop: 'coin' },
          { kind: 'crate', x: 700, z: 50, drop: 'banana' },
          { kind: 'box', x: 1040, z: 22, drop: 'ayran' },
          { kind: 'mailbox', x: 1320, z: 44, drop: 'lahmacun' },
        ],
        shops: [{ x: 620, shop: 'bodega' }],
      },
      {
        name: 'Bedford Row', length: 1700, theme: 'ny_block',
        waves: [W(120, 'bum', L('bum')), W(460, 'bum', 'bum', 'bum'), W(820, 'bum', L('bum'), 'bum'), W(1260, 'bum', 'bum', L('bum'), 'bum')],
        props: [
          { kind: 'barrel', x: 420, z: 20, drop: 'sujuk' },
          { kind: 'bin', x: 780, z: 52, drop: 'coin' },
          { kind: 'box', x: 1140, z: 18, drop: 'baklava' },
          { kind: 'crate', x: 1440, z: 46, drop: 'nutella' },
        ],
        shops: [{ x: 980, shop: 'hotdog' }],
        hazards: [{ kind: 'taxi', period: 840, offset: 480, z0: 46, z1: 62, warn: 110, speed: 7, damage: 16 }],
      },
      { name: 'The Boiler Room', length: 640, theme: 'ny_boss', waves: [], props: [], shops: [], boss: 'bum_boss' },
    ],
  },
  {
    id: 'izmir', city: 'İZMİR', country: 'TÜRKİYE', title: 'Chapter 2: Aegean Sunset', currency: 'TRY', music: 'izmir',
    intro: 'The ferry lands at sunset. Fehmi is holding court at the tea house on the Kordon.',
    sections: [
      {
        name: 'Kordon Boyu', length: 1650, theme: 'izm_kordon',
        waves: [W(140, 'fehmi', 'fehmi'), W(500, 'fehmi', L('fehmi'), 'fehmi'), W(900, 'fehmi', 'fehmi', 'fehmi', L('fehmi')), W(1150, 'fehmi', 'fehmi', L('fehmi'))],
        props: [
          { kind: 'crate', x: 340, z: 16, drop: 'coin' },
          { kind: 'barrel', x: 760, z: 50, drop: 'ayran' },
          { kind: 'box', x: 1080, z: 24, drop: 'banana' },
          { kind: 'bin', x: 1380, z: 46, drop: 'baklava' },
        ],
        shops: [{ x: 620, shop: 'bakkal' }],
        hazards: [{ kind: 'bike', period: 760, offset: 300, z0: 46, z1: 60, warn: 90, speed: 5, damage: 10 }],
      },
      {
        name: 'Kemeraltı Bazaar', length: 1700, theme: 'izm_bazaar',
        waves: [W(120, 'fehmi', L('fehmi'), 'fehmi'), W(480, 'fehmi', 'fehmi', 'fehmi'), W(860, 'fehmi', L('fehmi'), 'fehmi'), W(1280, 'fehmi', 'fehmi', L('fehmi'), 'fehmi')],
        props: [
          { kind: 'crate', x: 420, z: 48, drop: 'sujuk' },
          { kind: 'box', x: 800, z: 20, drop: 'lahmacun' },
          { kind: 'barrel', x: 1240, z: 40, drop: 'nutella' },
        ],
        shops: [{ x: 1000, shop: 'simit' }],
      },
      { name: 'Saat Kulesi Square', length: 640, theme: 'izm_boss', waves: [], props: [], shops: [], boss: 'fehmi_boss' },
    ],
  },
  {
    id: 'istanbul', city: 'İSTANBUL', country: 'TÜRKİYE', title: 'Chapter 3: Bosphorus Morning', currency: 'TRY', music: 'istanbul',
    intro: 'Morning in Kadıköy. The Dondurma Man is already twirling his stick by the ferry dock.',
    sections: [
      {
        name: 'Kadıköy Çarşı', length: 1650, theme: 'ist_market',
        waves: [W(140, 'dondurma', 'dondurma'), W(500, 'dondurma', L('dondurma'), 'dondurma'), W(900, 'dondurma', 'dondurma', L('dondurma')), W(1150, 'dondurma', 'dondurma', 'dondurma', L('dondurma'))],
        props: [
          { kind: 'crate', x: 320, z: 18, drop: 'coin' },
          { kind: 'box', x: 720, z: 48, drop: 'lahmacun' },
          { kind: 'barrel', x: 1060, z: 24, drop: 'ayran' },
          { kind: 'mailbox', x: 1360, z: 44, drop: 'sujuk' },
        ],
        shops: [{ x: 640, shop: 'pazar' }],
      },
      {
        name: 'Galata Morning', length: 1700, theme: 'ist_galata',
        waves: [W(120, 'dondurma', L('dondurma'), 'dondurma'), W(460, 'dondurma', 'dondurma', 'dondurma'), W(820, 'dondurma', L('dondurma'), 'dondurma'), W(1260, 'dondurma', 'dondurma', L('dondurma'), 'dondurma')],
        props: [
          { kind: 'bin', x: 400, z: 50, drop: 'coin' },
          { kind: 'crate', x: 780, z: 20, drop: 'baklava' },
          { kind: 'box', x: 1160, z: 42, drop: 'nutella' },
        ],
        shops: [{ x: 980, shop: 'cay' }],
        hazards: [{ kind: 'tram', period: 900, offset: 400, z0: 24, z1: 38, warn: 120, speed: 6, damage: 18 }],
      },
      { name: 'Galata Rooftop', length: 640, theme: 'ist_boss', waves: [], props: [], shops: [], boss: 'dondurma_boss' },
    ],
  },
  {
    id: 'tampa', city: 'TAMPA', country: 'FLORIDA, USA', title: 'Chapter 4: Sunshine State', currency: 'USD', music: 'tampa',
    intro: 'The last jar is on a Tampa pier, guarded by a man who has never lost a cane fight.',
    sections: [
      {
        name: 'Bayshore Boardwalk', length: 1650, theme: 'tpa_boardwalk',
        waves: [W(140, 'tampa', 'tampa'), W(500, 'tampa', L('tampa'), 'tampa'), W(900, 'tampa', 'tampa', 'tampa', L('tampa')), W(1150, 'tampa', 'tampa', L('tampa'))],
        props: [
          { kind: 'bin', x: 340, z: 20, drop: 'coin' },
          { kind: 'crate', x: 740, z: 48, drop: 'banana' },
          { kind: 'box', x: 1080, z: 18, drop: 'ayran' },
          { kind: 'mailbox', x: 1380, z: 44, drop: 'sujuk' },
        ],
        shops: [{ x: 620, shop: 'tacos' }],
        hazards: [{ kind: 'golfcart', period: 800, offset: 360, z0: 40, z1: 56, warn: 100, speed: 4.5, damage: 12 }],
      },
      {
        name: 'Ybor Strip', length: 1700, theme: 'tpa_ybor',
        waves: [W(120, 'tampa', L('tampa'), 'tampa'), W(460, 'tampa', 'tampa', 'tampa'), W(820, 'tampa', L('tampa'), 'tampa'), W(1260, 'tampa', 'tampa', L('tampa'), 'tampa')],
        props: [
          { kind: 'barrel', x: 420, z: 46, drop: 'baklava' },
          { kind: 'crate', x: 800, z: 18, drop: 'lahmacun' },
          { kind: 'bin', x: 1180, z: 40, drop: 'nutella' },
        ],
        shops: [{ x: 980, shop: 'tacotruck' }],
      },
      { name: 'The Last Pier', length: 640, theme: 'tpa_boss', waves: [], props: [], shops: [], boss: 'tampa_boss' },
    ],
  },
];

/** Every destructible takes three hits: intact → damaged → smashed. */
export const PROP_HP: Record<string, number> = { crate: 3, barrel: 3, bin: 3, box: 3, mailbox: 3 };
