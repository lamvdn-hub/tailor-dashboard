import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Copy, Footprints, Pencil, RefreshCw, Share2, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { Page } from '@/ui/Page';
import { Card, KeyValue, Section } from '@/ui/Card';
import { Button, IconButton } from '@/ui/Button';
import { StatusBadge } from '@/ui/Badge';
import { SelectField, Switch } from '@/ui/Field';
import { PageSpinner } from '@/ui/Spinner';
import { useFeedback } from '@/ui/Feedback';
import { hasJacket, nextStatus, workflowFor, type OrderStatus } from '@/domain/orders';
import { completion, type MeasurementValues } from '@/domain/measurements';
import { balanceDue, formatMoney } from '@/domain/money';
import { describeError } from '@/lib/errors';
import { copyText } from '@/lib/download';
import { fullName } from '@/features/clients/api';
import { MeasurementTable } from '@/features/measurements/MeasurementTable';
import { GuidedMeasure } from '@/features/measurements/GuidedMeasure';
import { deleteOrder, orderEventsQuery, orderQuery, regenerateStatusToken, trackingUrl, updateOrder, type OrderDetail } from './api';
import { PhotoGallery } from './PhotoGallery';
import { styleSummary } from './StyleFields';

export function OrderDetailPage() {
  const { orderId = '' } = useParams();
  const { shop } = useShop();
  const { t } = useI18n();
  const order = useQuery(orderQuery(shop.id, orderId));

  if (order.isPending) return <PageSpinner label={t.common.loading} />;
  if (!order.data)
    return (
      <Page title={t.common.notFound} back="/orders">
        <p className="text-ink-2">{t.common.notFound}</p>
      </Page>
    );
  return <OrderDetail order={order.data} />;
}

