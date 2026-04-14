import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { showToast } from '../components/Toast';
import { Eye, EyeOff } from 'lucide-react';

interface RegisterProps {
  onModeChange?: (mode: 'login' | 'register') => void;
}

export default function Register({ onModeChange }: RegisterProps) {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (signUpError) {
        setLoading(false);
        showToast(signUpError.message, 'error');
        setError(signUpError.message);
        return;
      }

      console.log('Signup result:', signUpData);

      if (signUpData?.user) {
        console.log('Creating profile for user:', signUpData.user.id, 'email:', email, 'fullName:', fullName);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([{ 
            id: signUpData.user.id, 
            email, 
            full_name: fullName, 
            role: 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }], { onConflict: 'id' });

        console.log('Profile upsert result:', profileError);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }

        showToast('Account created successfully! Please login.', 'success');
        onModeChange?.('login');
      }
    } catch (err) {
      console.error('Signup error:', err);
    }

    setLoading(false);
  };

  const handleLoginClick = () => {
    onModeChange?.('login');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Headings aligned perfectly */}
      <div className="text-center space-y-3 mb-10 w-full">
        <h2 className="text-[28px] font-bold tracking-tight text-black font-[var(--heading)]">
          Create account
        </h2>
        <p className="text-[13px] text-gray-500 font-[var(--sans)]">
          Join the Assessor's Office Digital Portal.
        </p>
      </div>

      {/* Form Fields & Button exactly matching image layout */}
      <form className="w-full space-y-4" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <svg className="h-[18px] w-[18px] text-gray-400 group-focus-within:text-green-600 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-11 pr-4 py-[14px] rounded-lg border border-[var(--border)] bg-white text-black text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-all outline-none placeholder-shown:placeholder-gray-400 peer"
              placeholder=" "
            />
            <label
              htmlFor="email"
              className="absolute left-11 top-[14px] text-sm text-gray-400 transition-all duration-200 pointer-events-none peer-focus:top-[-8px] peer-focus:text-green-600 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white peer-not-placeholder-shown:top-[-8px] peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:bg-white peer-not-placeholder-shown:text-green-600 bg-white"
            >
              Email
            </label>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <svg className="h-[18px] w-[18px] text-gray-400 group-focus-within:text-green-600 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.174-.582-7.499-1.632z" />
              </svg>
            </div>
            <input
              id="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-11 pr-4 py-[14px] rounded-lg border border-[var(--border)] bg-white text-black text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-all outline-none placeholder-shown:placeholder-gray-400 peer"
              placeholder=" "
            />
            <label
              htmlFor="fullName"
              className="absolute left-11 top-[14px] text-sm text-gray-400 transition-all duration-200 pointer-events-none peer-focus:top-[-8px] peer-focus:text-green-600 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white peer-not-placeholder-shown:top-[-8px] peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:bg-white peer-not-placeholder-shown:text-green-600 bg-white"
            >
              Full Name
            </label>
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <svg className="h-[18px] w-[18px] text-gray-400 group-focus-within:text-green-600 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-[14px] rounded-lg border border-[var(--border)] bg-white text-black text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-all outline-none placeholder-shown:placeholder-gray-400 peer"
              placeholder=" "
            />
            <label
              htmlFor="password"
              className="absolute left-11 top-[14px] text-sm text-gray-400 transition-all duration-200 pointer-events-none peer-focus:top-[-8px] peer-focus:text-green-600 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white peer-not-placeholder-shown:top-[-8px] peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:bg-white peer-not-placeholder-shown:text-green-600 bg-white"
            >
               Password
            </label>
            {password.length > 0 && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-gray-400 hover:text-green-600 transition-colors"
              >
                {showPassword ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
              </button>
            )}
          </div>

          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
              <svg className="h-[18px] w-[18px] text-gray-400 group-focus-within:text-green-600 transition-colors" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-11 pr-12 py-[14px] rounded-lg border border-[var(--border)] bg-white text-black text-sm focus:ring-1 focus:ring-green-600 focus:border-green-600 transition-all outline-none placeholder-shown:placeholder-gray-400 peer"
              placeholder=" "
            />
            <label
              htmlFor="confirmPassword"
              className="absolute left-11 top-[14px] text-sm text-gray-400 transition-all duration-200 pointer-events-none peer-focus:top-[-8px] peer-focus:text-green-600 peer-focus:text-xs peer-focus:px-1 peer-focus:bg-white peer-not-placeholder-shown:top-[-8px] peer-not-placeholder-shown:text-xs peer-not-placeholder-shown:px-1 peer-not-placeholder-shown:bg-white peer-not-placeholder-shown:text-green-600 bg-white"
            >
               Confirm Password
            </label>
            {confirmPassword.length > 0 && (
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center z-10 text-gray-400 hover:text-green-600 transition-colors"
              >
                {showConfirmPassword ? <Eye className="h-[18px] w-[18px]" /> : <EyeOff className="h-[18px] w-[18px]" />}
              </button>
            )}
          </div>
        </div>

        <button type="submit" className="login-btn" disabled={loading}>
          {loading ? 'Signing up...' : 'Sign Up'}
        </button>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <p className="text-sm text-center text-gray-500 font-[var(--sans)]">
          Already have an account?{' '}
          <button
            type="button"
            onClick={handleLoginClick}
            className="text-green-600 hover:underline font-medium cursor-pointer bg-transparent border-none p-0"
          >
            Click here to login
          </button>
        </p>
      </form>
    </div>
  );
}