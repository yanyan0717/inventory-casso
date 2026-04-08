import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, PlusCircle, Settings, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import logoUrl from '../assets/casso.png';

export default function Sidebar() {
  const navigate = useNavigate();
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Materials', path: '/materials', icon: Package },
    { name: 'Add Material', path: '/add-material', icon: PlusCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-gradient-to-b from-[#166534] to-[#14532d] text-white flex flex-col h-screen fixed top-0 left-0 shadow-2xl z-50">
      {/* Sidebar Header & Logo */}
      <div className="p-5 flex items-center gap-3 border-b border-white/10 shadow-lg">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-white/20">
          <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black tracking-wider uppercase font-[var(--heading)] truncate">Inventory</h2>
          <p className="text-[10px] text-white/60 uppercase tracking-widest font-[var(--sans)] truncate">Casso System</p>
        </div>
      </div>

      {/* Sidebar Navigation items */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${isActive
                  ? 'bg-white/20 text-white shadow-lg ring-1 ring-white/10'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>

                  <Icon
                    className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/70'
                      }`}
                  />

                  <span>{item.name}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer / Logout */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-red-500/20 hover:text-red-300 transition-all group  cursor-pointer"
        >
          <div className="p-1.5 rounded-md bg-white/5 group-hover:bg-red-500/20r">
            <LogOut className="w-4 h-4 text-green-400 group-hover:text-red-300 transition-colors " />
          </div>
          Logout
        </button>
      </div>
    </aside>
  );
}
