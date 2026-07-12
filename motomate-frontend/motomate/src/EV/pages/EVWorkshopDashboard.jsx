import React, { useEffect, useState } from 'react';
import { Wrench, Clock3, Activity, CheckCircle2, XCircle, Menu } from 'lucide-react';
import { EVCard, EVHeading, EVLoader, EVError, EVStatCard, EVStatusBadge } from '../EVDesignSystem'
import { EVWorkshopSidebar } from '../components/EVSidebar';
import { evWorkshopApi } from '../api/evApi';

// Workshop id for the currently logged-in EV service center.
// Falls back to localStorage hints if the /my-workshop lookup fails.
const getCachedWorkshopId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return (user && (user.workshopId || user.id)) || localStorage.getItem('evWorkshopId');
  } catch {
    return localStorage.getItem('evWorkshopId');
  }
};

export default function EVWorkshopDashboard() {
  const [stats, setStats] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workshopId, setWorkshopId] = useState(getCachedWorkshopId());

  const load = async () => {
    let id = workshopId;
    if (!id) {
      try {
        const workshop = await evWorkshopApi.getMyWorkshop();
        id = workshop.id;
        setWorkshopId(id);
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...user, workshopId: id }));
        } catch {}
      } catch (e) {
        setError('No EV workshop is linked to this account.');
        setLoading(false);
        return;
      }
    }
    try {
      const [dashboard, reqs] = await Promise.all([
        evWorkshopApi.getDashboard(id),
        evWorkshopApi.getRequests(id),
      ]);
      setStats(dashboard);
      setRequests(reqs);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // Poll so newly booked customer requests show up without a manual refresh
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ev-root" style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
        <EVWorkshopSidebar />
      </div>
      {sidebarOpen && <EVWorkshopSidebar mobile onClose={() => setSidebarOpen(false)} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {window.innerWidth < 768 && (
          <EVMobileHeader title="EV Workshop" onMenuClick={() => setSidebarOpen(true)} />
        )}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <EVHeading size="xl" sub="Overview of EV service requests for your center">Workshop Dashboard</EVHeading>
          </div>

          {loading ? (
            <EVLoader text="Loading dashboard…" />
          ) : error ? (
            <EVError message={error} onRetry={() => { setLoading(true); load(); }} />
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '28px' }}>
                <EVStatCard icon={Wrench} label="Total Requests" value={stats?.totalRequests ?? 0} color="teal" />
                <EVStatCard icon={Clock3} label="Pending" value={stats?.pendingRequests ?? 0} color="amber" />
                <EVStatCard icon={Activity} label="Active" value={stats?.activeRequests ?? 0} color="teal" />
                <EVStatCard icon={CheckCircle2} label="Completed" value={stats?.completedRequests ?? 0} color="teal" />
                <EVStatCard icon={XCircle} label="Cancelled" value={stats?.cancelledRequests ?? 0} color="red" />
              </div>

              <EVCard>
                <p className="ev-heading" style={{ margin: '0 0 14px', fontSize: '16px' }}>Recent service requests</p>
                {requests.length === 0 ? (
                  <p style={{ color: '#94A3B8', fontSize: '13px' }}>No EV service requests yet.</p>
                ) : (
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {requests.slice(0, 6).map(r => (
                      <div key={r.id} style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        gap: '12px', flexWrap: 'wrap', padding: '12px 14px',
                        borderRadius: '12px', background: 'var(--ev-surface)',
                      }}>
                        <div>
                          <p style={{ margin: 0, color: '#F8FAFC', fontWeight: 600, fontSize: '14px' }}>
                            {r.vehicleMake} {r.vehicleModel} · {r.vehicleNumber}
                          </p>
                          <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '12px' }}>
                            {r.serviceType?.replace(/_/g, ' ')} — {r.customerAddress || 'No address provided'}
                          </p>
                        </div>
                        <EVStatusBadge status={r.status} />
                      </div>
                    ))}
                  </div>
                )}
              </EVCard>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
