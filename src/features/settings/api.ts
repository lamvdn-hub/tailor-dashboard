import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import { PHOTO_BUCKET } from '@/lib/config';
import type { AuditEntry, Invite, Member, Role, Shop } from '@/lib/types';

export type ShopPatch = Partial<
  Pick<
    Shop,
    | 'name'
    | 'order_prefix'
    | 'legal_name'
    | 'org_number'
    | 'address'
    | 'phone'
    | 'email'
    | 'opening_hours'
    | 'privacy_contact_email'
    | 'inquiries_enabled'
    | 'client_retention_months'
  >
>;

export async function updateShop(shopId: string, patch: ShopPatch): Promise<void> {
  must(await supabase.from('shops').update(patch).eq('id', shopId).select('id').single());
}

export async function createShop(name: string, slug: string, prefix: string): Promise<Shop> {
  return must(await supabase.rpc('create_shop', { p_name: name, p_slug: slug, p_order_prefix: prefix })) as Shop;
}

export const membersQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'members'],
    queryFn: async () => {
      const members = must(
        await supabase.from('shop_members').select('user_id, role, created_at').eq('shop_id', shopId).order('created_at'),
      ) as Array<Omit<Member, 'full_name'>>;
      const profiles = must(
        await supabase.from('profiles').select('user_id, full_name').in('user_id', members.map((m) => m.user_id)),
      ) as Array<{ user_id: string; full_name: string }>;
      const names = new Map(profiles.map((p) => [p.user_id, p.full_name]));
      return members.map((m) => ({ ...m, full_name: names.get(m.user_id) ?? '' })) as Member[];
    },
  });

export const invitesQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'invites'],
    queryFn: async () =>
      must(
        await supabase
          .from('shop_invites')
          .select('id, email, role, token, expires_at, accepted_at')
          .eq('shop_id', shopId)
          .is('accepted_at', null)
          .order('created_at', { ascending: false }),
      ) as Invite[],
  });

export async function createInvite(shopId: string, email: string, role: Role): Promise<Invite> {
  return must(
    await supabase
      .from('shop_invites')
      .insert({ shop_id: shopId, email: email.trim().toLowerCase(), role })
      .select('id, email, role, token, expires_at, accepted_at')
      .single(),
  ) as Invite;
}

export async function revokeInvite(id: string): Promise<void> {
  must(await supabase.from('shop_invites').delete().eq('id', id));
}

export async function setMemberRole(shopId: string, userId: string, role: Role): Promise<void> {
  must(await supabase.rpc('set_member_role', { p_shop: shopId, p_user: userId, p_role: role }));
}

export async function removeMember(shopId: string, userId: string): Promise<void> {
  must(await supabase.rpc('remove_member', { p_shop: shopId, p_user: userId }));
}

export const retentionPreviewQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'retention'],
    queryFn: async () =>
      must(await supabase.rpc('retention_preview', { p_shop: shopId })) as Array<{
        id: string;
        first_name: string;
        last_name: string;
        last_activity_at: string;
        deletes_on: string;
      }>,
  });

export async function keepClient(clientId: string): Promise<void> {
  must(await supabase.rpc('keep_client', { p_client: clientId }));
}

export const auditQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'audit'],
    queryFn: async () =>
      must(
        await supabase
          .from('audit_log')
          .select('id, actor, action, entity, entity_id, changed, at')
          .eq('shop_id', shopId)
          .order('at', { ascending: false })
          .limit(50),
      ) as AuditEntry[],
  });

export async function exportShop(shopId: string): Promise<unknown> {
  return must(await supabase.rpc('export_shop_data', { p_shop: shopId }));
}

/** Removes every photo file first (SQL cannot delete storage objects), then the shop. */
export async function deleteShop(shopId: string): Promise<void> {
  const rows = must(await supabase.from('order_photos').select('path, thumb_path').eq('shop_id', shopId)) as Array<{
    path: string;
    thumb_path: string;
  }>;
  const paths = rows.flatMap((r) => [r.path, r.thumb_path]);
  for (let i = 0; i < paths.length; i += 500) {
    await supabase.storage.from(PHOTO_BUCKET).remove(paths.slice(i, i + 500));
  }
  must(await supabase.rpc('delete_shop', { p_shop: shopId }));
}
