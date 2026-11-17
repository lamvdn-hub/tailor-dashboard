import { useI18n } from '@/i18n';
import { Row } from '@/ui/List';
import { StatusBadge } from '@/ui/Badge';
import { fullName } from '@/features/clients/api';
import { todayIso } from '@/features/tasks/api';
import type { OrderListItem } from '@/lib/types';

export function OrderRow({ order, showClient = true }: { order: OrderListItem; showClient?: boolean }) {
  const { t, fmt } = useI18n();
  const late = order.due_date !== null && order.due_date < todayIso() && !['ready', 'collected'].includes(order.status);
  const parts = [
    showClient ? order.number : null,
    t.garment[order.garment],
    order.due_date ? `${t.orders.due} ${fmt.relativeDay(order.due_date)}` : null,
  ].filter(Boolean);
  return (
    <Row
      to={`/orders/${order.id}`}
      title={showClient ? fullName(order.client) : order.number}
      subtitle={<span className={late ? 'text-danger-ink' : undefined}>{parts.join(' · ')}</span>}
      trailing={<StatusBadge status={order.status} />}
    />
  );
}
