import React, { useEffect, useState } from 'react';
import { Zap, MapPin, Battery, Car, CheckCircle2 } from 'lucide-react';
import { EVCard, EVHeading, EVButton, EVInput, EVSelect, EVLoader, EVConnectorChip, EVToast } from './EVDesignSystem';
import { EVCustomerSidebar } from './components/EVSidebar';
import { evApi } from './api/evApi';

const VEHICLE_OPTIONS = [];

export default function EVChargingPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    vehicleId: '',
    currentBatteryPercentage: '',
    targetBatteryPercentage: '',
    customerAddress: '',
    customerLatitude: '',
    customerLongitude: '',
  });

  useEffect(() => {
    const loadVehicles = async () => {
      setLoading(true);
      try {
        const data = await evApi.getMyVehicles();
        setVehicles(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadVehicles();
  }, []);

  const selectedVehicle = vehicles.find(v => v.id === form.vehicleId);

  const handleSubmit = async () => {
    if (!form.vehicleId) {
      setToast({ message: 'Please select your vehicle.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const currentPct = parseFloat(form.currentBatteryPercentage);
    if (!Number.isFinite(currentPct) || currentPct < 0 || currentPct > 100) {
      setToast({ message: 'Please enter the current battery % (0-100).', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!form.customerLatitude || !form.customerLongitude) {
      setToast({ message: 'Please detect or enter your location.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        vehicleId: form.vehicleId,
        vehicleNumber: selectedVehicle?.vehicleNumber,
        chargingPortType: selectedVehicle?.chargingPortType,
        currentBatteryPercentage: currentPct,
        targetBatteryPercentage: parseFloat(form.targetBatteryPercentage),
        customerLatitude: parseFloat(form.customerLatitude),
        customerLongitude: parseFloat(form.customerLongitude),
        customerAddress: form.customerAddress,
        emergencyFlag: false,
      };
      const data = await evApi.requestCharging(payload);
      setResult(data);
      setToast({ message: 'Mobile charging request created!', type: 'success' });
    } catch (e) {
      setToast({ message: e.message || 'Could not request charging', type: 'error' });
    } finally {
      setSubmitting(false);
      setTimeout(() => setToast(null), 3800);
    }
  };

  const updateField = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

  const detectLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        updateField('customerLatitude', pos.coords.latitude.toFixed(6));
        updateField('customerLongitude', pos.coords.longitude.toFixed(6));
        updateField('customerAddress', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setToast({ message: 'Location detected', type: 'success' });
        setTimeout(() => setToast(null), 3000);
      },
      () => setToast({ message: 'Unable to detect location', type: 'error' })
    );
  };

  return (
    <div className="ev-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
        <EVCustomerSidebar />
      </div>

      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <EVHeading size="xl" sub="Order mobile charging for your EV">Mobile EV Charging</EVHeading>
        </div>
        <EVCard style={{ marginBottom: '24px' }}>
          <div style={{ display: 'grid', gap: '18px' }}>
            {loading ? <EVLoader text="Loading your EVs…" /> : (
              <>
                <EVSelect
                  label="Select vehicle"
                  value={form.vehicleId}
                  onChange={e => updateField('vehicleId', e.target.value)}
                  options={vehicles.map(v => ({ value: v.id, label: `${v.manufacturer} ${v.model} — ${v.vehicleNumber}` }))}
                  placeholder="Choose your EV"
                  required
                />
                {selectedVehicle && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <EVConnectorChip type={selectedVehicle.chargingPortType} />
                    <EVInput
                      label="Current battery %"
                      type="number"
                      min={0}
                      max={100}
                      value={form.currentBatteryPercentage}
                      onChange={e => updateField('currentBatteryPercentage', e.target.value)}
                      placeholder="e.g. 20"
                    />
                  </div>
                )}
                <EVInput
                  label="Target battery %"
                  type="number"
                  value={form.targetBatteryPercentage}
                  onChange={e => updateField('targetBatteryPercentage', e.target.value)}
                  placeholder="e.g. 80"
                />
                <EVButton icon={MapPin} variant="outline" full onClick={detectLocation}>
                  Detect my location
                </EVButton>
                <EVInput
                  label="Service address"
                  value={form.customerAddress}
                  onChange={e => updateField('customerAddress', e.target.value)}
                  placeholder="Flat, street, city, state"
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <EVInput
                    label="Latitude"
                    type="number"
                    value={form.customerLatitude}
                    onChange={e => updateField('customerLatitude', e.target.value)}
                    placeholder="12.9716"
                  />
                  <EVInput
                    label="Longitude"
                    type="number"
                    value={form.customerLongitude}
                    onChange={e => updateField('customerLongitude', e.target.value)}
                    placeholder="77.5946"
                  />
                </div>
                <EVButton onClick={handleSubmit} disabled={submitting || !form.vehicleId || !form.targetBatteryPercentage || !form.customerLatitude || !form.customerLongitude} icon={Zap}>
                  {submitting ? 'Requesting…' : 'Request Charging'}
                </EVButton>
              </>
            )}
          </div>
        </EVCard>

        {result && (
          <EVCard>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0,212,170,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle2 size={20} color="#00D4AA" />
              </div>
              <div>
                <p className="ev-heading" style={{ margin: 0, fontSize: '16px' }}>Charging request created</p>
                <p style={{ margin: '6px 0 0', color: '#94A3B8', fontSize: '13px' }}>Our mobile charger is assigned and on the way.</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '12px' }}>
              {[
                { label: 'Request ID', value: result.id },
                { label: 'Status', value: result.status },
                { label: 'ETA', value: result.estimatedArrivalMinutes ? `~${result.estimatedArrivalMinutes} mins` : 'Pending' },
                { label: 'Driver', value: result.assignedDriverName },
              ].map(item => (
                <div key={item.label} style={{ background: '#0F172A', borderRadius: '12px', padding: '12px' }}>
                  <p style={{ color: '#64748B', fontSize: '11px', margin: 0 }}>{item.label}</p>
                  <p style={{ color: '#CBD5E1', margin: '6px 0 0', fontSize: '13px' }}>{item.value || '—'}</p>
                </div>
              ))}
            </div>
          </EVCard>
        )}

        {toast && <EVToast message={toast.message} type={toast.type} />}
      </main>
    </div>
  );
}
