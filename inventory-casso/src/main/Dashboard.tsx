import { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Material {
  id: string;
  material_id: string;
  name: string;
  category: string;
  stocks: number;
  description: string;
  created_at: string;
}

export default function Dashboard() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [animate, setAnimate] = useState(false);

  const fetchMaterials = async () => {
    const { data } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    setMaterials(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setAnimate(true), 100);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const totalMaterials = materials.length;
  const totalStock = materials.reduce((sum, m) => sum + m.stocks, 0);
  const lowStock = materials.filter(m => m.stocks > 0 && m.stocks < 6).length;
  const outOfStock = materials.filter(m => m.stocks === 0).length;

  const categoryData = materials.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + m.stocks;
    return acc;
  }, {} as Record<string, number>);

  const categoryLabels = Object.keys(categoryData);
  const maxStock = Math.max(...Object.values(categoryData), 1);

  const recentMaterials = materials.slice(0, 5);

  const getStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', class: 'bg-red-100 text-red-700' };
    if (stock < 6) return { label: 'Low Stock', class: 'bg-orange-100 text-orange-700' };
    return { label: 'In Stock', class: 'bg-green-100 text-green-700' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const stats = [
    { title: 'Total Materials', value: totalMaterials.toLocaleString(), icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Total Stock', value: totalStock.toLocaleString(), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Low Stock', value: lowStock, icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Out of Stock', value: outOfStock, icon: CheckCircle2, color: 'text-red-600', bg: 'bg-red-100' },
  ];

  const categoryColors: Record<string, string> = {
    furniture: 'bg-[#166534]',
    electronics: 'bg-blue-500',
    supplies: 'bg-purple-500',
    other: 'bg-gray-500',
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)]">Dashboard Overview</h2>
          <p className="text-sm text-gray-500">Here is the latest summary of the inventory.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow"
              style={{ opacity: animate ? 1 : 0, transform: animate ? 'translateY(0)' : 'translateY(20px)', transition: `opacity 0.4s ease ${idx * 0.1}s, transform 0.4s ease ${idx * 0.1}s` }}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">{stat.title}</p>
                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Stock by Category */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 font-[var(--heading)] mb-6">Stock by Category</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400">Loading...</div>
          ) : categoryLabels.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-gray-400">No data available</div>
          ) : (
            <div className="space-y-4">
              {categoryLabels.map((cat, idx) => {
                const value = categoryData[cat];
                const percentage = animate ? (value / maxStock) * 100 : 0;
                return (
                  <div key={cat} className="space-y-2" style={{ opacity: animate ? 1 : 0, transition: `opacity 0.3s ease ${idx * 0.1}s` }}>
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium text-gray-700">{cat}</span>
                      <span className="text-gray-500">{value} units</span>
                    </div>
                    <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${categoryColors[cat] || 'bg-[#166534]'}`}
                        style={{ width: animate ? `${percentage}%` : '0%', transition: `width 0.8s ease ${idx * 0.15 + 0.2}s` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stock Status Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 font-[var(--heading)] mb-6">Stock Status Distribution</h3>
          {loading ? (
            <div className="h-48 flex items-center justify-center text-gray-400">Loading...</div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="relative w-40 h-40">
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#eee" strokeWidth="3" />
                  {totalMaterials > 0 && (
                    <>
                      <circle 
                        cx="18" cy="18" r="15.9" 
                        fill="none" 
                        stroke="#166534" 
                        strokeWidth="3"
                        strokeDasharray={`${(materials.filter(m => m.stocks >= 6).length / totalMaterials) * 100} 100`}
                        style={{ strokeDashoffset: animate ? 0 : 100, transition: 'stroke-dashoffset 0.8s ease 0.3s' }}
                      />
                      <circle 
                        cx="18" cy="18" r="15.9" 
                        fill="none" 
                        stroke="#f97316" 
                        strokeWidth="3"
                        strokeDasharray={`${(lowStock / totalMaterials) * 100} 100`}
                        strokeDashoffset={animate ? `-${(materials.filter(m => m.stocks >= 6).length / totalMaterials) * 100}` : 0}
                        style={{ transition: 'stroke-dashoffset 0.8s ease 0.5s' }}
                      />
                      <circle 
                        cx="18" cy="18" r="15.9" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="3"
                        strokeDasharray={`${(outOfStock / totalMaterials) * 100} 100`}
                        strokeDashoffset={animate ? `-${((materials.filter(m => m.stocks >= 6).length + lowStock) / totalMaterials) * 100}` : 0}
                        style={{ transition: 'stroke-dashoffset 0.8s ease 0.7s' }}
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold text-gray-800 transition-all duration-500 ${animate ? 'opacity-100' : 'opacity-0'}`}>{totalMaterials}</span>
                </div>
              </div>
              <div className="ml-8 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#166534]"></div>
                  <span className="text-sm text-gray-600">In Stock ({materials.filter(m => m.stocks >= 6).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                  <span className="text-sm text-gray-600">Low Stock ({lowStock})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-600">Out of Stock ({outOfStock})</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 font-[var(--heading)]">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto flex-1">
          {loading ? (
            <div className="text-center text-gray-400 py-8">Loading...</div>
          ) : recentMaterials.length === 0 ? (
            <div className="text-center text-gray-400 py-8">No recent activity</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200">
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Item ID</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Item Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentMaterials.map((mat) => {
                  const status = getStatus(mat.stocks);
                  return (
                    <tr key={mat.id} className="border-b border-gray-50 hover:bg-[#f0fdf4]/30 transition-colors">
                      <td className="px-6 py-2.5 font-mono text-[11px] text-gray-500 font-bold">{mat.material_id}</td>
                      <td className="px-6 py-2.5 font-bold text-sm text-gray-800">{mat.name}</td>
                      <td className="px-6 py-2.5 text-gray-500 text-sm font-semibold capitalize">{mat.category}</td>
                      <td className="px-6 py-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-2.5 text-gray-500 text-xs">{formatDate(mat.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
