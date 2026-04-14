import { useState, useEffect } from 'react';
import { BookOpen, Search, FileDown, Trash, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { TableSkeleton } from '../components/SkeletonLoader';
import { showToast } from '../components/Toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function Logs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsPerPage] = useState(10);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [logToDelete, setLogToDelete] = useState<any>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('material_logs')
      .select('*, profiles:user_id(full_name)')
      .order('created_at', { ascending: false });
    
    if (!error) {
      setLogs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.material_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (log.reason && log.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const indexOfLastLog = currentPage * logsPerPage;
  const indexOfFirstLog = indexOfLastLog - logsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog);
  const totalPages = Math.ceil(filteredLogs.length / logsPerPage);

  const handleDeleteClick = (log: any) => {
    setLogToDelete(log);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteLog = async () => {
    if (!logToDelete) return;

    const { error } = await supabase.from('material_logs').delete().eq('id', logToDelete.id);

    if (error) {
      showToast('Failed to delete log', 'error');
    } else {
      showToast('Log deleted successfully', 'success');
      fetchLogs();
    }

    setShowDeleteConfirm(false);
    setLogToDelete(null);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header section
    doc.setFontSize(18);
    doc.setTextColor(22, 101, 52); // Project green
    doc.text('Inventory CASSO System', 14, 22);
    
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text(`Activity Logs Report - Generated on ${new Date().toLocaleDateString()}`, 14, 30);
    
    const tableData = filteredLogs.map(log => [
      new Date(log.created_at).toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      log.material_name,
      log.action_type,
      `${log.action_type?.toLowerCase() === 'add' ? '+' : '-'}${log.quantity}`,
      log.reason || 'No reason provided',
      Array.isArray(log.profiles) ? (log.profiles[0]?.full_name || '-') : (log.profiles?.full_name || '-')
    ]);

    autoTable(doc, {
      startY: 40,
      head: [['Date & Time', 'Material', 'Action', 'Qty', 'Reason', 'Performed By']],
      body: tableData,
      headStyles: { 
        fillColor: [22, 101, 52], // Project green
        textColor: [255, 255, 255],
        fontSize: 10,
        fontStyle: 'bold'
      },
      styles: { 
        fontSize: 8, 
        cellPadding: 3,
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { top: 40 }
    });

    doc.save(`Activity_Logs_${new Date().getTime()}.pdf`);
    showToast('Logs Exported Successfully', 'success');
  };

  return (
    <div className="flex flex-col space-y-4 relative w-full max-w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)] tracking-tight">Activity Logs</h2>
          <p className="text-sm text-gray-500">History of material deductions and actions</p>
        </div>

        <div className="relative group max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-[#166534] transition-colors" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-md border border-gray-200 bg-white text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-400"
          />
        </div>

        <button
          onClick={exportToPDF}
          className="flex items-center gap-2 text-sm font-semibold cursor-pointer text-gray-700 bg-white border border-gray-200 px-5 py-2 rounded-md hover:bg-gray-50 transition-all active:scale-95 shadow-sm sm:w-auto w-full justify-center order-first sm:order-last"
        >
          <FileDown className="w-4 h-4 text-green-700" />
          Export to PDF
        </button>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden mt-4">
        <div className="overflow-x-auto">
          {loading ? (
            <TableSkeleton rows={10} cols={6} />
          ) : filteredLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-gray-300" />
              </div>
              <p className="font-medium text-gray-500 text-base">No activity logs found.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-gray-200">
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Material Name</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Action</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider text-right">Quantity</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Reason</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Performed By</th>
                  <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-gray-50">
                {currentLogs.map((log, index) => (
                  <tr key={log.id} className={`hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-3 text-gray-500 text-xs">
                      {new Date(log.created_at).toLocaleString('en-US', { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-3 font-semibold text-slate-800">{log.material_name}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tight italic border ${log.action_type?.toLowerCase() === 'add' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {log.action_type}
                      </span>
                    </td>
                    <td className={`px-6 py-3 text-right font-bold ${log.action_type?.toLowerCase() === 'add' ? 'text-emerald-600' : 'text-red-600'}`}>
                      {log.action_type?.toLowerCase() === 'add' ? '+' : '-'}{log.quantity}
                    </td>
                    <td className="px-6 py-3 text-gray-600 text-xs italic">{log.reason || 'No reason provided'}</td>
                    <td className="px-6 py-3 text-slate-800 font-medium">
                      {Array.isArray(log.profiles) 
                        ? (log.profiles[0]?.full_name || '-') 
                        : (log.profiles?.full_name || '-')}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => handleDeleteClick(log)}
                          title="Delete log"
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {filteredLogs.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white">
            <div className="text-sm text-gray-500">
              Showing {indexOfFirstLog + 1} to {Math.min(indexOfLastLog, filteredLogs.length)} of {filteredLogs.length} entries
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-sm border border-gray-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">Delete Log</h3>
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this log? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteLog}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all font-medium text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
