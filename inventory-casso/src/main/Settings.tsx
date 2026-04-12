import { useState, useEffect, useRef } from 'react';
import { User, Bell, Shield, Paintbrush, Camera, Save } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  full_name: string | null;
  profile_picture_path: string | null;
  email: string | null;
  role: string | null;
}

export default function Settings() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', profile_picture_path: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      setProfile(data);
      setFormData({ 
        full_name: data?.full_name || '', 
        profile_picture_path: data?.profile_picture_path || '' 
      });
    }
    setLoading(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setFormData({ ...formData, profile_picture_path: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase
        .from('profiles')
        .update({ 
          full_name: formData.full_name,
          profile_picture_path: formData.profile_picture_path,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id);
    }
    setSaving(false);
    fetchProfile();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl flex flex-col space-y-6 animate-fade-in-up">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 font-[var(--heading)]">Settings</h2>
        <p className="text-sm text-gray-500">Manage your system preferences and account settings.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row overflow-hidden min-h-[500px]">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 bg-gray-50/50 border-r border-gray-100 p-4 space-y-1">
          <button className="w-full flex items-center gap-3 px-4 py-2.5 bg-[#166534]/10 text-[#166534] rounded-lg text-sm font-medium transition-colors">
            <User className="w-4 h-4" />
            Profile
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
            <Shield className="w-4 h-4" />
            Security
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
            <Paintbrush className="w-4 h-4" />
            Appearance
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="flex-1 p-8">
          <h3 className="text-lg font-bold text-gray-800 mb-6 font-[var(--heading)]">Profile Information</h3>
          
          <div className="space-y-6 max-w-lg">
            <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center overflow-hidden shadow-sm border-2 border-white">
                  {formData.profile_picture_path ? (
                    <img src={formData.profile_picture_path} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8 text-[#166534]" />
                  )}
                </div>
                <button 
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

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input 
                  type="text" 
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <input 
                  type="text" 
                  value={profile?.role || 'user'}
                  disabled
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm capitalize cursor-not-allowed"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#166534] hover:bg-[#14532d] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4 inline mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
