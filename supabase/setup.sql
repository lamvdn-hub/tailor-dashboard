-- Tailor Desk: complete database setup for a NEW, EMPTY Supabase project.
-- Paste into Supabase Dashboard > SQL Editor and run once. Same content as
-- supabase/migrations/*.sql in order; prefer 'supabase db push' if you use the CLI.
-- Requires Postgres 15+ (Supabase default).


-- ===========================================================================
-- 20261117000100_core_schema.sql
-- ===========================================================================

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

-- ===========================================================================
-- 20261117000200_triggers.sql
-- ===========================================================================

-- Behavioural triggers: profile bootstrap, order numbering, status history,
-- client activity tracking, storage garbage collection and audit logging.

-- ---------------------------------------------------------------------------
-- Profile row for every new auth user
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_locale text := coalesce(new.raw_user_meta_data ->> 'locale', 'sv');
begin
  insert into public.profiles (user_id, full_name, locale)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', ''), 120),
    case when v_locale in ('sv', 'en') then v_locale else 'sv' end
  )
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Order number: PREFIX-YYMMDD-NNN, per shop, per local day, concurrency-safe
-- ---------------------------------------------------------------------------

create or replace function public.assign_order_number()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_prefix text;
  v_tz     text;
  v_day    date;
  v_seq    integer;
begin
  select order_prefix, timezone into v_prefix, v_tz
  from public.shops where id = new.shop_id;

  v_day := (now() at time zone v_tz)::date;

  insert into public.order_counters as c (shop_id, day, last)
  values (new.shop_id, v_day, 1)
  on conflict (shop_id, day) do update set last = c.last + 1
  returning last into v_seq;

  new.number := v_prefix || '-' || to_char(v_day, 'YYMMDD') || '-' || lpad(v_seq::text, 3, '0');
  return new;
end;
$$;

create trigger orders_assign_number
  before insert on public.orders
  for each row execute function public.assign_order_number();

-- Clients must not be able to forge or change these columns. Trusted RPCs
-- (e.g. regenerate_status_token) opt out via a transaction-local setting.
create or replace function public.guard_order_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_setting('app.trusted_order_write', true) = 'on' then
    return new;
  end if;
  new.number       := old.number;
  new.shop_id      := old.shop_id;
  new.status_token := old.status_token;
  new.created_by   := old.created_by;
  new.created_at   := old.created_at;
  return new;
end;
$$;

create trigger orders_guard_columns
  before update on public.orders
  for each row execute function public.guard_order_columns();

create or replace function public.set_order_creator()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by := auth.uid();
  return new;
end;
$$;

create trigger orders_set_creator before insert on public.orders
  for each row execute function public.set_order_creator();
create trigger tasks_set_creator before insert on public.tasks
  for each row execute function public.set_order_creator();
create trigger order_photos_set_creator before insert on public.order_photos
  for each row execute function public.set_order_creator();

-- ---------------------------------------------------------------------------
-- Status history (powers the public tracking timeline)
-- ---------------------------------------------------------------------------

create or replace function public.record_order_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_events (shop_id, order_id, status, changed_by)
    values (new.shop_id, new.id, new.status, (select u.id from auth.users u where u.id = auth.uid()));
  end if;
  return null;
end;
$$;

create trigger orders_record_status
  after insert or update of status on public.orders
  for each row execute function public.record_order_status();

-- ---------------------------------------------------------------------------
-- Client activity (drives retention): any order change refreshes the client
-- ---------------------------------------------------------------------------

create or replace function public.touch_client_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.clients set last_activity_at = now() where id = new.client_id;
  return null;
end;
$$;

create trigger orders_touch_client
  after insert or update on public.orders
  for each row execute function public.touch_client_activity();

-- ---------------------------------------------------------------------------
-- Queue storage objects for removal when their metadata row disappears
-- (covers cascades from order, client and shop deletion)
-- ---------------------------------------------------------------------------

create or replace function public.queue_photo_storage_gc()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.storage_gc (path, shop_id)
  values (old.path, old.shop_id), (old.thumb_path, old.shop_id)
  on conflict (path) do nothing;
  return null;
end;
$$;

create trigger order_photos_queue_gc
  after delete on public.order_photos
  for each row execute function public.queue_photo_storage_gc();

-- ---------------------------------------------------------------------------
-- Audit log: who changed which record and which columns. No values stored,
-- so erasure of a client is not undermined by copies in the log.
-- ---------------------------------------------------------------------------

create or replace function public.write_audit_log()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row     jsonb;
  v_old     jsonb;
  v_changed text[];
  v_shop    uuid;
begin
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
  else
    v_row := to_jsonb(new);
  end if;

  v_shop := (v_row ->> 'shop_id')::uuid;

  -- Skip rows whose shop is being deleted in this same statement.
  if not exists (select 1 from public.shops where id = v_shop) then
    return null;
  end if;

  if tg_op = 'UPDATE' then
    v_old := to_jsonb(old);
    select array_agg(key order by key) into v_changed
    from jsonb_each(v_row) n
    where n.key not in ('updated_at', 'last_activity_at')
      and n.value is distinct from v_old -> n.key;
    if v_changed is null then
      return null;
    end if;
  end if;

  insert into public.audit_log (shop_id, actor, action, entity, entity_id, changed)
  values (
    v_shop,
    -- null when the actor is the user currently being deleted
    (select u.id from auth.users u where u.id = auth.uid()),
    lower(tg_op),
    tg_table_name,
    case when v_row ? 'id' then (v_row ->> 'id')::uuid else (v_row ->> 'user_id')::uuid end,
    v_changed
  );
  return null;
end;
$$;

create trigger clients_audit      after insert or update or delete on public.clients      for each row execute function public.write_audit_log();
create trigger orders_audit       after insert or update or delete on public.orders       for each row execute function public.write_audit_log();
create trigger order_photos_audit after insert or delete           on public.order_photos for each row execute function public.write_audit_log();
create trigger fabrics_audit      after insert or update or delete on public.fabrics      for each row execute function public.write_audit_log();
create trigger tasks_audit        after insert or update or delete on public.tasks        for each row execute function public.write_audit_log();
create trigger inquiries_audit    after update or delete           on public.inquiries    for each row execute function public.write_audit_log();
create trigger shop_members_audit after insert or update or delete on public.shop_members for each row execute function public.write_audit_log();

-- ===========================================================================
-- 20261117000300_access_control.sql
-- ===========================================================================

-- Row level security. Access rule: a signed-in user sees and edits rows of
-- shops they are a member of. Ownership-only actions go through RPCs.

create or replace function public.is_shop_member(p_shop uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shop_members
    where shop_id = p_shop and user_id = auth.uid()
  );
$$;

create or replace function public.is_shop_owner(p_shop uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.shop_members
    where shop_id = p_shop and user_id = auth.uid() and role = 'owner'
  );
$$;

-- Text variant for storage paths ("<shop_id>/<order_id>/<file>").
create or replace function public.is_shop_member_text(p_shop text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_shop !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return false;
  end if;
  return public.is_shop_member(p_shop::uuid);
end;
$$;

revoke all on function public.is_shop_member(uuid) from public;
revoke all on function public.is_shop_owner(uuid) from public;
revoke all on function public.is_shop_member_text(text) from public;
grant execute on function public.is_shop_member(uuid) to authenticated;
grant execute on function public.is_shop_owner(uuid) to authenticated;
grant execute on function public.is_shop_member_text(text) to authenticated;

alter table public.profiles            enable row level security;
alter table public.shops               enable row level security;
alter table public.shop_members        enable row level security;
alter table public.shop_invites        enable row level security;
alter table public.clients             enable row level security;
alter table public.fabrics             enable row level security;
alter table public.order_counters      enable row level security;
alter table public.orders              enable row level security;
alter table public.order_status_events enable row level security;
alter table public.order_photos        enable row level security;
alter table public.storage_gc          enable row level security;
alter table public.tasks               enable row level security;
alter table public.inquiries           enable row level security;
alter table public.audit_log           enable row level security;

-- Profiles: own row, plus names of people you share a shop with.
create policy profiles_select on public.profiles for select to authenticated
  using (
    user_id = (select auth.uid())
    or exists (
      select 1 from public.shop_members mine
      join public.shop_members theirs on theirs.shop_id = mine.shop_id
      where mine.user_id = (select auth.uid()) and theirs.user_id = profiles.user_id
    )
  );
create policy profiles_update on public.profiles for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Shops: members read, owners update. Create/delete via RPC.
create policy shops_select on public.shops for select to authenticated
  using (public.is_shop_member(id));
create policy shops_update on public.shops for update to authenticated
  using (public.is_shop_owner(id))
  with check (public.is_shop_owner(id));

-- Members: visible to fellow members. Mutations via RPC.
create policy shop_members_select on public.shop_members for select to authenticated
  using (public.is_shop_member(shop_id));

-- Invites: owners only.
create policy shop_invites_owner on public.shop_invites for all to authenticated
  using (public.is_shop_owner(shop_id))
  with check (public.is_shop_owner(shop_id));

-- Shop-scoped business data: full access for members.
create policy clients_member on public.clients for all to authenticated
  using (public.is_shop_member(shop_id)) with check (public.is_shop_member(shop_id));
create policy fabrics_member on public.fabrics for all to authenticated
  using (public.is_shop_member(shop_id)) with check (public.is_shop_member(shop_id));
create policy orders_member on public.orders for all to authenticated
  using (public.is_shop_member(shop_id)) with check (public.is_shop_member(shop_id));
create policy order_photos_member on public.order_photos for all to authenticated
  using (public.is_shop_member(shop_id)) with check (public.is_shop_member(shop_id));
create policy tasks_member on public.tasks for all to authenticated
  using (public.is_shop_member(shop_id)) with check (public.is_shop_member(shop_id));
create policy storage_gc_member on public.storage_gc for select to authenticated
  using (public.is_shop_member(shop_id));
create policy storage_gc_member_delete on public.storage_gc for delete to authenticated
  using (public.is_shop_member(shop_id));

-- Read-only to members; written by triggers / RPCs.
create policy order_status_events_select on public.order_status_events for select to authenticated
  using (public.is_shop_member(shop_id));
create policy inquiries_select on public.inquiries for select to authenticated
  using (public.is_shop_member(shop_id));
create policy inquiries_update on public.inquiries for update to authenticated
  using (public.is_shop_member(shop_id)) with check (public.is_shop_member(shop_id));
create policy inquiries_delete on public.inquiries for delete to authenticated
  using (public.is_shop_member(shop_id));
create policy audit_log_owner on public.audit_log for select to authenticated
  using (public.is_shop_owner(shop_id));

-- order_counters: no policies; only the security-definer trigger touches it.

-- Anonymous visitors get nothing from tables; public pages use RPCs below.
revoke all on all tables in schema public from anon;

-- ===========================================================================
-- 20261117000400_rpc.sql
-- ===========================================================================

-- Remote procedures used by the app. Every function is SECURITY DEFINER with
-- an empty search_path and performs its own authorisation check.

-- ---------------------------------------------------------------------------
-- Shops & membership
-- ---------------------------------------------------------------------------

create or replace function public.create_shop(p_name text, p_slug text, p_order_prefix text)
returns public.shops
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop public.shops;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  insert into public.shops (name, slug, order_prefix)
  values (btrim(p_name), lower(btrim(p_slug)), upper(btrim(p_order_prefix)))
  returning * into v_shop;

  insert into public.shop_members (shop_id, user_id, role)
  values (v_shop.id, auth.uid(), 'owner');

  return v_shop;
end;
$$;

-- Public, minimal invite preview so the invitee sees which shop they join.
create or replace function public.get_invite(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'shop_name', s.name,
    'email', i.email,
    'role', i.role,
    'expired', i.expires_at < now(),
    'accepted', i.accepted_at is not null
  )
  from public.shop_invites i
  join public.shops s on s.id = i.shop_id
  where i.token = p_token;
$$;

create or replace function public.accept_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite public.shop_invites;
  v_email  text;
begin
  if auth.uid() is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_invite from public.shop_invites where token = p_token for update;
  if not found then
    raise exception 'invite_not_found' using errcode = 'P0002';
  end if;
  if v_invite.accepted_at is not null then
    raise exception 'invite_used' using errcode = 'P0001';
  end if;
  if v_invite.expires_at < now() then
    raise exception 'invite_expired' using errcode = 'P0001';
  end if;

  select lower(email) into v_email from auth.users where id = auth.uid();
  if v_email is distinct from v_invite.email then
    raise exception 'invite_email_mismatch' using errcode = '42501';
  end if;

  insert into public.shop_members (shop_id, user_id, role)
  values (v_invite.shop_id, auth.uid(), v_invite.role)
  on conflict (shop_id, user_id) do nothing;

  update public.shop_invites
  set accepted_at = now(), accepted_by = auth.uid()
  where id = v_invite.id;

  return v_invite.shop_id;
end;
$$;

create or replace function public.owner_count(p_shop uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer from public.shop_members where shop_id = p_shop and role = 'owner';
$$;
revoke all on function public.owner_count(uuid) from public;

create or replace function public.set_member_role(p_shop uuid, p_user uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_shop_owner(p_shop) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_role not in ('owner', 'staff') then
    raise exception 'invalid_role' using errcode = '22023';
  end if;
  if p_role = 'staff' and public.owner_count(p_shop) = 1
     and exists (select 1 from public.shop_members where shop_id = p_shop and user_id = p_user and role = 'owner') then
    raise exception 'last_owner' using errcode = 'P0001';
  end if;
  update public.shop_members set role = p_role where shop_id = p_shop and user_id = p_user;
end;
$$;

create or replace function public.remove_member(p_shop uuid, p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user <> auth.uid() and not public.is_shop_owner(p_shop) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if exists (select 1 from public.shop_members where shop_id = p_shop and user_id = p_user and role = 'owner')
     and public.owner_count(p_shop) = 1 then
    raise exception 'last_owner' using errcode = 'P0001';
  end if;
  delete from public.shop_members where shop_id = p_shop and user_id = p_user;
end;
$$;

create or replace function public.delete_shop(p_shop uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_shop_owner(p_shop) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.shops where id = p_shop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Orders
-- ---------------------------------------------------------------------------

create or replace function public.regenerate_status_token(p_order uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text := encode(extensions.gen_random_bytes(16), 'hex');
  v_shop  uuid;
begin
  select shop_id into v_shop from public.orders where id = p_order;
  if v_shop is null or not public.is_shop_member(v_shop) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  perform set_config('app.trusted_order_write', 'on', true);
  update public.orders set status_token = v_token where id = p_order;
  perform set_config('app.trusted_order_write', 'off', true);
  return v_token;
end;
$$;

-- Public tracking page. Returns only what a customer needs: no name, no
-- measurements, no prices.
create or replace function public.get_order_status(p_token text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'number', o.number,
    'service', o.service,
    'garment', o.garment,
    'status', o.status,
    'created_at', o.created_at,
    'due_date', o.due_date,
    'events', coalesce((
      select jsonb_agg(jsonb_build_object('status', e.status, 'at', e.changed_at) order by e.changed_at)
      from public.order_status_events e where e.order_id = o.id
    ), '[]'::jsonb),
    'shop', jsonb_build_object(
      'name', s.name, 'slug', s.slug, 'address', s.address, 'phone', s.phone,
      'email', s.email, 'opening_hours', s.opening_hours
    )
  )
  from public.orders o
  join public.shops s on s.id = o.shop_id
  where o.status_token = p_token
    and o.status_link_enabled
    and length(p_token) = 32;
$$;

-- ---------------------------------------------------------------------------
-- Public shop page & contact form
-- ---------------------------------------------------------------------------

create or replace function public.get_public_shop(p_slug text)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'name', name, 'slug', slug, 'legal_name', legal_name, 'org_number', org_number,
    'address', address, 'phone', phone, 'email', email, 'opening_hours', opening_hours,
    'privacy_contact_email', privacy_contact_email,
    'inquiries_enabled', inquiries_enabled,
    'client_retention_months', client_retention_months
  )
  from public.shops where slug = lower(p_slug);
$$;

create or replace function public.submit_inquiry(
  p_slug text, p_name text, p_email text, p_phone text, p_message text, p_privacy_ack boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_shop uuid;
begin
  if p_privacy_ack is not true then
    raise exception 'privacy_ack_required' using errcode = '22023';
  end if;
  if p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  select id into v_shop from public.shops where slug = lower(p_slug) and inquiries_enabled;
  if v_shop is null then
    raise exception 'inquiries_closed' using errcode = 'P0002';
  end if;

  -- Basic abuse throttling without storing IP addresses.
  if (select count(*) from public.inquiries
      where shop_id = v_shop and lower(email) = lower(btrim(p_email))
        and created_at > now() - interval '1 hour') >= 3
     or (select count(*) from public.inquiries
         where shop_id = v_shop and created_at > now() - interval '1 hour') >= 60 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;

  insert into public.inquiries (shop_id, name, email, phone, message)
  values (v_shop, btrim(p_name), lower(btrim(p_email)), nullif(btrim(p_phone), ''), btrim(p_message));
end;
$$;

-- ---------------------------------------------------------------------------
-- Overview & search
-- ---------------------------------------------------------------------------

create or replace function public.shop_overview(p_shop uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_today date;
  v_result jsonb;
begin
  if not public.is_shop_member(p_shop) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  select (now() at time zone timezone)::date into v_today from public.shops where id = p_shop;

  select jsonb_build_object(
    'clients', (select count(*) from public.clients where shop_id = p_shop),
    'orders_by_status', coalesce((
      select jsonb_object_agg(status, n) from (
        select status, count(*) n from public.orders where shop_id = p_shop group by status
      ) t), '{}'::jsonb),
    'orders_this_week', (select count(*) from public.orders
      where shop_id = p_shop and created_at >= now() - interval '7 days'),
    'due_soon', (select count(*) from public.orders
      where shop_id = p_shop and status <> 'collected'
        and due_date between v_today and v_today + 7),
    'overdue', (select count(*) from public.orders
      where shop_id = p_shop and status not in ('ready', 'collected') and due_date < v_today),
    'tasks_due_today', (select count(*) from public.tasks
      where shop_id = p_shop and done_at is null and due_date <= v_today),
    'open_inquiries', (select count(*) from public.inquiries
      where shop_id = p_shop and status = 'open'),
    'outstanding_minor', (select coalesce(sum(price_minor - deposit_minor), 0) from public.orders
      where shop_id = p_shop and status <> 'collected' and price_minor is not null)
  ) into v_result;

  return v_result;
end;
$$;

create or replace function public.search_shop(p_shop uuid, p_query text)
returns table (kind text, id uuid, title text, subtitle text)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_q text;
  v_compact text;
begin
  if not public.is_shop_member(p_shop) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  v_q := '%' || replace(replace(replace(btrim(coalesce(p_query, '')), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  -- Order numbers are matched ignoring separators: "ata 250101" finds ATA-250101-001.
  v_compact := regexp_replace(upper(coalesce(p_query, '')), '[^A-Z0-9]', '', 'g');
  if length(btrim(coalesce(p_query, ''))) < 2 then
    return;
  end if;

  return query
  (select 'client'::text, c.id, c.first_name || ' ' || c.last_name, coalesce(c.phone, c.email)
   from public.clients c
   where c.shop_id = p_shop
     and (c.first_name || ' ' || c.last_name ilike v_q or c.email ilike v_q or c.phone ilike v_q)
   order by c.last_name, c.first_name limit 6)
  union all
  (select 'order'::text, o.id, o.number, c.first_name || ' ' || c.last_name
   from public.orders o join public.clients c on c.id = o.client_id
   where o.shop_id = p_shop
     and ((length(v_compact) >= 2 and replace(o.number, '-', '') like '%' || v_compact || '%')
          or c.first_name || ' ' || c.last_name ilike v_q)
   order by o.created_at desc limit 6)
  union all
  (select 'fabric'::text, f.id, f.name, coalesce(f.code, f.composition)
   from public.fabrics f
   where f.shop_id = p_shop
     and (f.name ilike v_q or f.code ilike v_q or f.composition ilike v_q or f.color_pattern ilike v_q)
   order by f.name limit 4)
  union all
  (select 'task'::text, t.id, t.title, t.category
   from public.tasks t
   where t.shop_id = p_shop and t.title ilike v_q
   order by t.done_at nulls first, t.due_date limit 4)
  union all
  (select 'inquiry'::text, i.id, i.name, left(i.message, 80)
   from public.inquiries i
   where i.shop_id = p_shop and (i.name ilike v_q or i.email ilike v_q or i.message ilike v_q)
   order by i.created_at desc limit 4);
end;
$$;

-- ---------------------------------------------------------------------------
-- GDPR: access, portability, erasure
-- ---------------------------------------------------------------------------

-- Everything the shop holds about one client (Art. 15 / 20 response).
create or replace function public.export_client_data(p_client uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_client public.clients;
  v_result jsonb;
begin
  select * into v_client from public.clients where id = p_client;
  if not found or not public.is_shop_member(v_client.shop_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'controller', (select jsonb_build_object('name', coalesce(legal_name, name), 'org_number', org_number,
                                             'email', coalesce(privacy_contact_email, email))
                   from public.shops where id = v_client.shop_id),
    'client', to_jsonb(v_client) - 'shop_id',
    'orders', coalesce((
      select jsonb_agg(
        (to_jsonb(o) - 'shop_id' - 'status_token')
        || jsonb_build_object(
             'status_history', (select coalesce(jsonb_agg(jsonb_build_object('status', e.status, 'at', e.changed_at) order by e.changed_at), '[]'::jsonb)
                                from public.order_status_events e where e.order_id = o.id),
             'photos', (select coalesce(jsonb_agg(p.path order by p.created_at), '[]'::jsonb)
                        from public.order_photos p where p.order_id = o.id))
        order by o.created_at)
      from public.orders o where o.client_id = p_client), '[]'::jsonb),
    'tasks', coalesce((
      select jsonb_agg(jsonb_build_object('title', t.title, 'notes', t.notes, 'due_date', t.due_date, 'done_at', t.done_at))
      from public.tasks t where t.client_id = p_client), '[]'::jsonb)
  ) into v_result;

  insert into public.audit_log (shop_id, actor, action, entity, entity_id)
  values (v_client.shop_id, auth.uid(), 'export', 'clients', p_client);

  return v_result;
end;
$$;

-- Full shop export for the controller (owner only).
create or replace function public.export_shop_data(p_shop uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not public.is_shop_owner(p_shop) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'exported_at', now(),
    'shop', (select to_jsonb(s) from public.shops s where s.id = p_shop),
    'members', (select coalesce(jsonb_agg(jsonb_build_object('user_id', m.user_id, 'role', m.role, 'name', p.full_name)), '[]'::jsonb)
                from public.shop_members m left join public.profiles p on p.user_id = m.user_id where m.shop_id = p_shop),
    'clients', (select coalesce(jsonb_agg(to_jsonb(c) - 'shop_id'), '[]'::jsonb) from public.clients c where c.shop_id = p_shop),
    'orders', (select coalesce(jsonb_agg(to_jsonb(o) - 'shop_id' - 'status_token'), '[]'::jsonb) from public.orders o where o.shop_id = p_shop),
    'order_status_events', (select coalesce(jsonb_agg(to_jsonb(e) - 'shop_id'), '[]'::jsonb) from public.order_status_events e where e.shop_id = p_shop),
    'order_photos', (select coalesce(jsonb_agg(to_jsonb(p) - 'shop_id'), '[]'::jsonb) from public.order_photos p where p.shop_id = p_shop),
    'fabrics', (select coalesce(jsonb_agg(to_jsonb(f) - 'shop_id'), '[]'::jsonb) from public.fabrics f where f.shop_id = p_shop),
    'tasks', (select coalesce(jsonb_agg(to_jsonb(t) - 'shop_id'), '[]'::jsonb) from public.tasks t where t.shop_id = p_shop),
    'inquiries', (select coalesce(jsonb_agg(to_jsonb(i) - 'shop_id'), '[]'::jsonb) from public.inquiries i where i.shop_id = p_shop)
  ) into v_result;

  insert into public.audit_log (shop_id, actor, action, entity, entity_id)
  values (p_shop, auth.uid(), 'export', 'shops', p_shop);

  return v_result;
end;
$$;

-- Personal data held about the signed-in staff user.
create or replace function public.export_my_data()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'exported_at', now(),
    'account', (select jsonb_build_object('id', u.id, 'email', u.email, 'created_at', u.created_at,
                                          'last_sign_in_at', u.last_sign_in_at)
                from auth.users u where u.id = auth.uid()),
    'profile', (select to_jsonb(p) from public.profiles p where p.user_id = auth.uid()),
    'memberships', (select coalesce(jsonb_agg(jsonb_build_object('shop', s.name, 'role', m.role, 'since', m.created_at)), '[]'::jsonb)
                    from public.shop_members m join public.shops s on s.id = m.shop_id
                    where m.user_id = auth.uid())
  );
$$;

-- Erase the signed-in user. Shops where they are the only member are deleted
-- with them; shops with other members must have another owner first.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid  uuid := auth.uid();
  v_shop record;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  for v_shop in
    select m.shop_id,
           (select count(*) from public.shop_members x where x.shop_id = m.shop_id) as members,
           public.owner_count(m.shop_id) as owners
    from public.shop_members m
    where m.user_id = v_uid and m.role = 'owner'
  loop
    if v_shop.members = 1 then
      delete from public.shops where id = v_shop.shop_id;
    elsif v_shop.owners = 1 then
      raise exception 'transfer_ownership_required' using errcode = 'P0001';
    end if;
  end loop;

  delete from auth.users where id = v_uid;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;

grant execute on function public.create_shop(text, text, text) to authenticated;
grant execute on function public.accept_invite(text) to authenticated;
grant execute on function public.set_member_role(uuid, uuid, text) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.delete_shop(uuid) to authenticated;
grant execute on function public.regenerate_status_token(uuid) to authenticated;
grant execute on function public.shop_overview(uuid) to authenticated;
grant execute on function public.search_shop(uuid, text) to authenticated;
grant execute on function public.export_client_data(uuid) to authenticated;
grant execute on function public.export_shop_data(uuid) to authenticated;
grant execute on function public.export_my_data() to authenticated;
grant execute on function public.delete_my_account() to authenticated;
grant execute on function public.is_shop_member(uuid) to authenticated;
grant execute on function public.is_shop_owner(uuid) to authenticated;
grant execute on function public.is_shop_member_text(text) to authenticated;

grant execute on function public.get_invite(text) to anon, authenticated;
grant execute on function public.get_order_status(text) to anon, authenticated;
grant execute on function public.get_public_shop(text) to anon, authenticated;
grant execute on function public.submit_inquiry(text, text, text, text, text, boolean) to anon, authenticated;

-- ===========================================================================
-- 20261117000500_storage_and_retention.sql
-- ===========================================================================

-- Private photo bucket scoped by shop folder, and automated data retention.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('order-photos', 'order-photos', false, 5242880, array['image/jpeg', 'image/webp'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Object names are "<shop_id>/<order_id>/<file>.jpg".
create policy order_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'order-photos' and public.is_shop_member_text((storage.foldername(name))[1]));
create policy order_photos_write on storage.objects for insert to authenticated
  with check (bucket_id = 'order-photos' and public.is_shop_member_text((storage.foldername(name))[1]));
create policy order_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'order-photos' and public.is_shop_member_text((storage.foldername(name))[1]));

-- ---------------------------------------------------------------------------
-- Retention (GDPR Art. 5(1)(e) storage limitation)
--  * clients with no activity for the shop's retention period, and no
--    unfinished orders, are deleted with their orders and photos
--  * audit log entries older than 12 months
--  * resolved inquiries older than 12 months, any inquiry older than 24 months
--  * unaccepted invites one month after expiry, order counters older than 2 days
-- Runs daily via pg_cron when available; can also be called by service_role.
-- ---------------------------------------------------------------------------

create or replace function public.run_retention()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_clients   integer;
  v_audit     integer;
  v_inquiries integer;
  v_invites   integer;
begin
  delete from public.clients c
  using public.shops s
  where s.id = c.shop_id
    and c.last_activity_at < now() - make_interval(months => s.client_retention_months)
    and not exists (
      select 1 from public.orders o
      where o.client_id = c.id and o.status <> 'collected'
    );
  get diagnostics v_clients = row_count;

  delete from public.audit_log where at < now() - interval '12 months';
  get diagnostics v_audit = row_count;

  delete from public.inquiries
  where (status = 'resolved' and coalesce(resolved_at, created_at) < now() - interval '12 months')
     or created_at < now() - interval '24 months';
  get diagnostics v_inquiries = row_count;

  delete from public.shop_invites
  where accepted_at is null and expires_at < now() - interval '1 month';
  get diagnostics v_invites = row_count;

  delete from public.order_counters where day < current_date - 2;

  return jsonb_build_object(
    'clients_deleted', v_clients,
    'audit_entries_deleted', v_audit,
    'inquiries_deleted', v_inquiries,
    'invites_deleted', v_invites
  );
end;
$$;

revoke execute on function public.run_retention() from public, anon, authenticated;
grant execute on function public.run_retention() to service_role;

-- Clients due for deletion within the next 30 days, so staff can review.
create or replace function public.retention_preview(p_shop uuid)
returns table (id uuid, first_name text, last_name text, last_activity_at timestamptz, deletes_on date)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_shop_member(p_shop) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select c.id, c.first_name, c.last_name, c.last_activity_at,
         (c.last_activity_at + make_interval(months => s.client_retention_months))::date
  from public.clients c
  join public.shops s on s.id = c.shop_id
  where c.shop_id = p_shop
    and c.last_activity_at + make_interval(months => s.client_retention_months) < now() + interval '30 days'
    and not exists (select 1 from public.orders o where o.client_id = c.id and o.status <> 'collected')
  order by c.last_activity_at;
end;
$$;

revoke execute on function public.retention_preview(uuid) from public, anon;
grant execute on function public.retention_preview(uuid) to authenticated;

-- Keep a client by marking them active again (e.g. after they consent to it).
create or replace function public.keep_client(p_client uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.clients where id = p_client and public.is_shop_member(shop_id)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.clients set last_activity_at = now() where id = p_client;
end;
$$;

revoke execute on function public.keep_client(uuid) from public, anon;
grant execute on function public.keep_client(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;
    perform cron.schedule('daily-retention', '17 2 * * *', 'select public.run_retention()');
  else
    raise notice 'pg_cron not available: schedule public.run_retention() externally';
  end if;
end;
$$;
