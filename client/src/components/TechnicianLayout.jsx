import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard, ClipboardList, MessageSquare, Wallet, BarChart2,
    Headphones, Tag, Settings, Globe, LogOut, MapPin, Signal, Wifi,
    Bell, ChevronDown, Shield, Menu, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { updateTechnicianStatus } from '../services/api';
import '../components/Dashboard/TechnicianDashboard.css';
import useProfileRefresher from '../hooks/useProfileRefresher';

// --- Shared Hook ---
const useNetworkStatus = () => {
    const getNetworkInfo = () => {
        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            const type = conn.type === 'wifi' ? 'wifi' : 'cellular';
            const effective = conn.effectiveType ? conn.effectiveType.toUpperCase() : '4G';
            return { type, signal: effective === 'WIFI' ? 'WiFi' : effective };
        }
        return { type: 'wifi', signal: '5G' };
    };

    const [status, setStatus] = useState(getNetworkInfo);

    useEffect(() => {
        const updateNetwork = () => {
            setStatus(getNetworkInfo());
        };

        const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        if (conn) {
            conn.addEventListener('change', updateNetwork);
            return () => conn.removeEventListener('change', updateNetwork);
        }
    }, []);
    return status;
};

const SidebarItem = ({ icon: Icon, label, active, badge, onClick }) => (
    <motion.button
        whileHover={{ scale: 1.01, x: 4 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`w-full flex items-center gap-3.5 px-5 py-4 rounded-2xl font-black transition-all text-[13px] relative group overflow-hidden
        ${active
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200/50'
                : 'text-slate-500 hover:bg-blue-50/50 hover:text-blue-600'}`}
    >
        {active && (
            <motion.div
                layoutId="activeIndicator"
                className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full"
            />
        )}
        <Icon size={20} strokeWidth={active ? 3 : 2} className={active ? 'text-white' : 'text-slate-400 group-hover:text-blue-600 transition-colors'} />
        <span className="flex-1 text-left tracking-tight uppercase tracking-widest">{label}</span>
        {badge && (
            <span className={`text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-tighter ${active ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-600'}`}>
                {badge}
            </span>
        )}
    </motion.button>
);

const TechnicianLayout = ({ children, title = "Dashboard", headerActions }) => {
    useProfileRefresher();
    const { user, logout, updateUser } = useAuth();
    const socket = useSocket();
    const navigate = useNavigate();
    const location = useLocation();
    const network = useNetworkStatus();

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Sync status with real-time events
    useEffect(() => {
        if (!socket || !user?.id) return;

        const handleStatusUpdate = (data) => {
            if (data.technicianId === user.id) {
                updateUser({ status: data.status });
            }
        };

        socket.on('technician_status_update', handleStatusUpdate);
        return () => socket.off('technician_status_update', handleStatusUpdate);
    }, [socket, user?.id, updateUser]);

    // UI Status Mapping
    const statusMap = {
        'available': 'Available',
        'engaged': 'Engaged',
        'finishing_work': 'Finishing Job',
        'offline': 'Not Available',
        'rejected': 'Not Available',
        'pending': 'Under Review'
    };

    const reverseStatusMap = {
        'Available': 'available',
        'Finishing Job': 'finishing_work',
        'Engaged': 'engaged',
        'Not Available': 'offline'
    };

    const currentUiStatus = statusMap[user?.status?.toLowerCase()] || 'Available';

    const handleStatusChange = async (e) => {
        const newUiStatus = e.target.value;
        const backendStatus = reverseStatusMap[newUiStatus];

        try {
            await updateTechnicianStatus(user.id, backendStatus);
            updateUser({ status: backendStatus });
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Failed to update status. Please try again.");
        }
    };

    const isActive = (path) => location.pathname === path;

    // Dynamic Location Resolution
    const lat = user?.latitude || user?.fixedLatitude || user?.registeredLatitude || user?.location?.latitude;
    const lng = user?.longitude || user?.fixedLongitude || user?.registeredLongitude || user?.location?.longitude;
    const storedAddress = user?.addressDetails || user?.baseAddress || user?.location?.address;
    const coordString = (lat && lng) ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : "Location Pending...";
    const [resolvedAddress, setResolvedAddress] = useState(null);
    const displayLocation = storedAddress || resolvedAddress || coordString;

    useEffect(() => {
        if (!storedAddress && lat && lng && !resolvedAddress) {
            const fetchAddress = async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    if (data && data.address) {
                        const city = data.address.city || data.address.town || data.address.village || data.address.suburb;
                        const state = data.address.state;
                        if (city || state) {
                            setResolvedAddress([city, state].filter(Boolean).join(', '));
                        }
                    }
                } catch (e) {
                    console.error("Geocoding failed in header", e);
                }
            };
            fetchAddress();
        }
    }, [lat, lng, storedAddress, resolvedAddress]);

    const currentLocationName = displayLocation;

    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50/50 font-sans text-slate-900">
            {/* --- MOBILE BACKDROP --- */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden backdrop-blur-md"
                        onClick={() => setIsMobileMenuOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* --- SIDEBAR --- */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-40 w-80 flex flex-col border-r border-slate-200 bg-white transition-all duration-500 ease-in-out lg:translate-x-0 shrink-0 shadow-2xl lg:shadow-[20px_0_60px_-15px_rgba(0,0,0,0.03)]
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                {/* --- Header / Logo --- */}
                <div className="p-10 pb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4 group cursor-pointer" onClick={() => navigate('/technician-dashboard')}>
                        <div className="size-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-200 group-hover:scale-105 transition-all overflow-hidden p-2">
                            <img src="/logo.png" alt="Fixofy" className="w-full h-full object-contain brightness-0 invert" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-xl font-black tracking-tighter text-slate-900 leading-none">RapidFix</h2>
                            <p className="text-[10px] font-black text-blue-600 tracking-[0.2em] uppercase mt-1">Technician</p>
                        </div>
                    </div>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                {/* --- Sections --- */}
                <nav className="flex-1 px-5 space-y-6 overflow-y-auto hide-scrollbar py-6">
                    {/* CORE SECTION */}
                    <div className="space-y-1.5">
                        <div className="px-5 mb-3 flex items-center justify-between">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Core Engine</p>
                        </div>
                        <SidebarItem
                            icon={LayoutDashboard}
                            label="Overview"
                            active={isActive('/technician-dashboard') || isActive('/dashboard')}
                            onClick={() => navigate('/technician-dashboard')}
                        />
                        <SidebarItem
                            icon={ClipboardList}
                            label="Job Ledger"
                            active={isActive('/job-history')}
                            onClick={() => navigate('/job-history')}
                        />
                        <SidebarItem
                            icon={MessageSquare}
                            label="Live Chat"
                            badge="3"
                            active={isActive('/technician/chat')}
                            onClick={() => navigate('/technician/chat')}
                        />
                    </div>

                    {/* FINANCE SECTION */}
                    <div className="space-y-1.5 pt-4 border-t border-slate-100">
                        <div className="px-5 mb-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Financials</p>
                        </div>
                        <SidebarItem
                            icon={Wallet}
                            label="My Wallet"
                            active={isActive('/wallet')}
                            onClick={() => navigate('/wallet')}
                        />
                        <SidebarItem
                            icon={BarChart2}
                            label="Earnings"
                            active={isActive('/earnings-hub')}
                            onClick={() => navigate('/earnings-hub')}
                        />
                        <SidebarItem
                            icon={Tag}
                            label="Admin Offers"
                            active={isActive('/technician-offers')}
                            onClick={() => navigate('/technician-offers')}
                        />
                    </div>

                    {/* TOOLS SECTION */}
                    <div className="space-y-1.5 pt-4 border-t border-slate-100">
                        <div className="px-5 mb-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Support & Feedback</p>
                        </div>
                        <SidebarItem
                            icon={Headphones}
                            label="Help Hub"
                            active={isActive('/feedback-hub')}
                            onClick={() => navigate('/feedback-hub')}
                        />
                        <SidebarItem icon={Settings} label="Settings" onClick={() => { }} />
                    </div>
                </nav>

                {/* --- Profile Card --- */}
                <div className="p-6 border-t border-slate-100 bg-slate-50/50">
                    <div className="bg-white rounded-3xl p-4 flex items-center gap-4 shadow-xl shadow-slate-200/50 border border-slate-100 group">
                        <div className="size-12 rounded-2xl overflow-hidden ring-4 ring-slate-100/50 shadow-sm shrink-0 transition-all group-hover:scale-105">
                            <img
                                src={user?.photo || `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col flex-1 min-w-0">
                            <h1 className="text-xs font-black text-slate-900 truncate tracking-tight">{user?.name || 'Technician'}</h1>
                            <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Online • {user?.serviceType || 'General'}</p>
                        </div>
                        <button onClick={logout} className="size-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 rounded-xl transition-all shadow-sm bg-slate-50">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-24 border-b border-slate-200/60 bg-white/80 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 z-20 sticky top-0 shrink-0 shadow-sm gap-4">
                    <div className="flex items-center gap-3 lg:gap-8 min-w-0 shrink">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-3 -ml-2 text-slate-600 hover:bg-slate-100 rounded-2xl transition-all shrink-0 shadow-sm border border-slate-200"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="min-w-0 shrink">
                            <h1 className="text-xl lg:text-3xl font-black text-slate-900 truncate tracking-tighter mb-1">{title}</h1>
                            <p className="text-xs text-slate-400 font-bold hidden sm:block tracking-wide uppercase opacity-70">Welcome back, {user?.name?.split(' ')[0]}</p>
                        </div>

                        <div className="hidden lg:block h-10 w-px bg-slate-200 mx-2 shrink-0"></div>

                        {/* Location & Signal */}
                        <div className="hidden sm:flex items-center gap-3 lg:gap-8 min-w-0 shrink-0">
                            <div className="flex items-center gap-3 min-w-0 group cursor-pointer bg-slate-50 px-3 py-1.5 rounded-2xl border border-slate-200/50 hover:bg-white transition-all">
                                <div className="size-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600 shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em] hidden lg:block">Location</p>
                                    <p className="text-xs font-black text-slate-900 truncate max-w-[80px] lg:max-w-[220px]" title={currentLocationName}>{currentLocationName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-2xl border border-emerald-100/50 shadow-sm shrink-0">
                                {network.type === 'wifi' ? <Wifi size={18} className="text-emerald-600" /> : <Signal size={18} className="text-emerald-600" />}
                                <span className="text-xs font-black text-emerald-700 hidden lg:block">{network.signal}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 lg:gap-6 shrink-0">
                        {/* Status Toggle Area */}
                        <div className="flex items-center gap-4">
                            <div className="relative group">
                                <select
                                    value={currentUiStatus}
                                    onChange={handleStatusChange}
                                    className={`appearance-none text-[10px] lg:text-[11px] font-black uppercase tracking-widest pl-4 pr-10 py-3 rounded-2xl border-2 focus:outline-none focus:ring-4 focus:ring-blue-500/10 cursor-pointer shadow-sm transition-all min-w-[120px] lg:min-w-[150px]
                                        ${currentUiStatus === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-500/20 hover:border-emerald-500' :
                                            currentUiStatus === 'Finishing Job' ? 'bg-blue-50 text-blue-700 border-blue-500/20 hover:border-blue-500' :
                                                currentUiStatus === 'Engaged' ? 'bg-amber-50 text-amber-700 border-amber-500/20 hover:border-amber-500' :
                                                    'bg-rose-50 text-rose-700 border-rose-500/20 hover:border-rose-500'}
                                    `}
                                >
                                    <option value="Available">Available</option>
                                    <option value="Finishing Job">Finishing Job</option>
                                    <option value="Engaged">Engaged</option>
                                    <option value="Not Available">Offline</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none group-hover:translate-y--0.5 transition-transform" />
                            </div>

                            <button className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-lg hover:shadow-blue-600/10 transition-all relative">
                                <Bell size={22} />
                                <span className="absolute top-2.5 right-2.5 size-3 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-10 transition-all duration-500 bg-slate-50/30">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {children}
                    </motion.div>
                </div>

            </main>
        </div>
    );
};

export default TechnicianLayout;
