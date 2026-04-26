import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench, Car, Clock, CheckCircle2, User, Phone,
  Star, ArrowLeft, Loader2, AlertTriangle, Bell,
  MapPin, Calendar, X, Navigation, Search,
  Package, Hammer, FlaskConical, Flag, Shield,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Navigation2 from "../../Components/Navigation";
import Footer from "../../Components/Footer";

const BASE_URL = "http://localhost:8080";
const POLL_MS = 15_000;

const MILESTONES = [
  { status: "PENDING", label: "Booking Placed", desc: "Your service request has been received", icon: Clock, color: "yellow" },
  { status: "ACCEPTED", label: "Booking Confirmed", desc: "Service center has accepted your booking", icon: CheckCircle2, color: "blue" },
  { status: "ASSIGNED", label: "Worker Assigned", desc: "A technician has been assigned to your vehicle", icon: User, color: "purple" },
  { status: "IN_PROGRESS", label: "Job Accepted", desc: "Technician accepted and is heading to the center", icon: Navigation, color: "indigo" },
  { status: "REACHED_CENTER", label: "Reached Service Center", desc: "Technician has arrived at the service center", icon: MapPin, color: "indigo" },
  { status: "DIAGNOSING", label: "Diagnosing Vehicle", desc: "Technician is inspecting and diagnosing your vehicle", icon: Search, color: "violet" },
  { status: "PARTS_ORDERED", label: "Parts Being Arranged", desc: "Waiting for required parts or materials", icon: Package, color: "orange" },
  { status: "WORK_STARTED", label: "Repair Work Started", desc: "Technician has begun the actual repair work", icon: Hammer, color: "amber" },
  { status: "TESTING", label: "Testing & Quality Check", desc: "Final testing and quality verification in progress", icon: FlaskConical, color: "teal" },
  { status: "COMPLETED", label: "Service Completed", desc: "Your vehicle is ready for pickup!", icon: Flag, color: "green" },
];

const COLOR = {
  yellow: { bg: "bg-yellow-50", text: "text-yellow-700", dot: "bg-yellow-400", ring: "ring-yellow-300" },
  blue: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500", ring: "ring-blue-300" },
  purple: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500", ring: "ring-purple-300" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500", ring: "ring-indigo-300" },
  violet: { bg: "bg-violet-50", text: "text-violet-700", dot: "bg-violet-500", ring: "ring-violet-300" },
  orange: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500", ring: "ring-orange-300" },
  amber: { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500", ring: "ring-amber-300" },
  teal: { bg: "bg-teal-50", text: "text-teal-700", dot: "bg-teal-500", ring: "ring-teal-300" },
  green: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500", ring: "ring-green-300" },
};

