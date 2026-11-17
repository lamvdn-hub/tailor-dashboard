import { useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, CalendarClock, Inbox, Plus, UserPlus } from 'lucide-react';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { useAuth } from '@/features/auth/AuthProvider';
import { HeaderSearchButton } from '@/app/AppShell';
import { Page } from '@/ui/Page';
import { Card, Section } from '@/ui/Card';
import { ButtonLink } from '@/ui/Button';
import { EmptyState, List, Row } from '@/ui/List';
import { Badge } from '@/ui/Badge';
import { useFeedback } from '@/ui/Feedback';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/domain/money';
import { statusesInGroup, type StatusGroup } from '@/domain/orders';
import { recentOrdersQuery } from '@/features/orders/api';
import { OrderRow } from '@/features/orders/OrderRow';
import { isOverdue, tasksQuery } from '@/features/tasks/api';
import { profileQuery } from '@/features/account/api';
import { overviewQuery } from './api';

export function OverviewPage() {
  const { shop } = useShop();
  const { user } = useAuth();
  const { t, fmt } = useI18n();
  const { toast } = useFeedback();
  const location = useLocation();
  const navigate = useNavigate();
  const overview = useQuery(overviewQuery(shop.id));
  const recent = useQuery(recentOrdersQuery(shop.id));
  const tasks = useQuery(tasksQuery(shop.id));
  const profile = useQuery({ ...profileQuery(user!.id), enabled: Boolean(user) });

  // One-off messages passed through navigation state (e.g. after password reset).
  useEffect(() => {
    const flash = (location.state as { flash?: string } | null)?.flash;
    if (flash) {
      toast(flash);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, navigate, toast]);

  const o = overview.data;
  const count = (group: StatusGroup) => statusesInGroup(group).reduce((n, s) => n + (o?.orders_by_status[s] ?? 0), 0);
  const active = o ? count('open') + count('fitting') + count('ready') : 0;
  const openTasks = (tasks.data ?? []).filter((x) => !x.done_at).slice(0, 5);
  const firstName = profile.data?.full_name.split(' ')[0] ?? '';
  const isEmpty = o && o.clients === 0;

  return (
    <Page title={t.app.nav.overview} subtitle={shop.name} wide actions={<HeaderSearchButton />}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-2xl font-semibold tracking-tight">{t.overview.greeting(firstName)}</h2>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <ButtonLink to="/orders/new" variant="primary" icon={<Plus className="size-4" />}>
              {t.app.newOrder}
            </ButtonLink>
            <ButtonLink to="/clients/new" icon={<UserPlus className="size-4" />}>
              {t.app.newClient}
            </ButtonLink>
          </div>
        </div>

        {isEmpty ? (
          <Card>
            <EmptyState title={t.overview.emptyTitle} body={t.overview.emptyBody} />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Stat label={t.overview.activeOrders} value={o ? active : null} to="/orders" />
            <Stat label={t.overview.inFitting} value={o ? count('fitting') : null} to="/orders?status=fitting" tone="warn" />
            <Stat label={t.overview.readyForPickup} value={o ? count('ready') : null} to="/orders?status=ready" tone="ok" />
            <Stat label={t.overview.newThisWeek} value={o?.orders_this_week ?? null} />
          </div>
        )}

        {o && (o.overdue > 0 || o.due_soon > 0 || o.open_inquiries > 0) && (
          <div className="flex flex-wrap gap-2">
            {o.overdue > 0 && (
              <Link to="/orders" className="inline-flex">
                <Badge tone="danger" className="h-8 px-3 text-sm">
                  <AlertTriangle className="size-4" /> {t.overview.overdue}: {o.overdue}
                </Badge>
              </Link>
            )}
            {o.due_soon > 0 && (
              <Badge tone="warn" className="h-8 px-3 text-sm">
                <CalendarClock className="size-4" /> {t.overview.dueSoon}: {o.due_soon}
              </Badge>
            )}
            {o.open_inquiries > 0 && (
              <Link to="/inbox" className="inline-flex">
                <Badge tone="accent" className="h-8 px-3 text-sm">
                  <Inbox className="size-4" /> {t.overview.openInquiries}: {o.open_inquiries}
                </Badge>
              </Link>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Section title={t.overview.recentOrders} flush action={<Link to="/orders" className="text-sm font-medium text-accent">{t.common.showAll}</Link>}>
            {recent.data && recent.data.length > 0 ? (
              <List>
                {recent.data.map((order) => (
                  <OrderRow key={order.id} order={order} />
                ))}
              </List>
            ) : (
              <p className="p-4 text-sm text-ink-3">{t.orders.empty}</p>
            )}
          </Section>

          <div className="flex min-w-0 flex-col gap-6">
            <Section title={t.overview.upcomingTasks} flush action={<Link to="/tasks" className="text-sm font-medium text-accent">{t.common.showAll}</Link>}>
              {openTasks.length ? (
                <List>
                  {openTasks.map((task) => (
                    <Row
                      key={task.id}
                      to="/tasks"
                      chevron={false}
                      title={task.title}
                      subtitle={task.due_date ? fmt.relativeDay(task.due_date) : t.tasks.noDate}
                      trailing={isOverdue(task) ? <Badge tone="danger">{t.tasks.overdue}</Badge> : undefined}
                    />
                  ))}
                </List>
              ) : (
                <p className="p-4 text-sm text-ink-3">{t.overview.noTasks}</p>
              )}
            </Section>

            {o && o.outstanding_minor > 0 && (
              <Card className="p-4">
                <p className="text-sm text-ink-3">{t.overview.outstanding}</p>
                <p className="tabular mt-1 text-2xl font-semibold">{formatMoney(o.outstanding_minor, shop.currency, fmt.intl)}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}

function Stat({ label, value, to, tone }: { label: string; value: number | null; to?: string; tone?: 'ok' | 'warn' }) {
  const body = (
    <Card className={cn('flex h-full flex-col justify-between gap-3 p-4', to && 'transition-colors hover:border-line-strong')}>
      <span className="text-sm leading-tight text-ink-3">{label}</span>
      <span className={cn('tabular text-3xl font-semibold tracking-tight', tone === 'ok' && 'text-ok-ink', tone === 'warn' && 'text-warn-ink')}>
        {value ?? '–'}
      </span>
    </Card>
  );
  return to ? <Link to={to}>{body}</Link> : body;
}
