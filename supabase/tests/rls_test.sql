-- Behavioural tests for schema, RLS and RPCs. Each block raises on failure.
\set QUIET on
\o /dev/null
set client_min_messages = warning;

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'anna@example.com'),
  ('00000000-0000-0000-0000-00000000000b', 'bo@example.com'),
  ('00000000-0000-0000-0000-00000000000c', 'cilla@example.com');

create function pg_temp.as_user(p uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claim.sub', coalesce(p::text, ''), false);
  if p is null then execute 'set role anon'; else execute 'set role authenticated'; end if;
end $$;

create function pg_temp.ok(p_cond boolean, p_msg text) returns void language plpgsql as $$
begin
  if p_cond is not true then raise exception 'assertion failed: %', p_msg; end if;
end $$;

create function pg_temp.expect_error(p_sql text, p_like text) returns void language plpgsql as $$
begin
  execute p_sql;
  raise exception 'expected error % from: %', p_like, p_sql;
exception when others then
  if sqlerrm not like p_like and sqlstate not like p_like then
    raise exception 'unexpected error "%" (%) from: %', sqlerrm, sqlstate, p_sql;
  end if;
end $$;

-- profiles created by trigger
select pg_temp.ok((select count(*) from public.profiles) = 3, 'profiles bootstrap');

-- Anna creates a shop and data
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select id as shop_a from public.create_shop('Ateljé A', 'atelje-a', 'ata') \gset
insert into public.clients (shop_id, first_name, last_name, email) values (:'shop_a', 'Eva', 'Ek', 'eva@example.com') returning id as client_a \gset
insert into public.fabrics (shop_id, name) values (:'shop_a', 'Navy wool') returning id as fabric_a \gset
insert into public.orders (shop_id, client_id, service, garment, fabric_id, measurements, price_minor, deposit_minor)
  values (:'shop_a', :'client_a', 'bespoke', 'suit', :'fabric_a', '{"chest": 100, "sleeve_length": {"l": 64, "r": 64.5}}', 1500000, 500000)
  returning id as order_a, number as number_a, status_token as token_a \gset
insert into public.orders (shop_id, client_id, service, garment) values (:'shop_a', :'client_a', 'mtm', 'jacket') returning number as number_a2 \gset


select :'number_a' ~ '^ATA-\d{6}-001$' as ok1, :'number_a2' ~ '^ATA-\d{6}-002$' as ok2 \gset
select pg_temp.ok(:'ok1' and :'ok2', 'order numbering');

update public.orders set status = 'fitting_1' where id = :'order_a';
select pg_temp.ok((select count(*) from public.order_status_events where order_id = :'order_a') = 2, 'status events');
select pg_temp.expect_error($$update public.orders set status = 'fitting' where id = '$$ || :'order_a' || $$'$$, '%orders_status_matches_service%');
select pg_temp.expect_error($$update public.orders set deposit_minor = 9999999 where id = '$$ || :'order_a' || $$'$$, '%orders_deposit_le_price%');

-- guarded columns cannot be forged
update public.orders set number = 'HACK', status_token = 'x' where id = :'order_a';
select pg_temp.ok((select number from public.orders where id = :'order_a') = :'number_a', 'number guarded');
select pg_temp.ok((select status_token from public.orders where id = :'order_a') = :'token_a', 'token guarded');
select pg_temp.ok((select created_by from public.orders where id = :'order_a') = '00000000-0000-0000-0000-00000000000a', 'creator set');

-- audit stores column names, not values
select pg_temp.ok(exists (select 1 from public.audit_log where entity = 'orders' and action = 'update' and changed = array['status']), 'audit changed cols');

-- Bo has his own shop and cannot see or touch Anna's
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select id as shop_b from public.create_shop('Bo Skrädderi', 'bo-skradderi', 'BOS') \gset
select pg_temp.ok((select count(*) from public.clients) = 0, 'isolation clients');
select pg_temp.ok((select count(*) from public.orders) = 0, 'isolation orders');
select pg_temp.ok((select count(*) from public.shops) = 1, 'isolation shops');
select pg_temp.expect_error($$insert into public.clients (shop_id, first_name, last_name) values ('$$ || :'shop_a' || $$', 'X', 'Y')$$, '%row-level security%');
insert into public.clients (shop_id, first_name, last_name) values (:'shop_b', 'Olle', 'Ö') returning id as client_b \gset
-- cross-shop reference blocked by composite FK
select pg_temp.expect_error($$insert into public.orders (shop_id, client_id, service, garment) values ('$$ || :'shop_b' || $$', '$$ || :'client_a' || $$', 'mtm', 'suit')$$, '23503');
select pg_temp.expect_error($$select public.shop_overview('$$ || :'shop_a' || $$')$$, 'forbidden');
select pg_temp.expect_error($$select public.regenerate_status_token('$$ || :'order_a' || $$')$$, 'forbidden');
update public.shops set name = 'pwned' where id = :'shop_a';
-- storage folder scoping
insert into storage.objects (bucket_id, name) values ('order-photos', :'shop_b' || '/x/1.jpg');
select pg_temp.expect_error($$insert into storage.objects (bucket_id, name) values ('order-photos', '$$ || :'shop_a' || $$/x/1.jpg')$$, '%row-level security%');

-- Invite flow: Anna invites Cilla as staff
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.ok((select name from public.shops where id = :'shop_a') = 'Ateljé A', 'foreign owner cannot update shop');
insert into public.shop_invites (shop_id, email) values (:'shop_a', 'cilla@example.com') returning token as invite \gset
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select pg_temp.expect_error($$select public.accept_invite('$$ || :'invite' || $$')$$, 'invite_email_mismatch');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select public.accept_invite(:'invite');
select pg_temp.ok((select count(*) from public.clients) = 1, 'staff sees shop data');
select pg_temp.expect_error($$update public.shops set name = 'x' where id = '$$ || :'shop_a' || $$' returning id$$, '%');
select pg_temp.ok((select count(*) from public.audit_log) = 0, 'staff cannot read audit');
select pg_temp.expect_error($$select public.remove_member('$$ || :'shop_a' || $$', '00000000-0000-0000-0000-00000000000a')$$, 'forbidden');
select pg_temp.expect_error($$select public.accept_invite('$$ || :'invite' || $$')$$, 'invite_used');

-- search escapes LIKE metacharacters and matches compact order numbers
select pg_temp.ok((select count(*) from public.search_shop(:'shop_a', '%%')) = 0, 'search wildcard escaped');
select pg_temp.ok((select count(*) from public.search_shop(:'shop_a', 'eva')) >= 1, 'search client');
select pg_temp.ok(exists (select 1 from public.search_shop(:'shop_a', replace(:'number_a', '-', ' ')) where kind = 'order'), 'search order number');

-- Anonymous visitor
select pg_temp.as_user(null);
select pg_temp.expect_error('select * from public.orders', '42501');
select pg_temp.expect_error('select * from public.clients', '42501');
select (public.get_order_status(:'token_a'))::text as r_json \gset
select pg_temp.ok((:'r_json')::jsonb ->> 'number' = :'number_a', 'public status');
select pg_temp.ok(not ((:'r_json')::jsonb ? 'measurements') and not ((:'r_json')::jsonb ? 'price_minor'), 'public status minimal');
select pg_temp.ok(jsonb_array_length((:'r_json')::jsonb -> 'events') = 2, 'public events');
select pg_temp.ok(public.get_order_status('nope') is null, 'bad token');
select pg_temp.expect_error($$select public.submit_inquiry('atelje-a', 'Kim', 'kim@example.com', null, 'Hej', true)$$, 'inquiries_closed');
select pg_temp.expect_error($$select public.shop_overview('$$ || :'shop_a' || $$')$$, '42501');

-- Owner opens inquiries; anon submits; rate limit after 3
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
update public.shops set inquiries_enabled = true where id = :'shop_a';
select pg_temp.as_user(null);
select pg_temp.expect_error($$select public.submit_inquiry('atelje-a', 'Kim', 'kim@example.com', null, 'Hej', false)$$, 'privacy_ack_required');
select public.submit_inquiry('atelje-a', 'Kim', 'kim@example.com', null, 'Hej 1', true);
select public.submit_inquiry('atelje-a', 'Kim', 'KIM@example.com', null, 'Hej 2', true);
select public.submit_inquiry('atelje-a', 'Kim', 'kim@example.com', '', 'Hej 3', true);
select pg_temp.expect_error($$select public.submit_inquiry('atelje-a', 'Kim', 'kim@example.com', null, 'Hej 4', true)$$, 'rate_limited');

-- Owner: token regeneration, overview, export
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select public.regenerate_status_token(:'order_a') as token_new \gset
select pg_temp.ok(:'token_new' <> :'token_a' and length(:'token_new') = 32, 'token regenerated');
select pg_temp.ok(public.get_order_status(:'token_a') is null, 'old token dead');
select pg_temp.ok((public.shop_overview(:'shop_a') ->> 'open_inquiries')::int = 3, 'overview inquiries');
select pg_temp.ok((public.shop_overview(:'shop_a') ->> 'outstanding_minor')::bigint = 1000000, 'overview outstanding');
select pg_temp.ok(jsonb_array_length(public.export_client_data(:'client_a') -> 'orders') = 2, 'client export');
select pg_temp.ok(not ((public.export_client_data(:'client_a') -> 'orders' -> 0) ? 'status_token'), 'export hides token');

-- Photos: deleting an order queues storage objects for GC
insert into public.order_photos (shop_id, order_id, path, thumb_path, size_bytes)
values (:'shop_a', :'order_a', :'shop_a' || '/' || :'order_a' || '/p.jpg', :'shop_a' || '/' || :'order_a' || '/p_t.jpg', 1000);
select pg_temp.expect_error($$insert into public.order_photos (shop_id, order_id, path, thumb_path, size_bytes) values ('$$ || :'shop_a' || $$', '$$ || :'order_a' || $$', 'elsewhere/p.jpg', 'elsewhere/t.jpg', 1)$$, '23514');
delete from public.orders where id = :'order_a';
select pg_temp.ok((select count(*) from public.storage_gc) = 2, 'storage gc queued');

-- Owners cannot leave orphaned shops; Cilla's account can be deleted
select pg_temp.expect_error($$select public.remove_member('$$ || :'shop_a' || $$', '00000000-0000-0000-0000-00000000000a')$$, 'last_owner');
select pg_temp.as_user('00000000-0000-0000-0000-00000000000c');
select public.delete_my_account();
reset role;
select pg_temp.ok(not exists (select 1 from auth.users where email = 'cilla@example.com'), 'staff deleted');
select pg_temp.ok(exists (select 1 from public.shops where slug = 'atelje-a'), 'shop survives staff deletion');

-- Bo deletes his account; his single-member shop goes with it
select pg_temp.as_user('00000000-0000-0000-0000-00000000000b');
select public.delete_my_account();
reset role;
select pg_temp.ok(not exists (select 1 from public.shops where slug = 'bo-skradderi'), 'shop erased with sole owner');
select pg_temp.ok(not exists (select 1 from public.clients where first_name = 'Olle'), 'clients erased');

select set_config('request.jwt.claim.sub', '', false);

-- Retention: an idle client with only collected orders is purged
update public.orders set status = 'collected' where shop_id = :'shop_a';
update public.clients set last_activity_at = now() - interval '37 months' where id = :'client_a';

set role service_role;
select (public.run_retention())::text as r_json \gset
select pg_temp.ok(((:'r_json')::jsonb ->> 'clients_deleted')::int = 1, 'retention clients ');
reset role;
select pg_temp.ok(not exists (select 1 from public.orders where shop_id = :'shop_a'), 'retention cascades orders');

-- Anon/authenticated cannot run retention
select pg_temp.as_user('00000000-0000-0000-0000-00000000000a');
select pg_temp.expect_error('select public.run_retention()', '42501');
reset role;

\echo all assertions passed
