import { User, Bell, Shield, Paintbrush } from 'lucide-react';

export default function Settings() {
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
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-[#166534] font-bold text-2xl shadow-sm border-2 border-white">
                AD
              </div>
              <div>
                <button className="px-4 py-2 bg-white border border-gray-200 shadow-sm rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  Change Avatar
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Full Name</label>
                <input 
                  type="text" 
                  defaultValue="Admin User"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email Address</label>
                <input 
                  type="email" 
                  defaultValue="admin@iligan.gov.ph"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-sm focus:ring-1 focus:ring-[#166534] focus:border-[#166534] transition-all outline-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Role</label>
                <input 
                  type="text" 
                  disabled
                  defaultValue="Administrator"
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 bg-gray-100 text-gray-500 text-sm cursor-not-allowed"
                />
                <p className="text-xs text-gray-400 mt-1">Role can only be changed by system super-admins.</p>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                type="button" 
                className="bg-[#166534] hover:bg-[#14532d] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
