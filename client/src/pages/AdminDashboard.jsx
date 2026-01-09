import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api, { banUser, unbanUser, updateUserMembership } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Sidebar } from '../components/admin/Sidebar';
import { Header } from '../components/admin/Header';
import { StatsCard } from '../components/admin/StatsCard';
import UserHeader from '../components/admin/users/UserHeader';
import Filters from '../components/admin/users/Filters';
import UserTable from '../components/admin/users/UserTable';
import UserDrawer from '../components/admin/users/UserDrawer';
import JobHeader from '../components/admin/jobs/JobHeader';
import JobStats from '../components/admin/jobs/JobStats';
import JobTable from '../components/admin/jobs/JobTable';
import JobDrawer from '../components/admin/jobs/JobDrawer';
// Mock Data & Constants
const ACTIVITY_LOG = [
    { id: '1', user: 'John D.', action: 'completed job', targetId: '#4921', timestamp: '2 minutes ago', icon: 'check', iconColor: 'text-primary bg-primary/20' },
    { id: '2', user: 'Sarah M.', action: 'registered', timestamp: '15 minutes ago', icon: 'person_add', iconColor: 'text-accent-green bg-accent-green/20' },
    { id: '3', user: 'System', action: 'High server load', timestamp: '42 minutes ago', icon: 'warning', iconColor: 'text-orange-400 bg-orange-500/20' },
];

const REGISTRATION_TRENDS = [
    { name: 'Week 1', count: 400 }, { name: '', count: 600 },
    { name: 'Week 2', count: 450 }, { name: '', count: 550 },
    { name: 'Week 3', count: 300 }, { name: '', count: 700 },
    { name: 'Week 4', count: 500 },
];

const JOB_DISTRIBUTION = [
    { name: 'Completed', value: 75, color: '#135bec' },
    { name: 'Pending', value: 15, color: '#0bda5e' },
    { name: 'Cancelled', value: 10, color: '#ef4444' },
];

// Helper for Mock AI
const getDashboardInsights = async () => {
    return new Promise(resolve => setTimeout(() => resolve("Traffic has peaked at 10 AM; User verification is the top pending item."), 1500));
};

