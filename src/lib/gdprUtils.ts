import { supabase } from './supabase';
import { logDataExport } from './auditUtils';

export async function exportUserData(userId: string) {
  try {
    const [userProfile, clients, sessions, measurements, fabrics, tasks, problems] = await Promise.all([
      supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('clients').select('*'),
      supabase.from('sessions').select('*'),
      supabase.from('measurements').select('*'),
      supabase.from('fabrics').select('*'),
      supabase.from('tasks').select('*'),
      supabase.from('problems').select('*'),
    ]);

    const exportData = {
      export_date: new Date().toISOString(),
      export_format_version: '1.1',
      user_id: userId,
      user_profile: userProfile.data || null,
      data: {
        clients: clients.data || [],
        sessions: sessions.data || [],
        measurements: measurements.data || [],
        fabrics: fabrics.data || [],
        tasks: tasks.data || [],
        problems: problems.data || [],
      },
      metadata: {
        total_clients: (clients.data || []).length,
        total_sessions: (sessions.data || []).length,
        total_measurements: (measurements.data || []).length,
        total_fabrics: (fabrics.data || []).length,
        total_tasks: (tasks.data || []).length,
        total_problems: (problems.data || []).length,
      },
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tailor-notebook-data-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    const totalRecords = (
      (exportData.metadata.total_clients || 0) +
      (exportData.metadata.total_sessions || 0) +
      (exportData.metadata.total_measurements || 0) +
      (exportData.metadata.total_fabrics || 0) +
      (exportData.metadata.total_tasks || 0) +
      (exportData.metadata.total_problems || 0)
    );

    await logDataExport('user_data_export', totalRecords);

    return { success: true };
  } catch (error) {
    console.error('Error exporting user data:', error);
    return { success: false, error };
  }
}

export async function deleteUserAccount(userId: string) {
  try {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .delete()
      .eq('user_id', userId);

    if (profileError) {
      console.error('Error deleting user profile:', profileError);
    }

    const { error: authError } = await supabase.auth.admin.deleteUser(userId);

    if (authError) {
      throw authError;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user account:', error);
    return { success: false, error };
  }
}
