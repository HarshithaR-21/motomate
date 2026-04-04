// src/pages/FleetManager/components/FleetUI.jsx
import { AlertTriangle, CheckCircle, Clock, XCircle, Loader2, TrendingUp } from 'lucide-react';

// ── Spinner ───────────────────────────────────────────────────────
export const Spinner = ({ size = 20, className = '' }) => (
  <Loader2 size={size} className={`animate-spin text-orange-500 ${className}`} />
);

// ── Page Loader ───────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <Spinner size={32} />
    <p className="text-sm text-gray-400 font-medium">Loading…</p>
  </div>
);

// ── Error Block ───────────────────────────────────────────────────
export const ErrorBlock = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-3">
    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
      <AlertTriangle size={22} className="text-red-400" />
    </div>
    <p className="text-sm text-gray-600 font-medium">{message || 'Something went wrong.'}</p>
    {onRetry && (
      <button onClick={onRetry}
        className="text-xs text-orange-600 font-semibold border border-orange-200 px-4 py-1.5 rounded-full hover:bg-orange-50 transition-colors">
        Retry
      </button>
    )}
  </div>
);

// ── Stat Card ──────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, sub, accent = 'orange', trend }) => {
  const accents = {
    orange: 'bg-gradient-to-br from-orange-400 to-orange-500 text-white shadow-orange-200',
    green:  'bg-gradient-to-br from-emerald-400 to-emerald-500 text-white shadow-emerald-200',
    blue:   'bg-gradient-to-br from-blue-400 to-blue-500 text-white shadow-blue-200',
    amber:  'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-200',
    indigo: 'bg-gradient-to-br from-indigo-400 to-indigo-500 text-white shadow-indigo-200',
    rose:   'bg-gradient-to-br from-rose-400 to-rose-500 text-white shadow-rose-200',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${accents[accent] || accents.orange}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-full shrink-0">
          <TrendingUp size={12} />{trend}
        </div>
      )}
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────
const STATUS_STYLES = {
  PENDING:     'bg-amber-50 text-amber-700 border-amber-200',
  ASSIGNED:    'bg-blue-50 text-blue-700 border-blue-200',
  IN_PROGRESS: 'bg-orange-50 text-orange-700 border-orange-200',
  COMPLETED:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  CANCELLED:   'bg-red-50 text-red-600 border-red-200',
  ACTIVE:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE:    'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_ICONS = {
  PENDING:     Clock,
  ASSIGNED:    Clock,
  IN_PROGRESS: Loader2,
  COMPLETED:   CheckCircle,
  CANCELLED:   XCircle,
  ACTIVE:      CheckCircle,
  INACTIVE:    XCircle,
};

export const StatusBadge = ({ status }) => {
  const key = (status || 'PENDING').toUpperCase();
  const style = STATUS_STYLES[key] || STATUS_STYLES.PENDING;
  const Icon = STATUS_ICONS[key] || Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
      <Icon size={11} className={key === 'IN_PROGRESS' ? 'animate-spin' : ''} />
      {key.replace('_', ' ')}
    </span>
  );
};

// ── Section Header ────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between z-10">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700">
            <XCircle size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
};

// ── Form Field ────────────────────────────────────────────────────
export const FormField = ({ label, required, error, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
      {label}{required && <span className="text-orange-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
  </div>
);

// ── Input ─────────────────────────────────────────────────────────
export const Input = ({ className = '', ...props }) => (
  <input
    className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors
      disabled:bg-gray-50 disabled:text-gray-400 ${className}`}
    {...props}
  />
);

// ── Select ────────────────────────────────────────────────────────
export const Select = ({ className = '', children, ...props }) => (
  <select
    className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900
      focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors
      disabled:bg-gray-50 disabled:text-gray-400 bg-white ${className}`}
    {...props}
  >
    {children}
  </select>
);

// ── Textarea ──────────────────────────────────────────────────────
export const Textarea = ({ className = '', ...props }) => (
  <textarea
    rows={3}
    className={`w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors resize-none ${className}`}
    {...props}
  />
);

// ── Primary Button ────────────────────────────────────────────────
export const PrimaryBtn = ({ loading, children, className = '', ...props }) => (
  <button
    disabled={loading || props.disabled}
    className={`inline-flex items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-500 to-orange-600
      px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-orange-200
      hover:from-orange-600 hover:to-orange-700 transition-all duration-200
      disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {loading ? <Spinner size={16} className="text-white" /> : null}
    {children}
  </button>
);

// ── Secondary Button ──────────────────────────────────────────────
export const SecondaryBtn = ({ children, className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white
      px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm
      hover:bg-gray-50 hover:border-gray-300 transition-all duration-200
      disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
    {...props}
  >
    {children}
  </button>
);

// ── Danger Button ─────────────────────────────────────────────────
export const DangerBtn = ({ children, className = '', ...props }) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50
      px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 transition-all duration-200 ${className}`}
    {...props}
  >
    {children}
  </button>
);

// ── Empty State ───────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, subtitle, action }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
    {Icon && (
      <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center mb-2">
        <Icon size={32} className="text-orange-300" />
      </div>
    )}
    <p className="text-gray-700 font-semibold text-lg">{title}</p>
    {subtitle && <p className="text-gray-400 text-sm max-w-xs">{subtitle}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ── Table ─────────────────────────────────────────────────────────
export const Table = ({ headers, children, className = '' }) => (
  <div className={`overflow-x-auto rounded-xl border border-gray-100 ${className}`}>
    <table className="w-full text-sm">
      <thead>
        <tr className="bg-linear-to-r from-orange-50 to-amber-50 border-b border-orange-100">
          {headers.map((h, i) => (
            <th key={i} className="px-4 py-3 text-left text-xs font-bold text-orange-700 uppercase tracking-wide whitespace-nowrap">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">{children}</tbody>
    </table>
  </div>
);

export const Tr = ({ children, className = '' }) => (
  <tr className={`hover:bg-orange-50/30 transition-colors ${className}`}>{children}</tr>
);

export const Td = ({ children, className = '' }) => (
  <td className={`px-4 py-3 text-gray-700 ${className}`}>{children}</td>
);

// ── Vehicle Type Icon ─────────────────────────────────────────────
export const VehicleTypeBadge = ({ type }) => {
  const map = {
    CAR:   { label: 'Car',   bg: 'bg-blue-50 text-blue-700 border-blue-200',   emoji: '🚗' },
    BIKE:  { label: 'Bike',  bg: 'bg-green-50 text-green-700 border-green-200', emoji: '🏍️' },
    TRUCK: { label: 'Truck', bg: 'bg-purple-50 text-purple-700 border-purple-200', emoji: '🚛' },
  };
  const info = map[(type || '').toUpperCase()] || { label: type, bg: 'bg-gray-100 text-gray-600 border-gray-200', emoji: '🚘' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${info.bg}`}>
      <span>{info.emoji}</span>{info.label}
    </span>
  );
};

// ── Toast ─────────────────────────────────────────────────────────
export const Toast = ({ message, type = 'success', onClose }) => {
  const styles = {
    success: 'bg-emerald-500',
    error:   'bg-red-500',
    info:    'bg-blue-500',
  };
  return (
    <div className={`fixed bottom-6 right-6 z-100 flex items-center gap-3 px-5 py-3 rounded-2xl text-white text-sm font-semibold shadow-xl
      ${styles[type]} animate-in slide-in-from-bottom-4 duration-300`}>
      {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {message}
      <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
        <XCircle size={16} />
      </button>
    </div>
  );
};
