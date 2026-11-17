import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import {
  Home,
  ClipboardList,
  Users,
  ListChecks,
  Layers,
  Inbox,
  Store,
  UserRound,
  Menu,
  Search,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { useI18n } from '@/i18n';
import { useShop } from '@/features/shop/ShopProvider';
import { overviewQuery } from '@/features/overview/api';
import { SearchDialog } from '@/features/search/SearchDialog';
import { APP_NAME } from '@/lib/config';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  end?: boolean;
}

const SearchContext = createContext<() => void>(() => {});
export const useOpenSearch = () => useContext(SearchContext);

export function AppShell() {
  const { t } = useI18n();
  const { shop } = useShop();
  const [searchOpen, setSearchOpen] = useState(false);
  const location = useLocation();
  const overview = useQuery(overviewQuery(shop.id));
  const openInquiries = overview.data?.open_inquiries ?? 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => setSearchOpen(false), [location.pathname]);

  const primary: NavItem[] = [
    { to: '/', label: t.app.nav.overview, icon: Home, end: true },
    { to: '/orders', label: t.app.nav.orders, icon: ClipboardList },
    { to: '/clients', label: t.app.nav.clients, icon: Users },
    { to: '/tasks', label: t.app.nav.tasks, icon: ListChecks },
  ];
  const secondary: NavItem[] = [
    { to: '/fabrics', label: t.app.nav.fabrics, icon: Layers },
    { to: '/inbox', label: t.app.nav.inbox, icon: Inbox, badge: openInquiries },
    { to: '/settings', label: t.app.nav.settings, icon: Store },
    { to: '/account', label: t.app.nav.account, icon: UserRound },
  ];
  const moreActive = ['/more', ...secondary.map((s) => s.to)].some((p) => location.pathname.startsWith(p));

  return (
    <SearchContext.Provider value={() => setSearchOpen(true)}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-4 focus:py-2">
        {t.app.skipToContent}
      </a>
      <div className="lg:grid lg:min-h-dvh lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-dvh flex-col gap-1 border-r border-line bg-surface px-3 py-4 lg:flex">
          <div className="px-3 pb-3">
            <div className="text-xs font-medium uppercase tracking-wider text-ink-3">{APP_NAME}</div>
            <div className="truncate text-[0.9375rem] font-semibold">{shop.name}</div>
          </div>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="mb-2 flex h-10 items-center gap-2 rounded-[var(--radius-control)] border border-line bg-sunken px-3 text-sm text-ink-3 hover:text-ink-2"
          >
            <Search className="size-4" />
            <span className="flex-1 text-left">{t.common.search}</span>
            <kbd className="rounded border border-line-strong px-1.5 text-[0.6875rem]">⌘K</kbd>
          </button>
          <nav aria-label={t.app.nav.more} className="flex flex-1 flex-col gap-0.5">
            {primary.map((item) => (
              <SideLink key={item.to} item={item} />
            ))}
            <div className="my-2 h-px bg-line" />
            {secondary.map((item) => (
              <SideLink key={item.to} item={item} />
            ))}
          </nav>
        </aside>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label={t.app.nav.more}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 pb-safe backdrop-blur-md lg:hidden"
      >
        <ul className="mx-auto grid max-w-lg grid-cols-5">
          {primary.map((item) => (
            <li key={item.to}>
              <TabLink item={item} />
            </li>
          ))}
          <li>
            <NavLink
              to="/more"
              className={cn(
                'flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium',
                moreActive ? 'text-accent' : 'text-ink-3',
              )}
            >
              <span className="relative">
                <Menu className="size-6" aria-hidden />
                {openInquiries > 0 && <Dot />}
              </span>
              {t.app.nav.more}
            </NavLink>
          </li>
        </ul>
      </nav>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </SearchContext.Provider>
  );
}

function Dot() {
  return <span aria-hidden className="absolute -right-1 -top-0.5 size-2.5 rounded-full border-2 border-surface bg-danger" />;
}

function SideLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[0.9375rem] font-medium transition-colors',
          isActive ? 'bg-accent-soft text-accent-soft-ink' : 'text-ink-2 hover:bg-sunken hover:text-ink',
        )
      }
    >
      <Icon className="size-5" aria-hidden />
      <span className="flex-1">{item.label}</span>
      {item.badge ? <span className="tabular rounded-full bg-danger px-2 text-xs font-semibold text-white">{item.badge}</span> : null}
    </NavLink>
  );
}

function TabLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          'flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium',
          isActive ? 'text-accent' : 'text-ink-3',
        )
      }
    >
      <Icon className="size-6" aria-hidden />
      {item.label}
    </NavLink>
  );
}

export function HeaderSearchButton(): ReactNode {
  const open = useOpenSearch();
  const { t } = useI18n();
  return (
    <button
      type="button"
      onClick={open}
      aria-label={t.common.search}
      className="inline-flex size-11 items-center justify-center rounded-full text-ink-2 hover:bg-sunken lg:hidden"
    >
      <Search className="size-5" />
    </button>
  );
}
