import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export function List({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cn('divide-y divide-line', className)}>{children}</ul>;
}

interface RowProps {
  to?: string;
  onClick?: () => void;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  chevron?: boolean;
  className?: string;
}

/** Tappable list row (min 56px tall). Renders a link, button or plain item. */
export function Row({ to, onClick, leading, title, subtitle, trailing, chevron = Boolean(to), className }: RowProps) {
  const content = (
    <>
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-[0.9375rem] font-medium text-ink">{title}</div>
        {subtitle && <div className="truncate text-sm text-ink-3">{subtitle}</div>}
      </div>
      {trailing && <div className="flex shrink-0 items-center gap-2">{trailing}</div>}
      {chevron && <ChevronRight aria-hidden className="size-4 shrink-0 text-ink-3" />}
    </>
  );
  const cls = cn('flex min-h-14 w-full items-center gap-3 px-4 py-2.5 text-left', className);
  return (
    <li>
      {to ? (
        <Link to={to} className={cn(cls, 'transition-colors hover:bg-sunken active:bg-sunken')}>
          {content}
        </Link>
      ) : onClick ? (
        <button type="button" onClick={onClick} className={cn(cls, 'transition-colors hover:bg-sunken active:bg-sunken')}>
          {content}
        </button>
      ) : (
        <div className={cls}>{content}</div>
      )}
    </li>
  );
}

export function Avatar({ name, className }: { name: string; className?: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-sunken text-sm font-semibold text-ink-2',
        className,
      )}
    >
      {initials || '·'}
    </span>
  );
}

export function EmptyState({ icon, title, body, action }: { icon?: ReactNode; title: ReactNode; body?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon && <div className="text-ink-3 [&>svg]:size-8">{icon}</div>}
      <p className="text-[0.9375rem] font-medium text-ink">{title}</p>
      {body && <p className="max-w-sm text-sm text-ink-3">{body}</p>}
      {action}
    </div>
  );
}
