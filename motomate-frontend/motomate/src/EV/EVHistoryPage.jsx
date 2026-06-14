import React, { useEffect, useState } from 'react';
import { MapPin, Clock3, Zap } from 'lucide-react';
import { EVCard, EVHeading, EVButton, EVLoader, EVStatusBadge } from './EVDesignSystem';
import { EVCustomerSidebar } from './components/EVSidebar';
import { evApi } from './api/evApi';

export default function EVHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const data = await evApi.getServiceHistory();
        setHistory(data);
        setError(null);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
    // Poll so status updates made by the EV workshop reflect here without a manual refresh
    const interval = setInterval(loadHistory, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="ev-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
        <EVCustomerSidebar />
      </div>

      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <EVHeading size="xl" sub="Review all of your EV service history">EV Service History</EVHeading>
        </div>
        {loading ? (
          <EVLoader text="Loading service history…" />
        ) : error ? (
          <EVCard>
            <p style={{ color: '#F87171' }}>{error}</p>
          </EVCard>
        ) : history.length === 0 ? (
          <EVCard style={{ textAlign: 'center', padding: '60px 20px' }}>
            <Zap size={40} color="#334155" />
            <p style={{ color: '#94A3B8', marginTop: '12px', fontSize: '14px' }}>No EV service history yet.</p>
            <p style={{ color: '#64748B', fontSize: '13px', marginTop: '8px' }}>Book your first EV service to see requests appear here.</p>
            <EVButton onClick={() => window.location.assign('/dashboard/customer/ev/book-service')} style={{ marginTop: '18px' }}>
              Book EV Service
            </EVButton>
          </EVCard>
        ) : (
          <div style={{ display: 'grid', gap: '18px' }}>
            {history.map(request => (
              <EVCard key={request.id} hover>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                  <div>
                    <p className="ev-heading" style={{ margin: 0, color: '#F8FAFC', fontSize: '16px' }}>{request.serviceType?.replace(/_/g, ' ')}</p>
                    <p style={{ margin: '6px 0 0', color: '#94A3B8', fontSize: '13px' }}>{request.selectedWorkshopName || 'Unknown workshop'}</p>
                  </div>
                  <EVStatusBadge status={request.status} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
                  <div>
                    <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '6px' }}>VEHICLE</p>
                    <p style={{ color: '#CBD5E1', margin: 0, fontSize: '13px' }}>{request.vehicleMake} {request.vehicleModel}</p>
                  </div>
                  <div>
                    <p style={{ color: '#64748B', fontSize: '11px', marginBottom: '6px' }}>ADDRESS</p>
                    <p style={{ color: '#CBD5E1', margin: 0, fontSize: '13px' }}>{request.customerAddress || 'Not provided'}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginTop: '16px', flexWrap: 'wrap' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '13px' }}>
                    <MapPin size={14} /> {request.distanceKm != null ? `${request.distanceKm.toFixed(1)} km away` : 'Distance unknown'}
                  </span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#94A3B8', fontSize: '13px' }}>
                    <Clock3 size={14} /> {request.estimatedArrivalMinutes ? `ETA ${request.estimatedArrivalMinutes} mins` : 'ETA pending'}
                  </span>
                </div>

                {request.review && (
                  <div style={{ marginTop: '16px', background: 'rgba(0,212,170,0.05)', borderRadius: '12px', padding: '14px' }}>
                    <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>Customer review</p>
                    <p style={{ color: '#CBD5E1', margin: '6px 0 0', fontSize: '13px' }}>{request.review}</p>
                  </div>
                )}
              </EVCard>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
