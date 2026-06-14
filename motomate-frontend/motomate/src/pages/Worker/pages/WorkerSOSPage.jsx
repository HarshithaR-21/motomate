import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle, MapPin, Phone, User, Car, Navigation,
  Clock, CheckCircle, Loader2, RefreshCw, Flame, Zap,
  Wrench, Fuel, Shield, Info, MessageCircle, Send, X,
  Timer, TrendingUp, XCircle,
} from 'lucide-react';
import { getActiveSosForWorker, updateSOSStatus } from '../../Customer/sosApi';

// ── Constants ──────────────────────────────────────────────────────────────

const WORKER_ACTIONS = {
  WORKER_ASSIGNED:     { next: 'WORKER_EN_ROUTE',    label: 'Accept & Start Journey', color: 'bg-blue-600  hover:bg-blue-700' },
  WORKER_EN_ROUTE:     { next: 'WORKER_ARRIVED',      label: 'Mark as Arrived',        color: 'bg-orange-500 hover:bg-orange-600' },
  WORKER_ARRIVED:      { next: 'SERVICE_IN_PROGRESS', label: 'Begin Service',          color: 'bg-purple-600 hover:bg-purple-700' },
  SERVICE_IN_PROGRESS: { next: 'SERVICE_COMPLETED',   label: 'Mark Service Complete',  color: 'bg-green-600  hover:bg-green-700' },
};

const EMERGENCY_ICONS = {
  ACCIDENT:          <Flame size={18} className="text-red-500"/>,
  VEHICLE_BREAKDOWN: <Wrench size={18} className="text-orange-500"/>,
  ENGINE_FAILURE:    <AlertTriangle size={18} className="text-red-600"/>,
  BATTERY_DEAD:      <Zap size={18} className="text-blue-500"/>,
  FLAT_TYRE:         <Car size={18} className="text-yellow-600"/>,
  FUEL_EMPTY:        <Fuel size={18} className="text-green-600"/>,
  SAFETY_CONCERN:    <Shield size={18} className="text-purple-500"/>,
  OTHER:             <Info size={18} className="text-gray-500"/>,
};

const STATUS_INFO = {
  WORKER_ASSIGNED:     { label: 'Assigned to You',   hint: 'Accept to start your journey to the customer.' },
  WORKER_EN_ROUTE:     { label: 'En Route',           hint: 'Navigate to the customer location and tap Arrived when you get there.' },
  WORKER_ARRIVED:      { label: 'Arrived',            hint: 'Start the service when you are ready.' },
  SERVICE_IN_PROGRESS: { label: 'Service In Progress', hint: 'Mark complete when you have resolved the emergency.' },
  SERVICE_COMPLETED:   { label: 'Completed',          hint: 'Great job! This SOS has been resolved.' },
};

// ── Inline Chat Widget (worker side) ──────────────────────────────────────

