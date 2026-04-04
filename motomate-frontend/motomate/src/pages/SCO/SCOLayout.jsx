import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SCOHeader from './components/SCOHeader';
import SCOSidebar from './components/SCOSidebar';


const SCOLayout = () => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Read user from localStorage (set after login)
    const stored = localStorage.getItem('scoUser');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('http://localhost:8080/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    localStorage.removeItem('scoUser');
    navigate('/login/service-center-owner');
  };

  return (
    <div className="flex h-screen bg-linear-to-br from-white via-purple-50/30 to-white overflow-hidden">
      <SCOSidebar
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        onLogout={handleLogout}
        centerName={user?.centerName || user?.businessName}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <SCOHeader
          onMenuClick={() => setMobileOpen(true)}
          ownerName={user?.name}
          centerName={user?.centerName || user?.businessName}
          onLogout={handleLogout}
        />

        <main className="flex-1 overflow-y-auto pt-16">
          <div className="p-6 lg:p-8">
            <Outlet context={{ user, ownerId: user?.id }} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SCOLayout;