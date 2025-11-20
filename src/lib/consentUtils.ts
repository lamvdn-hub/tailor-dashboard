import { supabase } from './supabase';

export interface ConsentType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  required: boolean;
  category: 'essential' | 'functional' | 'analytics' | 'marketing' | 'data_processing';
  active: boolean;
}

export interface UserConsent {
  id: string;
  user_id: string;
  consent_type_id: string;
  granted: boolean;
  consent_method: 'signup' | 'cookie_banner' | 'settings' | 'explicit_action';
  created_at: string;
}

export interface ConsentStatus {
  consentType: ConsentType;
  granted: boolean;
  lastUpdated: string | null;
}

export async function getAllConsentTypes(): Promise<ConsentType[]> {
  const { data, error } = await supabase
    .from('consent_types')
    .select('*')
    .eq('active', true)
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching consent types:', error);
    return [];
  }

  return data || [];
}

export async function getUserConsentStatus(userId: string): Promise<ConsentStatus[]> {
  const consentTypes = await getAllConsentTypes();

  const consentStatuses: ConsentStatus[] = [];

  for (const type of consentTypes) {
    const { data, error } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', userId)
      .eq('consent_type_id', type.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching consent for ${type.name}:`, error);
      continue;
    }

    consentStatuses.push({
      consentType: type,
      granted: data?.granted ?? false,
      lastUpdated: data?.created_at ?? null,
    });
  }

  return consentStatuses;
}

export async function recordConsent(
  userId: string,
  consentTypeName: string,
  granted: boolean,
  method: 'signup' | 'cookie_banner' | 'settings' | 'explicit_action',
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('record_user_consent', {
      p_user_id: userId,
      p_consent_type_name: consentTypeName,
      p_granted: granted,
      p_consent_method: method,
      p_ip_address: null,
      p_user_agent: navigator.userAgent,
      p_metadata: metadata || {},
    });

    if (error) {
      console.error('Error recording consent:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error recording consent:', error);
    return { success: false, error: 'Failed to record consent' };
  }
}

export async function giveConsentForAll(
  userId: string,
  method: 'signup' | 'cookie_banner' | 'settings' | 'explicit_action'
): Promise<{ success: boolean; error?: string }> {
  const consentTypes = await getAllConsentTypes();

  for (const type of consentTypes) {
    const result = await recordConsent(userId, type.name, true, method);
    if (!result.success) {
      return result;
    }
  }

  return { success: true };
}

export async function withdrawConsent(
  userId: string,
  consentTypeName: string
): Promise<{ success: boolean; error?: string }> {
  return recordConsent(userId, consentTypeName, false, 'settings', {
    action: 'withdrawal',
  });
}

export async function hasEssentialConsents(userId: string): Promise<boolean> {
  const { data: consentTypes } = await supabase
    .from('consent_types')
    .select('name')
    .eq('required', true)
    .eq('active', true);

  if (!consentTypes || consentTypes.length === 0) {
    return true;
  }

  for (const type of consentTypes) {
    const { data } = await supabase
      .from('user_consents')
      .select('granted')
      .eq('user_id', userId)
      .eq('consent_type_id', (await supabase.from('consent_types').select('id').eq('name', type.name).single()).data?.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!data || !data.granted) {
      return false;
    }
  }

  return true;
}

export function getConsentFromLocalStorage(): Record<string, boolean> | null {
  try {
    const stored = localStorage.getItem('tailor-notebook-consents');
    if (!stored) return null;
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveConsentToLocalStorage(consents: Record<string, boolean>): void {
  try {
    localStorage.setItem('tailor-notebook-consents', JSON.stringify(consents));
    localStorage.setItem('tailor-notebook-consent-timestamp', new Date().toISOString());
  } catch (error) {
    console.error('Error saving consents to localStorage:', error);
  }
}

export function clearConsentFromLocalStorage(): void {
  try {
    localStorage.removeItem('tailor-notebook-consents');
    localStorage.removeItem('tailor-notebook-consent-timestamp');
  } catch (error) {
    console.error('Error clearing consents from localStorage:', error);
  }
}
