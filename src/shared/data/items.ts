// Food and recovery items. Heal tiers and prices come straight from the approved
// pickup/destructible sheets and the shop concept: Ayran small, Lahmacun/Bananas
// medium, Baklava/Sucuk large, Nutella the rare full restore.

export type ItemId = 'nutella' | 'banana' | 'baklava' | 'sujuk' | 'lahmacun' | 'ayran';

export interface ItemDef {
  id: ItemId;
  name: string;
  desc: string;
  heal: number;              // HP restored; Infinity = full
  price: number;             // universal kanka cash, shown with the city's symbol
  dropWeight: number;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  ayran: { id: 'ayran', name: 'Ayran', desc: 'Small heal.', heal: 25, price: 30, dropWeight: 28 },
  banana: { id: 'banana', name: 'Bananas', desc: 'Medium heal.', heal: 45, price: 40, dropWeight: 26 },
  lahmacun: { id: 'lahmacun', name: 'Lahmacun', desc: 'Medium heal.', heal: 45, price: 50, dropWeight: 18 },
  baklava: { id: 'baklava', name: 'Baklava', desc: 'Large heal.', heal: 70, price: 80, dropWeight: 12 },
  sujuk: { id: 'sujuk', name: 'Sucuk', desc: 'Large heal.', heal: 70, price: 90, dropWeight: 10 },
  nutella: { id: 'nutella', name: 'Nutella', desc: 'Full restore. Rare.', heal: Infinity, price: 150, dropWeight: 4 },
};
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
