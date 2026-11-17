import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useI18n, LOCALES } from '@/i18n';
import { APP_NAME } from '@/lib/config';
import { cn } from '@/lib/cn';

/** Frame for signed-out and customer-facing pages. */
export function PublicFrame({
  title,
  children,
  narrow = true,
  brand = APP_NAME,
}: {
  title: string;
  children: ReactNode;
  narrow?: boolean;
  brand?: string;
}) {
  const { t } = useI18n();
  useEffect(() => {
    document.title = `${title} · ${brand}`;
  }, [title, brand]);

  return (
    <div className="flex min-h-dvh flex-col pt-safe">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-4">
        <span className="text-sm font-semibold tracking-tight text-ink-2">{brand}</span>
        <LanguageSwitch />
      </header>
      <main id="main" className={cn('mx-auto w-full flex-1 px-5 pb-10', narrow ? 'max-w-md' : 'max-w-3xl')}>
        {children}
      </main>
      <footer className="mx-auto flex w-full max-w-3xl flex-wrap justify-center gap-x-5 gap-y-1 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-ink-3">
        <Link to="/privacy" className="hover:text-ink-2">
          {t.legal.appPrivacyTitle}
        </Link>
        <Link to="/terms" className="hover:text-ink-2">
          {t.auth.terms.charAt(0).toUpperCase() + t.auth.terms.slice(1)}
        </Link>
      </footer>
    </div>
  );
}

export function LanguageSwitch() {
  const { locale, setLocale, t } = useI18n();
  return (
    <div role="group" aria-label={t.language.label} className="flex rounded-full bg-sunken p-0.5 text-xs font-semibold">
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={locale === l}
          onClick={() => setLocale(l)}
          className={cn('h-8 rounded-full px-3 uppercase', locale === l ? 'bg-surface text-ink shadow-card' : 'text-ink-3')}
        >
          {l}
        </button>
      ))}
    </div>
  );
}
