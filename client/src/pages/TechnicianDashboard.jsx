import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardList, MessageSquare, Wallet, BarChart2,
    Headphones, Tag, Settings, Globe, LogOut, MapPin, Signal, Calendar,
    Bell, ChevronDown, MoreVertical, Car, X, Check, Star, Clock,
    CheckCircle2, AlertCircle, Shield, CreditCard, User, Wifi
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import useSupabaseRealtime from '../hooks/useSupabaseRealtime';
import '../components/Dashboard/TechnicianDashboard.css'; // Correct path to CSS

// --- new hook for network status ---
const useNetworkStatus = () => {
    const [status, setStatus] = useState({ type: 'wifi', signal: '5G' });

    useEffect(() => {
        const updateNetwork = () => {
            const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            if (conn) {
                const type = conn.type === 'wifi' ? 'wifi' : 'cellular';
                // valid effectiveTypes: 'slow-2g', '2g', '3g', '4g'
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

// --- Components ---

const SidebarItem = ({ icon: Icon, label, active, badge, onClick }) => (
    <button
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium transition-all text-sm mb-0.5
        ${active ? 'bg-blue-500/10 text-blue-600 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
    >
        <Icon size={20} className={active ? 'text-blue-600' : 'text-slate-400'} />
        <span className="flex-1 text-left">{label}</span>
        {badge && (
            <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                {badge}
            </span>
        )}
    </button>
);

const StatCard = ({ icon: Icon, label, value, colorClass, iconBgClass }) => (
    <div className={`bg-white border-l-4 ${colorClass} shadow-sm rounded-xl p-3 flex items-center gap-3 transition-all hover:shadow-md border border-slate-200`}>
        <div className={`size-9 rounded-lg flex items-center justify-center ${iconBgClass}`}>
            <Icon size={18} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{label}</p>
            <h3 className="text-lg font-black leading-tight text-slate-900">{value}</h3>
        </div>
    </div>
);

const JobCard = ({ job, onAccept, onReject, onView }) => {
    const isNew = job.status === 'pending';
    const colorClass = isNew ? 'border-l-blue-500' : 'border-l-indigo-500';
    const badgeClass = isNew ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600';
    const statusLabel = isNew ? 'NEW REQUEST' : 'IN PROGRESS';

    return (
        <div className={`bg-white border border-slate-200 shadow-sm rounded-xl p-5 border-l-4 ${colorClass} flex flex-col justify-between h-full`}>
            <div>
                <div className="flex justify-between items-start mb-3">
                    <div className="flex flex-col min-w-0 flex-1 mr-2">
                        <span className={`text-[10px] font-black ${badgeClass} px-2 py-0.5 rounded w-fit mb-1 uppercase`}>
                            {statusLabel}
                        </span>
                        <h3 className="text-base font-bold text-slate-800 line-clamp-1 truncate" title={job.title || job.serviceType}>{job.title || job.serviceType}</h3>
                    </div>
                    <div className="text-right shrink-0">
                        <p className="text-sm font-black text-slate-900">₹{job.offerPrice || job.amount || 0}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase">Estimated</p>
                    </div>
                </div>
                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-xs text-slate-600 min-w-0">
                        <MapPin size={14} className="text-slate-400 shrink-0" />
                        <span className="truncate">{job.location?.address || 'Location Hidden'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Clock size={14} className="text-slate-400 shrink-0" />
                        <span>Today, {new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </div>

            {isNew ? (
                <div className="flex items-center gap-2 mt-auto">
                    <button
                        onClick={() => onAccept(job.id)}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                    >
                        Accept
                    </button>
                    <button
                        onClick={() => onReject(job.id)}
                        className="flex-1 px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
                    >
                        Reject
                    </button>
                    <button onClick={() => onView(job)} className="px-3 py-2 border border-slate-200 text-slate-400 rounded-lg hover:bg-slate-50 transition-colors">
                        <LayoutDashboard size={14} />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-between pt-4 border-t border-slate-50 mt-auto">
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase">
                        <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                        Job Active
                    </div>
                    <button onClick={() => onView(job)} className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase">
                        View Details
                    </button>
                </div>
            )}
        </div>
    );
};

const TechnicianDashboard = () => {
    const { user, logout, updateUser } = useAuth(); // Assuming updateUser logic exists or needs shim
    const navigate = useNavigate();
    const socket = useSocket();
    const network = useNetworkStatus(); // [NEW]

    // State
    const [stats, setStats] = useState({
        earnings: 0,
        monthlyRevenue: 0,
        completedJobs: 0,
        rating: 4.8
    });
    const [activeJobs, setActiveJobs] = useState([]);
    const [technicianStatus, setTechnicianStatus] = useState(user?.status || 'Available');
    const [loading, setLoading] = useState(false);

    // [NEW] Location State
    const [currentLocationName, setCurrentLocationName] = useState("Locating...");
    const [registeredAddress, setRegisteredAddress] = useState(user?.address || "Loading...");

    // Mock Data for Charts
    const earningsData = [
        { name: 'Mon', value: 2400 },
        { name: 'Tue', value: 1398 },
        { name: 'Wed', value: 9800 },
        { name: 'Thu', value: 3908 },
        { name: 'Fri', value: 4800 },
        { name: 'Sat', value: 3800 },
        { name: 'Sun', value: 4300 },
    ];

    // --- Effects ---

    // [NEW] Reverse Geocoding Effect
    useEffect(() => {
        if (!user) return;

        const resolveDetails = async () => {
            // 1. Registered Address from User Profile
            setRegisteredAddress(user.fixed_address || user.address || user.baseAddress || "No Registered Address");

            // 2. Live Location Reverse Geocoding
            const lat = user.latitude || user.location?.latitude;
            const lng = user.longitude || user.location?.longitude;

            if (lat && lng) {
                try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    if (!apiKey) return;

                    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
                    const data = await res.json();

                    if (data.results?.[0]) {
                        // Extract neighborhood/city for cleaner display (e.g., "Marylebone, London")
                        const comps = data.results[0].address_components;
                        const neighborhood = comps.find(c => c.types.includes('sublocality') || c.types.includes('neighborhood'))?.short_name;
                        const locality = comps.find(c => c.types.includes('locality'))?.short_name;

                        setCurrentLocationName(neighborhood && locality ? `${neighborhood}, ${locality}` : (locality || "Unknown City"));
                    }
                } catch (e) {
                    console.error("Geocoding failed", e);
                    setCurrentLocationName(user.city || "Unknown Location");
                }
            } else {
                setCurrentLocationName(user.city || "Location Pending");
            }
        };
        resolveDetails();
    }, [user]);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    // Listen to real-time job updates
    useSupabaseRealtime('jobs', (payload) => {
        // Simple handler to refresh on job changes related to this tech
        // In prod, optimize to specific ID checks
        fetchDashboardData();
    });

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // Parallel Fetch
            const [jobsRes, statsRes] = await Promise.all([
                api.getJobsByTechnician(user.id).catch(() => ({ data: { jobs: [] } })),
                // Mock stats or real endpoint if available
                Promise.resolve({ data: { earnings: 12500, monthly: 45000, completed: 12, rating: 4.8 } })
            ]);

            const allJobs = jobsRes.data.jobs || [];
            // Filter for Pending/Active
            const active = allJobs.filter(j => ['pending', 'accepted', 'in_progress', 'started'].includes(j.status));
            setActiveJobs(active);

            // Set stats (mix of real and mock for now)
            setStats({
                earnings: statsRes.data.earnings,
                monthlyRevenue: statsRes.data.monthly,
                completedJobs: allJobs.filter(j => j.status === 'completed').length,
                rating: user.rating || 4.8
            });

        } catch (err) {
            console.error("Dashboard Fetch Error:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (e) => {
        const newStatus = e.target.value;
        setTechnicianStatus(newStatus);
        try {
            await api.put(`/technicians/${user.id}/status`, { status: newStatus });
            // Optimistic update already done
            // updateUser({ status: newStatus }); // If this method exists
        } catch (err) {
            console.error("Status Update Failed", err);
            setTechnicianStatus(user.status); // Revert
        }
    };

    const handleAcceptJob = async (jobId) => {
        try {
            await api.acceptJob(jobId, user.id);
            // Refresh logic will catch this from socket or manual re-fetch
            fetchDashboardData();
        } catch (err) {
            alert("Failed to accept job: " + err.message);
        }
    };

    const handleRejectJob = async (jobId) => {
        // Implement reject API if exists, or just hide
        alert("Reject logic needs implementation in API");
    };

    return (
        <div className="flex h-screen overflow-hidden bg-background-light font-sans text-slate-900">
            {/* --- SIDEBAR --- */}
            <aside className="w-64 flex flex-col border-r border-slate-200 bg-white hidden lg:flex shrink-0 z-30">
                <div className="p-6 flex items-center gap-3">
                    <div className="size-9 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                        <Shield size={20} fill="currentColor" />
                    </div>
                    <h2 className="text-xl font-black tracking-tight text-slate-800">TechPro</h2>
                </div>

                <nav className="flex-1 px-4 space-y-0.5 overflow-y-auto hide-scrollbar pb-6">
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active onClick={() => { }} />
                    <SidebarItem icon={ClipboardList} label="My Jobs" onClick={() => navigate('/technician/jobs')} />
                    <SidebarItem icon={MessageSquare} label="Live Chat" badge="3" onClick={() => navigate('/technician/chat')} />
                    <SidebarItem icon={Wallet} label="Wallet & Payments" onClick={() => navigate('/technician/wallet')} />
                    <SidebarItem icon={BarChart2} label="Performance" onClick={() => { }} />
                    <SidebarItem icon={Headphones} label="Complaints Hub" onClick={() => { }} />
                    <SidebarItem icon={Tag} label="Admin Offers" onClick={() => { }} />

                    <div className="pt-4 mt-2 border-t border-slate-50">
                        <SidebarItem icon={Settings} label="Settings" onClick={() => { }} />
                        <div className="pl-9 mt-1">
                            <button className="flex items-center gap-3 text-xs text-slate-400 hover:text-slate-600 font-medium transition-colors">
                                <Globe size={14} /> Language
                            </button>
                        </div>
                    </div>
                </nav>

                <div className="p-4 mt-auto border-t border-slate-100">
                    <div className="bg-slate-50 rounded-xl p-3 flex items-center gap-3 hover:bg-slate-100 transition-colors cursor-pointer">
                        <div className="size-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm shrink-0">
                            <img
                                src={user?.photo || `https://ui-avatars.com/api/?name=${user?.name || 'User'}`}
                                alt="Profile"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex flex-col flex-1 overflow-hidden min-w-0">
                            <h1 className="text-xs font-bold text-slate-900 truncate">{user?.name || 'Technician'}</h1>
                            <p className="text-[10px] text-slate-500 uppercase font-black truncate">{user?.serviceType || 'General'}</p>
                        </div>
                        <button onClick={logout} className="text-slate-400 hover:text-red-500 shrink-0">
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 flex flex-col overflow-hidden relative bg-slate-50/50">
                {/* Header */}
                <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-4 lg:px-8 z-20 sticky top-0 shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-50 rounded-lg">
                            <ChevronDown size={20} className="rotate-90" /> {/* Placeholder for Menu */}
                        </button>
                        <h1 className="text-lg font-bold text-slate-800 truncate mr-4">Technician Dashboard</h1>
                        <div className="hidden md:block h-4 w-px bg-slate-200 shrink-0"></div>

                        {/* Dynamic Location & Network Badge */}
                        <div className="hidden md:flex items-center gap-4 min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                                <MapPin size={16} className="text-slate-400 shrink-0" />
                                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-tight truncate max-w-[150px]" title={currentLocationName}>
                                    {currentLocationName}
                                </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                                {network.type === 'wifi' ? <Wifi size={16} className="text-slate-400" /> : <Signal size={16} className="text-slate-400" />}
                                <span className="text-[11px] font-bold text-slate-500">{network.signal}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 lg:gap-6 shrink-0">
                        <div className="hidden sm:flex items-center gap-2">
                            <Calendar size={16} className="text-slate-400" />
                            <span className="text-xs font-bold text-slate-600 uppercase">
                                {new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="relative">
                                {/* [NEW] "Finishing Job" added + Colors */}
                                <select
                                    value={technicianStatus}
                                    onChange={handleStatusChange}
                                    className={`appearance-none text-[10px] font-black uppercase tracking-wider pl-3 pr-8 py-2 rounded-lg border focus:outline-none focus:ring-2 cursor-pointer min-w-[140px] transition-colors
                                        ${technicianStatus === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 focus:ring-emerald-500/20' :
                                            technicianStatus === 'Finishing Job' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500/20' :
                                                technicianStatus === 'Engaged' ? 'bg-amber-50 text-amber-700 border-amber-200 focus:ring-amber-500/20' :
                                                    'bg-rose-50 text-rose-700 border-rose-200 focus:ring-rose-500/20'}
                                    `}
                                >
                                    <option className="text-emerald-700" value="Available">Available</option>
                                    <option className="text-blue-700" value="Finishing Job">Finishing Job</option>
                                    <option className="text-amber-700" value="Engaged">Engaged</option>
                                    <option className="text-rose-700" value="Not Available">Not Available</option>
                                </select>
                                <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 opacity-50 pointer-events-none" />
                            </div>

                            <button className="p-2 rounded-full hover:bg-slate-100 relative text-slate-500 transition-colors">
                                <Bell size={20} />
                                <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
                            </button>

                            <button className="hidden sm:block px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm">
                                Export Report
                            </button>
                        </div>
                    </div>
                </header>

                {/* Dashboard Body */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6">

                    {/* Active Jobs Section */}
                    <section className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <span className="size-2 bg-blue-600 rounded-full"></span>
                                Active Jobs
                            </h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{activeJobs.length} assignments</span>
                        </div>

                        {/* Jobs Grid: Gaps fixed, proper responsiveness */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {activeJobs.length === 0 ? (
                                <div className="col-span-full p-8 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400">
                                    <ClipboardList size={32} className="mb-2 opacity-50" />
                                    <p className="text-sm font-bold">No active jobs right now</p>
                                </div>
                            ) : (
                                activeJobs.map(job => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        onAccept={handleAcceptJob}
                                        onReject={handleRejectJob}
                                        onView={(j) => navigate(`/technician/jobs/${j.id}`)}
                                    />
                                ))
                            )}
                        </div>
                    </section>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        <StatCard
                            icon={Wallet}
                            label="Total Earnings"
                            value={`₹${stats.earnings.toLocaleString()}`}
                            colorClass="border-l-blue-600"
                            iconBgClass="bg-blue-600/10 text-blue-600"
                        />
                        <StatCard
                            icon={BarChart2}
                            label="Monthly Revenue"
                            value={`₹${stats.monthlyRevenue.toLocaleString()}`}
                            colorClass="border-l-emerald-500"
                            iconBgClass="bg-emerald-50 text-emerald-500"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            label="Jobs Completed"
                            value={stats.completedJobs}
                            colorClass="border-l-indigo-600"
                            iconBgClass="bg-indigo-50 text-indigo-600"
                        />
                        <StatCard
                            icon={Star}
                            label="Customer Rating"
                            value={<span className="flex items-center gap-1">{stats.rating}/5 <Star size={14} className="fill-current text-amber-400" /></span>}
                            colorClass="border-l-amber-400"
                            iconBgClass="bg-amber-50 text-amber-500"
                        />
                    </div>

                    {/* Bottom Section: Chart + Info */}
                    <div className="grid grid-cols-12 gap-6">
                        {/* Chart Area */}
                        <div className="col-span-12 lg:col-span-8 flex flex-col h-full">
                            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 h-full min-h-[350px] flex flex-col">
                                <div className="flex items-center justify-between mb-6 shrink-0">
                                    <div>
                                        <h3 className="text-base font-bold text-slate-800">Earnings Dynamics</h3>
                                        <p className="text-xs text-slate-500">Weekly performance visualization</p>
                                    </div>
                                    <select className="text-xs font-bold border border-slate-200 rounded-lg bg-slate-50 px-2 py-1 outline-none">
                                        <option>Last 7 Days</option>
                                        <option>Last 30 Days</option>
                                    </select>
                                </div>
                                <div className="flex-1 w-full min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={earningsData}>
                                            <defs>
                                                <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} prefix="₹" />
                                            <RechartsTooltip
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                cursor={{ stroke: '#3b82f6', strokeDasharray: '4 4' }}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            {/* Membership Card */}
                            <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl text-white relative overflow-hidden shadow-lg border border-slate-700">
                                <div className="absolute -right-4 -top-4 size-32 bg-white/5 rounded-full blur-2xl"></div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Membership Status</p>
                                            <h4 className="text-2xl font-black">{user.membership || 'Free Plan'}</h4>
                                        </div>
                                        <div className="size-10 bg-white/10 rounded-lg flex items-center justify-center">
                                            <Shield size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-slate-400">Validity</span>
                                            <span className="text-emerald-400">Lifetime</span>
                                        </div>
                                        <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full w-[100%]"></div>
                                        </div>
                                    </div>
                                    <button className="mt-6 w-full py-2 bg-white text-slate-900 rounded-lg text-xs font-black hover:bg-slate-100 transition-colors uppercase tracking-wider">
                                        Upgrade to Pro
                                    </button>
                                </div>
                            </div>

                            {/* [NEW] Registered Location Card */}
                            <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 relative overflow-hidden">
                                <MapPin className="absolute -right-4 -bottom-4 text-slate-100 size-24" />
                                <div className="relative z-10">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Registered Base</h3>
                                    <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-3">
                                        {registeredAddress}
                                    </p>
                                    <div className="mt-3 inline-flex items-center gap-1.5 px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-600">
                                        <CheckCircle2 size={12} className="text-emerald-500" />
                                        Verified Location
                                    </div>
                                </div>
                            </div>

                            {/* Live Activity */}
                            <div className="bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col h-[300px]">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Live Activity Feed</h3>
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
                                    {/* Mock Feed Items - Sync with DB later */}
                                    <div className="flex gap-3">
                                        <div className="size-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center flex-shrink-0">
                                            <Clock size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">New service request received</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">Kitchen sink repair, Springfield Area</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">2 mins ago</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="size-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center flex-shrink-0">
                                            <CheckCircle2 size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold truncate">Job #JB-2908 Completed</p>
                                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">Payment of ₹450 pending verification</p>
                                            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">15 mins ago</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
};

export default TechnicianDashboard;
