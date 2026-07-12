import React, { useState, useEffect } from 'react';
import {
  Wrench, MapPin, Car, Building2, ChevronRight, CheckCircle2,
  Zap, Upload, X, Navigation
} from 'lucide-react';
import {
  EVCard, EVHeading, EVButton, EVSelect, EVInput,
  EVStepIndicator, EVConnectorChip, EVCertBadge, EVLoader
} from './EVDesignSystem';
import { EVCustomerSidebar } from './components/EVSidebar';
import { evApi } from './api/evApi';
import { useNavigate } from 'react-router-dom';

const SERVICE_TYPES = [
  { value: 'BATTERY_HEALTH_CHECK',      label: '🔋 Battery Health Check',        desc: 'Cell analysis, capacity test & BMS diagnostics' },
  { value: 'CHARGING_SYSTEM_INSPECTION',label: '⚡ Charging System Inspection',    desc: 'EVSE port, AC/DC charger and onboard charger test' },
  { value: 'MOTOR_INSPECTION',           label: '⚙️ Motor Inspection',              desc: 'Motor winding, cooling and efficiency check' },
  { value: 'BRAKE_INSPECTION',           label: '🛑 Brake Inspection',              desc: 'Regen braking & mechanical brake system inspection' },
  { value: 'SOFTWARE_DIAGNOSTICS',       label: '💻 Software Diagnostics',          desc: 'Full OBD scan, error codes and ECU health' },
  { value: 'FIRMWARE_UPDATE',            label: '📡 Firmware Update',               desc: 'Latest OEM firmware installation' },
  { value: 'BATTERY_COOLING_INSPECTION', label: '❄️ Battery Cooling Inspection',    desc: 'Thermal management and coolant check' },
  { value: 'GENERAL_EV_MAINTENANCE',     label: '🔧 General EV Maintenance',        desc: 'Complete wellness check — tyres, suspension, fluids' },
];

const STEPS = ['Vehicle', 'Workshop', 'Service', 'Location', 'Review'];

