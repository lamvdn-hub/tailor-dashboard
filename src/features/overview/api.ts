import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import type { Overview } from '@/lib/types';

export const overviewQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'overview'],
    queryFn: async () => must(await supabase.rpc('shop_overview', { p_shop: shopId })) as Overview,
    staleTime: 30_000,
  });
