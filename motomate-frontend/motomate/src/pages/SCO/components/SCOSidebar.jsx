import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Wrench, Users, ClipboardList,
  UserCircle2, Car, ChevronRight, X, LogOut
} from 'lucide-react';

const NAV = [
  {
    section: 'Overview',
    links: [
      { to: '/dashboard/service-center-owner',          label: 'Dashboard',  icon: LayoutDashboard, end: true },
      { to: '/dashboard/service-center-owner/profile',  label: 'My Profile', icon: UserCircle2 },
    ],
  },
  {
    section: 'Operations',
    links: [
      { to: '/dashboard/service-center-owner/services', label: 'Services',  icon: Wrench },
      { to: '/dashboard/service-center-owner/workers',  label: 'Workers',   icon: Users },
      { to: '/dashboard/service-center-owner/requests', label: 'Requests',  icon: ClipboardList },
    ],
  },
];

const SCOSidebar = ({ mobileOpen, onClose, onLogout, centerName }) => (
  <>
    {mobileOpen && (
      <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
    )}

    <aside
      className={`
        fixed top-0 left-0 h-full w-64 z-40 flex flex-col shadow-2xl transition-transform duration-300
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto
      `}
      style={{
        background: 'linear-gradient(160deg, #4c1d95 0%, #6d28d9 45%, #7c3aed 100%)',
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <Car size={20} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-base leading-tight block">MotoMate</span>
            <span className="text-purple-300 text-[10px] font-semibold uppercase tracking-widest">Service Center</span>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Center name pill */}
      {centerName && (
        <div className="mx-4 mt-4 px-3 py-2 rounded-xl bg-white/10 backdrop-blur-sm">
          <p className="text-purple-200 text-[10px] font-bold uppercase tracking-wider">Center</p>
          <p className="text-white text-sm font-semibold truncate">{centerName}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5 scrollbar-hide">
        {NAV.map(({ section, links }) => (
          <div key={section}>
            <p className="text-purple-300/70 text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
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
                      ? 'bg-white text-purple-700 shadow-sm'
                      : 'text-purple-100 hover:bg-white/15 hover:text-white'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={16} className={isActive ? 'text-purple-600' : 'text-purple-300 group-hover:text-white'} />
                      <span className="flex-1 text-[13px]">{label}</span>
                      {isActive && <ChevronRight size={13} className="text-purple-400" />}
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
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-purple-200 hover:bg-white/15 hover:text-white transition-all text-sm font-medium group"
        >
          <LogOut size={16} className="group-hover:text-white transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  </>
);

export default SCOSidebar;