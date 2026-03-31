import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, MessageSquare, Building2,
  Truck, UserCog, ArrowRight, RefreshCw,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { fetchDashboardStats } from '../api';
import { StatCard, Card, PageLoader, ErrorBlock, StatusBadge } from '../components/UI';
import AdminHeader from '../components/AdminHeader';

const PIE_COLORS = ['#dc2626', '#f97316', '#facc15', '#4ade80', '#60a5fa', '#a78bfa'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </p>
      ))}
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

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
    <div className="relative overflow-hidden pt-28">
      <AdminHeader />
      <div className="absolute inset-0 bg-linear-to-br from-white via-red-50 to-white opacity-90" />
      <div className="pointer-events-none absolute -right-24 top-16 h-96 w-96 rounded-full bg-red-200 opacity-30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-56 h-80 w-80 rounded-full bg-red-300 opacity-20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-60" style={{ backgroundImage: 'radial-gradient(circle at top, rgba(220, 38, 38, 0.14), transparent 55%)' }} />
      
      <div className="relative space-y-10">
    
        <div className="rounded-4xl border border-red-100 bg-white/90 p-8" style={{ boxShadow: '0 24px 80px rgba(220, 38, 38, 0.06)' }}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 id="metrics" className="text-xl font-semibold text-gray-900">Key metrics</h2>
              <p className="mt-2 text-sm text-gray-500">A unified look at billing, bookings, and your most important fleet KPIs.</p>
            </div>
            <button
              onClick={load}
              className="inline-flex items-center gap-2 rounded-3xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100"
            >
              <RefreshCw size={16} /> Refresh dashboard
            </button>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Users}      label="Total Users"         value={s.totalUsers?.toLocaleString()}          sub={`${s.totalCustomers ?? 0} customers`}        accent="red"    />
            <StatCard icon={Building2}  label="Service Centers"     value={s.totalServiceCenters?.toLocaleString()} sub={`${s.pendingServiceCenters ?? 0} pending`}    accent="red"   />
            <StatCard icon={Truck}      label="Fleet Managers"      value={s.totalFleetManagers?.toLocaleString()}  sub={`${s.pendingFleetManagers ?? 0} pending`}     accent="red" />
            <StatCard icon={UserCog}    label="Total Workers"       value={s.totalWorkers?.toLocaleString()}        sub="Active mechanics"                             accent="red"  />
          </div>
        </div>

        <div id="charts" className="grid gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <h3 className="text-base font-bold text-gray-900 mb-5">Service Requests Over Time</h3>
            {s.serviceRequestsChart?.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={s.serviceRequestsChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={d => d ? d.substring(5) : ''} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="requests" name="Requests"
                    stroke="#dc2626" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No booking data yet</div>
            )}
          </Card>

          <Card>
            <h3 className="text-base font-bold text-gray-900 mb-4">User Roles Distribution</h3>
            {s.userRolesDistribution?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie data={s.userRolesDistribution} cx="50%" cy="50%"
                      innerRadius={50} outerRadius={70} dataKey="value" paddingAngle={4}>
                      {s.userRolesDistribution.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [v.toLocaleString(), '']} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {s.userRolesDistribution.map((item, i) => (
                    <div key={i} className="flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-3.5 w-3.5 rounded-full"
                          style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-gray-600 capitalize">{item.name.toLowerCase().replace(/_/g,' ')}</span>
                      </div>
                      <span className="font-semibold text-gray-800">{item.value?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
            )}
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Services per Location</h3>
                <p className="text-sm text-gray-500">Top performing service centers</p>
              </div>
            </div>
            {s.servicesByCenter?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={s.servicesByCenter} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#6b7280' }} width={60} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="services" name="Services" fill="#dc2626" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Service Trends</h3>
                <p className="text-sm text-gray-500">Bookings and activity over the last month</p>
              </div>
            </div>
            {s.serviceRequestsChart?.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={s.serviceRequestsChart}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} tickFormatter={d => d ? d.substring(5) : ''} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="requests" name="Requests"
                    stroke="#dc2626" strokeWidth={2.5} fill="url(#areaGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data yet</div>
            )}
          </Card>
        </div>

        <div id="activity" className="grid gap-6 xl:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recent Verifications</h3>
                <p className="text-sm text-gray-500">Latest approval requests</p>
              </div>
              <button onClick={() => navigate('/admin/verifications/service-centers')}
                className="text-xs text-red-600 font-semibold hover:underline">
                View all
              </button>
            </div>
            {s.recentVerifications?.length > 0 ? (
              <div className="space-y-2">
                {s.recentVerifications.slice(0, 5).map((v, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-3xl bg-red-50/70">
                    <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-red-700">
                      {v.type === 'service-center' ? <Building2 size={16} /> : <Truck size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{v.name}</p>
                      <p className="text-[11px] text-gray-500">{v.city}</p>
                    </div>
                    <StatusBadge status={v.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No recent requests</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Recent Issues</h3>
                <p className="text-sm text-gray-500">New support tickets and reports</p>
              </div>
              <button onClick={() => navigate('/admin/issues')}
                className="text-xs text-red-600 font-semibold hover:underline">
                View all
              </button>
            </div>
            {s.recentIssues?.length > 0 ? (
              <div className="space-y-2">
                {s.recentIssues.slice(0, 5).map((q, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-3xl bg-red-50/70">
                    <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700">
                      <MessageSquare size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{q.subject}</p>
                      <p className="text-[11px] text-gray-500">{q.userName}</p>
                    </div>
                    <StatusBadge status={q.status?.toLowerCase()} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No recent issues</p>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Quick Actions</h3>
                <p className="text-sm text-gray-500">Navigate to high-value workflows.</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Verify Service Centers', sub: `${s.pendingServiceCenters ?? 0} pending`, icon: Building2, color: 'blue',   path: '/admin/verifications/service-centers' },
                { label: 'Verify Fleet Managers',  sub: `${s.pendingFleetManagers ?? 0} pending`,  icon: Truck,      color: 'indigo', path: '/admin/verifications/fleet-managers' },
                { label: 'Resolve Issues',         sub: `${s.openIssues ?? 0} open issues`,         icon: MessageSquare, color: 'amber', path: '/admin/issues' },
                { label: 'Manage Users',           sub: `${s.totalUsers ?? 0} total users`,         icon: Users,      color: 'green',  path: '/admin/users' },
              ].map((action, i) => {
                const Icon = action.icon;
                const colorsMap = {
                  blue:   'bg-blue-50 text-blue-600',
                  indigo: 'bg-indigo-50 text-indigo-600',
                  amber:  'bg-amber-50 text-amber-600',
                  green:  'bg-green-50 text-green-600',
                };
                return (
                  <button
                    key={i}
                    onClick={() => navigate(action.path)}
                    className="w-full flex items-center gap-3 rounded-3xl border border-gray-100 bg-white px-4 py-4 text-left shadow-sm transition hover:border-red-200 hover:bg-red-50/70"
                  >
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${colorsMap[action.color]}`}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{action.label}</p>
                      <p className="text-xs text-gray-500">{action.sub}</p>
                    </div>
                    <ArrowRight size={16} className="text-red-500" />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
