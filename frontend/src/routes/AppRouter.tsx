import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingPage from '../pages/LandingPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import ForgotPasswordPage from '../pages/ForgotPasswordPage';
import ResetPasswordPage from '../pages/ResetPasswordPage';
import VerifyEmailPage from '../pages/VerifyEmailPage';
import Layout from '../components/layout/Layout';
import DashboardPage from '../pages/DashboardPage';
import CamionsPage from '../pages/CamionsPage';
import SuperAdminOverviewPage from '../pages/super-admin/SuperAdminOverviewPage';
import SuperAdminCompaniesPage from '../pages/super-admin/SuperAdminCompaniesPage';
import SuperAdminCompanyDetailPage from '../pages/super-admin/SuperAdminCompanyDetailPage';
import SuperAdminUsersPage from '../pages/super-admin/SuperAdminUsersPage';
import SuperAdminRequestsPage from '../pages/super-admin/SuperAdminRequestsPage';
import UtilisateursPage from '../pages/UtilisateursPage';
import RegisterCompanyPage from '../pages/RegisterCompanyPage';
import ClientRegisterPage from '../pages/ClientRegisterPage';

function PrivateRoute() {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  return token ? <Layout /> : <Navigate to="/login" replace />;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { token, isLoading } = useAuth();
  if (isLoading) return null;
  return !token ? <>{children}</> : <Navigate to="/dashboard" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Pages publiques ──────────────────────────────────────────── */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
        <Route path="/register-company" element={<RegisterCompanyPage />} />
        <Route path="/register-client" element={<ClientRegisterPage />} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* ── Pages privées (Layout) ───────────────────────────────────── */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/missions" element={<PlaceholderPage title="Missions" />} />
          <Route path="/bons-livraison" element={<PlaceholderPage title="Bons de livraison" />} />
          <Route path="/camions" element={<CamionsPage />} />
          <Route path="/factures" element={<PlaceholderPage title="Factures" />} />
          <Route path="/utilisateurs" element={<UtilisateursPage />} />
          <Route path="/parametres" element={<PlaceholderPage title="Paramètres" />} />
          {/* Super Admin */}
          <Route path="/super-admin" element={<SuperAdminOverviewPage />} />
          <Route path="/super-admin/requests" element={<SuperAdminRequestsPage />} />
          <Route path="/super-admin/companies" element={<SuperAdminCompaniesPage />} />
          <Route path="/super-admin/companies/:id" element={<SuperAdminCompanyDetailPage />} />
          <Route path="/super-admin/users" element={<SuperAdminUsersPage />} />
          <Route path="/super-admin/settings" element={<PlaceholderPage title="Paramètres Super Admin" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
      <p className="text-slate-400 text-sm">Page <strong className="text-slate-600">{title}</strong> — en cours de développement</p>
    </div>
  );
}
