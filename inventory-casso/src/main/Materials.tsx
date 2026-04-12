import { useState, useEffect, useRef } from 'react';
import { Search, Settings2, Trash, BookOpen, X, Save, Camera, Plus, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';

interface Material {
  id: string;
  material_id: string;
  name: string;
  category: string;
  stocks: number;
  description: string;
  picture: string | null;
  added_by: string | null;
}

export default function Materials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit' | 'view'>('add');
  const [saving, setSaving] = useState(false);

  // Delete Confirmation State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    id: '',
    material_id: '',
    name: '',
    category: '',
    stocks: '',
    description: '',
    picture: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetchMaterials();
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleDelete = async (id: string) => {
    setItemToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;

    const { error } = await supabase.from('materials').delete().eq('id', itemToDelete);

    if (error) {
      showToast('Failed to delete material', 'error');
    } else {
      showToast('Material deleted successfully', 'success');
      fetchMaterials();
    }

    setShowDeleteConfirm(false);
    setItemToDelete(null);
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
        picture: material.picture || '',
      });
    } else {
      setFormData({ id: '', material_id: '', name: '', category: '', stocks: '', description: '', picture: '' });
    }
    setIsModalOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, picture: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
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
      picture: formData.picture || null,
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
    if (stock === 0) return { label: 'Out of Stock', class: 'bg-red-50 text-red-700 ring-red-600/10', dot: 'bg-red-600', text: 'text-red-600' };
    if (stock < 6) return { label: 'Low Stock', class: 'bg-amber-50 text-amber-700 ring-amber-600/10', dot: 'bg-amber-600', text: 'text-amber-600' };
    return { label: 'In Stock', class: 'bg-emerald-50 text-emerald-700 ring-emerald-600/10', dot: 'bg-emerald-600', text: 'text-emerald-600' };
  };

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const filteredMaterials = materials.filter((mat) =>
    mat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    mat.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (mat.material_id && mat.material_id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const sortedMaterials = [...filteredMaterials].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key as keyof Material];
    const bVal = b[sortConfig.key as keyof Material];
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedMaterials.length / itemsPerPage);
  const paginatedMaterials = sortedMaterials.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="flex flex-col space-y-4 relative w-full max-w-full">
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
            className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-white bg-[#166534] px-5 py-1.5 rounded-md hover:bg-[#14532d] transition-all active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4" />
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
                <tr className="bg-[#f8fafc] border-b border-gray-200">
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Item ID</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Picture</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Added By</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider text-right cursor-pointer select-none group" onClick={() => handleSort('stocks')}>
                    <span className="flex items-center justify-end gap-1">
                      Stock 
                      {sortConfig?.key === 'stocks' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-500" /> : <ArrowDown className="w-3 h-3 text-orange-500" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      )}
                    </span>
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider cursor-pointer select-none group" onClick={() => handleSort('stocks')}>
                    <span className="flex items-center gap-1">
                      Status 
                      {sortConfig?.key === 'stocks' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-500" /> : <ArrowDown className="w-3 h-3 text-orange-500" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      )}
                    </span>
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {paginatedMaterials.map((mat, index) => {
                  const status = getStatus(mat.stocks);
                  return (
                    <tr key={mat.id} className={`hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-1.5 font-mono text-[10px] text-slate-800 font-bold tracking-tight">
                        {mat.material_id || 'N/A'}
                      </td>
                      <td className="px-6 py-1.5">
                        <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm">
                          {mat.picture ? (
                            <img src={mat.picture} alt={mat.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-400 text-[10px] font-bold">N/A</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-1.5 text-slate-800 text-sm">{mat.name}</td>
                      <td className="px-6 py-1.5 text-slate-800 text-sm">{mat.category}</td>
                      <td className="px-6 py-1.5 text-slate-800 text-sm">{mat.added_by || '-'}</td>
                      <td className="px-6 py-1.5 text-right">
                        <span className={`text-sm tracking-tight ${status.text}`}>{mat.stocks}</span>
                      </td>
                      <td className="px-6 py-1.5">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ring-1 ring-inset ${status.class}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${status.dot} animate-pulse`}></span>
                          {status.label}
                        </span>
                      </td>
                      <td className="px-6 py-1.5">
                        <div className="flex items-center justify-center gap-0.5">
                          <button
                            onClick={() => openModal('view', mat)}
                            title="View Details"
                            className="p-1.5 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                          >
                            <BookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openModal('edit', mat)}
                            title="Edit Item"
                            className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Settings2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(mat.id)}
                            title="Delete Item"
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Trash className="w-4 h-4" />
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
        
        {/* Pagination */}
        {sortedMaterials.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, sortedMaterials.length)} of {sortedMaterials.length} entries
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    currentPage === page
                      ? 'bg-[#166534] text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>



      {/* Modern Small Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-md shadow-xl overflow-hidden relative border border-gray-200">

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-gray-800 text-base">
                {modalMode === 'add' ? 'Add Material' : modalMode === 'edit' ? 'Edit Material' : 'View Material'}
              </h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">

                {modalMode !== 'view' ? (
                  <div className="flex flex-col items-center">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                        {formData.picture ? (
                          <img src={formData.picture} alt="Preview" className="w-full h-full object-cover " />
                        ) : (
                          <Camera className="w-8 h-8 text-gray-300" />
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute bottom-0 right-0 w-8 h-8 bg-[#166534] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#14532d]"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {formData.picture ? (
                        <img src={formData.picture} alt={formData.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-gray-400 text-xs">No picture</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Material ID</label>
                  <input
                    type="text"
                    value={formData.material_id}
                    onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium placeholder:text-gray-300 placeholder:font-normal"
                    placeholder="e.g. MAT-001"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Item Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={modalMode === 'view'}
                    className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium placeholder:text-gray-300 placeholder:font-normal"
                    placeholder="e.g. Printer Paper"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium"
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
                      onChange={(e) => setFormData({ ...formData, stocks: e.target.value })}
                      disabled={modalMode === 'view'}
                      className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-bold placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    disabled={modalMode === 'view'}
                    rows={2}
                    className="w-full px-3 py-2.5 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none resize-none disabled:opacity-70 disabled:bg-gray-100 placeholder:text-gray-300 placeholder:font-normal"
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
                    className="w-full bg-[#166534] hover:bg-[#14532d] text-white py-3 rounded-md text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <X className="w-4 h-4" />
                    Close View
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xs rounded-lg shadow-xl overflow-hidden relative border border-gray-200">
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">Delete Material</h3>
              <p className="text-gray-500 text-sm">Are you sure you want to delete this material? This action cannot be undone.</p>
            </div>
            <div className="flex border-t border-gray-100">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setItemToDelete(null);
                }}
                className="flex-1 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-l border-gray-100"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
