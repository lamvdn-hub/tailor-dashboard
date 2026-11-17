import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { useI18n } from '@/i18n';

type ToastTone = 'ok' | 'error';
interface Toast {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ConfirmOptions {
  title: string;
  body?: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  /** Require typing this word before confirming (irreversible actions). */
  typeToConfirm?: string;
}

interface FeedbackValue {
  toast: (message: string, tone?: ToastTone) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackValue | null>(null);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [pending, setPending] = useState<ConfirmOptions | null>(null);
  const [typed, setTyped] = useState('');
  const resolver = useRef<((ok: boolean) => void) | null>(null);
  const nextId = useRef(1);

  const toast = useCallback((message: string, tone: ToastTone = 'ok') => {
    const id = nextId.current++;
    setToasts((list) => [...list.slice(-2), { id, message, tone }]);
    window.setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), tone === 'error' ? 6000 : 3500);
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    setTyped('');
    setPending(options);
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setPending(null);
  };

  const blocked = Boolean(pending?.typeToConfirm) && typed.trim() !== pending?.typeToConfirm;

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-50 flex flex-col items-center gap-2 px-4 lg:bottom-6"
      >
        {toasts.map((x) => (
          <div
            key={x.id}
            role={x.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto flex max-w-md items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-float',
              x.tone === 'error' ? 'bg-danger text-white' : 'bg-ink text-canvas',
            )}
          >
            {x.tone === 'error' ? <AlertCircle className="size-5 shrink-0" /> : <CheckCircle2 className="size-5 shrink-0" />}
            <span>{x.message}</span>
            <button
              type="button"
              aria-label={t.common.close}
              onClick={() => setToasts((list) => list.filter((y) => y.id !== x.id))}
              className="-mr-1 rounded-full p-1 opacity-70 hover:opacity-100"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <Dialog
        open={pending !== null}
        onClose={() => settle(false)}
        title={pending?.title ?? ''}
        footer={
          <>
            <Button variant="secondary" onClick={() => settle(false)}>
              {t.common.cancel}
            </Button>
            <Button variant={pending?.danger ? 'danger' : 'primary'} disabled={blocked} onClick={() => settle(true)}>
              {pending?.confirmLabel ?? t.common.confirm}
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4 text-[0.9375rem] text-ink-2">
          {pending?.body}
          {pending?.typeToConfirm && (
            <label className="flex flex-col gap-1.5 text-sm">
              {t.common.typeToConfirm(pending.typeToConfirm)}
              <input
                autoComplete="off"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                className="h-12 rounded-[var(--radius-control)] border border-line-strong bg-surface px-3.5 text-base text-ink"
              />
            </label>
          )}
        </div>
      </Dialog>
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackValue {
  const ctx = useContext(FeedbackContext);
  if (!ctx) throw new Error('useFeedback must be used inside FeedbackProvider');
  return ctx;
}
