// Food and recovery items. There are two economies, and they never overlap:
//
// - Street drops: the six items that fall out of destructibles and enemies (ayran, bananas,
//   lahmacun, baklava, sucuk and the rare Nutella). Their weights are the drop table and are
//   locked by the approved pickup sheet.
// - Shop meals: food that only that city's shops sell. Every shop stocks the food of its own
//   place, none of it is on the drop ladder, and it has dropWeight 0, so walking in is the
//   only way to eat it. Each sit-down shop (bodega, bakkal, tacos) has one $150 FULL restore
//   as its signature; street vendors are cheaper and never go above 90 HP.
//
// The dishes are the food its keeper would actually sell (Marcos' chopped cheese and Bronx
// hero, Hüsnü's simit and karışık pide, Lupe's tortillas and pastor, the pazar's chestnuts
// and pickle juice), which is what makes a shop visit worth the trip. Heals climb above
// what the street drops give.
//
// Prices are universal kanka cash: the same number in lira and dollars (see currency.ts).
// A shop's stock must stay at six rows or fewer - the shop menu panel has room for six.

export type ItemId =
  // street drops
  | 'nutella' | 'banana' | 'baklava' | 'sujuk' | 'lahmacun' | 'ayran'
  // Tampa: Lupe's taco shop and Rico's truck
  | 'tortilla' | 'taco' | 'quesadilla' | 'elote' | 'burrito' | 'pastor'
  // New York: Marcos' bodega, the newsstand and Sal's cart
  | 'bagel' | 'plantain' | 'patty' | 'knish' | 'choppedcheese' | 'bronxhero'
  // İzmir: Hüsnü's bakkal and Hasan's simit cart
  | 'cay' | 'simit' | 'borek' | 'lokum' | 'dondurma' | 'pide'
  // İstanbul: the pazar booth and Ayşe's çay stand
  | 'tursu' | 'kestane' | 'misir' | 'midye' | 'nar' | 'balikekmek';

export interface ItemDef {
  id: ItemId;
  name: string;
  desc: string;
  heal: number;              // HP restored; Infinity = full
  price: number;             // universal kanka cash, shown with the city's symbol
  dropWeight: number;        // 0 = only sold in a shop, never dropped
}

export const ITEMS: Record<ItemId, ItemDef> = {
  // ---- street drops (locked: see ConceptArt/ART_STYLE_DIRECTIVE.md)
  ayran: { id: 'ayran', name: 'Ayran', desc: 'Small heal.', heal: 25, price: 30, dropWeight: 28 },
  banana: { id: 'banana', name: 'Bananas', desc: 'Medium heal.', heal: 45, price: 40, dropWeight: 26 },
  lahmacun: { id: 'lahmacun', name: 'Lahmacun', desc: 'Medium heal.', heal: 45, price: 50, dropWeight: 18 },
  baklava: { id: 'baklava', name: 'Baklava', desc: 'Large heal.', heal: 70, price: 80, dropWeight: 12 },
  sujuk: { id: 'sujuk', name: 'Sucuk', desc: 'Large heal.', heal: 70, price: 90, dropWeight: 10 },
  nutella: { id: 'nutella', name: 'Nutella', desc: 'Full restore. Rare.', heal: Infinity, price: 150, dropWeight: 4 },

  // ---- Tampa (USD)
  tortilla: { id: 'tortilla', name: 'Tortillas', desc: 'Small heal.', heal: 20, price: 25, dropWeight: 0 },
  taco: { id: 'taco', name: 'Taco', desc: 'Medium heal.', heal: 35, price: 40, dropWeight: 0 },
  quesadilla: { id: 'quesadilla', name: 'Quesadilla', desc: 'Medium heal.', heal: 45, price: 55, dropWeight: 0 },
  elote: { id: 'elote', name: 'Elote', desc: 'Large heal.', heal: 55, price: 70, dropWeight: 0 },
  burrito: { id: 'burrito', name: 'Burrito', desc: 'Large heal.', heal: 70, price: 90, dropWeight: 0 },
  pastor: { id: 'pastor', name: 'Pastor Plate', desc: 'Full restore.', heal: Infinity, price: 150, dropWeight: 0 },

  // ---- New York (USD)
  bagel: { id: 'bagel', name: 'Bagel', desc: 'Small heal.', heal: 25, price: 30, dropWeight: 0 },
  plantain: { id: 'plantain', name: 'Plantain Chips', desc: 'Medium heal.', heal: 30, price: 35, dropWeight: 0 },
  patty: { id: 'patty', name: 'Beef Patty', desc: 'Medium heal.', heal: 40, price: 45, dropWeight: 0 },
  knish: { id: 'knish', name: 'Knish', desc: 'Medium heal.', heal: 45, price: 50, dropWeight: 0 },
  choppedcheese: { id: 'choppedcheese', name: 'Chopped Cheese', desc: 'Large heal.', heal: 75, price: 90, dropWeight: 0 },
  bronxhero: { id: 'bronxhero', name: 'Bronx Hero', desc: 'Full restore.', heal: Infinity, price: 150, dropWeight: 0 },

  // ---- İzmir (TRY)
  cay: { id: 'cay', name: 'Çay', desc: 'Small heal.', heal: 15, price: 20, dropWeight: 0 },
  simit: { id: 'simit', name: 'Simit', desc: 'Small heal.', heal: 25, price: 30, dropWeight: 0 },
  borek: { id: 'borek', name: 'Börek', desc: 'Medium heal.', heal: 45, price: 50, dropWeight: 0 },
  lokum: { id: 'lokum', name: 'Lokum', desc: 'Large heal.', heal: 55, price: 65, dropWeight: 0 },
  dondurma: { id: 'dondurma', name: 'Dondurma', desc: 'Large heal.', heal: 70, price: 85, dropWeight: 0 },
  pide: { id: 'pide', name: 'Karışık Pide', desc: 'Full restore.', heal: Infinity, price: 150, dropWeight: 0 },

  // ---- İstanbul (TRY)
  tursu: { id: 'tursu', name: 'Turşu Suyu', desc: 'Small heal.', heal: 15, price: 20, dropWeight: 0 },
  kestane: { id: 'kestane', name: 'Kestane', desc: 'Medium heal.', heal: 30, price: 35, dropWeight: 0 },
  misir: { id: 'misir', name: 'Mısır', desc: 'Medium heal.', heal: 35, price: 40, dropWeight: 0 },
  midye: { id: 'midye', name: 'Midye Dolma', desc: 'Large heal.', heal: 50, price: 60, dropWeight: 0 },
  nar: { id: 'nar', name: 'Nar Suyu', desc: 'Large heal.', heal: 60, price: 75, dropWeight: 0 },
  balikekmek: { id: 'balikekmek', name: 'Balık Ekmek', desc: 'Large heal.', heal: 90, price: 130, dropWeight: 0 },
};

export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];

/** The items that can fall out of a destructible or an enemy. Shop meals are never here. */
export const DROP_IDS = ITEM_IDS.filter((id) => ITEMS[id].dropWeight > 0);
