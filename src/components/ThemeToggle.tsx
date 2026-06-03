import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-all outline-none"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? (
        <Sun className="w-5 h-5 transition-transform duration-300 text-[#506B4D]" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-300 text-white" />
      )}
    </button>
  );
}
