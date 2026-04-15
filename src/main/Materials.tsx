import { useState, useEffect, useRef } from 'react';
import { Search, Settings2, Trash, BookOpen, X, Save, Camera, Plus, ArrowUp, ArrowDown, ChevronsUpDown, Minus, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';
import { TableSkeleton } from '../components/SkeletonLoader';

interface Material {
  id: string;
  material_id: string;
  name: string;
  category: string;
  unit: string;
  stocks: number;
  description: string;
  picture: string | null;
  added_by: string | null;
  profiles?: any;
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

  // Deduction Modal State
  const [showDeductModal, setShowDeductModal] = useState(false);
  const [deductSearch, setDeductSearch] = useState('');
  const [selectedDeductItem, setSelectedDeductItem] = useState<Material | null>(null);
  const [deductQty, setDeductQty] = useState('');
  const [deductReason, setDeductReason] = useState('');
  const [deducting, setDeducting] = useState(false);

  const [formData, setFormData] = useState({
    id: '',
    material_id: '',
    name: '',
    category: '',
    unit: '',
    stocks: '',
    description: '',
    picture: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMaterials = async () => {
    const { data, error } = await supabase
      .from('materials')
      .select('*, profiles!created_by(full_name)')
      .order('material_id', { ascending: true }); // Ordered by material_id now

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

    const materialToDelete = materials.find(m => m.id === itemToDelete);
    
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('materials').delete().eq('id', itemToDelete);

    if (error) {
      showToast('Failed to delete material', 'error');
    } else {
      if (user && materialToDelete) {
        await supabase.from('material_logs').insert({
          material_id: materialToDelete.id,
          material_name: materialToDelete.name,
          action_type: 'DELETE',
          quantity: materialToDelete.stocks,
          reason: 'Material deleted',
          user_id: user.id,
        });
      }
      showToast('Material deleted successfully', 'success');
      fetchMaterials();
    }

    setShowDeleteConfirm(false);
    setItemToDelete(null);
  };

  const handleDeduct = async () => {
    if (!selectedDeductItem || !deductQty || parseInt(deductQty) <= 0) {
      showToast('Please select an item and enter a valid quantity', 'error');
      return;
    }

    const qty = parseInt(deductQty);
    if (qty > selectedDeductItem.stocks) {
      showToast('Cannot deduct more than available stock', 'error');
      return;
    }

    setDeducting(true);
    const newStock = selectedDeductItem.stocks - qty;

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Update the stock
    const { error: updateError } = await supabase
      .from('materials')
      .update({ stocks: newStock })
      .eq('id', selectedDeductItem.id);

    if (updateError) {
      showToast('Failed to update stock', 'error');
      setDeducting(false);
      return;
    }

    // 2. Create the log entry
    const { error: logError } = await supabase
      .from('material_logs')
      .insert({
        material_id: selectedDeductItem.id,
        material_name: selectedDeductItem.name,
        action_type: 'deduction',
        quantity: qty,
        reason: deductReason || 'No reason provided',
        user_id: user?.id
      });

    setDeducting(false);

    if (logError) {
      console.error('Logging error:', logError);
      showToast(`Error saving log: ${logError.message}`, 'error');
    } else {
      showToast(`Deducted ${qty} ${selectedDeductItem.unit} from ${selectedDeductItem.name}`, 'success');
    }

    setShowDeductModal(false);
    setSelectedDeductItem(null);
    setDeductQty('');
    setDeductReason('');
    setDeductSearch('');
    fetchMaterials();
  };

  const openDeductModal = () => {
    setShowDeductModal(true);
    setDeductSearch('');
    setSelectedDeductItem(null);
    setDeductQty('');
    setDeductReason('');
  };

  const closeDeductModal = () => {
    setShowDeductModal(false);
    setSelectedDeductItem(null);
    setDeductQty('');
    setDeductReason('');
    setDeductSearch('');
  };

  const filteredDeductItems = materials.filter((mat) =>
    deductSearch === '' || (
      mat.name.toLowerCase().includes(deductSearch.toLowerCase()) ||
      mat.category.toLowerCase().includes(deductSearch.toLowerCase()) ||
      (mat.material_id && mat.material_id.toLowerCase().includes(deductSearch.toLowerCase()))
    )
  );

  const openModal = (mode: 'add' | 'edit' | 'view', material?: Material) => {
    setModalMode(mode);
    if (material) {
      setFormData({
        id: material.id,
        material_id: material.material_id || '',
        name: material.name,
        category: material.category,
        unit: material.unit || '',
        stocks: material.stocks.toString(),
        description: material.description || '',
        picture: material.picture || '',
      });
    } else {
      let nextIdStr = '';
      if (materials.length > 0) {
        let maxNum = 0;
        let prefix = '';
        let padLength = 3;

        materials.forEach(m => {
          if (!m.material_id) return;
          const match = m.material_id.match(/^(.*?)(\d+)$/);
          if (match) {
            const numStr = match[2];
            const num = parseInt(numStr, 10);
            if (num >= maxNum) {
              maxNum = num;
              prefix = match[1];
              padLength = Math.max(padLength, numStr.length);
            }
          }
        });

        if (maxNum > 0) {
          nextIdStr = `${prefix}${String(maxNum + 1).padStart(padLength, '0')}`;
        } else {
          // Fallback if no numeric IDs exist
          nextIdStr = materials.length > 0
            ? String(materials.length + 1).padStart(3, '0')
            : '001';
        }
      } else {
        nextIdStr = '001';
      }

      setFormData({ id: '', material_id: nextIdStr, name: '', category: '', unit: '', stocks: '', description: '', picture: '' });
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
    // Get current user for the created_by field
    const { data: { user } } = await supabase.auth.getUser();

    const materialData: any = {
      material_id: formData.material_id,
      name: formData.name,
      category: formData.category,
      unit: formData.unit,
      stocks: parseInt(formData.stocks) || 0,
      description: formData.description,
      picture: formData.picture || null,
    };

    // Only set created_by on new items, or if you want to track who edited it
    if (modalMode === 'add' && user) {
      materialData.created_by = user.id;
      materialData.added_by = user.email; // Fallback for old display logic
    }

    let error;
    
    if (modalMode === 'edit') {
      ({ error } = await supabase.from('materials').update(materialData).eq('id', formData.id));
    } else {
      const { data: newMaterial, error: insertError } = await supabase.from('materials').insert(materialData).select().single();
      if (insertError) {
        error = insertError;
      } else if (newMaterial && user) {
        await supabase.from('material_logs').insert({
          material_id: newMaterial.id,
          material_name: newMaterial.name,
          action_type: 'ADD',
          quantity: newMaterial.stocks,
          reason: 'Material added to inventory',
          user_id: user.id,
        });
      }
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

  const exportToPDF = () => {
    const doc = new jsPDF();

    // Header section
    doc.setFontSize(18);
    doc.setTextColor(22, 101, 52); // Project green
    doc.text('Inventory CASSO System', 14, 22);

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Materials Inventory Report - Generated on ${new Date().toLocaleDateString()}`, 14, 30);

    const tableData = sortedMaterials.map(mat => [
      mat.material_id || 'N/A',
      mat.name,
      mat.category,
      mat.unit || '-',
      mat.stocks.toString(),
      getStatus(mat.stocks).label
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Item ID', 'Name', 'Category', 'Unit', 'Stock', 'Status']],
      body: tableData,
      headStyles: {
        fillColor: [22, 101, 52], // Project green
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Very light gray/blue
      },
      margin: { top: 40 }
    });

    doc.save(`Materials_Report_${new Date().getTime()}.pdf`);
    showToast('PDF Exported Successfully', 'success');
  };

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
          <button
            onClick={openDeductModal}
            className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-white bg-red-600 px-5 py-1.5 rounded-md hover:bg-red-700 transition-all active:scale-95 shadow-sm"
          >
            <Minus className="w-4 h-4" />
            Deduct
          </button>
          <button
            onClick={exportToPDF}
            className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-gray-700 bg-white border border-gray-200 px-5 py-1.5 rounded-md hover:bg-gray-50 transition-all active:scale-95 shadow-sm"
          >
            <FileDown className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-gray-200 mt-4 overflow-hidden">
        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={10} cols={8} />
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
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider cursor-pointer select-none group" onClick={() => handleSort('material_id')}>
                    <span className="flex items-center gap-1">
                      Item ID
                      {sortConfig?.key === 'material_id' ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-orange-500" /> : <ArrowDown className="w-3 h-3 text-orange-500" />
                      ) : (
                        <ChevronsUpDown className="w-3 h-3 text-gray-300 group-hover:text-gray-400 transition-colors" />
                      )}
                    </span>
                  </th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Picture</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Unit</th>
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
                      <td className="px-6 py-1.5 text-slate-800 text-sm">{mat.unit || '-'}</td>
                      <td className="px-6 py-1.5 text-slate-800 text-sm">
                        {Array.isArray(mat.profiles)
                          ? (mat.profiles[0]?.full_name || mat.added_by || '-')
                          : (mat.profiles?.full_name || mat.added_by || '-')}
                      </td>
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
        {/* Pagination */}
        {totalPages > 1 && (
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
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${currentPage === page
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
          <div className="bg-white w-full max-w-xl rounded-md shadow-xl overflow-hidden relative border border-gray-200">

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
              <div className="flex flex-col sm:flex-row gap-6">
                {/* Left Side: Picture */}
                <div className="flex flex-col items-center shrink-0">
                  <div className="relative">
                    <div className="w-28 h-28 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200">
                      {formData.picture ? (
                        <img src={formData.picture} alt="Preview" className="w-full h-full object-cover " />
                      ) : (
                        modalMode === 'view' ? <span className="text-gray-400 text-[10px] font-bold">N/A</span> : <Camera className="w-8 h-8 text-gray-300" />
                      )}
                    </div>
                    {modalMode !== 'view' && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#166534] text-white rounded-full flex items-center justify-center shadow-md hover:bg-[#14532d] z-10"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Right Side: Form Fields */}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Material ID</label>
                      <input
                        type="text"
                        value={formData.material_id}
                        onChange={(e) => setFormData({ ...formData, material_id: e.target.value })}
                        disabled={modalMode === 'view'}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium placeholder:text-gray-300 placeholder:font-normal"
                        placeholder="e.g. MAT-001"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Item Name</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={modalMode === 'view'}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium placeholder:text-gray-300 placeholder:font-normal"
                        placeholder="e.g. Printer Paper"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Category</label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        disabled={modalMode === 'view'}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium"
                        required
                      >
                        <option value="">Select...</option>
                        <option value="furniture">Furniture</option>
                        <option value="electronics">Electronics</option>
                        <option value="supplies">Supplies</option>
                        <option value="other">Other</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Unit</label>
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                        disabled={modalMode === 'view'}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-medium"
                        required
                      >
                        <option value="">Select...</option>
                        <option value="pcs">pcs</option>
                        <option value="box">box</option>
                        <option value="bottle">bottle</option>
                        <option value="gallon">gallon</option>
                        <option value="rolls">rolls</option>
                        <option value="pack">pack</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Stock Qty</label>
                      <input
                        type="number"
                        value={formData.stocks}
                        onChange={(e) => setFormData({ ...formData, stocks: e.target.value })}
                        disabled={modalMode === 'view'}
                        className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none disabled:opacity-70 disabled:bg-gray-100 font-bold placeholder:text-gray-300 placeholder:font-normal"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={modalMode === 'view'}
                      rows={2}
                      className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none resize-none disabled:opacity-70 disabled:bg-gray-100 placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="Brief details..."
                    ></textarea>
                  </div>
                </div>
              </div>

              <div className="mt-6">
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

      {/* Deduction Modal */}
      {showDeductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-md shadow-xl overflow-hidden relative border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
                <Minus className="w-4 h-4 text-red-600" />
                Deduct Material
              </h3>
              <button
                onClick={closeDeductModal}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Search Materials */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Search Material</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name, category, or ID..."
                    value={deductSearch}
                    onChange={(e) => {
                      setDeductSearch(e.target.value);
                      setSelectedDeductItem(null);
                    }}
                    className="w-full pl-9 pr-3 py-2 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                  />
                </div>
              </div>

              {/* Material List */}
              {!selectedDeductItem && (
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-md divide-y divide-gray-100">
                  {filteredDeductItems.length === 0 ? (
                    <div className="p-4 text-center text-gray-400 text-sm">No materials found</div>
                  ) : (
                    filteredDeductItems.map((mat) => (
                      <button
                        key={mat.id}
                        onClick={() => setSelectedDeductItem(mat)}
                        className="w-full px-4 py-3 text-left hover:bg-red-50 transition-colors flex items-center justify-between"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800">{mat.name}</p>
                          <p className="text-xs text-gray-500">{mat.category} · {mat.material_id || 'N/A'}</p>
                        </div>
                        <span className="text-sm font-bold text-emerald-600">{mat.stocks} {mat.unit}</span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {/* Selected Item */}
              {selectedDeductItem && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-800">{selectedDeductItem.name}</p>
                      <p className="text-xs text-gray-500">{selectedDeductItem.category} · {selectedDeductItem.material_id || 'N/A'}</p>
                    </div>
                    <button
                      onClick={() => setSelectedDeductItem(null)}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Change
                    </button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-emerald-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Available Stock</span>
                    <span className="text-sm font-bold text-emerald-700">{selectedDeductItem.stocks} {selectedDeductItem.unit}</span>
                  </div>
                </div>
              )}

              {/* Quantity Input */}
              {selectedDeductItem && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Quantity to Deduct</label>
                  <input
                    type="number"
                    placeholder="Enter quantity"
                    value={deductQty}
                    onChange={(e) => setDeductQty(e.target.value)}
                    min="1"
                    max={selectedDeductItem.stocks}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                  />
                  <p className="text-xs text-gray-400">
                    Max: {selectedDeductItem.stocks} {selectedDeductItem.unit}
                  </p>
                </div>
              )}

              {/* Reason Input */}
              {selectedDeductItem && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Reason (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g., Used for project, Damaged, Expired"
                    value={deductReason}
                    onChange={(e) => setDeductReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-red-500/10 focus:border-red-500 transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                  />
                </div>
              )}
            </div>

            <div className="px-6 pb-6">
              <button
                onClick={handleDeduct}
                disabled={!selectedDeductItem || !deductQty || parseInt(deductQty) <= 0 || deducting || (selectedDeductItem && parseInt(deductQty) > selectedDeductItem.stocks)}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-md text-sm font-bold shadow-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <Minus className="w-4 h-4" />
                {deducting ? 'Deducting...' : 'Confirm Deduction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
