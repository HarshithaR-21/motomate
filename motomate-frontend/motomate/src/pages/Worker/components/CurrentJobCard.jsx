import { useState } from 'react';
import {
  Car, User, Wrench, MapPin, Clock, CheckCircle2,
  Loader2, XCircle, X, AlertTriangle, Navigation,
  Search, Package, Hammer, FlaskConical, Flag, ChevronRight,
} from 'lucide-react';
import { StatusBadge } from './UI';

const MILESTONES = [
  { status: 'IN_PROGRESS',    label: 'Job Accepted',           icon: CheckCircle2, color: 'blue',
    next: { status: 'REACHED_CENTER', label: 'Mark: Reached Center',    icon: Navigation   } },
  { status: 'REACHED_CENTER', label: 'Reached Service Center', icon: Navigation,   color: 'indigo',
    next: { status: 'DIAGNOSING',     label: 'Mark: Diagnosing Vehicle', icon: Search       } },
  { status: 'DIAGNOSING',     label: 'Diagnosing Vehicle',     icon: Search,       color: 'violet',
    next: { status: 'WORK_STARTED',   label: 'Mark: Work Started',       icon: Hammer       },
    alt:  { status: 'PARTS_ORDERED',  label: 'Need Parts — Order Parts', icon: Package      } },
  { status: 'PARTS_ORDERED',  label: 'Parts Ordered',          icon: Package,      color: 'orange',
    next: { status: 'WORK_STARTED',   label: 'Mark: Work Started',       icon: Hammer       } },
  { status: 'WORK_STARTED',   label: 'Work Started',           icon: Hammer,       color: 'amber',
    next: { status: 'TESTING',        label: 'Mark: Testing & QC',       icon: FlaskConical },
    alt:  { status: 'PARTS_ORDERED',  label: 'Need More Parts',          icon: Package      } },
  { status: 'TESTING',        label: 'Testing & QC',           icon: FlaskConical, color: 'teal',
    next: { status: 'COMPLETED',      label: 'Mark: Job Completed',      icon: Flag         } },
  { status: 'COMPLETED',      label: 'Completed',              icon: Flag,         color: 'green' },
];

const ALL_STEPS = [
  { status: 'IN_PROGRESS',    label: 'Accepted',        icon: CheckCircle2, color: 'text-blue-500'   },
  { status: 'REACHED_CENTER', label: 'Reached Center',  icon: Navigation,   color: 'text-indigo-500' },
  { status: 'DIAGNOSING',     label: 'Diagnosing',      icon: Search,       color: 'text-violet-500' },
  { status: 'PARTS_ORDERED',  label: 'Parts Ordered',   icon: Package,      color: 'text-orange-500' },
  { status: 'WORK_STARTED',   label: 'Work Started',    icon: Hammer,       color: 'text-amber-500'  },
  { status: 'TESTING',        label: 'Testing & QC',    icon: FlaskConical, color: 'text-teal-500'   },
  { status: 'COMPLETED',      label: 'Completed',       icon: Flag,         color: 'text-green-600'  },
];

const STATUS_ORDER = ALL_STEPS.map(s => s.status);

