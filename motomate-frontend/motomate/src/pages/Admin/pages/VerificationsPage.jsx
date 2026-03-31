import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Users, Eye, CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import {
  fetchServiceCenterRequests,
  fetchFleetManagerRequests,
  approveVerification,
  rejectVerification,
  fetchVerificationDetail,
  buildDocumentUrl,
} from '../api';
import {
  SectionHeader, Table, Pagination, StatusBadge,
  FilterBar, Modal, PageLoader, ErrorBlock, DetailRow, Spinner, Card
} from '../components/UI';

/* ── Shared verification logic ──────────────────────────────── */
const normalizeStatus = (status) => String(status || '').trim().toLowerCase();

const normalizeVerificationItem = (item) => {
  if (!item || typeof item !== 'object') return item;
  const statusValue = item.status || item.approvalStatus || (item.approvalStatus?.name && String(item.approvalStatus.name)) || '';
  return { ...item, status: statusValue };
};

const useVerifications = (fetchFn, type) => {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ status: '', search: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const limit = 10;

  const normalizeResponse = (res) => {
    if (!res) return { data: [], total: 0 };
    if (Array.isArray(res)) return { data: res, total: res.length };

    const listCandidates = [
      res.data,
      res.items,
      res.verifications,
      res.results,
      res.rows,
    ];

    const nestedData = typeof res.data === 'object' && res.data !== null
      ? [res.data.data, res.data.items, res.data.verifications, res.data.results, res.data.rows]
      : [];

    const list = [...listCandidates, ...nestedData].find(Array.isArray);
    const total = res.total ?? res.count ?? res.length ?? (Array.isArray(list) ? list.length : 0);

    return { data: list || [], total };
  };

  const normalizeItem = (item) => {
    if (!item || typeof item !== 'object') return item;
    const statusValue = item.status || item.approvalStatus || (item.approvalStatus?.name && String(item.approvalStatus.name)) || '';
    return { ...item, status: statusValue };
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn({ page: Math.max(page - 1, 0), limit, ...filters });
      const normalized = normalizeResponse(res);
      const list = Array.isArray(normalized.data) ? normalized.data.map(normalizeItem) : [];
      setData(list);
      setTotal(normalized.total);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, page, filters]);

  useEffect(() => { load(); }, [load]);

  const updateFilter = (key, value) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  return { data, total, page, setPage, filters, updateFilter, loading, error, reload: load };
};

