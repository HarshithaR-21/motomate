import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, BriefcaseBusiness, ClipboardCheck,
  History, Star, X, LogOut, Wrench, ChevronRight
} from 'lucide-react';

const NAV = [
  {
    section: 'Overview',
    links: [
      { to: '/dashboard/worker',          label: 'Dashboard',   icon: LayoutDashboard, end: true },
    ],
  },
  {
    section: 'Jobs',
    links: [
      { to: '/dashboard/worker/incoming', label: 'Incoming',    icon: BriefcaseBusiness },
      { to: '/dashboard/worker/current',  label: 'Current Job', icon: ClipboardCheck },
      { to: '/dashboard/worker/history',  label: 'History',     icon: History },
    ],
  },
  {
    section: 'Performance',
    links: [
      { to: '/dashboard/worker/ratings',  label: 'Ratings',     icon: Star },
    ],
  },
];

const WorkerSidebar = ({ mobileOpen, onClose, onLogout, workerName, centerName, status }) => {
  const statusConfig = {
    AVAILABLE:  { dot: 'bg-green-400',  label: 'Available',  text: 'text-green-700',  bg: 'bg-green-50 border-green-200' },
    BUSY:       { dot: 'bg-amber-400',  label: 'Busy',       text: 'text-amber-700',  bg: 'bg-amber-50 border-amber-200' },
    ON_LEAVE:   { dot: 'bg-gray-400',   label: 'On Leave',   text: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
    OFF_DUTY:   { dot: 'bg-gray-400',   label: 'Off Duty',   text: 'text-gray-600',   bg: 'bg-gray-50 border-gray-200' },
  };
  const sc = statusConfig[status] || statusConfig.AVAILABLE;

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40 flex flex-col transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
        style={{ background: 'linear-gradient(170deg, #14532d 0%, #166534 40%, #15803d 100%)' }}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Wrench size={18} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-base leading-tight block">MotoMate</span>
              <span className="text-green-300 text-[10px] font-semibold uppercase tracking-widest">Worker Portal</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Worker info */}
        <div className="mx-4 mt-4 p-3 rounded-xl bg-white/10 backdrop-blur-sm space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {(workerName || 'W').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{workerName || 'Worker'}</p>
              {centerName && (
                <p className="text-green-300 text-[10px] truncate">{centerName}</p>
              )}
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg border text-[11px] font-semibold ${sc.bg} ${sc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
            {sc.label}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5">
          {NAV.map(({ section, links }) => (
            <div key={section}>
              <p className="text-green-300/70 text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
                {section}
              </p>
              <div className="space-y-0.5">
                {links.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                      ${isActive
                        ? 'bg-white text-green-700 shadow-sm'
                        : 'text-green-100 hover:bg-white/15 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} className={isActive ? 'text-green-600' : 'text-green-300 group-hover:text-white'} />
                        <span className="flex-1 text-[13px]">{label}</span>
                        {isActive && <ChevronRight size={13} className="text-green-400" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 border-t border-white/10 pt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-green-200 hover:bg-white/15 hover:text-white transition-all text-sm font-medium group"
          >
            <LogOut size={16} className="group-hover:text-white transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default WorkerSidebar;
