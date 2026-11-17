import { supabase } from './supabase';
import { PHOTO_BUCKET } from './config';

/**
 * Removes files queued in storage_gc for this shop (photos whose rows were
 * deleted directly or by cascade). Best effort: the storage-gc edge function
 * is the backstop.
 */
export async function drainStorageGc(shopId: string): Promise<void> {
  try {
    const { data } = await supabase.from('storage_gc').select('path').eq('shop_id', shopId).limit(500);
    const paths = (data ?? []).map((r) => r.path as string);
    if (!paths.length) return;
    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove(paths);
    if (!error) await supabase.from('storage_gc').delete().in('path', paths);
  } catch {
    // Ignored; retried on the next deletion or by the scheduled function.
  }
}
