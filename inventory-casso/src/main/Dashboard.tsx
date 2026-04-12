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

  const stockByCategoryDate = materials
    .filter(m => m.created_at)
    .reduce((acc, m) => {
      const date = new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[date]) acc[date] = {};
      acc[date][m.category] = (acc[date][m.category] || 0) + m.stocks;
      return acc;
    }, {} as Record<string, Record<string, number>>);

  const sortedDates = Object.keys(stockByCategoryDate).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  
  const categories = [...new Set(materials.map(m => m.category))];

  const maxCatStock = Math.max(...categories.flatMap(cat => 
    sortedDates.map(date => stockByCategoryDate[date]?.[cat] || 0)
  ), 1);

  const categoryColorMap: Record<string, string> = {
    furniture: '#166534',
    electronics: '#3b82f6',
    supplies: '#8b5cf6',
    other: '#6b7280',
  };

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
    { title: 'Total Materials', value: totalMaterials.toLocaleString(), icon: Package, color: 'text-blue-800', bg: 'bg-blue-100' },
    { title: 'Total Stock', value: totalStock.toLocaleString(), icon: TrendingUp, color: 'text-green-800', bg: 'bg-green-100' },
    { title: 'Low Stock', value: lowStock, icon: AlertTriangle, color: 'text-orange-800', bg: 'bg-orange-100' },
    { title: 'Out of Stock', value: outOfStock, icon: CheckCircle2, color: 'text-red-800', bg: 'bg-red-100' },
  ];

  const categoryColors: Record<string, string> = {
    furniture: 'bg-[#166534]',
    electronics: 'bg-blue-500',
    supplies: 'bg-purple-500',
    other: 'bg-gray-500',
  };

  return (
    <div className="flex flex-col space-y-4 relative w-full max-w-full">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)] tracking-tight">Dashboard Overview</h2>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              className={`${stat.bg} rounded-md p-5 shadow-sm border border-gray-200 flex items-center gap-4 hover:shadow-md transition-shadow`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${stat.bg}`}>
                <Icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className={`text-sm font-medium ${stat.color} mb-0.5`}>{stat.title}</p>
                <h3 className={`text-xl font-bold ${stat.color}`}>{stat.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bar Chart - Stock by Category */}
        <div className="bg-white rounded-md p-5 shadow-sm border border-gray-200">
          <h3 className="text-base font-bold text-gray-800 font-[var(--heading)] mb-4">Stock by Category</h3>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-gray-400">Loading...</div>
          ) : categoryLabels.length === 0 ? (
            <div className="h-40 flex items-center justify-center text-gray-400">No data available</div>
          ) : (
            <div className="space-y-3">
              {categoryLabels.map((cat) => {
                const value = categoryData[cat];
                const percentage = (value / maxStock) * 100;
                return (
                  <div key={cat} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium text-gray-700">{cat}</span>
                      <span className="text-gray-500">{value} units</span>
                    </div>
                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${categoryColors[cat] || 'bg-[#166534]'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stock Status Distribution */}
        <div className="bg-white rounded-md p-5 shadow-sm border border-gray-200">
          <h3 className="text-base font-bold text-gray-800 font-[var(--heading)] mb-4">Stock Status Distribution</h3>
          {loading ? (
            <div className="h-40 flex items-center justify-center text-gray-400">Loading...</div>
          ) : (
            <div className="flex items-center justify-center">
              <div className="relative w-32 h-32">
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
                        style={{ strokeDashoffset: 0 }}
                      />
                      <circle 
                        cx="18" cy="18" r="15.9" 
                        fill="none" 
                        stroke="#f97316" 
                        strokeWidth="3"
                        strokeDasharray={`${(lowStock / totalMaterials) * 100} 100`}
                        strokeDashoffset={-((materials.filter(m => m.stocks >= 6).length / totalMaterials) * 100)}
                      />
                      <circle 
                        cx="18" cy="18" r="15.9" 
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="3"
                        strokeDasharray={`${(outOfStock / totalMaterials) * 100} 100`}
                        strokeDashoffset={-((materials.filter(m => m.stocks >= 6).length + lowStock) / totalMaterials) * 100}
                      />
                    </>
                  )}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-gray-800">{totalMaterials}</span>
                </div>
              </div>
              <div className="ml-6 space-y-2">
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

      {/* Stock Trend Line Graph */}
      <div className="bg-white rounded-md p-5 shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800 font-[var(--heading)]">Stock Trend</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <div key={cat} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColorMap[cat] || categoryColorMap.other }} />
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{cat}</span>
              </div>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="h-40 flex items-center justify-center text-gray-400">Loading...</div>
        ) : sortedDates.length === 0 ? (
          <div className="h-40 flex items-center justify-center text-gray-400">No data available</div>
        ) : (
          <div className="relative h-48 w-full">
            <svg viewBox="0 0 1200 160" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              {/* Grid Lines */}
              {[0, 25, 50, 75, 100].map((tick) => {
                const y = 140 - (tick / 100 * 120);
                return (
                  <line key={tick} x1="0" y1={y} x2="1200" y2={y} stroke="#eee" strokeWidth="1" strokeDasharray="4 4" />
                );
              })}
              
              {categories.map((cat) => {
                const color = categoryColorMap[cat] || categoryColorMap.other;
                const points = sortedDates.map((date, i) => {
                  const x = (i / (sortedDates.length - 1 || 1)) * 1200;
                  const catStock = stockByCategoryDate[date]?.[cat] || 0;
                  const y = 140 - ((catStock / maxCatStock) * 120);
                  return { x, y };
                });
                
                const pointsStr = points.map(p => `${p.x},${p.y}`).join(' ');
                const areaPoints = `0,140 ${pointsStr} 1200,140`;
                
                return (
                  <g key={cat}>
                    <defs>
                      <linearGradient id={`gradient-${cat}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={color} stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <polygon fill={`url(#gradient-${cat})`} points={areaPoints} className="transition-all duration-700" />
                    <polyline
                      fill="none"
                      stroke={color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      points={pointsStr}
                      className="transition-all duration-700"
                    />
                    {points.map((p, i) => (
                      <circle 
                        key={i} 
                        cx={p.x} 
                        cy={p.y} 
                        r="3" 
                        fill="white" 
                        stroke={color} 
                        strokeWidth="2" 
                        className="hover:r-4 transition-all"
                      />
                    ))}
                  </g>
                );
              })}
              {sortedDates.map((date, i) => {
                const x = (i / (sortedDates.length - 1 || 1)) * 1200;
                return (
                  <text key={date} x={x} y="158" fontSize="9" fontWeight="bold" textAnchor={i === 0 ? 'start' : i === sortedDates.length - 1 ? 'end' : 'middle'} fill="#999" className="uppercase tracking-tighter">{date}</text>
                );
              })}
            </svg>
          </div>
        )}
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-800 font-[var(--heading)]">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
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
              <tbody className="text-sm divide-y divide-gray-50">
                {recentMaterials.map((mat) => {
                  const status = getStatus(mat.stocks);
                  return (
                    <tr key={mat.id} className="hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                      <td className="px-6 py-1.5 font-mono text-[10px] text-slate-800 font-bold tracking-tight">{mat.material_id}</td>
                      <td className="px-6 py-1.5 text-slate-800 text-sm">{mat.name}</td>
                      <td className="px-6 py-1.5 text-slate-800 text-sm capitalize">{mat.category}</td>
                      <td className="px-6 py-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-1.5 text-slate-500 text-xs">{formatDate(mat.created_at)}</td>
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
