import { useState, useEffect, useRef } from "react";
import {
  Wrench, Car, Truck, Bus, Bike, Calendar, Clock, Hash,
  Settings, Search, AlertTriangle, X, ChevronRight,
  Info, CarFront, Loader2, User, Phone, Star, CheckCircle2,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";

const API_URL     = "http://localhost:8080/api/services/all";
const BASE_URL    = "http://localhost:8080";

function getVehicleIcon(type = "") {
  const t = type?.toLowerCase();
  if (t === "truck")      return <Truck className="w-6 h-6 text-blue-500" />;
  if (t === "bus")        return <Bus className="w-6 h-6 text-blue-500" />;
  if (t === "motorcycle") return <Bike className="w-6 h-6 text-blue-500" />;
  return <CarFront className="w-6 h-6 text-blue-500" />;
}

function formatDate(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric",
  });
}

function formatDateLong(dateStr) {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric", year: "numeric",
  });
}

// ── Worker Assignment Banner ───────────────────────────────────────────
function WorkerAssignedBanner({ notification, onDismiss }) {
  if (!notification) return null;
  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-green-200 rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-4">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-green-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="font-bold text-gray-900 text-sm">Worker Assigned!</p>
          </div>
          <p className="text-gray-700 text-sm font-semibold">{notification.workerName}</p>
          <p className="text-gray-500 text-xs">{notification.workerRole}</p>
          {notification.workerPhone && (
            <p className="flex items-center gap-1 text-gray-500 text-xs mt-1">
              <Phone className="w-3 h-3" /> {notification.workerPhone}
            </p>
          )}
          {notification.workerRating > 0 && (
            <p className="flex items-center gap-1 text-amber-500 text-xs mt-0.5">
              <Star className="w-3 h-3 fill-amber-400" />
              {Number(notification.workerRating).toFixed(1)} rating
            </p>
          )}
          {notification.workerSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {notification.workerSkills.slice(0, 3).map(s => (
                <span key={s} className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md border border-blue-100">{s}</span>
              ))}
            </div>
          )}
        </div>
        <button onClick={onDismiss} className="text-gray-400 hover:text-gray-600 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────
