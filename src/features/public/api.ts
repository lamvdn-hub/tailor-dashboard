import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import type { PublicOrderStatus, PublicShop } from '@/lib/types';

export async function fetchOrderStatus(token: string): Promise<PublicOrderStatus | null> {
  if (!/^[0-9a-f]{32}$/.test(token)) return null;
  return must(await supabase.rpc('get_order_status', { p_token: token })) as PublicOrderStatus | null;
}

export async function fetchPublicShop(slug: string): Promise<PublicShop | null> {
  return must(await supabase.rpc('get_public_shop', { p_slug: slug })) as PublicShop | null;
}

export interface InquiryInput {
  name: string;
  email: string;
  phone: string;
  message: string;
  privacyAck: boolean;
}

export type SubmitResult = 'ok' | 'rate_limited' | 'closed' | 'error';

export async function submitInquiry(slug: string, input: InquiryInput): Promise<SubmitResult> {
  const { error } = await supabase.rpc('submit_inquiry', {
    p_slug: slug,
    p_name: input.name,
    p_email: input.email,
    p_phone: input.phone,
    p_message: input.message,
    p_privacy_ack: input.privacyAck,
  });
  if (!error) return 'ok';
  if (error.message.includes('rate_limited')) return 'rate_limited';
  if (error.message.includes('inquiries_closed')) return 'closed';
  return 'error';
}

export async function fetchInvite(token: string) {
  return must(await supabase.rpc('get_invite', { p_token: token })) as {
    shop_name: string;
    email: string;
    role: 'owner' | 'staff';
    expired: boolean;
    accepted: boolean;
  } | null;
}

export async function acceptInvite(token: string): Promise<string> {
  return must(await supabase.rpc('accept_invite', { p_token: token })) as string;
}
