import React, { useEffect, useState } from 'react';
import { EVCard, EVHeading, EVButton, EVLoader, EVStatusBadge } from './EVDesignSystem';
import { EVCustomerSidebar } from './components/EVSidebar';
import { evApi } from './api/evApi';

const STATUS_LABELS = {
  REQUESTED: 'Requested',
  ASSIGNED: 'Assigned',
  ACCEPTED: 'Accepted',
  ON_THE_WAY: 'On the Way',
  SERVICE_STARTED: 'Service Started',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export default function EVTrackingPage() {
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadCurrent = async () => {
      try {
        const history = await evApi.getServiceHistory();
        const current = history.find(item => !['COMPLETED', 'CANCELLED'].includes(item.status)) || history[0];
        setRequest(current || null);
        setError(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadCurrent();
    // Poll so status updates made by the EV workshop reflect here without a manual refresh
    const interval = setInterval(loadCurrent, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ev-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
        <EVCustomerSidebar />
      </div>

      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <EVHeading size="xl" sub="Track the current status of your EV service">Live EV Tracking</EVHeading>
        </div>

        {loading ? (
          <EVLoader text="Checking your latest service request…" />
        ) : error ? (
          <EVCard>
            <p style={{ color: '#F87171' }}>{error}</p>
          </EVCard>
        ) : !request ? (
          <EVCard style={{ textAlign: 'center', padding: '60px 20px' }}>
            <p style={{ color: '#94A3B8', fontSize: '14px', margin: 0 }}>No active EV service request found.</p>
            <EVButton onClick={() => window.location.assign('/dashboard/customer/ev/book-service')} style={{ marginTop: '18px' }}>
              Book a Service
            </EVButton>
          </EVCard>
        ) : (
          <div style={{ display: 'grid', gap: '18px' }}>
            <EVCard>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <p className="ev-heading" style={{ margin: 0, fontSize: '18px' }}>{request.serviceType?.replace(/_/g, ' ')}</p>
                  <p style={{ margin: '8px 0 0', color: '#94A3B8', fontSize: '13px' }}>Workshop: {request.selectedWorkshopName}</p>
                </div>
                <EVStatusBadge status={request.status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginTop: '20px' }}>
                <div>
                  <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '6px' }}>SERVICE REQUEST</p>
                  <p style={{ color: '#CBD5E1', margin: 0, fontSize: '13px' }}>{request.serviceNames?.join(', ') || request.serviceType?.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '6px' }}>VEHICLE</p>
                  <p style={{ color: '#CBD5E1', margin: 0, fontSize: '13px' }}>{request.vehicleMake} {request.vehicleModel}</p>
                </div>
                <div>
                  <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '6px' }}>SERVICE ADDRESS</p>
                  <p style={{ color: '#CBD5E1', margin: 0, fontSize: '13px' }}>{request.customerAddress || 'Not provided'}</p>
                </div>
                <div>
                  <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '6px' }}>ETA</p>
                  <p style={{ color: '#CBD5E1', margin: 0, fontSize: '13px' }}>{request.estimatedArrivalMinutes ? `~${request.estimatedArrivalMinutes} mins` : 'Pending'}</p>
                </div>
              </div>
            </EVCard>

            <EVCard>
              <p className="ev-heading" style={{ margin: '0 0 12px', fontSize: '16px' }}>Live progress</p>
              <div style={{ display: 'grid', gap: '10px' }}>
                {['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'SERVICE_STARTED', 'COMPLETED'].map(step => {
                  const completed = ['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'SERVICE_STARTED', 'COMPLETED']
                    .indexOf(step) <= ['REQUESTED', 'ASSIGNED', 'ACCEPTED', 'ON_THE_WAY', 'SERVICE_STARTED', 'COMPLETED'].indexOf(request.status || 'REQUESTED');
                  return (
                    <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: completed ? '#00D4AA' : '#475569' }} />
                      <span style={{ color: completed ? '#CBD5E1' : '#64748B', fontSize: '13px' }}>{STATUS_LABELS[step] || step.replace(/_/g, ' ')}</span>
                    </div>
                  );
                })}
              </div>
            </EVCard>

            <EVCard>
              <p className="ev-heading" style={{ margin: '0 0 12px', fontSize: '16px' }}>Next steps</p>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: '13px', lineHeight: 1.7 }}>
                Our EV technician will arrive at the selected location and begin the requested service. You can view the booking details and history from the EV History page.
              </p>
              <div style={{ marginTop: '18px' }}>
                <EVButton onClick={() => window.location.assign('/dashboard/customer/ev/history')}>
                  View Service History
                </EVButton>
              </div>
            </EVCard>
          </div>
        )}
      </main>
    </div>
  );
}
