import { useState, useEffect, useCallback } from 'react';
import { Building2, Users, UserCog, Eye, MapPin, Wrench, Car, CheckCircle } from 'lucide-react';
import {
  fetchServiceCenters, fetchServiceCenterById,
  fetchFleetManagers, fetchFleetManagerById,
  fetchWorkers, fetchWorkerById,
  deactivateUser, reactivateUser
} from '../api';
import {
  SectionHeader, Table, Pagination, StatusBadge,
  FilterBar, Modal, PageLoader, ErrorBlock, DetailRow, Card
} from '../components/UI';

// ── Reusable Detail Modal ─────────────────────────────────────────
const DetailModal = ({ open, onClose, title, loading, error, children }) => (
  <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-2xl">
    {loading ? <PageLoader /> : error ? (
      <p className="text-red-500 text-sm">{error}</p>
    ) : children}
  </Modal>
);

// ═══════════════════════════════════════════════════════════════════
//  SERVICE CENTERS PAGE
// ═══════════════════════════════════════════════════════════════════
const ServiceCenterDetailContent = ({ d }) => (
  <div className="space-y-5">
    <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl">
      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
        <Building2 size={22} className="text-red-600" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-900">{d.centerName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{d.centerType}</p>
      </div>
      <StatusBadge status={d.approvalStatus?.toLowerCase()} />
    </div>

    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Owner Info</p>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <DetailRow label="Owner Name" value={d.ownerName} />
        <DetailRow label="Email"      value={d.email} />
        <DetailRow label="Phone"      value={d.phone} />
      </div>
    </div>

    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Location</p>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <DetailRow label="Address"  value={d.address} />
        <DetailRow label="City"     value={d.city} />
        <DetailRow label="State"    value={d.state} />
        <DetailRow label="Pincode"  value={d.pincode} />
        <DetailRow label="Landmark" value={d.landmark} />
        <DetailRow label="Website"  value={d.website || '—'} />
      </div>
    </div>

    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Services Offered</p>
      <div className="flex flex-wrap gap-2">
        {(d.services || []).map((s, i) => (
          <span key={i} className="text-xs bg-red-50 text-red-700 border border-red-200 px-3 py-1 rounded-full font-medium">
            {s}
          </span>
        ))}
      </div>
    </div>

    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Vehicle Types</p>
      <div className="flex flex-wrap gap-2">
        {(d.vehicleTypes || []).map((v, i) => (
          <span key={i} className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full font-medium">
            {v}
          </span>
        ))}
      </div>
    </div>

    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Business Info</p>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <DetailRow label="GST Number"        value={d.gstNumber} />
        <DetailRow label="PAN Number"        value={d.panNumber} />
        <DetailRow label="License Number"    value={d.licenseNumber} />
        <DetailRow label="Years in Business" value={d.yearsInBusiness} />
        <DetailRow label="Total Bays"        value={d.totalBays} />
        <DetailRow label="Emergency Service" value={d.emergencyService ? 'Yes' : 'No'} />
      </div>
    </div>

    {(d.gstCertificatePath || d.tradeLicensePath || d.shopPhotoPath) && (
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Documents</p>
        <div className="space-y-2">
          {d.gstCertificatePath && <a href={d.gstCertificatePath} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 border rounded-xl">📄 GST Certificate</a>}
          {d.tradeLicensePath   && <a href={d.tradeLicensePath}   target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 border rounded-xl">📄 Trade License</a>}
          {d.shopPhotoPath      && <a href={d.shopPhotoPath}      target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 border rounded-xl">🖼️ Shop Photo</a>}
        </div>
      </div>
    )}
  </div>
);

export const ServiceCentersPage = () => {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ status: '', search: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoad, setDetailLoad] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchServiceCenters({ page: page - 1, size: limit, ...filters });
      setData(res.data || []);
      setTotal(res.total || 0);
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setSelected(id);
    setDetail(null);
    setDetailError(null);
    setDetailLoad(true);
    try {
      const d = await fetchServiceCenterById(id);
      setDetail(d);
    } catch (e) { setDetailError(e.message); }
    finally { setDetailLoad(false); }
  };

  const updateFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };

  const columns = [
    { key: 'centerName',     label: 'Center',    render: v => <span className="font-semibold text-gray-800 text-xs">{v}</span> },
    { key: 'centerType',     label: 'Type',      render: v => <span className="text-xs text-gray-600">{v}</span> },
    { key: 'ownerName',      label: 'Owner',     render: v => <span className="text-xs">{v}</span> },
    { key: 'city',           label: 'Location',  render: (v, r) => (
      <span className="flex items-center gap-1 text-xs text-gray-600"><MapPin size={11} />{v}{r.state ? `, ${r.state}` : ''}</span>
    )},
    { key: 'services',       label: 'Services',  render: v => Array.isArray(v) ? <span className="text-xs text-gray-500">{v.slice(0,2).join(', ')}{v.length > 2 ? ` +${v.length-2}` : ''}</span> : '—' },
    { key: 'approvalStatus', label: 'Status',    render: v => <StatusBadge status={v?.toLowerCase()} /> },
    { key: 'id',             label: 'Action',    render: (_, row) => (
      <button onClick={e => { e.stopPropagation(); openDetail(row.id || row._id); }}
        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline">
        <Eye size={13} /> View
      </button>
    )},
  ];

  return (
    <div>
      <SectionHeader title="Service Centers" subtitle={`${total} total`} />
      <Card>
        <FilterBar
          filters={[
            { key: 'status', type: 'select', options: [
              { value: '',         label: 'All Statuses' },
              { value: 'PENDING',  label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' },
              { value: 'REJECTED', label: 'Rejected' },
            ]},
            { key: 'search', type: 'text', placeholder: 'Search center or owner…' },
          ]}
          values={filters} onChange={updateFilter}
        />
        {error ? <ErrorBlock message={error} onRetry={load} /> : (
          <>
            <Table columns={columns} data={data} loading={loading}
              onRowClick={row => openDetail(row.id || row._id)}
              emptyIcon={Building2} emptyTitle="No service centers" />
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
          </>
        )}
      </Card>
      <DetailModal open={!!selected} onClose={() => setSelected(null)}
        title="Service Center Details" loading={detailLoad} error={detailError}>
        {detail && <ServiceCenterDetailContent d={detail} />}
      </DetailModal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  FLEET MANAGERS PAGE
// ═══════════════════════════════════════════════════════════════════
const FleetManagerDetailContent = ({ d }) => (
  <div className="space-y-5">
    <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
      <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
        <Users size={22} className="text-indigo-600" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-900">{d.companyName}</p>
        <p className="text-xs text-gray-500 mt-0.5">{d.industryType}</p>
      </div>
      <StatusBadge status={d.approvalStatus?.toLowerCase()} />
    </div>

    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Manager Info</p>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <DetailRow label="Manager Name"  value={d.managerName} />
        <DetailRow label="Designation"   value={d.designation} />
        <DetailRow label="Email"         value={d.email} />
        <DetailRow label="Phone"         value={d.phone} />
        <DetailRow label="Alt Contact"   value={d.contactPersonAlt || '—'} />
        <DetailRow label="Alt Phone"     value={d.altPhone || '—'} />
      </div>
    </div>

    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Company & Location</p>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <DetailRow label="Address"        value={d.companyAddress} />
        <DetailRow label="City"           value={d.city} />
        <DetailRow label="State"          value={d.state} />
        <DetailRow label="Website"        value={d.companyWebsite || '—'} />
        <DetailRow label="Description"    value={d.companyDescription || '—'} />
      </div>
    </div>

    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Fleet Details</p>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <DetailRow label="Total Vehicles"     value={d.totalVehicles} />
        <DetailRow label="Vehicle Categories" value={Array.isArray(d.vehicleCategories) ? d.vehicleCategories.join(', ') : d.vehicleCategories} />
        <DetailRow label="Service Needs"      value={Array.isArray(d.serviceNeeds) ? d.serviceNeeds.join(', ') : d.serviceNeeds} />
        <DetailRow label="Primary Garage"     value={d.primaryGarage} />
        <DetailRow label="Preferred Time"     value={d.preferredServiceTime} />
        <DetailRow label="Dedicated Mechanic" value={d.hasDedicatedMechanic ? 'Yes' : 'No'} />
      </div>
    </div>

    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Documents</p>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        <DetailRow label="GST Number"  value={d.gstNumber} />
        <DetailRow label="PAN Number"  value={d.panNumber} />
        <DetailRow label="CIN / LLPIN" value={d.cinNumber || '—'} />
      </div>
    </div>

    {(d.gstCertificatePath || d.companyPanCardPath || d.vehicleRcBookPath || d.authorizationLetterPath) && (
      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Uploaded Files</p>
        <div className="space-y-2">
          {d.gstCertificatePath      && <a href={d.gstCertificatePath}      target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 border rounded-xl">📄 GST Certificate</a>}
          {d.companyPanCardPath      && <a href={d.companyPanCardPath}      target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 border rounded-xl">📄 Company PAN Card</a>}
          {d.vehicleRcBookPath       && <a href={d.vehicleRcBookPath}       target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 border rounded-xl">📄 Vehicle RC Book</a>}
          {d.authorizationLetterPath && <a href={d.authorizationLetterPath} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-blue-600 hover:underline p-2 border rounded-xl">📄 Authorization Letter</a>}
        </div>
      </div>
    )}
  </div>
);

export const FleetManagersPage = () => {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ status: '', industry: '', search: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoad, setDetailLoad] = useState(false);
  const [detailError, setDetailError] = useState(null);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetchFleetManagers({ page: page - 1, size: limit, ...filters });
      setData(res.data || []); setTotal(res.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setSelected(id); setDetail(null); setDetailError(null); setDetailLoad(true);
    try { const d = await fetchFleetManagerById(id); setDetail(d); }
    catch (e) { setDetailError(e.message); }
    finally { setDetailLoad(false); }
  };

  const updateFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };

  const columns = [
    { key: 'companyName',    label: 'Company',    render: v => <span className="font-semibold text-xs text-gray-800">{v}</span> },
    { key: 'industryType',   label: 'Industry',   render: v => <span className="text-xs text-gray-600">{v}</span> },
    { key: 'managerName',    label: 'Manager' },
    { key: 'totalVehicles',  label: 'Fleet Size', render: v => v ? <span className="text-xs font-semibold text-indigo-600">{v} vehicles</span> : '—' },
    { key: 'city',           label: 'Location',   render: (v, r) => <span className="text-xs text-gray-600">{v}{r.state ? `, ${r.state}` : ''}</span> },
    { key: 'approvalStatus', label: 'Status',     render: v => <StatusBadge status={v?.toLowerCase()} /> },
    { key: 'id',             label: 'Action',     render: (_, row) => (
      <button onClick={e => { e.stopPropagation(); openDetail(row.id || row._id); }}
        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline">
        <Eye size={13} /> View
      </button>
    )},
  ];

  return (
    <div>
      <SectionHeader title="Fleet Managers" subtitle={`${total} total`} />
      <Card>
        <FilterBar
          filters={[
            { key: 'status', type: 'select', options: [
              { value: '', label: 'All Statuses' }, { value: 'PENDING', label: 'Pending' },
              { value: 'APPROVED', label: 'Approved' }, { value: 'REJECTED', label: 'Rejected' },
            ]},
            { key: 'industry', type: 'select', options: [
              { value: '', label: 'All Industries' },
              { value: 'Logistics & Delivery',          label: 'Logistics' },
              { value: 'Cab Aggregator / Taxi',         label: 'Cab / Taxi' },
              { value: 'Corporate Employee Transport',  label: 'Corporate' },
              { value: 'Tourism & Travel',              label: 'Tourism' },
              { value: 'Healthcare / Ambulance',        label: 'Healthcare' },
            ]},
            { key: 'search', type: 'text', placeholder: 'Search company or manager…' },
          ]}
          values={filters} onChange={updateFilter}
        />
        {error ? <ErrorBlock message={error} onRetry={load} /> : (
          <>
            <Table columns={columns} data={data} loading={loading}
              onRowClick={row => openDetail(row.id || row._id)}
              emptyIcon={Users} emptyTitle="No fleet managers" />
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
          </>
        )}
      </Card>
      <DetailModal open={!!selected} onClose={() => setSelected(null)}
        title="Fleet Manager Details" loading={detailLoad} error={detailError}>
        {detail && <FleetManagerDetailContent d={detail} />}
      </DetailModal>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
//  WORKERS PAGE
// ═══════════════════════════════════════════════════════════════════
export const WorkersPage = () => {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ active: '', search: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail]     = useState(null);
  const [detailLoad, setDetailLoad] = useState(false);
  const [actLoad, setActLoad]   = useState(false);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const activeParam = filters.active === 'true' ? true : filters.active === 'false' ? false : undefined;
      const res = await fetchWorkers({ page: page - 1, size: limit, search: filters.search, active: activeParam });
      setData(res.data || []); setTotal(res.total || 0);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const openDetail = async (id) => {
    setSelected(id); setDetail(null); setDetailLoad(true);
    try { const d = await fetchWorkerById(id); setDetail(d); }
    catch (e) { setDetail({ error: e.message }); }
    finally { setDetailLoad(false); }
  };

  const handleToggle = async (id, isActive) => {
    setActLoad(true);
    try {
      if (isActive) await deactivateUser(id); else await reactivateUser(id);
      load();
      setSelected(null);
    } catch (e) { alert(e.message); }
    finally { setActLoad(false); }
  };

  const updateFilter = (key, value) => { setFilters(f => ({ ...f, [key]: value })); setPage(1); };

  const columns = [
    { key: 'name',          label: 'Name',    render: (v, r) => (
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700">{v?.charAt(0) || '?'}</div>
        <div><p className="text-xs font-semibold text-gray-800">{v}</p><p className="text-[10px] text-gray-400">{r.email}</p></div>
      </div>
    )},
    { key: 'phone',         label: 'Phone',    render: v => <span className="text-xs">{v || '—'}</span> },
    { key: 'city',          label: 'Location', render: (v, r) => <span className="text-xs text-gray-600">{v || '—'}{r.state ? `, ${r.state}` : ''}</span> },
    { key: 'licenseNumber', label: 'License',  render: v => <span className="text-xs font-mono text-gray-500">{v || '—'}</span> },
    { key: 'active',        label: 'Status',   render: v => <StatusBadge status={v ? 'active' : 'inactive'} /> },
    { key: 'id',            label: 'Action',   render: (_, row) => (
      <button onClick={e => { e.stopPropagation(); openDetail(row.id || row._id); }}
        className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline">
        <Eye size={13} /> View
      </button>
    )},
  ];

  const d = detail || {};

  return (
    <div>
      <SectionHeader title="Workers" subtitle={`${total} total mechanics`} />
      <Card>
        <FilterBar
          filters={[
            { key: 'active', type: 'select', options: [
              { value: '', label: 'All Workers' }, { value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' },
            ]},
            { key: 'search', type: 'text', placeholder: 'Search by name or email…' },
          ]}
          values={filters} onChange={updateFilter}
        />
        {error ? <ErrorBlock message={error} onRetry={load} /> : (
          <>
            <Table columns={columns} data={data} loading={loading}
              onRowClick={row => openDetail(row.id || row._id)}
              emptyIcon={UserCog} emptyTitle="No workers found" />
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
          </>
        )}
      </Card>

      {/* Worker Detail Modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Worker Details" maxWidth="max-w-md">
        {detailLoad ? <PageLoader /> : detail?.error ? (
          <p className="text-red-500 text-sm">{detail.error}</p>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-amber-50 rounded-xl">
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <UserCog size={22} className="text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900">{d.name}</p>
                <p className="text-xs text-gray-500">{d.email}</p>
              </div>
              <StatusBadge status={d.active ? 'active' : 'inactive'} />
            </div>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="Phone"          value={d.phone} />
              <DetailRow label="City"           value={d.city} />
              <DetailRow label="State"          value={d.state} />
              <DetailRow label="License Number" value={d.licenseNumber || '—'} />
              <DetailRow label="Status"         value={d.active ? 'Active' : 'Deactivated'} />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => handleToggle(d.id, d.active)} disabled={actLoad}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2
                  ${d.active
                    ? 'bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100'
                    : 'bg-green-50 border border-green-200 text-green-700 hover:bg-green-100'
                  }`}>
                {actLoad ? '…' : d.active ? '⏸ Deactivate' : '▶ Reactivate'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
