// River City Ransom pattern: every stage has one enterable storefront and one street
// vendor booth. Both open the same cream menu; the vendor just does it as an overlay.
//
// Stock is the shop's identity, not a shared shelf. Shops sell the food of their own place
// and never the street-drop ladder (ayran, bananas, lahmacun, baklava, sucuk, Nutella):
// a bodega sells bagels, patties, knish and the Bronx hero, a simit cart sells çay and
// simit, Lupe's counter sells tortillas and pastor. Sit-down shops carry one $150 FULL
// restore as their signature; street vendors are cheaper and never reach FULL. Six rows is
// the menu's limit, and each list is ordered cheapest first.

import { ItemId } from './items';

export type ShopStyle = 'ny' | 'izmir' | 'istanbul' | 'tampa';
export interface ShopDef {
  id: string;
  name: string;
  tagline: string;
  style: ShopStyle;
  venue: 'store' | 'vendor';
  keeper: string;
  keeperLine: string;
  stock: ItemId[];
}

export const SHOPS: Record<string, ShopDef> = {
  bodega: {
    id: 'bodega', name: 'BODEGA', tagline: 'OPEN 24/7 · COLD DRINKS', style: 'ny', venue: 'store',
    keeper: 'Marcos', keeperLine: "What's good, papi? Chopped cheese is hot.",
    stock: ['bagel', 'plantain', 'patty', 'knish', 'choppedcheese', 'bronxhero'],
  },
  newsstand: {
    id: 'newsstand', name: 'NEWSSTAND', tagline: 'PAPERS · CANDY · METROCARD', style: 'ny', venue: 'store',
    keeper: 'Dee', keeperLine: 'Bagel and chips, baby? Mind the doors.',
    stock: ['bagel', 'plantain', 'knish'],
  },
  hotdog: {
    id: 'hotdog', name: 'HOT DOG CART', tagline: 'SABRETT · DIRTY WATER · ICE COLD', style: 'ny', venue: 'vendor',
    keeper: 'Sal', keeperLine: "Best cart on the block, buddy. Knish's warm.",
    stock: ['plantain', 'patty', 'knish'],
  },
  bakkal: {
    id: 'bakkal', name: 'BAKKAL', tagline: 'BAKKAL · ŞARKÜTERİ · 7/24', style: 'izmir', venue: 'store',
    keeper: 'Hüsnü', keeperLine: 'Hoş geldin kanka! Simit taze, çay demli.',
    stock: ['cay', 'simit', 'borek', 'lokum', 'dondurma', 'pide'],
  },
  simit: {
    id: 'simit', name: 'SİMİT CART', tagline: 'TAZE SİMİT · AÇIK HAVA', style: 'izmir', venue: 'vendor',
    keeper: 'Hasan', keeperLine: 'Simit mi, çay mı, kanka? İkisi de taze.',
    stock: ['cay', 'simit', 'borek'],
  },
  pazar: {
    id: 'pazar', name: 'PAZAR', tagline: 'KESTANE · MISIR · TURŞU', style: 'istanbul', venue: 'vendor',
    keeper: 'Kemal', keeperLine: 'Buyur kanka, midye taze, turşu soğuk.',
    stock: ['tursu', 'kestane', 'misir', 'midye', 'nar', 'balikekmek'],
  },
  cay: {
    id: 'cay', name: 'ÇAY STAND', tagline: 'DEMLİ ÇAY · SICAK SİMİT', style: 'istanbul', venue: 'vendor',
    keeper: 'Ayşe', keeperLine: 'Çayı demledim, canım. Lokum da taze.',
    stock: ['cay', 'simit', 'lokum'],
  },
  tacos: {
    id: 'tacos', name: 'TACOS', tagline: 'TACOS · LIMÓN · PLAYA', style: 'tampa', venue: 'store',
    keeper: 'Lupe', keeperLine: '¡Fresh tortillas, kanka! Just made them.',
    stock: ['tortilla', 'taco', 'quesadilla', 'elote', 'burrito', 'pastor'],
  },
  tacotruck: {
    id: 'tacotruck', name: 'TACO TRUCK', tagline: 'TACOS – LIMÓN · ABIERTO', style: 'tampa', venue: 'vendor',
    keeper: 'Rico', keeperLine: '¡Órale! ¿Qué tal, carnal? Elote is off the grill.',
    stock: ['tortilla', 'taco', 'quesadilla', 'elote'],
  },
};