/* ── Detail Modal ───────────────────────────────────────────── */
const VerificationDetailModal = ({ open, onClose, type, itemId, onAction }) => {
  const [detail, setDetail]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [actLoading, setActLoad] = useState(false);
  const [rejectReason, setReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    if (!open || !itemId) return;
    setDetail(null);
    setShowReject(false);
    setReason('');
    setLoading(true);
    fetchVerificationDetail(type, itemId)
      .then(d => setDetail(normalizeVerificationItem(d)))
      .catch(e => setDetail({ error: e.message }))
      .finally(() => setLoading(false));
  }, [open, itemId, type]);

  const handleApprove = async () => {
    setActLoad(true);
    try { await approveVerification(type, itemId); onAction(); onClose(); }
    catch (e) { alert(e.message); }
    finally { setActLoad(false); }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return alert('Please provide a rejection reason.');
    setActLoad(true);
    try { await rejectVerification(type, itemId, rejectReason); onAction(); onClose(); }
    catch (e) { alert(e.message); }
    finally { setActLoad(false); }
  };

  const d = detail || {};
  const isServiceCenter = type === 'service-centers';
  const uploadedDocs = () => {
    const docs = [];
    if (isServiceCenter) {
      if (d.gstCertificatePath) docs.push({ name: 'GST Certificate', url: buildDocumentUrl(d.gstCertificatePath) });
      if (d.tradeLicensePath) docs.push({ name: 'Trade License', url: buildDocumentUrl(d.tradeLicensePath) });
      if (d.shopPhotoPath) docs.push({ name: 'Shop / Facility Photo', url: buildDocumentUrl(d.shopPhotoPath) });
    } else {
      if (d.gstCertificatePath) docs.push({ name: 'GST Certificate', url: buildDocumentUrl(d.gstCertificatePath) });
      if (d.companyPanCardPath) docs.push({ name: 'Company PAN Card', url: buildDocumentUrl(d.companyPanCardPath) });
      if (d.vehicleRcBookPath) docs.push({ name: 'Vehicle RC Book', url: buildDocumentUrl(d.vehicleRcBookPath) });
      if (d.authorizationLetterPath) docs.push({ name: 'Authorization Letter', url: buildDocumentUrl(d.authorizationLetterPath) });
    }
    return docs;
  };
  const resolvedDocs = d.documents || d.files || d.uploadedFiles || d.attachments || uploadedDocs();
  const isPending = normalizeStatus(d.status) === 'pending';

  return (
    <Modal open={open} onClose={onClose} title={isServiceCenter ? 'Service Center Verification' : 'Fleet Manager Verification'} maxWidth="max-w-2xl">
      {loading ? <PageLoader /> : detail?.error ? (
        <p className="text-red-500 text-sm">{detail.error}</p>
      ) : (
        <div className="space-y-5">
          {/* Header */}
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
              {isServiceCenter ? <Building2 size={22} className="text-red-600" /> : <Users size={22} className="text-red-600" />}
            </div>
            <div>
              <p className="font-bold text-gray-900">{isServiceCenter ? d.centerName : d.companyName}</p>
              <p className="text-xs text-gray-500 mt-0.5">{isServiceCenter ? d.centerType : d.industryType}</p>
            </div>
            <div className="ml-auto"><StatusBadge status={d.status} /></div>
          </div>

          {/* Owner / Manager */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">{isServiceCenter ? 'Owner Info' : 'Manager Info'}</p>
            <div className="grid sm:grid-cols-2 gap-0 rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="Full Name" value={isServiceCenter ? d.ownerName : d.managerName} />
              <DetailRow label="Email" value={d.email} />
              <DetailRow label="Phone" value={d.phone} />
              <DetailRow label="Designation" value={d.designation || '—'} />
            </div>
          </div>

          {/* Business Info */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Business Details</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="Address" value={[d.address, d.city, d.state, d.pincode].filter(Boolean).join(', ')} />
              {isServiceCenter && <DetailRow label="Services Offered" value={Array.isArray(d.services) ? d.services.join(', ') : d.services} />}
              {isServiceCenter && <DetailRow label="Vehicle Types" value={Array.isArray(d.vehicleTypes) ? d.vehicleTypes.join(', ') : d.vehicleTypes} />}
              {!isServiceCenter && <DetailRow label="Fleet Size" value={d.totalVehicles ? `${d.totalVehicles} vehicles` : '—'} />}
              {!isServiceCenter && <DetailRow label="Vehicle Categories" value={Array.isArray(d.vehicleCategories) ? d.vehicleCategories.join(', ') : d.vehicleCategories} />}
              <DetailRow label="Website" value={d.website || d.companyWebsite || '—'} />
              <DetailRow label="Years in Business" value={d.yearsInBusiness || '—'} />
            </div>
          </div>

          {/* Documents */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Documents</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="GST Number" value={d.gstNumber} />
              <DetailRow label="PAN Number" value={d.panNumber} />
              <DetailRow label={isServiceCenter ? 'Trade License' : 'CIN / LLPIN'} value={isServiceCenter ? d.licenseNumber : d.cinNumber} />
            </div>
          </div>

          {/* Uploaded files list */}
          {resolvedDocs.length > 0 ? (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Uploaded Files</p>
              <div className="space-y-2">
                {resolvedDocs.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url || doc.fileUrl || '#'}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-red-300 hover:bg-red-50/40 transition-colors text-sm text-blue-600 font-medium"
                  >
                    <FileText size={15} className="text-red-500 shrink-0" />
                    {doc.name || doc.filename || doc.fileName || doc.title || doc.url}
                  </a>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-500">
              No uploaded files were found for this application.
            </div>
          )}

          {/* Submission date */}
          <p className="text-xs text-gray-400">
            Submitted: {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}
          </p>

          {/* Actions */}
          {isPending && (
            <div className="pt-3 border-t border-gray-100">
              {!showReject ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleApprove}
                    disabled={actLoading}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actLoading ? <Spinner size={16} /> : <CheckCircle size={16} />}
                    Approve
                  </button>
                  <button
                    onClick={() => setShowReject(true)}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <textarea
                    rows={3}
                    placeholder="State the reason for rejection…"
                    value={rejectReason}
                    onChange={e => setReason(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                  />
                  <div className="flex gap-3">
                    <button
                      onClick={handleReject}
                      disabled={actLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50"
                    >
                      {actLoading ? <Spinner size={16} /> : <XCircle size={16} />}
                      Confirm Reject
                    </button>
                    <button onClick={() => setShowReject(false)} className="flex-1 border border-gray-200 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

const VerificationHeader = ({ title, subtitle, activeView }) => {
  const tabs = [
    { key: 'service-centers', label: 'Service Centers', to: '/admin/verifications/service-centers' },
    { key: 'fleet-managers', label: 'Fleet Managers', to: '/admin/verifications/fleet-managers' },
  ];

  return (
    <div className="relative overflow-hidden rounded-4xl border border-red-100 bg-white/95 p-6 shadow-[0_30px_90px_rgba(220,38,38,0.08)] mb-8">
      <div className="absolute -right-10 top-8 h-40 w-40 rounded-full bg-red-100 opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute -left-10 bottom-8 h-32 w-32 rounded-full bg-red-200 opacity-25 blur-3xl pointer-events-none" />
      <div className="relative grid gap-5 lg:grid-cols-[1.6fr_1fr] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-700">Admin Verifications</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-950">{title}</h1>
          <p className="mt-2 max-w-2xl text-sm text-gray-600 leading-6">{subtitle}</p>
        </div>
        <div className="flex flex-wrap justify-start gap-3 sm:justify-end">
          {tabs.map(tab => (
            <Link
              key={tab.key}
              to={tab.to}
              className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${activeView === tab.key ? 'bg-red-600 text-white shadow-lg shadow-red-100/70 border-red-600' : 'bg-white text-gray-700 border-gray-200 hover:border-red-200 hover:text-red-700'}`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

const VerificationStats = ({ total, pending, approved, rejected }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
    <Card className="border-red-100 bg-red-50/70">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-red-700">Total requests</p>
      <p className="mt-4 text-3xl font-bold text-gray-950">{total}</p>
      <p className="mt-2 text-sm text-gray-600">All submissions across this verification flow.</p>
    </Card>
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Pending review</p>
      <p className="mt-4 text-3xl font-bold text-gray-900">{pending}</p>
      <p className="mt-2 text-sm text-gray-500">Action required from the admin team.</p>
    </Card>
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Approved</p>
      <p className="mt-4 text-3xl font-bold text-gray-900">{approved}</p>
      <p className="mt-2 text-sm text-gray-500">Verified accounts ready to activate.</p>
    </Card>
    <Card>
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gray-500">Rejected</p>
      <p className="mt-4 text-3xl font-bold text-gray-900">{rejected}</p>
      <p className="mt-2 text-sm text-gray-500">Applications declined after review.</p>
    </Card>
  </div>
);

/* ── Service Center Verifications ───────────────────────────── */
export const ServiceCenterVerifications = () => {
  const { data, total, page, setPage, filters, updateFilter, loading, error, reload } =
    useVerifications(fetchServiceCenterRequests, 'service-centers');
  const [selected, setSelected] = useState(null);

  const columns = [
    { key: 'centerName',  label: 'Center Name',   render: v => <span className="font-semibold text-gray-800">{v}</span> },
    { key: 'centerType',  label: 'Type' },
    { key: 'ownerName',   label: 'Owner' },
    { key: 'city',        label: 'City', render: (v, r) => `${v || ''}${r.state ? `, ${r.state}` : ''}` },
    { key: 'phone',       label: 'Phone' },
    { key: 'status',      label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'createdAt',   label: 'Submitted', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: '_id',         label: 'Action',   render: (_, row) => (
      <button
        onClick={e => { e.stopPropagation(); setSelected(row._id || row.id); }}
        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
      >
        <Eye size={13} /> Review
      </button>
    )},
  ];

  const pendingCount = data.filter(item => normalizeStatus(item.status) === 'pending').length;
  const approvedCount = data.filter(item => normalizeStatus(item.status) === 'approved').length;
  const rejectedCount = data.filter(item => normalizeStatus(item.status) === 'rejected').length;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute right-0 top-10 h-40 w-40 rounded-full bg-red-100 opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute left-0 bottom-14 h-32 w-32 rounded-full bg-red-200 opacity-30 blur-3xl" />

      <VerificationHeader
        title="Service Center Verification Requests"
        subtitle="Review service center applications quickly with clear status tracking and a clean dashboard view."
        activeView="service-centers"
      />

      <VerificationStats
        total={total}
        pending={pendingCount}
        approved={approvedCount}
        rejected={rejectedCount}
      />

      <Card className="overflow-hidden">
        <div className="bg-red-50/70 px-6 py-5 border-b border-red-100">
          <p className="text-sm font-semibold text-red-700">Filter and manage service center approvals</p>
          <p className="text-xs text-gray-500 mt-1">Use search, status filters, and row actions to speed up review cycles.</p>
        </div>

        <div className="p-6">
          <FilterBar
            filters={[
              { key: 'status', type: 'select', options: [
                { value: '', label: 'All Statuses' },
                { value: 'pending',  label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]},
              { key: 'search', type: 'text', placeholder: 'Search by name or city…' },
            ]}
            values={filters}
            onChange={updateFilter}
          />

          {error ? (
            <ErrorBlock message={error} onRetry={reload} />
          ) : (
            <>
              <Table
                columns={columns}
                data={data}
                loading={loading}
                onRowClick={row => setSelected(row._id || row.id)}
                emptyIcon={Building2}
                emptyTitle="No verification requests"
                emptySubtitle="Service center applications will appear here"
              />
              <Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
            </>
          )}
        </div>
      </Card>

      <VerificationDetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        type="service-centers"
        itemId={selected}
        onAction={reload}
      />
    </div>
  );
};

/* ── Fleet Manager Verifications ────────────────────────────── */
export const FleetManagerVerifications = () => {
  const { data, total, page, setPage, filters, updateFilter, loading, error, reload } =
    useVerifications(fetchFleetManagerRequests, 'fleet-managers');
  const [selected, setSelected] = useState(null);

  const columns = [
    { key: 'companyName',   label: 'Company', render: v => <span className="font-semibold text-gray-800">{v}</span> },
    { key: 'industryType',  label: 'Industry' },
    { key: 'managerName',   label: 'Manager' },
    { key: 'totalVehicles', label: 'Fleet Size', render: v => v ? `${v} vehicles` : '—' },
    { key: 'city',          label: 'City', render: (v, r) => `${v || ''}${r.state ? `, ${r.state}` : ''}` },
    { key: 'status',        label: 'Status', render: v => <StatusBadge status={v} /> },
    { key: 'createdAt',     label: 'Submitted', render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: '_id',           label: 'Action', render: (_, row) => (
      <button
        onClick={e => { e.stopPropagation(); setSelected(row._id || row.id); }}
        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
      >
        <Eye size={13} /> Review
      </button>
    )},
  ];

  const pendingCount = data.filter(item => normalizeStatus(item.status) === 'pending').length;
  const approvedCount = data.filter(item => normalizeStatus(item.status) === 'approved').length;
  const rejectedCount = data.filter(item => normalizeStatus(item.status) === 'rejected').length;

  return (
    <div className="relative">
      <div className="pointer-events-none absolute right-0 top-10 h-40 w-40 rounded-full bg-red-100 opacity-40 blur-3xl" />
      <div className="pointer-events-none absolute left-0 bottom-14 h-32 w-32 rounded-full bg-red-200 opacity-30 blur-3xl" />

      <VerificationHeader
        title="Fleet Manager Verification Requests"
        subtitle="See all fleet manager applications in one elegant workspace and approve accounts with confidence."
        activeView="fleet-managers"
      />

      <VerificationStats
        total={total}
        pending={pendingCount}
        approved={approvedCount}
        rejected={rejectedCount}
      />

      <Card className="overflow-hidden">
        <div className="bg-red-50/70 px-6 py-5 border-b border-red-100">
          <p className="text-sm font-semibold text-red-700">Filter fleet manager requests</p>
          <p className="text-xs text-gray-500 mt-1">Use the filters below to narrow your review list and keep approvals moving.</p>
        </div>

        <div className="p-6">
          <FilterBar
            filters={[
              { key: 'status', type: 'select', options: [
                { value: '', label: 'All Statuses' },
                { value: 'pending',  label: 'Pending' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ]},
              { key: 'industry', type: 'select', options: [
                { value: '', label: 'All Industries' },
                { value: 'Logistics & Delivery',  label: 'Logistics' },
                { value: 'Cab Aggregator / Taxi',  label: 'Cab / Taxi' },
                { value: 'Corporate Employee Transport', label: 'Corporate' },
                { value: 'Tourism & Travel',       label: 'Tourism' },
                { value: 'Healthcare / Ambulance', label: 'Healthcare' },
              ]},
              { key: 'search', type: 'text', placeholder: 'Search company or manager…' },
            ]}
            values={filters}
            onChange={updateFilter}
          />

          {error ? (
            <ErrorBlock message={error} onRetry={reload} />
          ) : (
            <>
              <Table
                columns={columns}
                data={data}
                loading={loading}
                onRowClick={row => setSelected(row._id || row.id)}
                emptyIcon={Users}
                emptyTitle="No fleet verification requests"
                emptySubtitle="Fleet manager applications will appear here"
              />
              <Pagination page={page} totalPages={Math.ceil(total / 10)} onPageChange={setPage} />
            </>
          )}
        </div>
      </Card>

      <VerificationDetailModal
        open={!!selected}
        onClose={() => setSelected(null)}
        type="fleet-managers"
        itemId={selected}
        onAction={reload}
      />
    </div>
  );
};
