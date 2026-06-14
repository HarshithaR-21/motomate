import React, { useState } from 'react';
import { AlertTriangle, MapPin, MessageCircle, ShieldAlert } from 'lucide-react';
import { EVCard, EVHeading, EVButton, EVInput, EVSelect, EVLoader, EVToast } from './EVDesignSystem';
import { EVCustomerSidebar } from './components/EVSidebar';
import { evApi } from './api/evApi';

const SOS_OPTIONS = [
  { value: 'BATTERY_DEAD', label: 'Battery Dead' },
  { value: 'CHARGING_ISSUE', label: 'Charging Issue' },
  { value: 'FLAT_TIRE', label: 'Flat Tire' },
  { value: 'MECHANICAL_FAILURE', label: 'Mechanical Failure' },
  { value: 'OTHER', label: 'Other' },
];

export default function EVSOSPage() {
  const [issueType, setIssueType] = useState('BATTERY_DEAD');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [response, setResponse] = useState(null);
  const [toast, setToast] = useState(null);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        type: issueType,
        description: message,
        requestedAt: new Date().toISOString(),
      };
      const data = await evApi.sos(payload);
      setResponse(data);
      setToast({ message: 'SOS request sent. Help is on the way.', type: 'success' });
    } catch (e) {
      setToast({ message: e.message || 'Failed to send SOS', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3800);
    }
  };

  return (
    <div className="ev-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
        <EVCustomerSidebar />
      </div>

      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <EVHeading size="xl" sub="Request emergency EV assistance instantly">EV SOS</EVHeading>
        </div>

        <EVCard style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gap: '18px' }}>
            <p style={{ color: '#F87171', fontSize: '13px', margin: 0 }}>If you are in immediate danger, please call local emergency services first.</p>
            <EVSelect
              label="Problem type"
              value={issueType}
              onChange={e => setIssueType(e.target.value)}
              options={SOS_OPTIONS}
            />
            <EVInput
              label="What happened?"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Describe your situation so we can respond faster"
            />
            <EVButton
              icon={ShieldAlert}
              danger
              full
              onClick={handleSubmit}
              disabled={submitting || !message}
            >
              {submitting ? 'Sending SOS…' : 'Send EV SOS'}
            </EVButton>
          </div>
        </EVCard>

        {response && (
          <EVCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'rgba(248,113,113,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={22} color="#F87171" />
              </div>
              <div>
                <p className="ev-heading" style={{ margin: 0, fontSize: '16px' }}>SOS request received</p>
                <p style={{ margin: '6px 0 0', color: '#94A3B8', fontSize: '13px' }}>A responder will be assigned to your location immediately.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1', fontSize: '13px' }}>
                <span>Request ID</span>
                <span>{response.id || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#CBD5E1', fontSize: '13px' }}>
                <span>Status</span>
                <span>{response.status || 'RECEIVED'}</span>
              </div>
            </div>
          </EVCard>
        )}

        {toast && <EVToast message={toast.message} type={toast.type} />}
      </main>
    </div>
  );
}
