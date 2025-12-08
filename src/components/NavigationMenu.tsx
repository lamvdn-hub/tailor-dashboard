import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Search, LayoutDashboard, Users, Scissors, CheckSquare, MessageSquare, FileText } from 'lucide-react';
import { GlobalSearchResults } from './GlobalSearchResults';

interface NavigationMenuProps {
  currentPage: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function NavigationMenu({ currentPage, searchQuery, onSearchChange }: NavigationMenuProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (
        isOpen &&
        panelRef.current &&
        buttonRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSearchResultClick = (type: string, id: string) => {
    switch (type) {
      case 'Client':
        navigate(`/clients/${id}`);
        break;
      case 'Session':
        navigate(`/sessions/${id}`);
        break;
      case 'Fabric':
        navigate('/fabrics');
        break;
      case 'Task':
        navigate('/tasks');
        break;
      case 'Query':
        navigate('/queries');
        break;
    }
    onSearchChange('');
    setShowSearchResults(false);
    setIsOpen(false);
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { id: 'clients', label: 'Clients', icon: Users, path: '/clients' },
    //{ id: 'fabrics', label: 'Fabrics', icon: Scissors, path: '/fabrics' },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare, path: '/tasks' },
    //{ id: 'queries', label: 'Queries', icon: MessageSquare, path: '/queries' },
    //{ id: 'reports', label: 'Reports', icon: FileText, path: '/reports' },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-[#5f7a56] dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Navigation menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity" />
          <div
            ref={panelRef}
            className="fixed left-0 top-0 h-full w-80 bg-white dark:bg-[#1B1F23] shadow-xl z-50 overflow-y-auto transform transition-transform duration-200 ease-out"
            style={{ animation: 'slideInLeft 200ms ease-out' }}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E8EAE7]">Navigation</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2A3136] transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-[#B7BAAE]" />
                </button>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setShowSearchResults(true)}
                  className="w-full pl-10 pr-4 py-2 rounded-md text-gray-900 dark:text-white bg-gray-100 dark:bg-[#2A3136] transition-colors focus:outline-none"
                />
                {showSearchResults && (
                  <GlobalSearchResults
                    searchQuery={searchQuery}
                    onResultClick={handleSearchResultClick}
                    onClose={() => setShowSearchResults(false)}
                    isInNavigationMenu={true}
                  />
                )}
              </div>

              <div className="border-t border-gray-200 dark:border-[#2A3136] pt-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.id}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                        currentPage === item.id
                          ? 'bg-[#506B4D] dark:bg-[#4C6049] text-white'
                          : 'hover:bg-gray-50 dark:hover:bg-[#2A3136] text-gray-700 dark:text-[#B7BAAE]'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideInLeft {
          from {
            transform: translateX(-100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
