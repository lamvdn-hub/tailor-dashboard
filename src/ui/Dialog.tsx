import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { IconButton } from './Button';
import { useI18n } from '@/i18n';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'full';
}

/**
 * Native <dialog>: focus trapping, Escape and inert background for free.
 * Bottom sheet on phones, centred panel from `sm` up.
 */
export function Dialog({ open, onClose, title, children, footer, size = 'md' }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const { t } = useI18n();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className={cn(
        'm-0 mt-auto w-full max-w-none bg-transparent p-0 text-ink backdrop:backdrop-blur-[1px] sm:m-auto',
        size === 'md' && 'sm:max-w-lg',
        size === 'lg' && 'sm:max-w-2xl',
        size === 'full' && 'h-dvh max-h-none sm:h-auto sm:max-h-[90dvh] sm:max-w-4xl',
      )}
    >
      {open && (
        <div
          className={cn(
            'flex max-h-[92dvh] flex-col rounded-t-[1.25rem] bg-surface shadow-float sm:max-h-[90dvh] sm:rounded-[var(--radius-card)]',
            size === 'full' && 'h-dvh max-h-none rounded-none sm:h-auto sm:max-h-[90dvh] sm:rounded-[var(--radius-card)]',
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-line py-2 pl-5 pr-2">
            <h2 className="text-base font-semibold">{title}</h2>
            <IconButton label={t.common.close} onClick={onClose}>
              <X className="size-5" />
            </IconButton>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4">{children}</div>
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-line px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:flex-row sm:justify-end">
              {footer}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}
