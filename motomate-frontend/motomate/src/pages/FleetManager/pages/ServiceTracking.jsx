// src/pages/FleetManager/pages/ServiceTracking.jsx
import { useState, useEffect, useRef, useMemo } from 'react';
import {
  Activity, RefreshCw, ChevronDown, Search, X,
  Wrench, MapPin, User, CalendarDays, IndianRupee,
  Star, Bell, CheckCircle2, Info
} from 'lucide-react';
import FleetHeader from '../components/FleetHeader';
import {
  PageLoader, ErrorBlock, SectionHeader, Modal,
  EmptyState, StatusBadge, VehicleTypeBadge, Toast
} from '../components/FleetUI';
import { fetchServices, fetchVehicles, rateServiceCenter } from '../api/fleetApi';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const SERVICE_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const IN_PROGRESS_STATUSES = new Set([
  'IN_PROGRESS',
  'REACHED_CENTER',
  'DIAGNOSING',
  'PARTS_ORDERED',
  'WORK_STARTED',
  'TESTING',
]);

const STATUS_PIPELINE = [
  { key: 'PENDING',     label: 'Pending',     color: 'bg-amber-400'   },
  { key: 'ASSIGNED',    label: 'Assigned',    color: 'bg-blue-400'    },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-orange-400'  },
  { key: 'COMPLETED',   label: 'Completed',   color: 'bg-emerald-400' },
];

