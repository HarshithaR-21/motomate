import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wrench, Calendar, BarChart3, Users, LogOut } from 'lucide-react';

const NAV = [
  { label: 'Overview',  icon: LayoutDashboard, href: '/dashboard/sco' },
  { label: 'Services',  icon: Wrench,          href: '/dashboard/sco/services' },
  { label: 'Bookings',  icon: Calendar,        href: '/dashboard/sco/bookings' },
  { label: 'Workers',   icon: Users,           href: '/dashboard/sco/workers' },
  { label: 'Reports',   icon: BarChart3,       href: '/dashboard/sco/reports' },
];

const SCOHeader = ({ ownerName, onLogout }) => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white border-b border-orange-100 shadow-sm">
      
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-200">
            <Wrench size={18} className="text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-gray-900">
            Moto<span className="text-orange-500">Mate</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-1">
          {NAV.map(({ label, icon: Icon, href }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                to={href}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200
                  ${active
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-200'
                    : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                  }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          
          <div className="hidden sm:flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-full px-4 py-1.5">
            <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs font-semibold text-orange-700">
              Service Owner
            </span>
          </div>

          <button
            onClick={onLogout}
            className="w-9 h-9 flex items-center justify-center rounded-xl border border-gray-200 text-gray-500 hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-3 overflow-x-auto">
        {NAV.map(({ label, icon: Icon, href }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              to={href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all
                ${active
                  ? 'bg-orange-500 text-white'
                  : 'text-gray-600 hover:bg-orange-50 hover:text-orange-600'
                }`}
            >
              <Icon size={14} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default SCOHeader;