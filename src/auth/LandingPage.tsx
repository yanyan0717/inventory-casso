import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Login from './Login';
import logoUrl from '../assets/casso.png';
import bgImage from '../assets/casso1.jpg';

export default function LandingPage() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            
            if (session) {
                navigate('/dashboard', { replace: true });
                return;
            }
        };

        checkAuth();
    }, [navigate]);

    return (
        <div className="flex h-screen w-full bg-white">
            {/* Left Side - Logo and Branding */}
            <div className="relative hidden lg:flex w-1/2 h-full flex-col items-center justify-center bg-gradient-to-br from-[#166534] to-[#14532d]">
                <img 
                    src={bgImage}
                    alt="Background"
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-[#166534] to-[#14532d] opacity-80"></div>
                <div className="absolute inset-0 bg-black/15 pointer-events-none mix-blend-multiply"></div>

                <div className="relative z-10 flex flex-col items-center text-center px-12">
                    <div className="w-72 h-72 rounded-full overflow-hidden mb-8 drop-shadow-2xl flex items-center justify-center bg-white/10">
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
                        Assessor's Office Digital Inventory System
                    </p>
                </div>
            </div>

            {/* Right Side - Login Form */}
            <div className="relative w-full lg:w-1/2 h-full flex items-center justify-center bg-white px-6 md:px-12">
                <div className="w-full max-w-[360px]">
                    <Login />
                </div>

                <div className="absolute bottom-10 inset-x-0 text-center">
                    <p className="text-[10px] tracking-[0.2em] text-[var(--text)]/40 uppercase font-bold">
                        Created for Iligan City Assessor's Office 2026
                    </p>
                </div>
            </div>
        </div>
    );
}
