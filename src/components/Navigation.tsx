import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { BurgerMenu } from './BurgerMenu';
import { NavigationMenu } from './NavigationMenu';
import { GlobalSearchResults } from './GlobalSearchResults';
import { useAuth } from '../contexts/AuthContext';

interface NavigationProps {
  currentPage: string;
}

export function Navigation({ currentPage }: NavigationProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'clients', label: 'Clients', path: '/clients' },
    { id: 'fabrics', label: 'Fabrics', path: '/fabrics' },
    { id: 'tasks', label: 'Tasks', path: '/tasks' },
    { id: 'queries', label: 'Queries', path: '/queries' },
    { id: 'reports', label: 'Reports', path: '/reports' },
  ];

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
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <nav className="bg-[#506B4D] dark:bg-gray-800 text-white shadow-lg sticky top-0 z-50 transition-colors">
      <div className="max-w-[1400px] mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between gap-3 md:gap-4 lg:gap-6 h-16 md:h-28 lg:h-32">
          <Link
            to="/dashboard"
            className="cursor-pointer focus:outline-none flex-shrink-0"
            aria-label="Go to Dashboard"
          >
            <img
              src="/Screenshot+2023-09-13+at+13.49.21 copy.webp"
              alt="WBB Tailor Logo"
              className="h-12 md:h-20 lg:h-24 w-auto object-contain"
            />
          </Link>

          <div className="flex items-center gap-2 lg:hidden">
            <NavigationMenu
              currentPage={currentPage}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
            {user && <BurgerMenu />}
          </div>

          <div className="hidden lg:flex items-center flex-1 justify-end gap-3 flex-nowrap">
            <div className="flex flex-nowrap items-center justify-end gap-2">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`px-2 md:px-3 lg:px-4 py-1.5 md:py-2 rounded-md text-sm md:text-base font-medium transition-colors whitespace-nowrap ${
                    currentPage === item.id
                      ? 'bg-white text-[#506B4D] dark:bg-gray-700 dark:text-white'
                      : 'text-white hover:bg-[#5f7a56] dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="relative w-32 min-w-[8rem] max-w-[12rem] flex-shrink flex-grow-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchResults(true)}
                className="w-full pl-10 pr-4 py-2 rounded-md text-gray-900 dark:text-white dark:bg-gray-700 transition-colors focus:outline-none"
              />
              {showSearchResults && (
                <GlobalSearchResults
                  searchQuery={searchQuery}
                  onResultClick={handleSearchResultClick}
                  onClose={() => setShowSearchResults(false)}
                />
              )}
            </div>

            {user && <BurgerMenu />}
          </div>
        </div>
      </div>
    </nav>
  );
}
