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
