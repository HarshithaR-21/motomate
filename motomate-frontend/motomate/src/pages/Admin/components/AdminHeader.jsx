import { Link } from 'react-router-dom';
import { Building2, Car, LayoutDashboard, MessageSquare, ShieldCheck, Truck, Users } from 'lucide-react';
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Toaster, toast } from "react-hot-toast";

const AdminHeader = () => {
  const dashboardNav = [
    { label: 'Overview', icon: LayoutDashboard, href: '#charts' },
    { label: 'Users', icon: Users, href: '#metrics' },
    { label: 'Service Centers', icon: Building2, href: '#charts' },
    { label: 'Fleet Managers', icon: Truck, href: '#activity' },
    { label: 'Issues', icon: MessageSquare, href: '#activity' },
    { label: 'Verifications', icon: ShieldCheck, href: '#activity' },
  ];
  const navigate = useNavigate();
    const handleLogout = async () => {
        const response = await axios.get("http://localhost:8080/api/auth/logout", { withCredentials: true });
        if (response.status === 200) {
            toast.success("Logged out successfully!");
            setTimeout(() => {
                navigate('/login');
            }, 2000)
        } else {
            toast.error("Logout failed. Please try again.");
            console.error("Logout failed:", response);
        }
    }
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-5 bg-red-600 text-white shadow-xl border-b border-red-700">
      <Toaster />
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shadow-lg">
            <Car size={24} className="text-white" />
          </div>

          <Link to="/">
            <span className="text-2xl font-bold tracking-tight">
              Moto<span className="text-white/90">Mate</span>
            </span>
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 w-full">
          {dashboardNav.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="group rounded-3xl border border-gray-100 bg-white px-4 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-red-200 hover:bg-red-50/80"
            >
              <div className="flex items-center gap-2 justify-center">
                <item.icon size={18} className="text-red-600" />
                {item.label}
              </div>
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          <button className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-700" onClick={handleLogout}>
            Logout
          </button>
        </div>
        <div className="flex">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.25em] text-red-700">
              Admin dashboard
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default AdminHeader;
