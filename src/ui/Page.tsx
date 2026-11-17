import { useEffect, type ReactNode } from 'react';
import { useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { IconButton } from './Button';
import { useI18n } from '@/i18n';
import { APP_NAME } from '@/lib/config';

interface PageProps {
  title: string;
  /** Path to go back to; shows a back arrow. */
  back?: string;
  actions?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  wide?: boolean;
}

/** Standard page frame: sticky header with back button, title and actions. */
export function Page({ title, back, actions, subtitle, children, wide }: PageProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    document.title = `${title} · ${APP_NAME}`;
  }, [title]);

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 border-b border-line/70 bg-canvas/90 pt-safe backdrop-blur-md">
        <div className={`mx-auto flex min-h-14 items-center gap-1 px-2 sm:px-4 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
          {back ? (
            <IconButton
              label={t.common.back}
              onClick={() => (window.history.state?.idx > 0 ? navigate(-1) : navigate(back))}
            >
              <ArrowLeft className="size-5" />
            </IconButton>
          ) : (
            <span className="w-2" />
          )}
          <div className="min-w-0 flex-1 py-2">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            {subtitle && <div className="truncate text-sm text-ink-3">{subtitle}</div>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1 pr-1">{actions}</div>}
        </div>
      </header>
      <main id="main" className={`mx-auto w-full flex-1 px-4 pb-28 pt-4 sm:px-6 lg:pb-12 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}>
        {children}
      </main>
    </div>
  );
}
