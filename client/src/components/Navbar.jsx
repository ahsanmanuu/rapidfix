import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, LogOut, User, LayoutDashboard, Wallet, Briefcase, Home, Info, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <>
            <nav
                className={`fixed top-0 left-0 right-0 z-[9999] transition-all duration-500 ease-in-out h-24 flex items-center ${scrolled ? 'bg-white/95 backdrop-blur-lg shadow-xl' : 'bg-transparent'
                    }`}
            >
                <div className="container mx-auto px-4">
                    <div className="flex justify-between items-center h-full">
                        {/* Logo */}
                        <Link to="/" className={`text-4xl font-extrabold flex items-center gap-3 group tracking-tight ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                            <img src="/logo.png" alt="Fixofy Logo" className="h-14 w-auto group-hover:scale-110 transition-transform duration-300" />
                            <span className="tracking-tighter">Fixofy</span>
                        </Link>

                        {/* Desktop Menu */}
                        <div className="hidden lg:flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-slate-50 p-2 rounded-full border border-slate-200">
                                <NavLink to="/" icon={<Home size={18} />} text="Home" />
                                <NavLink to="/about" icon={<Info size={18} />} text="About" />
                                <NavLink to="/contact" icon={<Phone size={18} />} text="Contact" />
                            </div>

                            {user ? (
                                <div className="flex items-center gap-4">
                                    <Link to="/wallet" className="flex items-center gap-2 font-medium text-slate-600 hover:text-slate-900">
                                        <Wallet size={20} />
                                        <span>Wallet</span>
                                    </Link>
                                    <Link
                                        to={user.role === 'technician' ? '/technician-dashboard' : '/dashboard'}
                                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                                        title="Dashboard"
                                    >
                                        <LayoutDashboard size={20} />
                                    </Link>
                                    <div className="flex items-center gap-3 px-4 pl-2 border-l border-slate-200">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm text-blue-700 font-bold border-2 border-white shadow-sm">
                                            {user.name && user.name.length > 0 ? user.name.charAt(0) : 'U'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="p-3 rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                        title="Logout"
                                    >
                                        <LogOut size={20} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-14">
                                    <Link
                                        to="/login"
                                        className={`px-8 py-3 rounded-full font-bold text-sm transition-all duration-300 hover:scale-105 active:scale-95 border ${scrolled
                                            ? 'border-slate-300 text-slate-700 hover:border-blue-600 hover:text-blue-600 hover:bg-blue-50'
                                            : 'border-white/40 text-white hover:bg-white hover:text-slate-900'
                                            }`}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/register"
                                        className={`
                                            group relative px-8 py-3 rounded-full font-bold text-sm shadow-sm
                                            transition-all duration-300 hover:scale-105 active:scale-95
                                            border flex items-center gap-2 overflow-hidden
                                            ${scrolled
                                                ? 'border-blue-600 text-blue-600 hover:bg-blue-50'
                                                : 'border-white text-white hover:bg-white/10'}
                                        `}
                                    >
                                        <span className="relative z-10 flex items-center gap-2">
                                            <User size={18} className="group-hover:rotate-12 transition-transform duration-300" />
                                            Register
                                        </span>
                                    </Link>
                                    <Link
                                        to="/join-partner"
                                        className={`
                                            hidden xl:flex
                                            px-6 py-3 rounded-full font-bold text-sm border-2 transition-all duration-300
                                            hover:scale-105 active:scale-95 flex items-center gap-2
                                            ${scrolled
                                                ? 'border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white'
                                                : 'border-white text-white hover:bg-white hover:text-slate-900'
                                            }
                                        `}
                                    >
                                        <Briefcase size={18} />
                                        <span>Join as Partner</span>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="lg:hidden flex items-center">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-800 p-2 hover:bg-slate-100 rounded-lg transition-colors">
                                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Backdrop & Drawer - Moved Outside Nav */}
            <div className={`lg:hidden fixed inset-0 z-[10000] transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
                {/* Backdrop */}
                <div
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    onClick={() => setIsMenuOpen(false)}
                />

                {/* Drawer Panel */}
                <div
                    className={`absolute inset-y-0 right-0 w-[80%] max-w-sm bg-white shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
                >
                    {/* Header with Close Button */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-100">
                        <span className="text-xl font-bold text-slate-900 tracking-tight">Menu</span>
                        <button
                            onClick={() => setIsMenuOpen(false)}
                            className="p-2 rounded-full bg-slate-50 text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Menu Content */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        <div className="space-y-2">
                            <MobileLink to="/" icon={<Home size={20} />} onClick={() => setIsMenuOpen(false)}>Home</MobileLink>
                            <MobileLink to="/about" icon={<Info size={20} />} onClick={() => setIsMenuOpen(false)}>About Us</MobileLink>
                            <MobileLink to="/contact" icon={<Phone size={20} />} onClick={() => setIsMenuOpen(false)}>Contact Us</MobileLink>
                            <MobileLink to="/join-partner" icon={<Briefcase size={20} />} onClick={() => setIsMenuOpen(false)} className="text-blue-600 bg-blue-50/50">Join as Partner</MobileLink>
                        </div>

                        <div className="h-px bg-slate-100 my-2"></div>

                        {user ? (
                            <div className="space-y-4">
                                <Link
                                    to="/wallet"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                        <Wallet size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">My Wallet</p>
                                        <p className="text-xs text-slate-500">View transactions</p>
                                    </div>
                                </Link>

                                <Link
                                    to="/dashboard"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center gap-3 w-full p-4 rounded-xl bg-slate-50 hover:bg-blue-50 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                        <LayoutDashboard size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800">Dashboard</p>
                                        <p className="text-xs text-slate-500">Manage account</p>
                                    </div>
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border border-red-100 text-red-600 hover:bg-red-50 font-bold transition-all mt-4"
                                >
                                    <LogOut size={20} />
                                    Logout
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 mt-auto">
                                <Link
                                    to="/login"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center py-4 rounded-xl border-2 border-slate-200 font-bold text-slate-700 hover:border-slate-300 hover:bg-slate-50 transition-all"
                                >
                                    Log In
                                </Link>
                                <Link
                                    to="/register"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block w-full text-center py-4 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl transition-all"
                                >
                                    Register Now
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

const NavLink = ({ to, icon, text }) => (
    <Link to={to} className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all">
        {icon}
        <span className="hidden xl:inline">{text}</span>
    </Link>
);

const MobileLink = ({ children, to, icon, onClick, className = "" }) => (
    <Link
        to={to}
        onClick={onClick}
        className={`flex items-center gap-4 px-4 py-3 rounded-xl text-slate-600 font-semibold hover:bg-slate-50 hover:text-blue-600 transition-all ${className}`}
    >
        {icon && <span className="text-slate-400 group-hover:text-blue-500">{icon}</span>}
        <span className="text-base">{children}</span>
    </Link>
);

export default Navbar;
