import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { readPref, writePref } from '@/lib/prefs';

export type ThemePref = 'system' | 'light' | 'dark';

const ThemeContext = createContext<{ theme: ThemePref; setTheme: (t: ThemePref) => void } | null>(null);

function apply(pref: ThemePref) {
  const dark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemePref>(() => {
    const saved = readPref('theme');
    return saved === 'light' || saved === 'dark' ? saved : 'system';
  });

  useEffect(() => {
    apply(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [theme]);

  const setTheme = useCallback((next: ThemePref) => {
    setThemeState(next);
    writePref('theme', next === 'system' ? null : next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider');
  return ctx;
}
