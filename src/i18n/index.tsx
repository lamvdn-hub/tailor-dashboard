import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import sv, { type Messages } from './sv';
import en from './en';
import { readPref, writePref } from '@/lib/prefs';

export type Locale = 'sv' | 'en';
export const LOCALES: Locale[] = ['sv', 'en'];

const DICTIONARIES: Record<Locale, Messages> = { sv, en };
const INTL: Record<Locale, string> = { sv: 'sv-SE', en: 'en-GB' };

export function initialLocale(): Locale {
  const saved = readPref('locale');
  if (saved === 'sv' || saved === 'en') return saved;
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en') ? 'en' : 'sv';
}

function toDate(value: string | Date): Date {
  if (value instanceof Date) return value;
  // Plain dates ("2026-03-01") are calendar days, not UTC instants.
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T12:00:00`) : new Date(value);
}

export function makeFormatters(locale: Locale) {
  const tag = INTL[locale];
  const t = DICTIONARIES[locale];
  const dayFmt = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short' });
  const dayYearFmt = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', year: 'numeric' });
  const dateTimeFmt = new Intl.DateTimeFormat(tag, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const numberFmt = new Intl.NumberFormat(tag, { maximumFractionDigits: 2 });

  return {
    intl: tag,
    /** ISO-like 2026-03-01 for Swedish, 01/03/2026 for English. */
    date: (v: string | Date) => toDate(v).toLocaleDateString(tag),
    day: (v: string | Date) => {
      const d = toDate(v);
      return d.getFullYear() === new Date().getFullYear() ? dayFmt.format(d) : dayYearFmt.format(d);
    },
    /** "Idag", "Imorgon", "Igår", otherwise a short date. */
    relativeDay: (v: string | Date) => {
      const d = toDate(v);
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      const diff = Math.round((new Date(d).setHours(12, 0, 0, 0) - today.getTime()) / 86_400_000);
      if (diff === 0) return t.common.today;
      if (diff === 1) return t.common.tomorrow;
      if (diff === -1) return t.common.yesterday;
      return d.getFullYear() === today.getFullYear() ? dayFmt.format(d) : dayYearFmt.format(d);
    },
    dateTime: (v: string | Date) => dateTimeFmt.format(toDate(v)),
    number: (n: number) => numberFmt.format(n),
  };
}

export type Formatters = ReturnType<typeof makeFormatters>;

interface I18nValue {
  locale: Locale;
  t: Messages;
  fmt: Formatters;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children, locale: forced }: { children: ReactNode; locale?: Locale }) {
  const [locale, setLocaleState] = useState<Locale>(forced ?? initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    writePref('locale', next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ locale, t: DICTIONARIES[locale], fmt: makeFormatters(locale), setLocale }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
