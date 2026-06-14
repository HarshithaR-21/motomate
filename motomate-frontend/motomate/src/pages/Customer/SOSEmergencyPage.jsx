import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, MapPin, Phone, User, Car, ChevronRight,
  CheckCircle, Clock, X, Loader2, Navigation, Shield,
  Flame, Zap, Wrench, Fuel, Info, RefreshCw, MessageCircle,
  Send, XCircle, Timer, TrendingUp,
} from 'lucide-react';
import { submitSOS, getSOSById, cancelSOS } from './sosApi';
import Navigation2 from '../../Components/Navigation';
import Footer from '../../Components/Footer';

// ── Constants ──────────────────────────────────────────────────────────────

const EMERGENCY_TYPES = [
  { value: 'ACCIDENT',           label: 'Accident',          icon: <Flame size={18}/>,         color: 'text-red-600',    bg: 'bg-red-50  border-red-300' },
  { value: 'VEHICLE_BREAKDOWN',  label: 'Vehicle Breakdown', icon: <Wrench size={18}/>,        color: 'text-orange-600', bg: 'bg-orange-50 border-orange-300' },
  { value: 'FLAT_TYRE',          label: 'Flat Tyre',         icon: <Car size={18}/>,           color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-300' },
  { value: 'BATTERY_DEAD',       label: 'Battery Dead',      icon: <Zap size={18}/>,           color: 'text-blue-600',   bg: 'bg-blue-50   border-blue-300' },
  { value: 'ENGINE_FAILURE',     label: 'Engine Failure',    icon: <AlertTriangle size={18}/>, color: 'text-red-700',    bg: 'bg-red-50   border-red-300' },
  { value: 'FUEL_EMPTY',         label: 'Fuel Empty',        icon: <Fuel size={18}/>,          color: 'text-green-700',  bg: 'bg-green-50  border-green-300' },
  { value: 'SAFETY_CONCERN',     label: 'Safety Concern',    icon: <Shield size={18}/>,        color: 'text-purple-600', bg: 'bg-purple-50 border-purple-300' },
  { value: 'OTHER',              label: 'Other',             icon: <Info size={18}/>,          color: 'text-gray-600',   bg: 'bg-gray-50   border-gray-300' },
];

const VEHICLE_STATUS_OPTIONS = [
  { value: 'CANNOT_MOVE', label: 'Vehicle cannot move',     badge: 'bg-red-100 text-red-700' },
  { value: 'MOVE_SLOWLY', label: 'Vehicle can move slowly', badge: 'bg-yellow-100 text-yellow-700' },
  { value: 'OPERATIONAL', label: 'Vehicle is operational',  badge: 'bg-green-100 text-green-700' },
];

const TRAFFIC_OPTIONS = [
  { value: 'BLOCKING_TRAFFIC', label: 'Blocking traffic',     badge: 'bg-red-100 text-red-700' },
  { value: 'NOT_BLOCKING',     label: 'Not blocking traffic', badge: 'bg-green-100 text-green-700' },
];

const INJURY_OPTIONS = [
  { value: 'INJURED',   label: 'Someone is injured', badge: 'bg-red-100 text-red-700' },
  { value: 'NO_INJURY', label: 'No injuries',        badge: 'bg-green-100 text-green-700' },
];

const STATUS_STEPS = [
  { key: 'SOS_SUBMITTED',           label: 'SOS Sent to Nearby Centers', icon: <AlertTriangle size={16}/> },
  { key: 'SERVICE_CENTER_ACCEPTED', label: 'Service Center Accepted',    icon: <CheckCircle size={16}/> },
  { key: 'WORKER_ASSIGNED',         label: 'Worker Assigned',            icon: <User size={16}/> },
  { key: 'WORKER_EN_ROUTE',         label: 'Worker En Route',            icon: <Navigation size={16}/> },
  { key: 'WORKER_ARRIVED',          label: 'Worker Arrived',             icon: <MapPin size={16}/> },
  { key: 'SERVICE_IN_PROGRESS',     label: 'Service In Progress',        icon: <Wrench size={16}/> },
  { key: 'SERVICE_COMPLETED',       label: 'Service Completed',          icon: <CheckCircle size={16}/> },
];

const PRIORITY_CONFIG = {
  EMERGENCY: { label: 'EMERGENCY', className: 'bg-red-600 text-white animate-pulse', ring: 'ring-red-500' },
  HIGH:      { label: 'HIGH',      className: 'bg-orange-500 text-white',            ring: 'ring-orange-400' },
  NORMAL:    { label: 'NORMAL',    className: 'bg-blue-500 text-white',              ring: 'ring-blue-400' },
};

// ── Validation helpers ─────────────────────────────────────────────────────

const VEHICLE_NUMBER_RE = /^[A-Z0-9\s\-]{0,20}$/i;

function validateForm(fd) {
  const errors = {};
  if (!fd.emergencyType)  errors.emergencyType  = 'Please select an emergency type';
  if (!fd.vehicleStatus)  errors.vehicleStatus  = 'Please select vehicle status';
  if (!fd.trafficImpact)  errors.trafficImpact  = 'Please indicate traffic impact';
  if (!fd.injuryStatus)   errors.injuryStatus   = 'Please indicate injury status';
  if (fd.latitude == null || fd.longitude == null) errors.location = 'Location is required to dispatch help';
  if (fd.vehicleNumber && !VEHICLE_NUMBER_RE.test(fd.vehicleNumber))
    errors.vehicleNumber = 'Vehicle number can only contain letters, digits, spaces or hyphens';
  if (fd.additionalDescription && fd.additionalDescription.length > 500)
    errors.additionalDescription = 'Description must not exceed 500 characters';
  return errors;
}

// ── Reusable components ────────────────────────────────────────────────────

const RadioOption = ({ value, selected, onChange, children, badge }) => (
  <button
    type="button"
    onClick={() => onChange(value)}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all ${
      selected ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white hover:border-gray-300'
    }`}
  >
    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
      selected ? 'border-red-500' : 'border-gray-400'
    }`}>
      {selected && <div className="w-2 h-2 rounded-full bg-red-500" />}
    </div>
    <span className="flex-1 text-sm font-medium text-gray-700">{children}</span>
    {badge && <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge}`}>{children}</span>}
  </button>
);

const FieldError = ({ msg }) =>
  msg ? <p className="text-xs text-red-600 mt-1 flex items-center gap-1"><AlertTriangle size={11}/>{msg}</p> : null;

// ── Inline Chat Widget (customer ↔ worker over SOS chat room) ──────────────

const SOSChatWidget = ({ sosId, chatRoomId, workerName, customerId }) => {
  const BASE_CHAT = 'http://localhost:8080/api/chat';
  const [messages, setMessages] = useState([]);
  const [input, setInput]       = useState('');
  const [sending, setSending]   = useState(false);
  const [open, setOpen]         = useState(false);
  const [unread, setUnread]     = useState(0);
  const bottomRef               = useRef(null);

  const fetchMessages = useCallback(async () => {
    if (!chatRoomId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BASE_CHAT}/${chatRoomId}/messages`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      const msgs = Array.isArray(data) ? data : data.messages || [];
      if (!open && msgs.length > messages.length) {
        setUnread(u => u + (msgs.length - messages.length));
      }
      setMessages(msgs);
    } catch { /* silent */ }
  }, [chatRoomId, open, messages.length]);

  useEffect(() => {
    fetchMessages();
    const id = setInterval(fetchMessages, 4000);
    return () => clearInterval(id);
  }, [fetchMessages]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending || !chatRoomId) return;
    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await fetch(`${BASE_CHAT}/${chatRoomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        credentials: 'include',
        body: JSON.stringify({ senderRole: 'CUSTOMER', senderName: 'You', content: text }),
      });
      setInput('');
      fetchMessages();
    } catch { /* silent */ } finally {
      setSending(false);
    }
  };

  if (!chatRoomId) return null;

  return (
    <div className="fixed bottom-6 right-4 z-50">
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative w-14 h-14 rounded-full bg-blue-600 text-white shadow-2xl flex items-center justify-center hover:bg-blue-700 transition-colors"
      >
        <MessageCircle size={24}/>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
        >
          {/* Header */}
          <div className="bg-blue-600 px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-white font-semibold text-sm">Chat with Worker</p>
              {workerName && <p className="text-blue-200 text-xs">{workerName}</p>}
            </div>
            <button onClick={() => setOpen(false)} className="text-blue-200 hover:text-white">
              <X size={18}/>
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-3 space-y-2 bg-gray-50">
            {messages.length === 0 ? (
              <p className="text-center text-gray-400 text-xs py-6">No messages yet. Say hi!</p>
            ) : (
              messages.map((m, i) => {
                const isMe = m.senderId === customerId;
                return (
                  <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                      isMe ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
                    }`}>
                      {m.message}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={bottomRef}/>
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              maxLength={300}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-200 transition-colors"
            >
              {sending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ── Cancel Confirmation Modal ──────────────────────────────────────────────

const CancelModal = ({ onConfirm, onClose, loading }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full"
      >
        <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <XCircle size={24} className="text-orange-600"/>
        </div>
        <h2 className="text-lg font-bold text-gray-900 text-center mb-1">Cancel SOS Request?</h2>
        <p className="text-sm text-gray-500 text-center mb-4">
          Your assigned worker will be notified. Only cancel if you no longer need help.
        </p>
        <textarea
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none mb-4"
          rows={2}
          placeholder="Reason (optional)…"
          value={reason}
          onChange={e => setReason(e.target.value)}
          maxLength={300}
        />
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50"
          >
            Keep SOS Active
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-bold hover:bg-orange-600 disabled:bg-gray-200 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 size={15} className="animate-spin"/> : <XCircle size={15}/>}
            Cancel SOS
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ── Live Tracking View ─────────────────────────────────────────────────────

const LiveTracking = ({ sosId, customerId, onCancelled }) => {
  const [sos, setSos]             = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const intervalRef               = useRef(null);

  const fetchSOS = useCallback(async () => {
    try {
      const data = await getSOSById(sosId);
      setSos(data);
      if (data.status === 'SERVICE_COMPLETED' || data.status === 'CANCELLED') {
        clearInterval(intervalRef.current);
      }
    } catch { /* silent */ }
  }, [sosId]);

  useEffect(() => {
    fetchSOS();
    intervalRef.current = setInterval(fetchSOS, 5000);
    return () => clearInterval(intervalRef.current);
  }, [fetchSOS]);

  const handleCancel = async (reason) => {
    setCancelling(true);
    try {
      await cancelSOS(sosId, customerId, reason);
      localStorage.removeItem('activeSosId');
      setShowCancel(false);
      onCancelled?.();
    } catch (e) {
      alert(e.message);
    } finally {
      setCancelling(false);
    }
  };

  if (!sos) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 size={32} className="animate-spin text-red-500"/>
    </div>
  );

  const isCompleted = sos.status === 'SERVICE_COMPLETED';
  const isCancelled = sos.status === 'CANCELLED';
  const currentStepIdx = STATUS_STEPS.findIndex(s => s.key === sos.status);
  const pct = currentStepIdx >= 0
    ? Math.round((currentStepIdx / (STATUS_STEPS.length - 1)) * 100)
    : 0;

  return (
    <div className="space-y-4">
      {/* Priority + time header */}
      <div className={`bg-white rounded-2xl shadow-md p-5 border ${
        sos.priorityLevel === 'EMERGENCY' ? 'border-red-200'
        : sos.priorityLevel === 'HIGH'    ? 'border-orange-200'
        : 'border-blue-100'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">SOS #{sos.id?.slice(-6)}</p>
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <Clock size={13}/> {sos.minutesSinceRequest} min ago
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {sos.priorityLevel && (
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${PRIORITY_CONFIG[sos.priorityLevel]?.className}`}>
                {PRIORITY_CONFIG[sos.priorityLevel]?.label}
              </span>
            )}
            {sos.estimatedArrivalMinutes && ['WORKER_ASSIGNED','WORKER_EN_ROUTE'].includes(sos.status) && (
              <span className="text-xs text-blue-600 font-semibold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                <Timer size={12}/> ETA ~{sos.estimatedArrivalMinutes} min
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {!isCancelled && (
          <div className="mb-4">
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-red-400 to-red-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8 }}
              />
            </div>
          </div>
        )}

        {/* Cancelled state */}
        {isCancelled && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600 text-center">
            <XCircle size={20} className="mx-auto mb-1 text-gray-400"/>
            This SOS was cancelled.
            {sos.cancellationReason && <p className="text-xs mt-1 text-gray-400">"{sos.cancellationReason}"</p>}
          </div>
        )}

        {/* Steps */}
        {!isCancelled && (
          <div className="space-y-1">
            {STATUS_STEPS.map((step, idx) => {
              const done    = idx < currentStepIdx;
              const current = idx === currentStepIdx;
              return (
                <div key={step.key} className={`flex items-center gap-3 py-1.5 px-3 rounded-lg text-sm ${
                  current ? 'bg-red-50 text-red-700 font-semibold'
                  : done   ? 'text-green-600'
                  : 'text-gray-400'
                }`}>
                  <span className={`flex-shrink-0 ${current ? 'text-red-600' : done ? 'text-green-500' : 'text-gray-300'}`}>
                    {done ? <CheckCircle size={16}/> : step.icon}
                  </span>
                  {step.label}
                  {current && <span className="ml-auto text-xs">● CURRENT</span>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Worker info card */}
      {sos.assignedWorkerName && !isCancelled && (
        <div className="bg-white rounded-2xl shadow-md p-5 border border-blue-100">
          <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <User size={18} className="text-blue-600"/> Assigned Worker
          </h3>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-medium text-gray-900">{sos.assignedWorkerName}</p>
              <p className="text-sm text-gray-500">{sos.assignedWorkerPhone}</p>
            </div>
            <div className="flex gap-2">
              {sos.assignedWorkerPhone && (
                <a
                  href={`tel:${sos.assignedWorkerPhone}`}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-blue-700"
                >
                  <Phone size={14}/> Call
                </a>
              )}
            </div>
          </div>
          {sos.distanceToWorkerKm != null && (
            <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
              <TrendingUp size={13} className="text-blue-500"/>
              Worker is ~{sos.distanceToWorkerKm} km away
            </div>
          )}
          {sos.latitude && sos.longitude && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${sos.latitude},${sos.longitude}`}
              target="_blank" rel="noopener noreferrer"
              className="mt-3 flex items-center gap-2 text-sm text-blue-600 hover:underline"
            >
              <Navigation size={14}/> View your location on Google Maps
            </a>
          )}
        </div>
      )}

      {/* Service center */}
      {sos.assignedServiceCenterName && (
        <div className="bg-white rounded-2xl shadow-md p-4 border border-green-100">
          <h3 className="font-semibold text-gray-800 mb-1 flex items-center gap-2 text-sm">
            <Wrench size={16} className="text-green-600"/> Service Center
          </h3>
          <p className="text-gray-700">{sos.assignedServiceCenterName}</p>
        </div>
      )}

      {/* Action buttons */}
      {!isCompleted && !isCancelled && (
        <button
          onClick={() => setShowCancel(true)}
          className="w-full flex items-center justify-center gap-2 text-sm text-orange-600 border border-orange-200 bg-orange-50 py-3 rounded-xl hover:bg-orange-100 transition-colors font-medium"
        >
          <XCircle size={16}/> Cancel SOS Request
        </button>
      )}

      {isCompleted && (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <CheckCircle size={32} className="text-green-500 mx-auto mb-2"/>
          <h3 className="font-bold text-green-800 mb-1">Service Completed!</h3>
          <p className="text-sm text-green-600">Your emergency has been resolved.</p>
          <button
            onClick={() => { localStorage.removeItem('activeSosId'); onCancelled?.(); }}
            className="mt-3 text-sm text-blue-600 hover:underline"
          >
            Return to Dashboard
          </button>
        </div>
      )}

      <button
        onClick={fetchSOS}
        className="w-full flex items-center justify-center gap-2 text-xs text-gray-400 py-2 hover:text-gray-600"
      >
        <RefreshCw size={12}/> Refresh
      </button>

      {showCancel && (
        <CancelModal
          loading={cancelling}
          onConfirm={handleCancel}
          onClose={() => setShowCancel(false)}
        />
      )}

      {/* Inline chat with worker */}
      {sos.chatRoomId && sos.assignedWorkerName && !isCancelled && (
        <SOSChatWidget
          sosId={sosId}
          chatRoomId={sos.chatRoomId}
          workerName={sos.assignedWorkerName}
          customerId={sos.customerId}
        />
      )}
    </div>
  );
};

// ── Confirm Dialog ─────────────────────────────────────────────────────────

const ConfirmDialog = ({ onConfirm, onCancel }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center"
    >
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={32} className="text-red-600"/>
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Request Emergency Assistance?</h2>
      <p className="text-gray-500 mb-6 text-sm leading-relaxed">
        This will immediately alert nearby service centers and dispatch a worker to your location.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700"
        >
          Yes, Send SOS
        </button>
      </div>
    </motion.div>
  </div>
);

// ── Main SOS Page ──────────────────────────────────────────────────────────

const SOSEmergencyPage = () => {
  const [phase, setPhase]     = useState('idle');  // idle|confirm|form|submitting|tracking
  const [formData, setFormData] = useState({
    emergencyType: '', vehicleStatus: '', trafficImpact: '',
    injuryStatus: '', additionalDescription: '',
    vehicleNumber: '', vehicleType: '', vehicleBrand: '', vehicleModel: '',
    latitude: null, longitude: null, address: '',
  });
  const [errors, setErrors]           = useState({});
  const [touched, setTouched]         = useState({});
  const [locationStatus, setLocationStatus] = useState('idle');
  const [submitError, setSubmitError]  = useState('');
  const [activeSosId, setActiveSosId]  = useState(null);
  const [customerId, setCustomerId]    = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('activeSosId');
    if (stored) { setActiveSosId(stored); setPhase('tracking'); }
    const uid = localStorage.getItem('userId') || JSON.parse(localStorage.getItem('user') || '{}')?.id;
    setCustomerId(uid);
  }, []);

  // Run validation on every change
  useEffect(() => {
    if (phase === 'form') setErrors(validateForm(formData));
  }, [formData, phase]);

  const captureLocation = useCallback(() => {
    setLocationStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        let address = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
        try {
          const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const d = await r.json();
          if (d.display_name) address = d.display_name;
        } catch { /* best-effort */ }
        setFormData(f => ({ ...f, latitude: lat, longitude: lon, address }));
        setLocationStatus('ok');
        setTouched(t => ({ ...t, location: true }));
      },
      () => { setLocationStatus('error'); setTouched(t => ({ ...t, location: true })); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  const updateField = (key, val) => {
    setFormData(f => ({ ...f, [key]: val }));
    setTouched(t => ({ ...t, [key]: true }));
  };

  const isFormValid = () => Object.keys(validateForm(formData)).length === 0;

  const handleSubmit = async () => {
    // Touch all required fields to show errors
    setTouched({ emergencyType: true, vehicleStatus: true, trafficImpact: true, injuryStatus: true, location: true });
    const errs = validateForm(formData);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setSubmitError('');
    setPhase('submitting');
    try {
      const cid = customerId;
      if (!cid) throw new Error('Session expired. Please log in again.');
      const payload = {
        customerId: cid,
        vehicleNumber:  formData.vehicleNumber?.trim().toUpperCase() || undefined,
        vehicleType:    formData.vehicleType   || undefined,
        vehicleBrand:   formData.vehicleBrand  || undefined,
        vehicleModel:   formData.vehicleModel  || undefined,
        emergencyType:  formData.emergencyType,
        vehicleStatus:  formData.vehicleStatus,
        trafficImpact:  formData.trafficImpact,
        injuryStatus:   formData.injuryStatus,
        additionalDescription: formData.additionalDescription || undefined,
        latitude:  formData.latitude,
        longitude: formData.longitude,
        address:   formData.address || undefined,
      };
      const res = await submitSOS(payload);
      localStorage.setItem('activeSosId', res.id);
      setActiveSosId(res.id);
      setPhase('tracking');
    } catch (e) {
      if (e.message === 'ACTIVE_SOS_EXISTS' && e.activeSosId) {
        // Redirect to existing active SOS
        localStorage.setItem('activeSosId', e.activeSosId);
        setActiveSosId(e.activeSosId);
        setPhase('tracking');
      } else {
        setSubmitError(e.message || 'Submission failed. Please try again.');
        setPhase('form');
      }
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation2/>

      <div className="max-w-lg mx-auto px-4 py-8">

        {/* IDLE: big SOS button */}
        {phase === 'idle' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Emergency SOS</h1>
            <p className="text-gray-500 mb-10">Get immediate roadside assistance · Available 24/7</p>
            <motion.button
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.03 }}
              onClick={() => setPhase('confirm')}
              className="w-52 h-52 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-2xl mx-auto flex flex-col items-center justify-center gap-3 transition-colors ring-8 ring-red-100"
            >
              <AlertTriangle size={56}/>
              <span className="text-2xl font-black tracking-widest">SOS</span>
              <span className="text-xs opacity-80">Tap for emergency help</span>
            </motion.button>
            <p className="mt-8 text-xs text-gray-400">Your SOS is instantly broadcast to all nearby service centers — first to respond gets assigned</p>
          </motion.div>
        )}

        {/* CONFIRM dialog */}
        {phase === 'confirm' && (
          <ConfirmDialog
            onConfirm={() => { setPhase('form'); captureLocation(); }}
            onCancel={() => setPhase('idle')}
          />
        )}

        {/* FORM */}
        {phase === 'form' && (
          <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
            <div className="flex items-center gap-3 mb-2">
              <button onClick={() => setPhase('idle')} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} className="text-gray-600"/>
              </button>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Emergency Details</h2>
                <p className="text-xs text-gray-400">Fields marked * are required</p>
              </div>
            </div>

            {submitError && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                <AlertTriangle size={16}/> {submitError}
              </div>
            )}

            {/* INJURY status – shown first if EMERGENCY priority possible */}
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-2">
              <h3 className="font-semibold text-red-800 mb-1 flex items-center gap-2">
                <AlertTriangle size={18} className="text-red-600"/> Injury Status <span className="text-red-500">*</span>
              </h3>
              <p className="text-xs text-red-600 mb-2">If anyone is injured, please also call emergency services (112)</p>
              {INJURY_OPTIONS.map(o => (
                <RadioOption key={o.value} value={o.value} selected={formData.injuryStatus === o.value}
                  onChange={v => updateField('injuryStatus', v)} badge={o.badge}>{o.label}</RadioOption>
              ))}
              {touched.injuryStatus && <FieldError msg={errors.injuryStatus}/>}
            </div>

            {/* Emergency type */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Flame size={18} className="text-red-600"/> Emergency Type <span className="text-red-500">*</span>
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {EMERGENCY_TYPES.map(t => (
                  <button key={t.value} type="button"
                    onClick={() => updateField('emergencyType', t.value)}
                    className={`flex items-center gap-2 px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      formData.emergencyType === t.value
                        ? `border-red-500 bg-red-50 ${t.color}`
                        : `border-gray-200 text-gray-600 hover:border-gray-300 ${t.bg}`
                    }`}
                  >
                    {t.icon} {t.label}
                  </button>
                ))}
              </div>
              {touched.emergencyType && <FieldError msg={errors.emergencyType}/>}
            </div>

            {/* Vehicle status */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-1">Vehicle Status <span className="text-red-500">*</span></h3>
              {VEHICLE_STATUS_OPTIONS.map(o => (
                <RadioOption key={o.value} value={o.value} selected={formData.vehicleStatus === o.value}
                  onChange={v => updateField('vehicleStatus', v)} badge={o.badge}>{o.label}</RadioOption>
              ))}
              {touched.vehicleStatus && <FieldError msg={errors.vehicleStatus}/>}
            </div>

            {/* Traffic impact */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-2 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-1">Traffic Impact <span className="text-red-500">*</span></h3>
              {TRAFFIC_OPTIONS.map(o => (
                <RadioOption key={o.value} value={o.value} selected={formData.trafficImpact === o.value}
                  onChange={v => updateField('trafficImpact', v)}>{o.label}</RadioOption>
              ))}
              {touched.trafficImpact && <FieldError msg={errors.trafficImpact}/>}
            </div>

            {/* Vehicle info */}
            <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3 border border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Car size={18} className="text-blue-600"/> Vehicle Information
                <span className="text-gray-400 font-normal text-xs">(optional)</span>
              </h3>
              <input
                className={`w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 uppercase ${
                  errors.vehicleNumber && touched.vehicleNumber ? 'border-red-400' : 'border-gray-200'
                }`}
                placeholder="Vehicle Number (e.g. KA01AB1234)"
                value={formData.vehicleNumber}
                onChange={e => updateField('vehicleNumber', e.target.value)}
                maxLength={20}
              />
              <FieldError msg={touched.vehicleNumber && errors.vehicleNumber}/>
              <div className="grid grid-cols-2 gap-3">
                <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  placeholder="Brand" value={formData.vehicleBrand}
                  onChange={e => updateField('vehicleBrand', e.target.value)} maxLength={50}/>
                <input className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-300"
                  placeholder="Model" value={formData.vehicleModel}
                  onChange={e => updateField('vehicleModel', e.target.value)} maxLength={50}/>
              </div>
            </div>

            {/* Additional description */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-2">Additional Details</h3>
              <textarea
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none ${
                  errors.additionalDescription && touched.additionalDescription ? 'border-red-400' : 'border-gray-200'
                }`}
                rows={3}
                placeholder="Describe what happened, special instructions, landmarks…"
                value={formData.additionalDescription}
                onChange={e => updateField('additionalDescription', e.target.value)}
                maxLength={500}
              />
              <div className="flex justify-between mt-1">
                <FieldError msg={touched.additionalDescription && errors.additionalDescription}/>
                <p className="text-xs text-gray-400 ml-auto">{formData.additionalDescription.length}/500</p>
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <MapPin size={18} className="text-red-600"/> Your Location <span className="text-red-500">*</span>
              </h3>

              {locationStatus === 'idle' && (
                <button onClick={captureLocation}
                  className="w-full py-3 rounded-xl bg-blue-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-700">
                  <Navigation size={16}/> Capture My Location
                </button>
              )}
              {locationStatus === 'loading' && (
                <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
                  <Loader2 size={16} className="animate-spin"/> Getting your location…
                </div>
              )}
              {locationStatus === 'ok' && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm">
                  <p className="text-green-700 font-medium flex items-center gap-2 mb-1">
                    <CheckCircle size={14}/> Location Captured
                  </p>
                  <p className="text-green-600 text-xs leading-relaxed">{formData.address}</p>
                  <button onClick={captureLocation} className="mt-2 text-xs text-blue-600 flex items-center gap-1 hover:underline">
                    <RefreshCw size={12}/> Refresh Location
                  </button>
                </div>
              )}
              {locationStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                  <p>Unable to get location. Please enable location access in your browser.</p>
                  <button onClick={captureLocation} className="mt-2 text-xs underline flex items-center gap-1">
                    <RefreshCw size={12}/> Try Again
                  </button>
                </div>
              )}
              {touched.location && <FieldError msg={errors.location}/>}
            </div>

            {/* Show all pending errors summary */}
            {Object.keys(errors).length > 0 && Object.keys(touched).length > 0 && !isFormValid() && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700">
                Please complete all required fields before submitting.
              </div>
            )}

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleSubmit}
              className={`w-full py-4 rounded-2xl text-white font-bold text-lg flex items-center justify-center gap-3 transition-all shadow-lg ${
                isFormValid() ? 'bg-red-600 hover:bg-red-700 shadow-red-200' : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              <AlertTriangle size={22}/> Send Emergency SOS
            </motion.button>
          </motion.div>
        )}

        {/* SUBMITTING */}
        {phase === 'submitting' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto animate-pulse">
              <AlertTriangle size={40} className="text-red-600"/>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Sending SOS…</h2>
            <p className="text-gray-500 text-sm">Broadcasting to nearby service centers…</p>
            <Loader2 size={28} className="animate-spin text-red-500 mx-auto"/>
          </motion.div>
        )}

        {/* TRACKING */}
        {phase === 'tracking' && activeSosId && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle size={20} className="text-white"/>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Emergency SOS Active</h2>
                <p className="text-sm text-gray-500">Help is on the way · Auto-refreshing</p>
              </div>
            </div>
            <LiveTracking
              sosId={activeSosId}
              customerId={customerId}
              onCancelled={() => { setActiveSosId(null); setPhase('idle'); }}
            />
          </motion.div>
        )}
      </div>

      <Footer/>
    </div>
  );
};

export default SOSEmergencyPage;
