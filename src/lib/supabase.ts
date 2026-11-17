import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL, IS_CONFIGURED } from './config';

// When unconfigured the app renders a setup notice instead of calling this.
export const supabase = createClient(
  IS_CONFIGURED ? SUPABASE_URL : 'http://localhost:54321',
  IS_CONFIGURED ? SUPABASE_ANON_KEY : 'unconfigured',
  {
    auth: {
      flowType: 'pkce',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
