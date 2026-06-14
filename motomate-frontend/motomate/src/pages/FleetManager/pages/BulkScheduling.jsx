// src/pages/FleetManager/pages/BulkScheduling.jsx
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays, CheckSquare, Square, Truck, Search,
  X, ChevronRight, AlertCircle, CheckCircle2, Tag, Percent,
  MapPin, Star, Wrench, CheckCircle, Building2, Plus,
  ShieldCheck, Zap, AlertTriangle, BadgeCheck, ChevronDown
} from 'lucide-react';
import FleetHeader from '../components/FleetHeader';
import {
  PageLoader, ErrorBlock, SectionHeader, FormField,
  Input, Textarea, PrimaryBtn, SecondaryBtn,
  VehicleTypeBadge, Toast, EmptyState
} from '../components/FleetUI';
import { fetchVehicles, bulkScheduleService, fetchServiceCenters } from '../api/fleetApi';

// ── Service catalog (mirrors customer Step2Services) ─────────────
const SERVICE_CATALOG = [
  { name: 'General Service',      icon: <Wrench size={18} /> },
  { name: 'Periodic Maintenance', icon: <CalendarDays size={18} /> },
  { name: 'Oil Change',           icon: <AlertCircle size={18} /> },
  { name: 'Brake Service',        icon: <ShieldCheck size={18} /> },
  { name: 'Battery Issue',        icon: <Zap size={18} /> },
  { name: 'Tyre Issue',           icon: <AlertTriangle size={18} /> },
  { name: 'Engine Check',         icon: <Wrench size={18} /> },
  { name: 'Electrical Repair',    icon: <Zap size={18} /> },
  { name: 'AC Service',           icon: <Star size={18} /> },
  { name: 'Full Service',         icon: <BadgeCheck size={18} /> },
  { name: 'Inspection',           icon: <CheckCircle size={18} /> },
  { name: 'Tire Change',          icon: <AlertTriangle size={18} /> },
];

const EMPTY_SCHEDULE = {
  serviceCenter: '',
  serviceCenterId: '',
  scheduledDate: '',
  scheduledTime: '09:00',
  estimatedCostPerVehicle: '',
  notes: '',
};

// Discount tiers
const DISCOUNT_TIERS = [
  { minVehicles: 5, label: '5+ vehicles', percent: 10 },
  { minVehicles: 2, label: '2–4 vehicles', percent: 5 },
];

function getDiscount(vehicleCount) {
  for (const tier of DISCOUNT_TIERS) {
    if (vehicleCount >= tier.minVehicles) return tier;
  }
  return null;
}

const validate = (form, selectedIds, selectedServiceNames) => {
  const errs = {};
  if (selectedIds.length < 2) errs.vehicles = 'Bulk booking requires at least 2 vehicles';
  if (!form.serviceCenterId) errs.serviceCenter = 'Select a service center';
  if (!form.scheduledDate) errs.scheduledDate = 'Select a date';
  if (selectedServiceNames.length === 0) errs.services = 'Select at least one service';
  return errs;
};

