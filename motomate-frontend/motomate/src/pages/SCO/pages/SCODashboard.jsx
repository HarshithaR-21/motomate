import { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Wrench, Users, ClipboardList, CheckCircle2,
  ArrowRight, RefreshCw, Clock, AlertCircle, UserCheck
} from 'lucide-react';
import { fetchSCODashboard } from '../api';
import { StatCard, Card, PageLoader, ErrorBlock, StatusBadge, UrgencyBadge } from '../components/UI';
import Header from '../components/Header';

const SCODashboard = () => {
  const outletContext = useOutletContext() || {};
  const { ownerId: contextOwnerId, user } = outletContext;
  const [ownerId, setOwnerId] = useState(contextOwnerId);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (contextOwnerId) {
      setOwnerId(contextOwnerId);
      return;
    }

    const fetchMe = async () => {
      try {
        const resp = await axios.get('http://localhost:8080/api/auth/me', { withCredentials: true });
        const id = resp.data?.id || resp.data?.userId;
        if (resp.status === 200 && id) {
          setOwnerId(id);
        } else {
          console.error('SCO dashboard fetchMe: invalid response', resp);
          setError('Unable to determine logged in user. Please login again.');
        }
      } catch (err) {
        console.error('SCO dashboard fetchMe error:', err);
        setError('Unable to fetch user data. Please login again.');
      }
    };

    fetchMe();
  }, [contextOwnerId]);

  const load = async () => {
    if (!ownerId) {
      setLoading(false);
      return;
    }
    setLoading(true); setError(null);
    try {
      const data = await fetchSCODashboard(ownerId);
      setStats(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ownerId]);

  if (loading) return <PageLoader />;
  if (error) return <ErrorBlock message={error} onRetry={load} />;

  const s = stats || {};
  const profileStatus = s.profileStatus || 'PENDING';

  const profileColors = {
    APPROVED: 'bg-green-50 border-green-200 text-green-700',
    PENDING:  'bg-amber-50 border-amber-200 text-amber-700',
    REJECTED: 'bg-red-50 border-red-200 text-red-700',
  };

  return (
    <div className="space-y-8">

    <Header />

      {/* Stat Cards */}
      <div className='mt-25 p-4 bg-purple-100'>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">Overview</h3>
          <button onClick={load} className="inline-flex items-center gap-1.5 text-xs text-purple-600 font-semibold hover:underline">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={Wrench}       label="Total Services"      value={s.totalServices}        sub="Offered at your center"       color="purple" />
          <StatCard icon={Users}        label="Total Workers"       value={s.totalWorkers}         sub={`${s.availableWorkers ?? 0} available now`} color="violet" />
          <StatCard icon={AlertCircle}  label="Pending Requests"    value={s.pendingRequests}      sub="Awaiting your action"         color="amber"  />
          <StatCard icon={CheckCircle2} label="Completed"           value={s.completedRequests}    sub="Total jobs done"              color="green"  />
        </div>
      </div>

      {/* Quick Action Cards + Recent Requests */}
      <div className="grid gap-6 lg:grid-cols-3 p-4">

        {/* Quick Actions */}
        <Card>
          <h3 className="text-base font-bold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-2.5">
            {[
              { label: 'Manage Services',  sub: `${s.totalServices ?? 0} services`,        icon: Wrench,        path: '/dashboard/service-center-owner/services', color: 'purple' },
              { label: 'Manage Workers',   sub: `${s.totalWorkers ?? 0} workers`,          icon: Users,         path: '/dashboard/service-center-owner/workers',  color: 'violet' },
              { label: 'View Requests',    sub: `${s.pendingRequests ?? 0} pending`,       icon: ClipboardList, path: '/dashboard/service-center-owner/requests',  color: 'indigo' },
              { label: 'Update Profile',   sub: 'Business info & docs',                    icon: UserCheck,     path: '/dashboard/service-center-owner/profile',   color: 'pink'   },
            ].map((a, i) => {
              const Icon = a.icon;
              const clr = {
                purple: 'bg-purple-100 text-purple-600',
                violet: 'bg-violet-100 text-violet-600',
                indigo: 'bg-indigo-100 text-indigo-600',
                pink:   'bg-pink-100 text-pink-600',
              }[a.color];
              return (
                <button key={i} onClick={() => navigate(a.path)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all text-left">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${clr}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{a.label}</p>
                    <p className="text-xs text-gray-400">{a.sub}</p>
                  </div>
                  <ArrowRight size={14} className="text-purple-400" />
                </button>
              );
            })}
          </div>
        </Card>

        {/* Recent Requests */}
        <Card className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Recent Requests</h3>
              <p className="text-sm text-gray-500">Latest incoming service requests</p>
            </div>
            <button onClick={() => navigate('/dashboard/service-center-owner/requests')}
              className="text-xs text-purple-600 font-semibold hover:underline">
              View all
            </button>
          </div>

          {s.recentRequests?.length > 0 ? (
            <div className="space-y-2">
              {s.recentRequests.map((r, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100/60">
                  <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">
                    {(r.customerName || 'C').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{r.customerName}</p>
                    <p className="text-xs text-gray-500 truncate">{(r.serviceNames || []).join(', ')}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <StatusBadge status={r.status} />
                    <UrgencyBadge urgency={r.urgency} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-36 flex items-center justify-center text-gray-400 text-sm">
              No requests yet
            </div>
          )}
        </Card>
      </div>
      </div>
    </div>
  );
};

export default SCODashboard;