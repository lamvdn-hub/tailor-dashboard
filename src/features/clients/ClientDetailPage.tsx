import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Mail, Pencil, Phone, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { Page } from '@/ui/Page';
import { Card, Section } from '@/ui/Card';
import { Button, ButtonLink, IconButton, buttonClass } from '@/ui/Button';
import { List } from '@/ui/List';
import { PageSpinner } from '@/ui/Spinner';
import { useFeedback } from '@/ui/Feedback';
import { describeError } from '@/lib/errors';
import { dateStamp, downloadJson } from '@/lib/download';
import { measurementsFor } from '@/domain/measurements';
import { MeasurementTable } from '@/features/measurements/MeasurementTable';
import { OrderRow } from '@/features/orders/OrderRow';
import { clientOrdersQuery } from '@/features/orders/api';
import { clientQuery, deleteClient, exportClient, fullName } from './api';

export function ClientDetailPage() {
  const { clientId = '' } = useParams();
  const { shop } = useShop();
  const { t, fmt } = useI18n();
  const { toast, confirm } = useFeedback();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const client = useQuery(clientQuery(shop.id, clientId));
  const orders = useQuery(clientOrdersQuery(shop.id, clientId));

  const latest = useMemo(
    () => orders.data?.find((o) => measurementsFor(o.garment).some((d) => o.measurements?.[d.key] !== undefined)),
    [orders.data],
  );
  const fabrics = useMemo(
    () => [...new Set((orders.data ?? []).map((o) => o.fabric?.name).filter((n): n is string => Boolean(n)))],
    [orders.data],
  );

  if (client.isPending) return <PageSpinner label={t.common.loading} />;
  if (!client.data)
    return (
      <Page title={t.common.notFound} back="/clients">
        <p className="text-ink-2">{t.common.notFound}</p>
      </Page>
    );

  const c = client.data;
  const name = fullName(c);
  const deletesOn = new Date(c.last_activity_at);
  deletesOn.setMonth(deletesOn.getMonth() + shop.client_retention_months);

  const doExport = async () => {
    try {
      downloadJson(await exportClient(c.id), `client-${c.last_name.toLowerCase()}-${dateStamp()}.json`);
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  const doDelete = async () => {
    if (!(await confirm({ title: t.clients.deleteClient, body: t.clients.deleteConfirm(name), danger: true, confirmLabel: t.common.delete }))) return;
    try {
      await deleteClient(shop.id, c.id);
      await queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });
      toast(t.common.deleted);
      navigate('/clients', { replace: true });
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  return (
    <Page
      title={name}
      back="/clients"
      actions={
        <IconButton label={t.common.edit} onClick={() => navigate(`/clients/${c.id}/edit`)}>
          <Pencil className="size-5" />
        </IconButton>
      }
    >
      <div className="flex flex-col gap-6">
        {(c.phone || c.email) && (
          <div className="grid grid-cols-2 gap-2">
            {c.phone && (
              <a href={`tel:${c.phone.replace(/[^\d+]/g, '')}`} className={buttonClass('secondary')}>
                <Phone className="size-4" /> {t.clients.call}
              </a>
            )}
            {c.email && (
              <a href={`mailto:${c.email}`} className={buttonClass('secondary')}>
                <Mail className="size-4" /> {t.clients.mail}
              </a>
            )}
          </div>
        )}
        {(c.phone || c.email || c.notes) && (
          <Card className="flex flex-col gap-1 p-4 text-[0.9375rem]">
            {c.phone && <span className="tabular">{c.phone}</span>}
            {c.email && <span className="break-all">{c.email}</span>}
            {c.notes && <p className="mt-2 whitespace-pre-line text-ink-2">{c.notes}</p>}
          </Card>
        )}

        <Section
          title={t.clients.orders}
          flush
          action={
            <ButtonLink to={`/orders/new?client=${c.id}`} size="sm" variant="ghost" icon={<Plus className="size-4" />}>
              {t.app.newOrder}
            </ButtonLink>
          }
        >
          {orders.data && orders.data.length > 0 ? (
            <List>
              {orders.data.map((o) => (
                <OrderRow key={o.id} order={{ ...o, client: c }} showClient={false} />
              ))}
            </List>
          ) : (
            <p className="p-4 text-sm text-ink-3">{t.clients.noOrders}</p>
          )}
        </Section>

        {latest && (
          <Section
            title={t.clients.latestMeasurements}
            description={`${latest.number} · ${fmt.day(latest.created_at)}`}
          >
            <MeasurementTable garment={latest.garment} values={latest.measurements} />
          </Section>
        )}

        {fabrics.length > 0 && (
          <Section title={t.clients.fabricsUsed}>
            <ul className="flex flex-wrap gap-2">
              {fabrics.map((f) => (
                <li key={f} className="rounded-full bg-sunken px-3 py-1 text-sm">
                  {f}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={t.clients.privacyTools}>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-ink-3">
              {t.clients.lastActivity}: {fmt.date(c.last_activity_at)}. {t.clients.retentionNotice(fmt.date(deletesOn))}
            </p>
            <Link to={`/s/${shop.slug}/privacy`} target="_blank" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline">
              <ShieldCheck className="size-4" /> {t.clients.privacyNoticeLink}
            </Link>
            <div className="flex flex-col gap-1">
              <Button variant="secondary" icon={<Download className="size-4" />} onClick={doExport} className="self-start">
                {t.clients.exportData}
              </Button>
              <p className="text-xs text-ink-3">{t.clients.exportHelp}</p>
            </div>
            <div className="flex flex-col gap-1 border-t border-line pt-4">
              <Button variant="quiet-danger" icon={<Trash2 className="size-4" />} onClick={doDelete} className="self-start">
                {t.clients.deleteClient}
              </Button>
              <p className="text-xs text-ink-3">{t.clients.deleteHelp}</p>
            </div>
          </div>
        </Section>
      </div>
    </Page>
  );
}
