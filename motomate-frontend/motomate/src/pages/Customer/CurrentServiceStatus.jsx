import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wrench, Car, Clock, CheckCircle2, User, Phone,
  Star, ArrowLeft, Loader2, AlertTriangle, Bell,
  MapPin, Calendar, X, Navigation, Search,
  Package, Hammer, FlaskConical, Flag, Shield, MessageCircle,
} from "lucide-react";
import { toast, Toaster } from "react-hot-toast";
import Navigation2 from "../../Components/Navigation";
import Footer from "../../Components/Footer";
import CustomerTrackingSection from "./CustomerTrackingSection";
import RatingModal from "../../Components/RatingModal";
import ChatWidget, { ChatButton } from "../../Components/ChatWidget";

const BASE_URL = "http://localhost:8080";
const POLL_MS = 15_000;

const MILESTONES = [
  { status: "PENDING",        label: "Booking Placed",          icon: Clock,        color: "yellow"  },
  { status: "ACCEPTED",       label: "Booking Confirmed",       icon: CheckCircle2, color: "blue"    },
  { status: "ASSIGNED",       label: "Worker Assigned",         icon: User,         color: "purple"  },
  { status: "IN_PROGRESS",    label: "Job Accepted",            icon: Navigation,   color: "indigo"  },
  { status: "REACHED_CENTER", label: "Reached Service Center",  icon: MapPin,       color: "indigo"  },
  { status: "DIAGNOSING",     label: "Diagnosing Vehicle",      icon: Search,       color: "violet"  },
  { status: "PARTS_ORDERED",  label: "Parts Being Arranged",    icon: Package,      color: "orange"  },
  { status: "WORK_STARTED",   label: "Repair Work Started",     icon: Hammer,       color: "amber"   },
  { status: "TESTING",        label: "Testing & Quality Check", icon: FlaskConical, color: "teal"    },
  { status: "COMPLETED",      label: "Service Completed",       icon: Flag,         color: "green"   },
];

const COLOR = {
  yellow: { bg: "bg-yellow-50",  text: "text-yellow-700",  dot: "bg-yellow-400"  },
  blue:   { bg: "bg-blue-50",    text: "text-blue-700",    dot: "bg-blue-500"    },
  purple: { bg: "bg-purple-50",  text: "text-purple-700",  dot: "bg-purple-500"  },
  indigo: { bg: "bg-indigo-50",  text: "text-indigo-700",  dot: "bg-indigo-500"  },
  violet: { bg: "bg-violet-50",  text: "text-violet-700",  dot: "bg-violet-500"  },
  orange: { bg: "bg-orange-50",  text: "text-orange-700",  dot: "bg-orange-500"  },
  amber:  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500"   },
  teal:   { bg: "bg-teal-50",    text: "text-teal-700",    dot: "bg-teal-500"    },
  green:  { bg: "bg-green-50",   text: "text-green-700",   dot: "bg-green-500"   },
};

const STATUS_ORDER = MILESTONES.map(m => m.status);
function getMilestoneIndex(status) {
  const i = STATUS_ORDER.indexOf(status);
  return i === -1 ? 0 : i;
}

