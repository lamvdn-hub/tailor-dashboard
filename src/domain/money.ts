// Prices are stored as integer minor units (öre) to avoid float rounding.

/** "1 500", "1500,50", "1 500.5 kr" → 150000 / 150050 / 150050 (any whitespace incl. NBSP). Undefined if blank, null if invalid. */
export function parseMoney(input: string): number | undefined | null {
  const cleaned = input
    .replace(/\s/g, '')
    .replace(/(kr|sek|:-)$/i, '')
    .replace(',', '.');
  if (cleaned === '') return undefined;
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole = '0', frac = ''] = cleaned.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

export function formatMoney(minor: number, currency: string, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: minor % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(minor / 100);
}

/** Value for an editable input: 150050 → "1500,50" (sv) / "1500.50" (en). */
export function moneyInputValue(minor: number | null | undefined, locale: string): string {
  if (minor === null || minor === undefined) return '';
  const whole = Math.floor(minor / 100);
  const frac = minor % 100;
  if (frac === 0) return String(whole);
  return `${whole}${locale.startsWith('sv') ? ',' : '.'}${String(frac).padStart(2, '0')}`;
}

export function balanceDue(price: number | null, deposit: number): number | null {
  return price === null ? null : Math.max(price - deposit, 0);
}
