import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Sidebar from '../sidebar/Sidebar';

export default function Layout() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        navigate('/', { replace: true });
        return;
      }

      setLoading(false);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((session) => {
      if (!session) {
        navigate('/', { replace: true });
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-[var(--sans)]">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col h-screen overflow-y-auto w-full">
        {/* Main Header / Topbar (optional, but good for design) */}
        <header className="bg-white border-b border-gray-200 h-[72px] flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm shrink-0">
          <h1 className="text-lg font-bold text-gray-800 font-[var(--heading)]">Inventory
            CASSO System</h1>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