const STATUS_ORDER = MILESTONES.map(m => m.status);
function getMilestoneIndex(status) {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

function StatusBadge({ status }) {
  const m = MILESTONES.find(x => x.status === status);
  const col = m ? COLOR[m.color] : COLOR.yellow;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${col.bg} ${col.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${col.dot}`} />
      {m?.label || status}
    </span>
  );
}

function WorkerCard({ worker, isNew }) {
  return (
    <div className={`rounded-2xl border overflow-hidden mt-4 ${isNew ? "border-green-300 shadow-lg shadow-green-50" : "border-purple-200"}`}>
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
        <p className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
          <Shield size={11} /> Your Technician
        </p>
        {isNew && (
          <span className="flex items-center gap-1 text-green-300 text-xs font-bold animate-pulse">
            <Bell size={11} /> Just Assigned!
          </span>
        )}
      </div>
      <div className="bg-white p-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
              {worker.workerName?.charAt(0)?.toUpperCase() || "W"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900 text-base">{worker.workerName}</p>
            <p className="text-purple-600 text-xs font-semibold mt-0.5">{worker.workerRole}</p>
            {worker.workerRating > 0 && (
              <div className="flex items-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={11}
                    className={i <= Math.round(worker.workerRating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                ))}
                <span className="text-xs text-gray-500 ml-1">{Number(worker.workerRating).toFixed(1)}</span>
              </div>
            )}
          </div>
          {worker.workerPhone && (
            <a href={`tel:${worker.workerPhone}`}
              className="shrink-0 w-11 h-11 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center hover:bg-green-100 transition-colors">
              <Phone size={16} className="text-green-600" />
            </a>
          )}
        </div>
        {worker.workerPhone && (
          <p className="text-gray-400 text-xs mt-2 flex items-center gap-1"><Phone size={10} /> {worker.workerPhone}</p>
        )}
        {worker.workerSkills?.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Expertise</p>
            <div className="flex flex-wrap gap-1.5">
              {worker.workerSkills.slice(0, 6).map(s => (
                <span key={s} className="text-xs bg-purple-50 text-purple-600 border border-purple-100 px-2 py-0.5 rounded-lg font-medium">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ServiceTimeline({ currentStatus }) {
  const currentIdx = getMilestoneIndex(currentStatus);
  return (
    <div className="mt-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-4">Service Progress</p>
      <div className="relative">
        {MILESTONES.map((m, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          const pending = i > currentIdx;
          const col = COLOR[m.color];
          const Icon = m.icon;
          return (
            <div key={m.status} className="flex gap-4 relative">
              {i < MILESTONES.length - 1 && (
                <div className={`absolute left-3 top-7 w-0.5 rounded-full ${done ? "bg-green-300" : "bg-gray-100"}`}
                  style={{ height: "calc(100% - 1.5rem)" }} />
              )}
              <div className="shrink-0 z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                  ${done ? "bg-green-500 border-green-500"
                    : active ? `${col.bg} ${col.ring} ring-2 border-transparent`
                      : "bg-gray-50 border-gray-200"}`}>
                  {done
                    ? <CheckCircle2 size={12} className="text-white" />
                    : <Icon size={11} className={active ? col.text : "text-gray-300"} />}
                </div>
              </div>
              <div className={`pb-5 flex-1 ${pending ? "opacity-35" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-bold leading-tight
                    ${done ? "text-green-700" : active ? col.text : "text-gray-400"}`}>
                    {m.label}
                  </p>
                  {active && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>Now</span>}
                  {done && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">✓</span>}
                </div>
                {(done || active) && (
                  <p className="text-gray-400 text-[10px] mt-0.5 leading-relaxed">{m.desc}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function BookingCard({ booking, workerInfo, isNewAssignment }) {
  const [expanded, setExpanded] = useState(false);
  const isActive = booking.status !== "COMPLETED" && booking.status !== "CANCELLED";
  const topBarColor =
    booking.status === "COMPLETED" ? "bg-green-500" :
      booking.status === "TESTING" ? "bg-teal-500" :
        booking.status === "WORK_STARTED" ? "bg-amber-500" :
          booking.status === "PARTS_ORDERED" ? "bg-orange-500" :
            booking.status === "DIAGNOSING" ? "bg-violet-500" :
              booking.status === "REACHED_CENTER" ? "bg-indigo-500" :
                booking.status === "IN_PROGRESS" ? "bg-indigo-400" :
                  booking.status === "ASSIGNED" ? "bg-purple-500" :
                    "bg-blue-500";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden
      ${isActive ? "border-blue-200" : "border-gray-200"}
      ${isNewAssignment ? "ring-2 ring-green-400 ring-offset-2" : ""}`}>
      <div className={`h-1.5 ${topBarColor}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Car size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{booking.selectedVehicle || booking.brand || "Vehicle"}</p>
              <p className="text-gray-500 text-xs">{booking.vehicleNumber || booking.vehicleType || "—"}</p>
            </div>
          </div>
          <StatusBadge status={booking.status} />
        </div>

        {(booking.selectedServiceNames || booking.serviceNames)?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(booking.selectedServiceNames || booking.serviceNames).slice(0, 3).map((s, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
          {booking.selectedDate && <span className="flex items-center gap-1"><Calendar size={11} /> {booking.selectedDate}</span>}
          {booking.selectedTime && <span className="flex items-center gap-1"><Clock size={11} /> {booking.selectedTime}</span>}
          {(booking.serviceMode || booking.manualAddress || booking.serviceLocation) && (
            <span className="flex items-center gap-1 col-span-2 truncate">
              <MapPin size={11} /> {booking.serviceMode || booking.manualAddress || booking.serviceLocation}
            </span>
          )}
        </div>

        {(booking.totalEstimatedPrice || booking.totalPrice) && (
          <div className="flex justify-between items-center py-2 border-t border-gray-50 mb-1">
            <span className="text-gray-500 text-sm">Estimated</span>
            <span className="font-bold text-gray-800">₹{(booking.totalEstimatedPrice || booking.totalPrice).toLocaleString()}</span>
          </div>
        )}

        {workerInfo && <WorkerCard worker={workerInfo} isNew={isNewAssignment} />}

        {booking.status !== "PENDING" && <ServiceTimeline currentStatus={booking.status} />}

        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-blue-500 font-semibold py-1.5 hover:bg-blue-50 rounded-lg transition-colors"
        >
          {expanded ? "Hide details" : "Booking details"}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
            <p><span className="font-semibold text-gray-700">Booking ID:</span> #{booking.id}</p>
            {booking.urgency && booking.urgency !== "NORMAL" && (
              <p className="flex items-center gap-1 text-red-500 font-semibold"><AlertTriangle size={11} /> {booking.urgency}</p>
            )}
            {booking.additionalNotes && (
              <p><span className="font-semibold text-gray-700">Notes:</span> {booking.additionalNotes}</p>
            )}
            {booking.createdAt && (
              <p><span className="font-semibold text-gray-700">Booked at:</span> {new Date(booking.createdAt).toLocaleString("en-IN")}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CurrentServiceStatus() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [workerMap, setWorkerMap] = useState({});
  const [newAssignments, setNewAssignments] = useState(new Set());
  const [banner, setBanner] = useState(null);
  const sseRef = useRef(null);
  const userIdRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then(me => { userIdRef.current = me.id || me.userId; })
      .catch(() => { });
  }, []);

  const loadBookings = async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/services/all`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      const active = data.filter(b =>
        b.status !== "CANCELLED" &&
        !(b.status === "COMPLETED" && isOlderThan(b.updatedAt, 7))
      );
      setBookings(active);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
    const iv = setInterval(loadBookings, POLL_MS);
    return () => clearInterval(iv);
  }, []);

  const flashNew = (id) => {
    setNewAssignments(prev => new Set([...prev, id]));
    setTimeout(() => setNewAssignments(prev => { const n = new Set(prev); n.delete(id); return n; }), 12_000);
  };

  useEffect(() => {
    const openSse = (userId) => {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
      const es = new EventSource(`${BASE_URL}/api/notifications/subscribe/${userId}`, { withCredentials: true });
      sseRef.current = es;

      es.addEventListener("connected", () => console.log("[SSE] Customer stream connected"));

      es.addEventListener("worker_assigned_to_customer", (event) => {
        try {
          const data = JSON.parse(event.data);
          const { requestId } = data;
          setWorkerMap(prev => ({ ...prev, [requestId]: data }));
          flashNew(requestId);
          setBookings(prev => prev.map(b =>
            (b.scoRequestId === requestId || b.vehicleNumber === data.vehicleNumber)
              ? { ...b, status: "ASSIGNED" } : b
          ));
          toast.custom(t => (
            <div className={`${t.visible ? "opacity-100" : "opacity-0"} transition-opacity max-w-sm w-full bg-white shadow-xl rounded-2xl p-4 flex gap-3 ring-1 ring-black/5`}>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 text-lg">👷</div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm">Worker Assigned!</p>
                <p className="text-gray-600 text-xs mt-0.5">{data.workerName} — {data.workerRole}</p>
                {data.workerPhone && <p className="text-gray-400 text-xs">{data.workerPhone}</p>}
              </div>
            </div>
          ), { duration: 8000 });
          setTimeout(loadBookings, 1000);
        } catch (err) { console.error("[SSE] worker_assigned_to_customer parse error", err); }
      });

      es.addEventListener("job_status_updated", (event) => {
        try {
          const data = JSON.parse(event.data);
          const { requestId, status, message: msg, workerName, workerRole, workerPhone, workerRating, workerSkills, assignedWorkerName } = data;

          setBookings(prev => prev.map(b => {
            if (b.scoRequestId === requestId || b.vehicleNumber === data.vehicleNumber) {
              return { ...b, status, assignedWorkerName: workerName || assignedWorkerName || b.assignedWorkerName };
            }
            return b;
          }));

          const resolvedName = workerName || assignedWorkerName;
          if (requestId && resolvedName) {
            setWorkerMap(prev => ({
              ...prev,
              [requestId]: {
                ...prev[requestId],
                workerName: resolvedName,
                workerRole: workerRole || prev[requestId]?.workerRole,
                workerPhone: workerPhone || prev[requestId]?.workerPhone,
                workerRating: workerRating ?? prev[requestId]?.workerRating,
                workerSkills: workerSkills || prev[requestId]?.workerSkills,
              },
            }));
            flashNew(requestId);
          }

          const emoji =
            status === "COMPLETED" ? "✅" :
              status === "TESTING" ? "🔍" :
                status === "WORK_STARTED" ? "🔧" :
                  status === "PARTS_ORDERED" ? "📦" :
                    status === "DIAGNOSING" ? "🔎" :
                      status === "REACHED_CENTER" ? "📍" :
                        status === "IN_PROGRESS" ? "🚗" : "ℹ️";
          toast(msg || `Update: ${status}`, { icon: emoji, duration: 6000 });

          if (["REACHED_CENTER", "DIAGNOSING", "WORK_STARTED", "TESTING", "COMPLETED"].includes(status)) {
            const milestone = MILESTONES.find(m => m.status === status);
            setBanner({ workerName: resolvedName, workerRole, milestone, type: "milestone" });
          }

          setTimeout(loadBookings, 1000);
        } catch (err) { console.error("[SSE] job_status_updated parse error", err); }
      });

      es.onerror = () => {
        es.close(); sseRef.current = null;
        setTimeout(() => { const uid = userIdRef.current; if (uid) openSse(uid); }, 5000);
      };
    };

    const tryConnect = () => {
      const uid = userIdRef.current;
      if (uid) { openSse(uid); return; }
      let attempts = 0;
      const iv = setInterval(() => {
        const uid2 = userIdRef.current;
        if (uid2) { clearInterval(iv); openSse(uid2); }
        if (++attempts > 8) clearInterval(iv);
      }, 500);
    };
    tryConnect();
    return () => { if (sseRef.current) { sseRef.current.close(); sseRef.current = null; } };
  }, []);

  const active = bookings.filter(b => b.status !== "COMPLETED");
  const completed = bookings.filter(b => b.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation2 />
      <Toaster position="top-right" />

      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-6 py-6 shadow-md">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate("/dashboard/customer")}
            className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-3 transition-colors">
            <ArrowLeft size={15} /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold">Current Service Status</h1>
              <p className="text-blue-200 text-sm">Live updates on your active bookings</p>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-8">
        {loading && (
          <div className="flex items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-blue-500 font-semibold">Loading your services…</p>
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-2" />
            <p className="text-red-600 font-semibold">{error}</p>
          </div>
        )}
        {!loading && !error && bookings.length === 0 && (
          <div className="bg-white border border-gray-200 rounded-2xl p-16 text-center">
            <Wrench className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 font-bold text-xl">No Active Bookings</p>
            <p className="text-gray-400 mt-2 text-sm">Your service bookings will appear here once placed.</p>
            <button onClick={() => navigate("/dashboard/customer/vehicle-services")}
              className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
              Book a Service
            </button>
          </div>
        )}

        {active.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Active ({active.length})
            </h2>
            <div className="space-y-4">
              {active.map(b => (
                <BookingCard key={b.id} booking={b}
                  workerInfo={workerMap[b.scoRequestId] || workerMap[b.id] || (b.assignedWorkerName ? { workerName: b.assignedWorkerName } : null)}
                  isNewAssignment={newAssignments.has(b.id)} />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-gray-400" />
              Recent Completed ({completed.length})
            </h2>
            <div className="space-y-4 opacity-75">
              {completed.map(b => (
                <BookingCard key={b.id} booking={b}
                  workerInfo={workerMap[b.scoRequestId] || workerMap[b.id] || (b.assignedWorkerName ? { workerName: b.assignedWorkerName } : null)}
                  isNewAssignment={false} />
              ))}
            </div>
          </section>
        )}
      </main>

      {banner && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white border border-purple-200 rounded-2xl shadow-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
              {banner.type === "milestone" && banner.milestone
                ? <banner.milestone.icon size={20} className="text-purple-600" />
                : <User size={18} className="text-purple-600" />}
            </div>
            <div className="flex-1">
              {banner.type === "milestone" ? (
                <>
                  <p className="font-bold text-gray-900 text-sm">{banner.milestone?.label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{banner.milestone?.desc}</p>
                  {banner.workerName && <p className="text-purple-600 text-xs font-semibold mt-1">by {banner.workerName}</p>}
                </>
              ) : (
                <>
                  <p className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                    <CheckCircle2 size={13} className="text-green-500" /> Worker Assigned!
                  </p>
                  <p className="text-gray-700 text-sm font-semibold mt-0.5">{banner.workerName}</p>
                  <p className="text-gray-500 text-xs">{banner.workerRole}</p>
                  {banner.workerPhone && (
                    <p className="flex items-center gap-1 text-gray-500 text-xs mt-1"><Phone size={11} /> {banner.workerPhone}</p>
                  )}
                </>
              )}
            </div>
            <button onClick={() => setBanner(null)} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function isOlderThan(dateStr, days) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() > days * 86_400_000;
}