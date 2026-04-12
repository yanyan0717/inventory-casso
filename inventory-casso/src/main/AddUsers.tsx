import { useEffect, useState } from 'react';
import { UserPlus, X, Save, Pencil, Trash2, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';

interface UserProfile {
  id: string;
  email: string;
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
  
  const [formData, setFormData] = useState({
    email: '',
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
      fullName: user.full_name || '',
      password: '',
      confirmPassword: '',
      role: user.role || 'user',
    });
    setIsEditModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id);

    if (error) {
      showToast('Failed to delete user', 'error');
    } else {
      showToast('User deleted successfully', 'success');
      fetchUsers();
    }
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

    const updates: { full_name: string; role: string } = {
      full_name: formData.fullName,
      role: formData.role,
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
    
    if (!formData.email || !formData.fullName || !formData.password || !formData.confirmPassword) {
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
      },
    });

    if (signUpData?.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert([{ 
          id: signUpData.user.id, 
          email: formData.email,
          full_name: formData.fullName, 
          role: formData.role 
        }]);

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
      fullName: '',
      password: '',
      confirmPassword: '',
      role: 'user',
    });
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (checkingAccess) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8">
      <div className="flex flex-col space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)]">Add User</h2>
        <p className="text-sm text-gray-500">Create a new user account for the system.</p>
      </div>
      
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-3 bg-[#166534] hover:bg-[#14532d] text-white rounded-lg shadow-md hover:shadow-lg transition-all"
        >
          <UserPlus className="w-5 h-5" />
          <span className="font-medium">Add New User</span>
        </button>

        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#166534]/20 focus:border-[#166534] transition-all outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#f8fafc] border-b border-gray-200">
                <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-[11px] font-bold text-[#166534] uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">No users found</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#f0fdf4]/30 transition-colors border-b border-gray-50 last:border-0">
                    <td className="px-6 py-2.5 text-sm font-medium text-gray-800">{user.full_name || '-'}</td>
                    <td className="px-6 py-2.5 text-sm text-gray-500">{user.email || '-'}</td>
                    <td className="px-6 py-2.5">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {user.role || 'user'}
                      </span>
                    </td>
                    <td className="px-6 py-2.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1.5 text-gray-400 hover:text-[#166534] hover:bg-green-50 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
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
                    <input 
                      type="password" 
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="Enter password"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Confirm Password</label>
                    <input 
                      type="password" 
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none resize-none placeholder:text-gray-300 placeholder:font-normal"
                      placeholder="Re-enter password"
                      required
                    />
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
                  <input 
                    type="password" 
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none font-medium placeholder:text-gray-300 placeholder:font-normal"
                    placeholder="Enter new password"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[13px] font-bold text-gray-600 uppercase tracking-wider">Confirm Password</label>
                  <input 
                    type="password" 
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50/30 text-black text-sm focus:ring-2 focus:ring-[#166534]/10 focus:border-[#166534] transition-all outline-none resize-none placeholder:text-gray-300 placeholder:font-normal"
                    placeholder="Re-enter password"
                  />
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
    </div>
  );
}
