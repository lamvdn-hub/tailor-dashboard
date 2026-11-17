-- Core schema: multi-shop workspaces and all shop-scoped business tables.
-- Every business row carries shop_id; cross-table references use composite
-- foreign keys (id, shop_id) so a row can never point into another shop.

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Users & shops
-- ---------------------------------------------------------------------------

create table public.profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '' check (length(full_name) <= 120),
  locale     text not null default 'sv' check (locale in ('sv', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shops (
  id                      uuid primary key default gen_random_uuid(),
  name                    text not null check (length(btrim(name)) between 1 and 120),
  slug                    text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,38}[a-z0-9]$'),
  order_prefix            text not null default 'ORD' check (order_prefix ~ '^[A-Z]{2,4}$'),
  legal_name              text check (length(legal_name) <= 160),
  org_number              text check (length(org_number) <= 32),
  address                 text check (length(address) <= 300),
  phone                   text check (length(phone) <= 40),
  email                   text check (length(email) <= 254),
  opening_hours           text check (length(opening_hours) <= 300),
  privacy_contact_email   text check (length(privacy_contact_email) <= 254),
  inquiries_enabled       boolean not null default false,
  client_retention_months integer not null default 36 check (client_retention_months between 6 and 120),
  currency                text not null default 'SEK' check (currency ~ '^[A-Z]{3}$'),
  timezone                text not null default 'Europe/Stockholm',
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create table public.shop_members (
  shop_id    uuid not null references public.shops (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  role       text not null check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  primary key (shop_id, user_id)
);
create index shop_members_user_idx on public.shop_members (user_id);

create table public.shop_invites (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops (id) on delete cascade,
  email       text not null check (email = lower(email) and length(email) <= 254),
  role        text not null default 'staff' check (role in ('owner', 'staff')),
  token       text not null unique default encode(extensions.gen_random_bytes(24), 'hex'),
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  accepted_by uuid references auth.users (id) on delete set null
);
create index shop_invites_shop_idx on public.shop_invites (shop_id);

-- ---------------------------------------------------------------------------
-- Clients
-- ---------------------------------------------------------------------------

create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  shop_id          uuid not null references public.shops (id) on delete cascade,
  first_name       text not null check (length(btrim(first_name)) between 1 and 80),
  last_name        text not null check (length(btrim(last_name)) between 1 and 80),
  phone            text check (length(phone) <= 40),
  email            text check (length(email) <= 254),
  notes            text check (length(notes) <= 4000),
  last_activity_at timestamptz not null default now(),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (id, shop_id)
);
create index clients_shop_name_idx on public.clients (shop_id, last_name, first_name);

-- ---------------------------------------------------------------------------
-- Fabrics
-- ---------------------------------------------------------------------------

create table public.fabrics (
  id            uuid primary key default gen_random_uuid(),
  shop_id       uuid not null references public.shops (id) on delete cascade,
  name          text not null check (length(btrim(name)) between 1 and 120),
  code          text check (length(code) <= 60),
  composition   text check (length(composition) <= 200),
  color_pattern text check (length(color_pattern) <= 200),
  in_stock      boolean not null default true,
  notes         text check (length(notes) <= 2000),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (id, shop_id)
);
create index fabrics_shop_name_idx on public.fabrics (shop_id, name);

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create table public.order_counters (
  shop_id uuid not null references public.shops (id) on delete cascade,
  day     date not null,
  last    integer not null,
  primary key (shop_id, day)
);

create table public.orders (
  id                  uuid primary key default gen_random_uuid(),
  shop_id             uuid not null references public.shops (id) on delete cascade,
  client_id           uuid not null,
  number              text not null,
  service             text not null check (service in ('mtm', 'bespoke')),
  garment             text not null check (garment in ('jacket', 'trousers', 'suit')),
  status              text not null default 'received',
  fabric_id           uuid,
  style               jsonb not null default '{}'::jsonb check (jsonb_typeof(style) = 'object'),
  measurements        jsonb not null default '{}'::jsonb check (jsonb_typeof(measurements) = 'object'),
  style_notes         text check (length(style_notes) <= 4000),
  jacket_notes        text check (length(jacket_notes) <= 4000),
  trousers_notes      text check (length(trousers_notes) <= 4000),
  client_requests     text check (length(client_requests) <= 4000),
  adjustment_notes    text check (length(adjustment_notes) <= 4000),
  due_date            date,
  price_minor         bigint check (price_minor >= 0),
  deposit_minor       bigint not null default 0 check (deposit_minor >= 0),
  status_token        text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  status_link_enabled boolean not null default true,
  created_by          uuid references auth.users (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (id, shop_id),
  unique (shop_id, number),
  foreign key (client_id, shop_id) references public.clients (id, shop_id) on delete cascade,
  foreign key (fabric_id, shop_id) references public.fabrics (id, shop_id) on delete set null (fabric_id),
  constraint orders_deposit_le_price check (price_minor is null or deposit_minor <= price_minor),
  constraint orders_status_matches_service check (
    (service = 'mtm' and status in ('received', 'fitting', 'ready', 'collected'))
    or (service = 'bespoke' and status in ('received', 'fitting_1', 'fitting_2', 'ready', 'collected'))
  )
);
create index orders_shop_created_idx on public.orders (shop_id, created_at desc);
create index orders_shop_status_idx on public.orders (shop_id, status);
create index orders_client_idx on public.orders (client_id, created_at desc);

create table public.order_status_events (
  id         bigint generated always as identity primary key,
  shop_id    uuid not null,
  order_id   uuid not null,
  status     text not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now(),
  foreign key (order_id, shop_id) references public.orders (id, shop_id) on delete cascade
);
create index order_status_events_order_idx on public.order_status_events (order_id, changed_at);

create table public.order_photos (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null,
  order_id   uuid not null,
  path       text not null unique,
  thumb_path text not null unique,
  size_bytes integer not null check (size_bytes > 0),
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  foreign key (order_id, shop_id) references public.orders (id, shop_id) on delete cascade,
  check (path like shop_id::text || '/' || order_id::text || '/%'),
  check (thumb_path like shop_id::text || '/' || order_id::text || '/%')
);
create index order_photos_order_idx on public.order_photos (order_id, created_at);

-- Storage objects whose metadata row is gone. Drained by the client after a
-- delete and by the storage-gc edge function as a backstop. Deliberately has
-- no foreign key so rows survive shop deletion.
create table public.storage_gc (
  path       text primary key,
  shop_id    uuid not null,
  queued_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------

create table public.tasks (
  id         uuid primary key default gen_random_uuid(),
  shop_id    uuid not null references public.shops (id) on delete cascade,
  title      text not null check (length(btrim(title)) between 1 and 300),
  notes      text check (length(notes) <= 4000),
  category   text not null default 'admin' check (category in ('alteration', 'fitting', 'pickup', 'order', 'admin')),
  priority   text not null default 'normal' check (priority in ('low', 'normal', 'high')),
  due_date   date,
  done_at    timestamptz,
  client_id  uuid,
  order_id   uuid,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (client_id, shop_id) references public.clients (id, shop_id) on delete set null (client_id),
  foreign key (order_id, shop_id) references public.orders (id, shop_id) on delete set null (order_id)
);
create index tasks_shop_due_idx on public.tasks (shop_id, done_at, due_date);

-- ---------------------------------------------------------------------------
-- Inquiries (public contact form inbox)
-- ---------------------------------------------------------------------------

create table public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  shop_id     uuid not null references public.shops (id) on delete cascade,
  name        text not null check (length(btrim(name)) between 1 and 120),
  email       text not null check (length(email) between 3 and 254),
  phone       text check (length(phone) <= 40),
  message     text not null check (length(btrim(message)) between 1 and 4000),
  status      text not null default 'open' check (status in ('open', 'resolved')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index inquiries_shop_idx on public.inquiries (shop_id, status, created_at desc);

-- ---------------------------------------------------------------------------
-- Audit log (data minimised: records who touched what, never field values)
-- ---------------------------------------------------------------------------

create table public.audit_log (
  id        bigint generated always as identity primary key,
  shop_id   uuid not null references public.shops (id) on delete cascade,
  actor     uuid references auth.users (id) on delete set null,
  action    text not null check (action in ('insert', 'update', 'delete', 'export')),
  entity    text not null,
  entity_id uuid,
  changed   text[],
  at        timestamptz not null default now()
);
create index audit_log_shop_at_idx on public.audit_log (shop_id, at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------

create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();
create trigger shops_touch    before update on public.shops    for each row execute function public.touch_updated_at();
create trigger clients_touch  before update on public.clients  for each row execute function public.touch_updated_at();
create trigger fabrics_touch  before update on public.fabrics  for each row execute function public.touch_updated_at();
create trigger orders_touch   before update on public.orders   for each row execute function public.touch_updated_at();
create trigger tasks_touch    before update on public.tasks    for each row execute function public.touch_updated_at();
