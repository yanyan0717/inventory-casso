import { useState } from 'react';
import { Plus, X, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';

export default function AddMaterial() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    material_id: '',
    name: '',
    category: '',
    stocks: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.material_id || !formData.name || !formData.category) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    setSaving(true);
    const materialData = {
      material_id: formData.material_id,
      name: formData.name,
      category: formData.category,
      stocks: parseInt(formData.stocks) || 0,
      description: formData.description,
    };

    const { error } = await supabase.from('materials').insert(materialData);
    
    setSaving(false);

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('Material added successfully!', 'success');
      setIsModalOpen(false);
      // Automatically route back to materials table after successful add
      navigate('/materials');
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative">
      
      {/* Huge Plus Icon Button as requested */}
      <div className="text-center flex flex-col items-center">
        <h2 className="text-3xl text-gray-800 font-[var(--heading)] tracking-tight mb-2">New Entry</h2>
        <p className="text-gray-500 mb-10 max-w-sm">Click the button below to register a brand new item into the inventory system.</p>
        
        <button 
          onClick={() => setIsModalOpen(true)}
          className="group relative flex items-center justify-center w-32 h-32 bg-[#166534] hover:bg-[#14532d] shadow-2xl hover:shadow-[0_8px_40px_rgba(22,101,52,0.5)] rounded-full transition-all duration-300 hover:scale-105 active:scale-95"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-black/0 via-white/5 to-white/20 rounded-full"></div>
          <Plus className="w-16 h-16 text-white group-hover:rotate-90 transition-transform duration-500" />
        </button>
      </div>

      {/* Modern Small Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl overflow-hidden relative transform scale-100 transition-transform border border-gray-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-lg">Add Material</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Material ID</label>
                  <input 
                    type="text" 
                    value={formData.material_id}
                    onChange={(e) => setFormData({...formData, material_id: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all outline-none font-medium"
                    placeholder="e.g. MAT-001"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Item Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all outline-none font-medium"
                    placeholder="e.g. Printer Paper"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Category</label>
                    <select 
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all outline-none font-medium"
                      required
                    >
                      <option value="">Select...</option>
                      <option value="furniture">Furniture</option>
                      <option value="electronics">Electronics</option>
                      <option value="supplies">Supplies</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Stock Qty</label>
                    <input 
                      type="number" 
                      value={formData.stocks}
                      onChange={(e) => setFormData({...formData, stocks: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all outline-none font-bold"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Description</label>
                  <textarea 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={2}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all outline-none resize-none"
                    placeholder="Brief details..."
                  ></textarea>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-[#166534] hover:bg-[#14532d] text-white py-3 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Adding...' : 'Add Material'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
