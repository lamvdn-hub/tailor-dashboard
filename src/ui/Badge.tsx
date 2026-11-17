import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { statusGroup, type OrderStatus } from '@/domain/orders';
import { useI18n } from '@/i18n';

export type Tone = 'neutral' | 'accent' | 'ok' | 'warn' | 'danger';

const tones: Record<Tone, string> = {
  neutral: 'bg-sunken text-ink-2',
  accent: 'bg-accent-soft text-accent-soft-ink',
  ok: 'bg-ok-soft text-ok-ink',
  warn: 'bg-warn-soft text-warn-ink',
  danger: 'bg-danger-soft text-danger-ink',
};

export function Badge({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold', tones[tone], className)}>
      {children}
    </span>
  );
}

export function statusTone(status: OrderStatus): Tone {
  switch (statusGroup(status)) {
    case 'open':
      return 'accent';
    case 'fitting':
      return 'warn';
    case 'ready':
      return 'ok';
    case 'collected':
      return 'neutral';
  }
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  const { t } = useI18n();
  return <Badge tone={statusTone(status)}>{t.status[status]}</Badge>;
}
