import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import WorkerSidebar from './components/WorkerSidebar';
import { fetchMe, fetchWorkerByUserId } from './api/workerApi';
import { toast, Toaster } from 'react-hot-toast';

const BASE_URL = 'http://localhost:8080';

const WorkerLayout = () => {
  const [worker, setWorker]         = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userId, setUserId]         = useState(null);
  const navigate                    = useNavigate();
  const sseRef                      = useRef(null);      // holds the EventSource
  const workerRef                   = useRef(null);      // always-current worker snapshot

  // Keep the ref in sync so SSE callbacks read the latest worker state
  useEffect(() => { workerRef.current = worker; }, [worker]);

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

  // ── SSE subscription — opens once userId is known ────────────────────────
  useEffect(() => {
    if (!userId) return;

    const openSse = () => {
      // Close any existing connection first
      if (sseRef.current) {
        sseRef.current.close();
        sseRef.current = null;
      }

      const es = new EventSource(
        `${BASE_URL}/api/notifications/subscribe/${userId}`,
        { withCredentials: true }
      );
      sseRef.current = es;

      // ── Connection confirmed ────────────────────────────────────────────
      es.addEventListener('connected', () => {
        console.log('[SSE] Worker stream connected');
      });

      // ── New job assigned to this worker ────────────────────────────────
      es.addEventListener('worker_assigned', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] worker_assigned', data);

          // Update availability to BUSY in UI immediately
          setWorker(prev => prev ? { ...prev, availability: 'BUSY' } : prev);

          // Show a rich toast notification
          toast.custom(
            (t) => (
              <div
                className={`${t.visible ? 'animate-enter' : 'animate-leave'}
                  max-w-sm w-full bg-white shadow-lg rounded-2xl pointer-events-auto
                  flex ring-1 ring-black ring-opacity-5 p-4 gap-3`}
              >
                <div className="shrink-0 w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-xl">
                  🔧
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm">New Job Assigned!</p>
                  <p className="text-gray-600 text-xs mt-0.5 truncate">
                    {data.customerName} — {data.vehicleNumber}
                  </p>
                  <p className="text-gray-500 text-xs">
                    {(data.serviceNames || []).join(', ')}
                  </p>
                </div>
              </div>
            ),
            { duration: 8000 }
          );

          // If a custom callback is registered (e.g. to reload job list), call it
          if (window.__workerJobRefresh) window.__workerJobRefresh();
        } catch (err) {
          console.error('[SSE] worker_assigned parse error', err);
        }
      });

      // ── Job status updated ──────────────────────────────────────────────
      es.addEventListener('job_status_updated', (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('[SSE] job_status_updated', data);
          toast(`Job status updated: ${data.status}`, { icon: 'ℹ️' });
          if (window.__workerJobRefresh) window.__workerJobRefresh();
        } catch (err) {
          console.error('[SSE] job_status_updated parse error', err);
        }
      });

      // ── SSE transport errors — auto-reconnect ───────────────────────────
      es.onerror = (err) => {
        console.warn('[SSE] Worker stream error, will reconnect…', err);
        es.close();
        sseRef.current = null;
        // Browser EventSource reconnects automatically after a short delay,
        // but we explicitly recreate to reset listeners cleanly.
        setTimeout(openSse, 5000);
      };
    };

    openSse();

    return () => {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    };
  }, [userId]);

  // ── Auth helpers ──────────────────────────────────────────────────────────
  const handleLogout = () => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    document.cookie = 'token=; Max-Age=0';
    navigate('/login');
  };

  const handleWorkerUpdate = (updated) => setWorker(updated);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* react-hot-toast container */}
      <Toaster position="top-right" />

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
