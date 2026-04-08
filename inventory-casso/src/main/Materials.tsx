import { useState } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2 } from 'lucide-react';

export default function Materials() {
  const [searchTerm, setSearchTerm] = useState('');

  // Static data for now as requested
  const materials = [
    { id: 'MAT-001', name: 'Office Chairs', category: 'Furniture', stock: 45, unit: 'pcs', status: 'In Stock' },
    { id: 'MAT-002', name: 'Bond Paper A4', category: 'Supplies', stock: 120, unit: 'reams', status: 'In Stock' },
    { id: 'MAT-003', name: 'Dell Monitor 24"', category: 'Electronics', stock: 8, unit: 'pcs', status: 'Low Stock' },
    { id: 'MAT-004', name: 'Staplers', category: 'Supplies', stock: 0, unit: 'pcs', status: 'Out of Stock' },
    { id: 'MAT-005', name: 'Filing Cabinets', category: 'Furniture', stock: 12, unit: 'pcs', status: 'In Stock' },
  ];

  return (
    <div className="h-full flex flex-col space-y-6 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)]">Materials Inventory</h2>
          <p className="text-sm text-gray-500">Manage and view all documented materials in the system.</p>
        </div>
        <button className="bg-[#166534] hover:bg-[#14532d] text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors shadow-sm flex items-center gap-2">
          Export Data
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between gap-4">
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 group-focus-within:text-[#166534]" />
            </div>
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none"
            />
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Item ID</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Stock</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-gray-50">
              {materials.map((mat) => (
                <tr key={mat.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{mat.id}</td>
                  <td className="px-6 py-4 font-medium text-gray-800">{mat.name}</td>
                  <td className="px-6 py-4 text-gray-600">{mat.category}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-semibold text-gray-700">{mat.stock}</span>
                    <span className="text-gray-400 ml-1 text-xs">{mat.unit}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5
                      ${mat.status === 'In Stock' ? 'bg-green-100 text-green-700' : 
                        mat.status === 'Low Stock' ? 'bg-orange-100 text-orange-700' : 
                        'bg-red-100 text-red-700'}`}>
                      {mat.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <p>Showing 1 to 5 of 2,451 entries</p>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Prev</button>
            <button className="px-3 py-1 bg-[#166534] text-white rounded font-medium">1</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">3</button>
            <button className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
