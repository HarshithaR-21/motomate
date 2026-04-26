import { useState } from 'react';
import { MapPin, Clock, Car, User, Wrench, CheckCircle2, XCircle, X, AlertTriangle } from 'lucide-react';
import { StatusBadge } from './UI';

const IncomingJobCard = ({ job, onAccept, onReject, loading }) => {
  const [rejectModal, setRejectModal] = useState(false);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  const handleReject = async () => {
    if (!reason.trim()) return;
    setRejecting(true);
    try {
      await onReject(job.id, reason);
      setRejectModal(false);
      setReason('');
    } finally {
      setRejecting(false);
    }
  };

  const urgencyColor = {
    EMERGENCY: 'bg-red-50 border-red-200 text-red-700',
    URGENT:    'bg-amber-50 border-amber-200 text-amber-700',
    NORMAL:    'bg-blue-50 border-blue-200 text-blue-700',
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {/* Top urgency bar */}
        {job.urgency && job.urgency !== 'NORMAL' && (
          <div className={`px-4 py-1.5 flex items-center gap-2 text-xs font-semibold border-b ${urgencyColor[job.urgency] || ''}`}>
            <AlertTriangle size={12} />
            {job.urgency} REQUEST
          </div>
        )}

        <div className="p-5">
          {/* Header row */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                <User size={18} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-800 text-sm">{job.customerName || '—'}</p>
                <p className="text-gray-400 text-xs">{job.customerPhone}</p>
              </div>
            </div>
            <StatusBadge status={job.status || 'PENDING'} />
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <InfoItem icon={Car} label="Vehicle" value={`${job.brand || ''} ${job.vehicleModel || ''}`.trim() || '—'} />
            <InfoItem icon={Car} label="Reg. No." value={job.vehicleNumber || '—'} />
            <InfoItem icon={MapPin} label="Mode" value={job.serviceMode || '—'} />
            <InfoItem icon={Clock} label="Duration" value={job.totalDurationMinutes ? `~${job.totalDurationMinutes} min` : '—'} />
          </div>

          {/* Services */}
          {job.serviceNames?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {job.serviceNames.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-green-50 border border-green-100 text-green-700 text-xs font-medium">
                  <Wrench size={10} /> {s}
                </span>
              ))}
            </div>
          )}

          {/* Address */}
          {job.address && (
            <div className="flex items-start gap-2 mb-4 p-2.5 rounded-xl bg-gray-50">
              <MapPin size={13} className="text-gray-400 mt-0.5 shrink-0" />
              <p className="text-gray-600 text-xs leading-relaxed">{job.address}</p>
            </div>
          )}

          {/* Notes */}
          {job.additionalNotes && (
            <div className="mb-4 p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <p className="text-amber-700 text-xs leading-relaxed"><span className="font-semibold">Note: </span>{job.additionalNotes}</p>
            </div>
          )}

          {/* Price */}
          {job.totalPrice && (
            <div className="flex items-center justify-between text-sm mb-4 pt-3 border-t border-gray-50">
              <span className="text-gray-500">Estimated Value</span>
              <span className="font-bold text-gray-800">₹{job.totalPrice.toLocaleString()}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              onClick={() => onAccept(job.id)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              <CheckCircle2 size={15} />
              Accept
            </button>
            <button
              onClick={() => setRejectModal(true)}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
            >
              <XCircle size={15} />
              Reject
            </button>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                  <XCircle size={18} className="text-red-500" />
                </div>
                <div>
                  <h3 className="text-gray-800 font-bold text-sm">Reject Request</h3>
                  <p className="text-gray-400 text-xs">Provide a reason for rejection</p>
                </div>
              </div>
              <button onClick={() => setRejectModal(false)} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 transition-colors">
                <X size={15} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="p-3 bg-gray-50 rounded-xl">
                <p className="text-xs text-gray-500 font-medium">Request from</p>
                <p className="text-gray-700 font-semibold text-sm mt-0.5">{job.customerName} — {job.vehicleNumber}</p>
              </div>
              <div>
                <label className="block text-gray-600 text-xs font-semibold mb-1.5">Rejection Reason <span className="text-red-500">*</span></label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="e.g. Vehicle type not supported, Out of service area…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-gray-800 text-sm placeholder-gray-300 focus:outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 resize-none"
                />
                <p className="text-gray-400 text-xs mt-1">Minimum 10 characters required</p>
              </div>
              <div className="flex gap-2.5">
                <button
                  onClick={() => setRejectModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={reason.trim().length < 10 || rejecting}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
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

const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon size={13} className="text-gray-400 mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-gray-400 text-[10px] font-medium uppercase tracking-wide">{label}</p>
      <p className="text-gray-700 text-xs font-semibold truncate">{value}</p>
    </div>
  </div>
);

export default IncomingJobCard;