export default function EVBookServicePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [vehicles, setVehicles] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingWorkshops, setLoadingWorkshops] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({
    vehicleId: '',
    selectedWorkshopId: '',
    serviceType: '',
    serviceNames: [],
    description: '',
    customerLatitude: null,
    customerLongitude: null,
    customerAddress: '',
  });

  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedWorkshop, setSelectedWorkshop] = useState(null);
  const [selectedServices, setSelectedServices] = useState([]);

  useEffect(() => {
    evApi.getMyVehicles()
      .then(d => { setVehicles(d); setLoadingVehicles(false); })
      .catch(() => setLoadingVehicles(false));
    evApi.getWorkshops()
      .then(d => { setWorkshops(d); setLoadingWorkshops(false); })
      .catch(() => setLoadingWorkshops(false));
  }, []);

  const setField = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const detectLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setField('customerLatitude', pos.coords.latitude);
        setField('customerLongitude', pos.coords.longitude);
        setField('customerAddress', `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        showToast('Location detected!', 'success');
      },
      () => showToast('Could not get location. Please enter manually.', 'error')
    );
  };

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const result = await evApi.bookService({
        ...form,
        serviceNames: selectedServices.map(s => s.label),
      });
      setSuccess(result);
    } catch (e) {
      showToast(e.message || 'Booking failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="ev-root" style={{ display: 'flex', minHeight: '100vh' }}>
        <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
          <EVCustomerSidebar />
        </div>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px' }}>
          <EVCard style={{ maxWidth: '520px', width: '100%', textAlign: 'center', padding: '40px' }}>
            {/* Animated checkmark */}
            <div style={{
              width: '80px', height: '80px', borderRadius: '50%',
              background: 'rgba(0,212,170,0.1)', border: '2px solid #00D4AA',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle2 size={40} color="#00D4AA" />
            </div>
            <h2 className="ev-heading" style={{ color: '#F8FAFC', fontSize: '22px', margin: '0 0 8px' }}>Booking Confirmed!</h2>
            <p style={{ color: '#94A3B8', fontSize: '14px', marginBottom: '24px' }}>
              Your EV service request has been submitted and a technician is being assigned.
            </p>

            <div style={{ background: '#0F172A', borderRadius: '12px', padding: '18px', marginBottom: '24px', textAlign: 'left' }}>
              {[
                { label: 'Request ID',  val: success.id?.slice(-8).toUpperCase() },
                { label: 'Workshop',    val: success.selectedWorkshopName },
                { label: 'Technician', val: success.assignedWorkerName || 'Being assigned…' },
                { label: 'Service',     val: success.serviceType?.replace(/_/g, ' ') },
                { label: 'ETA',         val: success.estimatedArrivalMinutes ? `~${success.estimatedArrivalMinutes} mins` : '—' },
                { label: 'Status',      val: success.status },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ color: '#64748B', fontSize: '13px' }}>{label}</span>
                  <span style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: 600 }}>{val}</span>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <EVButton onClick={() => navigate('/dashboard/customer/ev/tracking')} icon={MapPin}>Live Tracking</EVButton>
              <EVButton variant="outline" onClick={() => navigate('/dashboard/customer/ev/history')}>View History</EVButton>
            </div>
          </EVCard>
        </main>
      </div>
    );
  }

  // ── Step content ──────────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      // Step 0: Select vehicle
      case 0:
        return (
          <div>
            <EVHeading sub="Which EV needs service today?">Select Your Vehicle</EVHeading>
            <div style={{ height: '16px' }} />
            {loadingVehicles ? <EVLoader /> : vehicles.length === 0 ? (
              <EVCard style={{ textAlign: 'center', padding: '40px' }}>
                <Car size={36} color="#334155" />
                <p style={{ color: '#94A3B8', marginTop: '10px' }}>No vehicles registered.</p>
                <EVButton size="sm" variant="outline" style={{ marginTop: '12px' }} onClick={() => navigate('/dashboard/customer/ev/vehicles')}>
                  Add EV Vehicle
                </EVButton>
              </EVCard>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: '14px' }}>
                {vehicles.map(v => (
                  <EVCard
                    key={v.id}
                    hover
                    onClick={() => { setSelectedVehicle(v); setField('vehicleId', v.id); }}
                    style={{
                      cursor: 'pointer',
                      border: form.vehicleId === v.id ? '1.5px solid #00D4AA' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(0,212,170,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={20} color="#00D4AA" />
                      </div>
                      <div>
                        <p className="ev-heading" style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '15px', margin: 0 }}>{v.manufacturer} {v.model}</p>
                        <p style={{ color: '#64748B', fontSize: '12px', margin: 0 }}>{v.vehicleNumber}</p>
                      </div>
                      {form.vehicleId === v.id && <CheckCircle2 size={18} color="#00D4AA" style={{ marginLeft: 'auto' }} />}
                    </div>
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <EVConnectorChip type={v.chargingPortType} />
                      <span style={{ color: '#94A3B8', fontSize: '12px' }}>🔋 {v.currentBatteryPercentage}%</span>
                    </div>
                  </EVCard>
                ))}
              </div>
            )}
          </div>
        );

      // Step 1: Select workshop
      case 1:
        return (
          <div>
            <EVHeading sub="Choose a certified EV workshop">Select Workshop</EVHeading>
            <div style={{ height: '16px' }} />
            {loadingWorkshops ? <EVLoader /> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '14px' }}>
                {workshops.map(w => (
                  <EVCard
                    key={w.id}
                    hover
                    onClick={() => { setSelectedWorkshop(w); setField('selectedWorkshopId', w.id); }}
                    style={{
                      cursor: 'pointer',
                      border: form.selectedWorkshopId === w.id ? '1.5px solid #00D4AA' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <p className="ev-heading" style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '14px', margin: 0 }}>{w.workshopName}</p>
                      {form.selectedWorkshopId === w.id && <CheckCircle2 size={16} color="#00D4AA" />}
                    </div>
                    <p style={{ color: '#64748B', fontSize: '12px', margin: '0 0 8px' }}>
                      <MapPin size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />{w.city}, {w.state}
                    </p>
                    <EVCertBadge level={w.certificationLevel} />
                    <div style={{ marginTop: '8px', display: 'flex', gap: '10px' }}>
                      <span style={{ color: '#F59E0B', fontSize: '12px' }}>⭐ {w.rating?.toFixed(1)}</span>
                      <span style={{ color: '#00D4AA', fontSize: '12px' }}>{w.availableWorkers} techs free</span>
                      {w.distanceKm != null && <span style={{ color: '#94A3B8', fontSize: '12px' }}>{w.distanceKm.toFixed(1)} km</span>}
                    </div>
                  </EVCard>
                ))}
              </div>
            )}
          </div>
        );

      // Step 2: Select service type
      case 2:
        return (
          <div>
            <EVHeading sub="What does your EV need? You can select more than one.">Select Service Type(s)</EVHeading>
            <div style={{ height: '16px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: '12px' }}>
              {SERVICE_TYPES.map(s => {
                const isSelected = selectedServices.some(sel => sel.value === s.value);
                return (
                  <EVCard
                    key={s.value}
                    hover
                    onClick={() => {
                      let next;
                      if (isSelected) {
                        next = selectedServices.filter(sel => sel.value !== s.value);
                      } else {
                        next = [...selectedServices, s];
                      }
                      setSelectedServices(next);
                      // Primary serviceType = first selected (backend requires a single serviceType)
                      setField('serviceType', next.length > 0 ? next[0].value : '');
                    }}
                    style={{
                      cursor: 'pointer',
                      border: isSelected ? '1.5px solid #00D4AA' : '1px solid rgba(255,255,255,0.07)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <p className="ev-heading" style={{ color: '#F8FAFC', fontWeight: 600, fontSize: '14px', margin: '0 0 4px' }}>{s.label}</p>
                        <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>{s.desc}</p>
                      </div>
                      {isSelected && <CheckCircle2 size={16} color="#00D4AA" flexShrink={0} />}
                    </div>
                  </EVCard>
                );
              })}
            </div>
            {/* Description */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ color: '#94A3B8', fontSize: '12px', fontWeight: 500, display: 'block', marginBottom: '8px' }}>Additional Notes (optional)</label>
              <textarea
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Describe any specific issues, symptoms or concerns…"
                style={{
                  width: '100%', padding: '12px', background: '#0F172A',
                  border: '1.5px solid rgba(255,255,255,0.07)', borderRadius: '10px',
                  color: '#F8FAFC', fontSize: '14px', fontFamily: "'DM Sans',sans-serif",
                  resize: 'vertical', minHeight: '90px', outline: 'none',
                }}
                onFocus={e => e.target.style.borderColor = '#00D4AA'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
              />
            </div>
          </div>
        );

      // Step 3: Service location
      case 3:
        return (
          <div>
            <EVHeading sub="Where should the technician come?">Your Service Location</EVHeading>
            <div style={{ height: '16px' }} />
            <EVCard>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <EVButton icon={Navigation} variant="outline" onClick={detectLocation} full>
                  📍 Detect My Current Location (GPS)
                </EVButton>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                  <span style={{ color: '#475569', fontSize: '12px' }}>or enter manually</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
                </div>
                <EVInput
                  label="Your Address"
                  icon={MapPin}
                  value={form.customerAddress}
                  onChange={e => setField('customerAddress', e.target.value)}
                  placeholder="Flat no, building, street, area, city…"
                  required
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <EVInput
                    label="Latitude"
                    type="number"
                    value={form.customerLatitude ?? ''}
                    onChange={e => setField('customerLatitude', parseFloat(e.target.value))}
                    placeholder="e.g. 12.9716"
                  />
                  <EVInput
                    label="Longitude"
                    type="number"
                    value={form.customerLongitude ?? ''}
                    onChange={e => setField('customerLongitude', parseFloat(e.target.value))}
                    placeholder="e.g. 77.5946"
                  />
                </div>
                {form.customerLatitude && form.customerLongitude && (
                  <div style={{ background: 'rgba(0,212,170,0.08)', borderRadius: '10px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} color="#00D4AA" />
                    <span style={{ color: '#00D4AA', fontSize: '13px' }}>Location set: {form.customerLatitude.toFixed(4)}, {form.customerLongitude.toFixed(4)}</span>
                  </div>
                )}
              </div>
            </EVCard>
          </div>
        );

      // Step 4: Review
      case 4:
        return (
          <div>
            <EVHeading sub="Review your booking before submitting">Booking Summary</EVHeading>
            <div style={{ height: '16px' }} />
            <EVCard>
              {[
                { label: 'EV Vehicle',  val: selectedVehicle ? `${selectedVehicle.manufacturer} ${selectedVehicle.model} (${selectedVehicle.vehicleNumber})` : '—' },
                { label: 'Workshop',    val: selectedWorkshop?.workshopName ?? '—' },
                { label: 'Location',    val: selectedWorkshop ? `${selectedWorkshop.city}, ${selectedWorkshop.state}` : '—' },
                { label: 'Service(s)',  val: selectedServices.length > 0 ? selectedServices.map(s => s.label).join(', ') : '—' },
                { label: 'Your Address',val: form.customerAddress || '—' },
                { label: 'Notes',       val: form.description || 'None' },
              ].map(({ label, val }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', gap: '16px' }}>
                  <span style={{ color: '#64748B', fontSize: '13px', flexShrink: 0 }}>{label}</span>
                  <span style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: 500, textAlign: 'right' }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop: '20px' }}>
                <p style={{ color: '#94A3B8', fontSize: '12px', lineHeight: '1.6' }}>
                  ✅ A certified technician from <strong style={{ color: '#00D4AA' }}>{selectedWorkshop?.workshopName}</strong> will be dispatched to your location. You will receive real-time tracking once assigned.
                </p>
              </div>
            </EVCard>
          </div>
        );

      default: return null;
    }
  };

  const canNext = () => {
    if (step === 0) return !!form.vehicleId;
    if (step === 1) return !!form.selectedWorkshopId;
    if (step === 2) return selectedServices.length > 0;
    if (step === 3) return !!(form.customerLatitude && form.customerLongitude);
    return true;
  };

  return (
    <div className="ev-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
        <EVCustomerSidebar />
      </div>

      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto', maxWidth: '900px' }}>
        <div style={{ marginBottom: '28px' }}>
          <EVHeading size="xl" sub="Doorstep EV servicing in a few simple steps">Book EV Service</EVHeading>
        </div>

        <EVStepIndicator steps={STEPS} current={step} />

        <div className="ev-animate-up" key={step} style={{ marginBottom: '28px' }}>
          {renderStep()}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <EVButton variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>
            ← Back
          </EVButton>
          {step < STEPS.length - 1 ? (
            <EVButton onClick={() => setStep(s => s + 1)} disabled={!canNext()} icon={ChevronRight}>
              Continue
            </EVButton>
          ) : (
            <EVButton onClick={handleSubmit} disabled={submitting || !canNext()} icon={Zap}>
              {submitting ? 'Submitting…' : 'Confirm Booking'}
            </EVButton>
          )}
        </div>
      </main>

      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          background: '#1E293B', border: `1.5px solid ${toast.type === 'success' ? '#00D4AA' : '#F87171'}`,
          borderRadius: '12px', padding: '14px 20px', fontFamily: "'DM Sans',sans-serif",
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          <span style={{ color: '#F8FAFC', fontSize: '14px' }}>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}