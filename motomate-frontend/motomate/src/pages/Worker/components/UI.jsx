import { Star, AlertCircle, Loader2 } from 'lucide-react';

// ── Status Badge ──────────────────────────────────────────────────────────────
export const StatusBadge = ({ status }) => {
  const map = {
    AVAILABLE:    { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500',   label: 'Available' },
    BUSY:         { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400',   label: 'Busy' },
    ON_LEAVE:     { bg: 'bg-gray-100',   text: 'text-gray-600',    dot: 'bg-gray-400',    label: 'On Leave' },
    OFF_DUTY:     { bg: 'bg-gray-100',   text: 'text-gray-600',    dot: 'bg-gray-400',    label: 'Off Duty' },
    PENDING:      { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-500',    label: 'Pending' },
    ASSIGNED:     { bg: 'bg-purple-50',  text: 'text-purple-700',  dot: 'bg-purple-500',  label: 'Assigned' },
    IN_PROGRESS:  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-500',   label: 'In Progress' },
    WAITING_PARTS:{ bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400',  label: 'Waiting Parts' },
    COMPLETED:    { bg: 'bg-green-50',   text: 'text-green-700',   dot: 'bg-green-500',   label: 'Completed' },
    CANCELLED:    { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400',     label: 'Cancelled' },
    REJECTED:     { bg: 'bg-red-50',     text: 'text-red-700',     dot: 'bg-red-400',     label: 'Rejected' },
  };
  const c = map[status] || map.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};

// ── Stat Card ─────────────────────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, color = 'green', sub }) => {
  const colors = {
    green:  { bg: 'bg-green-50',  icon: 'text-green-600',  border: 'border-green-100',  val: 'text-green-700' },
    blue:   { bg: 'bg-blue-50',   icon: 'text-blue-600',   border: 'border-blue-100',   val: 'text-blue-700' },
    amber:  { bg: 'bg-amber-50',  icon: 'text-amber-600',  border: 'border-amber-100',  val: 'text-amber-700' },
    purple: { bg: 'bg-purple-50', icon: 'text-purple-600', border: 'border-purple-100', val: 'text-purple-700' },
  };
  const c = colors[color] || colors.green;
  return (
    <div className={`bg-white rounded-2xl border ${c.border} p-5 flex items-start gap-4 hover:shadow-md transition-shadow`}>
      <div className={`w-11 h-11 rounded-xl ${c.bg} flex items-center justify-center shrink-0`}>
        <Icon size={20} className={c.icon} />
      </div>
      <div className="min-w-0">
        <p className="text-gray-500 text-xs font-medium">{label}</p>
        <p className={`text-2xl font-bold ${c.val} leading-tight mt-0.5`}>{value ?? '—'}</p>
        {sub && <p className="text-gray-400 text-[11px] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// ── Card wrapper ──────────────────────────────────────────────────────────────
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm ${className}`}>{children}</div>
);

// ── Page Loader ───────────────────────────────────────────────────────────────
export const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex flex-col items-center gap-3">
      <Loader2 size={32} className="text-green-500 animate-spin" />
      <p className="text-gray-400 text-sm">Loading…</p>
    </div>
  </div>
);

// ── Error Block ───────────────────────────────────────────────────────────────
export const ErrorBlock = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
      <AlertCircle size={26} className="text-red-500" />
    </div>
    <div className="text-center">
      <p className="text-gray-700 font-semibold">Something went wrong</p>
      <p className="text-gray-400 text-sm mt-1">{message}</p>
    </div>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-5 py-2 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
      >
        Try Again
      </button>
    )}
  </div>
);

// ── Star Rating ───────────────────────────────────────────────────────────────
export const RatingStars = ({ rating = 0, size = 14, showNumber = true }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        size={size}
        className={i <= Math.round(rating) ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
      />
    ))}
    {showNumber && <span className="text-gray-600 text-xs font-semibold ml-0.5">{Number(rating).toFixed(1)}</span>}
  </div>
);

// ── Empty State ───────────────────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
    <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
      <Icon size={28} className="text-gray-300" />
    </div>
    <p className="text-gray-600 font-semibold">{title}</p>
    {description && <p className="text-gray-400 text-sm mt-1 max-w-xs">{description}</p>}
  </div>
);

// ── Section Header ────────────────────────────────────────────────────────────
export const SectionHeader = ({ title, description, action }) => (
  <div className="flex items-start justify-between gap-4 mb-5">
    <div>
      <h2 className="text-gray-800 font-bold text-base">{title}</h2>
      {description && <p className="text-gray-400 text-sm mt-0.5">{description}</p>}
    </div>
    {action}
  </div>
);
