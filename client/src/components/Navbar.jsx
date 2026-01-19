import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Wallet, LayoutDashboard, ChevronDown, Wrench, Briefcase } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Design specifies sticky white nav always
    const navClasses = "sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-solid border-b-[#f0f2f4]";

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            <nav className={navClasses}>
                <div className="container mx-auto px-4 lg:px-10 flex justify-center">
                    <div className="flex w-full max-w-[1280px] items-center justify-between py-3">
                        {/* Logo Area */}
                        <Link to="/" className="flex items-center gap-3 select-none group">
                            <img src="/logo.png" alt="Fixofy Logo" className="h-10 w-auto group-hover:scale-105 transition-transform" />
                            <div className="flex items-center gap-2">
                                <h1 className="text-[#FF6B00] text-3xl font-black tracking-tighter lowercase m-0 leading-none">fixofy</h1>
                            </div>
                        </Link>

                        {/* Desktop Links */}
                        <div className="hidden md:flex flex-1 justify-end items-center gap-8">
                            <div className="flex items-center gap-6">
                                <a href="#" className="flex items-center gap-1 text-[#111418] text-sm font-medium hover:text-[#FF6B00] transition-colors cursor-pointer group">
                                    Categories
                                    <ChevronDown size={18} className="group-hover:rotate-180 transition-transform" />
                                </a>
                                <Link to="/join-partner" className="text-[#111418] text-sm font-medium hover:text-[#FF6B00] transition-colors">Become a Pro</Link>
                            </div>

                            <div className="flex gap-2">
                                {user ? (
                                    <>
                                        <Link
                                            to={user.role === 'technician' ? '/technician-dashboard' : '/dashboard'}
                                            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent border border-[#dbe0e6] hover:bg-[#f0f2f4] text-[#111418] text-sm font-bold leading-normal transition-colors gap-2"
                                        >
                                            <LayoutDashboard size={16} />
                                            <span className="truncate">Dashboard</span>
                                        </Link>
                                        <button
                                            onClick={handleLogout}
                                            className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#FF6B00] hover:bg-orange-600 text-white text-sm font-bold leading-normal shadow-sm transition-colors"
                                        >
                                            <span className="truncate">Logout</span>
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/login" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-transparent border border-[#dbe0e6] hover:bg-[#f0f2f4] text-[#111418] text-sm font-bold leading-normal transition-colors">
                                            <span className="truncate">Login</span>
                                        </Link>
                                        <Link to="/register" className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-[#FF6B00] hover:bg-orange-600 text-white text-sm font-bold leading-normal shadow-sm transition-colors">
                                            <span className="truncate">Sign Up</span>
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <span
                                className="material-symbols-outlined text-[24px] cursor-pointer"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </span>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-[40] bg-white pt-24 px-6 flex flex-col gap-4">
                    {/* Links */}
                    <Link to="/" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold py-2 border-b">Home</Link>
                    <a href="#" className="text-xl font-bold py-2 border-b flex justify-between items-center">Categories <ChevronDown size={20} /></a>
                    <Link to="/join-partner" onClick={() => setIsMenuOpen(false)} className="text-xl font-bold py-2 border-b">Become a Pro</Link>

                    {user ? (
                        <>
                            <Link to={user.role === 'technician' ? '/technician-dashboard' : '/dashboard'} onClick={() => setIsMenuOpen(false)} className="text-xl font-bold py-2 text-[#FF6B00]">Dashboard</Link>
                            <button onClick={() => { handleLogout(); setIsMenuOpen(false); }} className="text-left text-xl font-bold py-2 text-red-500">Logout</button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-3 mt-4">
                            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-3 rounded-lg border border-gray-300 text-center font-bold">Login</Link>
                            <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full py-3 rounded-lg bg-[#FF6B00] text-white text-center font-bold">Sign Up</Link>
                        </div>
                    )}
                </div>
            )}
        </>
    );
};

export default Navbar;
