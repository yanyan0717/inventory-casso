import { useEffect, useState } from 'react';
import { UserPlus, X, Save, Trash2, Search, Settings2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';
import { TableSkeleton } from '../components/SkeletonLoader';

interface UserProfile {
  id: string;
  email: string;
  username: string | null;
  full_name: string | null;
  role: string | null;
  created_at: string;
}

export default function AddUser() {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    fullName: '',
    password: '',
    confirmPassword: '',
    role: 'user',
  });

  useEffect(() => {
    const checkAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/', { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      const rawRole = (!error && data?.role) ? data.role.toLowerCase().trim() : 'user';
      const isAdmin = rawRole === 'admin' || rawRole === 'administrator';

      if (!isAdmin) {
        showToast('Access denied: Admin privileges required', 'error');
        navigate('/dashboard', { replace: true });
        return;
      }

      setCheckingAccess(false);
    };

    checkAccess();
  }, [navigate]);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (isModalOpen || isEditModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen, isEditModalOpen]);

  const fetchUsers = async () => {
    console.log('Fetching users...');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    console.log('Profiles data:', data, 'error:', error, 'message:', error?.message);
    
    if (!error && data) {
      setUsers(data);
    } else {
      console.log('Fetch failed, trying alternative...');
      setUsers([]);
    }
    setLoading(false);
  };

  const handleEdit = (user: UserProfile) => {
    setSelectedUser(user);
    setFormData({
      email: user.email || '',
      username: user.username || '',
      fullName: user.full_name || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'user',
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', userToDelete);

    if (error) {
      showToast('Failed to delete user', 'error');
    } else {
      showToast('User deleted successfully', 'success');
      fetchUsers();
    }
    
    setShowDeleteConfirm(false);
    setUserToDelete(null);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.fullName) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setSaving(true);

    const updates: { full_name: string; role: string; username: string } = {
      full_name: formData.fullName,
      role: formData.role,
      username: formData.username,
    };

    if (formData.password) {
      if (formData.password.length < 6) {
        showToast('Password must be at least 6 characters', 'error');
        setSaving(false);
        return;
      }

      const { error: updateError } = await supabase.auth.admin.updateUserById(selectedUser!.id, {
        password: formData.password,
      });

      if (updateError) {
        showToast('Failed to update password', 'error');
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', selectedUser!.id);

    setSaving(false);

    if (error) {
      showToast('Failed to update user', 'error');
    } else {
      showToast('User updated successfully', 'success');
      setIsEditModalOpen(false);
      fetchUsers();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.username || !formData.fullName || !formData.password || !formData.confirmPassword) {
      showToast('Please fill in required fields', 'error');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      showToast('Passwords do not match', 'error');
      return;
    }

    setSaving(true);
    const { data: { session: adminSession } } = await supabase.auth.getSession();

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          username: formData.username,
          full_name: formData.fullName,
          role: formData.role,
        }
      },
    });

    if (signUpData?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          id: signUpData.user.id, 
          email: formData.email,
          username: formData.username,
          full_name: formData.fullName, 
          role: formData.role 
        });

      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }

    if (adminSession) {
      const { error: restoreError } = await supabase.auth.setSession({
        access_token: adminSession.access_token,
        refresh_token: adminSession.refresh_token,
      });

      if (restoreError) {
        showToast('Created user, but failed to restore admin session. Please re-login.', 'error');
      } else {
        window.dispatchEvent(new Event('casso:refresh-role'));
      }
    }
    
    setSaving(false);

    setSaving(false);

    if (error) {
      showToast(error.message, 'error');
    } else {
      showToast('User added successfully!', 'success');
      setIsModalOpen(false);
      setFormData({
        email: '',
        username: '',
        fullName: '',
        password: '',
        confirmPassword: '',
        role: 'user',
      });
      fetchUsers();
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    });
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (checkingAccess) {
    return (
      <div className="flex flex-col space-y-4 relative w-full max-w-full pb-8">
        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden p-8">
          <TableSkeleton rows={5} cols={4} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-4 relative w-full max-w-full pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)] tracking-tight">Add User</h2>
          <p className="text-sm text-gray-600 mt-1 font-medium">Create a new user account for the system.</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-3.5 w-3.5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-md text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none"
            />
          </div>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-[#166534] px-5 py-1.5 rounded-md hover:bg-[#14532d] transition-all active:scale-95 shadow-sm cursor-pointer  "
          >
            <UserPlus className="w-4 h-4" />
            Add User
          </button>
        </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-200">
                <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Username</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <TableSkeleton rows={5} cols={4} />
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user, index) => (
                  <tr key={user.id} className={`hover:bg-slate-50 transition-colors group border-b border-slate-100 last:border-0 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <td className="px-6 py-1.5 text-sm text-slate-800">{user.username || '-'}</td>
                    <td className="px-6 py-1.5 text-sm text-slate-800">{user.full_name || '-'}</td>
                    <td className="px-6 py-1.5 text-sm text-slate-600">{user.email || '-'}</td>
                    <td className="px-6 py-1.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-1.5">
                      <div className="flex items-center justify-center gap-0.5">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(user.id)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl overflow-hidden relative transform scale-100 transition-transform border border-gray-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-gray-800 text-base">
                Add User
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
<div className="space-y-4">
                  
                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Username</label>
                    <input 
                      type="text" 
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="Enter username"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Full Name</label>
                    <input 
                      type="text" 
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="Enter full name"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Email</label>
                    <input 
                      type="email" 
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="e.g. user@domain.com"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Role</label>
                    <select 
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Password</label>
                    <div className="relative">
                      <input 
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal pr-10"
                        placeholder="Enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#166534] transition-colors"
                      >
                        {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Confirm Password</label>
                    <div className="relative">
                      <input 
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none resize-none placeholder:text-gray-300 placeholder:font-normal pr-10"
                        placeholder="Re-enter password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#166534] transition-colors"
                      >
                        {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-[#166534] hover:bg-[#14532d] text-white py-3 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Adding...' : 'Add User'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white w-full max-w-sm rounded-lg shadow-2xl overflow-hidden relative transform scale-100 transition-transform border border-gray-200">
            
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
              <h3 className="font-bold text-gray-800 text-base">
                Edit User
              </h3>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Username</label>
                  <input 
                    type="text" 
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                    placeholder="Enter username"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Full Name</label>
                  <input 
                    type="text" 
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Role</label>
                  <select 
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">New Password (leave blank to keep current)</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal pr-10"
                      placeholder="Enter new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#166534] transition-colors"
                    >
                      {showPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none resize-none placeholder:text-gray-300 placeholder:font-normal pr-10"
                      placeholder="Re-enter password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-[#166534] transition-colors"
                    >
                      {showConfirmPassword ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <button 
                  type="submit" 
                  disabled={saving}
                  className="w-full bg-[#166534] hover:bg-[#14532d] text-white py-3 rounded-lg text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in-up">
          <div className="bg-white rounded-md shadow-xl p-6 w-full max-w-sm border border-gray-200">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-2">Delete User</h3>
              <p className="text-gray-500 text-sm mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-md hover:bg-gray-50 transition-all font-medium text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
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
