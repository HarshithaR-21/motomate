import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, Truck, UserCog,
  MessageSquare, ShieldCheck, Menu, X, LogOut, Settings,
  Bell, Search, ChevronRight, Gauge
} from 'lucide-react';

const NavItem = ({ to, icon: Icon, label, badge, onClick }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
        isActive
          ? 'bg-red-600 text-white shadow-lg shadow-red-600/20'
          : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
      }`
    }
  >
    {({ isActive }) => (
      <>
        <Icon size={20} className={isActive ? '' : 'group-hover:scale-110 transition-transform'} />
        <span className="font-semibold text-sm flex-1">{label}</span>
        {badge && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isActive ? 'bg-white/20 text-white' : 'bg-red-100 text-red-600'
          }`}>
            {badge}
          </span>
        )}
        {isActive && <ChevronRight size={16} />}
      </>
    )}
  </NavLink>
);

const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/admin/users', icon: Users, label: 'Users' },
    { to: '/admin/service-centers', icon: Building2, label: 'Service Centers' },
    { to: '/admin/fleet-managers', icon: Truck, label: 'Fleet Managers' },
    { to: '/admin/workers', icon: UserCog, label: 'Workers' },
    { to: '/admin/issues', icon: MessageSquare, label: 'Issues', badge: '3' },
    { to: '/admin/verifications', icon: ShieldCheck, label: 'Verifications', badge: '5' },
  ];

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-white to-red-50/30">
      {/* Vehicle Watermark Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015] z-0">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 50h60M15 50l5-10h60l5 10M15 50l-5 15h80l-5-15M25 65v5M75 65v5M30 40v-5h40v5' stroke='%23dc2626' fill='none' stroke-width='1.5'/%3E%3Ccircle cx='25' cy='70' r='8' stroke='%23dc2626' fill='none' stroke-width='1.5'/%3E%3Ccircle cx='75' cy='70' r='8' stroke='%23dc2626' fill='none' stroke-width='1.5'/%3E%3C/svg%3E")`,
          backgroundSize: '120px 120px',
        }}/>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200">
        <div className="px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo & Brand */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center text-gray-700 hover:text-red-600 transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-600/30">
                  <Gauge size={24} className="text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-gray-900 leading-none">AutoCare</h1>
                  <p className="text-[10px] text-gray-500 font-medium leading-none mt-0.5">Admin Portal</p>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users, centers, issues..."
                  className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-300 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button className="relative w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center text-gray-700 hover:text-red-600 transition-colors">
                <Bell size={20} />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full ring-2 ring-white" />
              </button>
              <button className="w-10 h-10 rounded-xl hover:bg-red-50 flex items-center justify-center text-gray-700 hover:text-red-600 transition-colors">
                <Settings size={20} />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-2" />
              <button className="flex items-center gap-3 pl-3 pr-4 py-2 rounded-xl hover:bg-red-50 transition-colors group">
                <div className="w-8 h-8 bg-linear-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                  A
                </div>
                <div className="hidden xl:block text-left">
                  <p className="text-sm font-semibold text-gray-900 leading-none">Admin User</p>
                  <p className="text-[11px] text-gray-500 leading-none mt-0.5">admin@autocare.com</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-16 left-0 h-[calc(100vh-4rem)] z-30
          w-64 bg-white border-r border-gray-200
          transition-transform duration-300 lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <NavItem
                key={item.to}
                {...item}
                onClick={() => setSidebarOpen(false)}
              />
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 bg-linear-to-t from-gray-50 to-white">
            <button
              onClick={() => {
                navigate('/login');
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 hover:bg-red-50 transition-colors group"
            >
              <LogOut size={20} className="group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-sm">Sign Out</span>
            </button>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-w-0 relative z-10">
          <div className="px-4 lg:px-8 py-8">
            {children}
          </div>

          {/* Footer */}
          <footer className="px-4 lg:px-8 py-6 border-t border-gray-200 bg-white/50">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <p>© 2024 AutoCare. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <button className="hover:text-red-600 transition-colors font-medium">Privacy</button>
                <button className="hover:text-red-600 transition-colors font-medium">Terms</button>
                <button className="hover:text-red-600 transition-colors font-medium">Support</button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
