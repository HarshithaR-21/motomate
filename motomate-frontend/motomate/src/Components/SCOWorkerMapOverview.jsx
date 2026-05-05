import { useEffect, useRef, useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import axios from 'axios';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon broken by Vite/webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BASE = 'http://localhost:8080/api';
const cfg  = { withCredentials: true };

/**
 * SCOWorkerMapOverview — Leaflet + OpenStreetMap (OPTIONAL Feature 5)
 *
 * Shows all active workers' live locations on a single map for the
 * Service Center Owner dashboard.
 * Polls backend every 15 seconds — no websocket needed.
 *
 * Marker colours:
 *  🟢 Green  = AVAILABLE
 *  🟠 Orange = BUSY (on a job)
 *  ⚪ Grey   = OFF_DUTY / no location
 *
 * Props:
 *  serviceCenterId  string
 *  workers          SCOWorker[]   List of worker objects with { id, name, availability }
 *
 * ── HOW TO INTEGRATE into SCO Dashboard ──────────────────────────────────
 *
 *   import SCOWorkerMapOverview from '../../components/SCOWorkerMapOverview';
 *
 *   <SCOWorkerMapOverview
 *     serviceCenterId={sco.serviceCenterId}
 *     workers={workers}
 *   />
 *
 * Install:
 *   npm install leaflet
 *   import 'leaflet/dist/leaflet.css'; in main.jsx
 */
const SCOWorkerMapOverview = ({ serviceCenterId, workers = [] }) => {
  const mapRef      = useRef(null);
  const mapInstance = useRef(null);
  const markersRef  = useRef({});   // workerId → L.Marker

  const [locations, setLocations] = useState([]);
  const [loading,   setLoading]   = useState(true);

  // ── Init map ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const map = L.map(mapRef.current, {
      center:             [12.9716, 77.5946],  // Bangalore default; adjusts on first data
      zoom:               12,
      zoomControl:        true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    mapInstance.current = map;
    setLoading(false);

    return () => {
      map.remove();
      mapInstance.current = null;
      markersRef.current  = {};
    };
  }, []);

  // ── Poll worker locations ─────────────────────────────────────────────────

  const fetchLocations = async () => {
    if (!serviceCenterId || workers.length === 0) return;

    const results = await Promise.allSettled(
      workers.map(async (w) => {
        try {
          const res = await axios.get(`${BASE}/location/worker/${w.id}`, cfg);
          const loc = res.data;
          if (!loc?.latitude || !loc?.longitude) return null;
          return {
            workerId:     w.id,
            name:         w.name || 'Worker',
            availability: w.availability || 'AVAILABLE',
            lat:          loc.latitude,
            lng:          loc.longitude,
            active:       loc.active,
          };
        } catch (_) { return null; }
      })
    );

    const valid = results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => r.value);

    setLocations(valid);
  };

  useEffect(() => {
    fetchLocations();
    const interval = setInterval(fetchLocations, 15000);
    return () => clearInterval(interval);
  }, [serviceCenterId, workers]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update markers when locations change ──────────────────────────────────

  useEffect(() => {
    if (!mapInstance.current || locations.length === 0) return;

    const map    = mapInstance.current;
    const bounds = L.latLngBounds();

    locations.forEach(({ workerId, name, lat, lng, availability }) => {
      bounds.extend([lat, lng]);

      const color = availability === 'BUSY'
        ? '#F97316'
        : availability === 'OFF_DUTY'
        ? '#9CA3AF'
        : '#22C55E';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="
            display:flex;flex-direction:column;align-items:center;gap:2px;
          ">
            <div style="
              width:20px;height:20px;border-radius:50%;
              background:${color};border:2.5px solid #fff;
              box-shadow:0 2px 5px rgba(0,0,0,0.3);
            "></div>
            <div style="
              background:rgba(0,0,0,0.65);color:#fff;
              font-size:10px;font-weight:600;
              padding:1px 5px;border-radius:4px;white-space:nowrap;
            ">${name.split(' ')[0]}</div>
          </div>`,
        iconSize:   [60, 36],
        iconAnchor: [30, 10],
      });

      if (markersRef.current[workerId]) {
        // Move existing marker
        markersRef.current[workerId].setLatLng([lat, lng]);
        markersRef.current[workerId].setIcon(icon);
      } else {
        // Create new marker
        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .bindPopup(`
            <b>${name}</b><br/>
            Status: <span style="color:${color};font-weight:600">${availability}</span><br/>
            <small>${lat.toFixed(5)}, ${lng.toFixed(5)}</small>
          `);
        markersRef.current[workerId] = marker;
      }
    });

    // Remove markers for workers no longer in locations list
    const activeIds = new Set(locations.map(l => l.workerId));
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        map.removeLayer(markersRef.current[id]);
        delete markersRef.current[id];
      }
    });

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [locations]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={17} className="text-indigo-600" />
          <span className="font-bold text-gray-900 text-sm">Worker Locations</span>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /> Available
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-400 inline-block" /> Busy
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400 inline-block" /> Off Duty
          </span>
          <span className="text-gray-400 italic">Refreshes every 15s</span>
        </div>
      </div>

      {/* Map */}
      <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-500">
            <Loader2 className="animate-spin text-indigo-500" size={24} />
          </div>
        )}

        {!loading && locations.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-400 pointer-events-none">
            <div className="bg-white/90 rounded-xl px-4 py-3 text-sm text-gray-500 shadow">
              No workers are sharing their location right now
            </div>
          </div>
        )}

        <div ref={mapRef} style={{ width: '100%', height: '340px', zIndex: 0 }} />

        {/* OSM attribution */}
        <div className="absolute bottom-1 right-2 z-400 text-[10px] text-gray-400">
          © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"
               className="underline">OpenStreetMap</a> contributors
        </div>
      </div>

      {/* Worker chips below map */}
      {locations.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {locations.map(w => (
            <div
              key={w.workerId}
              className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => {
                // Pan map to this worker
                if (mapInstance.current) {
                  mapInstance.current.setView([w.lat, w.lng], 15);
                  markersRef.current[w.workerId]?.openPopup();
                }
              }}
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                w.availability === 'BUSY'
                  ? 'bg-orange-400'
                  : w.availability === 'OFF_DUTY'
                  ? 'bg-gray-400'
                  : 'bg-green-500'
              }`} />
              <span className="font-medium text-gray-800 truncate">{w.name}</span>
              <span className="text-gray-400 ml-auto">{w.availability}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SCOWorkerMapOverview;