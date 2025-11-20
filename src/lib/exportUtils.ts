import { supabase } from './supabase';
import { formatDate } from './dateUtils';

function downloadCSV(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function exportClients() {
  const { data } = await supabase
    .from('clients')
    .select('name, first_name, last_name, phone, email, created_at')
    .order('last_name');

  if (!data) return;

  const csv = [
    ['First Name', 'Last Name', 'Name', 'Phone', 'Email', 'Created At'].join(','),
    ...data.map(row => [
      row.first_name || '',
      row.last_name || '',
      `"${row.name}"`,
      row.phone || '',
      row.email || '',
      formatDate(row.created_at)
    ].join(','))
  ].join('\n');

  downloadCSV(csv, 'clients.csv');
}

export async function exportSessions() {
  const { data } = await supabase
    .from('sessions')
    .select('*, client:clients(name, first_name, last_name), fabric:fabrics(name)')
    .order('created_at', { ascending: false });

  if (!data) return;

  const csv = [
    ['Client', 'Garment Type', 'Fabric', 'Status', 'Date'].join(','),
    ...data.map((row: any) => [
      `"${row.client?.first_name && row.client?.last_name
        ? `${row.client.first_name} ${row.client.last_name}`
        : row.client?.name || 'Unknown'}"`,
      row.garment_type,
      `"${row.fabric?.name || '-'}"`,
      row.status,
      formatDate(row.created_at)
    ].join(','))
  ].join('\n');

  downloadCSV(csv, 'sessions.csv');
}

export async function exportClientsAndSessions() {
  await exportClients();
  await exportSessions();
}