function Modal({ service, assignmentMap, onClose }) {
  if (!service) return null;
  const { id, vehicalType, vehicleType, selectedVehicle, serviceMode, selectedTime, selectedDate, status } = service;
  const assignment = assignmentMap?.[id];

  const rows = [
    { icon: <Hash className="w-4 h-4" />,      label: "Service ID",       value: `#${id}` },
    { icon: <Car className="w-4 h-4" />,        label: "Vehicle Type",     value: vehicalType || vehicleType || "—" },
    { icon: <CarFront className="w-4 h-4" />,   label: "Selected Vehicle", value: selectedVehicle || "—" },
    { icon: <Settings className="w-4 h-4" />,   label: "Service Mode",     value: serviceMode || "—" },
    { icon: <Calendar className="w-4 h-4" />,   label: "Scheduled Date",   value: formatDateLong(selectedDate) },
    { icon: <Clock className="w-4 h-4" />,      label: "Scheduled Time",   value: selectedTime || "—" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-2xl border border-blue-100 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-blue-500">Service Details</h2>
              <p className="text-blue-400 text-sm">Full information for this booking</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-100 text-blue-500 hover:bg-blue-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className={`mb-4 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2
            ${status === "ASSIGNED" || status === "IN_PROGRESS" ? "bg-green-50 text-green-700 border border-green-200" :
              status === "COMPLETED" ? "bg-gray-50 text-gray-600 border border-gray-200" :
              "bg-blue-50 text-blue-700 border border-blue-200"}`}>
            <CheckCircle2 className="w-3.5 h-3.5" />
            {status}
          </div>
        )}

        {/* Rows */}
        <div className="flex flex-col gap-2.5">
          {rows.map(({ icon, label, value }) => (
            <div
              key={label}
              className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-3 border border-blue-100"
            >
              <div className="flex items-center gap-2 text-blue-400">
                {icon}
                <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
              </div>
              <span className="text-sm font-bold text-blue-500 text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Assigned Worker Section */}
        {assignment && (
          <div className="mt-5 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" /> Assigned Worker
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-700 font-bold">
                {assignment.workerName?.charAt(0) || "W"}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">{assignment.workerName}</p>
                <p className="text-gray-500 text-xs">{assignment.workerRole}</p>
              </div>
            </div>
            {assignment.workerPhone && (
              <p className="flex items-center gap-1.5 text-gray-600 text-sm mt-2">
                <Phone className="w-3.5 h-3.5 text-green-600" />
                {assignment.workerPhone}
              </p>
            )}
            {assignment.workerRating > 0 && (
              <p className="flex items-center gap-1 text-amber-600 text-sm mt-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                {Number(assignment.workerRating).toFixed(1)} / 5
              </p>
            )}
            {assignment.workerSkills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {assignment.workerSkills.map(s => (
                  <span key={s} className="text-xs bg-white text-blue-600 px-2 py-0.5 rounded-lg border border-blue-100">{s}</span>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onClose}
          className="mt-6 w-full py-3 bg-linear-to-r from-blue-700 to-blue-500 text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// ── Service Card ───────────────────────────────────────────────────────
function ServiceCard({ service, onMoreInfo, hasAssignment }) {
  const { id, vehicalType, vehicleType, selectedVehicle, serviceMode, selectedTime, selectedDate } = service;

  return (
    <div className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden relative
      ${hasAssignment ? "border-green-200 shadow-green-100" : "border-blue-100 hover:shadow-blue-200"}`}>
      {/* Top accent */}
      <div className={`h-1.5 ${hasAssignment ? "bg-linear-to-r from-green-500 to-green-400" : "bg-linear-to-r from-blue-700 to-blue-400"}`} />

      {/* Worker Assigned Badge */}
      {hasAssignment && (
        <div className="absolute top-3 right-3 bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full border border-green-200 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> Worker Assigned
        </div>
      )}

      <div className="p-6">
        {/* Card Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            {getVehicleIcon(vehicalType || vehicleType)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-blue-500 text-base truncate pr-20">
              {selectedVehicle || "Unknown Vehicle"}
            </p>
            <p className="text-blue-400 text-xs font-medium mt-0.5">{vehicalType || vehicleType || "—"}</p>
          </div>
          <span className="shrink-0 text-xs font-semibold text-blue-500 bg-blue-50 border border-blue-200 rounded-full px-3 py-1">
            {serviceMode || "—"}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Calendar className="w-3.5 h-3.5 text-blue-300" />
              <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">Date</p>
            </div>
            <p className="text-sm font-bold text-blue-500">{formatDate(selectedDate)}</p>
          </div>
          <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-blue-300" />
              <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">Time</p>
            </div>
            <p className="text-sm font-bold text-blue-500">{selectedTime || "N/A"}</p>
          </div>
          <div className="col-span-2 bg-blue-50 rounded-xl p-3 border border-blue-100">
            <div className="flex items-center gap-1.5 mb-1">
              <Hash className="w-3.5 h-3.5 text-blue-300" />
              <p className="text-xs text-blue-300 font-semibold uppercase tracking-wide">Service ID</p>
            </div>
            <p className="text-sm font-bold text-blue-500">#{id}</p>
          </div>
        </div>

        {/* Button */}
        <button
          onClick={() => onMoreInfo(service)}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-linear-to-r from-blue-700 to-blue-500 text-white rounded-xl text-sm font-bold hover:opacity-90 hover:scale-[1.02] transition-all duration-150"
        >
          <Info className="w-4 h-4" />
          More Info
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────
export default function ServiceHistory() {
  const [services, setServices]               = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [error, setError]                     = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [search, setSearch]                   = useState("");
  // Map of serviceRequestId → worker assignment data (from SSE)
  const [assignmentMap, setAssignmentMap]     = useState({});
  // Latest assignment for the floating banner
  const [latestAssignment, setLatestAssignment] = useState(null);

  const sseRef   = useRef(null);
  const userRef  = useRef(null);  // stores { userId }

  // ── Load customer userId from auth ──────────────────────────────────
  useEffect(() => {
    fetch("http://localhost:8080/api/auth/me", { credentials: "include" })
      .then(r => r.json())
      .then(me => { userRef.current = { userId: me.id || me.userId }; })
      .catch(() => {});
  }, []);

  // ── Load service history ─────────────────────────────────────────────
  useEffect(() => {
    fetch(API_URL, { credentials: "include" })
      .then(res => {
        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
        return res.json();
      })
      .then(data => { setServices(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  // ── SSE subscription for worker assignment events ────────────────────
  useEffect(() => {
    // Wait for userId to be available
    const openSse = (userId) => {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }

      const es = new EventSource(
        `${BASE_URL}/api/notifications/subscribe/${userId}`,
        { withCredentials: true }
      );
      sseRef.current = es;

      es.addEventListener("connected", () => {
        console.log("[SSE] Customer stream connected");
      });

      // Worker assigned to one of the customer's requests
      es.addEventListener("worker_assigned_to_customer", (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("[SSE] worker_assigned_to_customer", data);

          const { requestId } = data;

          // Store in assignmentMap so cards & modal can show it
          setAssignmentMap(prev => ({ ...prev, [requestId]: data }));

          // Show floating banner
          setLatestAssignment(data);

          // Also update the service list entry's status
          setServices(prev => prev.map(s =>
            s.id === requestId ? { ...s, status: "ASSIGNED" } : s
          ));

          // Toast
          toast.success(
            `Worker assigned: ${data.workerName} (${data.workerRole})`,
            { duration: 6000, icon: "👷" }
          );
        } catch (err) {
          console.error("[SSE] parse error", err);
        }
      });

      es.onerror = () => {
        es.close();
        sseRef.current = null;
        setTimeout(() => {
          const uid = userRef.current?.userId;
          if (uid) openSse(uid);
        }, 5000);
      };
    };

    // Try immediately; if userId not ready yet, poll briefly
    const tryConnect = () => {
      const uid = userRef.current?.userId;
      if (uid) { openSse(uid); return; }
      // Retry up to 3 s
      let attempts = 0;
      const interval = setInterval(() => {
        const uid2 = userRef.current?.userId;
        if (uid2) { clearInterval(interval); openSse(uid2); }
        if (++attempts > 6) clearInterval(interval); // give up after ~3 s
      }, 500);
    };
    tryConnect();

    return () => {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    };
  }, []);

  const filtered = services.filter(s =>
    !search ||
    s.selectedVehicle?.toLowerCase().includes(search.toLowerCase()) ||
    s.vehicalType?.toLowerCase().includes(search.toLowerCase()) ||
    s.vehicleType?.toLowerCase().includes(search.toLowerCase()) ||
    s.serviceMode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100">
      <Toaster position="top-right" />

      {/* ── Header ── */}
      <header className="bg-linear-to-r from-blue-600 to-blue-500 shadow-xl px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight">Service History</h1>
            <p className="text-blue-300 text-sm mt-0.5">All your booked vehicle services</p>
          </div>
        </div>
      </header>

      {/* ── Content ── */}
      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* Search + Count */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <div className="relative flex-1 min-w-55">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by vehicle, type or mode…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 border border-blue-200 rounded-xl text-sm text-blue-500 bg-white placeholder-blue-300 outline-none focus:ring-2 focus:ring-blue-400 shadow-sm"
            />
          </div>
          {!loading && !error && (
            <div className="bg-white border border-blue-200 rounded-xl px-5 py-2.5 text-sm font-bold text-blue-700 whitespace-nowrap shadow-sm">
              {filtered.length} {filtered.length === 1 ? "Service" : "Services"}
            </div>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-blue-500 font-semibold">Loading services…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-white border border-red-200 rounded-2xl p-10 text-center shadow-sm">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-red-500 font-bold text-lg mb-1">Failed to fetch services</p>
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="bg-white border border-blue-100 rounded-2xl p-16 text-center shadow-sm">
            <Search className="w-12 h-12 text-blue-200 mx-auto mb-4" />
            <p className="text-blue-500 font-bold text-xl">No services found</p>
            <p className="text-blue-400 mt-2 text-sm">Try adjusting your search</p>
          </div>
        )}

        {/* Grid */}
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                onMoreInfo={setSelectedService}
                hasAssignment={!!assignmentMap[service.id]}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals & Overlays */}
      <Modal
        service={selectedService}
        assignmentMap={assignmentMap}
        onClose={() => setSelectedService(null)}
      />

      <WorkerAssignedBanner
        notification={latestAssignment}
        onDismiss={() => setLatestAssignment(null)}
      />
    </div>
  );
}
