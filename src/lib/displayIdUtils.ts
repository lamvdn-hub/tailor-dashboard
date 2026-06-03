import { supabase } from './supabase';

/**
 * Generate a human-readable display ID for an order
 * Format: [SHOP_CODE]-[YYMMDD]-[SEQ]
 * Example: "WBB-250115-001"
 */
export async function generateDisplayId(userId: string): Promise<string> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('shop_code')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching shop code:', profileError);
      throw new Error('Failed to fetch shop code');
    }

    const shopCode = profile?.shop_code || 'SHP';

    const now = new Date();
    const yy = now.getFullYear().toString().slice(-2);
    const mm = (now.getMonth() + 1).toString().padStart(2, '0');
    const dd = now.getDate().toString().padStart(2, '0');
    const dateStr = `${yy}${mm}${dd}`;

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const { count, error: countError } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', todayStart.toISOString())
      .lte('created_at', todayEnd.toISOString());

    if (countError) {
      console.error('Error counting sessions:', countError);
      throw new Error('Failed to count sessions');
    }

    const sequence = ((count || 0) + 1).toString().padStart(3, '0');

    const displayId = `${shopCode}-${dateStr}-${sequence}`;

    return displayId;
  } catch (error) {
    console.error('Error generating display ID:', error);
    throw error;
  }
}

/**
 * Normalize display ID for searching
 * Removes dashes and spaces, converts to uppercase
 * Example: "wbb-250115-001" -> "WBB250115001"
 */
export function normalizeDisplayId(displayId: string): string {
  return displayId.toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Normalize search term for flexible matching
 * Example: "wbb 250115 001" -> "WBB250115001"
 */
export function normalizeSearchTerm(term: string): string {
  return term.toUpperCase().replace(/[\s-]/g, '');
}

/**
 * Check if a search term might be a display ID
 * Returns true if the term looks like it could be part of a display ID
 */
export function isDisplayIdLike(term: string): boolean {
  const normalized = normalizeSearchTerm(term);
  return /^[A-Z]{2,4}\d{0,6}\d{0,3}$/.test(normalized) ||
         /^[A-Z]{2,4}-?\d{0,6}-?\d{0,3}$/.test(term.toUpperCase());
}
