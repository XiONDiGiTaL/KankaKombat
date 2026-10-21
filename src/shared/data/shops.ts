import { ItemId } from './items';

export interface ShopDef { id: string; name: string; tagline: string; stock: ItemId[] }

export const SHOPS: Record<string, ShopDef> = {
  cay: { id: 'cay', name: 'Kanka Çay Ocağı', tagline: 'Çay yok, Nutella var.', stock: ['nutella', 'banana', 'baklava', 'ayran'] },
  bufe: { id: 'bufe', name: 'Boğaz Büfe', tagline: 'Gece yarısı lahmacun.', stock: ['nutella', 'sujuk', 'lahmacun', 'ayran'] },
  kordon: { id: 'kordon', name: 'Kordon Kumru & Co.', tagline: 'Sahilde baklava keyfi.', stock: ['banana', 'baklava', 'sujuk', 'ayran'] },
  bodega: { id: 'bodega', name: 'Kanka Bodega', tagline: 'Open 25 hours.', stock: ['banana', 'nutella', 'lahmacun', 'ayran'] },
  deli: { id: 'deli', name: 'Ditmas Deli', tagline: 'Imported sujuk. Don\'t ask.', stock: ['sujuk', 'baklava', 'nutella', 'ayran'] },
  gas: { id: 'gas', name: 'Gator Gas & Snax', tagline: 'Hot food. Hotter parking lot.', stock: ['banana', 'nutella', 'sujuk', 'ayran'] },
  plaza: { id: 'plaza', name: 'Strip Mall Mezze', tagline: 'Between the vape shop and the dentist.', stock: ['baklava', 'lahmacun', 'banana', 'ayran'] },
};
