// src/pages/FleetManager/pages/ServiceTracking.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Activity, RefreshCw, ChevronDown, Search, X,
  Wrench, MapPin, User, CalendarDays, IndianRupee, SlidersHorizontal
} from 'lucide-react';
import FleetHeader from '../components/FleetHeader';
import {
  PageLoader, ErrorBlock, SectionHeader, Modal, FormField,
  Select, Input, Textarea, PrimaryBtn, SecondaryBtn, EmptyState,
  StatusBadge, VehicleTypeBadge, Toast
} from '../components/FleetUI';
import { fetchServices, updateServiceStatus, fetchVehicles } from '../api/fleetApi';

const SERVICE_STATUSES = ['PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

const STATUS_PIPELINE = [
  { key: 'PENDING',     label: 'Pending',     color: 'bg-amber-400',   dot: 'bg-amber-400' },
  { key: 'ASSIGNED',    label: 'Assigned',    color: 'bg-blue-400',    dot: 'bg-blue-400'  },
  { key: 'IN_PROGRESS', label: 'In Progress', color: 'bg-orange-400',  dot: 'bg-orange-400' },
  { key: 'COMPLETED',   label: 'Completed',   color: 'bg-emerald-400', dot: 'bg-emerald-400' },
];

const ServiceTracking = () => {
  const [services, setServices]     = useState([]);
  const [vehicles, setVehicles]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [vehicleFilter, setVehicleFilter] = useState('ALL');
  const [search, setSearch]         = useState('');
  const [updateModal, setUpdateModal] = useState(null);
  const [updateForm, setUpdateForm] = useState({ status: '', assignedWorker: '', actualCost: '', notes: '' });
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);
  const [viewMode, setViewMode]     = useState('table'); // 'table' | 'card'

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const [svcs, vhcls] = await Promise.all([fetchServices(), fetchVehicles()]);
      setServices(svcs || []);
      setVehicles(vhcls || []);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openUpdate = (s) => {
    setUpdateModal(s);
    setUpdateForm({
      status: s.status,
      assignedWorker: s.assignedWorker || '',
      actualCost: s.actualCost || '',
      notes: s.notes || '',
    });
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      const updated = await updateServiceStatus(updateModal.id, {
        ...updateForm,
        actualCost: updateForm.actualCost ? parseFloat(updateForm.actualCost) : undefined,
      });
      setServices(prev => prev.map(s => s.id === updated.id ? updated : s));
      showToast('Service status updated');
      setUpdateModal(null);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    return services.filter(s => {
      const matchStatus  = statusFilter === 'ALL' || s.status === statusFilter;
      const matchVehicle = vehicleFilter === 'ALL' || s.vehicleId === vehicleFilter;
      const matchSearch  = !search ||
        s.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
        s.serviceType?.toLowerCase().includes(search.toLowerCase()) ||
        s.serviceCenter?.toLowerCase().includes(search.toLowerCase()) ||
        s.assignedWorker?.toLowerCase().includes(search.toLowerCase());
      return matchStatus && matchVehicle && matchSearch;
    });
  }, [services, statusFilter, vehicleFilter, search]);

  // pipeline counts
  const counts = STATUS_PIPELINE.reduce((acc, { key }) => {
    acc[key] = services.filter(s => s.status === key).length;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50">
      <FleetHeader />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 space-y-6">

        <SectionHeader
          title="Service Tracking"
          subtitle="Monitor all active and scheduled services"
          action={
            <button onClick={load}
              className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-white px-4 py-2.5 text-sm font-semibold text-orange-600 shadow-sm hover:bg-orange-50 transition-all">
              <RefreshCw size={15} /> Refresh
            </button>
          }
        />

        {/* Pipeline summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATUS_PIPELINE.map(({ key, label, color }) => (
            <button key={key}
              onClick={() => setStatusFilter(statusFilter === key ? 'ALL' : key)}
              className={`bg-white rounded-2xl border p-4 text-left transition-all hover:shadow-md hover:-translate-y-0.5
                ${statusFilter === key ? 'border-orange-300 ring-2 ring-orange-200' : 'border-gray-100'}`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-3 h-3 rounded-full ${color}`} />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
              </div>
              <p className="text-3xl font-bold text-gray-900">{counts[key] ?? 0}</p>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search vehicle, service type, center, worker…"
                className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-colors" />
              {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={14} /></button>}
            </div>
            <div className="relative">
              <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="ALL">All Statuses</option>
                {SERVICE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            <div className="relative">
              <select value={vehicleFilter} onChange={e => setVehicleFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                <option value="ALL">All Vehicles</option>
                {vehicles.map(v => <option key={v.id} value={v.id}>{v.vehicleNumber}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {/* View toggle */}
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-1">
              <button onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'table' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                Table
              </button>
              <button onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'card' ? 'bg-orange-500 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                Cards
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
            <EmptyState icon={Activity} title="No services found" subtitle="Try adjusting your filters" />
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-linear-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                    {['Vehicle', 'Type', 'Service', 'Service Center', 'Assigned Worker', 'Date', 'Est. Cost', 'Status', 'Action'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-orange-700 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map(s => (
                    <tr key={s.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3 font-bold text-gray-900 font-mono">{s.vehicleNumber}</td>
                      <td className="px-4 py-3"><VehicleTypeBadge type={s.vehicleType} /></td>
                      <td className="px-4 py-3 font-medium text-gray-700">{(s.serviceType || '').replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <MapPin size={12} className="text-orange-400 shrink-0" />
                          <span className="text-xs">{s.serviceCenter || '—'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <User size={12} className="text-blue-400 shrink-0" />
                          <span className="text-xs">{s.assignedWorker || 'Not assigned'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{s.scheduledDate || '—'}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">
                        {s.actualCost != null ? `₹${s.actualCost}` : s.estimatedCost != null ? `~₹${s.estimatedCost}` : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                      <td className="px-4 py-3">
                        <button onClick={() => openUpdate(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-all">
                          <SlidersHorizontal size={12} /> Update
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map(s => (
              <ServiceCard key={s.id} service={s} onUpdate={() => openUpdate(s)} />
            ))}
          </div>
        )}
      </div>

      {/* Update Modal */}
      <Modal open={!!updateModal} onClose={() => setUpdateModal(null)} title="Update Service Status">
        {updateModal && (
          <>
            <div className="bg-orange-50 rounded-xl p-4 mb-5 border border-orange-100">
              <p className="font-bold text-gray-800 font-mono">{updateModal.vehicleNumber}</p>
              <p className="text-sm text-gray-600 mt-0.5">{(updateModal.serviceType || '').replace('_', ' ')} — {updateModal.serviceCenter}</p>
            </div>
            <div className="space-y-4">
              <FormField label="Status" required>
                <Select value={updateForm.status} onChange={e => setUpdateForm(p => ({ ...p, status: e.target.value }))}>
                  {SERVICE_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </Select>
              </FormField>
              <FormField label="Assigned Worker">
                <Input value={updateForm.assignedWorker}
                  onChange={e => setUpdateForm(p => ({ ...p, assignedWorker: e.target.value }))}
                  placeholder="Worker name" />
              </FormField>
              <FormField label="Actual Cost (₹)">
                <Input value={updateForm.actualCost}
                  onChange={e => setUpdateForm(p => ({ ...p, actualCost: e.target.value }))}
                  type="number" placeholder="0.00" />
              </FormField>
              <FormField label="Notes">
                <Textarea value={updateForm.notes}
                  onChange={e => setUpdateForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any additional notes…" />
              </FormField>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <SecondaryBtn onClick={() => setUpdateModal(null)}>Cancel</SecondaryBtn>
              <PrimaryBtn loading={saving} onClick={handleUpdate}>Update Status</PrimaryBtn>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

const ServiceCard = ({ service: s, onUpdate }) => {
  const statusColors = {
    PENDING: 'border-l-amber-400', ASSIGNED: 'border-l-blue-400',
    IN_PROGRESS: 'border-l-orange-400', COMPLETED: 'border-l-emerald-400', CANCELLED: 'border-l-red-400',
  };
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 border-l-4 ${statusColors[s.status] || 'border-l-gray-200'} shadow-sm p-5 hover:shadow-md transition-all`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-bold text-gray-900 font-mono text-lg">{s.vehicleNumber}</p>
          <p className="text-sm font-semibold text-gray-600 mt-0.5">{(s.serviceType || '').replace('_', ' ')}</p>
        </div>
        <StatusBadge status={s.status} />
      </div>
      <div className="space-y-2 text-xs text-gray-500 mb-4">
        <div className="flex items-center gap-2"><MapPin size={12} className="text-orange-400" /><span>{s.serviceCenter || 'Not assigned'}</span></div>
        <div className="flex items-center gap-2"><User size={12} className="text-blue-400" /><span>{s.assignedWorker || 'Not assigned'}</span></div>
        <div className="flex items-center gap-2"><CalendarDays size={12} className="text-gray-400" /><span>{s.scheduledDate || '—'} {s.scheduledTime ? `at ${s.scheduledTime}` : ''}</span></div>
        <div className="flex items-center gap-2"><IndianRupee size={12} className="text-emerald-400" />
          <span>{s.actualCost != null ? `₹${s.actualCost} (actual)` : s.estimatedCost != null ? `~₹${s.estimatedCost} (est.)` : '—'}</span>
        </div>
      </div>
      <button onClick={onUpdate}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-orange-200 bg-orange-50 text-xs font-semibold text-orange-600 hover:bg-orange-100 transition-all">
        <SlidersHorizontal size={12} /> Update Status
      </button>
    </div>
  );
};

export default ServiceTracking;
