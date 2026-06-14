import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SCOHeader from './components/SCOHeader';
import SCOSidebar from './components/SCOSidebar';
import { toast, Toaster } from 'react-hot-toast';
import { AlertTriangle } from 'lucide-react';

const BASE_URL = 'http://localhost:8080';

const SCOLayout = () => {
  const navigate    = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser]             = useState(null);
  const [sosBadge, setSosBadge]     = useState(0);   // unread SOS count shown in sidebar
  const sseRef                      = useRef(null);

  // ── Load user ─────────────────────────────────────────────────────────────
  // Login stores under 'user' key. SCOLayout was incorrectly reading 'scoUser'.
  useEffect(() => {
    const stored = localStorage.getItem('user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  // ── SSE: aggressive SOS notifications ────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const openSse = () => {
      if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }

      const es = new EventSource(
        `${BASE_URL}/api/notifications/subscribe/${user.id}`,
        { withCredentials: true }
      );
      sseRef.current = es;

      es.addEventListener('connected', () => {
        console.log('[SCO-SSE] Connected');
      });

      // ── New SOS alert ─────────────────────────────────────────────────────
      es.addEventListener('NEW_SOS_REQUEST', (event) => {
        try {
          const data = JSON.parse(event.data);
          setSosBadge(n => n + 1);

          // Loud toast that stays until dismissed
          toast.custom((t) => (
            <div
              className={`${t.visible ? 'animate-enter' : 'animate-leave'}
                max-w-md w-full bg-red-600 shadow-2xl rounded-2xl pointer-events-auto
                flex gap-4 p-5 ring-2 ring-red-400`}
              style={{ cursor: 'pointer' }}
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/dashboard/service-center-owner/sos');
              }}
            >
              <div className="shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                <AlertTriangle size={26} className="text-white animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white text-base">🚨 SOS EMERGENCY!</p>
                <p className="text-red-100 text-sm font-semibold mt-0.5">
                  {data.customerName} · {data.emergencyType?.replace(/_/g, ' ')}
                </p>
                <p className={`text-xs mt-1 font-bold px-2 py-0.5 rounded-full inline-block ${
                  data.priority === 'EMERGENCY' ? 'bg-white text-red-600' : 'bg-red-400 text-white'
                }`}>
                  {data.priority} PRIORITY
                </p>
                <p className="text-red-200 text-xs mt-1.5">Tap to open SOS dashboard →</p>
              </div>
            </div>
          ), { duration: 30000, id: `sos-${data.sosId}` });

          // Also play browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification('🚨 SOS Emergency – MotoMate', {
              body: `${data.customerName} needs help: ${data.emergencyType?.replace(/_/g, ' ')}`,
              icon: '/favicon.ico',
              requireInteraction: true,
            });
          }
        } catch (err) {
          console.error('[SCO-SSE] NEW_SOS_REQUEST parse error', err);
        }
      });

      // ── SOS status updates ────────────────────────────────────────────────
      es.addEventListener('SOS_STATUS_UPDATE', (event) => {
        try {
          const data = JSON.parse(event.data);
          toast(`SOS #${data.sosId?.slice(-6)}: ${data.status?.replace(/_/g, ' ')}`,
            { icon: '📡', duration: 4000 });
        } catch {}
      });

      // ── SOS cancelled ─────────────────────────────────────────────────────
      es.addEventListener('SOS_CANCELLED', (event) => {
        try {
          const data = JSON.parse(event.data);
          setSosBadge(n => Math.max(0, n - 1));
          toast(`SOS cancelled by ${data.customerName}`, { icon: '✅', duration: 4000 });
        } catch {}
      });

      es.onerror = () => {
        es.close();
        sseRef.current = null;
        setTimeout(openSse, 5000);
      };
    };

    // Request browser notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }

    openSse();
    return () => { if (sseRef.current) { sseRef.current.close(); sseRef.current = null; } };
  }, [user?.id, navigate]);

  const handleLogout = async () => {
    if (sseRef.current) { sseRef.current.close(); sseRef.current = null; }
    try {
      await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login/service-center-owner');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-white via-purple-50/30 to-white overflow-hidden">
      <Toaster position="top-right" />

      <SCOSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        centerName={user?.centerName || user?.businessName || user?.name}
        sosBadge={sosBadge}
        onSosBadgeClear={() => setSosBadge(0)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SCOHeader
          onMenuClick={() => setMobileOpen(true)}
          ownerName={user?.name}
          centerName={user?.centerName || user?.businessName}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto pt-16">
          <div className="p-6 lg:p-8">
            <Outlet context={{ user, ownerId: user?.id }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SCOLayout;