function OrderDetail({ order }: { order: OrderDetail }) {
  const { shop } = useShop();
  const { t, fmt } = useI18n();
  const { toast, confirm } = useFeedback();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const events = useQuery(orderEventsQuery(shop.id, order.id));
  const [guided, setGuided] = useState(false);
  const [draftMeasurements, setDraftMeasurements] = useState<MeasurementValues>(order.measurements);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });

  const patch = useMutation({
    mutationFn: (p: Parameters<typeof updateOrder>[1]) => updateOrder(order.id, p),
    onSuccess: invalidate,
    onError: (err) => toast(describeError(err, t), 'error'),
  });

  const setStatus = (status: OrderStatus) =>
    patch.mutate({ status }, { onSuccess: () => toast(t.orders.statusChanged(t.status[status])) });

  const next = nextStatus(order.service, order.status);
  const progress = completion(order.garment, order.measurements);
  const url = trackingUrl(order.status_token);
  const style = styleSummary(order.style, t);
  const isSuit = order.garment === 'suit';
  const notes: Array<[string, string | null]> = [
    ...(isSuit
      ? ([
          [t.orders.jacketNotes, order.jacket_notes],
          [t.orders.trousersNotes, order.trousers_notes],
        ] as Array<[string, string | null]>)
      : ([[t.orders.styleNotes, order.style_notes]] as Array<[string, string | null]>)),
    [t.orders.clientRequests, order.client_requests],
    [t.orders.adjustmentNotes, order.adjustment_notes],
  ];

  const remove = async () => {
    if (!(await confirm({ title: t.orders.deleteOrder, body: t.orders.deleteConfirm, danger: true, confirmLabel: t.common.delete }))) return;
    try {
      await deleteOrder(shop.id, order.id);
      await invalidate();
      toast(t.common.deleted);
      navigate('/orders', { replace: true });
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  const share = async () => {
    const text = t.orders.shareText(order.number);
    if (navigator.share) {
      try {
        await navigator.share({ title: order.number, text, url });
        return;
      } catch {
        // Cancelled; fall back to copying.
      }
    }
    if (await copyText(url)) toast(t.common.copied);
  };

  const regenerate = async () => {
    if (!(await confirm({ title: t.orders.regenerate, body: t.orders.regenerateConfirm }))) return;
    try {
      await regenerateStatusToken(order.id);
      await invalidate();
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  const closeGuided = () => {
    setGuided(false);
    if (JSON.stringify(draftMeasurements) !== JSON.stringify(order.measurements)) {
      patch.mutate({ measurements: draftMeasurements }, { onSuccess: () => toast(t.common.saved) });
    }
  };

  return (
    <Page
      title={order.number}
      subtitle={`${t.garment[order.garment]} · ${t.service[order.service]}`}
      back="/orders"
      actions={
        <>
          <IconButton label={t.common.edit} onClick={() => navigate(`/orders/${order.id}/edit`)}>
            <Pencil className="size-5" />
          </IconButton>
          <IconButton label={t.orders.deleteOrder} tone="danger" onClick={remove}>
            <Trash2 className="size-5" />
          </IconButton>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link to={`/clients/${order.client.id}`} className="text-lg font-semibold hover:underline">
                {fullName(order.client)}
              </Link>
              <p className="text-sm text-ink-3">
                {t.orders.created} {fmt.day(order.created_at)}
                {order.due_date && ` · ${t.orders.due} ${fmt.relativeDay(order.due_date)}`}
              </p>
            </div>
            <StatusBadge status={order.status} />
          </div>

          {/* Status stepper */}
          <ol className="mt-4 flex gap-1" aria-label={t.orders.status}>
            {workflowFor(order.service).map((s, i, all) => {
              const reached = all.indexOf(order.status) >= i;
              return (
                <li key={s} className="flex-1" title={t.status[s]}>
                  <div className={`h-1.5 rounded-full ${reached ? 'bg-accent' : 'bg-sunken'}`} />
                  <span className="sr-only">
                    {t.status[s]} {reached ? '✓' : ''}
                  </span>
                </li>
              );
            })}
          </ol>

          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            {next && (
              <Button className="sm:flex-1" loading={patch.isPending} onClick={() => setStatus(next)} icon={<ArrowRight className="size-4" />}>
                {t.orders.advanceTo(t.status[next])}
              </Button>
            )}
            <div className="sm:w-56">
              <SelectField
                label={<span className="sr-only">{t.orders.status}</span>}
                value={order.status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                options={workflowFor(order.service).map((s) => ({ value: s, label: t.status[s] }))}
              />
            </div>
          </div>

          <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4">
            <KeyValue label={t.orders.fabric}>{order.fabric?.name ?? '–'}</KeyValue>
            <KeyValue label={t.orders.dueDate}>{order.due_date ? fmt.date(order.due_date) : '–'}</KeyValue>
            {order.price_minor !== null && (
              <>
                <KeyValue label={t.orders.price}>
                  <span className="tabular">{formatMoney(order.price_minor, shop.currency, fmt.intl)}</span>
                </KeyValue>
                <KeyValue label={t.orders.balance}>
                  <span className="tabular">
                    {balanceDue(order.price_minor, order.deposit_minor) === 0
                      ? t.orders.paidInFull
                      : formatMoney(balanceDue(order.price_minor, order.deposit_minor) ?? 0, shop.currency, fmt.intl)}
                  </span>
                </KeyValue>
              </>
            )}
          </dl>
        </Card>

        <Section title={t.orders.tracking} description={t.orders.trackingHelp}>
          <div className="flex flex-col gap-4">
            <Switch
              checked={order.status_link_enabled}
              onChange={(v) => patch.mutate({ status_link_enabled: v })}
              label={order.status_link_enabled ? t.orders.trackingEnabled : t.orders.trackingDisabled}
            />
            {order.status_link_enabled && (
              <>
                <code className="block truncate rounded-[var(--radius-control)] bg-sunken px-3 py-2.5 text-sm text-ink-2">{url}</code>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button variant="secondary" icon={<Share2 className="size-4" />} onClick={share}>
                    {t.common.share}
                  </Button>
                  <Button
                    variant="secondary"
                    icon={<Copy className="size-4" />}
                    onClick={async () => (await copyText(url)) && toast(t.common.copied)}
                  >
                    {t.common.copy}
                  </Button>
                  <Button variant="ghost" icon={<RefreshCw className="size-4" />} onClick={regenerate} className="col-span-2 sm:col-span-1">
                    {t.orders.regenerate}
                  </Button>
                </div>
              </>
            )}
          </div>
        </Section>

        <Section
          title={t.measurements.title}
          description={t.measurements.progress(progress.done, progress.total)}
          action={
            <Button
              size="sm"
              variant="ghost"
              icon={<Footprints className="size-4" />}
              onClick={() => {
                setDraftMeasurements(order.measurements);
                setGuided(true);
              }}
            >
              {t.measurements.guided}
            </Button>
          }
        >
          {progress.done === 0 ? (
            <p className="text-sm text-ink-3">{t.measurements.noneYet}</p>
          ) : (
            <MeasurementTable garment={order.garment} values={order.measurements} />
          )}
          <Link to={`/orders/${order.id}/edit#measurements`} className="mt-3 inline-block text-sm font-medium text-accent hover:underline">
            {t.measurements.edit}
          </Link>
        </Section>

        {hasJacket(order.garment) && style.length > 0 && (
          <Section title={t.orders.style}>
            <ul className="flex flex-wrap gap-2">
              {style.map((s) => (
                <li key={s} className="rounded-full bg-sunken px-3 py-1 text-sm">
                  {s}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={t.orders.notes}>
          <dl className="flex flex-col gap-4">
            {notes.map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-medium uppercase tracking-wide text-ink-3">{label}</dt>
                <dd className={`mt-1 whitespace-pre-line text-[0.9375rem] ${value ? 'text-ink' : 'text-ink-3'}`}>{value ?? t.orders.noNotes}</dd>
              </div>
            ))}
          </dl>
        </Section>

        <Section title={t.orders.photos}>
          <PhotoGallery shopId={shop.id} orderId={order.id} />
        </Section>

        {events.data && events.data.length > 0 && (
          <Section title={t.orders.history}>
            <ol className="flex flex-col gap-3">
              {events.data.map((e, i) => (
                <li key={i} className="flex items-center justify-between gap-3 text-sm">
                  <StatusBadge status={e.status} />
                  <time className="tabular text-ink-3" dateTime={e.changed_at}>
                    {fmt.dateTime(e.changed_at)}
                  </time>
                </li>
              ))}
            </ol>
          </Section>
        )}
      </div>

      <GuidedMeasure open={guided} onClose={closeGuided} garment={order.garment} values={draftMeasurements} onChange={setDraftMeasurements} />
    </Page>
  );
}
