// src/pages/FleetManager/pages/VehicleManagement.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Pencil, Trash2, Filter, Car, Bike, Truck,
  RefreshCw, X, ChevronDown
} from 'lucide-react';
import FleetHeader from '../components/FleetHeader';
import {
  PageLoader, ErrorBlock, SectionHeader, Modal, FormField,
  Input, Select, Textarea, PrimaryBtn, SecondaryBtn, DangerBtn,
  EmptyState, Table, Tr, Td, StatusBadge, VehicleTypeBadge, Toast
} from '../components/FleetUI';
import { fetchVehicles, addVehicle, updateVehicle, deleteVehicle } from '../api/fleetApi';

const VEHICLE_TYPES = ['CAR', 'BIKE', 'TRUCK'];
const FUEL_TYPES    = ['PETROL', 'DIESEL', 'ELECTRIC', 'CNG', 'HYBRID'];
const STATUS_FILTER = ['ALL', 'ACTIVE', 'INACTIVE', 'IN_SERVICE'];

const EMPTY_FORM = {
  vehicleNumber: '', vehicleType: 'CAR', brand: '',
  model: '', fuelType: 'PETROL', year: '',
  issueDescription: '', fleetTag: '',
};

const validate = (f) => {
  const errs = {};
  if (!f.vehicleNumber.trim()) errs.vehicleNumber = 'Required';
  else if (!/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/.test(f.vehicleNumber.toUpperCase()))
    errs.vehicleNumber = 'Format: KA01AB1234';
  if (!f.brand.trim()) errs.brand = 'Required';
  if (!f.issueDescription.trim()) errs.issueDescription = 'Required';
  return errs;
};

const VehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [saving, setSaving]     = useState(false);

  const [showModal, setShowModal]     = useState(false);
  const [editVehicle, setEditVehicle] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [formErrors, setFormErrors]   = useState({});

  const [search, setSearch]           = useState('');
  const [filterType, setFilterType]   = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [toast, setToast]             = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try { setVehicles(await fetchVehicles()); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const openAdd = () => {
    setEditVehicle(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowModal(true);
  };

  const openEdit = (v) => {
    setEditVehicle(v);
    setForm({
      vehicleNumber: v.vehicleNumber,
      vehicleType:   v.vehicleType,
      brand:         v.brand || '',
      model:         v.model || '',
      fuelType:      v.fuelType || 'PETROL',
      year:          v.year || '',
      issueDescription: v.issueDescription || '',
      fleetTag:      v.fleetTag || '',
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form, vehicleNumber: form.vehicleNumber.toUpperCase() };
      if (editVehicle) {
        const updated = await updateVehicle(editVehicle.id, payload);
        setVehicles(prev => prev.map(v => v.id === updated.id ? updated : v));
        showToast('Vehicle updated successfully');
      } else {
        const added = await addVehicle(payload);
        setVehicles(prev => [added, ...prev]);
        showToast('Vehicle added successfully');
      }
      setShowModal(false);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteVehicle(deleteTarget.id);
      setVehicles(prev => prev.filter(v => v.id !== deleteTarget.id));
      showToast('Vehicle removed');
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setDeleteTarget(null);
    }
  };

  const filtered = useMemo(() => {
    return vehicles.filter(v => {
      const matchSearch =
        !search ||
        v.vehicleNumber?.toLowerCase().includes(search.toLowerCase()) ||
        v.brand?.toLowerCase().includes(search.toLowerCase()) ||
        v.model?.toLowerCase().includes(search.toLowerCase()) ||
        v.fleetTag?.toLowerCase().includes(search.toLowerCase());
      const matchType   = filterType === 'ALL'   || v.vehicleType === filterType;
      const matchStatus = filterStatus === 'ALL' || v.status === filterStatus;
      return matchSearch && matchType && matchStatus;
    });
  }, [vehicles, search, filterType, filterStatus]);

  return (
    <div className="min-h-screen bg-linear-to-br from-orange-50 via-white to-amber-50">
      <FleetHeader />
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      <div className="max-w-7xl mx-auto px-6 pt-28 pb-12 space-y-6">

        <SectionHeader
          title="Vehicle Management"
          subtitle={`${vehicles.length} vehicles in your fleet`}
          action={
            <div className="flex items-center gap-3">
              <button onClick={load} className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all">
                <RefreshCw size={16} />
              </button>
              <PrimaryBtn onClick={openAdd}>
                <Plus size={16} /> Add Vehicle
              </PrimaryBtn>
            </div>
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search by number, brand, model, tag…"
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <select value={filterType} onChange={e => setFilterType(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer">
                  <option value="ALL">All Types</option>
                  {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 cursor-pointer">
                  {STATUS_FILTER.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Status' : s.replace('_', ' ')}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>
          {filtered.length !== vehicles.length && (
            <p className="mt-3 text-xs text-orange-600 font-medium">
              Showing {filtered.length} of {vehicles.length} vehicles
              <button onClick={() => { setSearch(''); setFilterType('ALL'); setFilterStatus('ALL'); }}
                className="ml-2 underline hover:no-underline">Clear filters</button>
            </p>
          )}
        </div>

        {/* Table */}
        {loading ? <PageLoader /> : error ? <ErrorBlock message={error} onRetry={load} /> : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState
                icon={Truck}
                title="No vehicles found"
                subtitle={search ? 'Try a different search term' : 'Add your first vehicle to get started'}
                action={!search && <PrimaryBtn onClick={openAdd}><Plus size={16} /> Add Vehicle</PrimaryBtn>}
              />
            ) : (
              <Table headers={['Vehicle No.', 'Type', 'Brand / Model', 'Fuel', 'Year', 'Fleet Tag', 'Issue', 'Status', 'Actions']}>
                {filtered.map(v => (
                  <Tr key={v.id}>
                    <Td><span className="font-bold text-gray-900 font-mono tracking-wide">{v.vehicleNumber}</span></Td>
                    <Td><VehicleTypeBadge type={v.vehicleType} /></Td>
                    <Td>
                      <div className="font-semibold text-gray-800">{v.brand}</div>
                      {v.model && <div className="text-xs text-gray-400">{v.model}</div>}
                    </Td>
                    <Td><span className="text-xs text-gray-500">{v.fuelType || '—'}</span></Td>
                    <Td><span className="text-xs text-gray-500">{v.year || '—'}</span></Td>
                    <Td>
                      {v.fleetTag
                        ? <span className="px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 text-xs font-semibold border border-orange-100">{v.fleetTag}</span>
                        : <span className="text-gray-300">—</span>
                      }
                    </Td>
                    <Td>
                      <span className="text-xs text-gray-600 line-clamp-1 max-w-40 block" title={v.issueDescription}>
                        {v.issueDescription}
                      </span>
                    </Td>
                    <Td><StatusBadge status={v.status} /></Td>
                    <Td>
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(v)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => setDeleteTarget(v)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)}
        title={editVehicle ? 'Edit Vehicle' : 'Add New Vehicle'} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Vehicle Number" required error={formErrors.vehicleNumber}>
            <Input
              value={form.vehicleNumber}
              onChange={e => setForm(p => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))}
              placeholder="KA01AB1234"
              disabled={!!editVehicle}
            />
          </FormField>
          <FormField label="Vehicle Type" required>
            <Select value={form.vehicleType} onChange={e => setForm(p => ({ ...p, vehicleType: e.target.value }))}>
              {VEHICLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </FormField>
          <FormField label="Brand" required error={formErrors.brand}>
            <Input value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Toyota, Honda…" />
          </FormField>
          <FormField label="Model">
            <Input value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} placeholder="Innova, Activa…" />
          </FormField>
          <FormField label="Fuel Type">
            <Select value={form.fuelType} onChange={e => setForm(p => ({ ...p, fuelType: e.target.value }))}>
              {FUEL_TYPES.map(f => <option key={f} value={f}>{f}</option>)}
            </Select>
          </FormField>
          <FormField label="Year">
            <Input value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} placeholder="2020" type="number" min="1990" max="2030" />
          </FormField>
          <FormField label="Fleet Tag" className="sm:col-span-2">
            <Input value={form.fleetTag} onChange={e => setForm(p => ({ ...p, fleetTag: e.target.value }))} placeholder="North Fleet, City Delivery…" />
          </FormField>
          <div className="sm:col-span-2">
            <FormField label="Issue / Problem Description" required error={formErrors.issueDescription}>
              <Textarea
                value={form.issueDescription}
                onChange={e => setForm(p => ({ ...p, issueDescription: e.target.value }))}
                placeholder="Describe the problem or service needed…"
              />
            </FormField>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <SecondaryBtn onClick={() => setShowModal(false)}>Cancel</SecondaryBtn>
          <PrimaryBtn loading={saving} onClick={handleSave}>
            {editVehicle ? 'Update Vehicle' : 'Add Vehicle'}
          </PrimaryBtn>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Vehicle" maxWidth="max-w-sm">
        <div className="text-center py-2">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <p className="text-gray-700 font-semibold mb-1">Remove {deleteTarget?.vehicleNumber}?</p>
          <p className="text-gray-400 text-sm mb-6">This action cannot be undone. All associated service records will remain.</p>
          <div className="flex gap-3">
            <SecondaryBtn onClick={() => setDeleteTarget(null)} className="flex-1">Cancel</SecondaryBtn>
            <DangerBtn onClick={handleDelete} className="flex-1 justify-center">Delete</DangerBtn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default VehicleManagement;
