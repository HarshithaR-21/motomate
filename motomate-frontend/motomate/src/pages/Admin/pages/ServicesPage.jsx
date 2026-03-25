import { useState, useEffect, useCallback } from 'react';
import { Wrench, Eye, MapPin, User, Car, Clock } from 'lucide-react';
import { fetchOngoingServices, fetchServiceDetail } from '../api';
import {
  SectionHeader, Table, Pagination, StatusBadge,
  FilterBar, Modal, PageLoader, ErrorBlock, DetailRow, Card
} from '../components/UI';

const OngoingServicesPage = () => {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [filters, setFilters]   = useState({ status: '', serviceType: '', search: '' });
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [selected, setSelected] = useState(null);
  const limit = 12;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchOngoingServices({ page, limit, ...filters });
      setData(res.data || res.services || []);
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
    { key: 'bookingId',   label: 'Booking ID', render: v => <span className="font-mono text-xs text-gray-500">{v || '—'}</span> },
    { key: 'serviceType', label: 'Service',    render: v => <span className="font-semibold text-gray-800">{v}</span> },
    { key: 'customerName',label: 'Customer',   render: (v, r) => (
      <div>
        <p className="text-sm font-medium text-gray-800">{v}</p>
        <p className="text-xs text-gray-400">{r.customerPhone || ''}</p>
      </div>
    )},
    { key: 'workerName',  label: 'Assigned Worker', render: (v, r) => (
      <div>
        <p className="text-sm font-medium text-gray-800">{v || '—'}</p>
        <p className="text-xs text-gray-400">{r.workerPhone || ''}</p>
      </div>
    )},
    { key: 'vehicleNumber', label: 'Vehicle',  render: (v, r) => (
      <span className="text-sm">{r.vehicleMake ? `${r.vehicleMake} ${r.vehicleModel || ''}` : v || '—'}</span>
    )},
    { key: 'location',    label: 'Location',   render: v => v ? <span className="text-xs text-gray-600 flex items-center gap-1"><MapPin size={11} />{v}</span> : '—' },
    { key: 'status',      label: 'Status',     render: v => <StatusBadge status={v} /> },
    { key: 'scheduledAt', label: 'Scheduled',  render: v => v ? new Date(v).toLocaleDateString() : '—' },
    { key: '_id',         label: 'Detail',     render: (_, row) => (
      <button
        onClick={e => { e.stopPropagation(); setSelected(row._id || row.id); }}
        className="flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:underline"
      >
        <Eye size={13} /> View
      </button>
    )},
  ];

  return (
    <div>
      <SectionHeader
        title="Ongoing Services"
        subtitle={`${total} total service records`}
      />

      <Card>
        <FilterBar
          filters={[
            { key: 'status', type: 'select', options: [
              { value: '', label: 'All Statuses' },
              { value: 'ongoing',   label: 'Ongoing' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]},
            { key: 'serviceType', type: 'select', options: [
              { value: '', label: 'All Service Types' },
              { value: 'General Servicing', label: 'General Servicing' },
              { value: 'Oil Change',         label: 'Oil Change' },
              { value: 'Tyre Replacement',   label: 'Tyre Replacement' },
              { value: 'Battery Service',    label: 'Battery Service' },
              { value: 'Brake Repair',       label: 'Brake Repair' },
              { value: 'Emergency SOS',      label: 'Emergency SOS' },
              { value: 'EV Servicing',       label: 'EV Servicing' },
            ]},
            { key: 'search', type: 'text', placeholder: 'Search customer or worker…' },
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
              onRowClick={row => setSelected(row._id || row.id)}
              emptyIcon={Wrench}
              emptyTitle="No services found"
              emptySubtitle="Active and completed service bookings will appear here"
            />
            <Pagination page={page} totalPages={Math.ceil(total / limit)} onPageChange={setPage} />
          </>
        )}
      </Card>

      <ServiceDetailModal
        open={!!selected}
        serviceId={selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
};

/* ── Service Detail Modal ────────────────────────────────────── */
const ServiceDetailModal = ({ open, serviceId, onClose }) => {
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !serviceId) return;
    setDetail(null);
    setLoading(true);
    fetchServiceDetail(serviceId)
      .then(d => setDetail(d))
      .catch(e => setDetail({ error: e.message }))
      .finally(() => setLoading(false));
  }, [open, serviceId]);

  const d = detail || {};

  return (
    <Modal open={open} onClose={onClose} title="Service Details" maxWidth="max-w-xl">
      {loading ? <PageLoader /> : detail?.error ? (
        <p className="text-red-500 text-sm">{detail.error}</p>
      ) : (
        <div className="space-y-5">
          {/* Status banner */}
          <div className="flex items-center gap-4 p-4 bg-indigo-50 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
              <Wrench size={22} className="text-indigo-600" />
            </div>
            <div>
              <p className="font-bold text-gray-900">{d.serviceType}</p>
              <p className="text-xs text-gray-500 font-mono mt-0.5">{d.bookingId}</p>
            </div>
            <div className="ml-auto"><StatusBadge status={d.status} /></div>
          </div>

          {/* Customer */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Customer</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="Name"    value={d.customerName} />
              <DetailRow label="Phone"   value={d.customerPhone} />
              <DetailRow label="Email"   value={d.customerEmail} />
              <DetailRow label="Address" value={d.location} />
            </div>
          </div>

          {/* Vehicle */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Vehicle</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="Make / Model" value={[d.vehicleMake, d.vehicleModel].filter(Boolean).join(' ') || '—'} />
              <DetailRow label="Reg. Number"  value={d.vehicleNumber} />
              <DetailRow label="Vehicle Type" value={d.vehicleType} />
              <DetailRow label="Year"         value={d.vehicleYear} />
            </div>
          </div>

          {/* Worker */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Assigned Worker</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="Name"         value={d.workerName} />
              <DetailRow label="Phone"        value={d.workerPhone} />
              <DetailRow label="Service Center" value={d.serviceCenterName} />
            </div>
          </div>

          {/* Timing & Cost */}
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Booking Info</p>
            <div className="rounded-xl border border-gray-100 overflow-hidden">
              <DetailRow label="Scheduled At" value={d.scheduledAt ? new Date(d.scheduledAt).toLocaleString() : '—'} />
              <DetailRow label="Started At"   value={d.startedAt ? new Date(d.startedAt).toLocaleString() : '—'} />
              <DetailRow label="Completed At" value={d.completedAt ? new Date(d.completedAt).toLocaleString() : '—'} />
              <DetailRow label="Amount"       value={d.amount ? `₹${d.amount.toLocaleString()}` : '—'} />
              <DetailRow label="Payment"      value={d.paymentStatus} />
            </div>
          </div>

          {/* Notes */}
          {d.notes && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Notes</p>
              <p className="text-sm text-gray-700 p-3 bg-gray-50 rounded-xl">{d.notes}</p>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
};

export default OngoingServicesPage;
