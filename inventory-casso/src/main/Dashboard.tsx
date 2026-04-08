import { Package, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Dashboard() {
  const stats = [
    { title: 'Total Materials', value: '2,451', icon: Package, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'New Allocations', value: '143', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Low Stock', value: '12', icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: 'Completed Requests', value: '89', icon: CheckCircle2, color: 'text-[#166534]', bg: 'bg-[#166534]/10' },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in-up">
      <div className="flex flex-col space-y-2 mb-2">
        <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)]">Dashboard Overview</h2>
        <p className="text-sm text-gray-500">Welcome back. Here is the latest summary of the inventory.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
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

      {/* Recent Activity Table (Static for now) */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 font-[var(--heading)]">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto flex-1 p-6">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="pb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {[
                { name: 'Office Chairs', category: 'Furniture', status: 'Added', date: 'Oct 24, 2026' },
                { name: 'Bond Paper A4', category: 'Supplies', status: 'Restocked', date: 'Oct 23, 2026' },
                { name: 'Dell Monitor', category: 'Electronics', status: 'Assigned', date: 'Oct 21, 2026' },
                { name: 'Staplers', category: 'Supplies', status: 'Low Stock', date: 'Oct 20, 2026' },
                { name: 'Filing Cabinets', category: 'Furniture', status: 'Added', date: 'Oct 19, 2026' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 font-medium text-gray-800">{row.name}</td>
                  <td className="py-4 text-gray-500">{row.category}</td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium 
                      ${row.status === 'Added' ? 'bg-green-100 text-green-700' : 
                        row.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' :
                        row.status === 'Assigned' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'}`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-4 text-gray-500">{row.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
