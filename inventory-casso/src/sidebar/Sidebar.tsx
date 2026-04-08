import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Package, PlusCircle, Settings, LogOut } from 'lucide-react';
import logoUrl from '../assets/casso.png';

export default function Sidebar() {
  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Materials', path: '/materials', icon: Package },
    { name: 'Add Material', path: '/add-material', icon: PlusCircle },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#166534] text-white flex flex-col h-screen fixed top-0 left-0 shadow-xl z-50">
      {/* Sidebar Header & Logo */}
      <div className="p-6 flex items-center gap-4 border-b border-[#14532d] shadow-sm">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-white/10 flex items-center justify-center shrink-0">
          <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
        </div>
        <div>
          <h2 className="text-sm font-black tracking-widest uppercase font-[var(--heading)]">Inventory</h2>
          <p className="text-[10px] text-white/70 uppercase tracking-widest font-[var(--sans)]">Casso System</p>
        </div>
      </div>

      {/* Sidebar Navigation items */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="px-2 mb-2 text-xs font-semibold text-green-200/50 uppercase tracking-wider">
          Main Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-white text-[#166534] shadow-md'
                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-[#166534]' : 'text-green-200'
                    }`}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer / Logout */}
      <div className="p-4 border-t border-[#14532d]">
        <button
          onClick={async () => {
            await import('../lib/supabase').then(({ supabase }) => supabase.auth.signOut());
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white transition-all group"
        >
          <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-300 transition-colors" />
          Logout
        </button>
      </div>
    </aside>
  );
}
