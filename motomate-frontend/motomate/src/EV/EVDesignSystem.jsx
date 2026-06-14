// EV Module – Shared Design System
// Theme: "Electric Dark" — slate-950 bg, teal (#00D4AA) primary, amber battery
// Fonts: Syne (headings) + DM Sans (body) via Google Fonts

import React from 'react';
import { Loader2, AlertTriangle, Zap } from 'lucide-react';

// ── Inject Google Fonts once ──────────────────────────────────────────────────
if (!document.getElementById('ev-fonts')) {
  const link = document.createElement('link');
  link.id = 'ev-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&display=swap';
  document.head.appendChild(link);
}

// ── CSS variables injected once ───────────────────────────────────────────────
if (!document.getElementById('ev-vars')) {
  const style = document.createElement('style');
  style.id = 'ev-vars';
  style.textContent = `
    .ev-root {
      --ev-teal:   #00D4AA;
      --ev-teal-d: #00A882;
      --ev-teal-g: rgba(0,212,170,0.12);
      --ev-amber:  #F59E0B;
      --ev-amber-g:rgba(245,158,11,0.12);
      --ev-bg:     #020617;
      --ev-surface:#0F172A;
      --ev-card:   #1E293B;
      --ev-border: rgba(255,255,255,0.07);
      --ev-text:   #F8FAFC;
      --ev-muted:  #94A3B8;
      --ev-red:    #F87171;
      --font-head: 'Syne', sans-serif;
      --font-body: 'DM Sans', sans-serif;
    }
    .ev-root * { box-sizing: border-box; }
    .ev-root { font-family: var(--font-body); background: var(--ev-bg); color: var(--ev-text); min-height: 100vh; }
    .ev-heading { font-family: var(--font-head); }
    .ev-glow { box-shadow: 0 0 24px rgba(0,212,170,0.25); }
    .ev-card-hover { transition: transform 0.2s, box-shadow 0.2s; }
    .ev-card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 32px rgba(0,212,170,0.15); }
    @keyframes ev-pulse-teal { 0%,100%{opacity:1} 50%{opacity:0.5} }
    @keyframes ev-spin { to { transform: rotate(360deg); } }
    @keyframes ev-slide-up { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ev-flash { 0%,100%{background:transparent} 50%{background:rgba(248,113,113,0.1)} }
    .ev-animate-up { animation: ev-slide-up 0.4s ease forwards; }
    .ev-animate-flash { animation: ev-flash 1s ease infinite; }
    .ev-scrollbar::-webkit-scrollbar { width: 4px; }
    .ev-scrollbar::-webkit-scrollbar-track { background: var(--ev-surface); }
    .ev-scrollbar::-webkit-scrollbar-thumb { background: var(--ev-teal-d); border-radius: 2px; }
  `;
  document.head.appendChild(style);
}

// ── Card ──────────────────────────────────────────────────────────────────────
export const EVCard = ({ children, className = '', hover = false, glow = false, onClick, style = {}, ...rest }) => (
  <div
    className={`ev-card-hover ${className}`}
    onClick={onClick}
    style={{
      background: 'var(--ev-card)',
      border: '1px solid var(--ev-border)',
      borderRadius: '16px',
      padding: '20px',
      ...(hover ? { cursor: 'pointer' } : {}),
      ...(glow ? { boxShadow: '0 0 24px rgba(0,212,170,0.18)' } : {}),
      ...style,
    }}
    {...rest}
  >
    {children}
  </div>
);

