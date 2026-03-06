import { useState, useEffect } from "react";
import {
  Wrench, Car, Truck, Bus, Bike, Calendar, Clock, Hash,
  Settings, Search, AlertTriangle, X, ChevronRight,
  Info, CarFront, Loader2,
} from "lucide-react";

const API_URL = "http://localhost:8080/api/services/all";

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

// ── Modal ──────────────────────────────────────────────────────────────
function Modal({ service, onClose }) {
  if (!service) return null;
  const { id, vehicalType, selectedVehicle, serviceMode, selectedTime, selectedDate } = service;

  const rows = [
    { icon: <Hash className="w-4 h-4" />,      label: "Service ID",       value: `#${id}` },
    { icon: <Car className="w-4 h-4" />,        label: "Vehicle Type",     value: vehicalType || "—" },
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
        className="bg-white rounded-2xl p-8 w-[90%] max-w-md shadow-2xl border border-blue-100"
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
function ServiceCard({ service, onMoreInfo }) {
  const { id, vehicalType, selectedVehicle, serviceMode, selectedTime, selectedDate } = service;

  return (
    <div className="bg-white rounded-2xl border border-blue-100 shadow-sm hover:shadow-blue-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden">
      {/* Top accent */}
      <div className="h-1.5 bg-linear-to-r from-blue-700 to-blue-400" />

      <div className="p-6">
        {/* Card Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-100 to-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
            {getVehicleIcon(vehicalType)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-blue-500 text-base truncate">
              {selectedVehicle || "Unknown Vehicle"}
            </p>
            <p className="text-blue-400 text-xs font-medium mt-0.5">{vehicalType || "—"}</p>
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

  useEffect(() => {
    fetch(API_URL)
      .then(res => {
        if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
        return res.json();
      })
      .then(data => { setServices(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, []);

  const filtered = services.filter(s =>
    !search ||
    s.selectedVehicle?.toLowerCase().includes(search.toLowerCase()) ||
    s.vehicalType?.toLowerCase().includes(search.toLowerCase()) ||
    s.serviceMode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-blue-100">

      {/* ── Header ── */}
      <header className="bg-linear-to-r from-blue-600 to-blue-500 shadow-xl px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-extrabold tracking-tight">Customer Services</h1>
            <p className="text-blue-300 text-sm mt-0.5">All booked vehicle services</p>
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
              <ServiceCard key={service.id} service={service} onMoreInfo={setSelectedService} />
            ))}
          </div>
        )}
      </main>

      <Modal service={selectedService} onClose={() => setSelectedService(null)} />
    </div>
  );
}
