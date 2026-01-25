import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

// --- Shared Components ---
const SidebarItem = ({ icon: Icon, label, active, badge, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all text-sm mb-1
        ${active
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}
    >
        <Icon size={18} className={active ? 'text-white' : 'text-slate-400'} />
        <span className="flex-1 text-left tracking-tight">{label}</span>
        {badge && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-red-500 text-white'}`}>
                {badge}
            </span>
        )}
    </button>
);

const TechnicianLayout = ({ children, title = "Dashboard", headerActions }) => {
    useProfileRefresher(); // [NEW] Auto-refresh profile on mount
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
                console.log("📡 [TechnicianLayout] Real-time status update received:", data.status);
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
            console.log(`📡 [TechnicianLayout] Manually changing status to: ${backendStatus}`);
            await updateTechnicianStatus(user.id, backendStatus);
            updateUser({ status: backendStatus });
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Failed to update status. Please try again.");
        }
    };

    // Determine active menu item based on path
    const isActive = (path) => location.pathname === path;

    // Dynamic Location Resolution
    const lat = user?.latitude || user?.fixedLatitude || user?.registeredLatitude || user?.location?.latitude;
    const lng = user?.longitude || user?.fixedLongitude || user?.registeredLongitude || user?.location?.longitude;

    // Explicit Address String Name (Preferred)
    const storedAddress = user?.addressDetails || user?.baseAddress || user?.location?.address;

    // Fallback: Coordinates String or "Pending"
    const coordString = (lat && lng) ? `${Number(lat).toFixed(4)}, ${Number(lng).toFixed(4)}` : "Location Pending...";

    // State for resolved address
    const [resolvedAddress, setResolvedAddress] = useState(null);

    // Initial Display: Stored Name > Resolved Name > Coords > "Pending"
    const displayLocation = storedAddress || resolvedAddress || coordString;

    // Effect: Reverse Geocode if we have coords but no address name
    useEffect(() => {
        if (!storedAddress && lat && lng && !resolvedAddress) {
            const fetchAddress = async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    const data = await res.json();
                    if (data && data.address) {
                        // Construct simple address: City, State
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

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
            {/* --- MOBILE BACKDROP --- */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm animate-in fade-in duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* --- SIDEBAR --- */}
            <aside
                className={`fixed lg:static inset-y-0 left-0 z-40 w-64 flex flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:translate-x-0 shrink-0 shadow-lg lg:shadow-sm
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="p-6 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                            <Shield size={22} fill="currentColor" />
                        </div>
                        <h2 className="text-xl font-black tracking-tight text-slate-800">TechPro</h2>
                    </div>
                    <button
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="lg:hidden p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-1 overflow-y-auto hide-scrollbar pb-6">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Dashboard"
                        active={isActive('/technician-dashboard') || isActive('/dashboard')}
                        onClick={() => navigate('/technician-dashboard')}
                    />
                    <SidebarItem
                        icon={ClipboardList}
                        label="Job History Log"
                        active={isActive('/job-history')}
                        onClick={() => navigate('/job-history')}
                    />
                    <SidebarItem icon={MessageSquare} label="Live Chat" badge="3" onClick={() => navigate('/technician/chat')} />
                    <SidebarItem
                        icon={Wallet}
                        label="Wallet & Payments"
                        active={isActive('/wallet')}
                        onClick={() => navigate('/wallet')}
                    />

                    <div className="my-4 h-px bg-slate-100 mx-2"></div>

                    <SidebarItem
                        icon={BarChart2}
                        label="Performance"
                        active={isActive('/earnings-hub')}
                        onClick={() => navigate('/earnings-hub')}
                    />
                    <SidebarItem
                        icon={Headphones}
                        label="Feedback Hub"
                        active={isActive('/feedback-hub')}
                        onClick={() => navigate('/feedback-hub')}
                    />
                    <SidebarItem
                        icon={Tag}
                        label="Admin Offers"
                        active={isActive('/technician-offers')}
                        onClick={() => navigate('/technician-offers')}
                    />

                    <div className="pt-4 mt-auto">
                        <SidebarItem icon={Settings} label="Settings" onClick={() => { }} />
                        <div className="pl-9 mt-2">
                            <button className="flex items-center gap-2 text-xs text-slate-400 hover:text-slate-600 font-bold transition-colors uppercase tracking-wider">
                                <Globe size={12} /> Language
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="p-4 border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-100">
                        <div className="size-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                            <img
                                src={user?.photo || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                            <h1 className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Technician'}</h1>
                            <p className="text-[10px] text-slate-500 uppercase font-black truncate text-blue-600">{user?.serviceType || 'General'}</p>
                        </div>
                        <button onClick={logout} className="text-slate-400 hover:text-red-500 shrink-0 transition-colors">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col overflow-hidden relative">
                {/* Header */}
                <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-8 z-20 sticky top-0 shrink-0 shadow-sm/50 gap-2">
                    <div className="flex items-center gap-2 lg:gap-6 min-w-0 shrink">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-lg transition-colors shrink-0"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="min-w-0 shrink">
                            <h1 className="text-lg lg:text-xl font-black text-slate-800 truncate tracking-tight">{title}</h1>
                            <p className="text-xs text-slate-500 font-medium hidden sm:block">Welcome back, get ready for your tasks</p>
                        </div>

                        <div className="hidden lg:block h-8 w-px bg-slate-100 mx-2 shrink-0"></div>

                        {/* Location & Signal - Visible on Mobile now */}
                        <div className="flex items-center gap-2 lg:gap-6 min-w-0 shrink-0 ml-auto lg:ml-0">
                            <div className="flex items-center gap-2 lg:gap-3 min-w-0 group cursor-default">
                                <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors shrink-0">
                                    <MapPin size={16} />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden lg:block">Current Location</p>
                                    <p className="text-xs font-bold text-slate-700 truncate max-w-[70px] sm:max-w-[120px] lg:max-w-[180px]" title={currentLocationName}>{currentLocationName}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                {network.type === 'wifi' ? <Wifi size={18} className="text-emerald-500" /> : <Signal size={18} className="text-emerald-500" />}
                                <span className="text-xs font-bold text-slate-600 hidden sm:block">{network.signal}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 lg:gap-4 shrink-0">
                        {/* Date - Visible on mobile now */}
                        <div className="flex flex-col items-end mr-1 lg:mr-2 text-right">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:block">Today</p>
                            <p className="text-[10px] sm:text-xs font-bold text-slate-700 whitespace-nowrap">
                                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                <span className="hidden sm:inline">, {new Date().getFullYear()}</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-2 lg:gap-4">
                            {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}

                            <div className="relative">
                                <select
                                    value={currentUiStatus}
                                    onChange={handleStatusChange}
                                    className={`appearance-none text-[10px] lg:text-[11px] font-bold uppercase tracking-wider pl-3 lg:pl-4 pr-8 lg:pr-10 py-2 lg:py-2.5 rounded-xl border focus:outline-none focus:ring-2 cursor-pointer shadow-sm transition-all max-w-[90px] lg:max-w-none truncate
                                        ${currentUiStatus === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-200' :
                                            currentUiStatus === 'Finishing Job' ? 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-200' :
                                                currentUiStatus === 'Engaged' ? 'bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-200' :
                                                    'bg-rose-50 text-rose-700 border-rose-100 hover:border-rose-200'}
                                    `}
                                >
                                    <option className="text-emerald-700" value="Available">Available</option>
                                    <option className="text-blue-700" value="Finishing Job">Finishing Job</option>
                                    <option className="text-amber-700" value="Engaged">Engaged</option>
                                    <option className="text-rose-700" value="Not Available">Not Available</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2 lg:right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                            </div>

                            <button className="p-2 lg:p-2.5 rounded-full hover:bg-slate-100 relative text-slate-400 hover:text-slate-600 transition-colors">
                                <Bell size={20} />
                                <span className="absolute top-2.5 right-2.5 size-2 bg-red-500 rounded-full border-2 border-white ring-1 ring-white"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {children}

            </main>
        </div>
    );
};

export default TechnicianLayout;
