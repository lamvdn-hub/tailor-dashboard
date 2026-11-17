import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import { PHOTO_BUCKET } from '@/lib/config';
import { processImage } from '@/lib/image';
import type { OrderPhoto } from '@/lib/types';

export type PhotoWithUrls = OrderPhoto & { url: string; thumbUrl: string };

const SIGNED_TTL = 60 * 30;

export const orderPhotosQuery = (shopId: string, orderId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'orders', 'photos', orderId],
    staleTime: (SIGNED_TTL - 120) * 1000,
    queryFn: async (): Promise<PhotoWithUrls[]> => {
      const rows = must(
        await supabase
          .from('order_photos')
          .select('id, path, thumb_path, size_bytes, created_at')
          .eq('order_id', orderId)
          .order('created_at'),
      ) as OrderPhoto[];
      if (!rows.length) return [];
      const paths = rows.flatMap((r) => [r.path, r.thumb_path]);
      const signed = must(await supabase.storage.from(PHOTO_BUCKET).createSignedUrls(paths, SIGNED_TTL));
      const byPath = new Map(signed.map((s) => [s.path, s.signedUrl]));
      return rows.map((r) => ({ ...r, url: byPath.get(r.path) ?? '', thumbUrl: byPath.get(r.thumb_path) ?? '' }));
    },
  });

export async function uploadPhoto(shopId: string, orderId: string, file: File): Promise<void> {
  const { full, thumb } = await processImage(file);
  const id = crypto.randomUUID();
  const path = `${shopId}/${orderId}/${id}.jpg`;
  const thumbPath = `${shopId}/${orderId}/${id}_thumb.jpg`;
  const bucket = supabase.storage.from(PHOTO_BUCKET);

  must(await bucket.upload(path, full, { contentType: 'image/jpeg', upsert: false }));
  try {
    must(await bucket.upload(thumbPath, thumb, { contentType: 'image/jpeg', upsert: false }));
    must(
      await supabase
        .from('order_photos')
        .insert({ shop_id: shopId, order_id: orderId, path, thumb_path: thumbPath, size_bytes: full.size }),
    );
  } catch (error) {
    await bucket.remove([path, thumbPath]);
    throw error;
  }
}

export async function deletePhoto(photo: OrderPhoto): Promise<void> {
  must(await supabase.from('order_photos').delete().eq('id', photo.id));
  const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([photo.path, photo.thumb_path]);
  if (!error) await supabase.from('storage_gc').delete().in('path', [photo.path, photo.thumb_path]);
}
