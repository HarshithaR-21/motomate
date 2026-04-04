import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import {
  ClipboardList, Car, User, Calendar, Clock,
  CheckCheck, UserCheck, ChevronDown, ChevronUp
} from 'lucide-react';
import { fetchSCORequests, fetchSCOWorkers, acceptRequest, assignWorker, completeRequest } from '../api';
import {
  PageLoader, ErrorBlock, EmptyState, SectionHeader,
  Modal, Select, PrimaryBtn, GhostBtn, StatusBadge, UrgencyBadge, Card
} from '../components/UI';
import Header from '../components/Header';

const STATUS_FILTERS = [
  { value: '',            label: 'All Requests' },
  { value: 'PENDING',     label: 'Pending' },
  { value: 'ACCEPTED',    label: 'Accepted' },
  { value: 'ASSIGNED',    label: 'Assigned' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'COMPLETED',   label: 'Completed' },
  { value: 'CANCELLED',   label: 'Cancelled' },
];

const RequestCard = ({ req, workers, onAccept, onAssign, onComplete, expanded, onToggle }) => {
  const [assignModal, setAssignModal] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const availableWorkers = workers.filter(w => w.availability === 'AVAILABLE');

  const doAccept = async () => {
    setActionLoading(true);
    try { await onAccept(req.id); } finally { setActionLoading(false); }
  };

  const doAssign = async () => {
    if (!selectedWorker) return;
    setActionLoading(true);
    try {
      await onAssign(req.id, selectedWorker);
      setAssignModal(false);
    } finally { setActionLoading(false); }
  };

  const doComplete = async () => {
    setActionLoading(true);
    try { await onComplete(req.id); } finally { setActionLoading(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header row */}
      <div
        className="flex items-start justify-between gap-4 p-5 cursor-pointer hover:bg-purple-50/30 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
            {(req.customerName || 'C').charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-bold text-gray-900 text-sm">{req.customerName || 'Customer'}</p>
              <UrgencyBadge urgency={req.urgency} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {(req.serviceNames || []).join(', ')}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">
              <Calendar size={10} className="inline mr-1" />
              {fmtDate(req.scheduledDate)}
              {req.scheduledTime && ` · ${req.scheduledTime}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <StatusBadge status={req.status} />
          {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-purple-100 px-5 pb-5 pt-4 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Customer info */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Customer</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <User size={13} className="text-purple-400" /> {req.customerName}
              </div>
              {req.customerPhone && <p className="text-xs text-gray-500 pl-5">{req.customerPhone}</p>}
              {req.customerEmail && <p className="text-xs text-gray-500 pl-5">{req.customerEmail}</p>}
            </div>

            {/* Vehicle info */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Vehicle</p>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Car size={13} className="text-purple-400" />
                {[req.brand, req.vehicleModel].filter(Boolean).join(' ')} · {req.vehicleType}
              </div>
              {req.vehicleNumber && <p className="text-xs text-gray-500 pl-5">#{req.vehicleNumber} · {req.fuelType}</p>}
            </div>

            {/* Services */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {(req.serviceNames || []).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">{s}</span>
                ))}
              </div>
              {req.totalPrice && (
                <p className="text-xs text-gray-600 font-semibold">Total: ₹{req.totalPrice?.toLocaleString()}</p>
              )}
            </div>

            {/* Assignment */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Assignment</p>
              {req.assignedWorkerName
                ? <p className="text-sm text-gray-700"><UserCheck size={13} className="inline mr-1 text-purple-400" />{req.assignedWorkerName}</p>
                : <p className="text-xs text-gray-400 italic">Not assigned yet</p>
              }
              {req.serviceMode && <p className="text-xs text-gray-500">Mode: {req.serviceMode}</p>}
              {req.address      && <p className="text-xs text-gray-500 truncate">{req.address}</p>}
            </div>
          </div>

          {req.additionalNotes && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-xs font-bold text-amber-600 mb-1">Customer Notes</p>
              <p className="text-xs text-amber-800">{req.additionalNotes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-purple-50">
            {req.status === 'PENDING' && (
              <PrimaryBtn onClick={doAccept} loading={actionLoading} className="text-xs px-4 py-2">
                <CheckCheck size={14} /> Accept Request
              </PrimaryBtn>
            )}
            {(req.status === 'ACCEPTED') && (
              <PrimaryBtn onClick={() => setAssignModal(true)} className="text-xs px-4 py-2 bg-indigo-600 hover:bg-indigo-700">
                <UserCheck size={14} /> Assign Worker
              </PrimaryBtn>
            )}
            {req.status === 'ASSIGNED' && (
              <>
                <PrimaryBtn onClick={() => setAssignModal(true)} className="text-xs px-4 py-2 bg-violet-600 hover:bg-violet-700">
                  <UserCheck size={14} /> Reassign
                </PrimaryBtn>
                <PrimaryBtn onClick={doComplete} loading={actionLoading} className="text-xs px-4 py-2 bg-green-600 hover:bg-green-700">
                  <CheckCheck size={14} /> Mark Complete
                </PrimaryBtn>
              </>
            )}
            {req.status === 'IN_PROGRESS' && (
              <PrimaryBtn onClick={doComplete} loading={actionLoading} className="text-xs px-4 py-2 bg-green-600 hover:bg-green-700">
                <CheckCheck size={14} /> Mark Complete
              </PrimaryBtn>
            )}
          </div>
        </div>
      )}

      {/* Assign Worker Modal */}
      <Modal open={assignModal} onClose={() => setAssignModal(false)} title="Assign Worker" maxWidth="max-w-sm">
        <div className="space-y-4">
          {availableWorkers.length === 0 ? (
            <p className="text-sm text-gray-500 bg-orange-50 border border-orange-200 px-4 py-3 rounded-xl">
              No available workers right now. Toggle a worker's availability first.
            </p>
          ) : (
            <Select
              label="Select Worker"
              options={[
                { value: '', label: 'Choose a worker…' },
                ...availableWorkers.map(w => ({ value: w.id, label: `${w.name} · ${w.role?.replace(/_/g,' ')}` }))
              ]}
              value={selectedWorker}
              onChange={e => setSelectedWorker(e.target.value)}
            />
          )}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <GhostBtn onClick={() => setAssignModal(false)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={doAssign} loading={actionLoading} disabled={!selectedWorker}>
              Assign
            </PrimaryBtn>
          </div>
        </div>
      </Modal>
    </Card>
  );
};

const SCORequests = () => {
  const outletContext = useOutletContext() || {};
  const { ownerId: contextOwnerId } = outletContext;
  const [ownerId, setOwnerId] = useState(contextOwnerId);
  const [requests, setRequests] = useState([]);
  const [workers, setWorkers]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId]     = useState(null);

  useEffect(() => {
    if (contextOwnerId) {
      setOwnerId(contextOwnerId);
      return;
    }

    const fetchMe = async () => {
      try {
        const resp = await axios.get('http://localhost:8080/api/auth/me', { withCredentials: true });
        const id = resp.data?.id || resp.data?.userId;
        if (resp.status === 200 && id) {
          setOwnerId(id);
        } else {
          console.error('SCO requests fetchMe: invalid response', resp);
          setError('Unable to determine logged in user. Please login again.');
        }
      } catch (err) {
        console.error('SCO requests fetchMe error:', err);
        setError('Unable to determine logged in user. Please login again.');
      }
    };

    fetchMe();
  }, [contextOwnerId]);

  const load = async (status = statusFilter) => {
    if (!ownerId) return;
    setLoading(true); setError(null);
    try {
      const [reqs, wrks] = await Promise.all([
        fetchSCORequests(ownerId, status),
        fetchSCOWorkers(ownerId),
      ]);
      setRequests(reqs);
      setWorkers(wrks);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [ownerId]);

  const handleStatusFilter = (s) => {
    setStatusFilter(s);
    load(s);
  };

  const handleAccept = async (reqId) => {
    const updated = await acceptRequest(ownerId, reqId);
    setRequests(r => r.map(x => x.id === reqId ? updated : x));
  };

  const handleAssign = async (reqId, workerId) => {
    const updated = await assignWorker(ownerId, reqId, workerId);
    setRequests(r => r.map(x => x.id === reqId ? updated : x));
    // Refresh workers to update availability
    fetchSCOWorkers(ownerId).then(setWorkers).catch(() => {});
  };

  const handleComplete = async (reqId) => {
    const updated = await completeRequest(ownerId, reqId);
    setRequests(r => r.map(x => x.id === reqId ? updated : x));
    fetchSCOWorkers(ownerId).then(setWorkers).catch(() => {});
  };

  const counts = {
    pending:  requests.filter(r => r.status === 'PENDING').length,
    active:   requests.filter(r => ['ACCEPTED','ASSIGNED','IN_PROGRESS'].includes(r.status)).length,
    completed:requests.filter(r => r.status === 'COMPLETED').length,
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-100 via-white to-purple-200">
      <Header />
    <div className="space-y-6">
      
      <SectionHeader title="Service Requests" subtitle="Manage all incoming and active service requests" />

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 pt-4">
        {[
          { label: 'Pending',   val: counts.pending,   cls: 'bg-amber-100 text-amber-700'   },
          { label: 'Active',    val: counts.active,    cls: 'bg-blue-100 text-blue-700'     },
          { label: 'Completed', val: counts.completed, cls: 'bg-green-100 text-green-700'   },
        ].map(c => (
          <span key={c.label} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${c.cls}`}>
            {c.label}: {c.val}
          </span>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map(f => (
          <button
            key={f.value}
            onClick={() => handleStatusFilter(f.value)}
            className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              statusFilter === f.value
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-600'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <PageLoader />}
      {error   && <ErrorBlock message={error} onRetry={() => load()} />}

      {!loading && !error && requests.length === 0 && (
        <EmptyState icon={ClipboardList} title="No requests found" subtitle="Service requests will appear here when customers book" />
      )}

      {!loading && !error && requests.length > 0 && (
        <div className="space-y-6 px-4 py-6 max-w-7xl mx-auto">
          {requests.map(req => (
            <RequestCard
              key={req.id}
              req={req}
              workers={workers}
              onAccept={handleAccept}
              onAssign={handleAssign}
              onComplete={handleComplete}
              expanded={expandedId === req.id}
              onToggle={() => setExpandedId(id => id === req.id ? null : req.id)}
            />
          ))}
        </div>
      )}
    </div>
    </div>
  );
};

export default SCORequests;
