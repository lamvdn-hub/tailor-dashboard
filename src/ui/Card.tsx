import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-[var(--radius-card)] border border-line bg-surface shadow-card', className)}>{children}</div>
  );
}

interface SectionProps {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
  id?: string;
}

/** A titled card. `flush` removes body padding for edge-to-edge lists. */
export function Section({ title, description, action, children, className, flush, id }: SectionProps) {
  return (
    <section aria-labelledby={id ? `${id}-title` : undefined} className={cn('flex min-w-0 flex-col gap-2', className)}>
      <div className="flex min-h-9 items-end justify-between gap-3 px-1">
        <div>
          <h2 id={id ? `${id}-title` : undefined} className="text-[0.8125rem] font-semibold uppercase tracking-wide text-ink-3">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-sm text-ink-3">{description}</p>}
        </div>
        {action}
      </div>
      <Card className={flush ? 'overflow-hidden' : 'p-4 sm:p-5'}>{children}</Card>
    </section>
  );
}

export function KeyValue({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</dt>
      <dd className="text-[0.9375rem] text-ink">{children}</dd>
    </div>
  );
}
