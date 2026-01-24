import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, ClipboardList, MessageSquare, Wallet, BarChart2,
    Headphones, Tag, Settings, Globe, LogOut, MapPin, Signal, Calendar,
    Bell, ChevronDown, MoreVertical, Car, X, Check, Star, Clock,
    CheckCircle2, AlertCircle, Shield, CreditCard, User, Wifi
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
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

const StatCard = ({ icon: Icon, label, value, colorClass, iconBgClass }) => (
    <div className={`bg-white border-l-4 ${colorClass} shadow-sm rounded-xl p-5 flex items-center gap-4 transition-all hover:-translate-y-1 hover:shadow-md border border-slate-100 group`}>
        <div className={`size-12 rounded-xl flex items-center justify-center ${iconBgClass} transition-transform group-hover:scale-110`}>
            <Icon size={22} />
        </div>
        <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
            <h3 className="text-xl font-black leading-tight text-slate-800">{value}</h3>
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
    const { user, logout, updateUser } = useAuth();
    const navigate = useNavigate();
    const socket = useSocket();
    const network = useNetworkStatus();

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

    // Charts Data
    const [jobStatsData, setJobStatsData] = useState([]);

    // Location State
    const [currentLocationName, setCurrentLocationName] = useState("Locating...");
    const [registeredAddress, setRegisteredAddress] = useState(user?.address || "Loading...");

    // Mock Data for Earnings
    const earningsData = [
        { name: 'Mon', value: 2400 },
        { name: 'Tue', value: 1398 },
        { name: 'Wed', value: 9800 },
        { name: 'Thu', value: 3908 },
        { name: 'Fri', value: 4800 },
        { name: 'Sat', value: 3800 },
        { name: 'Sun', value: 4300 },
    ];

    // Pie Chart Colors
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444']; // Emerald, Blue, Amber, Red

    // --- Effects ---

    // Reverse Geocoding Effect
    useEffect(() => {
        if (!user) return;

        const resolveDetails = async () => {
            setRegisteredAddress(user.fixed_address || user.address || user.baseAddress || "No Registered Address");
            const lat = user.latitude || user.location?.latitude;
            const lng = user.longitude || user.location?.longitude;

            if (lat && lng) {
                try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    if (!apiKey) return;

                    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
                    const data = await res.json();
                    if (data.results?.[0]) {
                        const comps = data.results[0].address_components;
                        const neighborhood = comps.find(c => c.types.includes('sublocality') || c.types.includes('neighborhood'))?.short_name;
                        const locality = comps.find(c => c.types.includes('locality'))?.short_name;
                        setCurrentLocationName(neighborhood && locality ? `${neighborhood}, ${locality}` : (locality || "Unknown City"));
                    }
                } catch (e) {
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

    useSupabaseRealtime('jobs', (payload) => {
        fetchDashboardData();
    });

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const [jobsRes, statsRes] = await Promise.all([
                api.getJobsByTechnician(user.id).catch(() => ({ data: { jobs: [] } })),
                Promise.resolve({ data: { earnings: 12500, monthly: 45000, completed: 12, rating: 4.8 } })
            ]);

            const allJobs = jobsRes.data.jobs || [];
            const active = allJobs.filter(j => ['pending', 'accepted', 'in_progress', 'started'].includes(j.status));
            setActiveJobs(active);

            const completedCount = allJobs.filter(j => j.status === 'completed').length;
            const cancelledCount = allJobs.filter(j => j.status === 'cancelled').length;

            setStats({
                earnings: statsRes.data.earnings,
                monthlyRevenue: statsRes.data.monthly,
                completedJobs: completedCount,
                rating: user.rating || 4.8
            });

            // Set Chart Data
            setJobStatsData([
                { name: 'Completed', value: completedCount },
                { name: 'Active', value: active.length },
                { name: 'Pending', value: allJobs.filter(j => j.status === 'pending').length },
                { name: 'Cancelled', value: cancelledCount }
            ]);

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
        } catch (err) {
            setTechnicianStatus(user.status);
        }
    };

    const handleAcceptJob = async (jobId) => {
        try {
            await api.acceptJob(jobId, user.id);
            fetchDashboardData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRejectJob = async (jobId) => {
        alert("Reject logic needs implementation");
    };

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
                    <SidebarItem icon={LayoutDashboard} label="Dashboard" active onClick={() => { }} />
                    <SidebarItem icon={ClipboardList} label="My Jobs" onClick={() => navigate('/technician/jobs')} />
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
                            <h1 className="text-xl font-black text-slate-800 truncate tracking-tight">Dashboard</h1>
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

                {/* Dashboard Body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <StatCard
                    icon={BarChart2}
                    label="Monthly Revenue"
                    value={`₹${stats.monthlyRevenue.toLocaleString()}`}
                    colorClass="border-l-emerald-500"
                    iconBgClass="bg-emerald-500 text-white shadow-emerald-500/30 shadow-lg"
                />
                <StatCard
                    icon={CheckCircle2}
                    label="Jobs Completed"
                    value={stats.completedJobs}
                    colorClass="border-l-indigo-600"
                    iconBgClass="bg-indigo-600 text-white shadow-indigo-600/30 shadow-lg"
                />
                <StatCard
                    icon={Star}
                    label="Customer Rating"
                    value={<span className="flex items-center gap-1">{stats.rating}<span className="text-slate-400 text-base font-medium">/5</span></span>}
                    colorClass="border-l-amber-400"
                    iconBgClass="bg-amber-400 text-white shadow-amber-400/30 shadow-lg"
                />
        </div>

                    {/* Bottom Section: Charts + Info */ }
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Area Chart */}
        <div className="xl:col-span-6 flex flex-col bg-white border border-slate-100 shadow-sm rounded-2xl p-6 min-h-[350px]">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Revenue Trend</h3>
                    <p className="text-xs text-slate-400 mt-1 font-medium">Last 7 Days performance</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-3 py-1 bg-slate-50 rounded-lg text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">Week</button>
                    <button className="px-3 py-1 bg-transparent rounded-lg text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">Month</button>
                </div>
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
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f8fafc" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }} tickFormatter={(val) => `₹${val}`} />
                        <RechartsTooltip
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '4 4' }}
                        />
                        <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Pie Chart [NEW] */}
        <div className="md:col-span-1 xl:col-span-3 flex flex-col bg-white border border-slate-100 shadow-sm rounded-2xl p-6 min-h-[350px]">
            <div className="mb-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Job Distribution</h3>
                <p className="text-xs text-slate-400 mt-1 font-medium">Assignments breakdown</p>
            </div>
            <div className="flex-1 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={jobStatsData}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {jobStatsData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                            ))}
                        </Pie>
                        <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-8">
                    <div className="text-center">
                        <p className="text-2xl font-black text-slate-800">{stats.completedJobs + activeJobs.length}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Column (Membership + Location) */}
        <div className="md:col-span-1 xl:col-span-3 space-y-6">
            {/* Membership Card */}
            <div className="bg-slate-900 p-6 rounded-2xl text-white relative overflow-hidden shadow-xl shadow-slate-900/20 group">
                <div className="absolute -right-10 -top-10 size-40 bg-blue-600/20 rounded-full blur-3xl group-hover:bg-blue-600/30 transition-colors"></div>
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] mb-1">Current Plan</p>
                            <h4 className="text-2xl font-black tracking-tight">{user.membership || 'Free Plan'}</h4>
                        </div>
                        <div className="size-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm">
                            <Shield size={20} className="text-blue-400" />
                        </div>
                    </div>
                    <div className="space-y-3 mb-6">
                        <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400">Status</span>
                            <span className="text-emerald-400 flex items-center gap-1"><CheckCircle2 size={12} /> Active</span>
                        </div>
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-blue-500 h-full w-[85%] shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                        </div>
                    </div>
                    <button className="w-full py-2.5 bg-white text-slate-900 rounded-lg text-xs font-black hover:bg-blue-50 transition-colors uppercase tracking-wider">
                        Upgrade Plan
                    </button>
                </div>
            </div>

            {/* Registered Location Card */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                    <MapPin size={80} className="text-blue-600" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-3">Registered Base</h3>
                    <div className="flex items-start gap-3">
                        <div className="size-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Check size={16} strokeWidth={3} />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
                                {registeredAddress}
                            </p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase">Verified Location</p>
                        </div>
                    </div>
                </div>
            </div>
            {/* Live Activity Feed - RESTORED */}
            <div className="bg-white border border-slate-100 shadow-sm rounded-2xl flex flex-col h-[280px]">
                <div className="p-5 border-b border-slate-50 flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Live Feed</h3>
                    <div className="flex items-center gap-2">
                        <span className="relative flex size-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                        </span>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-5 space-y-5 hide-scrollbar">
                    <div className="flex gap-4 group">
                        <div className="size-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <Clock size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">New service request</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">Kitchen sink repair • Springfield</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wide">2m ago</p>
                        </div>
                    </div>
                    <div className="flex gap-4 group">
                        <div className="size-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                            <CheckCircle2 size={16} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">Job #JB-2908 Done</p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate">Payment pending • ₹450</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-wide">15m ago</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

                </div >
            </main >
        </div >
    );
};

export default TechnicianDashboard;
