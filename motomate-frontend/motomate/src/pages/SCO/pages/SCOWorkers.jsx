import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users, ToggleLeft, ToggleRight, Briefcase } from 'lucide-react';
import { fetchSCOWorkers, addSCOWorker, updateSCOWorker, deleteSCOWorker, toggleAvailability } from '../api';
import {
  PageLoader, ErrorBlock, EmptyState, SectionHeader,
  Modal, Input, Select, PrimaryBtn, GhostBtn, DangerBtn,
  StatusBadge, RatingStars, Card
} from '../components/UI';
import Header from '../components/Header';
import axios from 'axios'

const ROLES = [
  { value: '',              label: 'All Roles' },
  { value: 'MECHANIC',      label: 'Mechanic' },
  { value: 'ELECTRICIAN',   label: 'Electrician' },
  { value: 'FUEL_DELIVERY', label: 'Fuel Delivery' },
  { value: 'BODY_WORK',     label: 'Body Work' },
  { value: 'GENERAL',       label: 'General' },
];

const ROLE_OPTIONS = ROLES.slice(1).map(r => ({ value: r.value, label: r.label }));

const AVAILABILITY_OPTIONS = [
  { value: '',          label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available' },
  { value: 'BUSY',      label: 'Busy' },
  { value: 'OFF_DUTY',  label: 'Off Duty' },
];

const AVAIL_FORM_OPTIONS = AVAILABILITY_OPTIONS.slice(1);

const EMPTY_FORM = { name: '', phone: '', email: '', role: 'MECHANIC', availability: 'AVAILABLE' };

// ─── Validation rules ────────────────────────────────────────────────────────

const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX  = /^[a-zA-Z\s'.,-]{2,60}$/;

const validateField = (name, value) => {
  switch (name) {
    case 'name':
      if (!value.trim())               return 'Name is required';
      if (value.trim().length < 2)     return 'Name must be at least 2 characters';
      if (value.trim().length > 60)    return 'Name must be under 60 characters';
      if (!NAME_REGEX.test(value))     return 'Name can only contain letters, spaces and basic punctuation';
      return '';

    case 'phone':
      if (!value.trim())               return 'Phone number is required';
      if (!PHONE_REGEX.test(value))    return 'Enter a valid phone number (10 digits)';
      return '';

    case 'email':
      if (!value.trim())               return ''; // optional field
      if (!EMAIL_REGEX.test(value))    return 'Enter a valid email address';
      return '';

    case 'role':
      if (!value)                      return 'Please select a role';
      return '';

    case 'availability':
      if (!value)                      return 'Please select availability';
      return '';

    default:
      return '';
  }
};

const validateAll = (form) => {
  const errs = {};
  Object.keys(form).forEach(k => {
    const msg = validateField(k, form[k]);
    if (msg) errs[k] = msg;
  });
  return errs;
};

// ─────────────────────────────────────────────────────────────────────────────

const ROLE_COLOR = {
  MECHANIC:      'bg-purple-100 text-purple-700',
  ELECTRICIAN:   'bg-blue-100 text-blue-700',
  FUEL_DELIVERY: 'bg-orange-100 text-orange-700',
  BODY_WORK:     'bg-pink-100 text-pink-700',
  GENERAL:       'bg-gray-100 text-gray-700',
};

const SCOWorkers = () => {
  const outletContext = useOutletContext() || {};
  const { ownerId: contextOwnerId } = outletContext;
  const [ownerId, setOwnerId]           = useState(contextOwnerId);
  const [workers, setWorkers]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [filterRole, setFilterRole]     = useState('');
  const [filterAvail, setFilterAvail]   = useState('');
  const [modalOpen, setModalOpen]       = useState(false);
  const [editing, setEditing]           = useState(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [errors, setErrors]             = useState({});
  const [touched, setTouched]           = useState({});   // track which fields were touched
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]         = useState(false);
  const [togglingId, setTogglingId]     = useState(null);

  useEffect(() => {
    if (contextOwnerId) { setOwnerId(contextOwnerId); return; }
    const fetchMe = async () => {
      try {
        const resp = await axios.get('http://localhost:8080/api/auth/me', { withCredentials: true });
        const id = resp.data?.id || resp.data?.userId;
        if (resp.status === 200 && id) {
          setOwnerId(id);
        } else {
          setError('Unable to determine logged in user. Please login again.');
        }
      } catch (err) {
        setError('Unable to determine logged in user. Please login again.');
      }
    };
    fetchMe();
  }, [contextOwnerId]);

  const load = async (role = filterRole, avail = filterAvail) => {
    if (!ownerId) return;
    setLoading(true); setError(null);
    try {
      const filters = {};
      if (role)  filters.role = role;
      if (avail) filters.availability = avail;
      setWorkers(await fetchSCOWorkers(ownerId, filters));
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [ownerId]);

  const applyFilter = (role, avail) => {
    setFilterRole(role);
    setFilterAvail(avail);
    load(role, avail);
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setTouched({});
    setModalOpen(true);
  };

  const openEdit = (w) => {
    setEditing(w);
    setForm({ name: w.name, phone: w.phone || '', email: w.email || '', role: w.role, availability: w.availability });
    setErrors({});
    setTouched({});
    setModalOpen(true);
  };

  // Update field, validate inline, mark as touched
  const handleChange = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    if (touched[k]) {
      // Re-validate on change once the field has been touched
      const msg = validateField(k, v);
      setErrors(e => ({ ...e, [k]: msg }));
    }
  };

  // Validate on blur — marks field as touched
  const handleBlur = (k) => {
    setTouched(t => ({ ...t, [k]: true }));
    const msg = validateField(k, form[k]);
    setErrors(e => ({ ...e, [k]: msg }));
  };

  const handleSave = async () => {
    // Mark all fields as touched so errors show
    const allTouched = Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);

    const errs = validateAll(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      if (editing) {
        const updated = await updateSCOWorker(ownerId, editing.id, form);
        setWorkers(w => w.map(x => x.id === editing.id ? updated : x));
      } else {
        const created = await addSCOWorker(ownerId, form);
        setWorkers(w => [created, ...w]);
      }
      setModalOpen(false);
    } catch (e) {
      setErrors({ submit: e.message });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (worker) => {
    setTogglingId(worker.id);
    try {
      const updated = await toggleAvailability(ownerId, worker.id);
      setWorkers(w => w.map(x => x.id === worker.id ? updated : x));
    } catch (e) { alert(e.message); }
    finally { setTogglingId(null); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteSCOWorker(ownerId, deleteTarget.id);
      setWorkers(w => w.filter(x => x.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) { alert(e.message); }
    finally { setDeleting(false); }
  };

  const available = workers.filter(w => w.availability === 'AVAILABLE').length;
  const busy      = workers.filter(w => w.availability === 'BUSY').length;

  // Helper: has any visible error for a field
  const fieldError = (k) => (touched[k] ? errors[k] : '');

  return (
    <div className='bg-purple-50'>
      <Header />

      <div className="space-y-6 pt-25 m-4">
        <SectionHeader
          title="Workers"
          subtitle="Manage your service center staff"
          actions={
            <PrimaryBtn onClick={openAdd}><Plus size={16} /> Add Worker</PrimaryBtn>
          }
        />

        {/* Summary Chips */}
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'Total',     val: workers.length, cls: 'bg-purple-100 text-purple-700' },
            { label: 'Available', val: available,       cls: 'bg-green-100 text-green-700'  },
            { label: 'Busy',      val: busy,            cls: 'bg-orange-100 text-orange-700'},
          ].map(c => (
            <span key={c.label} className={`px-4 py-1.5 rounded-full text-sm font-semibold ${c.cls}`}>
              {c.label}: {c.val}
            </span>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <select value={filterRole} onChange={e => applyFilter(e.target.value, filterAvail)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200">
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <select value={filterAvail} onChange={e => applyFilter(filterRole, e.target.value)}
            className="text-xs border border-gray-200 rounded-xl px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-200">
            {AVAILABILITY_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
          </select>
          {(filterRole || filterAvail) && (
            <button onClick={() => applyFilter('', '')}
              className="text-xs text-purple-600 font-semibold px-3 py-2 rounded-xl border border-purple-200 hover:bg-purple-50">
              Clear
            </button>
          )}
        </div>

        {loading && <PageLoader />}
        {error   && <ErrorBlock message={error} onRetry={load} />}

        {!loading && !error && workers.length === 0 && (
          <EmptyState icon={Users} title="No workers found" subtitle="Add workers to your service center" />
        )}

        {!loading && !error && workers.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {workers.map(w => (
              <Card key={w.id} className="relative">
                <button
                  onClick={() => handleToggle(w)}
                  disabled={togglingId === w.id}
                  className="absolute top-4 right-4 text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                  title="Toggle availability"
                >
                  {w.availability === 'AVAILABLE'
                    ? <ToggleRight size={26} className="text-green-500" />
                    : <ToggleLeft  size={26} className="text-gray-300" />
                  }
                </button>

                <div className="flex items-start gap-3 pr-8">
                  <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-gray-900 text-sm">{w.name}</p>
                    <p className="text-xs text-gray-500">{w.phone}</p>
                    {w.email && <p className="text-xs text-gray-400 truncate">{w.email}</p>}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLOR[w.role] || ROLE_COLOR.GENERAL}`}>
                    <Briefcase size={10} className="inline mr-1" />
                    {w.role?.replace(/_/g, ' ')}
                  </span>
                  <StatusBadge status={w.availability} />
                </div>

                <div className="mt-4 pt-3 border-t border-purple-50 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Performance</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold text-gray-700">{w.completedJobs} jobs</span>
                      <RatingStars rating={w.rating || 0} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => openEdit(w)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-purple-100 hover:text-purple-600 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => setDeleteTarget(w)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-red-100 hover:text-red-600 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Add / Edit Modal */}
        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Worker' : 'Add Worker'}>
          <div className="space-y-4">

            {/* Name */}
            <Input
              label="Full Name *"
              placeholder="Your name"
              value={form.name}
              onChange={e => handleChange('name', e.target.value)}
              onBlur={() => handleBlur('name')}
              error={fieldError('name')}
            />

            {/* Phone */}
            <Input
              label="Phone *"
              placeholder="1234567890"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
              onBlur={() => handleBlur('phone')}
              error={fieldError('phone')}
              maxLength={10}
            />

            {/* Email */}
            <div>
              <Input
                label="Email (optional)"
                placeholder="worker@email.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                error={fieldError('email')}
              />
              {!fieldError('email') && (
                <p className="text-[11px] text-gray-400 mt-1 ml-1">
                  Used for sending work notifications
                </p>
              )}
            </div>

            {/* Role */}
            <Select
              label="Role *"
              options={ROLE_OPTIONS}
              value={form.role}
              onChange={e => handleChange('role', e.target.value)}
              onBlur={() => handleBlur('role')}
              error={fieldError('role')}
            />

            {/* Availability */}
            <Select
              label="Availability *"
              options={AVAIL_FORM_OPTIONS}
              value={form.availability}
              onChange={e => handleChange('availability', e.target.value)}
              onBlur={() => handleBlur('availability')}
              error={fieldError('availability')}
            />

            {/* Server error */}
            {errors.submit && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                {errors.submit}
              </p>
            )}

            {/* Required fields note */}
            <p className="text-[11px] text-gray-400">* Required fields</p>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <GhostBtn onClick={() => setModalOpen(false)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={handleSave} loading={saving}>
                {editing ? 'Save Changes' : 'Add Worker'}
              </PrimaryBtn>
            </div>
          </div>
        </Modal>

        {/* Delete Confirm */}
        <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Worker" maxWidth="max-w-sm">
          <p className="text-sm text-gray-600 mb-6">
            Remove <strong>{deleteTarget?.name}</strong> from your center? This cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <GhostBtn onClick={() => setDeleteTarget(null)}>Cancel</GhostBtn>
            <DangerBtn onClick={handleDelete} disabled={deleting}>
              {deleting ? 'Removing…' : 'Remove'}
            </DangerBtn>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SCOWorkers;