import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

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

const customerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:#3B82F6;border:3px solid #fff;
    box-shadow:0 2px 6px rgba(0,0,0,0.35);
  "></div>`,
  iconSize:   [22, 22],
  iconAnchor: [11, 11],
});

const workerIcon = L.divIcon({
  className: '',
  html: `<div style="
    width:22px;height:22px;border-radius:50%;
    background:#F97316;border:3px solid #fff;
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

    const route    = data.routes[0];
    const coords   = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
    const distKm   = (route.distance / 1000).toFixed(1);
    const etaMins  = Math.ceil(route.duration / 60);

    return { coords, distKm, etaMins };
  } catch (_) {
    return null;
  }
};

// ── Component ─────────────────────────────────────────────────────────────────

const CustomerMapView = ({
  customerLat,
  customerLng,
  workerLat,
  workerLng,
  workerName = 'Your Technician',
}) => {
  const mapRef          = useRef(null);   // DOM node
  const mapInstance     = useRef(null);   // L.Map
  const customerMarker  = useRef(null);
  const workerMarker    = useRef(null);
  const routeLayer      = useRef(null);

  const [eta,     setEta]     = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Init map ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    if (!customerLat || !customerLng) return;

    const map = L.map(mapRef.current, {
      center:             [customerLat, customerLng],
      zoom:               14,
      zoomControl:        true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    // Customer marker
    customerMarker.current = L.marker([customerLat, customerLng], { icon: customerIcon })
      .addTo(map)
      .bindPopup('<b>Your Location</b>');

    mapInstance.current = map;
    setLoading(false);

    return () => {
      map.remove();
      mapInstance.current   = null;
      customerMarker.current = null;
      workerMarker.current  = null;
      routeLayer.current    = null;
    };
  }, [customerLat, customerLng]);

  // ── Update worker marker + route when worker location changes ───────────────

  useEffect(() => {
    if (!mapInstance.current || !workerLat || !workerLng) return;

    const map = mapInstance.current;
    const pos = [workerLat, workerLng];

    if (workerMarker.current) {
      workerMarker.current.setLatLng(pos);
    } else {
      workerMarker.current = L.marker(pos, { icon: workerIcon })
        .addTo(map)
        .bindPopup(`<b>${workerName}</b><br/>On the way to you`);
    }

    // Fit both markers in view
    map.fitBounds(
      L.latLngBounds([customerLat, customerLng], [workerLat, workerLng]),
      { padding: [50, 50] }
    );

    // Draw route
    fetchRoute(workerLat, workerLng, customerLat, customerLng).then((result) => {
      if (!result) return;
      if (routeLayer.current) map.removeLayer(routeLayer.current);
      routeLayer.current = L.polyline(result.coords, {
        color:   '#6366F1',
        weight:  5,
        opacity: 0.85,
      }).addTo(map);
      setEta(`${result.etaMins} mins · ${result.distKm} km`);
    });
  }, [workerLat, workerLng, customerLat, customerLng, workerName]);

  // ── Render ──────────────────────────────────────────────────────────────────

  if (!customerLat || !customerLng) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-gray-50 rounded-2xl border border-gray-200 gap-3">
        <MapPin className="text-gray-400" size={28} />
        <p className="text-gray-500 text-sm">Customer location not available</p>
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

      {/* Legend bar */}
      <div
        className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-xl shadow-md px-3 py-2 flex gap-4 text-xs font-medium"
        style={{ zIndex: 400 }}
      >
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" /> You
        </span>
        {workerLat ? (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-orange-400 inline-block" />
            {workerName}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-gray-400">
            <Navigation size={12} /> Waiting for worker…
          </span>
        )}
        {eta && (
          <span className="text-indigo-600 font-semibold flex items-center gap-1">
            <Navigation size={12} /> {eta}
          </span>
        )}
      </div>

      {/* Map container */}
      <div ref={mapRef} style={{ width: '100%', height: '380px', zIndex: 0 }} />

      {/* OSM attribution */}
      <div className="absolute bottom-1 right-2 text-[10px] text-gray-400" style={{ zIndex: 400 }}>
        © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer"
             className="underline">OpenStreetMap</a> contributors
      </div>
    </div>
  );
};

export default CustomerMapView;