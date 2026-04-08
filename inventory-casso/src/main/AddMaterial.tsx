import { Save, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AddMaterial() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col space-y-6 animate-fade-in-up">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)]">Add New Material</h2>
        <p className="text-sm text-gray-500">Register a new item into the inventory system.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <form className="p-8 space-y-6">
          
          <div className="space-y-4 shadow-sm border border-gray-50 p-6 rounded-lg bg-gray-50/30">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Basic Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Item Name</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none"
                  placeholder="e.g. Executive Desk"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Category</label>
                <select className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none">
                  <option value="">Select a category</option>
                  <option value="furniture">Furniture</option>
                  <option value="electronics">Electronics</option>
                  <option value="supplies">Office Supplies</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea 
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none resize-none"
                placeholder="Brief description of the material..."
              ></textarea>
            </div>
          </div>

          <div className="space-y-4 shadow-sm border border-gray-50 p-6 rounded-lg bg-gray-50/30">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Inventory Data</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Initial Stock</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none"
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Unit of Measurement</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none"
                  placeholder="e.g. pcs, boxes, reams"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Reorder Level (Alert)</label>
                <input 
                  type="number" 
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none"
                  placeholder="10"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-4 border-t border-gray-100">
            <Link 
              to="/materials" 
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Link>
            <button 
              type="button" 
              className="bg-[#166534] hover:bg-[#14532d] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save Material
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
