// Row shapes returned by Supabase. Kept by hand in step with
// supabase/migrations; regenerate with `supabase gen types` if preferred.

import type { Garment, OrderStatus, Service, SuitStyle } from '@/domain/orders';
import type { MeasurementValues } from '@/domain/measurements';

export type Role = 'owner' | 'staff';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  order_prefix: string;
  legal_name: string | null;
  org_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  privacy_contact_email: string | null;
  inquiries_enabled: boolean;
  client_retention_months: number;
  currency: string;
  timezone: string;
  created_at: string;
}

export interface Membership {
  role: Role;
  shop: Shop;
}

export interface Member {
  user_id: string;
  role: Role;
  created_at: string;
  full_name: string;
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  token: string;
  expires_at: string;
  accepted_at: string | null;
}

export interface Profile {
  user_id: string;
  full_name: string;
  locale: 'sv' | 'en';
}

export interface Client {
  id: string;
  shop_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  notes: string | null;
  last_activity_at: string;
  created_at: string;
}

export interface Fabric {
  id: string;
  shop_id: string;
  name: string;
  code: string | null;
  composition: string | null;
  color_pattern: string | null;
  in_stock: boolean;
  notes: string | null;
}

export interface Order {
  id: string;
  shop_id: string;
  client_id: string;
  number: string;
  service: Service;
  garment: Garment;
  status: OrderStatus;
  fabric_id: string | null;
  style: SuitStyle;
  measurements: MeasurementValues;
  style_notes: string | null;
  jacket_notes: string | null;
  trousers_notes: string | null;
  client_requests: string | null;
  adjustment_notes: string | null;
  due_date: string | null;
  price_minor: number | null;
  deposit_minor: number;
  status_token: string;
  status_link_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderListItem = Pick<
  Order,
  'id' | 'number' | 'service' | 'garment' | 'status' | 'due_date' | 'created_at' | 'client_id' | 'price_minor' | 'deposit_minor'
> & { client: Pick<Client, 'first_name' | 'last_name'> | null };

export interface StatusEvent {
  status: OrderStatus;
  changed_at: string;
}

export interface OrderPhoto {
  id: string;
  path: string;
  thumb_path: string;
  size_bytes: number;
  created_at: string;
}

export type TaskCategory = 'alteration' | 'fitting' | 'pickup' | 'order' | 'admin';
export type TaskPriority = 'low' | 'normal' | 'high';

export interface Task {
  id: string;
  shop_id: string;
  title: string;
  notes: string | null;
  category: TaskCategory;
  priority: TaskPriority;
  due_date: string | null;
  done_at: string | null;
  client_id: string | null;
  order_id: string | null;
  created_at: string;
  client?: Pick<Client, 'id' | 'first_name' | 'last_name'> | null;
  order?: Pick<Order, 'id' | 'number'> | null;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: 'open' | 'resolved';
  created_at: string;
  resolved_at: string | null;
}

export interface AuditEntry {
  id: number;
  actor: string | null;
  action: 'insert' | 'update' | 'delete' | 'export';
  entity: string;
  entity_id: string | null;
  changed: string[] | null;
  at: string;
}

export interface Overview {
  clients: number;
  orders_by_status: Partial<Record<OrderStatus, number>>;
  orders_this_week: number;
  due_soon: number;
  overdue: number;
  tasks_due_today: number;
  open_inquiries: number;
  outstanding_minor: number;
}

export interface SearchHit {
  kind: 'client' | 'order' | 'fabric' | 'task' | 'inquiry';
  id: string;
  title: string;
  subtitle: string | null;
}

export interface PublicShop {
  name: string;
  slug: string;
  legal_name: string | null;
  org_number: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  opening_hours: string | null;
  privacy_contact_email: string | null;
  inquiries_enabled: boolean;
  client_retention_months: number;
}

export interface PublicOrderStatus {
  number: string;
  service: Service;
  garment: Garment;
  status: OrderStatus;
  created_at: string;
  due_date: string | null;
  events: Array<{ status: OrderStatus; at: string }>;
  shop: Pick<PublicShop, 'name' | 'slug' | 'address' | 'phone' | 'email' | 'opening_hours'>;
}