const BulkScheduling = () => {
  const [vehicles, setVehicles]                   = useState([]);
  const [loading, setLoading]                     = useState(true);
  const [error, setError]                         = useState(null);
  const [selectedIds, setSelectedIds]             = useState([]);
  const [form, setForm]                           = useState(EMPTY_SCHEDULE);
  const [formErrors, setFormErrors]               = useState({});
  const [saving, setSaving]                       = useState(false);
  const [success, setSuccess]                     = useState(null);
  const [toastMsg, setToastMsg]                   = useState(null);
  const [search, setSearch]                       = useState('');
  const [filterType, setFilterType]               = useState('ALL');
  const [step, setStep]                           = useState(1); // 1=vehicles, 2=services, 3=configure

  // Service selection
  const [selectedServiceNames, setSelectedServiceNames] = useState([]);
  const [customService, setCustomService]               = useState('');
  const [showCustomInput, setShowCustomInput]           = useState(false);

  // Service center selection
  const [serviceCenters, setServiceCenters]       = useState([]);
  const [centersLoading, setCentersLoading]       = useState(false);

  const loadServiceCenters = async () => {
    setCentersLoading(true);
    try {
      const centers = await fetchServiceCenters();
      setServiceCenters(centers);
    } catch (e) {
      console.error('Failed to load service centers:', e);
    } finally {
      setCentersLoading(false);
    }
  };

  const load = async () => {
    setLoading(true); setError(null);
    try { setVehicles(await fetchVehicles()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    loadServiceCenters();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToastMsg({ message: msg, type });
    setTimeout(() => setToastMsg(null), 3000);
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
    if (formErrors.vehicles) setFormErrors(e => ({ ...e, vehicles: null }));
  };

  const toggleAll = () => {
    const filteredIds = filtered.map(v => v.id);
    const allSelected = filteredIds.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected
      ? selectedIds.filter(id => !filteredIds.includes(id))
      : [...new Set([...selectedIds, ...filteredIds])]);
  };

  const allFilteredSelected = filtered.length > 0 && filtered.every(v => selectedIds.includes(v.id));

  // ── Service selection ────────────────────────────────────────
  const toggleService = (name) => {
    setSelectedServiceNames(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
    if (formErrors.services) setFormErrors(e => ({ ...e, services: null }));
  };

  const addCustomService = () => {
    const trimmed = customService.trim();
    if (!trimmed) return;
    if (!selectedServiceNames.includes(trimmed)) {
      setSelectedServiceNames(prev => [...prev, trimmed]);
    }
    setCustomService('');
    setShowCustomInput(false);
  };

  // ── Step navigation ──────────────────────────────────────────
  const handleProceedToStep2 = () => {
    if (selectedIds.length < 2) {
      setFormErrors({ vehicles: 'Bulk booking requires at least 2 vehicles. Please select more.' });
      return;
    }
    setFormErrors({});
    setStep(2);
  };

  const handleProceedToStep3 = () => {
    if (selectedServiceNames.length === 0) {
      setFormErrors({ services: 'Please select at least one service.' });
      return;
    }
    setFormErrors({});
    setStep(3);
  };

  // ── Service center selection ─────────────────────────────────
  const handleSelectServiceCenter = (c) => {
    setForm(p => ({
      ...p,
      serviceCenter: c.name,
      serviceCenterId: c.ownerId || c.id,
    }));
    if (formErrors.serviceCenter) setFormErrors(e => ({ ...e, serviceCenter: null }));
  };

  // ── Submit ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    const errs = validate(form, selectedIds, selectedServiceNames);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const summary = await bulkScheduleService({
        vehicleIds: selectedIds,
        selectedServiceNames,
        serviceCenter: form.serviceCenter,
        serviceCenterId: form.serviceCenterId || undefined,
        scheduledDate: form.scheduledDate,
        scheduledTime: form.scheduledTime || undefined,
        estimatedCostPerVehicle: form.estimatedCostPerVehicle ? parseFloat(form.estimatedCostPerVehicle) : undefined,
        notes: form.notes,
      });

      const services = Array.isArray(summary) ? summary : (summary.services || []);
      const count = Array.isArray(summary) ? summary.length : (summary.vehicleCount || services.length);
      const serverDiscount = Array.isArray(summary) ? null : summary;

      setSuccess({
        count,
        vehicleIds: selectedIds.slice(),
        discount: serverDiscount?.discountPercent > 0 ? serverDiscount : getDiscount(selectedIds.length),
        discountAmount: serverDiscount?.discountAmount,
        totalPayable: serverDiscount?.totalPayable,
      });
      setSelectedIds([]);
      setSelectedServiceNames([]);
      setForm(EMPTY_SCHEDULE);
      setStep(1);
      showToast(`${count} services scheduled successfully`);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const selectedVehicles = vehicles.filter(v => selectedIds.includes(v.id));

  const costPerVehicle = parseFloat(form.estimatedCostPerVehicle) || 0;
  const totalBeforeDiscount = costPerVehicle * selectedIds.length;
  const discountTier = getDiscount(selectedIds.length);
  const discountAmount = discountTier ? Math.round(totalBeforeDiscount * discountTier.percent / 100) : 0;
  const totalAfterDiscount = totalBeforeDiscount - discountAmount;

  // Step labels
  const STEPS = [
    { n: 1, label: 'Select Vehicles' },
    { n: 2, label: 'Choose Services' },
    { n: 3, label: 'Configure & Book' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <FleetHeader />
      {toastMsg && <Toast {...toastMsg} onClose={() => setToastMsg(null)} />}

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 space-y-6">
        <SectionHeader title="Bulk Service Scheduling" subtitle="Schedule services for multiple vehicles at once" />

        {/* Step indicator */}
        <div className="flex items-center gap-3 flex-wrap">
          {STEPS.map(({ n, label }, i) => (
            <div key={n} className="flex items-center gap-3">
              <button
                onClick={() => {
                  if (n < step) setStep(n);
                  else if (n === 2 && step === 1 && selectedIds.length >= 2) handleProceedToStep2();
                }}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all
                  ${step === n ? 'bg-orange-500 text-white shadow-md shadow-orange-200' :
                    step > n ? 'bg-emerald-500 text-white' : 'bg-white border border-gray-200 text-gray-500'}`}>
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${step === n ? 'bg-white/20' : step > n ? 'bg-white/20' : 'bg-gray-100 text-gray-600'}`}>
                  {step > n ? <CheckCircle2 size={14} /> : n}
                </span>
                {label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight size={16} className="text-gray-300" />}
            </div>
          ))}
        </div>

        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : (

          /* ────────── STEP 1: Vehicle Selection ────────── */
          step === 1 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700">
                <AlertCircle size={14} className="shrink-0" />
                <span>Bulk booking requires <strong>at least 2 vehicles</strong>. Select 2 or more to proceed.</span>
              </div>

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
                  <PrimaryBtn onClick={handleProceedToStep2} disabled={selectedIds.length < 2}
                    className={selectedIds.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}>
                    Next: Services <ChevronRight size={16} />
                  </PrimaryBtn>
                </div>
              )}

              {formErrors.vehicles && (
                <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  <AlertCircle size={16} /> {formErrors.vehicles}
                </div>
              )}

              {selectedIds.length >= 2 && (
                <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700">
                  <Tag size={14} className="shrink-0" />
                  <span>
                    {discountTier
                      ? <><strong>{discountTier.percent}% bulk discount</strong> will be applied for {selectedIds.length} vehicles!</>
                      : 'Select 5+ vehicles for a higher 10% discount'}
                  </span>
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
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedIds.length > 0 && (
                <div className="flex justify-end items-center gap-4">
                  {selectedIds.length < 2 && (
                    <p className="text-sm text-amber-600 font-medium">
                      Select {2 - selectedIds.length} more vehicle{2 - selectedIds.length > 1 ? 's' : ''}
                    </p>
                  )}
                  <PrimaryBtn onClick={handleProceedToStep2} disabled={selectedIds.length < 2}
                    className={`text-base px-8 py-3 ${selectedIds.length < 2 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    Choose Services for {selectedIds.length} Vehicle{selectedIds.length > 1 ? 's' : ''} <ChevronRight size={18} />
                  </PrimaryBtn>
                </div>
              )}
            </div>

          /* ────────── STEP 2: Service Selection (like customer Step2) ────────── */
          ) : step === 2 ? (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-1">What services are needed?</h3>
                <p className="text-sm text-gray-500 mb-5">Select one or more — you can also add custom services</p>

                {formErrors.services && (
                  <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4">
                    <AlertCircle size={16} /> {formErrors.services}
                  </div>
                )}

                {/* Service grid — same style as customer Step2 */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {SERVICE_CATALOG.map(svc => {
                    const isSelected = selectedServiceNames.includes(svc.name);
                    return (
                      <button key={svc.name} type="button" onClick={() => toggleService(svc.name)}
                        className={`relative border-2 rounded-xl p-4 flex flex-col items-center text-center gap-2 transition-all duration-200 cursor-pointer
                          ${isSelected
                            ? 'border-orange-500 bg-orange-50 shadow-md scale-[1.03]'
                            : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/40 bg-white'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center
                          ${isSelected ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                          {svc.icon}
                        </div>
                        <span className={`text-xs font-semibold leading-tight ${isSelected ? 'text-orange-700' : 'text-gray-700'}`}>
                          {svc.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 10 8">
                              <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        )}
                      </button>
                    );
                  })}

                  {/* Add custom service tile */}
                  <button type="button" onClick={() => setShowCustomInput(true)}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center text-center gap-2 hover:border-orange-300 hover:bg-orange-50/40 transition-all cursor-pointer">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100 text-gray-400">
                      <Plus size={18} />
                    </div>
                    <span className="text-xs font-semibold text-gray-400">Add Custom</span>
                  </button>
                </div>

                {/* Custom service input */}
                {showCustomInput && (
                  <div className="mt-4 flex gap-2">
                    <input
                      value={customService}
                      onChange={e => setCustomService(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && addCustomService()}
                      placeholder="e.g. Windshield Replacement"
                      className="flex-1 px-4 py-2.5 border border-orange-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      autoFocus
                    />
                    <button onClick={addCustomService}
                      className="px-4 py-2.5 bg-orange-500 text-white rounded-xl text-sm font-semibold hover:bg-orange-600 transition-colors">
                      Add
                    </button>
                    <button onClick={() => { setShowCustomInput(false); setCustomService(''); }}
                      className="px-3 py-2.5 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-colors">
                      <X size={16} />
                    </button>
                  </div>
                )}

                {/* Selected services summary */}
                <AnimatePresence>
                  {selectedServiceNames.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                      className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4">
                      <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">
                        Selected ({selectedServiceNames.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedServiceNames.map(name => (
                          <span key={name}
                            className="flex items-center gap-1.5 text-xs bg-orange-500 text-white font-semibold px-3 py-1.5 rounded-full">
                            {name}
                            <button type="button" onClick={() => toggleService(name)}
                              className="hover:bg-orange-600 rounded-full p-0.5">
                              <X size={10} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="flex items-center justify-between">
                <SecondaryBtn onClick={() => setStep(1)}>← Back</SecondaryBtn>
                <PrimaryBtn onClick={handleProceedToStep3} disabled={selectedServiceNames.length === 0}
                  className={`text-base px-8 py-3 ${selectedServiceNames.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  Next: Configure <ChevronRight size={18} />
                </PrimaryBtn>
              </div>
            </div>

          /* ────────── STEP 3: Configure & Book ────────── */
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {/* Form */}
              <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <h3 className="text-lg font-bold text-gray-900">Service Configuration</h3>

                {/* Service center selection */}
                <FormField label="Service Center" required error={formErrors.serviceCenter}>
                  {centersLoading ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                      <span className="animate-spin inline-block w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full" />
                      Loading service centers…
                    </div>
                  ) : serviceCenters.length === 0 ? (
                    <p className="text-xs text-amber-600 mt-1">No approved service centers found.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 mt-1 max-h-72 overflow-y-auto pr-1">
                      {serviceCenters.map(c => {
                        const isSelected = form.serviceCenterId === (c.ownerId || c.id);
                        return (
                          <button key={c.id} type="button" onClick={() => handleSelectServiceCenter(c)}
                            className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                              isSelected
                                ? 'border-orange-500 bg-orange-50 shadow-sm'
                                : 'border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50/30'
                            }`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3 min-w-0">
                                <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                  isSelected ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-500'
                                }`}>
                                  <Building2 size={16} />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                                  {c.centerType && <p className="text-xs text-gray-500 mt-0.5">{c.centerType}</p>}
                                  {c.city && (
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                                      <MapPin size={10} /> {c.city}
                                    </p>
                                  )}
                                  {c.vehicleTypes?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {c.vehicleTypes.map(vt => (
                                        <span key={vt} className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                          <Wrench size={8} /> {vt}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                                {isSelected && (
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                                    <CheckCircle size={11} /> Selected
                                  </span>
                                )}
                                {c.averageRating > 0 && (
                                  <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full border border-yellow-100">
                                    <Star size={10} fill="#FBBF24" stroke="none" />
                                    {Number(c.averageRating).toFixed(1)}
                                    {c.totalRatings > 0 && <span className="text-gray-400">({c.totalRatings})</span>}
                                  </span>
                                )}
                              </div>
                            </div>
                            {/* Services offered */}
                            {c.services?.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-100">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Services offered</p>
                                <div className="flex flex-wrap gap-1">
                                  {c.services.slice(0, 5).map((svc, i) => (
                                    <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                                      {svc.name || svc.serviceName || svc}
                                    </span>
                                  ))}
                                  {c.services.length > 5 && (
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
                                      +{c.services.length - 5} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                      placeholder="0.00" min="0" />
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
                  <SecondaryBtn onClick={() => setStep(2)}>← Back</SecondaryBtn>
                  <PrimaryBtn loading={saving} onClick={handleSubmit} className="text-base px-8 py-3">
                    Schedule {selectedIds.length} Service{selectedIds.length > 1 ? 's' : ''}
                  </PrimaryBtn>
                </div>
              </div>

              {/* Summary sidebar */}
              <div className="space-y-4">
                {/* Services selected */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Wrench size={16} className="text-orange-500" /> Services
                    <span className="text-sm font-normal text-orange-600">({selectedServiceNames.length})</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedServiceNames.map(name => (
                      <span key={name} className="text-xs px-2.5 py-1 rounded-full bg-orange-100 text-orange-700 font-medium">
                        {name}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Vehicles + discount */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <h4 className="font-bold text-gray-900 mb-3">
                    Selected Vehicles
                    <span className="ml-2 text-sm font-normal text-orange-600">({selectedIds.length})</span>
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
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

                  {/* Discount breakdown */}
                  {costPerVehicle > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Subtotal ({selectedIds.length} × ₹{costPerVehicle})</span>
                        <span className="font-semibold text-gray-700">₹{totalBeforeDiscount.toLocaleString()}</span>
                      </div>
                      {discountTier && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-green-600 flex items-center gap-1">
                            <Percent size={12} /> Bulk discount ({discountTier.percent}%)
                          </span>
                          <span className="font-semibold text-green-600">− ₹{discountAmount.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-base pt-1 border-t border-gray-100">
                        <span className="font-bold text-gray-800">Total Payable</span>
                        <span className="font-bold text-orange-600">₹{totalAfterDiscount.toLocaleString()}</span>
                      </div>
                      {discountTier && (
                        <p className="text-xs text-green-600 text-center bg-green-50 rounded-lg py-1.5 px-2">
                          🎉 You save ₹{discountAmount.toLocaleString()} with bulk booking!
                        </p>
                      )}
                    </div>
                  )}
                </div>
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
                Head to Service Tracking to monitor their progress. The service center will also see these bookings on their dashboard.
              </p>
              {success.discount && (
                <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                  <Tag size={13} /> A <strong>{success.discount.percent}% bulk discount</strong> was applied to your booking.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BulkScheduling;
