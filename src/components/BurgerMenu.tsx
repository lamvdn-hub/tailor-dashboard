import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, X, ChevronDown, Download, Upload, LogOut, Lock, Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { exportClientsAndSessions } from '../lib/exportUtils';
import { supabase } from '../lib/supabase';

interface UserProfile {
  first_name: string;
  last_name: string;
}

export function BurgerMenu() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && data) {
          setUserProfile(data);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

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

  const handleLogout = async () => {
    await signOut();
    setIsOpen(false);
    navigate('/login');
  };

  const handleExportCSV = async () => {
    await exportClientsAndSessions();
  };

  const handleImportData = () => {
    console.log('Import data clicked');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setIsThemeDropdownOpen(false);
  };

  const themeOptions = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md hover:bg-[#5f7a56] dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-white"
        aria-label="Menu"
        aria-expanded={isOpen}
      >
        {isOpen ? <X className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40 transition-opacity" />
          <div
            ref={panelRef}
            className="fixed right-0 top-0 h-full w-80 bg-white dark:bg-[#1B1F23] shadow-xl z-50 overflow-y-auto transform transition-transform duration-200 ease-out"
            style={{ animation: 'slideIn 200ms ease-out' }}
          >
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-[#E8EAE7]">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-[#2A3136] transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-600 dark:text-[#B7BAAE]" />
                </button>
              </div>

              <div className="space-y-1">
                <p className="text-xl font-bold text-gray-900 dark:text-[#E8EAE7]">
                  Hello {userProfile?.first_name || 'User'}
                </p>
                <p className="text-sm text-gray-600 dark:text-[#B7BAAE]">{user?.email || 'user@example.com'}</p>
              </div>

              <div className="border-t border-gray-200 dark:border-[#2A3136] pt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-[#B7BAAE]">
                  Data Management
                </label>
                <div className="space-y-1">
                  <button
                    onClick={handleExportCSV}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2A3136] text-gray-700 dark:text-[#B7BAAE] transition-colors duration-200"
                  >
                    <Download className="w-5 h-5" />
                    <span className="text-sm">Export CSV</span>
                  </button>
                  <button
                    onClick={handleImportData}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2A3136] text-gray-700 dark:text-[#B7BAAE] transition-colors duration-200"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">Import Data</span>
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-[#2A3136] pt-4 space-y-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-[#B7BAAE]">
                  Appearance
                </label>
                <div className="relative">
                  <button
                    onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-lg bg-gray-50 dark:bg-[#2A3136] hover:bg-gray-100 dark:hover:bg-[#3B454B] text-gray-700 dark:text-[#B7BAAE] transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      {theme === 'light' && <Sun className="w-5 h-5" />}
                      {theme === 'dark' && <Moon className="w-5 h-5" />}
                      {theme === 'system' && <Monitor className="w-5 h-5" />}
                      <span className="text-sm capitalize">{theme}</span>
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                      isThemeDropdownOpen ? 'rotate-180' : ''
                    }`} />
                  </button>
                  {isThemeDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-[#1B1F23] border border-gray-200 dark:border-[#2A3136] rounded-lg shadow-lg z-10 overflow-hidden">
                      {themeOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleThemeChange(option.value as 'light' | 'dark' | 'system')}
                            className={`w-full flex items-center gap-3 px-4 py-3 transition-colors duration-200 ${
                              theme === option.value
                                ? 'bg-gray-100 dark:bg-[#3B454B] text-gray-900 dark:text-[#E8EAE7]'
                                : 'hover:bg-gray-50 dark:hover:bg-[#2A3136] text-gray-700 dark:text-[#B7BAAE]'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-sm">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-[#2A3136] pt-4 space-y-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 dark:hover:bg-[#2A3136] text-gray-700 dark:text-[#B7BAAE] transition-colors duration-200"
                >
                  <Lock className="w-5 h-5" />
                  <span className="text-sm">Profile & Security</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 dark:hover:bg-[#3B2828] text-[#C95B5B] transition-colors duration-200"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="text-sm font-medium">Log Out</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
