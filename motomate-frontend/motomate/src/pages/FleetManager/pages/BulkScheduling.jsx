// src/pages/FleetManager/pages/BulkScheduling.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  CalendarDays, CheckSquare, Square, Truck, Search,
  X, ChevronRight, AlertCircle, CheckCircle2
} from 'lucide-react';
import FleetHeader from '../components/FleetHeader';
import {
  PageLoader, ErrorBlock, SectionHeader, FormField,
  Input, Select, Textarea, PrimaryBtn, SecondaryBtn,
  VehicleTypeBadge, Toast, EmptyState
} from '../components/FleetUI';
import { fetchVehicles, bulkScheduleService } from '../api/fleetApi';

const SERVICE_TYPES = [
  'OIL_CHANGE', 'REPAIR', 'FULL_SERVICE', 'TIRE_CHANGE',
  'INSPECTION', 'BRAKE_SERVICE', 'BATTERY_REPLACEMENT', 'AC_SERVICE'
];
const SERVICE_CENTERS = [
  'AutoCare Express - MG Road',
  'QuickFix Motors - Whitefield',
  'ProService Hub - Koramangala',
  'SpeedWrench - Hebbal',
  'FleetMaster Centre - Electronic City',
];

const EMPTY_SCHEDULE = {
  serviceType: 'OIL_CHANGE',
  serviceCenter: '',
  scheduledDate: '',
  scheduledTime: '09:00',
  estimatedCostPerVehicle: '',
  notes: '',
};

const validate = (form, selectedIds) => {
  const errs = {};
  if (!selectedIds.length) errs.vehicles = 'Select at least one vehicle';
  if (!form.serviceCenter.trim()) errs.serviceCenter = 'Select a service center';
  if (!form.scheduledDate) errs.scheduledDate = 'Select a date';
  return errs;
};

