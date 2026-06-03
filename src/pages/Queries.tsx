import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search, Mail, User, MessageSquare, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { QueryStatusSelect } from '../components/QueryStatusSelect';

type Query = {
  id: number;
  name: string | null;
  email: string | null;
  problem: string | null;
  Status: boolean | null;
};

type FilterType = 'all' | 'pending' | 'resolved';

export default function Queries() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    loadQueries();
  }, []);

  const loadQueries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('problems')
      .select('*')
      .order('id', { ascending: false });

    if (error) {
      console.error('Error loading queries:', error);
      alert('Error loading queries: ' + error.message);
    } else {
      setQueries(data || []);
    }
    setLoading(false);
  };

  const handleStatusChange = async (queryId: number, newStatus: boolean) => {
    setUpdatingId(queryId);

    const { error } = await supabase
      .from('problems')
      .update({ Status: newStatus })
      .eq('id', queryId);

    if (error) {
      alert('Error updating status: ' + error.message);
      setUpdatingId(null);
      return;
    }

    setQueries(prevQueries =>
      prevQueries.map(q =>
        q.id === queryId ? { ...q, Status: newStatus } : q
      )
    );

    setUpdatingId(null);

    const liveRegion = document.getElementById('query-status-message');
    if (liveRegion) {
      liveRegion.textContent = `Query marked as ${newStatus ? 'resolved' : 'pending'}`;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
  };

  const handleDeleteQuery = async (queryId: number) => {
    if (!confirm('Are you sure you want to delete this query? This action cannot be undone.')) {
      return;
    }

    setDeletingId(queryId);

    const { data, error } = await supabase
      .from('problems')
      .delete()
      .eq('id', queryId)
      .select();

    if (error) {
      console.error('Error deleting query:', error);
      alert('Error deleting query: ' + error.message);
      setDeletingId(null);
      return;
    }

    if (!data || data.length === 0) {
      console.warn('Delete operation completed but no rows were affected');
      alert('Failed to delete query. Please try again or contact support.');
      setDeletingId(null);
      return;
    }

    setQueries(prevQueries => prevQueries.filter(q => q.id !== queryId));
    setDeletingId(null);

    const liveRegion = document.getElementById('query-status-message');
    if (liveRegion) {
      liveRegion.textContent = 'Query deleted successfully';
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 3000);
    }
  };

  const filteredQueries = queries.filter(query => {
    if (filter === 'pending' && query.Status !== false) return false;
    if (filter === 'resolved' && query.Status !== true) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        (query.name?.toLowerCase().includes(search) || false) ||
        (query.email?.toLowerCase().includes(search) || false) ||
        (query.problem?.toLowerCase().includes(search) || false)
      );
    }

    return true;
  });

  const pendingCount = queries.filter(q => q.Status === false).length;
  const resolvedCount = queries.filter(q => q.Status === true).length;

  if (loading) {
    return <div className="p-8 text-center dark:text-gray-400">Loading queries...</div>;
  }

  return (
    <div>
      <div
        id="query-status-message"
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Customer Queries</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">Manage customer support requests and inquiries</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 sm:items-center sm:justify-between mb-4 sm:mb-6">
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors ${
                  filter === 'all'
                    ? 'bg-[#506B4D] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                All ({queries.length})
              </button>
              <button
                onClick={() => setFilter('pending')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors flex items-center gap-1 sm:gap-2 ${
                  filter === 'pending'
                    ? 'bg-[#506B4D] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Pending</span>
                <span className="xs:hidden">Pend.</span> ({pendingCount})
              </button>
              <button
                onClick={() => setFilter('resolved')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-colors flex items-center gap-1 sm:gap-2 ${
                  filter === 'resolved'
                    ? 'bg-[#506B4D] text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden xs:inline">Resolved</span>
                <span className="xs:hidden">Resol.</span> ({resolvedCount})
              </button>
            </div>

            <div className="relative w-full sm:flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white dark:placeholder-gray-400 focus:outline-none"
              />
            </div>
          </div>

          {filteredQueries.length === 0 ? (
            <div className="text-center py-8 sm:py-12 text-sm sm:text-base text-gray-500">
              {searchTerm ? 'No queries match your search.' : 'No queries found.'}
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {filteredQueries.map((query) => (
                <div
                  key={query.id}
                  className={`border rounded-lg p-4 sm:p-6 transition-shadow duration-200 ${
                    query.Status
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-[#506B4D] hover:shadow-lg dark:hover:shadow-[#506B4D]/20 dark:hover:bg-gray-750 dark:hover:border-[#6b8a66]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-2 sm:space-y-3 min-w-0">
                      <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                        <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 min-w-0">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                          <span className="font-medium text-sm sm:text-base truncate">
                            {query.name || 'Anonymous'}
                          </span>
                        </div>
                        {query.email && (
                          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 min-w-0 max-w-full">
                            <Mail className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <a
                              href={`mailto:${query.email}`}
                              className="hover:text-[#506B4D] hover:underline text-xs sm:text-sm truncate"
                            >
                              {query.email}
                            </a>
                          </div>
                        )}
                      </div>

                      <div className="flex items-start gap-2">
                        <MessageSquare className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 mt-1 flex-shrink-0" />
                        <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm sm:text-base break-words">
                          {query.problem || 'No problem description provided'}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className={updatingId === query.id ? 'opacity-50 pointer-events-none' : ''}>
                          <QueryStatusSelect
                            value={query.Status ? 'resolved' : 'pending'}
                            onChange={(value) =>
                              handleStatusChange(query.id, value === 'resolved')
                            }
                            options={[
                              { value: 'pending', label: 'Pending' },
                              { value: 'resolved', label: 'Resolved' }
                            ]}
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteQuery(query.id)}
                          disabled={deletingId === query.id}
                          className={`p-1.5 sm:p-2 rounded-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors ${
                            deletingId === query.id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Delete query"
                          aria-label="Delete query"
                        >
                          <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        ID: #{query.id}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">Summary</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{queries.length}</div>
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Total Queries</div>
            </div>
            <div className="bg-yellow-50 dark:bg-yellow-900/30 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-yellow-700 dark:text-white">{pendingCount}</div>
              <div className="text-xs sm:text-sm text-yellow-600 dark:text-gray-400">Pending</div>
            </div>
            <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold text-green-700 dark:text-white">{resolvedCount}</div>
              <div className="text-xs sm:text-sm  text-green-600 dark:text-gray-400">Resolved</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
