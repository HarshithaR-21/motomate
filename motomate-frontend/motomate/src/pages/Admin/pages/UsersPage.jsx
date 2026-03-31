import { useState, useEffect, useCallback } from 'react';
import {
  Users, Eye, UserX, UserCheck, Trash2, Building2,
  Truck, UserCog, User, ShieldAlert
} from 'lucide-react';
import { fetchUsers, fetchUserById, deactivateUser, reactivateUser, deleteUser } from '../api';
import {
  SectionHeader, Table, Pagination, StatusBadge,
  FilterBar, Modal, PageLoader, ErrorBlock, DetailRow, Spinner, Card
} from '../components/UI';

const ROLE_ICONS = {
  CUSTOMER:             User,
  WORKER:               UserCog,
  SERVICE_CENTER_OWNER: Building2,
  FLEET_MANAGER:        Truck,
  ADMIN:                ShieldAlert,
};

const ROLE_COLORS = {
  CUSTOMER:             'bg-blue-50 text-blue-700',
  WORKER:               'bg-amber-50 text-amber-700',
  SERVICE_CENTER_OWNER: 'bg-red-50 text-red-700',
  FLEET_MANAGER:        'bg-indigo-50 text-indigo-700',
  ADMIN:                'bg-gray-100 text-gray-700',
};

