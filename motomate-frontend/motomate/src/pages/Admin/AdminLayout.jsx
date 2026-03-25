import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Menu, Bell, Search } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import DashboardPage from './pages/DashboardPage';
import { ServiceCenterVerifications, FleetManagerVerifications } from './pages/VerificationsPage';
import QueriesPage from './pages/QueriesPage';
import OngoingServicesPage from './pages/ServicesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ReportsPage from './pages/ReportsPage';

/* ── Page title map ─────────────────────────────────────────── */
const PAGE_TITLES = {
  '/admin':                                  'Dashboard',
  '/admin/verifications/service-centers':    'Service Center Verifications',
  '/admin/verifications/fleet-managers':     'Fleet Manager Verifications',
  '/admin/queries':                          'User Queries',
  '/admin/services':                         'Ongoing Services',
  '/admin/analytics':                        'Analytics',
  '/admin/reports':                          'Reports',
};

/* ── Top bar ────────────────────────────────────────────────── */
const Topbar = ({ onMenuClick }) => {
  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'Admin';

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-100 px-5 py-3.5 flex items-center gap-4 shadow-sm">
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-600"
      >
        <Menu size={20} />
      </button>

      <h1 className="text-base font-bold text-gray-900 flex-1">{title}</h1>

      <div className="flex items-center gap-2">
        {/* Notification bell placeholder */}
        <button className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-500">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Admin avatar */}
        <div className="w-9 h-9 rounded-xl bg-linear-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-bold shadow-sm">
          A
        </div>
      </div>
    </header>
  );
};

/* ── Admin Layout ───────────────────────────────────────────── */
const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Sidebar
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-5 md:p-7">
          <Routes>
            <Route index                                   element={<DashboardPage />} />
            <Route path="verifications/service-centers"   element={<ServiceCenterVerifications />} />
            <Route path="verifications/fleet-managers"    element={<FleetManagerVerifications />} />
            <Route path="queries"                         element={<QueriesPage />} />
            <Route path="services"                        element={<OngoingServicesPage />} />
            <Route path="analytics"                       element={<AnalyticsPage />} />
            <Route path="reports"                         element={<ReportsPage />} />
            <Route path="*"                               element={<Navigate to="/admin" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

/* ── Login Page ─────────────────────────────────────────────── */
export const AdminLogin = () => {
  const navigate = useNavigate();
  const [form, setForm]     = useState({ email: '', password: '' });
  const [loading, setLoad]  = useState(false);
  const [error, setError]   = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError('Please fill all fields');
    setLoad(true);
    setError('');
    try {
      // DEMO MODE: uses mockApi. Replace with real fetch when backend is ready.
      const { adminLogin: mockLogin } = await import('./mockapi.js');
      const data = await mockLogin(form);
      localStorage.setItem('adminToken', data.token);
      navigate('/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoad(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-red-700 via-red-600 to-red-800 flex items-center justify-center px-4">
      {/* Background texture */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-black/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white text-2xl font-black">M</span>
          </div>
          <h1 className="text-white text-3xl font-black tracking-tight">MotoMate</h1>
          <p className="text-red-200 text-sm mt-1 font-medium">Admin Control Panel</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-1">Sign In</h2>
          <p className="text-gray-500 text-sm mb-4">Access the admin dashboard</p>
          <div className="mb-5 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium">
            <strong>Demo credentials:</strong> admin@motomate.com / admin123
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Admin Email</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="admin@motomate.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3.5 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> Signing in…</>
              ) : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ── Route Guard ────────────────────────────────────────────── */
// DEMO MODE: bypasses real auth. Set DEMO_MODE=false when backend is ready.
const DEMO_MODE = true;

const RequireAuth = ({ children }) => {
  if (DEMO_MODE) {
    localStorage.setItem('adminToken', 'mock-demo-token');
    return children;
  }
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
};

/* ── Root Admin Router (add to your app's router) ─────────── */
const AdminRouter = () => (
  <Routes>
    <Route path="/admin/login" element={<AdminLogin />} />
    <Route
      path="/admin/*"
      element={
        <RequireAuth>
          <AdminLayout />
        </RequireAuth>
      }
    />
  </Routes>
);

export default AdminLayout;
export { AdminRouter, RequireAuth };