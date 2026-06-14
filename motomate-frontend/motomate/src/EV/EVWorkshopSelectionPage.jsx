import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin, Star, Zap, Users, ChevronRight, Search,
  List, Map as MapIcon, SlidersHorizontal, CheckCircle2, Phone
} from 'lucide-react';
import {
  EVCard, EVHeading, EVButton, EVInput, EVCertBadge,
  EVConnectorChip, EVLoader, EVError
} from './EVDesignSystem';
import { EVCustomerSidebar } from './components/EVSidebar';
import { evApi } from './api/evApi';

// ── Sort options ──────────────────────────────────────────────────────────────
const SORT_OPTS = [
  { value: 'distance',      label: 'Nearest First' },
  { value: 'rating',        label: 'Top Rated' },
  { value: 'availability',  label: 'Most Available' },
];

// ── Workshop card ─────────────────────────────────────────────────────────────
const WorkshopCard = ({ w, selected, onSelect }) => (
  <EVCard
    hover
    className="ev-card-hover"
    style={{
      cursor: 'pointer',
      border: selected
        ? '1.5px solid #00D4AA'
        : '1px solid rgba(255,255,255,0.07)',
      position: 'relative',
      transition: 'all 0.2s',
    }}
    onClick={() => onSelect(w)}
  >
    {selected && (
      <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
        <CheckCircle2 size={18} color="#00D4AA" />
      </div>
    )}

    {/* Top row */}
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
      <div style={{
        width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
        background: 'linear-gradient(135deg,rgba(0,212,170,0.2) 0%,rgba(0,168,130,0.1) 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Zap size={22} color="#00D4AA" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="ev-heading" style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '15px', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {w.workshopName}
        </p>
        <p style={{ color: '#64748B', fontSize: '12px', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <MapPin size={11} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
          {w.city}, {w.state}
        </p>
      </div>
    </div>

    {/* Cert + Rating */}
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
      <EVCertBadge level={w.certificationLevel} />
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Star size={13} fill="#F59E0B" color="#F59E0B" />
        <span style={{ color: '#F8FAFC', fontSize: '13px', fontWeight: 600 }}>{w.rating?.toFixed(1)}</span>
        <span style={{ color: '#475569', fontSize: '12px' }}>({w.totalReviews})</span>
      </div>
    </div>

    {/* Metrics row */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px', marginBottom: '12px' }}>
      {[
        { icon: MapPin,  val: w.distanceKm != null ? `${w.distanceKm.toFixed(1)} km` : '—', label: 'Distance' },
        { icon: Users,   val: w.availableWorkers ?? '—', label: 'Available' },
        { icon: Zap,     val: w.operatingHours?.split('–')[0]?.trim() ?? '—', label: 'Opens' },
      ].map(({ icon: Ic, val, label }) => (
        <div key={label} style={{ background: '#0F172A', borderRadius: '8px', padding: '7px 10px', textAlign: 'center' }}>
          <p style={{ color: '#475569', fontSize: '10px', margin: 0 }}>{label}</p>
          <p style={{ color: '#CBD5E1', fontSize: '13px', fontWeight: 600, margin: '2px 0 0' }}>{val}</p>
        </div>
      ))}
    </div>

    {/* Supported brands */}
    <div style={{ marginBottom: '10px' }}>
      <p style={{ color: '#475569', fontSize: '10px', fontWeight: 500, marginBottom: '4px' }}>SUPPORTED BRANDS</p>
      <p style={{ color: '#94A3B8', fontSize: '12px', margin: 0 }}>
        {w.supportedBrands?.slice(0, 4).join(' · ')}{w.supportedBrands?.length > 4 ? ` +${w.supportedBrands.length - 4}` : ''}
      </p>
    </div>

    {/* Charging ports */}
    <div>
      {w.supportedChargingPorts?.map(p => <EVConnectorChip key={p} type={p} />)}
    </div>

    {/* Select CTA */}
    <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <EVButton full icon={ChevronRight} size="sm" variant={selected ? 'primary' : 'outline'}>
        {selected ? 'Workshop Selected ✓' : 'Select This Workshop'}
      </EVButton>
    </div>
  </EVCard>
);

// ── Map view (Leaflet) ────────────────────────────────────────────────────────
const WorkshopMapView = ({ workshops, selected, onSelect, userLat, userLng }) => {
  const mapRef = useRef(null);
  const leafletMap = useRef(null);

  useEffect(() => {
    if (!mapRef.current || workshops.length === 0) return;
    if (leafletMap.current) { leafletMap.current.remove(); }

    // Dynamically load Leaflet
    const loadLeaflet = async () => {
      if (!window.L) {
        const cssLink = document.createElement('link');
        cssLink.rel = 'stylesheet';
        cssLink.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(cssLink);
        await new Promise(res => {
          const s = document.createElement('script');
          s.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          s.onload = res;
          document.head.appendChild(s);
        });
      }
      const L = window.L;
      const center = userLat ? [userLat, userLng] : [20.5937, 78.9629];
      const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 5);
      leafletMap.current = map;

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        maxZoom: 19,
      }).addTo(map);

      // User marker
      if (userLat) {
        L.circleMarker([userLat, userLng], {
          radius: 8, color: '#00D4AA', fillColor: '#00D4AA', fillOpacity: 0.8, weight: 2,
        }).addTo(map).bindPopup('<b style="color:#020617">Your Location</b>');
      }

      // Workshop markers
      workshops.forEach(w => {
        if (!w.latitude || !w.longitude) return;
        const isSelected = selected?.id === w.id;
        const icon = L.divIcon({
          html: `<div style="
            background:${isSelected ? '#00D4AA' : '#1E293B'};
            color:${isSelected ? '#020617' : '#00D4AA'};
            border:2px solid #00D4AA;
            border-radius:50%;width:28px;height:28px;
            display:flex;align-items:center;justify-content:center;
            font-size:14px;font-weight:700;
            box-shadow: 0 0 ${isSelected ? '12px' : '0'} rgba(0,212,170,0.6);
          ">⚡</div>`,
          className: '', iconSize: [28, 28], iconAnchor: [14, 28],
        });
        L.marker([w.latitude, w.longitude], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:'DM Sans',sans-serif;min-width:180px">
              <b style="font-size:13px">${w.workshopName}</b>
              <p style="color:#666;font-size:12px;margin:4px 0">${w.city}, ${w.state}</p>
              <p style="color:#888;font-size:11px;margin:0">⭐ ${w.rating?.toFixed(1)} · ${w.availableWorkers} techs available</p>
            </div>
          `)
          .on('click', () => onSelect(w));
      });
    };
    loadLeaflet();
  }, [workshops, selected, userLat, userLng]);

  return (
    <div style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', height: '520px' }}>
      <div ref={mapRef} style={{ height: '100%', background: '#0F172A' }} />
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EVWorkshopSelectionPage({ onWorkshopSelected }) {
  const [workshops, setWorkshops] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('distance');
  const [view, setView] = useState('list');
  const [selected, setSelected] = useState(null);
  const [userLat, setUserLat] = useState(null);
  const [userLng, setUserLng] = useState(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => {
        setUserLat(pos.coords.latitude);
        setUserLng(pos.coords.longitude);
        loadNearby(pos.coords.latitude, pos.coords.longitude);
      },
      () => loadAll()
    );
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await evApi.getWorkshops();
      setWorkshops(data);
      setFiltered(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const loadNearby = async (lat, lng) => {
    setLoading(true);
    try {
      const data = await evApi.getNearbyWorkshops(lat, lng);
      setWorkshops(data);
      setFiltered(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter + sort
  useEffect(() => {
    let list = workshops.filter(w =>
      w.workshopName?.toLowerCase().includes(search.toLowerCase()) ||
      w.city?.toLowerCase().includes(search.toLowerCase()) ||
      w.supportedBrands?.some(b => b.toLowerCase().includes(search.toLowerCase()))
    );
    if (sort === 'distance')     list = [...list].sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
    if (sort === 'rating')       list = [...list].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sort === 'availability') list = [...list].sort((a, b) => (b.availableWorkers ?? 0) - (a.availableWorkers ?? 0));
    setFiltered(list);
  }, [workshops, search, sort]);

  return (
    <div className="ev-root" style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{ display: window.innerWidth < 768 ? 'none' : 'block' }}>
        <EVCustomerSidebar />
      </div>

      <main style={{ flex: 1, padding: '28px 32px', overflowY: 'auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <EVHeading size="xl" sub="Choose a workshop to service your EV">EV Workshop Selection</EVHeading>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '200px', maxWidth: '360px' }}>
            <EVInput
              icon={Search}
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, city, or brand…"
            />
          </div>

          {/* Sort */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {SORT_OPTS.map(o => (
              <button
                key={o.value}
                onClick={() => setSort(o.value)}
                style={{
                  padding: '8px 14px', borderRadius: '8px', border: '1.5px solid',
                  borderColor: sort === o.value ? '#00D4AA' : 'rgba(255,255,255,0.07)',
                  background: sort === o.value ? 'rgba(0,212,170,0.1)' : 'transparent',
                  color: sort === o.value ? '#00D4AA' : '#64748B',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {o.label}
              </button>
            ))}
          </div>

          {/* View toggle */}
          <div style={{ display: 'flex', background: '#0F172A', borderRadius: '10px', padding: '3px', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[{ v: 'list', Ic: List }, { v: 'map', Ic: MapIcon }].map(({ v, Ic }) => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  padding: '6px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: view === v ? '#00D4AA' : 'transparent',
                  color: view === v ? '#020617' : '#64748B',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: '13px',
                }}
              >
                <Ic size={14} />
                {v === 'list' ? 'List' : 'Map'}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <p style={{ color: '#475569', fontSize: '13px', marginBottom: '16px' }}>
          {loading ? 'Searching…' : `${filtered.length} workshops found${userLat ? ' near you' : ''}`}
        </p>

        {/* Selected banner */}
        {selected && (
          <div style={{
            background: 'rgba(0,212,170,0.08)', border: '1.5px solid rgba(0,212,170,0.3)',
            borderRadius: '12px', padding: '14px 18px', marginBottom: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            animation: 'ev-slide-up 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CheckCircle2 size={18} color="#00D4AA" />
              <div>
                <p style={{ color: '#F8FAFC', fontWeight: 600, margin: 0, fontSize: '14px' }}>{selected.workshopName}</p>
                <p style={{ color: '#00D4AA', fontSize: '12px', margin: 0 }}>{selected.city} · {selected.availableWorkers} technicians available</p>
              </div>
            </div>
            <EVButton size="sm" icon={ChevronRight} onClick={() => onWorkshopSelected?.(selected)}>
              Book Service Here
            </EVButton>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <EVLoader text="Finding EV workshops…" />
        ) : error ? (
          <EVError message={error} onRetry={loadAll} />
        ) : view === 'list' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {filtered.map(w => (
              <WorkshopCard
                key={w.id}
                w={w}
                selected={selected?.id === w.id}
                onSelect={setSelected}
              />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '20px' }}>
            <WorkshopMapView
              workshops={filtered}
              selected={selected}
              onSelect={setSelected}
              userLat={userLat}
              userLng={userLng}
            />
            {/* Side list */}
            <div style={{ overflowY: 'auto', maxHeight: '520px', display: 'flex', flexDirection: 'column', gap: '10px' }} className="ev-scrollbar">
              {filtered.map(w => (
                <div
                  key={w.id}
                  onClick={() => setSelected(w)}
                  style={{
                    background: selected?.id === w.id ? 'rgba(0,212,170,0.08)' : '#1E293B',
                    border: `1.5px solid ${selected?.id === w.id ? '#00D4AA' : 'rgba(255,255,255,0.07)'}`,
                    borderRadius: '12px', padding: '14px 16px', cursor: 'pointer',
                  }}
                >
                  <p className="ev-heading" style={{ color: '#F8FAFC', fontWeight: 700, margin: 0, fontSize: '13px' }}>{w.workshopName}</p>
                  <p style={{ color: '#64748B', fontSize: '11px', margin: '3px 0' }}>{w.city} · {w.distanceKm?.toFixed(1)} km</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#F59E0B', fontSize: '12px' }}>⭐ {w.rating?.toFixed(1)}</span>
                    <span style={{ color: '#00D4AA', fontSize: '12px' }}>{w.availableWorkers} available</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}