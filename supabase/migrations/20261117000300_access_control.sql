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
