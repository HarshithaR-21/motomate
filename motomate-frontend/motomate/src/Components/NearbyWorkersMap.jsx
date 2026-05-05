import { useEffect, useRef, useState } from 'react';
import { MapPin, Star, Zap, Navigation, Phone, X, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const BASE_URL = 'http://localhost:8080';

// ── Haversine (km) ────────────────────────────────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ── Marker factories ──────────────────────────────────────────────────────────
function makeWorkerIcon(isNearest, isSelected, hasGPS) {
  const bg   = isSelected ? '#6366F1' : isNearest ? '#22C55E' : hasGPS ? '#F97316' : '#6B7280';
  const ring = isSelected ? '#818CF8' : isNearest ? '#86EFAC' : hasGPS ? '#FED7AA' : '#9CA3AF';
  return L.divIcon({
    className: '',
    html: `<div style="
      position:relative;width:36px;height:36px;border-radius:50%;
      background:${bg};border:3px solid #fff;
      box-shadow:0 0 0 3px ${ring},0 4px 12px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.5"
        stroke-linecap="round" stroke-linejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      ${isNearest ? `<div style="position:absolute;top:-6px;right:-6px;width:14px;height:14px;
        background:#22C55E;border-radius:50%;border:2px solid #fff;
        display:flex;align-items:center;justify-content:center;">
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3">
          <polyline points="20 6 9 17 4 12"/></svg></div>` : ''}
    </div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

function makeCustomerIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:28px;height:28px;border-radius:50%;
      background:#3B82F6;border:3px solid #fff;
      box-shadow:0 0 0 3px #BFDBFE,0 4px 12px rgba(59,130,246,0.4);
      display:flex;align-items:center;justify-content:center;">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
        <circle cx="12" cy="10" r="3" fill="#3B82F6"/>
      </svg></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

// ── Star display ──────────────────────────────────────────────────────────────
const Stars = ({ rating = 0 }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <svg key={i} width="12" height="12" viewBox="0 0 24 24"
        fill={i <= Math.round(rating) ? '#FBBF24' : '#E5E7EB'} stroke="none">
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    ))}
    <span className="text-xs font-semibold text-gray-400 ml-0.5">
      {rating > 0 ? Number(rating).toFixed(1) : 'New'}
    </span>
  </div>
);

/**
 * NearbyWorkersMap
 *
 * Fetches available workers from TWO sources and merges them:
 *  1. /api/location/workers/active          — workers with live GPS
 *  2. /api/services/centers/{id}/suggested-workers — all AVAILABLE workers under this SCO
 *
 * Workers with GPS get distance calculated via Haversine.
 * Workers without GPS still appear in the list (no distance shown).
 * All workers show their rating from SCOWorker.rating.
 *
 * Props:
 *   customerLat      number
 *   customerLng      number
 *   serviceCenterId  string   (required — filters to this SCO's workers)
 *   onWorkerSelected (workerId, workerName) => void
 *   onClose          () => void
 */
const NearbyWorkersMap = ({ customerLat, customerLng, serviceCenterId, onWorkerSelected, onClose }) => {
  const mapRef     = useRef(null);
  const mapInst    = useRef(null);
  const markersRef = useRef({});

  const [workers,  setWorkers]  = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  // ── Fetch workers ─────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        // Source 1: workers with live GPS (may be empty if location service not running)
        let gpsWorkers = [];
        try {
          const r = await fetch(
            `${BASE_URL}/api/location/workers/active${serviceCenterId ? `?serviceCenterId=${serviceCenterId}` : ''}`,
            { credentials: 'include' }
          );
          if (r.ok) gpsWorkers = await r.json();
        } catch (_) { /* GPS source optional */ }

        // Source 2: all AVAILABLE workers under this service center (always works)
        let allWorkers = [];
        if (serviceCenterId) {
          const r2 = await fetch(
            `${BASE_URL}/api/services/centers/${serviceCenterId}/suggested-workers`,
            { credentials: 'include' }
          );
          if (r2.ok) allWorkers = await r2.json();
        }

        // Merge: start with allWorkers, enrich GPS coords from gpsWorkers
        const gpsMap = {};
        gpsWorkers.forEach(g => { gpsMap[g.workerId || g.id] = g; });

        const merged = allWorkers.map(w => {
          const gps = gpsMap[w.id];
          return {
            id:         w.id,
            workerName: w.name || w.workerName,
            role:       w.role,
            rating:     w.rating ?? 0,
            phone:      w.phone,
            skills:     w.skills || [],
            latitude:   gps?.latitude  ?? null,
            longitude:  gps?.longitude ?? null,
            distanceKm: (gps?.latitude && customerLat && customerLng)
              ? haversine(customerLat, customerLng, gps.latitude, gps.longitude)
              : null,
          };
        });

        // Also add any GPS workers not in allWorkers list
        gpsWorkers.forEach(g => {
          const id = g.workerId || g.id;
          if (!merged.find(m => m.id === id)) {
            merged.push({
              id,
              workerName: g.workerName || g.name,
              role:       g.role,
              rating:     g.rating ?? 0,
              phone:      g.phone,
              skills:     g.skills || [],
              latitude:   g.latitude,
              longitude:  g.longitude,
              distanceKm: (g.latitude && customerLat && customerLng)
                ? haversine(customerLat, customerLng, g.latitude, g.longitude)
                : null,
            });
          }
        });

        // Sort: workers with distance first (nearest first), then by rating
        merged.sort((a, b) => {
          if (a.distanceKm !== null && b.distanceKm !== null) return a.distanceKm - b.distanceKm;
          if (a.distanceKm !== null) return -1;
          if (b.distanceKm !== null) return 1;
          return (b.rating ?? 0) - (a.rating ?? 0); // no GPS → sort by rating
        });

        setWorkers(merged);
        if (merged.length > 0) setSelected(merged[0]); // pre-select nearest/best
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [customerLat, customerLng, serviceCenterId]);

  // ── Build / refresh map ───────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || loading) return;

    if (!mapInst.current) {
      const centerLat = customerLat || workers.find(w => w.latitude)?.latitude || 12.9716;
      const centerLng = customerLng || workers.find(w => w.longitude)?.longitude || 77.5946;

      const map = L.map(mapRef.current, {
        center: [centerLat, centerLng], zoom: 13,
        zoomControl: true, attributionControl: false,
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);
      mapInst.current = map;

      if (customerLat && customerLng) {
        L.marker([customerLat, customerLng], { icon: makeCustomerIcon() })
          .addTo(map)
          .bindPopup('<b>📍 Your Location</b>');
      }
    }

    const map = mapInst.current;
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    const nearest = workers.length > 0 ? workers[0] : null;

    workers.forEach(w => {
      let lat = w.latitude;
      let lng = w.longitude;
      const hasGPS = lat != null && lng != null;
      if (!hasGPS) {
        lat = customerLat + (Math.random() - 0.5) * 0.01;
        lng = customerLng + (Math.random() - 0.5) * 0.01;
      }
      const isNearest  = w.id === nearest?.id;
      const isSelected = w.id === selected?.id;

      const marker = L.marker([lat, lng], {
        icon: makeWorkerIcon(isNearest, isSelected, hasGPS),
        zIndexOffset: isSelected ? 1000 : isNearest ? 500 : 0,
      })
        .addTo(map)
        .bindPopup(`
          <div style="min-width:160px;font-family:system-ui;padding:4px">
            <p style="font-weight:700;margin:0 0 2px;font-size:13px">${w.workerName}</p>
            <p style="color:#6B7280;font-size:11px;margin:0">${w.role || 'Mechanic'}</p>
            <p style="color:#FBBF24;font-size:11px;margin:4px 0 0">
              ${'★'.repeat(Math.round(w.rating))}${'☆'.repeat(5 - Math.round(w.rating))}
              <span style="color:#6B7280"> ${w.rating > 0 ? w.rating.toFixed(1) : 'New'}</span>
            </p>
            ${w.distanceKm != null
              ? `<p style="color:#6366F1;font-size:11px;font-weight:600;margin:4px 0 0">📍 ${w.distanceKm.toFixed(1)} km away</p>`
              : `<p style="color:#6B7280;font-size:11px;margin:4px 0 0">📍 Location not available</p>`}
          </div>
        `);

      marker.on('click', () => setSelected(w));
      markersRef.current[w.id] = marker;
    });

    // Fit bounds to all points
    const pts = [];
    if (customerLat && customerLng) pts.push([customerLat, customerLng]);
    workers.forEach(w => { if (w.latitude && w.longitude) pts.push([w.latitude, w.longitude]); });
    if (pts.length > 1) map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });

    return () => {};
  }, [workers, loading]);

  // Update marker icons when selection changes
  useEffect(() => {
    if (!mapInst.current || workers.length === 0) return;
    const nearest = workers.length > 0 ? workers[0] : null;
    workers.forEach(w => {
      const m = markersRef.current[w.id];
      const hasGPS = w.latitude != null && w.longitude != null;
      if (m) m.setIcon(makeWorkerIcon(w.id === nearest?.id, w.id === selected?.id, hasGPS));
    });
  }, [selected]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-2xl sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col overflow-hidden" style={{ maxHeight: '95vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-black text-gray-900 text-lg">Available Technicians</h2>
            <p className="text-gray-400 text-xs mt-0.5">
              {loading ? 'Finding technicians…'
                : workers.length === 0 ? 'No technicians available'
                : `${workers.length} technician${workers.length !== 1 ? 's' : ''} available · Nearest pre-selected`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
            <X size={15} className="text-gray-600" />
          </button>
        </div>

        {/* Map */}
        <div className="relative shrink-0" style={{ height: 260 }}>
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 z-10 gap-2">
              <Loader2 size={22} className="text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-400">Locating technicians…</p>
            </div>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          {!loading && (
            <div className="absolute bottom-2 left-2 bg-white/95 rounded-xl shadow px-3 py-1.5 flex gap-3 text-xs" style={{ zIndex: 400 }}>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />You</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Nearest</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" />Available</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" />No Location</span>
            </div>
          )}
        </div>

        {/* Worker list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 min-h-0">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
              <AlertTriangle size={14} /> {error}
            </div>
          )}

          {!loading && workers.length === 0 && !error && (
            <div className="text-center py-10">
              <MapPin size={32} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-500 font-semibold">No technicians available right now</p>
              <p className="text-gray-400 text-xs mt-1">Try again shortly or choose Service Center drop-off</p>
            </div>
          )}

          {workers.map((w, idx) => {
            const isNearest  = idx === 0;
            const isSelected = selected?.id === w.id;
            const hasGps     = w.latitude !== null;

            return (
              <button
                key={w.id}
                onClick={() => setSelected(w)}
                className={`w-full text-left rounded-2xl border-2 p-3.5 transition-all ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50 shadow-md shadow-indigo-100'
                    : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Avatar */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0 ${
                    isSelected ? 'bg-gradient-to-br from-indigo-500 to-purple-600'
                    : isNearest && hasGps ? 'bg-gradient-to-br from-green-500 to-emerald-600'
                    : 'bg-gradient-to-br from-orange-400 to-orange-500'
                  }`}>
                    {(w.workerName || 'W')[0].toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm truncate">{w.workerName}</p>
                      {isNearest && hasGps && (
                        <span className="flex items-center gap-1 text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          <Zap size={9} /> Nearest
                        </span>
                      )}
                      {isSelected && !(isNearest && hasGps) && (
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Selected</span>
                      )}
                    </div>

                    <p className="text-xs text-gray-400 mt-0.5">{w.role || 'Mechanic'}</p>

                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {/* Rating — key decision factor */}
                      <Stars rating={w.rating} />
                      {w.distanceKm != null && (
                        <span className="flex items-center gap-1 text-xs text-indigo-600 font-semibold">
                          <Navigation size={10} /> {w.distanceKm.toFixed(1)} km
                        </span>
                      )}
                      {!hasGps && (
                        <span className="text-[10px] text-gray-300 italic">Location not shared</span>
                      )}
                      {w.phone && (
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          <Phone size={10} /> {w.phone}
                        </span>
                      )}
                    </div>

                    {w.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {w.skills.slice(0, 3).map(s => (
                          <span key={s} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <ChevronRight size={16} className={`shrink-0 ${isSelected ? 'text-indigo-400' : 'text-gray-300'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-100 bg-white shrink-0">
          {selected ? (
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400">Confirming technician</p>
                <p className="font-bold text-gray-800 text-sm truncate">{selected.workerName}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Stars rating={selected.rating} />
                  {selected.distanceKm != null && (
                    <span className="text-xs text-indigo-600 font-semibold">{selected.distanceKm.toFixed(1)} km away</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => onWorkerSelected(selected.id, selected.workerName)}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-3 rounded-2xl transition-colors shadow-lg shadow-indigo-200"
              >
                Confirm <ChevronRight size={16} />
              </button>
            </div>
          ) : (
            <p className="text-center text-gray-400 text-sm py-1">Select a technician to continue</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NearbyWorkersMap;