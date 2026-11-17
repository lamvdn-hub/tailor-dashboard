import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import { PHOTO_BUCKET } from '@/lib/config';
import type { Profile } from '@/lib/types';

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: ['profile', userId],
    queryFn: async () =>
      must(await supabase.from('profiles').select('user_id, full_name, locale').eq('user_id', userId).maybeSingle()) as Profile | null,
  });

export async function updateProfile(userId: string, patch: Partial<Pick<Profile, 'full_name' | 'locale'>>): Promise<void> {
  must(await supabase.from('profiles').update(patch).eq('user_id', userId));
}

export async function exportMyData(): Promise<unknown> {
  return must(await supabase.rpc('export_my_data'));
}

/**
 * Deletes photo files of shops that will be erased with the account (those
 * where the user is the only member), then the account itself.
 */
export async function deleteMyAccount(soleShopIds: string[]): Promise<void> {
  for (const shopId of soleShopIds) {
    const rows = must(await supabase.from('order_photos').select('path, thumb_path').eq('shop_id', shopId)) as Array<{
      path: string;
      thumb_path: string;
    }>;
    const paths = rows.flatMap((r) => [r.path, r.thumb_path]);
    for (let i = 0; i < paths.length; i += 500) {
      await supabase.storage.from(PHOTO_BUCKET).remove(paths.slice(i, i + 500));
    }
  }
  must(await supabase.rpc('delete_my_account'));
}
