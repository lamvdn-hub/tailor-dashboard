import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import { drainStorageGc } from '@/lib/storage';
import { PHOTO_BUCKET } from '@/lib/config';
import { sanitizeValues } from '@/domain/measurements';
import { statusesInGroup, type StatusGroup } from '@/domain/orders';
import type { Client, Fabric, Order, OrderListItem, StatusEvent } from '@/lib/types';

const PAGE = 40;
const LIST_COLUMNS =
  'id, number, service, garment, status, due_date, created_at, client_id, price_minor, deposit_minor, client:clients(first_name, last_name)';

export type OrderFilter = 'active' | 'all' | StatusGroup;

export const ordersQuery = (shopId: string, filter: OrderFilter) =>
  infiniteQueryOptions({
    queryKey: ['shop', shopId, 'orders', 'list', filter],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      let q = supabase
        .from('orders')
        .select(LIST_COLUMNS)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + PAGE - 1);
      if (filter === 'active') q = q.neq('status', 'collected');
      else if (filter !== 'all') q = q.in('status', statusesInGroup(filter));
      return must(await q) as unknown as OrderListItem[];
    },
    getNextPageParam: (last, pages) => (last.length === PAGE ? pages.length * PAGE : undefined),
  });

export const recentOrdersQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'orders', 'recent'],
    queryFn: async () =>
      must(
        await supabase
          .from('orders')
          .select(LIST_COLUMNS)
          .eq('shop_id', shopId)
          .neq('status', 'collected')
          .order('updated_at', { ascending: false })
          .limit(6),
      ) as unknown as OrderListItem[],
  });

export const clientOrdersQuery = (shopId: string, clientId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'orders', 'client', clientId],
    queryFn: async () =>
      must(
        await supabase
          .from('orders')
          .select('*, fabric:fabrics(name)')
          .eq('client_id', clientId)
          .order('created_at', { ascending: false }),
      ) as unknown as Array<Order & { fabric: Pick<Fabric, 'name'> | null }>,
  });

export type OrderDetail = Order & {
  client: Pick<Client, 'id' | 'first_name' | 'last_name' | 'phone' | 'email'>;
  fabric: Pick<Fabric, 'id' | 'name'> | null;
};

export const orderQuery = (shopId: string, orderId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'orders', 'detail', orderId],
    queryFn: async () => {
      const row = must(
        await supabase
          .from('orders')
          .select('*, client:clients(id, first_name, last_name, phone, email), fabric:fabrics(id, name)')
          .eq('id', orderId)
          .maybeSingle(),
      ) as unknown as OrderDetail | null;
      if (row) row.measurements = sanitizeValues(row.measurements);
      return row;
    },
  });

export const orderEventsQuery = (shopId: string, orderId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'orders', 'events', orderId],
    queryFn: async () =>
      must(
        await supabase
          .from('order_status_events')
          .select('status, changed_at')
          .eq('order_id', orderId)
          .order('changed_at', { ascending: false }),
      ) as StatusEvent[],
  });

export type OrderInput = Pick<
  Order,
  | 'client_id'
  | 'service'
  | 'garment'
  | 'status'
  | 'fabric_id'
  | 'style'
  | 'measurements'
  | 'style_notes'
  | 'jacket_notes'
  | 'trousers_notes'
  | 'client_requests'
  | 'adjustment_notes'
  | 'due_date'
  | 'price_minor'
  | 'deposit_minor'
>;

export async function createOrder(shopId: string, input: OrderInput): Promise<Order> {
  return must(await supabase.from('orders').insert({ ...input, shop_id: shopId }).select().single()) as Order;
}

export async function updateOrder(orderId: string, patch: Partial<OrderInput> & { status_link_enabled?: boolean }): Promise<void> {
  must(await supabase.from('orders').update(patch).eq('id', orderId).select('id').single());
}

export async function deleteOrder(shopId: string, orderId: string): Promise<void> {
  must(await supabase.from('orders').delete().eq('id', orderId));
  await drainStorageGc(shopId);
}

export async function regenerateStatusToken(orderId: string): Promise<string> {
  return must(await supabase.rpc('regenerate_status_token', { p_order: orderId })) as string;
}

/** The most recent order of a client that has any measurements. */
export async function latestMeasurements(clientId: string, excludeOrderId?: string) {
  let q = supabase
    .from('orders')
    .select('id, number, measurements')
    .eq('client_id', clientId)
    .neq('measurements', '{}')
    .order('created_at', { ascending: false })
    .limit(1);
  if (excludeOrderId) q = q.neq('id', excludeOrderId);
  const rows = must(await q) as Array<Pick<Order, 'id' | 'number' | 'measurements'>>;
  return rows[0] ?? null;
}

export function trackingUrl(token: string): string {
  return `${window.location.origin}/track/${token}`;
}

export { PHOTO_BUCKET };
