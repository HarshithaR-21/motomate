import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const BASE = "http://localhost:8080/api";

// Priority badge colours
const PRIORITY_STYLE = {
  EMERGENCY: "bg-red-600 text-white animate-pulse",
  HIGH:      "bg-orange-500 text-white",
  NORMAL:    "bg-yellow-400 text-black",
};

// Status badge colours
const STATUS_STYLE = {
  SOS_SUBMITTED:         "bg-red-100 text-red-700 border border-red-300",
  SERVICE_CENTER_ACCEPTED:"bg-blue-100 text-blue-700 border border-blue-300",
  WORKER_ASSIGNED:        "bg-indigo-100 text-indigo-700 border border-indigo-300",
  WORKER_EN_ROUTE:        "bg-purple-100 text-purple-700 border border-purple-300",
  WORKER_ARRIVED:         "bg-teal-100 text-teal-700 border border-teal-300",
  SERVICE_IN_PROGRESS:    "bg-green-100 text-green-700 border border-green-300",
  SERVICE_COMPLETED:      "bg-gray-100 text-gray-600 border border-gray-300",
  CANCELLED:              "bg-red-50 text-red-400 border border-red-200",
};

const STATUS_LABEL = {
  SOS_SUBMITTED:          "Pending — Awaiting Response",
  SERVICE_CENTER_ACCEPTED:"Accepted — Assign Worker",
  WORKER_ASSIGNED:        "Worker Assigned",
  WORKER_EN_ROUTE:        "Worker En Route",
  WORKER_ARRIVED:         "Worker Arrived",
  SERVICE_IN_PROGRESS:    "In Progress",
  SERVICE_COMPLETED:      "Completed",
  CANCELLED:              "Cancelled",
};

const EMERGENCY_LABEL = {
  ACCIDENT:          "🚨 Accident",
  VEHICLE_BREAKDOWN: "🔧 Breakdown",
  FLAT_TYRE:         "🛞 Flat Tyre",
  BATTERY_DEAD:      "🔋 Battery Dead",
  ENGINE_FAILURE:    "⚙️ Engine Failure",
  FUEL_EMPTY:        "⛽ Fuel Empty",
  SAFETY_CONCERN:    "⚠️ Safety Concern",
  OTHER:             "❓ Other",
};

