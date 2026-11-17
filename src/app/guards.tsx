import { Navigate, Outlet, useLocation } from 'react-router';
import { useI18n } from '@/i18n';
import { PageSpinner } from '@/ui/Spinner';
import { useAuth } from '@/features/auth/AuthProvider';
import { useShopContext } from '@/features/shop/ShopProvider';
import { Button } from '@/ui/Button';
import { describeError } from '@/lib/errors';

export function RequireAuth() {
  const { user, ready, recovering } = useAuth();
  const location = useLocation();
  const { t } = useI18n();
  if (!ready) return <PageSpinner label={t.common.loading} />;
  if (recovering) return <Navigate to="/auth/reset" replace />;
  if (!user) {
    const next = location.pathname === '/' ? '' : `?next=${encodeURIComponent(location.pathname + location.search)}`;
    return <Navigate to={`/login${next}`} replace />;
  }
  return <Outlet />;
}

export function RedirectIfAuthed() {
  const { user, ready } = useAuth();
  const { t } = useI18n();
  const location = useLocation();
  if (!ready) return <PageSpinner label={t.common.loading} />;
  if (user) {
    const next = new URLSearchParams(location.search).get('next');
    return <Navigate to={next && next.startsWith('/') && !next.startsWith('//') ? next : '/'} replace />;
  }
  return <Outlet />;
}

export function RequireShop() {
  const { shop, loading, error } = useShopContext();
  const { t } = useI18n();
  if (loading) return <PageSpinner label={t.common.loading} />;
  if (error)
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-ink-2">{describeError(error, t)}</p>
        <Button onClick={() => window.location.reload()}>{t.common.retry}</Button>
      </div>
    );
  if (!shop) return <Navigate to="/setup" replace />;
  return <Outlet />;
}
