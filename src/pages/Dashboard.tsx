import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Scissors, PackageCheck, Calendar, Trash2 } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusSelect } from '../components/StatusSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { supabase, Session, Client } from '../lib/supabase';
import { formatDate } from '../lib/dateUtils';

interface SessionWithClient extends Session {
  client: Client;
}

export function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeSessions: 0,
    readyForPickup: 0,
    thisWeekSessions: 0,
  });
  const [recentSessions, setRecentSessions] = useState<SessionWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    setLoading(true);

    const [clientsRes, sessionsRes, readyRes, recentRes] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'ready'),
      supabase
        .from('sessions')
        .select('*, client:clients(*)')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekRes = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    setStats({
      totalClients: clientsRes.count || 0,
      activeSessions: sessionsRes.count || 0,
      readyForPickup: readyRes.count || 0,
      thisWeekSessions: thisWeekRes.count || 0,
    });

    if (recentRes.data) {
      setRecentSessions(recentRes.data as SessionWithClient[]);
    }

    setLoading(false);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    setDeletingId(sessionId);

    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      alert('Error deleting session: ' + error.message);
      setDeletingId(null);
      return;
    }

    setRecentSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
    loadDashboardData();
    setDeletingId(null);
  }

  async function handleStatusChange(sessionId: string, newStatus: 'active' | 'completed' | 'ready') {
    // Set loading state for this specific session
    setUpdatingStatusId(sessionId);

    // Optimistically update the UI
    const previousSessions = [...recentSessions];
    setRecentSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId ? { ...session, status: newStatus } : session
      )
    );

    // Update the database
    const { error } = await supabase
      .from('sessions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      // Revert optimistic update on error
      setRecentSessions(previousSessions);
      alert('Error updating status: ' + error.message);
      setUpdatingStatusId(null);
      return;
    }

    // Refresh only the statistics without reloading the entire sessions list
    await refreshStats();
    setUpdatingStatusId(null);
  }

  async function refreshStats() {
    // Update only the statistics cards without affecting the sessions table
    const [clientsRes, sessionsRes, readyRes] = await Promise.all([
      supabase.from('clients').select('id', { count: 'exact', head: true }),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('status', 'ready'),
    ]);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekRes = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString());

    setStats({
      totalClients: clientsRes.count || 0,
      activeSessions: sessionsRes.count || 0,
      readyForPickup: readyRes.count || 0,
      thisWeekSessions: thisWeekRes.count || 0,
    });
  }

  const statCards = [
    { icon: Users, label: 'Total Clients', value: stats.totalClients, color: 'text-blue-600' },
    { icon: Scissors, label: 'Active Sessions', value: stats.activeSessions, color: 'text-green-600' },
    { icon: PackageCheck, label: 'Ready for Pickup', value: stats.readyForPickup, color: 'text-orange-600' },
    { icon: Calendar, label: "This Week's Entries", value: stats.thisWeekSessions, color: 'text-[#506B4D]' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <Button onClick={() => navigate('/sessions/new')} className="flex-1 sm:flex-none">New Session</Button>
          <Button variant="secondary" onClick={() => navigate('/clients/new')} className="flex-1 sm:flex-none">New Client</Button>
          <Button variant="secondary" onClick={() => navigate('/fabrics')} className="hidden sm:inline-flex">View Fabrics</Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">
                    {loading ? '...' : stat.value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Sessions</h2>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</p>
        ) : recentSessions.length === 0 ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">No sessions yet. Create your first session to get started.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client Name</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Garment Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    {session.client.first_name && session.client.last_name
                      ? `${session.client.first_name} ${session.client.last_name}`
                      : session.client.name}
                  </TableCell>
                  <TableCell className="capitalize">{session.service_type || '-'}</TableCell>
                  <TableCell className="capitalize">{session.garment_type}</TableCell>
                  <TableCell>{formatDate(session.created_at)}</TableCell>
                  <TableCell>
                    <div className={updatingStatusId === session.id ? 'opacity-50 pointer-events-none' : ''}>
                      <StatusSelect
                        value={session.status}
                        onChange={(value) => handleStatusChange(session.id, value as 'active' | 'completed' | 'ready')}
                        options={[
                          { value: 'active', label: 'Active' },
                          { value: 'ready', label: 'Ready' },
                          { value: 'completed', label: 'Completed' },
                        ]}
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/sessions/${session.id}`)}
                      >
                        View
                      </Button>
                      <button
                        onClick={() => handleDeleteSession(session.id)}
                        disabled={deletingId === session.id}
                        className={`p-2 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
                          deletingId === session.id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        title="Delete session"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
