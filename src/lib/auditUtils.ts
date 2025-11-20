import { supabase } from './supabase';

export type AuditAction =
  | 'CREATE'
  | 'READ'
  | 'UPDATE'
  | 'DELETE'
  | 'EXPORT'
  | 'LOGIN'
  | 'LOGOUT'
  | 'CONSENT_GIVEN'
  | 'CONSENT_WITHDRAWN'
  | 'DATA_DELETION';

export interface AuditLogEntry {
  id: string;
  user_id: string | null;
  action: AuditAction;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export async function logAuditEvent(
  action: AuditAction,
  tableName: string,
  recordId?: string,
  oldData?: any,
  newData?: any,
  metadata?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase.from('audit_logs').insert({
      user_id: user.id,
      action,
      table_name: tableName,
      record_id: recordId || null,
      old_data: oldData || null,
      new_data: newData || null,
      ip_address: null,
      user_agent: navigator.userAgent,
      metadata: metadata || {},
    });

    if (error) {
      console.error('Error logging audit event:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error logging audit event:', error);
    return { success: false, error: 'Failed to log audit event' };
  }
}

export async function logDataExport(
  tableName: string,
  recordCount: number
): Promise<{ success: boolean; error?: string }> {
  return logAuditEvent('EXPORT', tableName, undefined, undefined, undefined, {
    record_count: recordCount,
    export_timestamp: new Date().toISOString(),
  });
}

export async function logLogin(): Promise<{ success: boolean; error?: string }> {
  return logAuditEvent('LOGIN', 'auth.users', undefined, undefined, undefined, {
    login_timestamp: new Date().toISOString(),
  });
}

export async function logLogout(): Promise<{ success: boolean; error?: string }> {
  return logAuditEvent('LOGOUT', 'auth.users', undefined, undefined, undefined, {
    logout_timestamp: new Date().toISOString(),
  });
}

export async function getUserAuditLogs(
  userId: string,
  limit: number = 100
): Promise<AuditLogEntry[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}

export async function getUserActivitySummary(userId: string): Promise<{
  totalActions: number;
  lastLogin: string | null;
  lastExport: string | null;
  recentActions: { action: AuditAction; count: number }[];
}> {
  const logs = await getUserAuditLogs(userId, 1000);

  const totalActions = logs.length;
  const lastLogin = logs.find((log) => log.action === 'LOGIN')?.created_at || null;
  const lastExport = logs.find((log) => log.action === 'EXPORT')?.created_at || null;

  const actionCounts: Record<AuditAction, number> = {} as Record<AuditAction, number>;
  logs.forEach((log) => {
    actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
  });

  const recentActions = Object.entries(actionCounts)
    .map(([action, count]) => ({ action: action as AuditAction, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return {
    totalActions,
    lastLogin,
    lastExport,
    recentActions,
  };
}

export function formatAuditAction(action: AuditAction): string {
  const actionMap: Record<AuditAction, string> = {
    CREATE: 'Created',
    READ: 'Viewed',
    UPDATE: 'Updated',
    DELETE: 'Deleted',
    EXPORT: 'Exported',
    LOGIN: 'Logged In',
    LOGOUT: 'Logged Out',
    CONSENT_GIVEN: 'Consent Given',
    CONSENT_WITHDRAWN: 'Consent Withdrawn',
    DATA_DELETION: 'Data Deleted',
  };

  return actionMap[action] || action;
}

export function formatTableName(tableName: string): string {
  const tableMap: Record<string, string> = {
    clients: 'Clients',
    sessions: 'Sessions',
    measurements: 'Measurements',
    fabrics: 'Fabrics',
    tasks: 'Tasks',
    problems: 'Queries',
    user_profiles: 'Profile',
    'auth.users': 'Authentication',
    user_consents: 'Consents',
  };

  return tableMap[tableName] || tableName;
}
