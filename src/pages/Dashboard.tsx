import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Scissors, PackageCheck, Calendar, Trash2, PlusCircle, Package, CheckCircle, Copy, Camera } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { StatusSelect } from '../components/StatusSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/Table';
import { ToastContainer } from '../components/Toast';
import { useToast } from '../hooks/useToast';
import { supabase, Session, Client } from '../lib/supabase';
import { formatDate } from '../lib/dateUtils';

interface SessionWithClient extends Session {
  client: Client;
  photo_count?: number;
}

type TabFilter = 'all' | 'active' | 'ready' | 'completed';

export function Dashboard() {
  const navigate = useNavigate();
  const { toasts, showToast, removeToast } = useToast();
  const [stats, setStats] = useState({
    totalClients: 0,
    activeSessions: 0,
    readyForPickup: 0,
    thisWeekSessions: 0,
  });
  const [recentSessions, setRecentSessions] = useState<SessionWithClient[]>([]);
  const [activeTab, setActiveTab] = useState<TabFilter>('all');
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const savedTab = localStorage.getItem('recentSessionsTab');
    if (savedTab && ['all', 'active', 'ready', 'completed'].includes(savedTab)) {
      setActiveTab(savedTab as TabFilter);
    }
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
      const sessionsWithPhotoCounts = await Promise.all(
        recentRes.data.map(async (session) => {
          const { count } = await supabase
            .from('session_photos')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', session.id);

          return {
            ...session,
            photo_count: count || 0,
          };
        })
      );
      setRecentSessions(sessionsWithPhotoCounts as SessionWithClient[]);
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
      showToast('Error deleting session: ' + error.message, 'error');
      setDeletingId(null);
      return;
    }

    setRecentSessions(prevSessions => prevSessions.filter(s => s.id !== sessionId));
    showToast('Session deleted successfully', 'success');
    loadDashboardData();
    setDeletingId(null);
  }

  function handleTabClick(tab: TabFilter) {
    setActiveTab(tab);
    localStorage.setItem('recentSessionsTab', tab);
  }

  const filteredSessions = activeTab === 'all'
    ? recentSessions
    : recentSessions.filter(session => session.status === activeTab);

  const allCount = recentSessions.length;
  const activeCount = recentSessions.filter(s => s.status === 'active').length;
  const readyCount = recentSessions.filter(s => s.status === 'ready').length;
  const completedCount = recentSessions.filter(s => s.status === 'completed').length;

  const tabs = [
    { id: 'all' as TabFilter, label: 'All', count: allCount },
    { id: 'active' as TabFilter, label: 'Active', count: activeCount },
    { id: 'ready' as TabFilter, label: 'Ready', count: readyCount },
    { id: 'completed' as TabFilter, label: 'Completed', count: completedCount },
  ];

  async function handleStatusChange(sessionId: string, newStatus: 'active' | 'completed' | 'ready') {
    setUpdatingStatusId(sessionId);

    const previousSessions = [...recentSessions];
    const oldSession = recentSessions.find(s => s.id === sessionId);
    const oldStatus = oldSession?.status;

    setRecentSessions(prevSessions =>
      prevSessions.map(session =>
        session.id === sessionId ? { ...session, status: newStatus } : session
      )
    );

    const { error } = await supabase
      .from('sessions')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      setRecentSessions(previousSessions);
      showToast('Error updating status: ' + error.message, 'error');
      setUpdatingStatusId(null);
      return;
    }

    await refreshStats();
    setUpdatingStatusId(null);

    if (oldStatus !== newStatus) {
      const statusLabels = { active: 'Active', ready: 'Ready', completed: 'Completed' };
      showToast(`Session moved to ${statusLabels[newStatus]}`, 'success');
    }
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

  function handleCopyOrderId(displayId: string, sessionId: string) {
    navigator.clipboard.writeText(displayId);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const statCards = [
    { icon: Users, label: 'Total Clients', value: stats.totalClients, color: 'text-blue-600' },
    { icon: Scissors, label: 'Active Sessions', value: stats.activeSessions, color: 'text-green-600' },
    { icon: PackageCheck, label: 'Ready for Pickup', value: stats.readyForPickup, color: 'text-orange-600' },
    { icon: Calendar, label: "New Sessions This Week", value: stats.thisWeekSessions, color: 'text-[#506B4D]' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <ToastContainer toasts={toasts} onClose={removeToast} />

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
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Recent Sessions</h2>

          <div className="flex flex-row flex-nowrap w-full border-b border-gray-200 dark:border-gray-700">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex-1 min-w-0 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium transition-colors duration-150 ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center py-8 text-gray-500 dark:text-gray-400">Loading...</p>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            {activeTab === 'all' && (
              <>
                <PlusCircle className="w-16 h-16 text-gray-400" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No sessions yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Create your first session to get started</p>
                  <Button onClick={() => navigate('/sessions/new')}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add First Session
                  </Button>
                </div>
              </>
            )}
            {activeTab === 'active' && (
              <>
                <Scissors className="w-16 h-16 text-gray-400" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No active sessions</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Sessions in progress will appear here</p>
                </div>
              </>
            )}
            {activeTab === 'ready' && (
              <>
                <Package className="w-16 h-16 text-gray-400" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No garments ready for pickup</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Completed garments will appear here</p>
                </div>
              </>
            )}
            {activeTab === 'completed' && (
              <>
                <CheckCircle className="w-16 h-16 text-green-500" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No completed sessions yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Finished sessions will appear here</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Client Name</TableHead>
                <TableHead>Service Type</TableHead>
                <TableHead>Garment Type</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell>
                    <div className="flex items-center gap-2 group">
                      <span className="text-gray-900 dark:text-white font-medium">
                        {session.display_id || '-'}
                      </span>
                      {session.photo_count !== undefined && (
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full border transition-all ${
                            session.photo_count > 0
                              ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400'
                              : 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-500'
                          }`}
                          title={`${session.photo_count} photo${session.photo_count !== 1 ? 's' : ''} attached`}
                        >
                          <Camera className={`w-3 h-3 ${session.photo_count > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-600'}`} />
                          <span className="min-w-[8px] text-center">{session.photo_count}</span>
                        </span>
                      )}
                      {session.display_id && (
                        <button
                          onClick={() => handleCopyOrderId(session.display_id!, session.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all"
                          title="Copy order number"
                        >
                          {copiedId === session.id ? (
                            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">Copied!</span>
                          ) : (
                            <Copy className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                          )}
                        </button>
                      )}
                    </div>
                  </TableCell>
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