const WorkerChatWidget = ({ chatRoomId, workerId, customerName, sosId }) => {
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
        body: JSON.stringify({ senderRole: 'WORKER', senderName: workerName || 'Worker', content: text }),
      });
      setInput('');
      fetchMessages();
    } catch { /* silent */ } finally {
      setSending(false);
    }
  };

  if (!chatRoomId) return null;

  return (
    <div className="relative">
      {/* Toggle bar */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
      >
        <div className="flex items-center gap-2">
          <MessageCircle size={18}/>
          <span className="font-semibold text-sm">Chat with {customerName || 'Customer'}</span>
          {unread > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {unread}
            </span>
          )}
        </div>
        <span className="text-blue-200 text-xs">{open ? 'Close' : 'Open'}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border border-blue-200 rounded-b-xl bg-white"
          >
            {/* Messages */}
            <div className="h-56 overflow-y-auto p-3 space-y-2 bg-gray-50">
              {messages.length === 0 ? (
                <p className="text-center text-gray-400 text-xs py-6">
                  No messages yet. Let the customer know you're on the way!
                </p>
              ) : (
                messages.map((m, i) => {
                  const isMe = m.senderId === workerId;
                  return (
                    <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-gray-800 shadow-sm rounded-bl-sm'
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
                className="w-9 h-9 bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 disabled:bg-gray-200 transition-colors flex-shrink-0"
              >
                {sending ? <Loader2 size={14} className="animate-spin"/> : <Send size={14}/>}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Confirm Complete Modal ─────────────────────────────────────────────────

const ConfirmCompleteModal = ({ onConfirm, onCancel, loading }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center"
    >
      <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <CheckCircle size={28} className="text-green-600"/>
      </div>
      <h2 className="text-lg font-bold text-gray-900 mb-2">Complete this SOS?</h2>
      <p className="text-sm text-gray-500 mb-5">
        Confirming this will mark the emergency as resolved, notify the customer, and set you back to Available.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel}
          className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 text-sm font-medium hover:bg-gray-50">
          Back
        </button>
        <button onClick={onConfirm} disabled={loading}
          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 disabled:bg-gray-200 flex items-center justify-center gap-2">
          {loading ? <Loader2 size={14} className="animate-spin"/> : <CheckCircle size={14}/>}
          Yes, Complete
        </button>
      </div>
    </motion.div>
  </div>
);

// ── SOS Assignment Card ────────────────────────────────────────────────────

const SOSAssignmentCard = ({ sos, workerId, onStatusUpdate }) => {
  const [updating, setUpdating]           = useState(false);
  const [showComplete, setShowComplete]   = useState(false);

  const action = WORKER_ACTIONS[sos.status];
  const statusInfo = STATUS_INFO[sos.status] || {};
  const emergencyIcon = EMERGENCY_ICONS[sos.emergencyType] || <AlertTriangle size={18}/>;
  const isCompleted = sos.status === 'SERVICE_COMPLETED';
  const isCancelled = sos.status === 'CANCELLED';

  const mapsLink = sos.latitude && sos.longitude
    ? `https://www.google.com/maps/dir/?api=1&destination=${sos.latitude},${sos.longitude}`
    : null;

  const handleAction = async () => {
    if (!action) return;
    // Show confirm modal for completing service
    if (action.next === 'SERVICE_COMPLETED') {
      setShowComplete(true);
      return;
    }
    doUpdate(action.next);
  };

  const doUpdate = async (nextStatus) => {
    setUpdating(true);
    setShowComplete(false);
    try {
      await updateSOSStatus(sos.id, nextStatus, workerId);
      onStatusUpdate();
    } catch (e) {
      alert('Failed to update status: ' + e.message);
    } finally {
      setUpdating(false);
    }
  };

  const priorityHeaderCls =
    sos.priorityLevel === 'EMERGENCY' ? 'bg-red-600' :
    sos.priorityLevel === 'HIGH'      ? 'bg-orange-500' : 'bg-blue-500';

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl shadow-md overflow-hidden ${
          sos.priorityLevel === 'EMERGENCY' ? 'ring-2 ring-red-400' : 'border border-gray-100'
        }`}
      >
        {/* Priority header */}
        <div className={`px-5 py-3 flex items-center justify-between ${priorityHeaderCls}`}>
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle size={18}/>
            <span className="font-bold text-sm">{sos.priorityLevel} PRIORITY</span>
            {sos.injuryStatus === 'INJURED' && (
              <span className="text-xs bg-white/20 rounded-full px-2 py-0.5 font-semibold">⚠️ INJURY</span>
            )}
          </div>
          <span className="text-xs text-white/80 flex items-center gap-1">
            <Clock size={12}/> {sos.minutesSinceRequest}m ago
          </span>
        </div>

        {/* Cancelled banner */}
        {isCancelled && (
          <div className="bg-gray-100 border-b border-gray-200 px-5 py-2 flex items-center gap-2 text-sm text-gray-500">
            <XCircle size={15}/> This SOS was cancelled by the customer.
          </div>
        )}

        <div className="p-5 space-y-4">
          {/* Status hint */}
          {statusInfo.hint && !isCancelled && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2 text-xs text-blue-700 flex items-start gap-2">
              <Info size={13} className="shrink-0 mt-0.5"/>
              {statusInfo.hint}
            </div>
          )}

          {/* Emergency type */}
          <div className="flex items-center gap-2">
            {emergencyIcon}
            <span className="font-bold text-gray-900 text-lg">{sos.emergencyType?.replace(/_/g, ' ')}</span>
            <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
              #{sos.id?.slice(-6)}
            </span>
          </div>

          {/* Customer info */}
          <div className="bg-gray-50 rounded-xl p-4 space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Customer</h4>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User size={16} className="text-blue-600"/>
                <span className="font-semibold text-gray-800">{sos.customerName}</span>
              </div>
              {sos.customerPhone && (
                <a href={`tel:${sos.customerPhone}`}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-700">
                  <Phone size={14}/> Call
                </a>
              )}
            </div>
            {sos.customerPhone && (
              <p className="text-sm text-gray-500 pl-6">{sos.customerPhone}</p>
            )}
          </div>

          {/* Vehicle info */}
          {(sos.vehicleNumber || sos.vehicleBrand) && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Vehicle</h4>
              <div className="flex items-center gap-2 text-gray-800">
                <Car size={16} className="text-blue-500"/>
                <span className="font-medium">
                  {[sos.vehicleBrand, sos.vehicleModel, sos.vehicleNumber].filter(Boolean).join(' · ')}
                </span>
              </div>
              <div className="mt-2 flex gap-3 text-xs text-gray-500">
                <span>Status: <b>{sos.vehicleStatus?.replace(/_/g,' ')}</b></span>
                <span>Traffic: <b className={sos.trafficImpact === 'BLOCKING_TRAFFIC' ? 'text-orange-600' : 'text-green-600'}>
                  {sos.trafficImpact === 'BLOCKING_TRAFFIC' ? 'Blocking' : 'Clear'}
                </b></span>
              </div>
            </div>
          )}

          {/* Location + ETA */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Location</h4>
            <p className="text-sm text-gray-700 mb-2 leading-relaxed">
              {sos.address || 'Location coordinates available'}
            </p>
            {sos.estimatedArrivalMinutes && ['WORKER_ASSIGNED','WORKER_EN_ROUTE'].includes(sos.status) && (
              <div className="flex items-center gap-2 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 mb-2">
                <Timer size={13}/> ETA ~{sos.estimatedArrivalMinutes} min
                {sos.distanceToWorkerKm && <span>· {sos.distanceToWorkerKm} km</span>}
              </div>
            )}
            {mapsLink && (
              <a href={mapsLink} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors">
                <Navigation size={15}/> Navigate to Customer
              </a>
            )}
          </div>

          {/* Injury alert */}
          {sos.injuryStatus === 'INJURED' && (
            <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5"/>
              <div>
                <p className="text-sm font-bold text-red-700">Injury Reported at this Location</p>
                <p className="text-xs text-red-600 mt-0.5">
                  Proceed with caution. If serious, ensure emergency services (112) have been contacted.
                </p>
              </div>
            </div>
          )}

          {/* Additional notes */}
          {sos.additionalDescription && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <h4 className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">Customer Notes</h4>
              <p className="text-sm text-amber-800">{sos.additionalDescription}</p>
            </div>
          )}

          {/* Chat widget */}
          {!isCancelled && sos.chatRoomId && (
            <WorkerChatWidget
              chatRoomId={sos.chatRoomId}
              workerId={workerId}
              customerName={sos.customerName}
              sosId={sos.id}
            />
          )}

          {/* Action button */}
          {!isCompleted && !isCancelled && action ? (
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleAction}
              disabled={updating}
              className={`w-full py-4 rounded-2xl text-white font-bold text-base flex items-center justify-center gap-2 transition-colors ${action.color}`}
            >
              {updating
                ? <><Loader2 size={18} className="animate-spin"/> Updating…</>
                : <>{action.label} <Navigation size={18}/></>
              }
            </motion.button>
          ) : isCompleted ? (
            <div className="w-full py-4 rounded-2xl bg-green-100 text-green-700 font-bold text-base flex items-center justify-center gap-2">
              <CheckCircle size={18}/> Service Completed – Well Done!
            </div>
          ) : isCancelled ? (
            <div className="w-full py-3 rounded-2xl bg-gray-100 text-gray-500 text-sm flex items-center justify-center gap-2">
              <XCircle size={16}/> Request was cancelled
            </div>
          ) : null}
        </div>
      </motion.div>

      {showComplete && (
        <ConfirmCompleteModal
          loading={updating}
          onConfirm={() => doUpdate('SERVICE_COMPLETED')}
          onCancel={() => setShowComplete(false)}
        />
      )}
    </>
  );
};

// ── Worker SOS Dashboard ───────────────────────────────────────────────────

const WorkerSOSPage = () => {
  const { worker } = useOutletContext() || {};
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const workerId = worker?.id;

  const fetchAssignments = useCallback(async () => {
    if (!workerId) return;
    try {
      const data = await getActiveSosForWorker(workerId);
      setAssignments(data);
      setLastRefresh(new Date());
    } catch (e) {
      console.error('[WorkerSOS]', e);
    } finally {
      setLoading(false);
    }
  }, [workerId]);

  useEffect(() => {
    fetchAssignments();
    const id = setInterval(fetchAssignments, 10000);
    return () => clearInterval(id);
  }, [fetchAssignments]);

  const active    = assignments.filter(a => a.status !== 'SERVICE_COMPLETED' && a.status !== 'CANCELLED');
  const completed = assignments.filter(a => a.status === 'SERVICE_COMPLETED' || a.status === 'CANCELLED');

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle size={24} className="text-red-600"/> SOS Assignments
          </h1>
          <p className="text-sm text-gray-400">
            Auto-refreshes every 10s · {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <button onClick={fetchAssignments}
          className="flex items-center gap-2 text-sm text-blue-600 hover:bg-blue-50 px-3 py-2 rounded-xl border border-blue-200">
          <RefreshCw size={15}/> Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-red-500"/>
        </div>
      ) : assignments.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-600"/>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active SOS Assignments</h3>
          <p className="text-gray-400 text-sm">New emergency assignments appear here automatically.</p>
          <p className="text-gray-400 text-xs mt-1">Make sure your availability is set to <b>AVAILABLE</b> to receive requests.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active assignments */}
          {active.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Active ({active.length})
              </p>
              <div className="space-y-5">
                {active.map(sos => (
                  <SOSAssignmentCard
                    key={sos.id}
                    sos={sos}
                    workerId={workerId}
                    onStatusUpdate={fetchAssignments}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recently completed */}
          {completed.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                Completed / Cancelled ({completed.length})
              </p>
              <div className="space-y-3">
                {completed.map(sos => (
                  <SOSAssignmentCard
                    key={sos.id}
                    sos={sos}
                    workerId={workerId}
                    onStatusUpdate={fetchAssignments}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WorkerSOSPage;
