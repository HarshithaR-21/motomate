import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Plus, Pencil, Trash2, Users, ToggleLeft, ToggleRight, Briefcase, Tag, KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { fetchSCOWorkers, addSCOWorker, updateSCOWorker, deleteSCOWorker, toggleAvailability } from '../api';
import {
  PageLoader, ErrorBlock, EmptyState, SectionHeader,
  Modal, Input, Select, PrimaryBtn, GhostBtn, DangerBtn,
  StatusBadge, RatingStars, Card
} from '../components/UI';
import Header from '../components/Header';
import axios from 'axios';

// ─── Skill options matching service categories ────────────────────────────────
const SKILL_OPTIONS = [
  { value: 'GENERAL_SERVICE',      label: 'General Service'      },
  { value: 'PERIODIC_MAINTENANCE', label: 'Periodic Maintenance' },
  { value: 'OIL_CHANGE',           label: 'Oil Change'           },
  { value: 'BRAKES',               label: 'Brake Service'        },
  { value: 'ELECTRICAL',           label: 'Electrical Repair'    },
  { value: 'TYRES',                label: 'Tyre Issue'           },
  { value: 'ENGINE',               label: 'Engine Check'         },
  { value: 'AC',                   label: 'AC Service'           },
  { value: 'BATTERY',              label: 'Battery Issue'        },
];

const SKILL_COLOR = {
  GENERAL_SERVICE:      'bg-gray-100 text-gray-700',
  PERIODIC_MAINTENANCE: 'bg-indigo-100 text-indigo-700',
  OIL_CHANGE:           'bg-amber-100 text-amber-700',
  BRAKES:               'bg-green-100 text-green-700',
  ELECTRICAL:           'bg-purple-100 text-purple-700',
  TYRES:                'bg-orange-100 text-orange-700',
  ENGINE:               'bg-red-100 text-red-700',
  AC:                   'bg-sky-100 text-sky-700',
  BATTERY:              'bg-yellow-100 text-yellow-700',
  BODY_WORK:            'bg-pink-100 text-pink-700',
};

const ROLES = [
  { value: '',              label: 'All Roles'     },
  { value: 'MECHANIC',      label: 'Mechanic'      },
  { value: 'ELECTRICIAN',   label: 'Electrician'   },
  { value: 'FUEL_DELIVERY', label: 'Fuel Delivery' },
  { value: 'BODY_WORK',     label: 'Body Work'     },
  { value: 'GENERAL',       label: 'General'       },
];
const ROLE_OPTIONS = ROLES.slice(1).map(r => ({ value: r.value, label: r.label }));

const AVAILABILITY_OPTIONS = [
  { value: '',          label: 'All Status' },
  { value: 'AVAILABLE', label: 'Available'  },
  { value: 'BUSY',      label: 'Busy'       },
  { value: 'OFF_DUTY',  label: 'Off Duty'   },
];
const AVAIL_FORM_OPTIONS = AVAILABILITY_OPTIONS.slice(1);

const EMPTY_FORM = {
  name: '', phone: '', email: '', role: 'MECHANIC', availability: 'AVAILABLE', skills: [],
  // credential fields
  createCredentials: false,
  workerPassword: '',
  confirmPassword: '',
};

