// Food and recovery items. Every number here is live gameplay, not flavour text.

export type ItemId = 'nutella' | 'banana' | 'baklava' | 'sujuk' | 'lahmacun' | 'ayran';

export interface ItemDef {
  id: ItemId;
  name: string;
  desc: string;
  heal: number;              // HP restored; Infinity = full
  life?: number;             // extra lives granted
  buff?: { kind: 'speed' | 'power'; mul: number; ticks: number };
  priceTRY: number;
  priceUSD: number;
  dropWeight: number;
}

export const ITEMS: Record<ItemId, ItemDef> = {
  nutella: { id: 'nutella', name: 'Nutella Jar', desc: 'Restores 22 HP.', heal: 22, priceTRY: 60, priceUSD: 6, dropWeight: 30 },
  banana: { id: 'banana', name: 'Banana', desc: 'Restores 15 HP and +25% speed for 8s.', heal: 15, buff: { kind: 'speed', mul: 1.25, ticks: 480 }, priceTRY: 35, priceUSD: 3, dropWeight: 30 },
  baklava: { id: 'baklava', name: 'Baklava', desc: 'Restores 45 HP.', heal: 45, priceTRY: 100, priceUSD: 10, dropWeight: 16 },
  sujuk: { id: 'sujuk', name: 'Sujuk', desc: 'Restores 35 HP and +30% damage for 10s.', heal: 35, buff: { kind: 'power', mul: 1.3, ticks: 600 }, priceTRY: 120, priceUSD: 12, dropWeight: 12 },
  lahmacun: { id: 'lahmacun', name: 'Lahmacun', desc: 'Restores ALL HP.', heal: Infinity, priceTRY: 220, priceUSD: 22, dropWeight: 6 },
  ayran: { id: 'ayran', name: 'Ayran', desc: '+1 life (max 5).', heal: 0, life: 1, priceTRY: 300, priceUSD: 30, dropWeight: 3 },
};
export const ITEM_IDS = Object.keys(ITEMS) as ItemId[];
