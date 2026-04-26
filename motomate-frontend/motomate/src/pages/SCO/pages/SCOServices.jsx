import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, Wrench, Clock, DollarSign, Tag } from 'lucide-react';
import { fetchSCOServices, createSCOService, updateSCOService, deleteSCOService } from '../api';
import {
  PageLoader, ErrorBlock, EmptyState, SectionHeader,
  Modal, Input, Select, PrimaryBtn, GhostBtn, DangerBtn, Card
} from '../components/UI';
import axios from 'axios';
import Header from '../components/Header';

const CATEGORIES = [
  { value: '', label: 'Select Category' },
  { value: 'Engine',       label: 'Engine' },
  { value: 'Tyres',        label: 'Tyres' },
  { value: 'Body',         label: 'Body & Paint' },
  { value: 'Electrical',   label: 'Electrical' },
  { value: 'AC',           label: 'AC & Cooling' },
  { value: 'Brakes',       label: 'Brakes' },
  { value: 'Transmission', label: 'Transmission' },
  { value: 'General',      label: 'General Service' },
  { value: 'Other',        label: 'Other' },
];

const EMPTY_FORM = { name: '', description: '', price: '', durationMinutes: '', category: '', active: true };

const validate = (f) => {
  const err = {};
  if (!f.name.trim())           err.name = 'Name is required';
  if (!f.price || f.price <= 0) err.price = 'Enter a valid price';
  if (!f.durationMinutes || f.durationMinutes <= 0) err.durationMinutes = 'Enter valid duration';
  if (!f.category)              err.category = 'Select a category';
  return err;
};

const SCOServices = () => {
    const outletContext = useOutletContext() || {};
  const { ownerId: contextOwnerId } = outletContext;
  const [ownerId, setOwnerId] = useState(contextOwnerId);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing]     = useState(null); // null = add, object = edit
  const [form, setForm]           = useState(EMPTY_FORM);
  const [errors, setErrors]       = useState({});
  const [saving, setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]   = useState(false);

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
          console.error('SCO requests fetchMe: invalid response', resp);
          setError('Unable to determine logged in user. Please login again.');
        }
      } catch (err) {
        console.error('SCO requests fetchMe error:', err);
        setError('Unable to determine logged in user. Please login again.');
      }
    };

    fetchMe();
  }, [contextOwnerId]);

  const load = async () => {
    if (!ownerId) return;
    setLoading(true); setError(null);
    try { setServices(await fetchSCOServices(ownerId)); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [ownerId]);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (svc) => {
    setEditing(svc);
    setForm({
      name: svc.name || '',
      description: svc.description || '',
      price: svc.price || '',
      durationMinutes: svc.durationMinutes || '',
      category: svc.category || '',
      active: svc.active ?? true,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const payload = { ...form, price: Number(form.price), durationMinutes: Number(form.durationMinutes) };
      if (editing) {
        const updated = await updateSCOService(ownerId, editing.id, payload);
        setServices(s => s.map(x => x.id === editing.id ? updated : x));
      } else {
        const created = await createSCOService(ownerId, payload);
        setServices(s => [created, ...s]);
      }
      setModalOpen(false);
    } catch (e) {
      setErrors({ submit: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSCOService(ownerId, deleteTarget.id);
      setServices(s => s.filter(x => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const fmtDuration = (m) => {
    if (!m) return '—';
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60), rem = m % 60;
    return rem ? `${h}h ${rem}m` : `${h}h`;
  };

  return (
    <div className="bg-purple-50 min-h-screen">
      <Header />
    
    <div className="space-y-6 pt-25 m-4">
      <SectionHeader
        title="Services"
        subtitle="Manage the services your center offers"
        actions={
          <PrimaryBtn onClick={openAdd}>
            <Plus size={16} /> Add Service
          </PrimaryBtn>
        }
      />

      {loading && <PageLoader />}
      {error && <ErrorBlock message={error} onRetry={load} />}

      {!loading && !error && services.length === 0 && (
        <EmptyState icon={Wrench} title="No services yet" subtitle="Add your first service to get started" />
      )}

      {!loading && !error && services.length > 0 && (
        <Card className="p-0 overflow-hidde">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-purple-100 bg-purple-50/40">
                  {['Service', 'Category', 'Price', 'Duration', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left py-3.5 px-5 text-xs font-bold text-purple-500 uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((svc) => (
                  <tr key={svc.id} className="border-b border-purple-50 hover:bg-purple-50/30 transition-colors">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                          <Wrench size={14} className="text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{svc.name}</p>
                          {svc.description && <p className="text-xs text-gray-400 truncate max-w-45">{svc.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                        {svc.category || '—'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1 text-gray-800 font-semibold">
                        ₹{svc.price?.toLocaleString()}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Clock size={13} className="text-purple-400" />
                        {fmtDuration(svc.durationMinutes)}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${svc.active
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {svc.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(svc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-100 hover:text-purple-600 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button onClick={() => setDeleteTarget(svc)}
                          className="p-1.5 rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Service' : 'Add New Service'}>
        <div className="space-y-4">
          <Input label="Service Name" placeholder="e.g. Oil Change" value={form.name}
            onChange={e => handleChange('name', e.target.value)} error={errors.name} />
          <Input label="Description (optional)" placeholder="Brief description"
            value={form.description} onChange={e => handleChange('description', e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Price (₹)" type="number" min="0" placeholder="e.g. 800"
              value={form.price} onChange={e => handleChange('price', e.target.value)} error={errors.price} />
            <Input label="Duration (minutes)" type="number" min="1" placeholder="e.g. 60"
              value={form.durationMinutes} onChange={e => handleChange('durationMinutes', e.target.value)} error={errors.durationMinutes} />
          </div>
          <Select label="Category" options={CATEGORIES} value={form.category}
            onChange={e => handleChange('category', e.target.value)} error={errors.category} />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="active" checked={form.active}
              onChange={e => handleChange('active', e.target.checked)}
              className="w-4 h-4 accent-purple-600" />
            <label htmlFor="active" className="text-sm text-gray-700 font-medium">Mark as Active</label>
          </div>
          {errors.submit && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errors.submit}</p>}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
            <GhostBtn onClick={() => setModalOpen(false)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={handleSave} loading={saving}>{editing ? 'Save Changes' : 'Add Service'}</PrimaryBtn>
          </div>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Service" maxWidth="max-w-sm">
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <GhostBtn onClick={() => setDeleteTarget(null)}>Cancel</GhostBtn>
          <DangerBtn onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </DangerBtn>
        </div>
      </Modal>
    </div>
    </div>
  );
};

export default SCOServices;
