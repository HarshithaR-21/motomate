import { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Users, Wrench, IndianRupee } from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  fetchAnalytics, fetchRevenueChart, fetchServicesChart, fetchUserGrowthChart
} from '../api';
import { SectionHeader, Card, PageLoader, ErrorBlock, StatCard, Spinner } from '../components/UI';

const RANGE_OPTIONS = [
  { value: '7d',  label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '1y',  label: '1 Year' },
];

const PIE_COLORS = ['#dc2626', '#f97316', '#facc15', '#4ade80', '#60a5fa', '#a78bfa'];

/* Custom Tooltip */
const ChartTooltip = ({ active, payload, label, prefix = '', suffix = '' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString() : p.value}{suffix}
        </p>
      ))}
    </div>
  );
};

const AnalyticsPage = () => {
  const [range, setRange]           = useState('30d');
  const [overview, setOverview]     = useState(null);
  const [revenueData, setRevenue]   = useState([]);
  const [servicesData, setServices] = useState([]);
  const [userGrowth, setUserGrowth] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [chartLoad, setChartLoad]   = useState(false);

  const loadAll = async (r) => {
    setLoading(true);
    setError(null);
    try {
      const [ov, rev, svc, ug] = await Promise.all([
        fetchAnalytics(r),
        fetchRevenueChart(r),
        fetchServicesChart(r),
        fetchUserGrowthChart(r),
      ]);
      setOverview(ov);
      setRevenue(rev.data || rev.chartData || []);
      setServices(svc.data || svc.chartData || []);
      setServiceTypes(svc.byType || []);
      setUserGrowth(ug.data || ug.chartData || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(range); }, []);

  const handleRangeChange = async (r) => {
    setRange(r);
    setChartLoad(true);
    try {
      const [rev, svc, ug] = await Promise.all([
        fetchRevenueChart(r),
        fetchServicesChart(r),
        fetchUserGrowthChart(r),
      ]);
      setRevenue(rev.data || rev.chartData || []);
      setServices(svc.data || svc.chartData || []);
      setServiceTypes(svc.byType || []);
      setUserGrowth(ug.data || ug.chartData || []);
    } catch (e) { /* silently keep old data */ }
    finally { setChartLoad(false); }
  };

  if (loading) return <PageLoader />;
  if (error)   return <ErrorBlock message={error} onRetry={() => loadAll(range)} />;

  const ov = overview || {};

  return (
    <div className="space-y-8">
      {/* Header + Range */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Platform-wide performance metrics</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          {RANGE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleRangeChange(opt.value)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                range === opt.value
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Stat Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Total Revenue"    value={ov.totalRevenue    ? `₹${ov.totalRevenue.toLocaleString()}` : '—'} accent="red" />
        <StatCard icon={Wrench}      label="Services Done"    value={ov.totalServices?.toLocaleString()}   accent="indigo" />
        <StatCard icon={Users}       label="Active Users"     value={ov.activeUsers?.toLocaleString()}     accent="green" />
        <StatCard icon={TrendingUp}  label="Avg. Service ₹"  value={ov.avgServiceValue ? `₹${ov.avgServiceValue}` : '—'} accent="amber" />
      </div>

      {chartLoad && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Spinner size={16} /> Updating charts…
        </div>
      )}

      {/* Revenue Line Chart */}
      <Card>
        <h3 className="text-base font-bold text-gray-900 mb-5">Revenue Over Time</h3>
        {revenueData.length === 0 ? (
          <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No revenue data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
              <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip prefix="₹" />} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#dc2626" strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
              {revenueData[0]?.target !== undefined && (
                <Line type="monotone" dataKey="target" name="Target" stroke="#d1d5db" strokeWidth={2} strokeDasharray="5 5" dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Services Bar + User Growth side by side */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-base font-bold text-gray-900 mb-5">Services Completed</h3>
          {servicesData.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={servicesData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="completed" name="Completed" fill="#dc2626" radius={[4, 4, 0, 0]} />
                <Bar dataKey="cancelled" name="Cancelled"  fill="#fca5a5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card>
          <h3 className="text-base font-bold text-gray-900 mb-5">User Growth</h3>
          {userGrowth.length === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-400 text-sm">No data</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={userGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="customers" name="Customers"  stroke="#dc2626" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="workers"   name="Workers"    stroke="#f97316" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="partners"  name="Partners"   stroke="#4ade80" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      {/* Service Type Pie + additional stats */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1">
          <h3 className="text-base font-bold text-gray-900 mb-5">Services by Type</h3>
          {serviceTypes.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400 text-sm">No data</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={serviceTypes}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    dataKey="value"
                    nameKey="name"
                    paddingAngle={3}
                  >
                    {serviceTypes.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [`${v.toLocaleString()} services`, '']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {serviceTypes.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-gray-600 truncate max-w-30">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.percent ?? item.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        <div className="lg:col-span-2 grid sm:grid-cols-2 gap-4 content-start">
          {[
            { label: 'Avg. Completion Time', value: ov.avgCompletionTime ? `${ov.avgCompletionTime} min` : '—', sub: 'Per service job' },
            { label: 'Customer Satisfaction', value: ov.avgRating ? `${ov.avgRating}/5 ⭐` : '—', sub: 'Average rating' },
            { label: 'Repeat Customer Rate',  value: ov.repeatRate ? `${ov.repeatRate}%` : '—', sub: 'Users with 2+ bookings' },
            { label: 'SOS Requests',          value: ov.sosRequests?.toLocaleString() ?? '—', sub: `Period: ${range}` },
            { label: 'New Service Centers',   value: ov.newServiceCenters?.toLocaleString() ?? '—', sub: `Period: ${range}` },
            { label: 'EV Service Jobs',       value: ov.evServices?.toLocaleString() ?? '—', sub: 'Electric vehicle servicing' },
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{item.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