const BulkScheduling = () => {
  const [vehicles, setVehicles]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [form, setForm]               = useState(EMPTY_SCHEDULE);
  const [formErrors, setFormErrors]   = useState({});
  const [saving, setSaving]           = useState(false);
  const [success, setSuccess]         = useState(null);
  const [toast, setToast]             = useState(null);
  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('ALL');
  const [step, setStep]               = useState(1); // 1: select vehicles, 2: configure

  const load = async () => {
    setLoading(true); setError(null);
    try { setVehicles(await fetchVehicles()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ message: msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const filtered = useMemo(() => vehicles.filter(v => {
    const matchSearch = !search ||
      v.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
      v.brand?.toLowerCase().includes(search.toLowerCase()) ||
      v.fleetTag?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'ALL' || v.vehicleType === filterType;
    return matchSearch && matchType;
  }), [vehicles, search, filterType]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleAll = () => {
    const filteredIds = filtered.map(v => v.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected
      ? selectedIds.filter(id => !filteredIds.includes(id))
      : [...new Set([...selectedIds, ...filteredIds])]
    );
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(v => selectedIds.includes(v.id));

  const handleSubmit = async () => {
    const errs = validate(form, selectedIds);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const result = await bulkScheduleService({
        vehicleIds: selectedIds,
        ...form,
        estimatedCostPerVehicle: form.estimatedCostPerVehicle ? parseFloat(form.estimatedCostPerVehicle) : undefined,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime || undefined,
      });
      setSuccess({ count: result.length, vehicleIds: selectedIds.slice() });
      setSelectedIds([]);
      setForm(EMPTY_SCHEDULE);
      setStep(1);
      showToast(`${result.length} services scheduled successfully`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedVehicles = vehicles.filter(v => selectedIds.includes(v.id));

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50">
      <FleetHeader />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 space-y-6">

        <SectionHeader title="Bulk Service Scheduling" subtitle="Schedule services for multiple vehicles at once" />

        {/* Step indicator */}
        <div className="flex items-center gap-3">
          {[
            { n: 1, label: 'Select Vehicles' },
            { n: 2, label: 'Configure Service' },
          ].map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-3">
              <button onClick={() => n < step || (n === 2 && selectedIds.length > 0) ? setStep(n) : null}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                  ${step === n ? 'bg-orange-500 text-white shadow-md shadow-orange-200' :
                    step > n ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${step === n ? 'bg-white/20' : step > n ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                  {step > n ? <CheckCircle2 size={14} /> : n}
                </span>
                {label}
              </button>
              {i < 1 && <ChevronRight size={16} className="text-gray-300" />}
            </div>
          ))}
        </div>

        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : (

          step === 1 ? (
            /* ── Step 1: Vehicle Selection ── */
            <div className="space-y-4">
              {/* Selection summary */}
              {selectedIds.length > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                      <CheckSquare size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-orange-800">{selectedIds.length} vehicle{selectedIds.length > 1 ? 's' : ''} selected</p>
                      <p className="text-xs text-orange-600">{selectedVehicles.map(v => v.vehicleNumber).join(', ')}</p>
                    </div>
                  </div>
                  <PrimaryBtn onClick={() => setStep(2)}>
                    Next: Configure <ChevronRight size={16} />
                  </PrimaryBtn>
                </div>
              )}
              {formErrors.vehicles && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle size={16} /> {formErrors.vehicles}
                </div>
              )}

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search vehicles…"
                      className="w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400"><X size={14} /></button>}
                  </div>
                  <select value={filterType} onChange={e => setFilterType(e.target.value)}
                    className="pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-orange-400">
                    <option value="ALL">All Types</option>
                    {['CAR', 'BIKE', 'TRUCK'].map(t => <option key={t}>{t}</option>)}
                  </select>
                  <button onClick={toggleAll}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all">
                    {allFilteredSelected ? <CheckSquare size={16} className="text-orange-500" /> : <Square size={16} />}
                    {allFilteredSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {filtered.length === 0 ? (
                  <EmptyState icon={Truck} title="No vehicles available" subtitle="Add vehicles first" />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {filtered.map(v => {
                      const isSelected = selectedIds.includes(v.id);
                      return (
                        <button key={v.id} onClick={() => toggleSelect(v.id)}
                          className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all hover:shadow-md
                            ${isSelected ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'}`}>
                          <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all
                            ${isSelected ? 'border-orange-500 bg-orange-500' : 'border-gray-300'}`}>
                            {isSelected && <CheckCircle2 size={12} className="text-white" />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="font-bold text-gray-900 font-mono">{v.vehicleNumber}</span>
                              <VehicleTypeBadge type={v.vehicleType} />
                            </div>
                            <p className="text-xs text-gray-500">{v.brand} {v.model}</p>
                            {v.fleetTag && (
                              <span className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">{v.fleetTag}</span>
                            )}
                            <p className="text-xs text-gray-400 mt-1 line-clamp-1">{v.issueDescription}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedIds.length > 0 && (
                <div className="flex justify-end">
                  <PrimaryBtn onClick={() => setStep(2)} className="text-base px-8 py-3">
                    Configure Service for {selectedIds.length} Vehicle{selectedIds.length > 1 ? 's' : ''} <ChevronRight size={18} />
                  </PrimaryBtn>
                </div>
              )}
            </div>

          ) : (
            /* ── Step 2: Configure ── */
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Form */}
              <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <h3 className="text-lg font-bold text-gray-900">Service Configuration</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <FormField label="Service Type" required>
                    <Select value={form.serviceType} onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))}>
                      {SERVICE_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Service Center" required error={formErrors.serviceCenter}>
                    <Select value={form.serviceCenter} onChange={e => setForm(p => ({ ...p, serviceCenter: e.target.value }))}>
                      <option value="">Select a center…</option>
                      {SERVICE_CENTERS.map(c => <option key={c} value={c}>{c}</option>)}
                    </Select>
                  </FormField>
                  <FormField label="Scheduled Date" required error={formErrors.scheduledDate}>
                    <Input type="date" value={form.scheduledDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} />
                  </FormField>
                  <FormField label="Scheduled Time">
                    <Input type="time" value={form.scheduledTime}
                      onChange={e => setForm(p => ({ ...p, scheduledTime: e.target.value }))} />
                  </FormField>
                  <FormField label="Estimated Cost per Vehicle (₹)" className="sm:col-span-2">
                    <Input type="number" value={form.estimatedCostPerVehicle}
                      onChange={e => setForm(p => ({ ...p, estimatedCostPerVehicle: e.target.value }))}
                      placeholder="0.00" />
                  </FormField>
                  <div className="sm:col-span-2">
                    <FormField label="Notes">
                      <Textarea value={form.notes}
                        onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                        placeholder="Additional instructions for all vehicles…" />
                    </FormField>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <SecondaryBtn onClick={() => setStep(1)}>← Back</SecondaryBtn>
                  <PrimaryBtn loading={saving} onClick={handleSubmit} className="text-base px-8 py-3">
                    Schedule {selectedIds.length} Service{selectedIds.length > 1 ? 's' : ''}
                  </PrimaryBtn>
                </div>
              </div>

              {/* Selected vehicles summary */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-base font-bold text-gray-900 mb-4">
                  Selected Vehicles
                  <span className="ml-2 text-sm font-normal text-orange-600">({selectedIds.length})</span>
                </h3>
                <div className="space-y-2 max-h-100 overflow-y-auto pr-1">
                  {selectedVehicles.map(v => (
                    <div key={v.id} className="flex items-center justify-between gap-2 p-3 rounded-xl bg-orange-50 border border-orange-100">
                      <div>
                        <p className="font-bold text-sm text-gray-800 font-mono">{v.vehicleNumber}</p>
                        <p className="text-xs text-gray-400">{v.brand} · {v.vehicleType}</p>
                      </div>
                      <button onClick={() => toggleSelect(v.id)}
                        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
                {form.estimatedCostPerVehicle && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Total estimated cost</span>
                      <span className="font-bold text-orange-600">
                        ₹{(parseFloat(form.estimatedCostPerVehicle) * selectedIds.length).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        )}

        {/* Success card */}
        {success && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle2 size={24} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-800 text-lg">Bulk schedule confirmed!</p>
              <p className="text-emerald-600 text-sm mt-1">
                {success.count} services have been scheduled and are now <strong>Pending</strong>.
                Head to Service Tracking to monitor their progress.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkScheduling;
