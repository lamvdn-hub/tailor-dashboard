import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import { drainStorageGc } from '@/lib/storage';
import type { Client } from '@/lib/types';

export const clientsQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'clients', 'list'],
    queryFn: async () =>
      must(
        await supabase
          .from('clients')
          .select('*')
          .eq('shop_id', shopId)
          .order('last_name')
          .order('first_name'),
      ) as Client[],
  });

export const clientQuery = (shopId: string, clientId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'clients', 'detail', clientId],
    queryFn: async () => must(await supabase.from('clients').select('*').eq('id', clientId).maybeSingle()) as Client | null,
  });

export type ClientInput = Pick<Client, 'first_name' | 'last_name' | 'phone' | 'email' | 'notes'>;

export async function createClient(shopId: string, input: ClientInput): Promise<Client> {
  return must(await supabase.from('clients').insert({ ...input, shop_id: shopId }).select().single()) as Client;
}

export async function updateClient(clientId: string, input: ClientInput): Promise<void> {
  must(await supabase.from('clients').update(input).eq('id', clientId).select('id').single());
}

export async function deleteClient(shopId: string, clientId: string): Promise<void> {
  must(await supabase.from('clients').delete().eq('id', clientId));
  await drainStorageGc(shopId);
}

export async function exportClient(clientId: string): Promise<unknown> {
  return must(await supabase.rpc('export_client_data', { p_client: clientId }));
}

export function fullName(c: Pick<Client, 'first_name' | 'last_name'> | null | undefined): string {
  return c ? `${c.first_name} ${c.last_name}`.trim() : '';
}
