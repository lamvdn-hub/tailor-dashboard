import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import type { Fabric } from '@/lib/types';

export const fabricsQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'fabrics'],
    queryFn: async () =>
      must(await supabase.from('fabrics').select('*').eq('shop_id', shopId).order('name')) as Fabric[],
  });

export const fabricUsageQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'fabrics', 'usage'],
    queryFn: async () => {
      const rows = must(
        await supabase.from('orders').select('fabric_id').eq('shop_id', shopId).not('fabric_id', 'is', null),
      ) as Array<{ fabric_id: string }>;
      const counts = new Map<string, number>();
      rows.forEach((r) => counts.set(r.fabric_id, (counts.get(r.fabric_id) ?? 0) + 1));
      return counts;
    },
  });

export type FabricInput = Pick<Fabric, 'name' | 'code' | 'composition' | 'color_pattern' | 'in_stock' | 'notes'>;

export async function saveFabric(shopId: string, input: FabricInput, id?: string): Promise<void> {
  if (id) must(await supabase.from('fabrics').update(input).eq('id', id).select('id').single());
  else must(await supabase.from('fabrics').insert({ ...input, shop_id: shopId }));
}

export async function deleteFabric(id: string): Promise<void> {
  must(await supabase.from('fabrics').delete().eq('id', id));
}