export default function SOSDashboard() {
  const scId = localStorage.getItem("userId");

  const [requests,       setRequests]       = useState([]);
  const [selected,       setSelected]       = useState(null);
  const [loading,        setLoading]        = useState(true);
  const [actionLoading,  setActionLoading]  = useState(false);
  const [error,          setError]          = useState(null);
  const [workers,        setWorkers]        = useState([]);
  const [showWorkers,    setShowWorkers]    = useState(false);
  const [alertSosId,     setAlertSosId]     = useState(null); // new SOS alert popup
  const [tab,            setTab]            = useState("active"); // active | history

  const sseRef = useRef(null);

  // ── Fetch incoming SOS ────────────────────────────────────────────────────
  const fetchRequests = useCallback(async () => {
    if (!scId) return;
    try {
      const res = await fetch(`${BASE}/sos/service-center/${scId}/incoming`);
      if (!res.ok) throw new Error("Failed to fetch SOS list");
      const data = await res.json();
      setRequests(data);

      // Refresh selected card if open
      setSelected(prev => {
        if (!prev) return prev;
        const updated = data.find(d => d.id === prev.id);
        return updated || prev;
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [scId]);

  // ── SSE connection ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!scId) return;
    fetchRequests();

    const connectSSE = () => {
      const es = new EventSource(`${BASE}/notifications/subscribe/${scId}`, { withCredentials: true });
      sseRef.current = es;

      es.addEventListener('connected', () => {
        console.log('[SOSDashboard-SSE] Connected');
      });

      // New broadcast SOS arrived for this center
      es.addEventListener('NEW_SOS_REQUEST', (e) => {
        try {
          const data = JSON.parse(e.data);
          setAlertSosId(data?.sosId);
        } catch {}
        fetchRequests();
      });

      // SOS taken by another center, cancelled, status updated, worker needed, etc.
      ['SOS_TAKEN', 'SOS_CANCELLED', 'SOS_STATUS_UPDATE',
       'WORKER_ASSIGNED', 'SOS_NEEDS_WORKER', 'SOS_AUTO_ASSIGNED_TO_YOU'].forEach(evtName => {
        es.addEventListener(evtName, () => fetchRequests());
      });

      es.onerror = () => {
        es.close();
        sseRef.current = null;
        setTimeout(connectSSE, 4000);
      };
    };

    connectSSE();
    const poller = setInterval(fetchRequests, 20000);
    return () => {
      sseRef.current?.close();
      sseRef.current = null;
      clearInterval(poller);
    };
  }, [scId, fetchRequests]);

  // ── Accept SOS ────────────────────────────────────────────────────────────
  const handleAccept = async (sosId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE}/sos/${sosId}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceCenterId: scId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept");

      await fetchRequests();
      setSelected(data);

      // If backend didn't auto-assign a worker, open worker list
      if (data.status === "SERVICE_CENTER_ACCEPTED") {
        setShowWorkers(true);
        loadAvailableWorkers(sosId);
      }
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Reject SOS ────────────────────────────────────────────────────────────
  const handleReject = async (sosId) => {
    const reason = prompt("Reason for rejection (optional):");
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE}/sos/${sosId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceCenterId: scId, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reject");
      await fetchRequests();
      setSelected(null);
    } catch (e) {
      alert("Error: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Load available workers ─────────────────────────────────────────────────
  const loadAvailableWorkers = async (sosId) => {
    try {
      const res = await fetch(
        `${BASE}/sos/${sosId}/available-workers?serviceCenterId=${scId}`
      );
      if (!res.ok) throw new Error("Failed to load workers");
      setWorkers(await res.json());
    } catch (e) {
      alert("Could not load workers: " + e.message);
    }
  };

  // ── Assign worker manually ────────────────────────────────────────────────
  const handleAssignWorker = async (sosId, workerId) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${BASE}/sos/${sosId}/assign-worker`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to assign");
      setSelected(data);
      setShowWorkers(false);
      await fetchRequests();
    } catch (e) {
      alert("Error assigning worker: " + e.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ── Derived lists ─────────────────────────────────────────────────────────
  const activeReqs  = requests.filter(r =>
    !["SERVICE_COMPLETED", "CANCELLED"].includes(r.status));
  const historyReqs = requests.filter(r =>
    ["SERVICE_COMPLETED", "CANCELLED"].includes(r.status));

  const displayed = tab === "active" ? activeReqs : historyReqs;

  // ─────────────────────────────────────────────────────────────────────────

  if (!scId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500 font-semibold">
          Service Center ID not found. Please log in again.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Alert popup for NEW incoming SOS ─────────────────────────────── */}
      <AnimatePresence>
        {alertSosId && (
          <motion.div
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white
                       rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4 min-w-80"
          >
            <span className="text-2xl animate-bounce">🚨</span>
            <div>
              <p className="font-bold text-lg">New Emergency SOS!</p>
              <p className="text-sm opacity-90">
                A customer needs urgent help. Please review and respond.
              </p>
            </div>
            <button
              onClick={() => {
                setAlertSosId(null);
                const found = requests.find(r => r.id === alertSosId);
                if (found) setSelected(found);
              }}
              className="ml-auto bg-white text-red-600 px-3 py-1 rounded-lg font-bold
                         hover:bg-red-50 transition-colors text-sm"
            >
              View
            </button>
            <button
              onClick={() => setAlertSosId(null)}
              className="text-white/70 hover:text-white text-xl leading-none"
            >
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              🚨 SOS Emergency Dashboard
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Incoming emergency requests from nearby customers
            </p>
          </div>
          <button
            onClick={fetchRequests}
            className="flex items-center gap-2 bg-white border border-gray-200 text-gray-600
                       px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: "Pending",   value: requests.filter(r => r.status === "SOS_SUBMITTED").length,  color: "text-red-600",    bg: "bg-red-50"   },
            { label: "Accepted",  value: requests.filter(r => r.status === "SERVICE_CENTER_ACCEPTED" || r.status === "WORKER_ASSIGNED").length, color: "text-blue-600",   bg: "bg-blue-50"  },
            { label: "Active",    value: requests.filter(r => ["WORKER_EN_ROUTE","WORKER_ARRIVED","SERVICE_IN_PROGRESS"].includes(r.status)).length, color: "text-green-600",  bg: "bg-green-50" },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3 shadow-sm`}>
              <span className={`text-3xl font-extrabold ${s.color}`}>{s.value}</span>
              <span className="text-gray-600 font-medium">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-5">
          {["active", "history"].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-5 py-2 rounded-lg font-semibold text-sm transition-colors
                ${tab === t
                  ? "bg-red-600 text-white shadow"
                  : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              {t === "active" ? "🔴 Active / Pending" : "📋 History"}
            </button>
          ))}
        </div>

        {/* Main content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center text-red-600">
            {error}
          </div>
        ) : displayed.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <p className="text-4xl mb-3">
              {tab === "active" ? "✅" : "📭"}
            </p>
            <p className="text-gray-500 font-medium">
              {tab === "active"
                ? "No active or pending SOS requests"
                : "No completed SOS history yet"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {displayed.map(req => (
              <SOSCard
                key={req.id}
                req={req}
                isSelected={selected?.id === req.id}
                onSelect={() => {
                  setSelected(req);
                  setShowWorkers(false);
                }}
                onAccept={() => handleAccept(req.id)}
                onReject={() => handleReject(req.id)}
                onAssignWorker={() => {
                  setSelected(req);
                  loadAvailableWorkers(req.id);
                  setShowWorkers(true);
                }}
                actionLoading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Detail / Worker-assign drawer ─────────────────────────────────── */}
      <AnimatePresence>
        {selected && (
          <SOSDetailDrawer
            sos={selected}
            scId={scId}
            showWorkers={showWorkers}
            workers={workers}
            actionLoading={actionLoading}
            onClose={() => { setSelected(null); setShowWorkers(false); }}
            onAccept={() => handleAccept(selected.id)}
            onReject={() => handleReject(selected.id)}
            onAssignWorker={(wid) => handleAssignWorker(selected.id, wid)}
            onOpenWorkers={() => {
              loadAvailableWorkers(selected.id);
              setShowWorkers(true);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── SOS Card ──────────────────────────────────────────────────────────────────
function SOSCard({ req, isSelected, onSelect, onAccept, onReject, onAssignWorker, actionLoading }) {
  const isPending  = req.status === "SOS_SUBMITTED";
  const isAccepted = req.status === "SERVICE_CENTER_ACCEPTED";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`bg-white rounded-xl border-2 shadow-sm cursor-pointer transition-all
        ${isPending
          ? "border-red-400 shadow-red-100"
          : isSelected
            ? "border-blue-400 shadow-blue-100"
            : "border-gray-200 hover:border-gray-300"}`}
      onClick={onSelect}
    >
      <div className="p-4">
        {/* Top row */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-bold px-2 py-1 rounded-full
              ${PRIORITY_STYLE[req.priorityLevel] || "bg-gray-100 text-gray-600"}`}>
              {req.priorityLevel === "EMERGENCY" ? "🚨" : req.priorityLevel === "HIGH" ? "⚠️" : "🟡"}
              {" "}{req.priorityLevel}
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium
              ${STATUS_STYLE[req.status] || "bg-gray-100 text-gray-600"}`}>
              {STATUS_LABEL[req.status] || req.status}
            </span>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {req.minutesSinceRequest != null
              ? `${req.minutesSinceRequest}m ago`
              : ""}
          </span>
        </div>

        {/* Emergency type */}
        <p className="font-semibold text-gray-900 text-base mb-1">
          {EMERGENCY_LABEL[req.emergencyType] || req.emergencyType}
        </p>

        {/* Customer */}
        <p className="text-sm text-gray-600 mb-1">
          👤 {req.customerName || "Customer"}
          {req.customerPhone && (
            <a
              href={`tel:${req.customerPhone}`}
              className="ml-2 text-blue-600 hover:underline"
              onClick={e => e.stopPropagation()}
            >
              📞 {req.customerPhone}
            </a>
          )}
        </p>

        {/* Location */}
        {req.address && (
          <p className="text-xs text-gray-500 truncate mb-2">
            📍 {req.address}
          </p>
        )}

        {/* Vehicle */}
        {req.vehicleNumber && (
          <p className="text-xs text-gray-500 mb-3">
            🚗 {req.vehicleBrand} {req.vehicleModel} · {req.vehicleNumber}
          </p>
        )}

        {/* Worker assigned */}
        {req.assignedWorkerName && (
          <p className="text-xs text-indigo-600 bg-indigo-50 rounded px-2 py-1 mb-3">
            👷 Worker: {req.assignedWorkerName}
            {req.assignedWorkerPhone && ` · ${req.assignedWorkerPhone}`}
          </p>
        )}

        {/* Action buttons */}
        {(isPending || isAccepted) && (
          <div className="flex gap-2 mt-2" onClick={e => e.stopPropagation()}>
            {isPending && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={onAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-bold
                             py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  ✅ Accept
                </button>
                <button
                  disabled={actionLoading}
                  onClick={onReject}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 text-sm font-bold
                             py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  ✗ Reject
                </button>
              </>
            )}
            {isAccepted && (
              <button
                disabled={actionLoading}
                onClick={onAssignWorker}
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold
                           py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                👷 Assign Worker
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Detail Drawer ─────────────────────────────────────────────────────────────
function SOSDetailDrawer({
  sos, scId, showWorkers, workers, actionLoading,
  onClose, onAccept, onReject, onAssignWorker, onOpenWorkers
}) {
  const isPending  = sos.status === "SOS_SUBMITTED";
  const isAccepted = sos.status === "SERVICE_CENTER_ACCEPTED";
  const isOurs     = sos.assignedServiceCenterId === scId;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <h2 className="font-bold text-gray-900 text-lg">SOS Details</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium
                ${STATUS_STYLE[sos.status] || ""}`}>
                {STATUS_LABEL[sos.status] || sos.status}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Priority */}
          <div className={`rounded-xl p-3 flex items-center gap-3
            ${sos.priorityLevel === "EMERGENCY" ? "bg-red-50 border border-red-200"
            : sos.priorityLevel === "HIGH" ? "bg-orange-50 border border-orange-200"
            : "bg-yellow-50 border border-yellow-200"}`}>
            <span className="text-2xl">
              {sos.priorityLevel === "EMERGENCY" ? "🚨" : sos.priorityLevel === "HIGH" ? "⚠️" : "🟡"}
            </span>
            <div>
              <p className="font-bold text-gray-900">{sos.priorityLevel} PRIORITY</p>
              <p className="text-xs text-gray-600">Score: {sos.priorityScore}</p>
            </div>
          </div>

          {/* Emergency type */}
          <DetailRow label="Emergency" value={EMERGENCY_LABEL[sos.emergencyType] || sos.emergencyType} />

          {/* Customer */}
          <DetailRow label="Customer" value={
            <span>
              {sos.customerName}
              {sos.customerPhone && (
                <a href={`tel:${sos.customerPhone}`}
                   className="ml-2 text-blue-600 hover:underline text-sm">
                  📞 {sos.customerPhone}
                </a>
              )}
            </span>
          } />

          {/* Vehicle */}
          {sos.vehicleNumber && (
            <DetailRow label="Vehicle" value={
              `${sos.vehicleBrand || ""} ${sos.vehicleModel || ""} · ${sos.vehicleNumber}`.trim()
            } />
          )}

          {/* Location */}
          {sos.address && <DetailRow label="Location" value={`📍 ${sos.address}`} />}
          {sos.latitude && (
            <a
              href={`https://maps.google.com/?q=${sos.latitude},${sos.longitude}`}
              target="_blank"
              rel="noreferrer"
              className="block text-blue-600 text-sm hover:underline"
            >
              🗺️ Open in Google Maps
            </a>
          )}

          {/* Injury / Vehicle status / Traffic */}
          <div className="grid grid-cols-3 gap-2">
            <Chip label="Injury" value={sos.injuryStatus === "INJURED" ? "🩹 Yes" : "✅ No"}
              danger={sos.injuryStatus === "INJURED"} />
            <Chip label="Can Move" value={
              sos.vehicleStatus === "CANNOT_MOVE" ? "❌ No"
              : sos.vehicleStatus === "MOVE_SLOWLY" ? "🐢 Slowly"
              : "✅ Yes"
            } danger={sos.vehicleStatus === "CANNOT_MOVE"} />
            <Chip label="Traffic" value={
              sos.trafficImpact === "BLOCKING_TRAFFIC" ? "🚦 Blocking" : "✅ Clear"
            } danger={sos.trafficImpact === "BLOCKING_TRAFFIC"} />
          </div>

          {/* Additional notes */}
          {sos.additionalDescription && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
              <p className="text-xs text-gray-500 font-medium mb-1">Customer Notes</p>
              <p className="text-sm text-gray-700">{sos.additionalDescription}</p>
            </div>
          )}

          {/* Worker info */}
          {sos.assignedWorkerName && (
            <div className="bg-indigo-50 rounded-xl p-3 border border-indigo-100">
              <p className="text-xs text-indigo-500 font-medium mb-1">Assigned Worker</p>
              <p className="text-sm font-semibold text-indigo-800">👷 {sos.assignedWorkerName}</p>
              {sos.assignedWorkerPhone && (
                <a href={`tel:${sos.assignedWorkerPhone}`} className="text-blue-600 text-xs hover:underline">
                  📞 {sos.assignedWorkerPhone}
                </a>
              )}
              {sos.estimatedArrivalMinutes && (
                <p className="text-xs text-indigo-600 mt-1">⏱️ ETA: ~{sos.estimatedArrivalMinutes} min</p>
              )}
            </div>
          )}

          {/* Time info */}
          <p className="text-xs text-gray-400">
            Submitted: {sos.createdAt
              ? new Date(sos.createdAt).toLocaleString()
              : "Unknown"}
            {sos.minutesSinceRequest != null && ` · ${sos.minutesSinceRequest}m ago`}
          </p>

          {/* ── Worker selection panel ─────────────────────────────────── */}
          {showWorkers && isOurs && (
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                👷 Select a Worker to Assign
              </h3>
              {workers.length === 0 ? (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center text-orange-700 text-sm">
                  No available workers right now. Workers become available after completing jobs.
                </div>
              ) : (
                <div className="space-y-2">
                  {workers.map(w => (
                    <div key={w.workerId}
                      className="flex items-center justify-between bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <div>
                        <p className="font-semibold text-gray-800">{w.workerName}</p>
                        {w.workerPhone && (
                          <p className="text-xs text-gray-500">{w.workerPhone}</p>
                        )}
                        {w.distanceKm != null && (
                          <p className="text-xs text-blue-600">📍 {w.distanceKm} km away</p>
                        )}
                      </div>
                      <button
                        disabled={actionLoading}
                        onClick={() => onAssignWorker(w.workerId)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-1.5 rounded-lg
                                   text-sm font-bold transition-colors disabled:opacity-50"
                      >
                        Assign
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {(isPending || isAccepted) && (
          <div className="p-5 border-t border-gray-100 flex gap-3">
            {isPending && (
              <>
                <button
                  disabled={actionLoading}
                  onClick={onAccept}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3
                             rounded-xl transition-colors disabled:opacity-50"
                >
                  ✅ Accept SOS
                </button>
                <button
                  disabled={actionLoading}
                  onClick={onReject}
                  className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 font-bold py-3
                             rounded-xl transition-colors disabled:opacity-50"
                >
                  ✗ Reject
                </button>
              </>
            )}
            {isAccepted && isOurs && !showWorkers && (
              <button
                disabled={actionLoading}
                onClick={onOpenWorkers}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3
                           rounded-xl transition-colors disabled:opacity-50"
              >
                👷 Assign Worker
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Helper components ─────────────────────────────────────────────────────────
function DetailRow({ label, value }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-gray-400 font-medium w-20 shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value}</span>
    </div>
  );
}

function Chip({ label, value, danger }) {
  return (
    <div className={`rounded-xl p-2 border text-center
      ${danger ? "bg-red-50 border-red-200" : "bg-gray-50 border-gray-100"}`}>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`text-xs font-semibold ${danger ? "text-red-700" : "text-gray-700"}`}>
        {value}
      </p>
    </div>
  );
}
