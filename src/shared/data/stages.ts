// Campaign layout: four city chapters, each with three connected sections (two streets
// and a boss arena). Waves trigger when the camera reaches `at` and lock the camera until
// cleared. Everything here is data so new streets need no engine changes.

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
    id: 'istanbul', city: 'İstanbul', country: 'Türkiye', title: 'Chapter 1: Bosphorus Nights', currency: 'TRY', music: 'istanbul',
    intro: 'Someone stole the last jar of Nutella in Kadıköy. The trail leads uphill.',
    sections: [
      {
        name: 'Kadıköy Çarşı', length: 1500, theme: 'ist_market',
        waves: [W(120, 'abi', 'abi'), W(480, 'abi', L('selo'), 'abi'), W(860, 'kazim', 'abi', L('abi')), W(1116, 'selo', 'kazim', 'abi')],
        props: [{ kind: 'crate', x: 300, z: 14, drop: 'coin' }, { kind: 'crate', x: 720, z: 52, drop: 'nutella' }, { kind: 'barrel', x: 1010, z: 20, drop: 'coin' }],
        shops: [{ x: 640, shop: 'cay' }],
        food: [{ item: 'banana', x: 420, z: 40 }],
      },
      {
        name: 'Galata Yokuşu', length: 1700, theme: 'ist_tram',
        waves: [W(100, 'abi', 'selo'), W(420, 'kazim', L('abi'), 'selo'), W(760, 'riza'), W(1040, 'abi', 'kazim', L('selo')), W(1316, 'riza', 'abi', 'abi')],
        props: [{ kind: 'crate', x: 520, z: 50, drop: 'baklava' }, { kind: 'barrel', x: 900, z: 12, drop: 'coin' }, { kind: 'crate', x: 1250, z: 30, drop: 'coin' }],
        shops: [{ x: 1180, shop: 'bufe' }],
        hazards: [{ kind: 'tram', period: 900, offset: 400, z0: 22, z1: 40, warn: 120, speed: 6, damage: 18 }],
      },
      { name: 'Rooftop of Kemal', length: 576, theme: 'ist_roof', waves: [], props: [], shops: [], boss: 'kemal' },
    ],
  },
  {
    id: 'izmir', city: 'İzmir', country: 'Türkiye', title: 'Chapter 2: Aegean Sunset', currency: 'TRY', music: 'izmir',
    intro: 'The thief took the ferry to İzmir. The Kordon promenade is crawling with Selim\'s crew.',
    sections: [
      {
        name: 'Kordon Boyu', length: 1600, theme: 'izm_kordon',
        waves: [W(120, 'mert', 'kenan'), W(460, 'gokhan', L('mert'), 'leyla'), W(820, 'kenan', 'kenan', L('mert')), W(1216, 'leyla', 'gokhan', 'mert', L('kenan'))],
        props: [{ kind: 'cooler', x: 360, z: 46, drop: 'coin' }, { kind: 'crate', x: 760, z: 16, drop: 'banana' }, { kind: 'cooler', x: 1100, z: 30, drop: 'sujuk' }],
        shops: [{ x: 680, shop: 'kordon' }],
        hazards: [{ kind: 'bike', period: 700, offset: 300, z0: 44, z1: 60, warn: 90, speed: 5, damage: 10 }],
      },
      {
        name: 'Kemeraltı Bazaar', length: 1700, theme: 'izm_bazaar',
        waves: [W(100, 'leyla', 'mert', L('mert')), W(440, 'gokhan', 'kenan', 'leyla'), W(800, 'kenan', L('gokhan'), 'mert', 'mert'), W(1316, 'gokhan', 'leyla', 'kenan', L('mert'))],
        props: [{ kind: 'crate', x: 540, z: 50, drop: 'coin' }, { kind: 'barrel', x: 980, z: 14, drop: 'lahmacun' }],
        shops: [{ x: 1120, shop: 'bufe' }],
        food: [{ item: 'baklava', x: 700, z: 32 }],
      },
      { name: 'Saat Kulesi Stage', length: 576, theme: 'izm_stage', waves: [], props: [], shops: [], boss: 'selim' },
    ],
  },
  {
    id: 'nyc', city: 'New York City', country: 'USA', title: 'Chapter 3: Concrete Jungle', currency: 'USD', music: 'nyc',
    intro: 'Your lira became dollars at the airport. The Nutella trail goes underground in Brooklyn.',
    sections: [
      {
        name: 'Flatbush Avenue', length: 1600, theme: 'nyc_street',
        waves: [W(120, 'punk', 'punk'), W(460, 'vinny', 'punk', L('punk')), W(800, 'brick', 'vinny'), W(1216, 'punk', 'brick', L('vinny'), 'punk')],
        props: [{ kind: 'bin', x: 330, z: 12, drop: 'coin' }, { kind: 'bin', x: 760, z: 52, drop: 'banana' }, { kind: 'crate', x: 1080, z: 24, drop: 'coin' }],
        shops: [{ x: 640, shop: 'bodega' }],
        hazards: [{ kind: 'taxi', period: 820, offset: 500, z0: 46, z1: 64, warn: 110, speed: 7, damage: 16 }],
      },
      {
        name: 'Subway Platform', length: 1700, theme: 'nyc_subway',
        waves: [W(100, 'vinny', L('punk'), 'punk'), W(440, 'sal'), W(760, 'brick', 'punk', L('vinny')), W(1060, 'punk', 'vinny', 'brick'), W(1316, 'sal', 'punk', L('punk'))],
        props: [{ kind: 'bin', x: 600, z: 14, drop: 'nutella' }, { kind: 'crate', x: 980, z: 48, drop: 'coin' }],
        shops: [{ x: 1180, shop: 'deli' }],
      },
      { name: 'The Boiler Room', length: 576, theme: 'nyc_ring', waves: [], props: [], shops: [], boss: 'malone' },
    ],
  },
  {
    id: 'tampa', city: 'Tampa', country: 'Florida, USA', title: 'Chapter 4: Sunshine State of Mind', currency: 'USD', music: 'tampa',
    intro: 'The last jar is in Tampa, guarded by the most Florida man alive.',
    sections: [
      {
        name: 'Ybor Strip Mall', length: 1600, theme: 'tpa_mall',
        waves: [W(120, 'gator', 'kyle'), W(460, 'cindy', 'gator', L('kyle')), W(800, 'earl'), W(1216, 'lou', 'gator', L('kyle'), 'cindy')],
        props: [{ kind: 'cooler', x: 330, z: 46, drop: 'coin' }, { kind: 'bin', x: 740, z: 12, drop: 'sujuk' }, { kind: 'cooler', x: 1080, z: 30, drop: 'coin' }],
        shops: [{ x: 640, shop: 'gas' }],
        hazards: [{ kind: 'golfcart', period: 760, offset: 360, z0: 40, z1: 58, warn: 100, speed: 4.5, damage: 12 }],
      },
      {
        name: 'Bayshore Parking Lot', length: 1700, theme: 'tpa_lot',
        waves: [W(100, 'kyle', 'kyle', L('gator')), W(440, 'lou', 'cindy'), W(760, 'earl', 'gator', L('kyle')), W(1060, 'lou', 'cindy', 'gator'), W(1316, 'earl', 'earl', L('kyle'))],
        props: [{ kind: 'crate', x: 560, z: 50, drop: 'baklava' }, { kind: 'cooler', x: 960, z: 16, drop: 'coin' }],
        shops: [{ x: 1180, shop: 'plaza' }],
        food: [{ item: 'nutella', x: 300, z: 30 }],
      },
      { name: 'Gus\'s Swamp Dock', length: 576, theme: 'tpa_dock', waves: [], props: [], shops: [], boss: 'gus' },
    ],
  },
];

export const PROP_HP: Record<string, number> = { crate: 2, barrel: 3, bin: 2, cooler: 2 };
