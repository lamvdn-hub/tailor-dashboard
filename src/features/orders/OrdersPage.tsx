import { useInfiniteQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import { ClipboardList, Plus } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { HeaderSearchButton } from '@/app/AppShell';
import { Page } from '@/ui/Page';
import { Card } from '@/ui/Card';
import { Button, ButtonLink } from '@/ui/Button';
import { FilterChips } from '@/ui/Segmented';
import { EmptyState, List } from '@/ui/List';
import { PageSpinner } from '@/ui/Spinner';
import { STATUS_GROUPS } from '@/domain/orders';
import { ordersQuery, type OrderFilter } from './api';
import { OrderRow } from './OrderRow';

const FILTERS: OrderFilter[] = ['active', ...STATUS_GROUPS, 'all'];

export function OrdersPage() {
  const { shop } = useShop();
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const filter = (FILTERS as string[]).includes(params.get('status') ?? '') ? (params.get('status') as OrderFilter) : 'active';
  const orders = useInfiniteQuery(ordersQuery(shop.id, filter));
  const rows = orders.data?.pages.flat() ?? [];

  const label = (f: OrderFilter) => (f === 'active' ? t.orders.activeOnly : f === 'all' ? t.common.all : t.statusGroup[f]);

  return (
    <Page
      title={t.orders.title}
      wide
      actions={
        <>
          <HeaderSearchButton />
          <ButtonLink to="/orders/new" variant="primary" size="sm" icon={<Plus className="size-4" />}>
            <span className="hidden sm:inline">{t.app.newOrder}</span>
          </ButtonLink>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <FilterChips
          label={t.orders.filterStatus}
          value={filter}
          options={FILTERS.map((f) => ({ value: f, label: label(f) }))}
          onChange={(f) => setParams(f === 'active' ? {} : { status: f }, { replace: true })}
        />
        {orders.isPending ? (
          <PageSpinner label={t.common.loading} />
        ) : rows.length === 0 ? (
          <Card>
            <EmptyState
              icon={<ClipboardList />}
              title={filter === 'active' || filter === 'all' ? t.orders.empty : t.orders.emptyFiltered}
              action={
                <ButtonLink to="/orders/new" variant="primary" icon={<Plus className="size-4" />}>
                  {t.app.newOrder}
                </ButtonLink>
              }
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <List>
              {rows.map((o) => (
                <OrderRow key={o.id} order={o} />
              ))}
            </List>
          </Card>
        )}
        {orders.hasNextPage && (
          <Button variant="secondary" loading={orders.isFetchingNextPage} onClick={() => orders.fetchNextPage()}>
            {t.common.showAll}
          </Button>
        )}
      </div>
    </Page>
  );
}
