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
