import { queryOptions } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { must } from '@/lib/errors';
import type { Task } from '@/lib/types';

const COLUMNS = '*, client:clients(id, first_name, last_name), order:orders(id, number)';

export const tasksQuery = (shopId: string) =>
  queryOptions({
    queryKey: ['shop', shopId, 'tasks'],
    queryFn: async () =>
      must(
        await supabase
          .from('tasks')
          .select(COLUMNS)
          .eq('shop_id', shopId)
          .order('done_at', { ascending: false, nullsFirst: true })
          .order('due_date', { ascending: true, nullsFirst: false })
          .limit(500),
      ) as unknown as Task[],
  });

export type TaskInput = Pick<Task, 'title' | 'notes' | 'category' | 'priority' | 'due_date' | 'client_id' | 'order_id'>;

export async function saveTask(shopId: string, input: TaskInput, id?: string): Promise<void> {
  if (id) must(await supabase.from('tasks').update(input).eq('id', id).select('id').single());
  else must(await supabase.from('tasks').insert({ ...input, shop_id: shopId }));
}

export async function setTasksDone(ids: string[], done: boolean): Promise<void> {
  must(await supabase.from('tasks').update({ done_at: done ? new Date().toISOString() : null }).in('id', ids));
}

export async function deleteTasks(ids: string[]): Promise<void> {
  must(await supabase.from('tasks').delete().in('id', ids));
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function isOverdue(task: Pick<Task, 'done_at' | 'due_date'>, today = todayIso()): boolean {
  return !task.done_at && task.due_date !== null && task.due_date < today;
}
