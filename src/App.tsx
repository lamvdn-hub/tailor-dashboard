import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navigation } from './components/Navigation';
import { CookieConsentBanner } from './components/CookieConsentBanner';
import { Dashboard } from './pages/Dashboard';
import { Clients } from './pages/Clients';
import { ClientDetail } from './pages/ClientDetail';
import { NewClient } from './pages/NewClient';
import { NewSession } from './pages/NewSession';
import { SessionDetail } from './pages/SessionDetail';
import { Fabrics } from './pages/Fabrics';
import Tasks from './pages/Tasks';
import { Reports } from './pages/Reports';
import Queries from './pages/Queries';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { PasswordReset } from './pages/PasswordReset';
import { UpdatePassword } from './pages/UpdatePassword';
import { ProfileSecurity } from './pages/ProfileSecurity';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { OrderStatus } from './pages/OrderStatus';
import { VisualMeasurements } from './pages/VisualMeasurements';

function PasswordRecoveryHandler() {
  const { isPasswordRecovery } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('access_token');
    const type = params.get('type');
    const refreshToken = params.get('refresh_token');

    if (accessToken && type === 'recovery' || refreshToken && type === 'recovery' || isPasswordRecovery) {
      navigate('/update-password', { replace: true });
    }
  }, [isPasswordRecovery, navigate]);

  return null;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-neutral-200 dark:border-neutral-700 border-t-[#506B4D] rounded-full animate-spin"></div>
          <p className="mt-4 text-neutral-600 dark:text-neutral-400">Loading...</p>
        </div>
      </div>
    );
  }

  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup' || location.pathname === '/password-reset' || location.pathname === '/update-password';
  const isPublicPage = location.pathname === '/privacy-policy' || location.pathname === '/terms-of-service' || location.pathname.startsWith('/status/');

  return (
    <>
      <PasswordRecoveryHandler />
      {isAuthPage || isPublicPage ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/status/:token" element={<OrderStatus />} />
          <Route path="*" element={user ? <Navigate to="/dashboard" replace /> : <Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <ProtectedRoute fallback={<Login />}>
          <ProtectedLayout />
        </ProtectedRoute>
      )}
      <CookieConsentBanner />
    </>
  );
}

function ProtectedLayout() {
  const location = useLocation();
  const currentPage = location.pathname.split('/')[1] || 'dashboard';

  return (
    <div className="min-h-screen bg-[#F9F9F9] dark:bg-gray-900 transition-colors">
      <Navigation
        currentPage={currentPage}
      />

      <main className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 sm:py-6 md:py-8">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/clients/new" element={<NewClient />} />
          <Route path="/clients/:clientId" element={<ClientDetail />} />
          <Route path="/clients/:clientId/edit" element={<NewClient />} />
          <Route path="/sessions/new" element={<NewSession />} />
          <Route path="/clients/:clientId/sessions/new" element={<NewSession />} />
          <Route path="/sessions/new/body-measurements" element={<VisualMeasurements />} />
          <Route path="/sessions/:sessionId" element={<SessionDetail />} />
          <Route path="/sessions/:sessionId/body-measurements" element={<VisualMeasurements />} />
          <Route path="/fabrics" element={<Fabrics />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/queries" element={<Queries />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/profile" element={<ProfileSecurity />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function AppContent() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
