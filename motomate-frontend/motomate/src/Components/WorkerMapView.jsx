import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2, ExternalLink } from 'lucide-react';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icon broken by Vite/webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Custom marker icons ───────────────────────────────────────────────────────

const workerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:#3B82F6;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize:   [22, 22],
  iconAnchor: [11, 11],
});

const customerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:#EF4444;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize:   [22, 22],
  iconAnchor: [11, 11],
});

// ── OSRM routing (free, no API key) ──────────────────────────────────────────

const fetchRoute = async (wLat, wLng, cLat, cLng) => {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${wLng},${wLat};${cLng},${cLat}` +
      `?overview=full&geometries=geojson`;

    const res  = await fetch(url);
    const data = await res.json();

    if (data.code !== 'Ok' || !data.routes?.length) return null;

    const route   = data.routes[0];
    const coords  = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const distKm  = (route.distance / 1000).toFixed(1);
    const etaMins = Math.ceil(route.duration / 60);

    return { coords, distKm, etaMins };
  } catch (_) {
    return null;
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * WorkerMapView — Leaflet + OpenStreetMap + OSRM
 *
 * Props:
 *  workerLat       number   (updates as worker moves)
 *  workerLng       number
 *  customerLat     number
 *  customerLng     number
 *  customerName    string
 *  customerAddress string
 */
const WorkerMapView = ({
  workerLat,
  workerLng,
  customerLat,
  customerLng,
  customerName    = 'Customer',
  customerAddress = '',
}) => {
  const mapRef         = useRef(null);
  const mapInstance    = useRef(null);
  const workerMarker   = useRef(null);
  const customerMarker = useRef(null);
  const routeLayer     = useRef(null);

  const [eta,     setEta]     = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Init map ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    const centerLat = workerLat || customerLat || 12.9716;
    const centerLng = workerLng || customerLng || 77.5946;

    const map = L.map(mapRef.current, {
      center:             [centerLat, centerLng],
      zoom:               14,
      zoomControl:        true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Customer marker (red)
    if (customerLat && customerLng) {
      customerMarker.current = L.marker([customerLat, customerLng], { icon: customerIcon })
        .addTo(map)
        .bindPopup(
          `<b>${customerName}</b>${customerAddress ? `<br/>${customerAddress}` : ''}`
        );
    }

    // Worker marker (blue)
    if (workerLat && workerLng) {
      workerMarker.current = L.marker([workerLat, workerLng], { icon: workerIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>');
    }

    mapInstance.current = map;
    setLoading(false);

    // Initial fit + route
    if (workerLat && workerLng && customerLat && customerLng) {
      map.fitBounds(
        L.latLngBounds([workerLat, workerLng], [customerLat, customerLng]),
        { padding: [50, 50] }
      );
      drawRoute(workerLat, workerLng, customerLat, customerLng, map);
    }

    return () => {
      map.remove();
      mapInstance.current    = null;
      workerMarker.current   = null;
      customerMarker.current = null;
      routeLayer.current     = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Update worker marker + route as worker moves ──────────────────────────

  useEffect(() => {
    if (!mapInstance.current || !workerLat || !workerLng) return;

    const map = mapInstance.current;

    if (workerMarker.current) {
      workerMarker.current.setLatLng([workerLat, workerLng]);
    } else {
      workerMarker.current = L.marker([workerLat, workerLng], { icon: workerIcon })
        .addTo(map)
        .bindPopup('<b>Your Location</b>');
    }

    if (customerLat && customerLng) {
      map.fitBounds(
        L.latLngBounds([workerLat, workerLng], [customerLat, customerLng]),
        { padding: [50, 50] }
      );
      drawRoute(workerLat, workerLng, customerLat, customerLng, map);
    }
  }, [workerLat, workerLng]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Draw OSRM route ───────────────────────────────────────────────────────

  const drawRoute = async (wLat, wLng, cLat, cLng, map) => {
    const result = await fetchRoute(wLat, wLng, cLat, cLng);
    if (!result) return;

    if (routeLayer.current) map.removeLayer(routeLayer.current);

    routeLayer.current = L.polyline(result.coords, {
      color:   '#6366F1',
      weight:  5,
      opacity: 0.85,
    }).addTo(map);

    setEta(`${result.etaMins} mins · ${result.distKm} km`);
  };

  // ── Open Google Maps navigation ───────────────────────────────────────────

  const openNavigation = () => {
    if (!customerLat || !customerLng) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${customerLat},${customerLng}&travelmode=driving`;
    window.open(url, '_blank');
  };

  // ── Render ────────────────────────────────────────────────────────────────

  if (!customerLat || !customerLng) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-amber-50 rounded-2xl border border-amber-200 gap-3">
        <MapPin className="text-amber-500" size={28} />
        <p className="text-amber-700 text-sm font-medium">Customer location not shared yet</p>
      </div>
    );
  }

  return (
    // FIX: Replaced invalid Tailwind z-400/z-500 classes with inline style zIndex
    <div className="relative rounded-2xl overflow-hidden border border-gray-200 shadow-sm">

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50" style={{ zIndex: 500 }}>
          <Loader2 className="animate-spin text-blue-500" size={28} />
        </div>
      )}

      {/* Top bar: legend + ETA + navigate button */}
      <div
        className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2"
        style={{ zIndex: 400 }}
      >
        {/* Legend + ETA */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 flex gap-3 text-xs font-medium flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> You
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> {customerName}
          </span>
          {eta && (
            <span className="text-indigo-600 font-semibold flex items-center gap-1">
              <Navigation size={12} /> {eta}
            </span>
          )}
        </div>

        {/* Navigate button */}
        <button
          onClick={openNavigation}
          className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-md transition-colors whitespace-nowrap"
        >
          <ExternalLink size={13} />
          Navigate
        </button>
      </div>

      {/* Map */}
      <div ref={mapRef} style={{ width: '100%', height: '380px', zIndex: 0 }} />

      {/* OSM attribution */}
      <div className="absolute bottom-1 right-2 text-[10px] text-gray-400" style={{ zIndex: 400 }}>
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"
             className="underline">OpenStreetMap</a> contributors
      </div>
    </div>
  );
};

export default WorkerMapView;