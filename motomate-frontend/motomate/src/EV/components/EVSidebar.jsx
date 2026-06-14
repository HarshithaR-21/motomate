import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Zap, Car, History, MapPin, BatteryCharging, AlertTriangle,
  LayoutDashboard, Users, Settings, ChevronRight, LogOut,
  Wrench, Truck, Menu, X
} from 'lucide-react';

// ── Shared EV Sidebar for Customer ───────────────────────────────────────────
export const EVCustomerSidebar = ({ mobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const nav = [
    { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard/customer' },
    { icon: Car,             label: 'My EV Vehicles',path: '/dashboard/customer/ev/vehicles' },
    { icon: Wrench,          label: 'Book EV Service',path: '/dashboard/customer/ev/book-service' },
    { icon: MapPin,          label: 'Live Tracking',  path: '/dashboard/customer/ev/tracking' },
    { icon: BatteryCharging, label: 'Mobile Charging',path: '/dashboard/customer/ev/charging' },
    { icon: AlertTriangle,   label: 'EV SOS',         path: '/dashboard/customer/ev/sos', danger: true },
    { icon: History,         label: 'EV History',     path: '/dashboard/customer/ev/history' },
  ];

  return <SidebarShell nav={nav} label="EV Customer" mobile={mobile} onClose={onClose} navigate={navigate} location={location} />;
};

// ── EV Worker Sidebar ─────────────────────────────────────────────────────────
export const EVWorkerSidebar = ({ mobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const nav = [
    { icon: LayoutDashboard, label: 'Dashboard',     path: '/dashboard/ev-worker' },
    { icon: Zap,             label: 'Assigned Jobs',  path: '/dashboard/ev-worker/jobs' },
    { icon: MapPin,          label: 'Navigation',     path: '/dashboard/ev-worker/map' },
    { icon: History,         label: 'Job History',    path: '/dashboard/ev-worker/history' },
  ];

  return <SidebarShell nav={nav} label="EV Technician" mobile={mobile} onClose={onClose} navigate={navigate} location={location} />;
};

// ── EV Workshop Sidebar ───────────────────────────────────────────────────────
export const EVWorkshopSidebar = ({ mobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const nav = [
    { icon: LayoutDashboard, label: 'Dashboard',      path: '/dashboard/ev-workshop' },
    { icon: Wrench,          label: 'Requests',        path: '/dashboard/ev-workshop/requests' },
    { icon: Users,           label: 'Technicians',     path: '/dashboard/ev-workshop/workers' },
    { icon: Settings,        label: 'Workshop Profile',path: '/dashboard/ev-workshop/profile' },
  ];

  return <SidebarShell nav={nav} label="EV Workshop" mobile={mobile} onClose={onClose} navigate={navigate} location={location} />;
};

// ── EV Admin Sidebar ──────────────────────────────────────────────────────────
export const EVAdminSidebar = ({ mobile, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const nav = [
    { icon: LayoutDashboard, label: 'EV Dashboard',  path: '/dashboard/admin/ev' },
    { icon: Zap,             label: 'Workshops',      path: '/dashboard/admin/ev/workshops' },
    { icon: Truck,           label: 'Charging Fleet', path: '/dashboard/admin/ev/charging' },
    { icon: Users,           label: 'Technicians',    path: '/dashboard/admin/ev/workers' },
  ];

  return <SidebarShell nav={nav} label="EV Admin" mobile={mobile} onClose={onClose} navigate={navigate} location={location} />;
};

// ── Shared sidebar shell ──────────────────────────────────────────────────────
const SidebarShell = ({ nav, label, mobile, onClose, navigate, location }) => {
  const W = mobile ? '100%' : '240px';

  return (
    <>
      {/* Overlay on mobile */}
      {mobile && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 40 }}
        />
      )}

      <aside style={{
        width: W, minWidth: mobile ? 'unset' : '240px',
        background: '#0A1628',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        position: mobile ? 'fixed' : 'sticky',
        top: 0, left: 0, height: '100vh',
        zIndex: 50, transition: 'transform 0.3s',
        transform: mobile ? 'none' : undefined,
        fontFamily: "'DM Sans', sans-serif",
        overflowY: 'auto',
      }}>
        {/* Logo */}
        <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #00D4AA 0%, #00A882 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Zap size={18} color="#020617" />
            </div>
            <div>
              <p style={{ color: '#F8FAFC', fontWeight: 700, fontSize: '15px', margin: 0, fontFamily: "'Syne', sans-serif" }}>MotoMate EV</p>
              <p style={{ color: '#00D4AA', fontSize: '10px', margin: 0, fontWeight: 500 }}>{label}</p>
            </div>
          </div>
          {mobile && (
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
              <X size={18} color="#94A3B8" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '0 16px 8px' }} />

        {/* Nav items */}
        <nav style={{ flex: 1, padding: '8px 12px' }}>
          {nav.map(({ icon: Icon, label: l, path, danger }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <button
                key={path}
                onClick={() => { navigate(path); onClose && onClose(); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 12px', borderRadius: '10px', border: 'none',
                  background: active ? 'rgba(0,212,170,0.12)' : 'transparent',
                  color: active ? '#00D4AA' : danger ? '#F87171' : '#94A3B8',
                  cursor: 'pointer', marginBottom: '2px', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <Icon size={16} />
                <span style={{ fontSize: '14px', fontWeight: active ? 600 : 400, flex: 1 }}>{l}</span>
                {active && <ChevronRight size={14} />}
              </button>
            );
          })}
        </nav>

        {/* Bottom: logout */}
        <div style={{ padding: '16px 12px' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '12px' }} />
          <button
            onClick={() => { document.cookie = 'token=; Max-Age=0'; navigate('/login'); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '10px 12px', borderRadius: '10px', border: 'none',
              background: 'transparent', color: '#475569', cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = '#F87171'; e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}
          >
            <LogOut size={16} />
            <span style={{ fontSize: '14px' }}>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

// ── Mobile hamburger header ───────────────────────────────────────────────────
export const EVMobileHeader = ({ title, onMenuClick }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '12px',
    padding: '14px 16px',
    background: '#0A1628',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    position: 'sticky', top: 0, zIndex: 30,
  }}>
    <button onClick={onMenuClick} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
      <Menu size={20} color="#94A3B8" />
    </button>
    <Zap size={18} color="#00D4AA" />
    <span style={{ color: '#F8FAFC', fontWeight: 700, fontFamily: "'Syne', sans-serif", fontSize: '16px' }}>{title}</span>
  </div>
);