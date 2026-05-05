import { useState, useEffect } from 'react';
import { MapPin, Radio, CheckCircle } from 'lucide-react';
// FIX: Corrected import casing — was '../../components/WorkerMapView' (lowercase c)
// The actual folder is 'Components' (uppercase C) — case-sensitive on Linux/Vite
import WorkerMapView from '../../Components/WorkerMapView';
import useWorkerLocationTracker from '../../hooks/useWorkerLocationTracker';

/**
 * WorkerJobMapSection
 *
 * Drop-in map section for the Worker's CurrentJobCard or CurrentJobPage.
 * Shows:
 *  - Worker's live position (updates every 7 s via useWorkerLocationTracker)
 *  - Customer's pinned location
 *  - Driving route + ETA via OSRM
 *  - "Navigate" button → Google Maps
 *
 * Props:
 *  workerId   string   SCOWorker.id
 *  job        object   Must have customerLatitude, customerLongitude
 *  isActive   boolean  true when job status is IN_PROGRESS or beyond
 */
const WorkerJobMapSection = ({ workerId, job, isActive = false }) => {
  const [workerCoords, setWorkerCoords] = useState(null);

  const {
    isTracking,
    startTracking,
    stopTracking,
    error: trackingError,
    lastSent,
  } = useWorkerLocationTracker(workerId, { intervalMs: 7000 });

  useEffect(() => {
    if (!isActive) {
      stopTracking();
      return;
    }

    startTracking();

    // Also watch position locally so the map updates in real-time
    // (separate from the backend push interval)
    let watchId = null;
    if (navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setWorkerCoords({
            latitude:  pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    return () => {
      stopTracking();
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, workerId]);

  const hasCustomerLocation = !!(job?.customerLatitude && job?.customerLongitude);
  if (!hasCustomerLocation) return null;

  return (
    <div className="mt-5 space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin size={17} className="text-indigo-600" />
          <span className="font-bold text-gray-900 text-sm">Navigate to Customer</span>
        </div>

        {isTracking ? (
          <span className="flex items-center gap-1.5 text-xs text-green-600 font-medium bg-green-50 border border-green-200 px-2.5 py-1 rounded-full">
            <Radio size={11} className="animate-pulse" />
            Sharing Location
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-gray-400 font-medium bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full">
            Location Paused
          </span>
        )}
      </div>

      {/* Tracking error */}
      {trackingError && (
        <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          GPS: {trackingError}
        </p>
      )}

      {/* Last sync time */}
      {lastSent && (
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <CheckCircle size={11} className="text-green-400" />
          Location synced {new Date(lastSent).toLocaleTimeString()}
        </p>
      )}

      {/* Map */}
      <WorkerMapView
        workerLat={workerCoords?.latitude}
        workerLng={workerCoords?.longitude}
        customerLat={job.customerLatitude}
        customerLng={job.customerLongitude}
        customerName={job.customerName || 'Customer'}
        customerAddress={job.address || ''}
      />
    </div>
  );
};

export default WorkerJobMapSection;