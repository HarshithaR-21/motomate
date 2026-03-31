import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, ShieldCheck, MessageSquare,
  Wrench, BarChart2, FileBarChart, LogOut, Car,
  Building2, Users, ChevronRight, X, UserCog, Truck
} from 'lucide-react';

const NAV_ITEMS = [
  {
    section: 'Overview',
    links: [
      { to: '/admin',       label: 'Dashboard', icon: LayoutDashboard, end: true },
      { to: '/admin/analytics', label: 'Analytics', icon: BarChart2 },
    ],
  },
  {
    section: 'Verifications',
    links: [
      { to: '/admin/verifications/service-centers', label: 'Service Centers', icon: Building2 },
      { to: '/admin/verifications/fleet-managers',  label: 'Fleet Managers',  icon: Truck },
    ],
  },
  {
    section: 'Operations',
    links: [
      { to: '/admin/issues',   label: 'Issues',          icon: MessageSquare },
      { to: '/admin/services', label: 'Bookings',        icon: Wrench },
    ],
  },
  {
    section: 'Data Management',
    links: [
      { to: '/admin/users',           label: 'All Users',       icon: Users },
      { to: '/admin/service-centers', label: 'Service Centers', icon: Building2 },
      { to: '/admin/fleet-managers',  label: 'Fleet Managers',  icon: Truck },
      { to: '/admin/workers',         label: 'Workers',         icon: UserCog },
    ],
  },
  {
    section: 'Reports',
    links: [
      { to: '/admin/reports', label: 'Reports', icon: FileBarChart },
    ],
  },
];

const Sidebar = ({ mobileOpen, onClose, onLogout }) => {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 lg:hidden" onClick={onClose} />
      )}

      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-40
          bg-linear-to-b from-red-700 via-red-600 to-red-700
          flex flex-col shadow-2xl transition-transform duration-300
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:static lg:z-auto
        `}
      >
        {/* Logo */}
        <div className="px-5 py-5 flex items-center justify-between border-b border-red-500/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Car size={20} className="text-white" />
            </div>
            <div>
              <span className="text-white font-bold text-lg leading-tight block">MotoMate</span>
              <span className="text-red-200 text-[10px] font-semibold uppercase tracking-widest">Admin Panel</span>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden text-white/60 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4 scrollbar-hide">
          {NAV_ITEMS.map(({ section, links }) => (
            <div key={section}>
              <p className="text-red-300/70 text-[10px] font-bold uppercase tracking-widest px-3 mb-1.5">
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
                        ? 'bg-white text-red-700 shadow-sm'
                        : 'text-red-100 hover:bg-white/15 hover:text-white'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon size={16} className={isActive ? 'text-red-600' : 'text-red-200 group-hover:text-white'} />
                        <span className="flex-1 text-[13px]">{label}</span>
                        {isActive && <ChevronRight size={13} className="text-red-400" />}
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="px-3 pb-5 border-t border-red-500/30 pt-4">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-200 hover:bg-white/15 hover:text-white transition-all text-sm font-medium group"
          >
            <LogOut size={16} className="group-hover:text-white transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
