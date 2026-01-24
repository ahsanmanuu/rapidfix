import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardList, MessageSquare, Wallet, BarChart2,
    Headphones, Tag, Settings, Globe, LogOut, MapPin, Signal, Wifi,
    Bell, ChevronDown, Shield
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../components/Dashboard/TechnicianDashboard.css';

// --- Shared Hook ---
const useNetworkStatus = () => {
    const [status, setStatus] = useState({ type: 'wifi', signal: '5G' });

    useEffect(() => {
        const updateNetwork = () => {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn) {
                const type = conn.type === 'wifi' ? 'wifi' : 'cellular';
                const effective = conn.effectiveType ? conn.effectiveType.toUpperCase() : '4G';
                setStatus({ type, signal: effective === 'WIFI' ? 'WiFi' : effective });
            }
        };

        updateNetwork();
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
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const network = useNetworkStatus();
    const [technicianStatus, setTechnicianStatus] = useState('Available');

    const handleStatusChange = (e) => setTechnicianStatus(e.target.value);

    // Determine active menu item based on path
    const isActive = (path) => location.pathname === path;

    const currentLocationName = "London, SE1 7PB"; // Could be dynamic

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
            {/* --- SIDEBAR --- */}
            <aside className="w-64 flex flex-col border-r border-slate-200 bg-white hidden lg:flex shrink-0 z-30 shadow-sm">
                <div className="p-6 flex items-center gap-3">
                    <div className="size-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <Shield size={22} fill="currentColor" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-slate-800">TechPro</h2>
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
                    <SidebarItem icon={Wallet} label="Wallet & Payments" onClick={() => navigate('/technician/wallet')} />

                    <div className="my-4 h-px bg-slate-100 mx-2"></div>

                    <SidebarItem icon={BarChart2} label="Performance" onClick={() => { }} />
                    <SidebarItem icon={Headphones} label="Complaints Hub" onClick={() => { }} />
                    <SidebarItem icon={Tag} label="Admin Offers" onClick={() => { }} />

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
                <header className="h-20 border-b border-slate-200 bg-white flex items-center justify-between px-6 lg:px-8 z-20 sticky top-0 shrink-0 shadow-sm/50">
                    <div className="flex items-center gap-6 min-w-0">
                        <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg">
                            <ChevronDown size={24} className="rotate-90" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black text-slate-800 truncate tracking-tight">{title}</h1>
                            <p className="text-xs text-slate-500 font-medium hidden sm:block">Welcome back, get ready for your tasks</p>
                        </div>

                        <div className="hidden lg:block h-8 w-px bg-slate-100 mx-2 shrink-0"></div>

                        <div className="hidden lg:flex items-center gap-6 min-w-0">
                            <div className="flex items-center gap-3 min-w-0 group cursor-default">
                                <div className="size-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                    <MapPin size={16} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Location</p>
                                    <p className="text-xs font-bold text-slate-700 truncate max-w-[180px]" title={currentLocationName}>{currentLocationName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {network.type === 'wifi' ? <Wifi size={18} className="text-emerald-500" /> : <Signal size={18} className="text-emerald-500" />}
                                <span className="text-xs font-bold text-slate-600">{network.signal}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-end mr-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Today</p>
                            <p className="text-xs font-bold text-slate-700">
                                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                        </div>

                        <div className="flex items-center gap-4">
                            {headerActions && <div className="flex items-center gap-3">{headerActions}</div>}

                            <div className="relative">
                                <select
                                    value={technicianStatus}
                                    onChange={handleStatusChange}
                                    className={`appearance-none text-[11px] font-bold uppercase tracking-wider pl-4 pr-10 py-2.5 rounded-xl border focus:outline-none focus:ring-2 cursor-pointer shadow-sm transition-all
                                        ${technicianStatus === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:border-emerald-200' :
                                            technicianStatus === 'Finishing Job' ? 'bg-blue-50 text-blue-700 border-blue-100 hover:border-blue-200' :
                                                technicianStatus === 'Engaged' ? 'bg-amber-50 text-amber-700 border-amber-100 hover:border-amber-200' :
                                                    'bg-rose-50 text-rose-700 border-rose-100 hover:border-rose-200'}
                                    `}
                                >
                                    <option className="text-emerald-700" value="Available">Available</option>
                                    <option className="text-blue-700" value="Finishing Job">Finishing Job</option>
                                    <option className="text-amber-700" value="Engaged">Engaged</option>
                                    <option className="text-rose-700" value="Not Available">Not Available</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                            </div>

                            <button className="p-2.5 rounded-full hover:bg-slate-100 relative text-slate-400 hover:text-slate-600 transition-colors">
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
