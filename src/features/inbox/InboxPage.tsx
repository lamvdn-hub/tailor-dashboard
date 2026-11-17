import { useState } from 'react';
import { Link } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, Inbox, Mail, Phone, RotateCcw, Trash2, UserPlus } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { Page } from '@/ui/Page';
import { Card } from '@/ui/Card';
import { Button, ButtonLink, IconButton, buttonClass } from '@/ui/Button';
import { EmptyState } from '@/ui/List';
import { FilterChips } from '@/ui/Segmented';
import { PageSpinner } from '@/ui/Spinner';
import { useFeedback } from '@/ui/Feedback';
import { describeError } from '@/lib/errors';
import type { Inquiry } from '@/lib/types';
import { deleteInquiry, inquiriesQuery, setInquiryStatus } from './api';

export function InboxPage() {
  const { shop } = useShop();
  const { t, fmt } = useI18n();
  const { toast, confirm } = useFeedback();
  const queryClient = useQueryClient();
  const inquiries = useQuery(inquiriesQuery(shop.id));
  const [filter, setFilter] = useState<Inquiry['status']>('open');
  const list = (inquiries.data ?? []).filter((i) => i.status === filter);
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['shop', shop.id] });

  const act = async (fn: () => Promise<void>) => {
    try {
      await fn();
      refresh();
    } catch (err) {
      toast(describeError(err, t), 'error');
    }
  };

  return (
    <Page title={t.inbox.title} back="/more">
      <div className="flex flex-col gap-4">
        {!shop.inquiries_enabled && (
          <Card className="flex flex-col gap-3 p-4 text-sm text-ink-2 sm:flex-row sm:items-center">
            <span className="flex-1">{t.inbox.disabledNotice}</span>
            <ButtonLink to="/settings#public" size="sm">
              {t.settings.title}
            </ButtonLink>
          </Card>
        )}
        <FilterChips
          label={t.inbox.title}
          value={filter}
          onChange={setFilter}
          options={(['open', 'resolved'] as const).map((s) => ({
            value: s,
            label: t.inbox[s],
            count: inquiries.data?.filter((i) => i.status === s).length,
          }))}
        />
        {inquiries.isPending ? (
          <PageSpinner label={t.common.loading} />
        ) : list.length === 0 ? (
          <Card>
            <EmptyState icon={<Inbox />} title={t.inbox.empty} />
          </Card>
        ) : (
          list.map((i) => {
            const [first, ...rest] = i.name.split(' ');
            const newClient = `/clients/new?first=${encodeURIComponent(first ?? '')}&last=${encodeURIComponent(rest.join(' '))}&email=${encodeURIComponent(i.email)}&phone=${encodeURIComponent(i.phone ?? '')}`;
            return (
              <Card key={i.id} className="flex flex-col gap-3 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{i.name}</p>
                    <p className="text-sm text-ink-3">
                      {t.inbox.received} {fmt.dateTime(i.created_at)}
                    </p>
                  </div>
                  <IconButton
                    label={t.common.delete}
                    tone="danger"
                    size="sm"
                    onClick={async () => {
                      if (await confirm({ title: t.inbox.deleteConfirm, danger: true, confirmLabel: t.common.delete })) act(() => deleteInquiry(i.id));
                    }}
                  >
                    <Trash2 className="size-4" />
                  </IconButton>
                </div>
                <p className="whitespace-pre-line text-[0.9375rem]">{i.message}</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-2">
                  <a href={`mailto:${i.email}`} className="inline-flex items-center gap-1.5 hover:underline">
                    <Mail className="size-4" /> {i.email}
                  </a>
                  {i.phone && (
                    <a href={`tel:${i.phone.replace(/[^\d+]/g, '')}`} className="tabular inline-flex items-center gap-1.5 hover:underline">
                      <Phone className="size-4" /> {i.phone}
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <a href={`mailto:${i.email}`} className={buttonClass('secondary', 'sm')}>
                    <Mail className="size-4" /> {t.inbox.reply}
                  </a>
                  <Link to={newClient} className={buttonClass('secondary', 'sm')}>
                    <UserPlus className="size-4" /> {t.inbox.createClient}
                  </Link>
                  {i.status === 'open' ? (
                    <Button size="sm" icon={<CheckCircle2 className="size-4" />} className="col-span-2 sm:col-span-1" onClick={() => act(() => setInquiryStatus(i.id, 'resolved'))}>
                      {t.inbox.markResolved}
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" icon={<RotateCcw className="size-4" />} className="col-span-2 sm:col-span-1" onClick={() => act(() => setInquiryStatus(i.id, 'open'))}>
                      {t.inbox.reopen}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })
        )}
        <p className="px-1 text-xs text-ink-3">{t.inbox.retentionNote}</p>
      </div>
    </Page>
  );
}
