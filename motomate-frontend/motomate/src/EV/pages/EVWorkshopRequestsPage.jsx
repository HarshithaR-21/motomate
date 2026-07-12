import React, { useEffect, useState } from 'react';
import { MapPin, Clock3 } from 'lucide-react';
import { EVCard, EVHeading, EVButton, EVLoader, EVError, EVStatusBadge, EVSelect, EVToast } from '../EVDesignSystem';
import { EVWorkshopSidebar } from '../components/EVSidebar';
import { evWorkshopApi } from '../api/evApi';

const STATUS_OPTIONS = [
  { value: 'REQUESTED', label: 'Requested' },
  { value: 'ASSIGNED', label: 'Assigned' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'ON_THE_WAY', label: 'On the Way' },
  { value: 'SERVICE_STARTED', label: 'Service Started' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const getCachedWorkshopId = () => {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return (user && (user.workshopId || user.id)) || localStorage.getItem('evWorkshopId');
  } catch {
    return localStorage.getItem('evWorkshopId');
  }
};

export default function EVWorkshopRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [assigning, setAssigning] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [workshopId, setWorkshopId] = useState(getCachedWorkshopId());

  const load = async () => {
    let id = workshopId;
    if (!id) {
      try {
        const workshop = await evWorkshopApi.getMyWorkshop();
        id = workshop.id;
        setWorkshopId(id);
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          localStorage.setItem('user', JSON.stringify({ ...user, workshopId: id }));
        } catch {}
      } catch (e) {
        setError('No EV workshop is linked to this account.');
        setLoading(false);
        return;
      }
    }
    try {
      const [reqs, workerList] = await Promise.all([
        evWorkshopApi.getRequests(id),
        evWorkshopApi.getWorkers(id).catch(() => []),
      ]);
      setRequests(reqs);
      setWorkers(workerList);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (requestId, status) => {
    setUpdating(requestId);
    try {
      await evWorkshopApi.updateStatus(requestId, status);
      setToast({ msg: 'Status updated', type: 'success' });
      await load();
    } catch (e) {
      setToast({ msg: e.message || 'Failed to update status', type: 'error' });
    } finally {
      setUpdating(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleAssignWorker = async (requestId, workerId) => {
    if (!workerId) return;
    setAssigning(requestId);
    try {
      await evWorkshopApi.assignWorker(requestId, workerId);
      setToast({ msg: 'Technician assigned', type: 'success' });
      await load();
    } catch (e) {
      setToast({ msg: e.message || 'Failed to assign technician', type: 'error' });
    } finally {
      setAssigning(null);
      setTimeout(() => setToast(null), 3000);
    }
  };

  return (
    <div className="ev-root" style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
        <EVWorkshopSidebar />
      </div>
      {sidebarOpen && <EVWorkshopSidebar mobile onClose={() => setSidebarOpen(false)} />}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {window.innerWidth < 768 && (
          <EVMobileHeader title="EV Requests" onMenuClick={() => setSidebarOpen(true)} />
        )}
        <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '24px' }}>
            <EVHeading size="xl" sub="Service requests booked by customers for your center">EV Service Requests</EVHeading>
          </div>

          {toast && (
            <div style={{ marginBottom: '16px' }}>
              <EVToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
            </div>
          )}

          {loading ? (
            <EVLoader text="Loading requests…" />
          ) : error ? (
            <EVError message={error} onRetry={() => { setLoading(true); load(); }} />
          ) : requests.length === 0 ? (
            <EVCard style={{ textAlign: 'center', padding: '60px 20px' }}>
              <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>No EV service requests yet.</p>
            </EVCard>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {requests.map(r => (
                <EVCard key={r.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                    <div>
                      <p className="ev-heading" style={{ margin: 0, fontSize: '16px' }}>
                        {r.serviceType?.replace(/_/g, ' ')}
                      </p>
                      <p style={{ margin: '6px 0 0', color: '#94A3B8', fontSize: '13px' }}>
                        {r.vehicleMake} {r.vehicleModel} · {r.vehicleNumber}
                      </p>
                    </div>
                    <EVStatusBadge status={r.status} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '6px' }}>SERVICE REQUESTED</p>
                      <p style={{ color: '#CBD5E1', margin: 0, fontSize: '13px' }}>
                        {r.serviceNames?.join(', ') || r.serviceType?.replace(/_/g, ' ')}
                      </p>
                    </div>
                    <div>
                      <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '6px' }}>DESCRIPTION</p>
                      <p style={{ color: '#CBD5E1', margin: 0, fontSize: '13px' }}>{r.description || '—'}</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '14px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '13px' }}>
                      <MapPin size={14} /> {r.customerAddress || 'No address provided'}
                      {r.distanceKm != null ? ` · ${r.distanceKm.toFixed(1)} km away` : ''}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '13px' }}>
                      <Clock3 size={14} /> {r.estimatedArrivalMinutes ? `ETA ${r.estimatedArrivalMinutes} mins` : 'ETA pending'}
                    </span>
                  </div>

                  {['COMPLETED', 'CANCELLED'].includes(r.status) ? (
                    <div style={{ marginTop: '16px' }}>
                      <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>
                        {r.status === 'CANCELLED' ? `Cancelled${r.cancellationReason ? `: ${r.cancellationReason}` : ''}` : 'Service completed'}
                      </p>
                    </div>
                  ) : (
                    <div style={{ marginTop: '16px', display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: '200px' }}>
                        <EVSelect
                          label="Assign technician"
                          value={r.assignedWorkerId || ''}
                          onChange={e => handleAssignWorker(r.id, e.target.value)}
                          options={[
                            { value: '', label: r.assignedWorkerName ? r.assignedWorkerName : 'Select technician' },
                            ...workers.map(w => ({ value: w.id, label: `${w.name}${w.specialization ? ` (${w.specialization.replace(/_/g, ' ')})` : ''}${w.availabilityStatus !== 'AVAILABLE' ? ` — ${w.availabilityStatus}` : ''}` })),
                          ]}
                        />
                      </div>
                      {assigning === r.id && <span style={{ color: '#94A3B8', fontSize: '12px' }}>Assigning…</span>}
                      <div style={{ minWidth: '200px' }}>
                        <EVSelect
                          label="Update status"
                          value={r.status}
                          onChange={e => handleStatusChange(r.id, e.target.value)}
                          options={STATUS_OPTIONS}
                        />
                      </div>
                      {updating === r.id && <span style={{ color: '#94A3B8', fontSize: '12px' }}>Updating…</span>}
                      <EVButton
                        size="sm"
                        danger
                        disabled={updating === r.id}
                        onClick={() => handleStatusChange(r.id, 'CANCELLED')}
                      >
                        Cancel Request
                      </EVButton>
                    </div>
                  )}
                </EVCard>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
