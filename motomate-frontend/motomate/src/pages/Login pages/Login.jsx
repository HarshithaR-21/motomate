import { useState } from 'react';
import { ChevronRight, Eye, EyeOff, Car, Wrench, Building2, Truck, ShieldAlert } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// ─── Role Configuration ───────────────────────────────────────────────────────
const ROLE_CONFIG = {
  Customer: {
    icon: Car,
    label: 'Customer',
    description: 'Book and manage your vehicle services',
    gradient: 'from-blue-500 to-blue-700',
    accentBg: 'bg-blue-600',
    accentHover: 'hover:bg-blue-700',
    accentText: 'text-blue-600',
    accentBorder: 'border-blue-500',
    accentRing: 'focus:ring-blue-400',
    accentLight: 'bg-blue-50',
    badgeBg: 'bg-blue-100 text-blue-700',
    cardBorder: 'border-blue-200',
    cardHover: 'hover:border-blue-400 hover:bg-blue-50',
    css: { primary: '#2563eb', light: '#eff6ff', text: '#1d4ed8' },
    apiUrl: 'http://localhost:8080/api/auth/login',
    dashboardPath: '/dashboard/customer',
  },
  Worker: {
    icon: Wrench,
    label: 'Worker',
    description: 'Manage your assigned service tasks',
    gradient: 'from-emerald-500 to-green-700',
    accentBg: 'bg-emerald-600',
    accentHover: 'hover:bg-emerald-700',
    accentText: 'text-emerald-600',
    accentBorder: 'border-emerald-500',
    accentRing: 'focus:ring-emerald-400',
    accentLight: 'bg-emerald-50',
    badgeBg: 'bg-emerald-100 text-emerald-700',
    cardBorder: 'border-emerald-200',
    cardHover: 'hover:border-emerald-400 hover:bg-emerald-50',
    css: { primary: '#059669', light: '#ecfdf5', text: '#047857' },
    apiUrl: 'http://localhost:8080/api/auth/login',
    dashboardPath: '/dashboard/worker',
  },
  'Service Center Owner': {
    icon: Building2,
    label: 'Service Center Owner',
    description: 'Manage your service center operations',
    gradient: 'from-violet-500 to-purple-700',
    accentBg: 'bg-violet-600',
    accentHover: 'hover:bg-violet-700',
    accentText: 'text-violet-600',
    accentBorder: 'border-violet-500',
    accentRing: 'focus:ring-violet-400',
    accentLight: 'bg-violet-50',
    badgeBg: 'bg-violet-100 text-violet-700',
    cardBorder: 'border-violet-200',
    cardHover: 'hover:border-violet-400 hover:bg-violet-50',
    css: { primary: '#7c3aed', light: '#f5f3ff', text: '#6d28d9' },
    apiUrl: 'http://localhost:8080/api/auth/login',
    dashboardPath: '/dashboard/service-center-owner',
  },
  'Fleet Manager': {
    icon: Truck,
    label: 'Fleet Manager',
    description: 'Oversee your fleet and service schedules',
    gradient: 'from-orange-500 to-amber-600',
    accentBg: 'bg-orange-500',
    accentHover: 'hover:bg-orange-600',
    accentText: 'text-orange-500',
    accentBorder: 'border-orange-400',
    accentRing: 'focus:ring-orange-400',
    accentLight: 'bg-orange-50',
    badgeBg: 'bg-orange-100 text-orange-700',
    cardBorder: 'border-orange-200',
    cardHover: 'hover:border-orange-400 hover:bg-orange-50',
    css: { primary: '#f97316', light: '#fff7ed', text: '#c2410c' },
    apiUrl: 'http://localhost:8080/api/auth/login',
    dashboardPath: '/dashboard/fleet-manager',
  },
  Admin: {
    icon: ShieldAlert,
    label: 'Admin',
    description: 'Full platform control and oversight',
    gradient: 'from-red-500 to-rose-700',
    accentBg: 'bg-red-600',
    accentHover: 'hover:bg-red-700',
    accentText: 'text-red-600',
    accentBorder: 'border-red-500',
    accentRing: 'focus:ring-red-400',
    accentLight: 'bg-red-50',
    badgeBg: 'bg-red-100 text-red-700',
    cardBorder: 'border-red-200',
    cardHover: 'hover:border-red-400 hover:bg-red-50',
    css: { primary: '#dc2626', light: '#fef2f2', text: '#b91c1c' },
    apiUrl: 'http://localhost:8080/api/auth/admin/login',
    dashboardPath: '/admin/dashboard',
  },
};

const ROLES = Object.keys(ROLE_CONFIG);

// ─── Login Form ────────────────────────────────────────────────────────────
const LoginForm = ({ role }) => {
  const cfg = ROLE_CONFIG[role];
  const Icon = cfg.icon;
  const navigate = useNavigate();
  

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!cfg) {
    navigate('/login');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.email.trim()) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Enter a valid email';
    if (!formData.password) errs.password = 'Password is required';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) { toast.error('Please fix the errors below'); return; }

    setLoading(true);
    try {
      const res = await axios.post(cfg.apiUrl, formData, { withCredentials: true });
      console.log(res.data);
      toast.success('Login successful!');
      navigate(cfg.dashboardPath);
    } catch (err) {
      console.error(err.response?.data);
      toast.error(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div
          className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4`}
          style={{ backgroundColor: cfg.css.light }}
        >
          <Icon size={26} style={{ color: cfg.css.primary }} />
        </div>

        <span
          className="inline-block text-xs font-semibold px-3 py-1 rounded-full mb-3"
          style={{ backgroundColor: cfg.css.light, color: cfg.css.text }}
        >
          {cfg.label}
        </span>

        <h1 className="text-2xl font-bold text-gray-900">Sign in to MotoMate</h1>
        <p className="text-gray-500 text-sm mt-1">{cfg.description}</p>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-3xl p-7 shadow-sm">
        <form onSubmit={handleSubmit} noValidate>
          {/* Email */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition
                focus:ring-2 ${cfg.accentRing} focus:border-transparent
                ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
            />
            {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="mb-7">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm outline-none transition
                  focus:ring-2 ${cfg.accentRing} focus:border-transparent
                  ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full text-white py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2
              transition-all duration-200 shadow-md disabled:opacity-60`}
            style={{ backgroundColor: cfg.css.primary }}
            onMouseEnter={e => !loading && (e.currentTarget.style.filter = 'brightness(0.9)')}
            onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Signing in…
              </span>
            ) : (
              <>Sign in <ChevronRight size={16} /></>
            )}
          </button>
        </form>
      </div>

      {/* Footer links */}
      <div className="mt-5 text-center space-y-2">
        {role !== 'Admin' && (
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium" style={{ color: cfg.css.primary }}>
              Sign Up
            </Link>
          </p>
        )}
        <button
          onClick={() => navigate('/login')}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          ← Change role
        </button>
      </div>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────
const Login = () => {
  const { role: roleParam } = useParams(); 

  // Match URL param (lowercase, hyphenated) to ROLE_CONFIG key
  const matchedRole = ROLES.find(
    (r) => r.toLowerCase().replace(/\s+/g, '-') === roleParam
  );

  return (
    <>
      <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px' } }} />
      <section className="min-h-screen bg-gray-50 relative z-10">
        {matchedRole
          ? <LoginForm role={matchedRole} />
          : <p className="text-center pt-20 text-gray-500">Invalid role. <a href="/login" className="text-blue-500 underline">Go back</a></p>
        }
      </section>
    </>
  );
};

export default Login;
