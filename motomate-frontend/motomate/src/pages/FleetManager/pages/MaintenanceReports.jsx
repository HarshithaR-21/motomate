// src/pages/FleetManager/pages/MaintenanceReports.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Download, RefreshCw, Calendar,
  IndianRupee, Wrench, CheckCircle, Clock, ChevronDown
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import FleetHeader from '../components/FleetHeader';
import {
  PageLoader, ErrorBlock, SectionHeader, StatCard,
  StatusBadge, Table, Tr, Td, VehicleTypeBadge, EmptyState, Toast
} from '../components/FleetUI';
import { fetchReport, fetchVehicles } from '../api/fleetApi';

const PIE_COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa', '#14b8a6', '#60a5fa'];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-orange-100 rounded-xl px-4 py-3 shadow-lg text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.name?.toLowerCase().includes('cost') || p.name?.toLowerCase().includes('₹')
            ? `₹${Number(p.value).toLocaleString()}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

const MaintenanceReports = () => {
  const [report, setReport]     = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [toast, setToast]       = useState(null);

  const [fromDate, setFromDate]         = useState('');
  const [toDate, setToDate]             = useState('');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const params = {};
      if (fromDate) params.from = fromDate;
      if (toDate)   params.to   = toDate;
      if (vehicleFilter !== 'ALL') params.vehicleId = vehicleFilter;
      const [rpt, vhcls] = await Promise.all([fetchReport(params), fetchVehicles()]);
      setReport(rpt);
      setVehicles(vhcls || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const exportCSV = () => {
    if (!report?.services?.length) { showToast('No data to export', 'error'); return; }
    const headers = ['Vehicle No','Vehicle Type','Service Type','Center','Worker','Date','Est. Cost','Actual Cost','Status'];
    const rows = report.services.map(s => [
      s.vehicleNumber, s.vehicleType, s.serviceType, s.serviceCenter,
      s.assignedWorker || '', s.scheduledDate || '',
      s.estimatedCost ?? '', s.actualCost ?? '', s.status
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url;
    a.download = `maintenance-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
    showToast('Report exported as CSV');
  };

  // service type distribution for pie chart
  const serviceTypeDist = useMemo(() => {
    if (!report?.services) return [];
    const counts = {};
    report.services.forEach(s => { counts[s.serviceType] = (counts[s.serviceType] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name: name.replace('_', ' '), value }));
  }, [report]);

  return (
    <div className="min-h-screen bg-linearto-br from-orange-50 via-white to-amber-50">
      <FleetHeader />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 space-y-6">

        <SectionHeader
          title="Maintenance History & Reports"
          subtitle="Analyze costs, frequency, and service history"
          action={
            <div className="flex items-center gap-3">
              <button onClick={load}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-600 shadow-sm hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all">
                <RefreshCw size={15} /> Refresh
              </button>
              <button onClick={exportCSV}
                className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 shadow-sm hover:bg-orange-50 transition-all">
                <Download size={15} /> Export CSV
              </button>
            </div>
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row gap-3 items-end">
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">From Date</label>
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">To Date</label>
                <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5 block">Vehicle</label>
                <div className="relative">
                  <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}
                    className="appearance-none w-full border border-gray-200 rounded-xl pl-4 pr-8 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="ALL">All Vehicles</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <button onClick={load}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-semibold hover:bg-orange-600 transition-colors shadow-sm shadow-orange-200">
              Apply Filters
            </button>
            {(fromDate || toDate || vehicleFilter !== 'ALL') && (
              <button onClick={() => { setFromDate(''); setToDate(''); setVehicleFilter('ALL'); }}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors underline">
                Clear
              </button>
            )}
          </div>
        </div>

        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <StatCard icon={BarChart3}   label="Total Services"    value={report?.totalServices ?? 0}    accent="orange" />
              <StatCard icon={CheckCircle} label="Completed"         value={report?.completedServices ?? 0} accent="green"  />
              <StatCard icon={Clock}       label="Pending"           value={report?.pendingServices ?? 0}   accent="amber"  />
              <StatCard icon={IndianRupee} label="Total Cost"
                value={`₹${(report?.totalCost ?? 0).toLocaleString()}`} accent="rose" />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

              {/* Monthly cost trend */}
              <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader title="Monthly Cost Trend" subtitle="Maintenance expenditure per month" />
                {(report?.monthlyCostStats || []).length > 0 ? (
                  <ResponsiveContainer width="100%" height={240}>
                    <AreaChart data={report.monthlyCostStats} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <defs>
                        <linearGradient id="costArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%"  stopColor="#f97316" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${v}`} />
                      <Tooltip content={<ChartTooltip />} />
                      <Area type="monotone" dataKey="cost" name="Cost (₹)" stroke="#f97316" strokeWidth={2.5}
                        fill="url(#costArea)" dot={{ fill: '#f97316', r: 4 }} activeDot={{ r: 6 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState icon={BarChart3} title="No data available" subtitle="Schedule services to see trends" />
                )}
              </div>

              {/* Service type distribution */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader title="Service Types" subtitle="Distribution by type" />
                {serviceTypeDist.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={serviceTypeDist} cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                          paddingAngle={3} dataKey="value">
                          {serviceTypeDist.map((_, i) => (
                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-2 space-y-1.5">
                      {serviceTypeDist.slice(0, 4).map((d, i) => (
                        <div key={d.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                            <span className="text-gray-600 font-medium">{d.name}</span>
                          </div>
                          <span className="font-bold text-gray-800">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <EmptyState icon={Wrench} title="No data" subtitle="" />
                )}
              </div>
            </div>

            {/* Vehicle-wise cost bar chart */}
            {(report?.vehicleServiceStats || []).length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <SectionHeader title="Cost per Vehicle" subtitle="Total maintenance cost by vehicle" />
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={report.vehicleServiceStats.slice(0, 10)} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="vehicleNumber" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickFormatter={v => `₹${v}`} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="totalCost" name="Total Cost (₹)" fill="#f97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="serviceCount" name="Service Count" fill="#fdba74" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Service Log Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Service Log</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{report?.services?.length ?? 0} records</p>
                </div>
                <button onClick={exportCSV}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors">
                  <Download size={16} /> Export CSV
                </button>
              </div>

              {!report?.services?.length ? (
                <EmptyState icon={BarChart3} title="No service records" subtitle="Services will appear here once scheduled" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-linearto-r from-orange-50 to-amber-50 border-b border-orange-100">
                        {['Vehicle', 'Type', 'Service', 'Center', 'Worker', 'Date', 'Est. Cost', 'Actual Cost', 'Status'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-xs font-bold text-orange-700 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {report.services.map(s => (
                        <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                          <td className="px-4 py-3 font-bold text-gray-900 font-mono">{s.vehicleNumber}</td>
                          <td className="px-4 py-3"><VehicleTypeBadge type={s.vehicleType} /></td>
                          <td className="px-4 py-3 text-gray-700 font-medium">{(s.serviceType || '').replace('_', ' ')}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{s.serviceCenter || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{s.assignedWorker || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-500">{s.scheduledDate || '—'}</td>
                          <td className="px-4 py-3 text-xs text-gray-600">{s.estimatedCost != null ? `₹${s.estimatedCost}` : '—'}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-gray-700">{s.actualCost != null ? `₹${s.actualCost}` : '—'}</td>
                          <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MaintenanceReports;
