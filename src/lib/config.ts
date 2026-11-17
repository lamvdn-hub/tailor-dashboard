export const APP_NAME: string = import.meta.env.VITE_APP_NAME || 'Tailor Desk';
export const SUPABASE_URL: string = import.meta.env.VITE_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY: string = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
export const OPERATOR_NAME: string = import.meta.env.VITE_OPERATOR_NAME ?? '';
export const OPERATOR_EMAIL: string = import.meta.env.VITE_OPERATOR_EMAIL ?? '';
export const IS_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const MAX_PHOTOS_PER_ORDER = 12;
export const PHOTO_BUCKET = 'order-photos';
