import { AlertTriangle, CheckCircle, Clock, XCircle, Loader2 } from 'lucide-react';

// ── Loading Spinner ─────────────────────────────────────────────
export const Spinner = ({ size = 20, className = '' }) => (
  <Loader2 size={size} className={`animate-spin text-red-500 ${className}`} />
);

// ── Full-page loading ───────────────────────────────────────────
export const PageLoader = () => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <Spinner size={32} />
    <p className="text-sm text-gray-400 font-medium">Loading data…</p>
  </div>
);

// ── Error block ─────────────────────────────────────────────────
export const ErrorBlock = ({ message, onRetry }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-3">
    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
      <AlertTriangle size={22} className="text-red-500" />
    </div>
    <p className="text-sm text-gray-600 font-medium">{message || 'Something went wrong.'}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-xs text-red-600 font-semibold border border-red-200 px-4 py-1.5 rounded-full hover:bg-red-50 transition-colors"
      >
        Retry
      </button>
    )}
  </div>
);

// ── Empty State ─────────────────────────────────────────────────
export const EmptyState = ({ icon: Icon, title, subtitle }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-2 text-center px-4">
    {Icon && <Icon size={36} className="text-gray-300 mb-2" />}
    <p className="text-gray-600 font-semibold">{title}</p>
    {subtitle && <p className="text-gray-400 text-sm">{subtitle}</p>}
  </div>
);

// ── Status Badge ────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  approved:   'bg-green-50 text-green-700 border-green-200',
  rejected:   'bg-red-50 text-red-600 border-red-200',
  open:       'bg-blue-50 text-blue-700 border-blue-200',
  resolved:   'bg-green-50 text-green-700 border-green-200',
  closed:     'bg-gray-100 text-gray-600 border-gray-200',
  ongoing:    'bg-indigo-50 text-indigo-700 border-indigo-200',
  completed:  'bg-green-50 text-green-700 border-green-200',
  cancelled:  'bg-red-50 text-red-600 border-red-200',
  active:     'bg-green-50 text-green-700 border-green-200',
  inactive:   'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_ICONS = {
  pending:   Clock,
  approved:  CheckCircle,
  rejected:  XCircle,
  open:      Clock,
  resolved:  CheckCircle,
  closed:    XCircle,
  ongoing:   Clock,
  completed: CheckCircle,
  cancelled: XCircle,
  active:    CheckCircle,
  inactive:  XCircle,
};

export const StatusBadge = ({ status }) => {
  const key = status?.toLowerCase() || 'pending';
  const style = STATUS_STYLES[key] || STATUS_STYLES.pending;
  const Icon = STATUS_ICONS[key] || Clock;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>
      <Icon size={11} />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

// ── Stat Card ───────────────────────────────────────────────────
export const StatCard = ({ icon: Icon, label, value, sub, accent = 'red', loading }) => {
  const accents = {
    red:    'bg-red-400 text-white',
    green:  'bg-green-500 text-white',
    blue:   'bg-blue-500 text-white',
    amber:  'bg-amber-500 text-white',
    indigo: 'bg-indigo-500 text-white',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${accents[accent] || accents.red}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        {loading ? (
          <div className="h-7 w-20 bg-gray-100 rounded animate-pulse mt-1" />
        ) : (
          <p className="text-2xl font-bold text-gray-900 leading-tight">{value ?? '—'}</p>
        )}
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
};

// ── Section Header ──────────────────────────────────────────────
export const SectionHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
  </div>
);

// ── Table ───────────────────────────────────────────────────────
export const Table = ({ columns, data, onRowClick, loading, emptyIcon, emptyTitle, emptySubtitle }) => {
  if (loading) return <PageLoader />;
  if (!data || data.length === 0)
    return <EmptyState icon={emptyIcon} title={emptyTitle || 'No records found'} subtitle={emptySubtitle} />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-100">
            {columns.map(col => (
              <th key={col.key} className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr
              key={row._id || row.id || i}
              onClick={() => onRowClick && onRowClick(row)}
              className={`border-b border-gray-50 hover:bg-red-50/40 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map(col => (
                <td key={col.key} className="py-3.5 px-4 text-gray-700 whitespace-nowrap">
                  {col.render ? col.render(row[col.key], row) : (row[col.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── Pagination ──────────────────────────────────────────────────
export const Pagination = ({ page, totalPages, onPageChange }) => {
  if (!totalPages || totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-4">
      <p className="text-xs text-gray-400">Page {page} of {totalPages}</p>
      <div className="flex gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Prev
        </button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-colors ${p === page ? 'bg-red-600 text-white' : 'border border-gray-200 hover:bg-gray-50 text-gray-600'}`}
            >
              {p}
            </button>
          );
        })}
        <button
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

// ── Modal ───────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, maxWidth = 'max-w-2xl' }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-white rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="overflow-y-auto p-6 flex-1">{children}</div>
      </div>
    </div>
  );
};

// ── Filter Bar ──────────────────────────────────────────────────
export const FilterBar = ({ filters, values, onChange }) => (
  <div className="flex flex-wrap gap-2 mb-5">
    {filters.map(f => (
      <div key={f.key} className="flex items-center gap-1.5">
        {f.type === 'select' ? (
          <select
            value={values[f.key] || ''}
            onChange={e => onChange(f.key, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300"
          >
            {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : (
          <input
            placeholder={f.placeholder}
            value={values[f.key] || ''}
            onChange={e => onChange(f.key, e.target.value)}
            className="text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-red-300 w-44"
          />
        )}
      </div>
    ))}
  </div>
);

// ── Card Container ──────────────────────────────────────────────
export const Card = ({ children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
    {children}
  </div>
);

// ── Detail Row ──────────────────────────────────────────────────
export const DetailRow = ({ label, value }) => (
  <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-4 py-2.5 border-b border-gray-50 last:border-0">
    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide sm:w-40 shrink-0">{label}</span>
    <span className="text-sm text-gray-800">{value ?? '—'}</span>
  </div>
);
