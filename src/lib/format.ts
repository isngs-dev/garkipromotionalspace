const nf = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 });

/** ₦45,000 */
export function naira(n: number): string {
  return `₦${nf.format(Math.round(n))}`;
}

/** ₦1.2M / ₦850K for compact tiles */
export function nairaCompact(n: number): string {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1)}M`;
  if (n >= 1_000) return `₦${Math.round(n / 1_000)}K`;
  return `₦${n}`;
}

export function num(n: number): string {
  return nf.format(n);
}

export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

export const VAT_RATE = 0.075;

export interface PriceBreakdown {
  unitPrice: number;
  days: number;
  quantity: number; // promoters for mobile, 1 for spaces
  subtotal: number;
  vat: number;
  total: number;
}

export function priceBreakdown(unitPrice: number, days: number, quantity = 1): PriceBreakdown {
  const subtotal = unitPrice * Math.max(days, 0) * quantity;
  const vat = Math.round(subtotal * VAT_RATE);
  return { unitPrice, days, quantity, subtotal, vat, total: subtotal + vat };
}
