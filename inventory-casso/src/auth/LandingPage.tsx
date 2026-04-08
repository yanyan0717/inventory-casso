import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Login from './Login';
import Register from './Register';
import logoUrl from '../assets/casso.png';
import bgImage from '../assets/casso1.jpg';

export default function LandingPage() {
    const navigate = useNavigate();
    const [mode, setMode] = useState<'login' | 'register'>('login');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                navigate('/dashboard', { replace: true });
                return;
            }

            setLoading(false);
        };

        checkAuth();
    }, [navigate]);

    if (loading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-white">
                <div className="text-gray-500">Loading...</div>
            </div>
        );
    }

    return (
        <div className="relative h-screen w-full overflow-hidden bg-white">

            {/* Sliding Background Panel (Left in Login, Right in Register) */}
            <div 
                className={`hidden lg:flex absolute top-0 left-0 w-1/2 h-full flex-col items-center justify-center transition-transform duration-700 ease-in-out z-20 bg-gradient-to-br from-[#166534] to-[#14532d] selection:bg-white selection:text-[#166534] ${
                    mode === 'register' ? 'translate-x-full' : 'translate-x-0'
                }`}
            >
                {/* Background Image Overlay */}
                <img 
                    src={bgImage}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                />

                {/* Dark overlay to ensure red background shows through */}
                <div className="absolute inset-0 bg-gradient-to-br from-[#166534] to-[#14532d] opacity-80 z-0"></div>

                {/* Subtle background dark wash to make it feel premium */}
                <div className="absolute inset-0 bg-black/15 pointer-events-none mix-blend-multiply z-0"></div>

                {/* Centered Main Content with Big Logo */}
                <div className="relative z-10 flex flex-col items-center text-center px-12">

                    {/* BIG Logo on the left side - showing its natural colors */}
                    <div className="w-72 h-72 rounded-full overflow-hidden mb-8 drop-shadow-2xl transition-transform hover:scale-105 duration-700 flex items-center justify-center bg-white/10">
                        <img
                            src={logoUrl}
                            alt="City Assessor Logo"
                            className="w-full h-full object-contain"
                        />
                    </div>

                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-widest mb-4 uppercase drop-shadow-md">
                        ILIGAN CITY
                    </h1>
                    <p className="text-white/80 tracking-[0.15em] text-[13px] md:text-sm font-semibold uppercase font-[var(--sans)] leading-relaxed">
                        Assessor's Office Digital Portal
                    </p>
                </div>
            </div>

            {/* Sliding Form Panel (Right in Login, Left in Register) */}
            <div 
                className={`absolute top-0 right-0 w-full lg:w-1/2 h-full flex items-center justify-center bg-white px-6 md:px-12 transition-transform duration-700 ease-in-out z-10 ${
                    mode === 'register' ? 'lg:-translate-x-full' : 'translate-x-0'
                }`}
            >
                {/* Form Container overlapping dynamically */}
                <div className="w-full max-w-[360px] relative flex justify-center items-center">
                    <div className={`w-full transition-all duration-500 ${mode === 'login' ? 'opacity-100 relative z-10 translate-y-0' : 'opacity-0 absolute pointer-events-none -translate-y-4'}`}>
                        <Login onModeChange={setMode} />
                    </div>
                    
                    <div className={`w-full transition-all duration-500 ${mode === 'register' ? 'opacity-100 relative z-10 translate-y-0' : 'opacity-0 absolute pointer-events-none translate-y-4'}`}>
                        <Register onModeChange={setMode} />
                    </div>
                </div>

                {/* Footer text pinned to bottom */}
                <div className="absolute bottom-10 w-full text-center left-0">
                    <p className="text-[10px] tracking-[0.2em] text-[var(--text)]/40 uppercase font-bold">
                        Created for Iligan City Assessor's Office 2026
                    </p>
                </div>
            </div>

        </div>
    );
}
