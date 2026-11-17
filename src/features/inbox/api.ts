import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import type { Inquiry } from '@/lib/types';

export const inquiriesQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'inquiries'],
    queryFn: async () =>
      must(
        await supabase.from('inquiries').select('*').eq('shop_id', shopId).order('created_at', { ascending: false }),
      ) as Inquiry[],
  });

export async function setInquiryStatus(id: string, status: Inquiry['status']): Promise<void> {
  must(
    await supabase
      .from('inquiries')
      .update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null })
      .eq('id', id),
  );
}

export async function deleteInquiry(id: string): Promise<void> {
  must(await supabase.from('inquiries').delete().eq('id', id));
}
