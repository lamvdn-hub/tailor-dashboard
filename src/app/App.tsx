import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router';
import { I18nProvider } from '@/i18n';
import { FeedbackProvider } from '@/ui/Feedback';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ShopProvider } from '@/features/shop/ShopProvider';
import { IS_CONFIGURED, APP_NAME } from '@/lib/config';
import { ThemeProvider } from './theme';
import { queryClient } from './queryClient';
import { router } from './router';

export function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        {IS_CONFIGURED ? (
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <ShopProvider>
                <FeedbackProvider>
                  <RouterProvider router={router} />
                </FeedbackProvider>
              </ShopProvider>
            </AuthProvider>
          </QueryClientProvider>
        ) : (
          <Unconfigured />
        )}
      </I18nProvider>
    </ThemeProvider>
  );
}

function Unconfigured() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center gap-3 p-6">
      <h1 className="text-2xl font-semibold">{APP_NAME}</h1>
      <p className="text-ink-2">
        Set <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> (see{' '}
        <code>.env.example</code>) and restart the dev server.
      </p>
    </main>
  );
}
