import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { History, Search, Calendar, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Car, User, Wrench, Clock } from 'lucide-react';
import WorkerHeader from '../components/WorkerHeader';
import { PageLoader, ErrorBlock, EmptyState, StatusBadge, RatingStars, Card } from '../components/UI';
import { fetchJobHistory } from '../api/workerApi';

const PAGE_SIZE = 8;

const JobHistoryPage = () => {
  const { worker, onMenuClick } = useOutletContext() || {};
  const [jobs, setJobs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    if (!worker?.id) return;
    setLoading(true); setError(null);
    try {
      const params = { page, size: PAGE_SIZE };
      if (search) params.vehicleNumber = search;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;
      const data = await fetchJobHistory(worker.id, params);
      if (Array.isArray(data)) {
        setJobs(data);
        setTotal(data.length);
      } else {
        setJobs(data.content || data.jobs || []);
        setTotal(data.totalElements || data.total || 0);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [worker?.id, page, search, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
    load();
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="flex-1 overflow-y-auto">
      <WorkerHeader
        onMenuClick={onMenuClick}
        title="Job History"
        subtitle={`${total} completed jobs`}
        onRefresh={load}
        loading={loading}
      />
      <div className="p-4 sm:p-6 max-w-4xl space-y-5">
        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by vehicle number…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 placeholder-gray-300 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-gray-400 shrink-0" />
              <input
                type="date"
                value={fromDate}
                onChange={e => setFromDate(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
              <span className="text-gray-400 text-sm">–</span>
              <input
                type="date"
                value={toDate}
                onChange={e => setToDate(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-700 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Table */}
        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : jobs.length === 0 ? (
          <Card>
            <EmptyState
              icon={History}
              title="No Job History"
              description="Completed jobs will appear here."
            />
          </Card>
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Header row */}
              <div className="hidden sm:grid grid-cols-5 gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <div className="col-span-2">Customer / Vehicle</div>
                <div>Services</div>
                <div>Date</div>
                <div>Rating</div>
              </div>

              {/* Rows */}
              <div className="divide-y divide-gray-50">
                {jobs.map(job => (
                  <div key={job.id}>
                    <button
                      className="w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors"
                      onClick={() => setExpanded(expanded === job.id ? null : job.id)}
                    >
                      <div className="sm:grid sm:grid-cols-5 sm:gap-4 sm:items-center space-y-2 sm:space-y-0">
                        <div className="sm:col-span-2 flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                            <User size={15} className="text-green-600" />
                          </div>
                          <div>
                            <p className="text-gray-800 font-semibold text-sm">{job.customerName || '—'}</p>
                            <p className="text-gray-400 text-xs font-mono">{job.vehicleNumber || '—'}</p>
                          </div>
                        </div>
                        <div className="text-gray-600 text-xs">
                          {job.serviceNames?.slice(0, 2).join(', ') || '—'}
                          {job.serviceNames?.length > 2 && <span className="text-gray-400"> +{job.serviceNames.length - 2}</span>}
                        </div>
                        <div className="text-gray-500 text-xs">
                          {job.scheduledDate || (job.updatedAt ? new Date(job.updatedAt).toLocaleDateString('en-IN') : '—')}
                        </div>
                        <div className="flex items-center justify-between">
                          {job.rating != null
                            ? <RatingStars rating={job.rating} size={12} />
                            : <span className="text-gray-300 text-xs">No rating</span>
                          }
                          {expanded === job.id
                            ? <ChevronUp size={14} className="text-gray-400" />
                            : <ChevronDown size={14} className="text-gray-400" />
                          }
                        </div>
                      </div>
                    </button>

                    {/* Expanded details */}
                    {expanded === job.id && (
                      <div className="px-5 pb-5 bg-gray-50 border-t border-gray-100 space-y-3">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                          <Detail icon={Car}   label="Brand/Model" value={`${job.brand || ''} ${job.vehicleModel || ''}`.trim() || '—'} />
                          <Detail icon={Wrench} label="Duration"   value={job.totalDurationMinutes ? `${job.totalDurationMinutes} min` : '—'} />
                          <Detail icon={Clock}  label="Completed"  value={job.updatedAt ? new Date(job.updatedAt).toLocaleString('en-IN') : '—'} />
                          <div className="flex items-start gap-2">
                            <StatusBadge status={job.status || 'COMPLETED'} />
                          </div>
                        </div>
                        {job.feedback && (
                          <div className="p-3 bg-white rounded-xl border border-gray-100">
                            <p className="text-xs font-semibold text-gray-500 mb-1">Customer Feedback</p>
                            <p className="text-gray-700 text-sm italic">"{job.feedback}"</p>
                          </div>
                        )}
                        {job.totalPrice && (
                          <p className="text-xs text-gray-500">Job Value: <span className="font-bold text-gray-700">₹{job.totalPrice.toLocaleString()}</span></p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-gray-400 text-sm">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setPage(i)}
                      className={`w-9 h-9 rounded-xl text-sm font-semibold transition-all ${page === i ? 'bg-green-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                    className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-green-50 hover:border-green-200 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const Detail = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={12} className="text-gray-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">{label}</p>
      <p className="text-gray-700 text-xs font-semibold">{value}</p>
    </div>
  </div>
);

export default JobHistoryPage;
