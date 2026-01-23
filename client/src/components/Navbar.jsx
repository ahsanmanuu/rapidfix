import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            <nav className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="flex items-center justify-between h-14 md:h-16">

                        {/* LEFT: Mobile menu button OR Desktop nav links */}
                        <div className="flex items-center gap-6">
                            {/* Mobile Menu Button */}
                            <button
                                className="md:hidden p-2 -ml-2 text-gray-700"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>

                            {/* Desktop Navigation Links */}
                            <div className="hidden md:flex items-center gap-6">
                                <a href="#" className="flex items-center gap-1 text-gray-700 text-sm font-medium hover:text-[#FF6B00]">
                                    Categories <ChevronDown size={16} />
                                </a>
                                <Link to="/join-partner" className="text-gray-700 text-sm font-medium hover:text-[#FF6B00]">
                                    Become a Pro
                                </Link>
                            </div>
                        </div>

                        {/* CENTER: Desktop Buttons */}
                        <div className="hidden md:flex items-center gap-2">
                            {user ? (
                                <>
                                    <Link
                                        to={user.role === 'technician' ? '/technician-dashboard' : '/dashboard'}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50"
                                    >
                                        <LayoutDashboard size={16} />
                                        Dashboard
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white text-sm font-semibold hover:bg-orange-600"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link to="/login" className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 text-sm font-semibold hover:bg-gray-50">
                                        Login
                                    </Link>
                                    <Link to="/register" className="px-4 py-2 rounded-lg bg-[#FF6B00] text-white text-sm font-semibold hover:bg-orange-600">
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* RIGHT: Logo (both mobile and desktop) */}
                        <Link to="/" className="flex items-center gap-2 select-none">
                            <img src="/logo.png" alt="Fixofy" className="h-7 md:h-8 w-auto" />
                            <span className="text-[#FF6B00] text-lg md:text-xl font-black lowercase">fixofy</span>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Mobile Drawer */}
            {isMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-white">
                    <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100">
                        <button onClick={() => setIsMenuOpen(false)} className="p-2 -ml-2">
                            <X size={24} />
                        </button>
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-2">
                            <img src="/logo.png" alt="Fixofy" className="h-7 w-auto" />
                            <span className="text-[#FF6B00] text-lg font-black lowercase">fixofy</span>
                        </Link>
                    </div>
                    <div className="p-4 flex flex-col gap-2">
                        <Link to="/" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold text-gray-800 rounded-lg hover:bg-gray-50">
                            Home
                        </Link>
                        <a href="#" className="py-3 px-4 text-base font-semibold text-gray-800 rounded-lg hover:bg-gray-50 flex items-center justify-between">
                            Categories <ChevronDown size={18} />
                        </a>
                        <Link to="/join-partner" onClick={() => setIsMenuOpen(false)} className="py-3 px-4 text-base font-semibold text-gray-800 rounded-lg hover:bg-gray-50">
                            Become a Pro
                        </Link>
                        <hr className="my-2" />
                        {user ? (
                            <>
                                <Link
                                    to={user.role === 'technician' ? '/technician-dashboard' : '/dashboard'}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="py-3 px-4 text-base font-semibold text-[#FF6B00] rounded-lg hover:bg-orange-50"
                                >
                                    Dashboard
                                </Link>
                                <button
                                    onClick={() => { handleLogout(); setIsMenuOpen(false); }}
                                    className="py-3 px-4 text-left text-base font-semibold text-red-500 rounded-lg hover:bg-red-50"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <div className="flex flex-col gap-3 mt-4">
                                <Link to="/login" onClick={() => setIsMenuOpen(false)} className="w-full py-3 text-center rounded-lg border border-gray-200 font-semibold text-gray-700">
                                    Login
                                </Link>
                                <Link to="/register" onClick={() => setIsMenuOpen(false)} className="w-full py-3 text-center rounded-lg bg-[#FF6B00] text-white font-semibold">
                                    Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </>
    );
};

export default Navbar;
