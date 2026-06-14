import React, { useState, useEffect } from 'react';
import { Car, Zap, Battery, Plug, Gauge, ChevronDown } from 'lucide-react';
import { EVCard, EVHeading, EVButton, EVInput, EVSelect, EVLoader, EVStatusBadge, EVConnectorChip, EVPage } from './EVDesignSystem';
import { EVCustomerSidebar } from './components/EVSidebar';
import { evApi } from './api/evApi';

const MANUFACTURERS = ['Tata', 'Mahindra', 'Ather', 'Ola Electric', 'TVS', 'Hero Electric', 'MG', 'Hyundai', 'Kia', 'BYD', 'BMW', 'Mercedes-Benz', 'Audi', 'Volvo', 'Porsche'].map(m => ({ value: m, label: m }));
const PORTS = ['CCS', 'CCS2', 'CHAdeMO', 'Type2', 'GBT'].map(p => ({ value: p, label: p }));
const YEARS = Array.from({ length: 10 }, (_, i) => { const y = new Date().getFullYear() - i; return { value: y, label: String(y) }; });

export default function EVVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [form, setForm] = useState({
    vehicleNumber: '', manufacturer: '', model: '', color: '',
    yearOfManufacture: new Date().getFullYear(),
    batteryCapacityKwh: '',
    chargingPortType: '', vehicleRangeKm: '', fastChargingSupported: false,
  });

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    setLoading(true);
    try { setVehicles(await evApi.getMyVehicles()); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    // Validate numeric inputs to avoid sending NaN -> JSON null to backend
    const VEHICLE_NUMBER_REGEX = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/i;
    const battery = parseFloat(form.batteryCapacityKwh);
    const rangeKm = parseFloat(form.vehicleRangeKm);
    const year = parseInt(form.yearOfManufacture, 10);

    // Basic validations
    if (!form.vehicleNumber || !form.vehicleNumber.trim()) {
      setToast({ msg: 'Vehicle number is required.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const cleanNum = form.vehicleNumber.replace(/[-\s]/g, '').toUpperCase();
    if (!VEHICLE_NUMBER_REGEX.test(cleanNum)) {
      setToast({ msg: 'Vehicle number format invalid. Use KA01AB1234.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!form.manufacturer) {
      setToast({ msg: 'Please select manufacturer.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!form.model) {
      setToast({ msg: 'Please enter model.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    if (!isFinite(battery)) {
      setToast({ msg: 'Please enter a valid battery capacity (kWh).', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!isFinite(rangeKm)) {
      setToast({ msg: 'Please enter a valid vehicle range (km).', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!Number.isInteger(year) || year < 1900) {
      setToast({ msg: 'Please select a valid manufacture year.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    if (!form.chargingPortType) {
      setToast({ msg: 'Please select charging port type.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSaving(true);
    try {
      await evApi.registerVehicle({
        ...form,
        batteryCapacityKwh: battery,
        vehicleRangeKm: rangeKm,
        yearOfManufacture: year,
      });
      setToast({ msg: 'EV vehicle registered!', type: 'success' });
      setShowForm(false);
      loadVehicles();
      setForm({ vehicleNumber: '', manufacturer: '', model: '', color: '', yearOfManufacture: new Date().getFullYear(), batteryCapacityKwh: '', chargingPortType: '', vehicleRangeKm: '', fastChargingSupported: false });
    } catch (e) {
      console.error('EV registration error', e);
      setToast({ msg: e.message || 'Registration failed', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setToast(null), 3500);
    }
  };

  const f = (k, v) => setForm(p => ({ ...p, [k]: v }));

  return (
    <div className="ev-root" style={{ display: 'flex', minHeight: '100vh', fontFamily: "'DM Sans', sans-serif" }}>
      {/* Sidebar desktop */}
      <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
        <EVCustomerSidebar />
      </div>
      {/* Sidebar mobile */}
      {sidebarOpen && <EVCustomerSidebar mobile onClose={() => setSidebarOpen(false)} />}

      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <EVHeading size="xl" sub="Manage your electric vehicles">My EV Vehicles</EVHeading>
          <EVButton icon={Car} onClick={() => setShowForm(v => !v)}>
            {showForm ? 'Cancel' : 'Add EV Vehicle'}
          </EVButton>
        </div>

        {/* Registration form */}
        {showForm && (
          <EVCard className="ev-animate-up" style={{ marginBottom: '24px' }}>
            <div style={{ marginBottom: '20px' }}>
              <h3 className="ev-heading" style={{ color: '#00D4AA', fontSize: '16px', margin: 0 }}>Register New EV</h3>
              <p style={{ color: '#94A3B8', fontSize: '13px', marginTop: '4px' }}>Enter your electric vehicle details below</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              <EVInput label="Vehicle Number" icon={Car} value={form.vehicleNumber} onChange={e => f('vehicleNumber', e.target.value)} placeholder="KA01AB1234" required />
              <EVSelect label="Manufacturer" value={form.manufacturer} onChange={e => f('manufacturer', e.target.value)} options={MANUFACTURERS} placeholder="Select brand" required />
              <EVInput label="Model" value={form.model} onChange={e => f('model', e.target.value)} placeholder="Nexon EV / 450X" required />
              <EVInput label="Color" value={form.color} onChange={e => f('color', e.target.value)} placeholder="e.g. Teal Blue" />
              <EVSelect label="Year" value={form.yearOfManufacture} onChange={e => f('yearOfManufacture', e.target.value)} options={YEARS} />
              <EVInput label="Battery Capacity (kWh)" icon={Battery} type="number" value={form.batteryCapacityKwh} onChange={e => f('batteryCapacityKwh', e.target.value)} placeholder="e.g. 40.5" required />
              <EVSelect label="Charging Port" value={form.chargingPortType} onChange={e => f('chargingPortType', e.target.value)} options={PORTS} placeholder="Select port type" required />
              <EVInput label="Vehicle Range (km)" icon={Gauge} type="number" value={form.vehicleRangeKm} onChange={e => f('vehicleRangeKm', e.target.value)} placeholder="e.g. 312" required />
            </div>
            {/* Fast charging toggle */}
            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => f('fastChargingSupported', !form.fastChargingSupported)}
                style={{
                  width: '44px', height: '24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: form.fastChargingSupported ? '#00D4AA' : '#1E293B',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <div style={{
                  width: '18px', height: '18px', borderRadius: '50%', background: 'white',
                  position: 'absolute', top: '3px', transition: 'left 0.2s',
                  left: form.fastChargingSupported ? '23px' : '3px',
                }} />
              </button>
              <span style={{ color: '#94A3B8', fontSize: '14px' }}>Fast Charging Supported (DC Fast Charge)</span>
            </div>
            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <EVButton onClick={handleSubmit} disabled={saving} icon={Zap}>
                {saving ? 'Registering…' : 'Register Vehicle'}
              </EVButton>
              <EVButton variant="ghost" onClick={() => setShowForm(false)}>Cancel</EVButton>
            </div>
          </EVCard>
        )}

        {/* Vehicle list */}
        {loading ? <EVLoader text="Loading your EVs…" /> : (
          vehicles.length === 0 ? (
            <EVCard style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Car size={48} color="#334155" style={{ marginBottom: '12px' }} />
              <p className="ev-heading" style={{ color: '#94A3B8', fontSize: '18px' }}>No EV vehicles yet</p>
              <p style={{ color: '#475569', fontSize: '14px', marginTop: '6px' }}>Click "Add EV Vehicle" to get started</p>
            </EVCard>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '18px' }}>
              {vehicles.map(v => (
                <EVCard key={v.id} hover>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={20} color="#00D4AA" />
                      </div>
                      <div>
                        <p className="ev-heading" style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '15px', margin: 0 }}>{v.manufacturer} {v.model}</p>
                        <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>{v.vehicleNumber}</p>
                      </div>
                    </div>
                    {v.fastChargingSupported && (
                      <span style={{ background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: '11px', padding: '2px 8px', borderRadius: '20px', fontWeight: 600 }}>⚡ DC Fast</span>
                    )}
                  </div>

                  {/* Specs row */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    {[
                      { label: 'Capacity', val: `${v.batteryCapacityKwh} kWh` },
                      { label: 'Range',    val: `${v.vehicleRangeKm} km` },
                      { label: 'Year',     val: v.yearOfManufacture || '—' },
                      { label: 'Color',    val: v.color || '—' },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ background: '#0F172A', borderRadius: '8px', padding: '8px 10px' }}>
                        <p style={{ color: '#475569', fontSize: '10px', margin: 0, fontWeight: 500 }}>{label}</p>
                        <p style={{ color: '#CBD5E1', fontSize: '13px', margin: '2px 0 0', fontWeight: 600 }}>{val}</p>
                      </div>
                    ))}
                  </div>

                  {/* Port */}
                  <div>
                    <p style={{ color: '#94A3B8', fontSize: '11px', marginBottom: '4px', fontWeight: 500 }}>CHARGING PORT</p>
                    <EVConnectorChip type={v.chargingPortType} />
                  </div>
                </EVCard>
              ))}
            </div>
          )
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: '#1E293B', border: `1.5px solid ${toast.type === 'success' ? '#00D4AA' : '#F87171'}`,
          borderRadius: '12px', padding: '14px 20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          animation: 'ev-slide-up 0.3s ease',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          <span style={{ color: '#F8FAFC', fontSize: '14px' }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}