// ── User Detail Modal ─────────────────────────────────────────────
const UserDetailModal = ({ open, onClose, userId, onAction }) => {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [actLoad, setActLoad] = useState(false);
  const [confirm, setConfirm] = useState(null); // 'deactivate' | 'delete'

  useEffect(() => {
    if (!open || !userId) return;
    setDetail(null);
    setConfirm(null);
    setLoading(true);
    fetchUserById(userId)
      .then(d => setDetail(d))
      .catch(e => setDetail({ error: e.message }))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const handleDeactivate = async () => {
    setActLoad(true);
    try {
      await deactivateUser(userId);
      onAction?.();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setActLoad(false); setConfirm(null); }
  };

  const handleReactivate = async () => {
    setActLoad(true);
    try {
      await reactivateUser(userId);
      onAction?.();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setActLoad(false); }
  };

  const handleDelete = async () => {
    setActLoad(true);
    try {
      await deleteUser(userId);
      onAction?.();
      onClose();
    } catch (e) { alert(e.message); }
    finally { setActLoad(false); setConfirm(null); }
  };

  const d = detail || {};
  const RoleIcon = d.role ? (ROLE_ICONS[d.role] || User) : User;

  return (
    <Modal open={open} onClose={onClose} title="User Details" maxWidth="max-w-lg">
      {loading ? <PageLoader /> : detail?.error ? (
        <p className="text-red-500 text-sm">{detail.error}</p>
      ) : (
        <div className="space-y-5">
          {/* Profile header */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${ROLE_COLORS[d.role] || 'bg-gray-100 text-gray-600'}`}>
              <RoleIcon size={22} />
            </div>
            <div className="flex-1">
              <p className="font-bold text-gray-900">{d.name}</p>
              <p className="text-xs text-gray-500">{d.email}</p>
            </div>
            <StatusBadge status={d.active ? 'active' : 'inactive'} />
          </div>

          {/* Basic Info */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Profile</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="Full Name"  value={d.name} />
              <DetailRow label="Email"      value={d.email} />
              <DetailRow label="Phone"      value={d.phone} />
              <DetailRow label="Role"       value={d.role?.replace(/_/g, ' ')} />
              <DetailRow label="Status"     value={d.active ? 'Active' : 'Deactivated'} />
            </div>
          </div>

          {/* Address */}
          {(d.city || d.state) && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Location</p>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                <DetailRow label="Area"     value={d.area} />
                <DetailRow label="City"     value={d.city} />
                <DetailRow label="State"    value={d.state} />
                <DetailRow label="Pin Code" value={d.pinCode} />
              </div>
            </div>
          )}

          {/* Role-specific */}
          {(d.businessName || d.companyName || d.licenseNumber) && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Role Info</p>
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                {d.businessName  && <DetailRow label="Business Name"  value={d.businessName} />}
                {d.companyName   && <DetailRow label="Company Name"   value={d.companyName} />}
                {d.licenseNumber && <DetailRow label="License Number" value={d.licenseNumber} />}
              </div>
            </div>
          )}

          {/* Confirm dialogs */}
          {confirm === 'deactivate' && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-sm font-semibold text-amber-800 mb-3">
                Deactivate this user? They will not be able to log in.
              </p>
              <div className="flex gap-2">
                <button onClick={handleDeactivate} disabled={actLoad}
                  className="flex-1 bg-amber-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {actLoad ? <Spinner size={14} /> : <UserX size={14} />} Confirm Deactivate
                </button>
                <button onClick={() => setConfirm(null)}
                  className="flex-1 border border-gray-200 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {confirm === 'delete' && (
            <div className="p-4 bg-red-50 rounded-xl border border-red-200">
              <p className="text-sm font-semibold text-red-800 mb-3">
                ⚠️ Permanently delete this user? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button onClick={handleDelete} disabled={actLoad}
                  className="flex-1 bg-red-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {actLoad ? <Spinner size={14} /> : <Trash2 size={14} />} Confirm Delete
                </button>
                <button onClick={() => setConfirm(null)}
                  className="flex-1 border border-gray-200 py-2 rounded-xl text-sm font-semibold hover:bg-gray-50">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {!confirm && d.role !== 'ADMIN' && (
            <div className="pt-3 border-t border-gray-100 flex gap-2">
              {d.active ? (
                <button onClick={() => setConfirm('deactivate')}
                  className="flex-1 flex items-center justify-center gap-2 border border-amber-200 text-amber-700 bg-amber-50 py-2.5 rounded-xl text-sm font-semibold hover:bg-amber-100 transition-colors">
                  <UserX size={15} /> Deactivate
                </button>
              ) : (
                <button onClick={handleReactivate} disabled={actLoad}
                  className="flex-1 flex items-center justify-center gap-2 border border-green-200 text-green-700 bg-green-50 py-2.5 rounded-xl text-sm font-semibold hover:bg-green-100 disabled:opacity-50 transition-colors">
                  {actLoad ? <Spinner size={15} /> : <UserCheck size={15} />} Reactivate
                </button>
              )}
              <button onClick={() => setConfirm('delete')}
                className="flex items-center justify-center gap-2 border border-red-200 text-red-600 bg-red-50 py-2.5 px-4 rounded-xl text-sm font-semibold hover:bg-red-100 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

// ── Main Users Page ───────────────────────────────────────────────
const UsersPage = () => {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ role: '', search: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchUsers({ page: page - 1, size: limit, ...filters });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const columns = [
    { key: 'name',   label: 'Name',   render: (v, r) => (
      <div className="flex items-center gap-2.5">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${ROLE_COLORS[r.role] || 'bg-gray-100 text-gray-600'}`}>
          {v?.charAt(0)?.toUpperCase() || '?'}
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-800">{v}</p>
          <p className="text-[10px] text-gray-400">{r.email}</p>
        </div>
      </div>
    )},
    { key: 'phone',  label: 'Phone',  render: v => <span className="text-xs">{v || '—'}</span> },
    { key: 'role',   label: 'Role',   render: v => v ? (
      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[v] || 'bg-gray-100 text-gray-600'}`}>
        {v.replace(/_/g, ' ')}
      </span>
    ) : '—'},
    { key: 'city',   label: 'City',   render: (v, r) => <span className="text-xs text-gray-600">{v || '—'}{r.state ? `, ${r.state}` : ''}</span> },
    { key: 'active', label: 'Status', render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    { key: 'id',     label: 'Action', render: (_, row) => (
      <button
        onClick={e => { e.stopPropagation(); setSelected(row.id || row._id); }}
        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
      >
        <Eye size={13} /> View
      </button>
    )},
  ];

  return (
    <div>
      <SectionHeader
        title="User Management"
        subtitle={`${total} total users`}
      />

      <Card>
        <FilterBar
          filters={[
            { key: 'role', type: 'select', options: [
              { value: '',                     label: 'All Roles' },
              { value: 'CUSTOMER',             label: 'Customers' },
              { value: 'WORKER',               label: 'Workers' },
              { value: 'SERVICE_CENTER_OWNER', label: 'Service Center Owners' },
              { value: 'FLEET_MANAGER',        label: 'Fleet Managers' },
            ]},
            { key: 'search', type: 'text', placeholder: 'Search name, email, phone…' },
          ]}
          values={filters}
          onChange={updateFilter}
        />

        {error ? (
          <ErrorBlock message={error} onRetry={load} />
        ) : (
          <>
            <Table
              columns={columns}
              data={data}
              loading={loading}
              onRowClick={row => setSelected(row.id || row._id)}
              emptyIcon={Users}
              emptyTitle="No users found"
              emptySubtitle="Registered users will appear here"
            />
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
          </>
        )}
      </Card>

      <UserDetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        userId={selected}
        onAction={load}
      />
    </div>
  );
};

export default UsersPage;