const CurrentJobCard = ({ job, onStatusUpdate, onAccept, onReject, loading }) => {
  const [updating,    setUpdating]    = useState(false);
  const [rejectModal, setRejectModal] = useState(false);
  const [reason,      setReason]      = useState('');
  const [rejecting,   setRejecting]   = useState(false);
  const [accepting,   setAccepting]   = useState(false);

  if (!job) return null;

  const isAssigned  = job.status === 'ASSIGNED';
  const isCompleted = job.status === 'COMPLETED';
  const currentMilestone = MILESTONES.find(m => m.status === job.status);
  const currentStepIdx   = STATUS_ORDER.indexOf(job.status);

  const scheduledAt = job.scheduledDate
    ? `${job.scheduledDate}${job.scheduledTime ? ' at ' + job.scheduledTime : ''}`
    : '—';

  const handleAccept = async () => {
    setAccepting(true);
    try { await onAccept?.(job.id); }
    finally { setAccepting(false); }
  };

  const handleReject = async () => {
    if (reason.trim().length < 5) return;
    setRejecting(true);
    try {
      await onReject?.(job.id, reason.trim());
      setRejectModal(false);
      setReason('');
    } finally { setRejecting(false); }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdating(true);
    try { await onStatusUpdate?.(job.id, newStatus); }
    finally { setUpdating(false); }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border-2 border-green-200 shadow-md overflow-hidden">

        {/* Banner */}
        <div className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="text-white text-xs font-bold uppercase tracking-wider">
              {isAssigned ? 'New Assignment' : 'Active Job'}
            </span>
          </div>
          <StatusBadge status={job.status || 'ASSIGNED'} />
        </div>

        {/* Urgency */}
        {job.urgency && job.urgency !== 'NORMAL' && (
          <div className={`px-4 py-1.5 flex items-center gap-2 text-xs font-semibold border-b
            ${job.urgency === 'EMERGENCY' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
            <AlertTriangle size={12} />{job.urgency} REQUEST
          </div>
        )}

        <div className="p-5 space-y-4">

          {/* Customer */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-green-50 border border-green-100 flex items-center justify-center shrink-0">
              <User size={20} className="text-green-600" />
            </div>
            <div>
              <p className="font-bold text-gray-800">{job.customerName || '—'}</p>
              <p className="text-gray-400 text-xs">{job.customerPhone}{job.customerEmail ? ` • ${job.customerEmail}` : ''}</p>
            </div>
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-3">
            <Detail icon={Car}    label="Vehicle"   value={`${job.brand || ''} ${job.vehicleModel || ''}`.trim() || '—'} />
            <Detail icon={Car}    label="Reg. No."  value={job.vehicleNumber || '—'} />
            <Detail icon={Clock}  label="Scheduled" value={scheduledAt} />
            <Detail icon={Wrench} label="Duration"  value={job.totalDurationMinutes ? `~${job.totalDurationMinutes} min` : '—'} />
          </div>

          {/* Services */}
          {job.serviceNames?.length > 0 && (
            <div>
              <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mb-2">Services</p>
              <div className="flex flex-wrap gap-1.5">
                {job.serviceNames.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-green-50 border border-green-100 text-green-700 rounded-full text-xs font-medium">{s}</span>
                ))}
              </div>
            </div>
          )}

          {/* Address */}
          {job.address && (
            <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-xl">
              <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-gray-600 text-xs leading-relaxed">{job.address}</p>
            </div>
          )}

          {/* Notes */}
          {job.additionalNotes && (
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
              <p className="text-amber-700 text-xs"><span className="font-semibold">Note: </span>{job.additionalNotes}</p>
            </div>
          )}

          {/* Price */}
          {job.totalPrice && (
            <div className="flex justify-between items-center pt-3 border-t border-gray-50">
              <span className="text-gray-500 text-sm">Job Value</span>
              <span className="font-bold text-gray-800 text-lg">₹{job.totalPrice.toLocaleString()}</span>
            </div>
          )}

          {/* ── Progress mini-timeline (shown after accept) ────────── */}
          {!isAssigned && (
            <div className="pt-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Job Progress</p>
              <div className="relative">
                {ALL_STEPS.map((step, i) => {
                  const done    = i < currentStepIdx;
                  const active  = i === currentStepIdx;
                  const Icon    = step.icon;
                  return (
                    <div key={step.status} className="flex gap-3 relative">
                      {i < ALL_STEPS.length - 1 && (
                        <div className={`absolute left-3 top-6 w-0.5 rounded-full ${done ? 'bg-green-300' : 'bg-gray-100'}`}
                          style={{ height: 'calc(100% - 1.25rem)' }} />
                      )}
                      <div className="shrink-0 z-10">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                          ${done   ? 'bg-green-500 border-green-500'
                          : active ? 'bg-white border-green-500 ring-2 ring-green-200'
                          : 'bg-gray-50 border-gray-200'}`}>
                          {done
                            ? <CheckCircle2 size={12} className="text-white" />
                            : <Icon size={11} className={active ? 'text-green-600' : 'text-gray-300'} />}
                        </div>
                      </div>
                      <div className={`pb-4 flex-1 ${i > currentStepIdx ? 'opacity-35' : ''}`}>
                        <p className={`text-xs font-bold leading-tight
                          ${done ? 'text-green-600' : active ? 'text-gray-800' : 'text-gray-400'}`}>
                          {step.label}
                          {active && <span className="ml-2 text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full font-bold">Current</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── ASSIGNED → Accept / Reject ─────────────────────────── */}
          {isAssigned && (
            <div className="space-y-2 pt-1">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide text-center">Respond to this assignment</p>
              <div className="flex gap-2.5">
                <button onClick={handleAccept} disabled={accepting || loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                  {accepting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                  {accepting ? 'Accepting…' : 'Accept Job'}
                </button>
                <button onClick={() => setRejectModal(true)} disabled={accepting || loading}
                  className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-bold transition-colors disabled:opacity-60">
                  <XCircle size={15} /> Reject
                </button>
              </div>
            </div>
          )}

          {/* ── Active → Next step button(s) ───────────────────────── */}
          {!isAssigned && !isCompleted && currentMilestone && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 pt-1">Update Progress</p>

              {currentMilestone.next && (
                <button onClick={() => handleStatusChange(currentMilestone.next.status)} disabled={updating || loading}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-green-600 hover:bg-green-700 text-white transition-all disabled:opacity-50 font-bold text-sm">
                  {updating
                    ? <Loader2 size={16} className="animate-spin shrink-0" />
                    : <currentMilestone.next.icon size={16} className="shrink-0" />}
                  <span className="flex-1 text-left">{updating ? 'Updating…' : currentMilestone.next.label}</span>
                  <ChevronRight size={14} className="opacity-70" />
                </button>
              )}

              {currentMilestone.alt && (
                <button onClick={() => handleStatusChange(currentMilestone.alt.status)} disabled={updating || loading}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed border-orange-200 hover:border-orange-400 hover:bg-orange-50 text-orange-600 transition-all disabled:opacity-50 font-semibold text-sm">
                  <currentMilestone.alt.icon size={15} className="shrink-0" />
                  <span className="flex-1 text-left">{currentMilestone.alt.label}</span>
                </button>
              )}
            </div>
          )}

          {/* Completed */}
          {isCompleted && (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-200 rounded-xl">
              <CheckCircle2 size={16} className="text-green-600" />
              <span className="text-green-700 font-bold text-sm">Job Completed ✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                  <XCircle size={18} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-gray-800 font-bold text-sm">Reject Assignment</h3>
                  <p className="text-gray-400 text-xs">It will return to SCO for reassignment</p>
                </div>
              </div>
              <button onClick={() => setRejectModal(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100">
                <X size={15} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-medium">Assignment from</p>
                <p className="text-gray-700 font-semibold text-sm mt-0.5">{job.customerName} — {job.vehicleNumber}</p>
              </div>
              <div>
                <label className="block text-gray-600 text-xs font-semibold mb-1.5">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea value={reason} onChange={e => setReason(e.target.value)} rows={3}
                  placeholder="e.g. Vehicle type not in my skill set, unavailable at this time…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none" />
                <p className="text-gray-400 text-xs mt-1">{reason.trim().length}/5 min characters</p>
              </div>
              <div className="flex gap-2.5">
                <button onClick={() => { setRejectModal(false); setReason(''); }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleReject} disabled={reason.trim().length < 5 || rejecting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                  {rejecting && <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  Confirm Reject
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

const Detail = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={13} className="text-gray-400 mt-0.5 shrink-0" />
    <div>
      <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wide">{label}</p>
      <p className="text-gray-700 text-xs font-semibold">{value}</p>
    </div>
  </div>
);

export default CurrentJobCard;