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
