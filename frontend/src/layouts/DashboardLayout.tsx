import React, { useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { Activity, LayoutDashboard, Users, Hospital, Stethoscope, Ambulance, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function DashboardLayout() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Activity className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">MedSync AI</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <NavItem to="/dashboard" icon={<LayoutDashboard size={20} />} label="Dashboard" />
          {isSuperAdmin && <NavItem to="/hospitals" icon={<Hospital size={20} />} label="Hospitals" />}
          <NavItem to="/doctors" icon={<Stethoscope size={20} />} label="Doctors" />
          <NavItem to="/nurses" icon={<Activity size={20} />} label="Nurses" />
          <NavItem to="/patients" icon={<Users size={20} />} label="Patients" />
          <NavItem to="/icu-or" icon={<Activity size={20} />} label="ICU & OR" />
          <NavItem to="/equipment" icon={<Settings size={20} />} label="Equipment" />
          <NavItem to="/ambulances" icon={<Ambulance size={20} />} label="Ambulances" />
          <NavItem to="/command" icon={<Activity size={20} />} label="Emergency Command Center" />
        </nav>
        
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50">
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6">
          <div className="text-sm text-slate-500 font-medium">
            {isSuperAdmin ? 'Global Platform Administration' : 'Hospital Administration Module'}
          </div>
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center font-semibold text-blue-700" title="Super Admin">
              {isSuperAdmin ? 'SA' : 'HA'}
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-auto p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function NavItem({ to, icon, label }: { to: string, icon: React.ReactNode, label: string }) {
  return (
    <NavLink 
      to={to}
      end={to === '/dashboard'} // exact match for dashboard
      className={({ isActive }) => 
        `flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-colors ${
          isActive 
            ? 'bg-primary/10 text-primary font-medium' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-50'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  );
}