const PHONE_REGEX = /^\d{10}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX  = /^[a-zA-Z\s'.,-]{2,60}$/;

const validateField = (name, value, form) => {
  switch (name) {
    case 'name':
      if (!value.trim())             return 'Name is required';
      if (value.trim().length < 2)   return 'Name must be at least 2 characters';
      if (value.trim().length > 60)  return 'Name must be under 60 characters';
      if (!NAME_REGEX.test(value))   return 'Name can only contain letters, spaces and basic punctuation';
      return '';
    case 'phone':
      if (!value.trim())             return 'Phone number is required';
      if (!PHONE_REGEX.test(value))  return 'Enter a valid 10-digit phone number';
      return '';
    case 'email':
      if (!value.trim())             return '';
      if (!EMAIL_REGEX.test(value))  return 'Enter a valid email address';
      return '';
    case 'role':
      if (!value)                    return 'Please select a role';
      return '';
    case 'availability':
      if (!value)                    return 'Please select availability';
      return '';
    case 'workerPassword':
      if (!form?.createCredentials)  return '';
      if (!value)                    return 'Password is required';
      if (value.length < 6)          return 'Password must be at least 6 characters';
      return '';
    case 'confirmPassword':
      if (!form?.createCredentials)  return '';
      if (!value)                    return 'Please confirm the password';
      if (value !== form?.workerPassword) return 'Passwords do not match';
      return '';
    default:
      return '';
  }
};

const validateAll = (form) => {
  const errs = {};
  ['name', 'phone', 'email', 'role', 'availability', 'workerPassword', 'confirmPassword'].forEach(k => {
    const msg = validateField(k, form[k], form);
    if (msg) errs[k] = msg;
  });
  // Extra: if credentials requested, email is mandatory
  if (form.createCredentials && !form.email.trim()) {
    errs.email = 'Email is required to create login credentials';
  }
  return errs;
};

const ROLE_COLOR = {
  MECHANIC:      'bg-purple-100 text-purple-700',
  ELECTRICIAN:   'bg-blue-100 text-blue-700',
  FUEL_DELIVERY: 'bg-orange-100 text-orange-700',
  BODY_WORK:     'bg-pink-100 text-pink-700',
  GENERAL:       'bg-gray-100 text-gray-700',
};

// ─── Skills multi-select chip widget ─────────────────────────────────────────
const SkillsPicker = ({ selected, onChange }) => {
  const toggle = (val) => {
    const next = selected.includes(val) ? selected.filter(s => s !== val) : [...selected, val];
    onChange(next);
  };
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">
        Skills <span className="text-gray-400 font-normal text-xs">(select all that apply)</span>
      </label>
      <div className="flex flex-wrap gap-2">
        {SKILL_OPTIONS.map(sk => {
          const active = selected.includes(sk.value);
          return (
            <button
              key={sk.value}
              type="button"
              onClick={() => toggle(sk.value)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-all
                ${active
                  ? 'border-purple-500 bg-purple-600 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300 hover:text-purple-600'}`}
            >
              {active && <span className="mr-1">✓</span>}
              {sk.label}
            </button>
          );
        })}
      </div>
      {selected.length > 0 && (
        <p className="text-xs text-purple-600 mt-2 font-medium">{selected.length} skill(s) selected</p>
      )}
    </div>
  );
};

// ─── Password input with show/hide toggle ─────────────────────────────────────
const PasswordInput = ({ label, error, value, onChange, onBlur, placeholder }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</label>}
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          className={`w-full border rounded-xl px-3.5 py-2.5 pr-10 text-sm text-gray-800 outline-none focus:ring-2 transition-all
            ${error ? 'border-red-300 focus:ring-red-200' : 'border-gray-200 focus:ring-purple-200 focus:border-purple-400'}`}
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
        >
          {show ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
};

// ─── Credentials section inside the modal ────────────────────────────────────
const CredentialsSection = ({ form, errors, touched, onChange, onBlur }) => {
  const fieldError = (k) => (touched[k] ? errors[k] : '');

  return (
    <div className="rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 p-4 space-y-4">
      {/* Toggle header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center">
            <KeyRound size={14} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">Create Login Credentials</p>
            <p className="text-[11px] text-gray-500">Worker can log in using these credentials</p>
          </div>
        </div>
        {/* Toggle switch */}
        <button
          type="button"
          onClick={() => onChange('createCredentials', !form.createCredentials)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none
            ${form.createCredentials ? 'bg-purple-600' : 'bg-gray-300'}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
              ${form.createCredentials ? 'translate-x-6' : 'translate-x-1'}`}
          />
        </button>
      </div>

      {/* Credential fields — only shown when toggle is on */}
      {form.createCredentials && (
        <div className="space-y-3 pt-1">
          {/* Email reminder */}
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            <ShieldCheck size={14} className="text-amber-600 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700 leading-relaxed">
              The worker will log in with their <strong>email address</strong> above as the username.
              Make sure it is filled in correctly.
            </p>
          </div>

          <PasswordInput
            label="Password *"
            placeholder="Set a password for the worker"
            value={form.workerPassword}
            onChange={e => onChange('workerPassword', e.target.value)}
            onBlur={() => onBlur('workerPassword')}
            error={fieldError('workerPassword')}
          />
          <PasswordInput
            label="Confirm Password *"
            placeholder="Re-enter the password"
            value={form.confirmPassword}
            onChange={e => onChange('confirmPassword', e.target.value)}
            onBlur={() => onBlur('confirmPassword')}
            error={fieldError('confirmPassword')}
          />

          <p className="text-[11px] text-gray-400">
            Minimum 6 characters. Share these credentials with the worker after saving.
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
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
  const [touched, setTouched]           = useState({});
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
        if (resp.status === 200 && id) setOwnerId(id);
        else setError('Unable to determine logged in user. Please login again.');
      } catch { setError('Unable to determine logged in user. Please login again.'); }
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

  const applyFilter = (role, avail) => { setFilterRole(role); setFilterAvail(avail); load(role, avail); };

  const openAdd = () => {
    setEditing(null); setForm(EMPTY_FORM); setErrors({}); setTouched({});
    setModalOpen(true);
  };
  const openEdit = (w) => {
    setEditing(w);
    setForm({
      name:             w.name,
      phone:            w.phone || '',
      email:            w.email || '',
      role:             w.role,
      availability:     w.availability,
      skills:           w.skills || [],
      // Credentials not editable in edit mode
      createCredentials: false,
      workerPassword:   '',
      confirmPassword:  '',
    });
    setErrors({}); setTouched({});
    setModalOpen(true);
  };

  const handleChange = (k, v) => {
    setForm(f => {
      const next = { ...f, [k]: v };
      // When toggling credentials off, clear password fields and errors
      if (k === 'createCredentials' && !v) {
        next.workerPassword  = '';
        next.confirmPassword = '';
        setErrors(e => ({ ...e, workerPassword: '', confirmPassword: '' }));
        setTouched(t => ({ ...t, workerPassword: false, confirmPassword: false }));
      }
      return next;
    });
    if (touched[k]) setErrors(e => ({ ...e, [k]: validateField(k, v, form) }));
  };

  const handleBlur = (k) => {
    setTouched(t => ({ ...t, [k]: true }));
    setErrors(e => ({ ...e, [k]: validateField(k, form[k], form) }));
  };

  const handleSave = async () => {
    const allTouched = Object.keys(form).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    const errs = validateAll(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      if (editing) {
        // Edit: credentials not re-sent (password change is a separate feature)
        const payload = {
          name:         form.name,
          phone:        form.phone,
          email:        form.email,
          role:         form.role,
          availability: form.availability,
          skills:       form.skills,
        };
        const updated = await updateSCOWorker(ownerId, editing.id, payload);
        setWorkers(w => w.map(x => x.id === editing.id ? updated : x));
      } else {
        // Add: include workerPassword only if credentials were requested
        const payload = {
          name:         form.name,
          phone:        form.phone,
          email:        form.email,
          role:         form.role,
          availability: form.availability,
          skills:       form.skills,
          ...(form.createCredentials && { workerPassword: form.workerPassword }),
        };
        const created = await addSCOWorker(ownerId, payload);
        setWorkers(w => [created, ...w]);
      }
      setModalOpen(false);
    } catch (e) { setErrors({ submit: e.message }); }
    finally { setSaving(false); }
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
  const fieldError = (k) => (touched[k] ? errors[k] : '');

  return (
    <div className='bg-purple-50'>
      <Header />
      <div className="space-y-6 pt-25 m-4">
        <SectionHeader
          title="Workers"
          subtitle="Manage your service center staff"
          actions={<PrimaryBtn onClick={openAdd}><Plus size={16} /> Add Worker</PrimaryBtn>}
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
                    : <ToggleLeft  size={26} className="text-gray-300" />}
                </button>

                <div className="flex items-start gap-3 pr-8">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center text-white font-bold text-base shrink-0">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-gray-900 text-sm">{w.name}</p>
                      {/* Credential indicator */}
                      {w.workerUserId && (
                        <span title="Has login credentials" className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 text-[9px] font-bold">
                          <KeyRound size={8} /> Login
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{w.phone}</p>
                    {w.email && <p className="text-xs text-gray-400 truncate">{w.email}</p>}
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLOR[w.role] || ROLE_COLOR.GENERAL}`}>
                    <Briefcase size={10} className="inline mr-1" />
                    {w.role?.replace(/_/g, ' ')}
                  </span>
                  <StatusBadge status={w.availability} />
                </div>

                {w.skills?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {w.skills.map(sk => {
                      const opt = SKILL_OPTIONS.find(o => o.value === sk);
                      return (
                        <span key={sk} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SKILL_COLOR[sk] || 'bg-gray-100 text-gray-600'}`}>
                          <Tag size={8} className="inline mr-0.5" />
                          {opt?.label || sk}
                        </span>
                      );
                    })}
                  </div>
                )}

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
            <Input label="Full Name *" placeholder="Worker name" value={form.name}
              onChange={e => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} error={fieldError('name')} />
            <Input label="Phone *" placeholder="1234567890" value={form.phone}
              onChange={e => handleChange('phone', e.target.value)} onBlur={() => handleBlur('phone')} error={fieldError('phone')} maxLength={10} />
            <div>
              <Input
                label={`Email${form.createCredentials ? ' *' : ' (optional)'}`}
                placeholder="worker@email.com"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                error={fieldError('email')}
              />
              {!fieldError('email') && (
                <p className="text-[11px] text-gray-400 mt-1 ml-1">
                  {form.createCredentials
                    ? 'This email will be used as the login username'
                    : 'Used for sending work notifications'}
                </p>
              )}
            </div>
            <Select label="Role *" options={ROLE_OPTIONS} value={form.role}
              onChange={e => handleChange('role', e.target.value)} onBlur={() => handleBlur('role')} error={fieldError('role')} />
            <Select label="Availability *" options={AVAIL_FORM_OPTIONS} value={form.availability}
              onChange={e => handleChange('availability', e.target.value)} onBlur={() => handleBlur('availability')} error={fieldError('availability')} />

            <SkillsPicker
              selected={form.skills}
              onChange={skills => handleChange('skills', skills)}
            />

            {/* ── Credentials section (only on Add, not Edit) ── */}
            {!editing && (
              <CredentialsSection
                form={form}
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onBlur={handleBlur}
              />
            )}

            {errors.submit && (
              <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{errors.submit}</p>
            )}
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
            <DangerBtn onClick={handleDelete} disabled={deleting}>{deleting ? 'Removing…' : 'Remove'}</DangerBtn>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default SCOWorkers;