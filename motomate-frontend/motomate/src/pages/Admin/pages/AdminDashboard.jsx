import { useState, useEffect } from 'react';
import {
  Users, Wrench, ShieldCheck, MessageSquare,
  TrendingUp, Clock, CheckCircle, AlertTriangle,
  Building2, Truck
} from 'lucide-react';
import { fetchDashboardStats } from '../api';
import { StatCard, Card, PageLoader, ErrorBlock, StatusBadge } from '../components/UI';

const DashboardPage = () => {
  const [stats, setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorBlock message={error} onRetry={load} />;

  const s = stats || {};

  return (
    <div className="space-y-8">
      {/* Page title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Live summary of all platform activity
        </p>
      </div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={s.totalUsers?.toLocaleString()}
          sub={`+${s.newUsersToday ?? 0} today`}
          accent="red"
        />
        <StatCard
          icon={Wrench}
          label="Ongoing Services"
          value={s.ongoingServices?.toLocaleString()}
          sub={`${s.completedToday ?? 0} completed today`}
          accent="indigo"
        />
        <StatCard
          icon={ShieldCheck}
          label="Pending Verifications"
          value={s.pendingVerifications?.toLocaleString()}
          sub="Awaiting review"
          accent="amber"
        />
        <StatCard
          icon={MessageSquare}
          label="Open Queries"
          value={s.openQueries?.toLocaleString()}
          sub={`${s.resolvedToday ?? 0} resolved today`}
          accent="green"
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label="Service Centers"
          value={s.totalServiceCenters?.toLocaleString()}
          sub={`${s.pendingServiceCenters ?? 0} pending approval`}
          accent="blue"
        />
        <StatCard
          icon={Truck}
          label="Fleet Accounts"
          value={s.totalFleetManagers?.toLocaleString()}
          sub={`${s.pendingFleetManagers ?? 0} pending approval`}
          accent="indigo"
        />
        <StatCard
          icon={TrendingUp}
          label="Revenue (Month)"
          value={s.monthlyRevenue ? `₹${s.monthlyRevenue.toLocaleString()}` : '—'}
          sub={s.revenueGrowth ? `${s.revenueGrowth > 0 ? '+' : ''}${s.revenueGrowth}% vs last month` : ''}
          accent="green"
        />
        <StatCard
          icon={CheckCircle}
          label="Services Completed"
          value={s.totalCompleted?.toLocaleString()}
          sub="All time"
          accent="red"
        />
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Verifications */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Recent Verification Requests</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest account approval requests</p>
            </div>
            <a href="/admin/verifications/service-centers" className="text-xs text-red-600 font-semibold hover:underline">
              View all
            </a>
          </div>

          {!s.recentVerifications || s.recentVerifications.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No recent requests</p>
          ) : (
            <div className="space-y-3">
              {s.recentVerifications.map((v, i) => (
                <div key={v._id || i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-red-50/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                    {v.type === 'service-center' ? <Building2 size={16} className="text-red-600" /> : <Truck size={16} className="text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{v.name}</p>
                    <p className="text-xs text-gray-400">{v.type === 'service-center' ? 'Service Center' : 'Fleet Manager'} · {v.city}</p>
                  </div>
                  <StatusBadge status={v.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Queries */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Recent User Queries</h3>
              <p className="text-xs text-gray-400 mt-0.5">Latest support tickets</p>
            </div>
            <a href="/admin/queries" className="text-xs text-red-600 font-semibold hover:underline">
              View all
            </a>
          </div>

          {!s.recentQueries || s.recentQueries.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No recent queries</p>
          ) : (
            <div className="space-y-3">
              {s.recentQueries.map((q, i) => (
                <div key={q._id || i} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 hover:bg-red-50/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MessageSquare size={15} className="text-red-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{q.subject}</p>
                    <p className="text-xs text-gray-400">{q.userName} · {q.createdAt ? new Date(q.createdAt).toLocaleDateString() : ''}</p>
                  </div>
                  <StatusBadge status={q.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Ongoing Services snapshot */}
        <Card>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-base font-bold text-gray-900">Active Services</h3>
              <p className="text-xs text-gray-400 mt-0.5">Currently in progress</p>
            </div>
            <a href="/admin/services" className="text-xs text-red-600 font-semibold hover:underline">
              View all
            </a>
          </div>

          {!s.recentServices || s.recentServices.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No active services</p>
          ) : (
            <div className="space-y-3">
              {s.recentServices.map((svc, i) => (
                <div key={svc._id || i} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                  <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <Wrench size={15} className="text-indigo-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{svc.serviceType}</p>
                    <p className="text-xs text-gray-400">{svc.customerName} · {svc.workerName}</p>
                  </div>
                  <StatusBadge status={svc.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Platform alerts */}
        <Card>
          <div className="mb-5">
            <h3 className="text-base font-bold text-gray-900">Platform Alerts</h3>
            <p className="text-xs text-gray-400 mt-0.5">Items that need attention</p>
          </div>

          {!s.alerts || s.alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle size={28} className="text-green-400" />
              <p className="text-sm text-gray-400">All systems normal</p>
            </div>
          ) : (
            <div className="space-y-3">
              {s.alerts.map((alert, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    alert.severity === 'high'
                      ? 'bg-red-50 border-red-200'
                      : alert.severity === 'medium'
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <AlertTriangle
                    size={16}
                    className={
                      alert.severity === 'high'
                        ? 'text-red-500 shrink-0 mt-0.5'
                        : alert.severity === 'medium'
                        ? 'text-amber-500 shrink-0 mt-0.5'
                        : 'text-blue-500 shrink-0 mt-0.5'
                    }
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{alert.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{alert.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardPage;
