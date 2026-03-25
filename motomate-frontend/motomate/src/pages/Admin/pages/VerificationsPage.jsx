import { useState, useEffect, useCallback } from 'react';
import { Building2, Users, Eye, CheckCircle, XCircle, FileText, Clock } from 'lucide-react';
import {
  fetchServiceCenterRequests,
  fetchFleetManagerRequests,
  approveVerification,
  rejectVerification,
  fetchVerificationDetail,
} from '../api';
import {
  SectionHeader, Table, Pagination, StatusBadge,
  FilterBar, Modal, PageLoader, ErrorBlock, DetailRow, Spinner, Card
} from '../components/UI';

/* ── Shared verification logic ──────────────────────────────── */
const useVerifications = (fetchFn, type) => {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ status: '', search: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const limit = 10;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchFn({ page, limit, ...filters });
      setData(res.data || res.items || res.verifications || []);
      setTotal(res.total || 0);
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
      .then(d => setDetail(d))
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
          {d.documents && d.documents.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Uploaded Files</p>
              <div className="space-y-2">
                {d.documents.map((doc, i) => (
                  <a
                    key={i}
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-3 rounded-xl border border-gray-100 hover:border-red-300 hover:bg-red-50/40 transition-colors text-sm text-blue-600 font-medium"
                  >
                    <FileText size={15} className="text-red-500 shrink-0" />
                    {doc.name || doc.url}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Submission date */}
          <p className="text-xs text-gray-400">
            Submitted: {d.createdAt ? new Date(d.createdAt).toLocaleString() : '—'}
          </p>

          {/* Actions */}
          {d.status === 'pending' && (
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

  return (
    <div>
      <SectionHeader
        title="Service Center Verifications"
        subtitle={`${total} total requests`}
        actions={
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Building2 size={15} className="text-red-500" />
            Account Verifications
          </div>
        }
      />

      <Card>
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

  return (
    <div>
      <SectionHeader
        title="Fleet Manager Verifications"
        subtitle={`${total} total requests`}
        actions={
          <div className="flex items-center gap-2 text-xs font-medium text-gray-500">
            <Users size={15} className="text-red-500" />
            Account Verifications
          </div>
        }
      />

      <Card>
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
