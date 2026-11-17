// Removes photo files whose database rows were deleted (order, client or shop
// deletion, retention purge). Rows are queued in public.storage_gc by a
// trigger. Schedule this function (e.g. hourly) with Supabase Cron.
import { createClient } from 'npm:@supabase/supabase-js@2.49.4';

const BUCKET = 'order-photos';
const BATCH = 500;

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  let removed = 0;
  for (;;) {
    const { data, error } = await supabase.from('storage_gc').select('path').limit(BATCH);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    if (!data.length) break;

    const paths = data.map((row) => row.path as string);
    const { error: removeError } = await supabase.storage.from(BUCKET).remove(paths);
    if (removeError) return Response.json({ error: removeError.message, removed }, { status: 500 });

    const { error: deleteError } = await supabase.from('storage_gc').delete().in('path', paths);
    if (deleteError) return Response.json({ error: deleteError.message, removed }, { status: 500 });

    removed += paths.length;
    if (paths.length < BATCH) break;
  }

  return Response.json({ removed });
});