function StatusBadge({ status }) {
  const m   = MILESTONES.find(x => x.status === status);
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
    <div className={`rounded-2xl border overflow-hidden mt-4 ${isNew ? "border-green-300 shadow-lg" : "border-purple-200"}`}>
      <div className="bg-linear-to-r from-purple-600 to-indigo-600 px-4 py-3 flex items-center justify-between">
        <p className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
          <Shield size={11} /> Your Technician
        </p>
        {isNew && <span className="flex items-center gap-1 text-green-300 text-xs font-bold animate-pulse"><Bell size={11} /> Just Assigned!</span>}
      </div>
      <div className="bg-white p-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg">
              {worker.workerName?.charAt(0)?.toUpperCase() || "W"}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white flex items-center justify-center">
              <CheckCircle2 size={10} className="text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-black text-gray-900">{worker.workerName}</p>
            <p className="text-purple-600 text-xs font-semibold">{worker.workerRole}</p>
            {worker.workerRating > 0 && (
              <div className="flex items-center gap-0.5 mt-1">
                {[1,2,3,4,5].map(i => (
                  <Star key={i} size={11} className={i <= Math.round(worker.workerRating) ? "text-amber-400 fill-amber-400" : "text-gray-200 fill-gray-200"} />
                ))}
                <span className="text-xs text-gray-500 ml-1">{Number(worker.workerRating).toFixed(1)}</span>
              </div>
            )}
          </div>
          {worker.workerPhone && (
            <a href={`tel:${worker.workerPhone}`} className="shrink-0 w-10 h-10 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center hover:bg-green-100 transition-colors">
              <Phone size={16} className="text-green-600" />
            </a>
          )}
        </div>
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
          const done    = i < currentIdx;
          const active  = i === currentIdx;
          const pending = i > currentIdx;
          const col  = COLOR[m.color];
          const Icon = m.icon;
          return (
            <div key={m.status} className="flex gap-4 relative">
              {i < MILESTONES.length - 1 && (
                <div className={`absolute left-3 top-7 w-0.5 rounded-full ${done ? "bg-green-300" : "bg-gray-100"}`} style={{ height: "calc(100% - 1.5rem)" }} />
              )}
              <div className="shrink-0 z-10">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all
                  ${done ? "bg-green-500 border-green-500" : active ? `${col.bg} ring-2 border-transparent` : "bg-gray-50 border-gray-200"}`}>
                  {done ? <CheckCircle2 size={12} className="text-white" /> : <Icon size={11} className={active ? col.text : "text-gray-300"} />}
                </div>
              </div>
              <div className={`pb-5 flex-1 ${pending ? "opacity-35" : ""}`}>
                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs font-bold leading-tight ${done ? "text-green-700" : active ? col.text : "text-gray-400"}`}>{m.label}</p>
                  {active && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${col.bg} ${col.text}`}>Now</span>}
                  {done  && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-600">✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── BookingCard ──────────────────────────────────────────────────────────────

function BookingCard({
  booking, workerInfo, isNewAssignment, workerLocation,
  userId, onUpdateLocation, onRateNow, onOpenChat,
  hasRated,
}) {
  const [expanded, setExpanded] = useState(false);
  const isActive    = booking.status !== "COMPLETED" && booking.status !== "CANCELLED";
  const isCompleted = booking.status === "COMPLETED";
  const hasWorker   = !!(booking.assignedWorkerId || workerInfo);

  const topBarColor =
    isCompleted                          ? "bg-green-500"  :
    booking.status === "TESTING"         ? "bg-teal-500"   :
    booking.status === "WORK_STARTED"    ? "bg-amber-500"  :
    booking.status === "PARTS_ORDERED"   ? "bg-orange-500" :
    booking.status === "DIAGNOSING"      ? "bg-violet-500" :
    booking.status === "REACHED_CENTER"  ? "bg-indigo-500" :
    booking.status === "IN_PROGRESS"     ? "bg-indigo-400" :
    booking.status === "ASSIGNED"        ? "bg-purple-500" :
    "bg-blue-500";

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden
      ${isActive ? "border-blue-200" : "border-gray-200"}
      ${isNewAssignment ? "ring-2 ring-green-400 ring-offset-2" : ""}`}>
      <div className={`h-1.5 ${topBarColor}`} />
      <div className="p-5">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <Car size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{booking.selectedVehicle || booking.brand || "Vehicle"}</p>
              <p className="text-gray-500 text-xs">{booking.vehicleNumber || "—"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Chat button (only if worker assigned and job active and scoRequestId exists) */}
            {hasWorker && isActive && (booking.scoRequestId || booking.assignedWorkerId) && (
              <button
                onClick={() => onOpenChat(booking)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                <MessageCircle size={13} /> Chat
              </button>
            )}
            <StatusBadge status={booking.status} />
          </div>
        </div>

        {/* Services */}
        {(booking.selectedServiceNames)?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {booking.selectedServiceNames.slice(0, 3).map((s, i) => (
              <span key={i} className="text-xs bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">{s}</span>
            ))}
          </div>
        )}

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 mb-3">
          {booking.selectedDate && <span className="flex items-center gap-1"><Calendar size={11} /> {booking.selectedDate}</span>}
          {booking.selectedTime && <span className="flex items-center gap-1"><Clock size={11} /> {booking.selectedTime}</span>}
          {booking.serviceMode   && <span className="flex items-center gap-1 col-span-2 truncate"><MapPin size={11} /> {booking.serviceMode}</span>}
        </div>

        {/* Price */}
        {booking.totalEstimatedPrice && (
          <div className="flex justify-between items-center py-2 border-t border-gray-50 mb-1">
            <span className="text-gray-500 text-sm">Estimated</span>
            <span className="font-bold text-gray-800">₹{booking.totalEstimatedPrice.toLocaleString()}</span>
          </div>
        )}

        {/* Worker card */}
        {workerInfo && <WorkerCard worker={workerInfo} isNew={isNewAssignment} />}

        {/* ── RATING CTA (after completion, if not yet rated) ───────────── */}
        {isCompleted && !hasRated && booking.assignedWorkerId && (
          <button
            onClick={() => onRateNow(booking)}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-amber-50 border-2 border-amber-200 hover:bg-amber-100 text-amber-700 font-bold py-3 rounded-2xl transition-colors"
          >
            <Star size={16} className="fill-amber-400 text-amber-400" />
            Rate Your Technician
          </button>
        )}

        {isCompleted && hasRated && (
          <div className="mt-4 flex items-center justify-center gap-2 bg-green-50 border border-green-200 text-green-600 font-bold py-2.5 rounded-2xl text-sm">
            <CheckCircle2 size={14} /> Rating Submitted — Thank you!
          </div>
        )}

        {/* Live map (doorstep) */}
        {booking.serviceMode === "Doorstep" && isActive && (
          <div className="mt-4 border-t border-gray-100 pt-4">
            {!booking.customerLatitude && onUpdateLocation && (
              <div className="mb-4 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <MapPin size={16} className="text-blue-600 shrink-0" />
                <div className="flex-1">
                  <p className="text-blue-800 text-sm font-medium">Enable Live Tracking</p>
                  <p className="text-blue-600 text-xs">Add your location to see worker on map</p>
                </div>
                <button onClick={() => onUpdateLocation(booking.id)} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                  Update
                </button>
              </div>
            )}
            <CustomerTrackingSection booking={booking} userId={userId} workerLocation={workerLocation} />
          </div>
        )}

        {booking.status !== "PENDING" && <ServiceTimeline currentStatus={booking.status} />}

        <button onClick={() => setExpanded(e => !e)} className="w-full mt-3 flex items-center justify-center gap-1 text-xs text-blue-500 font-semibold py-1.5 hover:bg-blue-50 rounded-lg transition-colors">
          {expanded ? "Hide details" : "Booking details"}
        </button>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-500">
            <p><span className="font-semibold text-gray-700">ID:</span> #{booking.id}</p>
            {booking.createdAt && <p><span className="font-semibold text-gray-700">Booked:</span> {new Date(booking.createdAt).toLocaleString("en-IN")}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CurrentServiceStatus() {
  const navigate = useNavigate();
  const [bookings,           setBookings]           = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [error,              setError]              = useState(null);
  const [workerMap,          setWorkerMap]          = useState({});
  const [newAssignments,     setNewAssignments]     = useState(new Set());
  const [workerLocationMap,  setWorkerLocationMap]  = useState({});
  const [userLocation,       setUserLocation]       = useState(null);

  // Rating state
  const [ratingBooking,  setRatingBooking]  = useState(null);  // booking to rate
  const [ratedBookings,  setRatedBookings]  = useState(new Set()); // ids already rated

  // Chat state
  const [chatBooking,    setChatBooking]    = useState(null);
  const [chatOpen,       setChatOpen]       = useState(false);

  const userIdRef = useRef(null);
  const sseRef    = useRef(null);

  // Get GPS for location update button
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      p => setUserLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Fetch userId once
  useEffect(() => {
    fetch(`${BASE_URL}/api/auth/me`, { credentials: "include" })
      .then(r => r.json())
      .then(me => { userIdRef.current = me.id || me.userId; })
      .catch(() => {});
  }, []);

  // Load rated bookings from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('ratedBookings') || '[]');
      setRatedBookings(new Set(stored));
    } catch (_) {}
  }, []);

  const updateBookingLocation = async (bookingId) => {
    if (!userLocation) return;
    try {
      const r = await fetch(`${BASE_URL}/api/location/booking/${bookingId}/customer`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify(userLocation),
      });
      if (r.ok) { loadBookings(); toast.success('Location updated!'); }
    } catch (_) {}
  };

  const loadBookings = async () => {
    try {
      const res  = await fetch(`${BASE_URL}/api/services/all`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load bookings");
      const data = await res.json();
      const active = data.filter(b =>
        b.status !== "CANCELLED" &&
        !(b.status === "COMPLETED" && isOlderThan(b.updatedAt, 7))
      );
      setBookings(active);

      // Auto-trigger rating modal for newly completed jobs
      active.forEach(b => {
        if (b.status === "COMPLETED" && b.assignedWorkerId && !ratedBookings.has(b.id)) {
          // Show rating modal after short delay if not shown yet
          const shownKey = `ratingShown_${b.id}`;
          if (!sessionStorage.getItem(shownKey)) {
            sessionStorage.setItem(shownKey, '1');
            setTimeout(() => setRatingBooking(b), 1200);
          }
        }
      });
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

  // SSE
  useEffect(() => {
    const openSse = (userId) => {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
      const es = new EventSource(`${BASE_URL}/api/notifications/subscribe/${userId}`, { withCredentials: true });
      sseRef.current = es;

      es.addEventListener("connected", () => console.log("[SSE] connected"));

      es.addEventListener("worker_location_update", (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.requestId && data.latitude && data.longitude) {
            setWorkerLocationMap(prev => ({ ...prev, [data.requestId]: { latitude: data.latitude, longitude: data.longitude } }));
          }
        } catch (_) {}
      });

      es.addEventListener("worker_assigned_to_customer", (event) => {
        try {
          const data = JSON.parse(event.data);
          setWorkerMap(prev => ({ ...prev, [data.requestId]: data }));
          flashNew(data.requestId);
          setBookings(prev => prev.map(b =>
            (b.scoRequestId === data.requestId || b.vehicleNumber === data.vehicleNumber)
              ? { ...b, status: "ASSIGNED" } : b
          ));
          toast.success(`${data.workerName} has been assigned to your service!`, { icon: '👷', duration: 8000 });
          setTimeout(loadBookings, 1000);
        } catch (_) {}
      });

      es.addEventListener("job_status_updated", (event) => {
        try {
          const data = JSON.parse(event.data);
          setBookings(prev => prev.map(b =>
            (b.scoRequestId === data.requestId || b.vehicleNumber === data.vehicleNumber)
              ? { ...b, status: data.status } : b
          ));
          if (data.requestId && (data.workerName || data.assignedWorkerName)) {
            setWorkerMap(prev => ({ ...prev, [data.requestId]: { ...prev[data.requestId], ...data } }));
          }
          toast(`Status: ${data.status.replace(/_/g, ' ')}`, { icon: 'ℹ️', duration: 6000 });

          // If job just completed, prompt rating
          if (data.status === "COMPLETED") {
            setTimeout(loadBookings, 1200);
          } else {
            setTimeout(loadBookings, 1000);
          }
        } catch (_) {}
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

  const handleRatingSubmitted = (bookingId) => {
    setRatedBookings(prev => {
      const n = new Set(prev);
      n.add(bookingId);
      try { localStorage.setItem('ratedBookings', JSON.stringify([...n])); } catch (_) {}
      return n;
    });
    setRatingBooking(null);
  };

  const handleOpenChat = (booking) => {
    setChatBooking(booking);
    setChatOpen(true);
  };

  const active    = bookings.filter(b => b.status !== "COMPLETED");
  const completed = bookings.filter(b => b.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation2 />
      <Toaster position="top-right" />

      {/* Rating Modal */}
      {ratingBooking && (
        <RatingModal
          booking={ratingBooking}
          onClose={() => setRatingBooking(null)}
          onSubmitted={() => handleRatingSubmitted(ratingBooking.id)}
        />
      )}

      {/* Chat Widget */}
      {chatBooking && (
        <ChatWidget
          bookingId={chatBooking.scoRequestId || chatBooking.id}
          myRole="CUSTOMER"
          myName="Customer"
          otherName={
            workerMap[chatBooking.scoRequestId]?.workerName ||
            chatBooking.assignedWorkerName || 'Technician'
          }
          isOpen={chatOpen}
          onClose={() => { setChatOpen(false); setChatBooking(null); }}
        />
      )}

      {/* Header */}
      <div className="bg-linear-to-r from-blue-600 to-blue-500 text-white px-6 py-6 shadow-md">
        <div className="max-w-3xl mx-auto">
          <button onClick={() => navigate("/dashboard/customer")} className="flex items-center gap-1.5 text-blue-200 hover:text-white text-sm mb-3 transition-colors">
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
            <button onClick={() => navigate("/dashboard/customer/vehicle-services")}
              className="mt-5 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-colors">
              Book a Service
            </button>
          </div>
        )}

        {active.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active ({active.length})
            </h2>
            <div className="space-y-4">
              {active.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  workerInfo={workerMap[b.scoRequestId] || workerMap[b.id] || (b.assignedWorkerName ? { workerName: b.assignedWorkerName } : null)}
                  isNewAssignment={newAssignments.has(b.id)}
                  workerLocation={workerLocationMap[b.scoRequestId] || workerLocationMap[b.id] || null}
                  userId={userIdRef.current}
                  onUpdateLocation={updateBookingLocation}
                  onRateNow={setRatingBooking}
                  onOpenChat={handleOpenChat}
                  hasRated={ratedBookings.has(b.id)}
                />
              ))}
            </div>
          </section>
        )}

        {completed.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle2 size={14} className="text-gray-400" /> Recent Completed ({completed.length})
            </h2>
            <div className="space-y-4 opacity-80">
              {completed.map(b => (
                <BookingCard
                  key={b.id}
                  booking={b}
                  workerInfo={workerMap[b.scoRequestId] || workerMap[b.id] || (b.assignedWorkerName ? { workerName: b.assignedWorkerName } : null)}
                  isNewAssignment={false}
                  workerLocation={null}
                  userId={userIdRef.current}
                  onRateNow={setRatingBooking}
                  onOpenChat={handleOpenChat}
                  hasRated={ratedBookings.has(b.id)}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}

function isOlderThan(dateStr, days) {
  if (!dateStr) return false;
  return Date.now() - new Date(dateStr).getTime() > days * 86_400_000;
}