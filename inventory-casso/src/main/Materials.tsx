import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2, Eye, X, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';

interface Material {
  id: string;
  material_id: string;
  name: string;
  category: string;
  stocks: number;
  description: string;
}

export default function Materials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    id: '',
    material_id: '',
    name: '',
    category: '',
    stocks: '',
    description: '',
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      showToast('Failed to load materials', 'error');
    } else {
      setMaterials(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    const { error } = await supabase.from('materials').delete().eq('id', id);
    
    if (error) {
      showToast('Failed to delete material', 'error');
    } else {
      showToast('Material deleted successfully', 'success');
      fetchMaterials();
    }
  };

  const openModal = (mode: 'add' | 'edit' | 'view', material?: Material) => {
    setModalMode(mode);
    if (material) {
      setFormData({
        id: material.id,
        material_id: material.material_id || '',
        name: material.name,
        category: material.category,
        stocks: material.stocks.toString(),
        description: material.description || '',
      });
    } else {
      setFormData({ id: '', material_id: '', name: '', category: '', stocks: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === 'view') {
      closeModal();
      return;
    }
    
    if (!formData.name || !formData.category) {
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

    let error;
    if (modalMode === 'edit') {
      ({ error } = await supabase.from('materials').update(materialData).eq('id', formData.id));
    } else {
      ({ error } = await supabase.from('materials').insert(materialData));
    }

    setSaving(false);

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast(modalMode === 'edit' ? 'Material updated successfully' : 'Material added successfully', 'success');
      closeModal();
      fetchMaterials();
    }
  };

  const getStatus = (stock: number) => {
    if (stock === 0) return { label: 'Out of Stock', class: 'bg-red-100 text-red-700' };
    if (stock < 6) return { label: 'Low Stock', class: 'bg-orange-100 text-orange-700' };
    return { label: 'In Stock', class: 'bg-green-100 text-green-700' };
  };

  const filteredMaterials = materials.filter((mat) =>
    mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mat.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col space-y-4 relative w-full max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)] tracking-tight">Materials</h2>
          <p className="text-sm text-gray-600 mt-1 font-medium">Manage and track your supplies efficiently.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => openModal('add')}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-[#166534] px-5 py-1.5 rounded-md hover:bg-[#14532d] transition-all active:scale-95 shadow-sm"
          >
            Add Item
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-400 font-medium">Loading materials...</div>
            </div>
          ) : filteredMaterials.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-medium text-gray-500 text-base">No materials found.</p>
              <p className="text-sm mt-1">Try a different search term or add a new one.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Item ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-right">Stock</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {filteredMaterials.map((mat) => {
                  const status = getStatus(mat.stocks);
                  return (
                    <tr key={mat.id} className="hover:bg-gray-50/50 transition-colors group border-b border-gray-50 last:border-0">
                      <td className="px-6 py-4 font-mono text-xs text-gray-400 font-bold">
                        {mat.material_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-800 text-sm">{mat.name}</td>
                      <td className="px-6 py-4 text-gray-600 capitalize text-sm font-semibold">{mat.category}</td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-bold text-gray-700 text-sm">{mat.stocks}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => openModal('view', mat)}
                            title="View"
                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-md transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openModal('edit', mat)}
                            title="Edit"
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-md transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(mat.id)}
                            title="Delete"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>



    {/* Modern Small Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-md shadow-xl overflow-hidden relative border border-gray-200">
            
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <h3 className="font-bold text-gray-800 text-base">
                {modalMode === 'add' ? 'Add Material' : modalMode === 'edit' ? 'Edit Material' : 'View Material'}
              </h3>
              <button 
                onClick={closeModal}
                className="w-7 h-7 bg-white border border-gray-200 rounded-md flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
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
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium"
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
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium"
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
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium"
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
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-bold"
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
                    disabled={modalMode === 'view'}
                    rows={2}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none resize-none disabled:opacity-70 disabled:bg-gray-100"
                    placeholder="Brief details..."
                  ></textarea>
                </div>
              </div>

              <div className="mt-8">
                {modalMode !== 'view' ? (
                    <button 
                      type="submit" 
                      disabled={saving}
                      className="w-full bg-[#166534] hover:bg-[#14532d] text-white py-3 rounded-md text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                    >
                      <Save className="w-5 h-5" />
                      {saving ? 'Saving...' : 'Save Material'}
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      onClick={closeModal}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-md text-sm font-bold transition-all"
                    >
                      Close View
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }
