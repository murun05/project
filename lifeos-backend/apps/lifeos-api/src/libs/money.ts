// Money is stored as integer minor units plus a currency code (never floats).
const ZERO_DECIMALS = new Set(['KRW', 'JPY', 'VND', 'CLP']);

export function exponent(currency: string): number {
  return ZERO_DECIMALS.has(currency.toUpperCase()) ? 0 : 2;
}
/** Parses a decimal string such as "2.99" into minor units without using floating point. */
export function toMinor(amount: string, currency: string): number {
  const e = exponent(currency);
  const m = /^(\d{1,12})(?:\.(\d+))?$/.exec(amount.trim());
  if (!m) throw new Error('Amount must be a positive number such as 12 or 12.50.');
  const frac = m[2] ?? '';
  if (frac.length > e && /[1-9]/.test(frac.slice(e))) throw new Error(`Too many decimal places for ${currency}.`);
  return Number(m[1] + (frac + '0'.repeat(e)).slice(0, e));
}
export function fromMinor(minor: number, currency: string): string {
  const e = exponent(currency);
  if (e === 0) return String(minor);
  const s = String(minor).padStart(e + 1, '0');
  return `${s.slice(0, -e)}.${s.slice(-e)}`;
}
export function yearlyMinor(cost: number, cycle: string): number {
  return cycle === 'YEARLY' ? cost : cost * 12;
}
export function monthlyMinor(yearly: number): number {
  return Math.round(yearly / 12);
}