// ── Section heading ───────────────────────────────────────────────────────────
export const EVHeading = ({ children, sub, size = 'lg' }) => (
  <div style={{ marginBottom: '4px' }}>
    <h2 className="ev-heading" style={{
      fontSize: size === 'xl' ? '28px' : size === 'lg' ? '22px' : '18px',
      fontWeight: 700,
      color: 'var(--ev-text)',
      margin: 0,
    }}>
      {children}
    </h2>
    {sub && <p style={{ color: 'var(--ev-muted)', fontSize: '13px', marginTop: '2px' }}>{sub}</p>}
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
export const EVStatCard = ({ icon: Icon, label, value, color = 'teal', sub }) => {
  const colors = {
    teal:  { bg: 'rgba(0,212,170,0.1)',  icon: '#00D4AA', val: '#00D4AA',  border: 'rgba(0,212,170,0.2)' },
    amber: { bg: 'rgba(245,158,11,0.1)', icon: '#F59E0B', val: '#F59E0B', border: 'rgba(245,158,11,0.2)' },
    red:   { bg: 'rgba(248,113,113,0.1)',icon: '#F87171', val: '#F87171', border: 'rgba(248,113,113,0.2)' },
    slate: { bg: 'rgba(148,163,184,0.1)',icon: '#94A3B8', val: '#94A3B8', border: 'rgba(148,163,184,0.2)' },
  };
  const c = colors[color] || colors.teal;
  return (
    <div style={{
      background: 'var(--ev-card)', border: `1px solid ${c.border}`,
      borderRadius: '14px', padding: '18px 20px',
      display: 'flex', alignItems: 'flex-start', gap: '14px',
    }}>
      <div style={{
        width: '44px', height: '44px', borderRadius: '12px',
        background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Icon size={20} color={c.icon} />
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ color: 'var(--ev-muted)', fontSize: '12px', fontWeight: 500, margin: 0 }}>{label}</p>
        <p style={{ color: c.val, fontSize: '24px', fontWeight: 700, margin: '2px 0 0', fontFamily: 'var(--font-head)' }}>{value ?? '—'}</p>
        {sub && <p style={{ color: 'var(--ev-muted)', fontSize: '11px', marginTop: '2px' }}>{sub}</p>}
      </div>
    </div>
  );
};

// ── Battery Bar ───────────────────────────────────────────────────────────────
export const EVBatteryBar = ({ pct = 0, showLabel = true }) => {
  const color = pct <= 10 ? '#F87171' : pct <= 30 ? '#F59E0B' : '#00D4AA';
  const glow  = pct <= 10 ? '0 0 8px rgba(248,113,113,0.6)' : pct <= 30 ? '0 0 8px rgba(245,158,11,0.5)' : '0 0 8px rgba(0,212,170,0.4)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      {/* Battery shell */}
      <div style={{ position: 'relative', width: '56px', height: '26px', display: 'flex', alignItems: 'center' }}>
        <div style={{
          width: '50px', height: '26px', borderRadius: '5px',
          border: `1.5px solid ${color}`, position: 'relative', overflow: 'hidden',
          boxShadow: glow,
        }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${pct}%`, background: color,
            borderRadius: '3px', transition: 'width 0.5s ease',
          }} />
        </div>
        {/* Nub */}
        <div style={{
          width: '4px', height: '10px', background: color,
          borderRadius: '0 2px 2px 0', marginLeft: '-1px',
        }} />
      </div>
      {showLabel && (
        <span style={{ color, fontSize: '13px', fontWeight: 600 }}>{pct}%</span>
      )}
    </div>
  );
};

// ── Status Badge ──────────────────────────────────────────────────────────────
const STATUS_MAP = {
  REQUESTED:     { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8', dot: '#94A3B8',  label: 'Requested' },
  ASSIGNED:      { bg: 'rgba(0,212,170,0.12)',   text: '#00D4AA', dot: '#00D4AA',  label: 'Assigned' },
  ACCEPTED:      { bg: 'rgba(0,212,170,0.12)',   text: '#00D4AA', dot: '#00D4AA',  label: 'Accepted' },
  ON_THE_WAY:    { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', dot: '#F59E0B',  label: 'On the Way' },
  ON_ROUTE:      { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', dot: '#F59E0B',  label: 'On Route' },
  SERVICE_STARTED:{ bg:'rgba(99,102,241,0.12)',  text: '#818CF8', dot: '#818CF8',  label: 'In Progress' },
  CHARGING:      { bg: 'rgba(99,102,241,0.12)',  text: '#818CF8', dot: '#818CF8',  label: 'Charging' },
  COMPLETED:     { bg: 'rgba(0,212,170,0.15)',   text: '#00D4AA', dot: '#00D4AA',  label: 'Completed' },
  CANCELLED:     { bg: 'rgba(248,113,113,0.12)', text: '#F87171', dot: '#F87171',  label: 'Cancelled' },
  AVAILABLE:     { bg: 'rgba(0,212,170,0.12)',   text: '#00D4AA', dot: '#00D4AA',  label: 'Available' },
  ASSIGNED_W:    { bg: 'rgba(245,158,11,0.12)',  text: '#F59E0B', dot: '#F59E0B',  label: 'Assigned' },
  OFF_DUTY:      { bg: 'rgba(148,163,184,0.12)', text: '#94A3B8', dot: '#94A3B8',  label: 'Off Duty' },
  HIGH:          { bg: 'rgba(248,113,113,0.15)', text: '#F87171', dot: '#F87171',  label: '🚨 Emergency' },
};

export const EVStatusBadge = ({ status }) => {
  const s = STATUS_MAP[status] || STATUS_MAP.REQUESTED;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
      background: s.bg, color: s.text,
    }}>
      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.dot, display: 'inline-block' }} />
      {s.label}
    </span>
  );
};

// ── Teal Button ───────────────────────────────────────────────────────────────
export const EVButton = ({ children, onClick, disabled, variant = 'primary', size = 'md', icon: Icon, full = false, danger = false }) => {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: '8px', fontFamily: 'var(--font-body)', fontWeight: 600, cursor: 'pointer',
    border: 'none', borderRadius: '10px', transition: 'all 0.2s',
    width: full ? '100%' : 'auto', opacity: disabled ? 0.5 : 1,
  };
  const sizes = { sm: { padding: '6px 14px', fontSize: '13px' }, md: { padding: '10px 20px', fontSize: '14px' }, lg: { padding: '13px 26px', fontSize: '15px' } };
  const variants = {
    primary: { background: 'var(--ev-teal)', color: '#020617' },
    outline: { background: 'transparent', color: 'var(--ev-teal)', border: '1.5px solid var(--ev-teal)' },
    ghost:   { background: 'rgba(255,255,255,0.05)', color: 'var(--ev-text)' },
    danger:  { background: 'rgba(248,113,113,0.15)', color: '#F87171', border: '1.5px solid rgba(248,113,113,0.3)' },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[danger ? 'danger' : variant] }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter = 'brightness(1.1)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} />}
      {children}
    </button>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────
export const EVInput = ({ label, type = 'text', value, onChange, placeholder, required, icon: Icon, error }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && (
      <label style={{ color: 'var(--ev-muted)', fontSize: '12px', fontWeight: 500, letterSpacing: '0.03em' }}>
        {label}{required && <span style={{ color: '#F87171', marginLeft: '3px' }}>*</span>}
      </label>
    )}
    <div style={{ position: 'relative' }}>
      {Icon && (
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
          <Icon size={16} color="var(--ev-muted)" />
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%', padding: Icon ? '10px 12px 10px 38px' : '10px 12px',
          background: 'var(--ev-surface)', border: `1.5px solid ${error ? '#F87171' : 'var(--ev-border)'}`,
          borderRadius: '10px', color: 'var(--ev-text)', fontSize: '14px',
          outline: 'none', fontFamily: 'var(--font-body)',
        }}
        onFocus={e => e.target.style.borderColor = 'var(--ev-teal)'}
        onBlur={e => e.target.style.borderColor = error ? '#F87171' : 'var(--ev-border)'}
      />
    </div>
    {error && <p style={{ color: '#F87171', fontSize: '12px' }}>{error}</p>}
  </div>
);

// ── Select ────────────────────────────────────────────────────────────────────
export const EVSelect = ({ label, value, onChange, options, placeholder, required }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
    {label && (
      <label style={{ color: 'var(--ev-muted)', fontSize: '12px', fontWeight: 500 }}>
        {label}{required && <span style={{ color: '#F87171', marginLeft: '3px' }}>*</span>}
      </label>
    )}
    <select
      value={value}
      onChange={onChange}
      style={{
        width: '100%', padding: '10px 12px',
        background: 'var(--ev-surface)', border: '1.5px solid var(--ev-border)',
        borderRadius: '10px', color: value ? 'var(--ev-text)' : 'var(--ev-muted)',
        fontSize: '14px', outline: 'none', fontFamily: 'var(--font-body)', cursor: 'pointer',
      }}
      onFocus={e => e.target.style.borderColor = 'var(--ev-teal)'}
      onBlur={e => e.target.style.borderColor = 'var(--ev-border)'}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

// ── Loader ────────────────────────────────────────────────────────────────────
export const EVLoader = ({ text = 'Loading…' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '12px' }}>
    <Zap size={32} color="var(--ev-teal)" style={{ animation: 'ev-pulse-teal 1s ease infinite' }} />
    <p style={{ color: 'var(--ev-muted)', fontSize: '14px' }}>{text}</p>
  </div>
);

// ── Error Block ───────────────────────────────────────────────────────────────
export const EVError = ({ message, onRetry }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '200px', gap: '12px' }}>
    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(248,113,113,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <AlertTriangle size={22} color="#F87171" />
    </div>
    <p style={{ color: '#94A3B8', fontSize: '14px' }}>{message || 'Something went wrong.'}</p>
    {onRetry && <EVButton size="sm" variant="outline" onClick={onRetry}>Retry</EVButton>}
  </div>
);

// ── Cert Badge ────────────────────────────────────────────────────────────────
const CERT_COLORS = {
  CERTIFIED_EXPERT: { bg: 'rgba(0,212,170,0.12)', text: '#00D4AA', label: '⭐ Certified Expert' },
  ADVANCED:         { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', label: '🔬 Advanced' },
  BASIC:            { bg: 'rgba(148,163,184,0.1)', text: '#94A3B8', label: 'Basic' },
};
export const EVCertBadge = ({ level }) => {
  const c = CERT_COLORS[level] || CERT_COLORS.BASIC;
  return (
    <span style={{ display: 'inline-block', padding: '3px 9px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, background: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
};

// ── Connector chip ────────────────────────────────────────────────────────────
export const EVConnectorChip = ({ type }) => (
  <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600, background: 'rgba(0,212,170,0.08)', color: '#00D4AA', border: '1px solid rgba(0,212,170,0.2)', marginRight: '4px', marginBottom: '4px' }}>
    {type}
  </span>
);

// ── Toast utility (simple) ────────────────────────────────────────────────────
export const EVToast = ({ message, type = 'success', onClose }) => {
  const colors = { success: '#00D4AA', error: '#F87171', warning: '#F59E0B' };
  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
      background: 'var(--ev-card)', border: `1.5px solid ${colors[type]}`,
      borderRadius: '12px', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px',
      boxShadow: `0 8px 32px rgba(0,0,0,0.4)`, minWidth: '280px', animation: 'ev-slide-up 0.3s ease',
    }}>
      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors[type], flexShrink: 0 }} />
      <p style={{ color: 'var(--ev-text)', fontSize: '14px', flex: 1, margin: 0 }}>{message}</p>
      {onClose && <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--ev-muted)', cursor: 'pointer', fontSize: '16px' }}>×</button>}
    </div>
  );
};

// ── Page wrapper ──────────────────────────────────────────────────────────────
export const EVPage = ({ children, sidebar }) => (
  <div className="ev-root" style={{ display: 'flex', minHeight: '100vh' }}>
    {sidebar}
    <main style={{ flex: 1, padding: '24px 32px', overflowY: 'auto' }} className="ev-scrollbar">
      {children}
    </main>
  </div>
);

// ── Divider ───────────────────────────────────────────────────────────────────
export const EVDivider = () => (
  <hr style={{ border: 'none', borderTop: '1px solid var(--ev-border)', margin: '16px 0' }} />
);

// ── Step indicator ────────────────────────────────────────────────────────────
export const EVStepIndicator = ({ steps, current }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: '28px' }}>
    {steps.map((step, i) => {
      const done    = i < current;
      const active  = i === current;
      const color   = done || active ? '#00D4AA' : '#334155';
      return (
        <React.Fragment key={i}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '50%',
              background: done ? '#00D4AA' : active ? 'rgba(0,212,170,0.15)' : 'var(--ev-surface)',
              border: `2px solid ${color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '13px', fontWeight: 700,
              color: done ? '#020617' : color,
            }}>
              {done ? '✓' : i + 1}
            </div>
            <span style={{ fontSize: '11px', color: active ? '#00D4AA' : '#94A3B8', whiteSpace: 'nowrap' }}>{step}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: '2px', background: done ? '#00D4AA' : '#1E293B', minWidth: '20px', marginBottom: '16px', transition: 'background 0.3s' }} />
          )}
        </React.Fragment>
      );
    })}
  </div>
);