import { lazy, Suspense, type ComponentType, type ReactNode } from 'react';
import { createBrowserRouter, Outlet, useRouteError } from 'react-router';
import { PageSpinner } from '@/ui/Spinner';
import { Button } from '@/ui/Button';
import { useI18n } from '@/i18n';
import { RedirectIfAuthed, RequireAuth, RequireShop } from './guards';
import { AppShell } from './AppShell';
import { NotFoundPage } from './NotFoundPage';

// Route-level code splitting: each screen loads on first visit.
function page<T>(load: () => Promise<T>, name: keyof T) {
  const Component = lazy(async () => ({ default: (await load())[name] as unknown as ComponentType }));
  return <Component />;
}

function Loading({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  return <Suspense fallback={<PageSpinner label={t.common.loading} />}>{children}</Suspense>;
}

function RouteError() {
  const error = useRouteError();
  const { t } = useI18n();
  console.error(error);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-6 text-center">
      <p className="text-ink-2">{t.common.somethingWentWrong}</p>
      <Button onClick={() => window.location.reload()}>{t.common.retry}</Button>
    </div>
  );
}

const auth = () => import('@/features/auth/pages');
const legal = () => import('@/features/legal/LegalPages');

export const router = createBrowserRouter([
  {
    element: (
      <Loading>
        <Outlet />
      </Loading>
    ),
    errorElement: <RouteError />,
    children: [
      // Public, customer-facing
      { path: '/track/:token', element: page(() => import('@/features/public/TrackPage'), 'TrackPage') },
      { path: '/s/:slug', element: page(() => import('@/features/public/ShopPage'), 'ShopPage') },
      { path: '/s/:slug/privacy', element: page(legal, 'ShopPrivacyNoticePage') },
      { path: '/privacy', element: page(legal, 'AppPrivacyPage') },
      { path: '/terms', element: page(legal, 'TermsPage') },
      { path: '/invite/:token', element: page(() => import('@/features/shop/InvitePage'), 'InvitePage') },
      { path: '/auth/reset', element: page(auth, 'ResetPasswordPage') },

      // Signed-out only
      {
        element: <RedirectIfAuthed />,
        children: [
          { path: '/login', element: page(auth, 'LoginPage') },
          { path: '/signup', element: page(auth, 'SignupPage') },
          { path: '/forgot', element: page(auth, 'ForgotPasswordPage') },
        ],
      },

      // Signed-in
      {
        element: <RequireAuth />,
        children: [
          { path: '/setup', element: page(() => import('@/features/shop/SetupPage'), 'SetupPage') },
          {
            element: <RequireShop />,
            children: [
              {
                element: <AppShell />,
                children: [
                  { index: true, element: page(() => import('@/features/overview/OverviewPage'), 'OverviewPage') },
                  { path: 'orders', element: page(() => import('@/features/orders/OrdersPage'), 'OrdersPage') },
                  { path: 'orders/new', element: page(() => import('@/features/orders/OrderEditorPage'), 'OrderEditorPage') },
                  { path: 'orders/:orderId', element: page(() => import('@/features/orders/OrderDetailPage'), 'OrderDetailPage') },
                  { path: 'orders/:orderId/edit', element: page(() => import('@/features/orders/OrderEditorPage'), 'OrderEditorPage') },
                  { path: 'clients', element: page(() => import('@/features/clients/ClientsPage'), 'ClientsPage') },
                  { path: 'clients/new', element: page(() => import('@/features/clients/ClientEditorPage'), 'ClientEditorPage') },
                  { path: 'clients/:clientId', element: page(() => import('@/features/clients/ClientDetailPage'), 'ClientDetailPage') },
                  { path: 'clients/:clientId/edit', element: page(() => import('@/features/clients/ClientEditorPage'), 'ClientEditorPage') },
                  { path: 'tasks', element: page(() => import('@/features/tasks/TasksPage'), 'TasksPage') },
                  { path: 'fabrics', element: page(() => import('@/features/fabrics/FabricsPage'), 'FabricsPage') },
                  { path: 'inbox', element: page(() => import('@/features/inbox/InboxPage'), 'InboxPage') },
                  { path: 'settings', element: page(() => import('@/features/settings/SettingsPage'), 'SettingsPage') },
                  { path: 'account', element: page(() => import('@/features/account/AccountPage'), 'AccountPage') },
                  { path: 'more', element: page(() => import('./MorePage'), 'MorePage') },
                ],
              },
            ],
          },
        ],
      },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
