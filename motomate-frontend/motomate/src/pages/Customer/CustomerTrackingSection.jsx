import { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Loader2, AlertTriangle } from 'lucide-react';
// FIX: Corrected import casing — was '../../components/CustomerMapView' (lowercase c)
// The actual folder is 'Components' (uppercase C) — case-sensitive on Linux/Vite
import CustomerMapView from '../../Components/CustomerMapView';

const BASE_URL = 'http://localhost:8080';

/**
 * CustomerTrackingSection — drop-in live map for CurrentServiceStatus.jsx
 *
 * Shows the live map with worker location when:
 *  - serviceMode === 'Doorstep' or 'HOME_SERVICE'
 *  - booking has customerLatitude / customerLongitude
 *  - a worker is assigned (assignedWorkerId is set)
 *
 * Props:
 *  booking         CustomerServiceModel object (from backend)
 *  userId          logged-in customer's userId (for SSE)
 *  workerLocation  { latitude, longitude } | null  (from SSE in parent, or null)
 */
const CustomerTrackingSection = ({ booking, userId, workerLocation: externalWorkerLocation }) => {
  const [workerLoc, setWorkerLoc] = useState(externalWorkerLocation || null);
  const esRef = useRef(null);

  // If no external SSE prop is passed, open our own SSE and listen for location
  useEffect(() => {
    // externalWorkerLocation === undefined  → parent is NOT passing SSE down → we own it
    // externalWorkerLocation === null/obj   → parent owns the SSE, we just sync below
    if (externalWorkerLocation !== undefined) return;
    if (!userId) return;

    const es = new EventSource(`${BASE_URL}/api/notifications/subscribe/${userId}`, {
      withCredentials: true,
    });

    es.addEventListener('worker_location_update', (e) => {
      try {
        const data = JSON.parse(e.data);
        setWorkerLoc({ latitude: data.latitude, longitude: data.longitude });
      } catch (_) {}
    });

    esRef.current = es;
    return () => { es.close(); esRef.current = null; };
  }, [userId, externalWorkerLocation]);

  // Sync when parent pushes a new externalWorkerLocation
  useEffect(() => {
    if (externalWorkerLocation !== undefined) {
      setWorkerLoc(externalWorkerLocation);
    }
  }, [externalWorkerLocation]);

  const isDoorstep   = booking?.serviceMode === 'Doorstep' || booking?.serviceMode === 'HOME_SERVICE';
  const hasCustomerCoords = !!(booking?.customerLatitude && booking?.customerLongitude);
  const hasWorker    = !!booking?.assignedWorkerId;

  if (!isDoorstep) return null;

  if (!hasCustomerCoords) {
    return (
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-gray-400" />
          <h3 className="font-bold text-gray-900">Live Worker Tracking</h3>
        </div>
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          GPS location not captured for this booking. Please refresh the page or update your location.
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      <div className="flex items-center gap-2">
        <MapPin size={18} className="text-indigo-600" />
        <h3 className="font-bold text-gray-900">Live Worker Tracking</h3>
        {workerLoc && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full border border-green-200 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Live
          </span>
        )}
      </div>

      {!hasWorker && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
          <Loader2 size={16} className="animate-spin shrink-0" />
          Waiting for a worker to be assigned…
        </div>
      )}

      {hasWorker && !workerLoc && (
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-blue-700 text-sm">
          <Navigation size={16} className="shrink-0" />
          Worker assigned! Waiting for their location to come online…
        </div>
      )}

      {/* FIX: Always render the map — it handles null workerLat/workerLng gracefully */}
      <CustomerMapView
        customerLat={booking.customerLatitude}
        customerLng={booking.customerLongitude}
        workerLat={workerLoc?.latitude}
        workerLng={workerLoc?.longitude}
        workerName={booking.assignedWorkerName || 'Technician'}
      />
    </div>
  );
};

export default CustomerTrackingSection;