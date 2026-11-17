import { useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Check, Clock, Mail, MapPin, Phone } from 'lucide-react';
import { useI18n } from '@/i18n';
import { PublicFrame } from '@/app/PublicFrame';
import { Card } from '@/ui/Card';
import { PageSpinner } from '@/ui/Spinner';
import { cn } from '@/lib/cn';
import { workflowFor } from '@/domain/orders';
import { fetchOrderStatus } from './api';

/** Customer-facing order tracking. Shows no personal data. */
export function TrackPage() {
  const { token = '' } = useParams();
  const { t, fmt } = useI18n();
  const status = useQuery({ queryKey: ['track', token], queryFn: () => fetchOrderStatus(token), refetchInterval: 60_000 });

  if (status.isPending) return <PageSpinner label={t.common.loading} />;
  const o = status.data;
  if (!o)
    return (
      <PublicFrame title={t.track.notFound}>
        <div className="mt-16 text-center">
          <h1 className="text-xl font-semibold">{t.track.notFound}</h1>
          <p className="mt-2 text-ink-2">{t.track.notFoundBody}</p>
        </div>
      </PublicFrame>
    );

  const steps = workflowFor(o.service);
  const current = steps.indexOf(o.status);
  const reachedAt = new Map(o.events.map((e) => [e.status, e.at]));

  return (
    <PublicFrame title={`${t.track.title} ${o.number}`} brand={o.shop.name}>
      <div className="mt-4 flex flex-col gap-5">
        <div>
          <p className="text-sm text-ink-3">{t.track.order}</p>
          <h1 className="tabular text-3xl font-semibold tracking-tight">{o.number}</h1>
          <p className="mt-1 text-ink-2">
            {t.garment[o.garment]} · {t.service[o.service]}
          </p>
        </div>

        {(o.status === 'ready' || o.status === 'collected') && (
          <p className="rounded-[var(--radius-card)] bg-ok-soft px-4 py-3 font-medium text-ok-ink">
            {o.status === 'ready' ? t.track.readyNote : t.track.collectedNote}
          </p>
        )}

        <Card className="p-5">
          <ol className="flex flex-col">
            {steps.map((s, i) => {
              const done = i < current || o.status === 'collected';
              const now = i === current && o.status !== 'collected';
              const at = reachedAt.get(s);
              return (
                <li key={s} className="relative flex gap-4 pb-6 last:pb-0" aria-current={now ? 'step' : undefined}>
                  {i < steps.length - 1 && (
                    <span aria-hidden className={cn('absolute left-[0.9375rem] top-8 h-[calc(100%-2rem)] w-0.5', done ? 'bg-accent' : 'bg-line')} />
                  )}
                  <span
                    className={cn(
                      'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full border-2',
                      done ? 'border-accent bg-accent text-accent-ink' : now ? 'border-accent bg-surface text-accent' : 'border-line-strong bg-surface text-ink-3',
                    )}
                  >
                    {done ? <Check className="size-4" strokeWidth={3} /> : now ? <Clock className="size-4" /> : <span className="text-xs">{i + 1}</span>}
                  </span>
                  <div className="pt-1">
                    <p className={cn('font-medium', !done && !now && 'text-ink-3')}>{t.status[s]}</p>
                    {at && (done || now) && <p className="text-sm text-ink-3">{fmt.day(at)}</p>}
                  </div>
                </li>
              );
            })}
          </ol>
          {o.due_date && o.status !== 'collected' && (
            <p className="mt-5 border-t border-line pt-4 text-sm text-ink-2">
              {t.track.estimated}: <strong className="text-ink">{fmt.date(o.due_date)}</strong>
            </p>
          )}
        </Card>

        <ShopContactCard shop={o.shop} />
      </div>
    </PublicFrame>
  );
}

export function ShopContactCard({
  shop,
}: {
  shop: { name: string; slug: string; address: string | null; phone: string | null; email: string | null; opening_hours: string | null };
}) {
  const { t } = useI18n();
  return (
    <Card className="flex flex-col gap-3 p-5 text-[0.9375rem]">
      <h2 className="font-semibold">{shop.name}</h2>
      {shop.address && (
        <a
          href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(shop.address)}`}
          target="_blank"
          rel="noreferrer noopener"
          className="flex items-start gap-2 text-ink-2 hover:underline"
        >
          <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden /> {shop.address}
        </a>
      )}
      {shop.opening_hours && (
        <p className="flex items-start gap-2 text-ink-2">
          <Clock className="mt-0.5 size-4 shrink-0" aria-hidden /> {shop.opening_hours}
        </p>
      )}
      {shop.phone && (
        <a href={`tel:${shop.phone.replace(/[^\d+]/g, '')}`} className="tabular flex items-center gap-2 text-ink-2 hover:underline">
          <Phone className="size-4 shrink-0" aria-hidden /> {shop.phone}
        </a>
      )}
      {shop.email && (
        <a href={`mailto:${shop.email}`} className="flex items-center gap-2 break-all text-ink-2 hover:underline">
          <Mail className="size-4 shrink-0" aria-hidden /> {shop.email}
        </a>
      )}
      <a href={`/s/${shop.slug}/privacy`} className="text-sm text-ink-3 hover:underline">
        {t.track.privacy}
      </a>
    </Card>
  );
}
