import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'tailor-notebook-auth',
    debug: true,
  },
  global: {
    headers: {
      'X-Client-Info': 'tailor-notebook-web',
    },
  },
});

export type Client = {
  id: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  created_at: string;
  updated_at: string;
};

export type Fabric = {
  id: string;
  name: string;
  composition: string | null;
  color_pattern: string | null;
  stock_code: string | null;
  status: 'in' | 'out';
  created_at: string;
};

export type Session = {
  id: string;
  client_id: string;
  garment_type: 'jacket' | 'trousers' | 'suit';
  service_type?: 'MTM' | 'Bespoke' | null;
  fabric_id: string | null;
  status: 'active' | 'completed' | 'ready';
  style_notes: string | null;
  client_requests: string | null;
  adjustment_remarks: string | null;
  display_id?: string | null;
  display_id_normalized?: string | null;
  suit_type?: 'single_breasted' | 'double_breasted' | 'tuxedo' | null;
  lapel_type?: string | null;
  button_type?: string | null;
  vent_type?: string | null;
  jacket_notes?: string | null;
  trousers_notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type MeasurementDefinition = {
  id: string;
  name: string;
  section: 'jacket' | 'trousers';
  mode: 'paired' | 'single';
  order_index: number;
  created_at: string;
};

export type Measurement = {
  id: string;
  session_id: string;
  measurement_name: string;
  unit_cm: string | number | null;
  measurement_definition_id?: string | null;
  section?: 'jacket' | 'trousers' | null;
  created_at: string;
};