const AdminDashboard = () => {
    // UI State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();

    // Auth & Theme
    const { logout } = useAuth();
    const { isDarkMode, currentColor, toggleTheme, setThemeColor } = useTheme();

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('sessionToken');
            if (token) {
                await api.post('/users/logout', { token });
            }
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            // Hard Logout to bypass protected route redirects
            localStorage.removeItem('user');
            localStorage.removeItem('sessionToken');
            window.location.replace('/');
        }
    };
    const [insights, setInsights] = useState('Loading real-time platform insights...');

    // User Panel State
    const [selectedUser, setSelectedUser] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Job Panel State
    const [activeJobFilter, setActiveJobFilter] = useState('all');
    const [selectedJob, setSelectedJob] = useState(null);
    const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);

    const refreshUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data.users || []);
        } catch (e) { console.error(e); }
    }

    const handleSelectUser = (user) => {
        setSelectedUser(user);
        setIsDrawerOpen(true);
    };

    const handleCloseDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedUser(null);
    };

    const handleBanUser = async (userId, currentStatus) => {
        if (!userId) {
            console.error("Attempted to ban user with invalid ID:", userId);
            alert("Error: User ID is missing. Cannot perform action.");
            return;
        }
        console.log(`Attempting to toggle ban for user: "${userId}" (type: ${typeof userId}), status: ${currentStatus}`);
        // Trim ID to ensure clean value
        const cleanId = String(userId).trim();

        try {
            let res;
            if (currentStatus === 'Banned') {
                res = await unbanUser(cleanId);
            } else {
                res = await banUser(cleanId);
            }
            console.log("API Response:", res.data);

            // Refetch to ensure data consistency
            await refreshUsers();

            // Force local update if we have a selected user
            if (selectedUser && String(selectedUser.id) === cleanId) {
                console.log("Updating local selectedUser state...");
                const newStatus = currentStatus === 'Banned' ? 'Active' : 'Banned';
                setSelectedUser(prev => ({ ...prev, status: newStatus }));
            }
        } catch (error) {
            console.error("Ban Action Error", error);
            alert("Failed to update user status: " + (error.response?.data?.error || error.message));
        }
    };

    const handleChangeMembership = async (userId, tier) => {
        try {
            await updateUserMembership(userId, tier);
            await refreshUsers();
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser(prev => ({ ...prev, membership: tier }));
            }
        } catch (error) {
            console.error("Membership Action Error", error);
        }
    };

    // Job Handlers
    const handleSelectJob = (job) => {
        setSelectedJob(job);
        setIsJobDrawerOpen(true);
    };

    const handleCloseJobDrawer = () => {
        setIsJobDrawerOpen(false);
        setSelectedJob(null);
    };

    // Data State

    // Data State
    const [stats, setStats] = useState(null);
    const [technicians, setTechnicians] = useState([]);
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Time & Location
    const [currentTime, setCurrentTime] = useState(new Date());
    const [location, setLocation] = useState({ lat: null, lng: null, address: 'Locating...' });

    // --- Effects ---

    // 1. Utilities Initialization (Clock & AI)
    useEffect(() => {
        // Fetch AI insights
        getDashboardInsights().then(setInsights);

        // Clock
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // 2. Data Fetching
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [statsRes, techRes, usersRes, jobsRes, feedRes, transRes] = await Promise.all([
                    api.get('/admin/stats').catch(() => ({ data: { stats: { totalUsers: 0, totalTechnicians: 0, pendingVerifications: 0, totalWallet: 0 } } })),
                    api.get('/admin/technicians').catch(() => ({ data: { technicians: [] } })),
                    api.get('/admin/users').catch(() => ({ data: { users: [] } })),
                    api.get('/admin/jobs').catch(() => ({ data: { jobs: [] } })),
                    api.get('/admin/feedbacks').catch(() => ({ data: { feedbacks: [] } })),
                    api.get('/admin/transactions').catch(() => ({ data: { transactions: [] } })),
                ]);

                setStats(statsRes.data.stats);
                setTechnicians(techRes.data.technicians || []);
                setUsers(usersRes.data.users || []);
                setJobs(jobsRes.data.jobs || []);
                setFeedbacks(feedRes.data.feedbacks || []);
                setTransactions(transRes.data.transactions || []);
                setLoading(false);
            } catch (error) {
                console.error("Data Fetch Error", error);
                setLoading(false);
            }
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);

        // Geolocation
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const { latitude, longitude } = pos.coords;
                    const apiKey = "AIzaSyBN-6NUc8fWY4FsOLvOXj7gvX4pWYVDRUU";
                    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                    const data = await res.json();
                    let address = "Unknown Location";
                    if (data.results?.[0]) {
                        const locality = data.results[0].address_components.find(c => c.types.includes('locality'))?.long_name;
                        const area = data.results[0].address_components.find(c => c.types.includes('sublocality'))?.long_name;
                        const country = data.results[0].address_components.find(c => c.types.includes('country'))?.short_name;
                        address = area && locality ? `${area}, ${locality}` : (locality ? `${locality}, ${country}` : data.results[0].formatted_address.split(',')[0]);
                    }
                    setLocation({ lat: latitude, lng: longitude, address });
                } catch (e) { console.error(e); }
            }, () => { });
        }
        return () => clearInterval(interval);
    }, []);

    // 3. Real-time Socket Listeners
    const socket = useSocket();

    useEffect(() => {
        if (!socket) return;

        const handleUserUpdate = (updatedUser) => {
            refreshUsers();
            if (activeTab === 'dashboard') {
                api.get('/admin/stats').then(res => setStats(res.data.stats)).catch(err => console.error(err));
            }
            if (selectedUser && selectedUser.id === updatedUser.id) {
                // Determine if banned status changed to show immediate feedback
                const newStatus = updatedUser.status || selectedUser.status;
                const newMembership = updatedUser.membership || selectedUser.membership;
                setSelectedUser(prev => ({ ...prev, ...updatedUser, status: newStatus, membership: newMembership }));
            }
        };

        const handleJobUpdate = (job) => {
            refreshUsers(); // Refresh user list for latest job counts
            if (activeTab === 'dashboard') {
                // Refresh dashboard widgets
                api.get('/admin/jobs').then(res => setJobs(res.data.jobs || [])).catch(() => { });
                api.get('/admin/stats').then(res => setStats(res.data.stats)).catch(() => { });
            }
        };

        socket.on('admin_user_update', handleUserUpdate);
        socket.on('job_status_updated_admin', handleJobUpdate);
        socket.on('job_status_updated', handleJobUpdate);

        return () => {
            socket.off('admin_user_update', handleUserUpdate);
            socket.off('job_status_updated_admin', handleJobUpdate);
            socket.off('job_status_updated', handleJobUpdate);
        };
    }, [socket, selectedUser, activeTab]);





    // Derived Stats for UI
    const dashboardStats = stats ? [
        { label: 'Total Users', value: (stats.totalUsers || 0).toLocaleString(), trend: 12, icon: 'group' },
        { label: 'Active Technicians', value: (stats.activeTechnicians || 0).toString(), trend: 3, icon: 'engineering' },
        { label: 'Pending Verifications', value: (stats.pendingVerifications || 0).toString(), trend: 0, icon: 'verified_user', alert: (stats.pendingVerifications || 0) > 0 ? 'Action Needed' : '' },
        { label: 'Total Wallet', value: `$${(stats.totalWallet || 0).toLocaleString()}`, trend: 8, icon: 'account_balance_wallet' },
    ] : [];

    return (
        <div className={`flex h-screen overflow-hidden font-sans bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300`}>
            {/* Mobile Sidebar Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 lg:hidden ${sidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
                onClick={() => setSidebarOpen(false)}
            />

            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={sidebarOpen}
                setIsOpen={setSidebarOpen}
            />

            <div className="flex-1 flex flex-col h-full min-w-0">
                <Header
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    activeTab={activeTab}
                    onLogout={handleLogout}
                />

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative custom-scrollbar bg-slate-50 dark:bg-slate-950">
                    {loading && activeTab === 'dashboard' ? (
                        <div className="flex items-center justify-center h-full text-blue-600 font-bold text-xl">
                            <div className="flex flex-col items-center gap-4">
                                <span className="material-symbols-outlined animate-spin text-4xl">sync</span>
                                Loading Admin Console...
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-[1400px] mx-auto flex flex-col gap-6">

                            {/* DASHBOARD TAB */}
                            {activeTab === 'dashboard' && (
                                <>
                                    {/* AI Banner */}
                                    <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                                        <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                        <p className="text-primary text-sm font-medium italic">{insights}</p>
                                    </div>

                                    <div className="flex flex-col gap-1">
                                        <p className="text-2xl md:text-3xl font-black leading-tight tracking-tight text-blue-600 dark:text-blue-500">Good Morning, Admin</p>
                                        <p className="text-gray-600 dark:text-slate-400 text-base font-normal">Here's what's happening with your platform today.</p>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {dashboardStats.map((stat, idx) => (
                                            <StatsCard key={idx} stat={stat} />
                                        ))}
                                    </div>

                                    {/* TOP ROW: Map & Leaderboard (Newly Prominent) */}
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        {/* Time & Map Card */}
                                        <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-white/5 p-0 overflow-hidden relative group shadow-sm dark:shadow-none min-h-[220px]">
                                            <div className="h-40 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110"
                                                style={{
                                                    backgroundImage: location.lat
                                                        ? `url('https://maps.googleapis.com/maps/api/staticmap?center=${location.lat},${location.lng}&zoom=14&size=800x400&maptype=roadmap&markers=color:red%7C${location.lat},${location.lng}&key=AIzaSyBN-6NUc8fWY4FsOLvOXj7gvX4pWYVDRUU')`
                                                        : "url('https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80')"
                                                }}
                                            >
                                                <div className="bg-black/40 size-full"></div>
                                            </div>
                                            <div className="p-5 -mt-10 relative z-10">
                                                <div className="flex justify-between items-end flex-wrap gap-4">
                                                    <div className="bg-white dark:bg-[#111722] p-4 rounded-2xl shadow-xl border border-gray-100 dark:border-white/5">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <div className="size-8 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-lg">
                                                                <span className="material-symbols-outlined text-sm">schedule</span>
                                                            </div>
                                                            <p className="text-[11px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Platform Time</p>
                                                        </div>
                                                        <h3 className="text-blue-600 dark:text-blue-400 text-4xl font-black tracking-tight flex items-baseline gap-1">
                                                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            <span className="text-sm font-bold text-gray-400 uppercase">{currentTime.toLocaleTimeString([], { hour12: true }).slice(-2)}</span>
                                                        </h3>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-white bg-blue-600/90 backdrop-blur-md px-4 py-2.5 rounded-2xl text-xs font-bold shadow-lg shadow-blue-600/20 max-w-[200px] truncate">
                                                        <span className="material-symbols-outlined text-sm">location_on</span>
                                                        <span className="truncate">{location.address}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded Leaderboard Card */}
                                        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-xl border border-white/10 p-8 flex flex-col justify-between text-white relative overflow-hidden group shadow-xl">
                                            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700">
                                                <span className="material-symbols-outlined text-[180px]">rocket_launch</span>
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="size-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-yellow-300">workspace_premium</span>
                                                    </div>
                                                    <h3 className="text-2xl font-black tracking-tight">Technician Leaderboard</h3>
                                                </div>
                                                <p className="text-blue-100/80 text-lg font-medium max-w-md leading-relaxed">
                                                    Tracking real-time performance, efficiency, and customer satisfaction across all service verticals.
                                                </p>
                                            </div>
                                            <div className="mt-8 flex items-center gap-4 relative z-10">
                                                <button
                                                    onClick={() => setActiveTab('technicians')}
                                                    className="bg-white text-blue-700 hover:bg-blue-50 px-8 py-3.5 rounded-xl text-sm font-black shadow-lg shadow-black/10 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">analytics</span>
                                                    View Detailed Report
                                                </button>
                                                <div className="hidden sm:flex -space-x-3">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="size-10 rounded-full border-4 border-blue-700 bg-blue-200 flex items-center justify-center text-[10px] font-bold text-blue-800">
                                                            {['JD', 'SM', 'RK'][i - 1]}
                                                        </div>
                                                    ))}
                                                    <div className="size-10 rounded-full border-4 border-blue-700 bg-white/10 backdrop-blur-sm flex items-center justify-center text-[10px] font-bold text-white">
                                                        +12
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Stats Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {dashboardStats.map((stat, idx) => (
                                            <StatsCard key={idx} stat={stat} />
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                                        {/* Area Chart & Pie Chart */}
                                        <div className="xl:col-span-2 flex flex-col gap-6">
                                            {/* Area Chart */}
                                            <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-white/5 p-6 flex flex-col h-[400px] shadow-sm dark:shadow-none">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div>
                                                        <h3 className="text-blue-600 font-bold">User Trends</h3>
                                                        <p className="text-gray-500 dark:text-slate-400 text-sm">Growth over last 30 days</p>
                                                    </div>
                                                </div>
                                                <div className="flex-1 w-full">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={REGISTRATION_TRENDS}>
                                                            <defs>
                                                                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                                                                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                                </linearGradient>
                                                            </defs>
                                                            <Tooltip
                                                                contentStyle={{ backgroundColor: '#1A202C', border: '1px solid #232f48', borderRadius: '8px' }}
                                                                itemStyle={{ color: '#fff' }}
                                                            />
                                                            <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#92a4c9', fontSize: 11 }} />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            </div>

                                            {/* Pie Chart Card */}
                                            <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-white/5 p-6 shadow-sm">
                                                <h3 className="text-blue-600 font-bold mb-4">Job Distribution</h3>
                                                <div className="flex flex-wrap items-center gap-8">
                                                    <div className="relative size-32">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie data={JOB_DISTRIBUTION} cx="50%" cy="50%" innerRadius={35} outerRadius={45} paddingAngle={5} dataKey="value">
                                                                    {JOB_DISTRIBUTION.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                                    ))}
                                                                </Pie>
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                            <span className="text-lg font-bold text-gray-900 dark:text-white">98%</span>
                                                            <span className="text-[10px] text-gray-500 dark:text-slate-400">Rate</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-3 flex-1 min-w-[200px]">
                                                        {JOB_DISTRIBUTION.map((item) => (
                                                            <div key={item.name} className="flex items-center justify-between border-b border-gray-50 dark:border-white/5 pb-2 last:border-0">
                                                                <div className="flex items-center gap-2">
                                                                    <div className="size-2.5 rounded-full shadow-sm" style={{ backgroundColor: item.color }}></div>
                                                                    <span className="text-sm text-gray-600 dark:text-slate-400 font-medium">{item.name}</span>
                                                                </div>
                                                                <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Activity Log */}
                                        <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-white/5 flex flex-col shadow-sm">
                                            <div className="p-5 border-b border-gray-50 dark:border-[#232f48] flex justify-between items-center">
                                                <h3 className="text-blue-600 font-bold text-base">Real-time Activity</h3>
                                                <span className="material-symbols-outlined text-blue-500 text-sm animate-pulse">rss_feed</span>
                                            </div>
                                            <div className="p-4 overflow-y-auto custom-scrollbar flex flex-col gap-4 max-h-[750px] min-h-[400px]">
                                                {ACTIVITY_LOG.map((item) => (
                                                    <div key={item.id} className="flex gap-3 items-start group p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                        <div className={`mt-1 size-8 rounded-full flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${item.iconColor}`}>
                                                            <span className="material-symbols-outlined text-xs">{item.icon}</span>
                                                        </div>
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className="text-sm text-gray-600 dark:text-slate-300 leading-snug">
                                                                <strong className="text-gray-900 dark:text-white font-bold">{item.user}</strong> {item.action}
                                                            </p>
                                                            <p className="text-[11px] text-gray-400 font-medium uppercase">{item.timestamp}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* USERS TAB (New Implementation) */}
                            {activeTab === 'users' && (
                                <div className="flex flex-col h-[calc(100vh-100px)] relative -m-4 md:-m-8">
                                    <UserHeader />
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                                        <div className="p-6 max-w-[1400px] mx-auto flex flex-col gap-6">
                                            <Filters />
                                            <UserTable
                                                users={users}
                                                selectedUserId={selectedUser?.id || null}
                                                onSelectUser={handleSelectUser}
                                                onBanUser={handleBanUser}
                                                onChangeMembership={handleChangeMembership}
                                            />
                                        </div>
                                    </div>

                                    {/* Detail Overlay */}
                                    {isDrawerOpen && (
                                        <div
                                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 sm:hidden"
                                            onClick={handleCloseDrawer}
                                        />
                                    )}

                                    <UserDrawer
                                        user={selectedUser}
                                        onClose={handleCloseDrawer}
                                        onBanUser={handleBanUser}
                                        onChangeMembership={handleChangeMembership}
                                    />
                                </div>
                            )}

                            {/* JOBS TAB (New Professional Implementation) */}
                            {activeTab === 'jobs' && (
                                <div className="flex flex-col h-[calc(100vh-100px)] relative -m-4 md:-m-8">
                                    <JobHeader
                                        activeFilter={activeJobFilter}
                                        setActiveFilter={setActiveJobFilter}
                                    />
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative custom-scrollbar">
                                        <div className="p-6 max-w-[1400px] mx-auto flex flex-col gap-2">
                                            <JobStats jobs={jobs} />
                                            <JobTable
                                                jobs={jobs}
                                                activeFilter={activeJobFilter}
                                                onSelectJob={handleSelectJob}
                                                selectedJobId={selectedJob?.id}
                                            />
                                        </div>
                                    </div>

                                    {/* Drawer Backdrop */}
                                    {isJobDrawerOpen && (
                                        <div
                                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 transition-opacity"
                                            onClick={handleCloseJobDrawer}
                                        />
                                    )}

                                    <JobDrawer
                                        job={selectedJob}
                                        onClose={handleCloseJobDrawer}
                                    />
                                </div>
                            )}

                            {/* OTHER TABS (Placeholder to ensure switching works) */}
                            {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'jobs' && (
                                <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-white/5 p-6 shadow-sm">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 italic">
                                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module Loaded
                                    </h3>
                                    <p className="text-gray-500 dark:text-text-secondary">
                                        Data for {activeTab} is ready (Technicians: {technicians.length}, Users: {users.length}, Jobs: {jobs.length}).
                                        <br />
                                        <span className="text-xs opacity-50">Refactoring required to fully migrate table views to new design system.</span>
                                    </p>
                                    <div className="mt-8 overflow-x-auto">
                                        {/* Simple table dump for verification */}
                                        <table className="w-full text-left text-sm text-gray-500 dark:text-text-secondary">
                                            <thead className="bg-gray-50 dark:bg-[#111722] text-xs uppercase">
                                                <tr><th className="px-4 py-3">ID</th><th className="px-4 py-3">Details</th></tr>
                                            </thead>
                                            <tbody>
                                                {(activeTab === 'technicians' ? technicians : activeTab === 'users' ? users : jobs).slice(0, 10).map((item, i) => (
                                                    <tr key={i} className="border-b border-gray-100 dark:border-[#111722]">
                                                        <td className="px-4 py-3 font-mono text-xs">{item.id?.substring(0, 8)}</td>
                                                        <td className="px-4 py-3">{JSON.stringify(item).substring(0, 100)}...</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