// ── Notification banner that appears when SSE pushes an update ───────────────
const NotificationBanner = ({ notif, onDismiss }) => {
  if (!notif) return null;
  const isAssignment = notif.event === 'worker_assigned_to_customer';
  return (
    <div className={`fixed top-6 right-6 z-50 max-w-sm w-full rounded-2xl shadow-xl border p-4 flex items-start gap-3
      ${isAssignment ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0
        ${isAssignment ? 'bg-blue-500' : 'bg-orange-500'}`}>
        {isAssignment ? <User size={16} className="text-white" /> : <Bell size={16} className="text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-bold ${isAssignment ? 'text-blue-800' : 'text-orange-800'}`}>
          {isAssignment ? 'Worker Assigned' : 'Status Updated'}
        </p>
        <p className={`text-xs mt-0.5 ${isAssignment ? 'text-blue-600' : 'text-orange-600'}`}>
          {notif.message}
        </p>
        {notif.vehicleNumber && (
          <p className="text-xs font-mono font-bold mt-1 text-gray-700">{notif.vehicleNumber}</p>
        )}
      </div>
      <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        <X size={14} />
      </button>
    </div>
  );
};

const ServiceTracking = () => {
  const [services, setServices]         = useState([]);
  const [vehicles, setVehicles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [search, setSearch]             = useState('');
  const [toast, setToast]               = useState(null);
  const [viewMode, setViewMode]         = useState('table');
  const [liveNotif, setLiveNotif]       = useState(null); // SSE notification banner
  const [detailModal, setDetailModal]   = useState(null); // read-only detail view
  const [ratingModal, setRatingModal]   = useState(null);
  const [ratingValue, setRatingValue]   = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [ratingSaving, setRatingSaving] = useState(false);

  const sseRef = useRef(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [svcs, vhcls] = await Promise.all([fetchServices(), fetchVehicles()]);
      setServices(svcs || []);
      setVehicles(vhcls || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  // ── SSE: subscribe to live fleet updates ─────────────────────────────────
  useEffect(() => {
    load();

    const managerId = localStorage.getItem('fleetManagerId');
    if (!managerId) return;

    const connect = () => {
        // Use the SSE subscribe endpoint that the backend exposes for all user event streams.
        const url = `${BASE_URL}/notifications/subscribe/${managerId}`;
        const es = new EventSource(url, { withCredentials: true });
        sseRef.current = es;

        // Worker assignment events are sent to the fleet manager via the customer/fleet booking stream.
        es.addEventListener('worker_assigned_to_customer', (e) => {
          try {
            const data = JSON.parse(e.data);
            setServices(prev => prev.map(s => {
              if (s.scoRequestId === data.requestId) {
                return { ...s, assignedWorker: data.workerName };
              }
              return s;
            }));
            setLiveNotif({ ...data, event: 'worker_assigned_to_customer', message: 'Worker assigned to this booking' });
            setTimeout(() => setLiveNotif(null), 6000);
          } catch (_) {}
        });

        // Any status change on a fleet booking (IN_PROGRESS, COMPLETED, etc.)
        es.addEventListener('job_status_updated', (e) => {
          try {
            const data = JSON.parse(e.data);
            setServices(prev => prev.map(s => {
              if (s.scoRequestId === data.requestId) {
                return {
                  ...s,
                  status: data.status,
                  assignedWorker: data.assignedWorkerName || data.assignedWorker || s.assignedWorker,
                };
              }
              return s;
            }));
            setLiveNotif({ ...data, event: 'job_status_updated', message: data.message || `Status updated to ${data.status}` });
        } catch (_) {}
      });

      es.onerror = () => {
        es.close();
        // Reconnect after 5 s
        setTimeout(connect, 5000);
      };
    };

    connect();
    return () => { sseRef.current?.close(); };
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Rating ────────────────────────────────────────────────────────────────
  const openRating = (s) => {
    setRatingModal(s);
    setRatingValue(s.serviceCenterRating || 0);
    setRatingFeedback(s.serviceCenterFeedback || '');
  };

  const handleSubmitRating = async () => {
    if (!ratingValue) { showToast('Please select a star rating', 'error'); return; }
    setRatingSaving(true);
    try {
      const managerId   = localStorage.getItem('fleetManagerId') || '';
      const managerName = localStorage.getItem('fleetManagerName') || 'Fleet Manager';
      const updated = await rateServiceCenter(ratingModal.id, {
        serviceCenterId:   ratingModal.serviceCenterId || '',
        serviceCenterName: ratingModal.serviceCenter || '',
        managerId,
        managerName,
        rating:   ratingValue,
        feedback: ratingFeedback || null,
      });
      setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
      showToast('Rating submitted! Thank you for your feedback.');
      setRatingModal(null);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setRatingSaving(false);
    }
  };

  // ── Filters ───────────────────────────────────────────────────────────────
  const filtered = useMemo(() => services.filter(s => {
    const matchStatus = statusFilter === 'ALL'
      || (statusFilter === 'IN_PROGRESS' && IN_PROGRESS_STATUSES.has(s.status))
      || s.status === statusFilter;
    const matchVehicle = vehicleFilter === 'ALL' || s.vehicleId === vehicleFilter;
    const matchSearch  = !search ||
      s.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.serviceCenter?.toLowerCase().includes(search.toLowerCase()) ||
      s.assignedWorker?.toLowerCase().includes(search.toLowerCase()) ||
      (s.selectedServiceNames || []).some(n => n.toLowerCase().includes(search.toLowerCase()));
    return matchStatus && matchVehicle && matchSearch;
  }), [services, statusFilter, vehicleFilter, search]);

  const counts = STATUS_PIPELINE.reduce((acc, { key }) => {
    acc[key] = services.filter(s => {
      if (key === 'IN_PROGRESS') {
        return IN_PROGRESS_STATUSES.has(s.status);
      }
      return s.status === key;
    }).length;
    return acc;
  }, {});

  const displayServices = (s) => {
    if (s.selectedServiceNames?.length > 0) {
      return s.selectedServiceNames.slice(0, 2).join(', ')
        + (s.selectedServiceNames.length > 2 ? ` +${s.selectedServiceNames.length - 2}` : '');
    }
    return (s.serviceType || '').replace(/_/g, ' ');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <FleetHeader />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      <NotificationBanner notif={liveNotif} onDismiss={() => setLiveNotif(null)} />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 space-y-6">

        <SectionHeader
          title="Service Tracking"
          subtitle="Live status of all scheduled services — updated automatically by the service center"
          action={
            <button onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 shadow-sm hover:bg-orange-50 transition-all">
              <RefreshCw size={15} /> Refresh
            </button>
          }
        />

        {/* Read-only notice */}
        <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-2xl text-sm text-blue-700">
          <Info size={16} className="shrink-0 mt-0.5" />
          <span>
            Status updates and worker assignments are managed by the service center.
            You'll receive a live notification here when a worker is assigned to each vehicle.
          </span>
        </div>

        {/* Pipeline summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATUS_PIPELINE.map(({ key, label, color }) => (
            <button key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'ALL' : key)}
              className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5
                ${statusFilter === key ? 'border-orange-300 ring-2 ring-orange-200' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{counts[key] ?? 0}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search vehicle, service, center, worker…"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="ALL">All Statuses</option>
                {SERVICE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="ALL">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1">
              {['table', 'card'].map(m => (
                <button key={m} onClick={() => setViewMode(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all
                    ${viewMode === m ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {m === 'table' ? 'Table' : 'Cards'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState icon={Activity} title="No services found" subtitle="Try adjusting your filters" />
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                    {['Vehicle', 'Type', 'Services', 'Service Center', 'Assigned Worker', 'Date', 'Cost', 'Status', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-orange-700 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-orange-50/20 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900 font-mono">{s.vehicleNumber}</td>
                      <td className="px-4 py-3"><VehicleTypeBadge type={s.vehicleType} /></td>
                      <td className="px-4 py-3 text-xs text-gray-700 max-w-[140px]">
                        <span className="truncate block">{displayServices(s)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin size={12} className="text-orange-400 shrink-0" />
                          <span className="text-xs">{s.serviceCenter || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <User size={12} className={s.assignedWorker ? 'text-blue-400' : 'text-gray-300'} />
                          <span className={`text-xs ${s.assignedWorker ? 'text-gray-700 font-medium' : 'text-gray-400 italic'}`}>
                            {s.assignedWorker || 'Awaiting assignment'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.scheduledDate || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {s.actualCost != null
                          ? `₹${s.actualCost}`
                          : s.finalCost != null
                          ? `₹${s.finalCost}`
                          : s.estimatedCost != null
                          ? `~₹${s.estimatedCost}`
                          : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setDetailModal(s)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all">
                            <Info size={12} /> Details
                          </button>
                          {s.status === 'COMPLETED' && !s.rated && (
                            <button onClick={() => openRating(s)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-yellow-200 bg-yellow-50 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 transition-all">
                              <Star size={12} /> Rate
                            </button>
                          )}
                          {s.rated && (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                              <Star size={10} fill="#10b981" stroke="none" /> {s.serviceCenterRating}/5
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(s => (
              <ServiceCard key={s.id} service={s}
                onDetails={() => setDetailModal(s)}
                onRate={() => openRating(s)} />
            ))}
          </div>
        )}
      </div>

      {/* Read-only Detail Modal */}
      <Modal open={!!detailModal} onClose={() => setDetailModal(null)} title="Service Details">
        {detailModal && (
          <div className="space-y-4">
            <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
              <p className="font-bold text-gray-800 font-mono text-lg">{detailModal.vehicleNumber}</p>
              <p className="text-sm text-gray-500 mt-0.5">{detailModal.serviceCenter}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Services</p>
                <div className="flex flex-wrap gap-1">
                  {(detailModal.selectedServiceNames?.length > 0
                    ? detailModal.selectedServiceNames
                    : [detailModal.serviceType?.replace(/_/g, ' ')]
                  ).filter(Boolean).map((n, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{n}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Status</p>
                <StatusBadge status={detailModal.status} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Assigned Worker</p>
                <p className="text-gray-700 font-medium">
                  {detailModal.assignedWorker || <span className="text-gray-400 italic">Awaiting assignment by service center</span>}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Scheduled</p>
                <p className="text-gray-700">{detailModal.scheduledDate || '—'} {detailModal.scheduledTime ? `at ${detailModal.scheduledTime}` : ''}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Estimated Cost</p>
                <p className="text-gray-700">
                  {detailModal.actualCost != null ? `₹${detailModal.actualCost} (actual)` :
                   detailModal.finalCost != null ? `₹${detailModal.finalCost}` :
                   detailModal.estimatedCost != null ? `~₹${detailModal.estimatedCost}` : '—'}
                </p>
              </div>
              {detailModal.discountPercent > 0 && (
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Bulk Discount</p>
                  <p className="text-green-600 font-semibold">{detailModal.discountPercent}% off · saved ₹{detailModal.discountAmount}</p>
                </div>
              )}
            </div>

            {detailModal.notes && (
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-bold text-gray-400 mb-1">Notes</p>
                <p className="text-sm text-gray-600">{detailModal.notes}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              {detailModal.status === 'COMPLETED' && !detailModal.rated && (
                <button onClick={() => { setDetailModal(null); openRating(detailModal); }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-yellow-200 bg-yellow-50 text-sm font-semibold text-yellow-700 hover:bg-yellow-100 transition-all">
                  <Star size={14} /> Rate Service Center
                </button>
              )}
              <button onClick={() => setDetailModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Rating Modal */}
      <Modal open={!!ratingModal} onClose={() => setRatingModal(null)} title="Rate Service Center">
        {ratingModal && (
          <>
            <div className="bg-yellow-50 rounded-xl p-4 mb-5 border border-yellow-100">
              <p className="font-bold text-gray-800">{ratingModal.serviceCenter}</p>
              <p className="text-sm text-gray-500 mt-0.5">{ratingModal.vehicleNumber} · {displayServices(ratingModal)}</p>
            </div>
            <p className="text-sm text-gray-600 mb-3">How was your experience with this service center?</p>
            <div className="flex items-center gap-2 justify-center mb-4">
              {[1, 2, 3, 4, 5].map(star => (
                <button key={star} type="button" onClick={() => setRatingValue(star)}
                  className="transition-transform hover:scale-110">
                  <Star size={36}
                    fill={star <= ratingValue ? '#F59E0B' : 'none'}
                    stroke={star <= ratingValue ? '#F59E0B' : '#D1D5DB'} />
                </button>
              ))}
            </div>
            {ratingValue > 0 && (
              <p className="text-center text-sm font-semibold text-yellow-600 mb-4">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][ratingValue]}
              </p>
            )}
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">
                Feedback (optional)
              </label>
              <textarea value={ratingFeedback} onChange={e => setRatingFeedback(e.target.value)}
                placeholder="Share your experience…"
                rows={3}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button onClick={() => setRatingModal(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600">Skip</button>
              <button onClick={handleSubmitRating} disabled={ratingSaving || !ratingValue}
                className={`inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white transition-all
                  ${!ratingValue || ratingSaving ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-500 hover:bg-orange-600'}`}>
                {ratingSaving ? 'Submitting…' : 'Submit Rating'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

// ── Card view ─────────────────────────────────────────────────────────────────
const ServiceCard = ({ service: s, onDetails, onRate }) => {
  const statusColors = {
    PENDING: 'border-l-amber-400', ASSIGNED: 'border-l-blue-400',
    IN_PROGRESS: 'border-l-orange-400', COMPLETED: 'border-l-emerald-400',
    CANCELLED: 'border-l-red-400',
  };
  const serviceDisplay = s.selectedServiceNames?.length > 0
    ? s.selectedServiceNames.slice(0, 2).join(', ') + (s.selectedServiceNames.length > 2 ? ` +${s.selectedServiceNames.length - 2}` : '')
    : (s.serviceType || '').replace(/_/g, ' ');

  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${statusColors[s.status] || 'border-l-gray-200'} shadow-sm p-5 hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-gray-900 font-mono text-lg">{s.vehicleNumber}</p>
          <p className="text-sm font-medium text-gray-500 mt-0.5 truncate">{serviceDisplay}</p>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <div className="space-y-2 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <MapPin size={12} className="text-orange-400" />
          <span>{s.serviceCenter || '—'}</span>
        </div>
        <div className="flex items-center gap-2">
          <User size={12} className={s.assignedWorker ? 'text-blue-400' : 'text-gray-300'} />
          <span className={s.assignedWorker ? 'text-gray-700 font-medium' : 'text-gray-400 italic'}>
            {s.assignedWorker || 'Awaiting assignment'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays size={12} className="text-gray-400" />
          <span>{s.scheduledDate || '—'} {s.scheduledTime ? `at ${s.scheduledTime}` : ''}</span>
        </div>
        <div className="flex items-center gap-2">
          <IndianRupee size={12} className="text-emerald-400" />
          <span>
            {s.actualCost != null ? `₹${s.actualCost} (actual)` :
             s.finalCost != null ? `₹${s.finalCost}` :
             s.estimatedCost != null ? `~₹${s.estimatedCost} (est.)` : '—'}
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onDetails}
          className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-all">
          <Info size={12} /> View Details
        </button>
        {s.status === 'COMPLETED' && !s.rated && (
          <button onClick={onRate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-yellow-200 bg-yellow-50 text-xs font-semibold text-yellow-700 hover:bg-yellow-100 transition-all">
            <Star size={12} /> Rate
          </button>
        )}
        {s.rated && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-2 rounded-xl border border-emerald-100">
            <Star size={10} fill="#10b981" stroke="none" /> {s.serviceCenterRating}/5
          </span>
        )}
      </div>
    </div>
  );
};

export default ServiceTracking;
