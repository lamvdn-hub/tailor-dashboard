import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { User, Scissors, Package, CheckSquare, MessageSquare } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'Client' | 'Session' | 'Fabric' | 'Task' | 'Query';
  title: string;
  subtitle?: string;
}

interface GlobalSearchResultsProps {
  searchQuery: string;
  onResultClick: (type: string, id: string) => void;
  onClose: () => void;
  isInNavigationMenu?: boolean;
}

export function GlobalSearchResults({ searchQuery, onResultClick, onClose, isInNavigationMenu = false }: GlobalSearchResultsProps) {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const searchAllEntities = async () => {
      setLoading(true);
      const query = searchQuery.toLowerCase().trim();
      const allResults: SearchResult[] = [];

      try {
        const [clientsData, sessionsData, fabricsData, tasksData, queriesData] = await Promise.all([
          supabase
            .from('clients')
            .select('id, first_name, last_name, email')
            .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%`)
            .limit(5),
          supabase
            .from('sessions')
            .select('id, garment_type, clients(first_name, last_name)')
            .or(`garment_type.ilike.%${query}%`)
            .limit(5),
          supabase
            .from('fabrics')
            .select('id, name, stock_code, composition, color_pattern')
            .or(`name.ilike.%${query}%,stock_code.ilike.%${query}%,composition.ilike.%${query}%,color_pattern.ilike.%${query}%`)
            .limit(5),
          supabase
            .from('tasks')
            .select('id, description, category, clients(first_name, last_name)')
            .or(`description.ilike.%${query}%,category.ilike.%${query}%`)
            .limit(5),
          supabase
            .from('problems')
            .select('id, name, email, problem')
            .or(`name.ilike.%${query}%,email.ilike.%${query}%,problem.ilike.%${query}%`)
            .limit(5),
        ]);

        if (clientsData.data) {
          clientsData.data.forEach((client: any) => {
            allResults.push({
              id: client.id,
              type: 'Client',
              title: `${client.first_name || ''} ${client.last_name || ''}`.trim(),
              subtitle: client.email || undefined,
            });
          });
        }

        if (sessionsData.data) {
          sessionsData.data.forEach((session: any) => {
            const clientName = session.clients
              ? `${session.clients.first_name} ${session.clients.last_name}`
              : 'Unknown Client';
            allResults.push({
              id: session.id,
              type: 'Session',
              title: session.garment_type,
              subtitle: clientName,
            });
          });
        }

        if (fabricsData.data) {
          fabricsData.data.forEach((fabric: any) => {
            allResults.push({
              id: fabric.id,
              type: 'Fabric',
              title: fabric.name,
              subtitle: fabric.stock_code || fabric.composition || undefined,
            });
          });
        }

        if (tasksData.data) {
          tasksData.data.forEach((task: any) => {
            const clientName = task.clients
              ? `${task.clients.first_name} ${task.clients.last_name}`
              : undefined;
            allResults.push({
              id: task.id,
              type: 'Task',
              title: task.description,
              subtitle: clientName || task.category,
            });
          });
        }

        if (queriesData.data) {
          queriesData.data.forEach((query: any) => {
            allResults.push({
              id: query.id.toString(),
              type: 'Query',
              title: query.name || 'Anonymous',
              subtitle: query.email || query.problem?.substring(0, 50) || undefined,
            });
          });
        }

        setResults(allResults);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(() => {
      searchAllEntities();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  if (!searchQuery.trim()) {
    return null;
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'Client':
        return <User className="w-4 h-4" />;
      case 'Session':
        return <Package className="w-4 h-4" />;
      case 'Fabric':
        return <Scissors className="w-4 h-4" />;
      case 'Task':
        return <CheckSquare className="w-4 h-4" />;
      case 'Query':
        return <MessageSquare className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`absolute top-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50 ${
  isInNavigationMenu 
    ? 'left-0 right-0 w-full' 
    : 'left-0 right-0 sm:left-auto sm:right-0 w-full sm:w-[400px] md:w-[480px] lg:w-[520px]'
}`}
    >
      {loading ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          Searching...
        </div>
      ) : results.length === 0 ? (
        <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
          No results found
        </div>
      ) : (
        <div className="py-2">
          {results.map((result, index) => (
            <button
              key={`${result.type}-${result.id}-${index}`}
              onClick={() => {
                onResultClick(result.type, result.id);
                onClose();
              }}
              className="w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left flex items-start gap-3 group"
            >
              <div className="flex-shrink-0 mt-0.5 text-gray-400 dark:text-gray-500 group-hover:text-[#506B4D] dark:group-hover:text-[#6b8a66]">
                {getIcon(result.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {result.type}
                </div>
                <div className="font-medium text-gray-900 dark:text-white truncate">
                  {result.title}
                </div>
                {result.subtitle && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {result.subtitle}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
