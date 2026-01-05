import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Menu, X, User, LogOut, Wallet, Home, LayoutDashboard, Briefcase, Info, Phone } from 'lucide-react';

const Navbar = ({ user, logout }) => {
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
        <nav
            className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'bg-white shadow-md py-6' : 'bg-white/95 backdrop-blur-md py-10 border-b border-slate-100'
                }`}
        >
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-full">
                    {/* Logo */}
                    <Link to="/" className="text-3xl font-extrabold flex items-center gap-3 group text-slate-900 tracking-tight">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-2xl font-bold shadow-blue-200 shadow-xl group-hover:scale-105 transition-transform duration-300">
                            F
                        </div>
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
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="px-5 py-2.5 text-sm font-bold text-slate-900 hover:text-blue-600 transition-colors tracking-wide border-2 border-transparent hover:border-slate-100 rounded-full">Log In</Link>
                                <Link to="/register" className="px-6 py-2.5 rounded-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all font-bold text-sm shadow-sm flex items-center gap-2">
                                    <User size={18} />
                                    Register
                                </Link>
                                <Link to="/join-partner" className="px-6 py-2.5 rounded-full border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white transition-all font-bold text-sm shadow-sm flex items-center gap-2">
                                    <Briefcase size={18} />
                                    Join as Partner
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

            {/* Mobile Menu */}
            <div className={`lg:hidden absolute top - full left - 0 w - full bg - white border - b border - slate - 200 p - 4 transition - all duration - 300 transform origin - top shadow - xl ${isMenuOpen ? 'scale-y-100 opacity-100' : 'scale-y-0 opacity-0 pointer-events-none'} `}>
                <div className="flex flex-col space-y-4">
                    <MobileLink to="/" onClick={() => setIsMenuOpen(false)}>Home</MobileLink>
                    <MobileLink to="/about" onClick={() => setIsMenuOpen(false)}>About Us</MobileLink>
                    <MobileLink to="/contact" onClick={() => setIsMenuOpen(false)}>Contact Us</MobileLink>
                    <MobileLink to="/join-partner" onClick={() => setIsMenuOpen(false)} className="text-blue-600 font-semibold">Join as Partner</MobileLink>
                    <div className="h-px bg-slate-100 my-2"></div>
                    {user ? (
                        <>
                            <MobileLink to="/wallet" onClick={() => setIsMenuOpen(false)}>Wallet</MobileLink>
                            <MobileLink to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</MobileLink>
                            <button onClick={handleLogout} className="text-left text-red-500 py-2 font-medium">Logout</button>
                        </>
                    ) : (
                        <>
                            <MobileLink to="/login" onClick={() => setIsMenuOpen(false)}>Login</MobileLink>
                            <MobileLink to="/register" onClick={() => setIsMenuOpen(false)} className="text-blue-600">Register</MobileLink>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

const NavLink = ({ to, icon, text }) => (
    <Link to={to} className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-all">
        {icon}
        <span className="hidden xl:inline">{text}</span>
    </Link>
);

const MobileLink = ({ children, className = "", ...props }) => (
    <Link className={`block py - 2 text - lg font - medium text - slate - 800 hover: text - blue - 600 ${className} `} {...props}>
        {children}
    </Link>
);

export default Navbar;
