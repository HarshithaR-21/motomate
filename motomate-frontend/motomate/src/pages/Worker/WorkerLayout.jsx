import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import WorkerSidebar from './components/WorkerSidebar';
import { fetchMe, fetchWorkerByUserId } from './api/workerApi';
import useWorkerLocationTracker from '../../hooks/useWorkerLocationTracker';
import { toast, Toaster } from 'react-hot-toast';

const BASE_URL = 'http://localhost:8080';

const WorkerLayout = () => {
  const [worker,     setWorker]     = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userId,     setUserId]     = useState(null);
  const navigate   = useNavigate();
  const sseRef     = useRef(null);
  const workerRef  = useRef(null);

  useEffect(() => { workerRef.current = worker; }, [worker]);

  // ── GPS location tracker ──────────────────────────────────────────────────
  // worker?.id is null until auth resolves — the hook handles that gracefully.
  const { startTracking, stopTracking, isTracking, error: gpsError } =
    useWorkerLocationTracker(worker?.id, { intervalMs: 7000, autoStart: false });

  // ── Auth + worker load ────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        const me = await fetchMe();
        if (me.role !== 'WORKER') { navigate('/login'); return; }

        const uid = me.id || me.userId;
        setUserId(uid);

        const workerData = await fetchWorkerByUserId(uid);
        setWorker(workerData);
      } catch {
        navigate('/login');
      }
    };
    init();
  }, []);

  // ── Start GPS as soon as we have the worker id ────────────────────────────
  // This keeps the worker's location fresh in the DB so:
  //   1. NearbyWorkersMap shows them to customers
  //   2. CustomerTrackingSection can draw the live route
  useEffect(() => {
    if (!worker?.id) return;

    // Request permission and start broadcasting
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser. Live tracking unavailable.');
      return;
    }

    // One-shot permission check before starting the interval tracker
    navigator.geolocation.getCurrentPosition(
      () => {
        // Permission granted — start continuous tracking
        startTracking();
        console.log('[GPS] Location tracking started for worker', worker.id);
      },
      (err) => {
        console.warn('[GPS] Permission denied or error:', err.message);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error(
            'Location permission denied. Customers cannot see you on the map.\n' +
            'Please allow location access in your browser settings.',
            { duration: 8000 }
          );
        } else {
          // Timeout or unavailable — still try to start tracking (watchPosition
          // will keep retrying with its own longer timeout)
          console.warn('[GPS] Initial position failed, starting tracker anyway:', err.message);
          startTracking();
        }
      },
      // FIX: 30 s timeout (was 10 s) — allows slow GPS hardware to get first fix
      { enableHighAccuracy: true, timeout: 30000, maximumAge: 15000 }
    );

    // Stop tracking cleanly when the worker logs out / component unmounts
    return () => { stopTracking(); };
  }, [worker?.id]);

  // Log GPS errors as toasts (non-fatal)
  useEffect(() => {
    if (gpsError) {
      console.warn('[GPS]', gpsError);
      toast.error(`GPS: ${gpsError}`, { id: 'gps-error', duration: 5000 });
    }
  }, [gpsError]);

  // ── SSE subscription ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!userId) return;

    const openSse = () => {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }

      const es = new EventSource(
        `${BASE_URL}/api/notifications/subscribe/${userId}`,
        { withCredentials: true }
      );
      sseRef.current = es;

      es.addEventListener('connected', () => {
        console.log('[SSE] Worker stream connected');
      });

      es.addEventListener('worker_assigned', (event) => {
        try {
          const data = JSON.parse(event.data);
          setWorker(prev => prev ? { ...prev, availability: 'BUSY' } : prev);

          toast.custom((t) => (
            <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}
              max-w-sm w-full bg-white shadow-lg rounded-2xl pointer-events-auto
              flex ring-1 ring-black ring-opacity-5 p-4 gap-3`}>
              <div className="shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">🔧</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 text-sm">New Job Assigned!</p>
                <p className="text-gray-600 text-xs mt-0.5 truncate">{data.customerName} — {data.vehicleNumber}</p>
                <p className="text-gray-500 text-xs">{(data.serviceNames || []).join(', ')}</p>
              </div>
            </div>
          ), { duration: 8000 });

          if (window.__workerJobRefresh) window.__workerJobRefresh();
        } catch (err) {
          console.error('[SSE] worker_assigned parse error', err);
        }
      });

      es.addEventListener('job_status_updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          toast(`Job status: ${data.status.replace(/_/g, ' ')}`, { icon: 'ℹ️' });
          if (window.__workerJobRefresh) window.__workerJobRefresh();
        } catch (err) {
          console.error('[SSE] job_status_updated parse error', err);
        }
      });

      es.onerror = () => {
        es.close();
        sseRef.current = null;
        setTimeout(openSse, 5000);
      };
    };

    openSse();
    return () => { if (sseRef.current) { sseRef.current.close(); sseRef.current = null; } };
  }, [userId]);

  const handleLogout = () => {
    stopTracking();
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    document.cookie = 'token=; Max-Age=0';
    navigate('/login');
  };

  const handleWorkerUpdate = (updated) => setWorker(updated);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <Toaster position="top-right" />

      {/* GPS status indicator — subtle banner when tracking is active */}
      {isTracking && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2
          bg-green-500 text-white text-xs font-semibold py-1 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse inline-block" />
          Sharing location with customers
        </div>
      )}

      <WorkerSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        workerName={worker?.name}
        centerName={worker?.serviceCenterId}
        status={worker?.availability || 'AVAILABLE'}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Outlet
          context={{
            worker,
            onWorkerUpdate: handleWorkerUpdate,
            onMenuClick: () => setMobileOpen(true),
          }}
        />
      </div>
    </div>
  );
};

export default WorkerLayout;