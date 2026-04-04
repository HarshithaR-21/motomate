// src/pages/FleetManager/pages/FleetDashboard.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Activity, CheckCircle, Clock, IndianRupee,
  ArrowRight, RefreshCw, Wrench, CalendarDays, BarChart3, Plus
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import FleetHeader from '../components/FleetHeader';
import { StatCard, PageLoader, ErrorBlock, SectionHeader } from '../components/FleetUI';
import { fetchDashboardStats, fetchServices, fetchReport } from '../api/fleetApi';

const QUICK_ACTIONS = [
  { label: 'Add Vehicle',      icon: Plus,         path: '/dashboard/fleet/vehicles',  color: 'bg-orange-500' },
  { label: 'Track Services',   icon: Activity,     path: '/dashboard/fleet/tracking',  color: 'bg-blue-500' },
  { label: 'Bulk Schedule',    icon: CalendarDays, path: '/dashboard/fleet/schedule',  color: 'bg-emerald-500' },
  { label: 'View Reports',     icon: BarChart3,    path: '/dashboard/fleet/reports',   color: 'bg-purple-500' },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-orange-100 rounded-xl px-4 py-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('cost')
            ? `₹${p.value.toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

const FleetDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentServices, setRecentServices] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, svcs, rpt] = await Promise.all([
        fetchDashboardStats(),
        fetchServices(),
        fetchReport(),
      ]);
      setStats(s);
      setRecentServices((svcs || []).slice(0, 5));
      setReportData(rpt);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50 pt-24">
      <FleetHeader />
      <div className="max-w-7xl mx-auto px-6"><PageLoader /></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50 pt-24">
      <FleetHeader />
      <div className="max-w-7xl mx-auto px-6"><ErrorBlock message={error} onRetry={load} /></div>
    </div>
  );

  const monthlyCost = reportData?.monthlyCostStats || [];
  const vehicleStats = (reportData?.vehicleServiceStats || []).slice(0, 6);

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50">
      <FleetHeader />

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 space-y-8">

        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              Fleet Dashboard
            </h1>
            <p className="text-gray-500 mt-1 text-sm">
              Monitor your entire fleet at a glance
            </p>
          </div>
          <button onClick={load}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 shadow-sm hover:bg-orange-50 transition-all">
            <RefreshCw size={15} /> Refresh
          </button>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          <StatCard icon={Truck}        label="Total Vehicles"      value={stats?.totalVehicles ?? 0}      accent="orange" sub="Registered in fleet" />
          <StatCard icon={Activity}     label="Active Services"     value={stats?.activeServices ?? 0}     accent="blue"   sub="In progress + Assigned" />
          <StatCard icon={CheckCircle}  label="Completed Services"  value={stats?.completedServices ?? 0}  accent="green"  sub="All time completions" />
          <StatCard icon={Clock}        label="Pending Requests"    value={stats?.pendingRequests ?? 0}    accent="amber"  sub="Awaiting assignment" />
          <StatCard icon={Wrench}       label="In Progress"         value={stats?.inProgressServices ?? 0} accent="indigo" sub="Currently being serviced" />
          <StatCard icon={IndianRupee}  label="Total Cost Spent"
            value={`₹${(stats?.totalMaintenanceCost ?? 0).toLocaleString()}`}
            accent="rose" sub="Total maintenance expenditure" />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader title="Quick Actions" subtitle="Jump to any module instantly" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map(({ label, icon: Icon, path, color }) => (
              <button key={path} onClick={() => navigate(path)}
                className="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 hover:border-orange-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 bg-white">
                <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                  <Icon size={22} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-700 group-hover:text-orange-600 transition-colors">{label}</span>
                <ArrowRight size={14} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
              </button>
            ))}
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Monthly Cost Trend */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionHeader title="Monthly Maintenance Cost" subtitle="Cost trend over time" />
            {monthlyCost.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={monthlyCost} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${v}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="cost" name="Cost (₹)" stroke="#f97316" strokeWidth={2.5}
                    fill="url(#costGrad)" dot={{ fill: '#f97316', r: 4 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data available</div>
            )}
          </div>

          {/* Per-Vehicle Service Count */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <SectionHeader title="Services per Vehicle" subtitle="Top vehicles by service count" />
            {vehicleStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={vehicleStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="vehicleNumber" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="serviceCount" name="Services" fill="#f97316" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data available</div>
            )}
          </div>
        </div>

        {/* Recent Services */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <SectionHeader
            title="Recent Services"
            subtitle="Latest service activity"
            action={
              <button onClick={() => navigate('/dashboard/fleet/tracking')}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                View all <ArrowRight size={14} />
              </button>
            }
          />
          {recentServices.length === 0 ? (
            <div className="text-center py-10 text-gray-400 text-sm">No services yet</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-orange-50 text-left">
                    {['Vehicle', 'Service Type', 'Center', 'Worker', 'Date', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-xs font-bold text-orange-700 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentServices.map(s => (
                    <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 font-semibold text-gray-800">{s.vehicleNumber}</td>
                      <td className="px-4 py-3 text-gray-600">{(s.serviceType || '').replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-gray-600">{s.serviceCenter || '—'}</td>
                      <td className="px-4 py-3 text-gray-600">{s.assignedWorker || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{s.scheduledDate || '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadgeInline status={s.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

// inline mini badge
const STATUS_COLORS = {
  PENDING: 'bg-amber-100 text-amber-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-emerald-100 text-emerald-700',
  CANCELLED: 'bg-red-100 text-red-600',
};
const StatusBadgeInline = ({ status }) => {
  const key = (status || 'PENDING').toUpperCase();
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${STATUS_COLORS[key] || 'bg-gray-100 text-gray-600'}`}>
      {key.replace('_', ' ')}
    </span>
  );
};

export default FleetDashboard;
