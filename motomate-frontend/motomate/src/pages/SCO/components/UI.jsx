import { AlertTriangle, CheckCircle, Clock, XCircle, Loader2, Star } from 'lucide-react';

// ── Spinner ─────────────────────────────────────────────────────
export const Spinner = ({ size = 20, className = '' }) => (
  <Loader2 size={size} className={`animate-spin text-purple-500 ${className}`} />
);

// ── Page Loader ──────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <Spinner size={32} />
    <p className="text-sm text-gray-400 font-medium">Loading…</p>
  </div>
);

// ── Error Block ──────────────────────────────────────────────────
export const ErrorBlock = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center">
      <AlertTriangle size={22} className="text-purple-500" />
    </div>
    <p className="text-sm text-gray-600 font-medium">{message || 'Something went wrong.'}</p>
    {onRetry && (
      <button onClick={onRetry} className="text-xs text-purple-600 font-semibold border border-purple-200 px-4 py-1.5 rounded-full hover:bg-purple-50 transition-colors">
        Retry
      </button>
    )}
  </div>
);

// ── Empty State ──────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center h-48 gap-2 text-center px-4">
    {Icon && <Icon size={36} className="text-purple-200 mb-2" />}
    <p className="text-gray-600 font-semibold">{title}</p>
    {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
  </div>
);

// ── Status Badge ─────────────────────────────────────────────────
const STATUS_MAP = {
  pending:     { cls: 'bg-amber-50 text-amber-700 border-amber-200',   Icon: Clock },
  accepted:    { cls: 'bg-blue-50 text-blue-700 border-blue-200',      Icon: CheckCircle },
  assigned:    { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200',Icon: CheckCircle },
  in_progress: { cls: 'bg-purple-50 text-purple-700 border-purple-200',Icon: Clock },
  completed:   { cls: 'bg-green-50 text-green-700 border-green-200',   Icon: CheckCircle },
  cancelled:   { cls: 'bg-red-50 text-red-600 border-red-200',         Icon: XCircle },
  approved:    { cls: 'bg-green-50 text-green-700 border-green-200',   Icon: CheckCircle },
  rejected:    { cls: 'bg-red-50 text-red-600 border-red-200',         Icon: XCircle },
  available:   { cls: 'bg-green-50 text-green-700 border-green-200',   Icon: CheckCircle },
  busy:        { cls: 'bg-orange-50 text-orange-700 border-orange-200',Icon: Clock },
  off_duty:    { cls: 'bg-gray-100 text-gray-500 border-gray-200',     Icon: XCircle },
};

export const StatusBadge = ({ status }) => {
  const key = (status || '').toLowerCase().replace(/ /g, '_');
  const { cls, Icon } = STATUS_MAP[key] || STATUS_MAP.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cls}`}>
      <Icon size={11} />
      {status?.charAt(0).toUpperCase() + status?.slice(1).toLowerCase().replace(/_/g,' ')}
    </span>
  );
};

// ── Stat Card ────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, sub, color = 'purple' }) => {
  const colors = {
    purple: 'bg-purple-600 text-white',
    violet: 'bg-violet-500 text-white',
    indigo: 'bg-indigo-500 text-white',
    green:  'bg-emerald-500 text-white',
    amber:  'bg-amber-500 text-white',
    pink:   'bg-pink-500 text-white',
  };
  return (
    <div className="bg-white rounded-2xl border border-purple-100/60 shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${colors[color] || colors.purple}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{value ?? '—'}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// ── Card ─────────────────────────────────────────────────────────
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-purple-100/60 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

// ── Section Header ────────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

// ── Modal ─────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-lg' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-purple-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">×</button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
};

// ── Input ─────────────────────────────────────────────────────────
export const Input = ({ label, error, className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>}
    <input
      {...props}
      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 transition-all
        ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-purple-200 focus:border-purple-400'}`}
    />
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ── Select ────────────────────────────────────────────────────────
export const Select = ({ label, error, options = [], className = '', ...props }) => (
  <div className={`flex flex-col gap-1.5 ${className}`}>
    {label && <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>}
    <select
      {...props}
      className={`w-full border rounded-xl px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:ring-2 transition-all bg-white
        ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-purple-200 focus:border-purple-400'}`}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

// ── Primary Button ────────────────────────────────────────────────
export const PrimaryBtn = ({ children, loading, className = '', ...props }) => (
  <button
    {...props}
    disabled={loading || props.disabled}
    className={`inline-flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed ${className}`}
  >
    {loading && <Spinner size={15} className="text-white" />}
    {children}
  </button>
);

// ── Ghost Button ─────────────────────────────────────────────────
export const GhostBtn = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all ${className}`}
  >
    {children}
  </button>
);

// ── Danger Button ─────────────────────────────────────────────────
export const DangerBtn = ({ children, className = '', ...props }) => (
  <button
    {...props}
    className={`inline-flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all ${className}`}
  >
    {children}
  </button>
);

// ── Rating Stars ─────────────────────────────────────────────────
export const RatingStars = ({ rating = 0 }) => (
  <div className="flex items-center gap-0.5">
    {[1,2,3,4,5].map(i => (
      <Star key={i} size={13} className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
    ))}
    <span className="text-xs text-gray-500 ml-1">{rating.toFixed(1)}</span>
  </div>
);

// ── Urgency Badge ─────────────────────────────────────────────────
export const UrgencyBadge = ({ urgency }) => {
  const map = {
    EMERGENCY: 'bg-red-100 text-red-700 border-red-200',
    URGENT:    'bg-orange-100 text-orange-700 border-orange-200',
    NORMAL:    'bg-gray-100 text-gray-600 border-gray-200',
  };
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${map[urgency] || map.NORMAL}`}>
      {urgency || 'NORMAL'}
    </span>
  );
};