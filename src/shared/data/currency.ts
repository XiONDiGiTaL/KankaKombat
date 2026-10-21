// Turkish chapters pay in lira, American chapters in dollars. Wallets are converted once,
// when the party crosses from İzmir to New York, at a fixed in-game exchange rate.
export type Currency = 'TRY' | 'USD';
export const TRY_PER_USD = 10;

export function formatMoney(amount: number, cur: Currency): string {
  return cur === 'TRY' ? `₺${amount}` : `$${amount}`;
}

export function convert(amount: number, from: Currency, to: Currency): number {
  if (from === to) return amount;
  return from === 'TRY' ? Math.floor(amount / TRY_PER_USD) : amount * TRY_PER_USD;
}
