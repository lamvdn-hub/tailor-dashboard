// Client-side validation mirroring database constraints, so users see a
// friendly message before a request is rejected.

export const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

/** Accepts Swedish and international formats: digits, spaces, +, -, (). */
export function isPhone(value: string): boolean {
  const v = value.trim();
  return /^\+?[\d\s\-()]{6,20}$/.test(v) && (v.match(/\d/g)?.length ?? 0) >= 6;
}

export function isSlug(value: string): boolean {
  return /^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$/.test(value);
}

export function isOrderPrefix(value: string): boolean {
  return /^[A-Z]{2,4}$/.test(value);
}

const TRANSLITERATE: Record<string, string> = { å: 'a', ä: 'a', ö: 'o', é: 'e', ü: 'u', æ: 'ae', ø: 'o' };

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[åäöéüæø]/g, (c) => TRANSLITERATE[c] ?? c)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/g, '');
}

/** First letters of up to four words, or the first four letters of one word. */
export function suggestPrefix(name: string): string {
  const letters = slugify(name).toUpperCase().replace(/[^A-Z-]/g, '');
  const words = letters.split('-').filter(Boolean);
  const prefix = words.length > 1 ? words.map((w) => w[0]).join('').slice(0, 4) : (words[0] ?? '').slice(0, 3);
  return prefix.length >= 2 ? prefix : 'ORD';
}

export function isStrongPassword(value: string): boolean {
  return value.length >= 10 && /[a-zA-Z]/.test(value) && /\d/.test(value);
}
