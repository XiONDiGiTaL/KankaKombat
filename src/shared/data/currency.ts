// Kanka cash is one wallet across the whole campaign, so the concept-sheet prices
// (Ayran 30 … Nutella 150) mean the same thing in every city. The local symbol is
// cosmetic: lira in Türkiye, dollars in the USA.
export type Currency = 'TRY' | 'USD';

export function formatMoney(amount: number, cur: Currency): string {
  return cur === 'TRY' ? `₺${amount}` : `$${amount}`;
}

export function convert(amount: number, _from: Currency, _to: Currency): number {
  return amount;
}
