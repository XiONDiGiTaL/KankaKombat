// River City Ransom pattern: every stage has one enterable storefront and one street
// vendor booth. Both open the same cream menu; the vendor just does it as an overlay.

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

const ALL: ItemId[] = ['ayran', 'banana', 'lahmacun', 'baklava', 'sujuk', 'nutella'];

export const SHOPS: Record<string, ShopDef> = {
  bodega: {
    id: 'bodega', name: 'BODEGA', tagline: 'OPEN 24/7 · COLD DRINKS', style: 'ny', venue: 'store',
    keeper: 'Manny', keeperLine: "WELCOME! WHAT'LL IT BE?", stock: ALL,
  },
  newsstand: {
    id: 'newsstand', name: 'NEWSSTAND', tagline: 'PAPERS · CANDY · METROCARD', style: 'ny', venue: 'store',
    keeper: 'Dee', keeperLine: 'Mind the doors, kanka. What do you need?', stock: ALL,
  },
  hotdog: {
    id: 'hotdog', name: 'HOT DOG CART', tagline: 'SABRETT · DIRTY WATER · ICE COLD', style: 'ny', venue: 'vendor',
    keeper: 'Sal', keeperLine: 'Hey! Best cart on the block.', stock: ALL,
  },
  bakkal: {
    id: 'bakkal', name: 'BAKKAL', tagline: 'BAKKAL · ŞARKÜTERİ · 7/24', style: 'izmir', venue: 'store',
    keeper: 'Nazmiye', keeperLine: 'Hoş geldin kanka! Ne alalım?', stock: ALL,
  },
  simit: {
    id: 'simit', name: 'SİMİT CART', tagline: 'TAZE SİMİT · AÇIK HAVA', style: 'izmir', venue: 'vendor',
    keeper: 'Hasan', keeperLine: 'Simit mi, ayran mı?', stock: ALL,
  },
  pazar: {
    id: 'pazar', name: 'PAZAR', tagline: 'BAHARAT · BAKLİYAT · ÇAY', style: 'istanbul', venue: 'store',
    keeper: 'Fehmi', keeperLine: 'Bir çay içmeden olmaz, buyur.', stock: ALL,
  },
  cay: {
    id: 'cay', name: 'ÇAY STAND', tagline: 'DEMLİ ÇAY · SICAK SİMİT', style: 'istanbul', venue: 'vendor',
    keeper: 'Ayşe', keeperLine: 'Çayı demledim, ne alırsın?', stock: ALL,
  },
  tacos: {
    id: 'tacos', name: 'TACOS', tagline: 'TACOS · LIMON · PLAYA', style: 'tampa', venue: 'store',
    keeper: 'Lupe', keeperLine: 'Fresh tortillas, kanka!', stock: ALL,
  },
  tacotruck: {
    id: 'tacotruck', name: 'TACO TRUCK', tagline: 'TACOS – LIMON · ABIERTO', style: 'tampa', venue: 'vendor',
    keeper: 'Rico', keeperLine: 'What can I get you, amigo?', stock: ALL,
  },
};
