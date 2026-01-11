import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import api, { banUser, unbanUser, updateUserMembership, createUser, updateUser, updateJob, getDashboardStats } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Sidebar } from '../components/admin/Sidebar';
import { Header } from '../components/admin/Header';
import { StatsCard } from '../components/admin/StatsCard';
import { CompactStatCard } from '../components/admin/CompactStatCard';
import { useRealtimeStats } from '../hooks/useRealtimeStats';
import UserHeader from '../components/admin/users/UserHeader';
import Filters from '../components/admin/users/Filters';
import UserTable from '../components/admin/users/UserTable';
import UserDrawer from '../components/admin/users/UserDrawer';
import JobHeader from '../components/admin/jobs/JobHeader';
import JobStats from '../components/admin/jobs/JobStats';
import JobTable from '../components/admin/jobs/JobTable';
import JobDrawer from '../components/admin/jobs/JobDrawer';
import UserCreateModal from '../components/admin/users/UserCreateModal';
import JobFormModal from '../components/admin/jobs/JobFormModal';

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
    // activeTab and sidebarOpen/isSidebarOpen moved to unified block below

    // Pagination State
    const [userPage, setUserPage] = useState(1);
    const [jobPage, setJobPage] = useState(1);
    const LIMIT_PER_PAGE = 10;

    // Filters State
    const [activeTier, setActiveTier] = useState('All');
    const [activeStatus, setActiveStatus] = useState('All');

    // Modals
    const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);

    const navigate = useNavigate();

    // Auth & Theme
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
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Use valid Auth context or fallback
    const { user, logout } = useAuth() || { user: { name: 'Admin' }, logout: () => { } };

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // Real-time Stats Hook (Replaces local useEffect)
    const { stats, loading, error, refetch } = useRealtimeStats();

    // Data for Tables (User & Job)
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);

    const [selectedJob, setSelectedJob] = useState(null);
    const [isJobDrawerOpen, setIsJobDrawerOpen] = useState(false);
    const [isEditJobOpen, setIsEditJobOpen] = useState(false);

    const fetchUsers = async () => {
        try {
            const response = await api.get('/users'); // Assuming this endpoint exists for admin
            // Ensure response.data is an array
            const data = Array.isArray(response.data) ? response.data : [];
            setUsers(data);
        } catch (error) {
            console.error('Error fetching users:', error);
            setUsers([]);
        }
    };

    const fetchJobs = async () => {
        try {
            const response = await api.get('/jobs'); // Assuming this endpoint exists for admin
            // Ensure response.data is an array
            const data = Array.isArray(response.data) ? response.data : [];
            setJobs(data);
        } catch (error) {
            console.error('Error fetching jobs:', error);
            setJobs([]);
        }
    };

    // Keep separate effect for Table data (User/Jobs) as they might need separate pagination logic later
    // Ideally, these would also be real-time, but for now we focus on the Dashboard Stats being realtime.
    // We can piggy-back on the global refresh to update these lists too if needed.
    useEffect(() => {
        fetchUsers();
        fetchJobs();
    }, []); // Initial load only for now, or add dependency on 'stats' to auto-refresh tables too

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

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
        setTimeout(() => setSelectedUser(null), 300); // Wait for transition
    };

    const handleBanUser = async (userId, currentStatus) => {
        try {
            if (currentStatus === 'Banned') {
                await unbanUser(userId);
            } else {
                await banUser(userId);
            }
            refreshUsers();
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser(prev => ({ ...prev, status: currentStatus === 'Banned' ? 'Active' : 'Banned' }));
            }
        } catch (error) {
            console.error('Failed to toggle ban status:', error);
            alert('Failed to update user status');
        }
    };

    const handleChangeMembership = async (userId, newTier) => {
        try {
            await updateUserMembership(userId, newTier);
            refreshUsers();
            if (selectedUser && selectedUser.id === userId) {
                setSelectedUser(prev => ({ ...prev, membership: newTier }));
            }
        } catch (error) {
            console.error('Failed to update membership:', error);
            alert('Failed to update membership');
        }
    };

    const handleCreateUser = async (userData) => {
        try {
            console.log("Creating user:", userData);
            await createUser(userData);
            alert("User created successfully!");
            refreshUsers();
        } catch (error) {
            console.error("Create user failed:", error);
            throw error;
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);
        setIsEditUserOpen(true);
    };

    const handleUpdateUser = async (userData) => {
        try {
            console.log("Updating user:", userData);
            await updateUser(userData.id, userData);

            // Optimistic update
            setUsers(users.map(u => u.id === userData.id ? { ...u, ...userData } : u));
            setSelectedUser(prev => prev && prev.id === userData.id ? { ...prev, ...userData } : prev);
            setIsEditUserOpen(false);
            alert("User updated successfully!");
        } catch (error) {
            console.error("Update user failed:", error);
            alert("Failed to update user");
        }
    };

    const handleSelectJob = (job) => {
        setSelectedJob(job);
        setIsJobDrawerOpen(true);
    };

    const handleCloseJobDrawer = () => {
        setIsJobDrawerOpen(false);
        setTimeout(() => setSelectedJob(null), 300);
    };

    const handleEditJob = (job) => {
        setSelectedJob(job);
        setIsEditJobOpen(true);
    };

    const handleUpdateJob = async (jobData) => {
        try {
            console.log("Updating job:", jobData);
            await updateJob(jobData.id, jobData);

            // Optimistic update
            setJobs(jobs.map(j => j.id === jobData.id ? { ...j, ...jobData } : j));
            setSelectedJob(prev => prev && prev.id === jobData.id ? { ...prev, ...jobData } : prev);
            setIsEditJobOpen(false);
            alert("Job updated successfully!");
        } catch (error) {
            console.error("Update job failed:", error);
            alert("Failed to update job");
        }
    };



    // Data State
    const [technicians, setTechnicians] = useState([]);

    // Derived State - Filtered Users
    const filteredUsers = users.filter(user => {
        const matchesSearch = searchQuery === '' ||
            user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.id?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesTier = activeTier === 'All' || user.membership === activeTier;
        const matchesStatus = activeStatus === 'All' || user.status === activeStatus;

        return matchesSearch && matchesTier && matchesStatus;
    });

    // Derived State - Filtered Jobs
    const filteredJobs = jobs.filter(job => {
        const matchesSearch = searchQuery === '' ||
            job.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.serviceType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            job.status?.toLowerCase().includes(searchQuery.toLowerCase());

        const matchesStatus = activeJobFilter === 'all' || job.status.toLowerCase() === activeJobFilter.toLowerCase();

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const paginatedUsers = filteredUsers.slice((userPage - 1) * LIMIT_PER_PAGE, userPage * LIMIT_PER_PAGE);
    const paginatedJobs = filteredJobs.slice((jobPage - 1) * LIMIT_PER_PAGE, jobPage * LIMIT_PER_PAGE);

    // Initial Data Fetch
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [usersRes, techsRes, jobsRes] = await Promise.all([
                    api.get('/admin/users'),
                    api.get('/admin/technicians'),
                    api.get('/admin/jobs')
                ]);
                setUsers(usersRes.data.users || []);
                setTechnicians(techsRes.data.technicians || []);
                setJobs(jobsRes.data.jobs || []);
            } catch (error) {
                console.error("Dashboard data fetch error", error);
                // Fallback mock data if API fails
                if (users.length === 0) {
                    setUsers([
                        { id: '1', name: 'Ahsan M.', email: 'ahsan@example.com', role: 'admin', status: 'Active', membership: 'Premium', walletBalance: 1250, avatar: 'https://randomuser.me/api/portraits/men/1.jpg', lastActive: '2 min ago' },
                        { id: '2', name: 'John Doe', email: 'john@test.com', role: 'user', status: 'Active', membership: 'Free', walletBalance: 0, avatar: 'https://randomuser.me/api/portraits/men/32.jpg', lastActive: '1 day ago' },
                        { id: '3', name: 'Jane Smith', email: 'jane@test.com', role: 'technician', status: 'Banned', membership: 'Free', walletBalance: 450, avatar: 'https://randomuser.me/api/portraits/women/44.jpg', lastActive: '5 days ago' }
                    ]);
                    setJobs([
                        { id: 'JOB-8821', serviceType: 'AC Repair', status: 'Pending', contactName: 'Mike Ross', offerPrice: 1500, createdAt: new Date().toISOString() },
                        { id: 'JOB-9923', serviceType: 'Plumbing', status: 'Completed', contactName: 'Rachel Green', offerPrice: 850, createdAt: new Date(Date.now() - 86400000).toISOString() },
                        { id: 'JOB-7742', serviceType: 'Electrical', status: 'In-Progress', contactName: 'Joey T.', offerPrice: 2200, createdAt: new Date().toISOString() }
                    ]);
                }
            }
        };
        fetchDashboardData();
        // getDashboardInsights().then(setInsights);
    }, []);

    const userStats = React.useMemo(() => {
        return {
            totalUsers: users.length,
            activeUsers: users.filter(u => u.status === 'Active').length,
            premiumUsers: users.filter(u => u.membership === 'Premium').length,
            revenue: users.reduce((acc, curr) => acc + (curr.walletBalance || 0), 0)
        };
    }, [users]);

    return (
        <div className={`flex h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-300 ${isDarkMode ? 'dark' : ''}`}>
            {/* Sidebar */}
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                isOpen={isSidebarOpen}
                setIsOpen={setIsSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">
                <Header
                    isDarkMode={isDarkMode}
                    toggleTheme={toggleTheme}
                    toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                    sidebarOpen={isSidebarOpen}
                    activeTab={activeTab}
                    onLogout={handleLogout}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />

                <main className="flex-1 overflow-auto p-4 md:p-8 relative">
                    {activeTab === 'dashboard' ? (
                        <div className="max-w-[1600px] mx-auto space-y-8">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                <StatsCard stat={{ label: 'Total Users', value: stats.totalUsers, icon: 'group', color: 'blue', trend: stats.trends?.users || 0 }} />
                                <StatsCard stat={{ label: 'Active Techs', value: stats.activeTechnicians, icon: 'engineering', color: 'emerald', trend: 0 }} />
                                <StatsCard stat={{ label: 'Total Jobs', value: stats.totalJobs, icon: 'work', color: 'orange', trend: stats.trends?.jobs || 0 }} />
                                <StatsCard stat={{ label: 'Total Revenue', value: `₹${(stats.revenue || 0).toLocaleString()}`, icon: 'payments', color: 'purple', trend: stats.trends?.revenue || 0 }} />
                            </div>

                            {/* Detailed Stats Breakdown */}
                            <div className="space-y-8 animate-fade-in-up">
                                {/* Job Overview */}
                                <div className="bg-blue-50/50 rounded-2xl px-6 py-[110px] border border-blue-100 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-2 px-1">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">work_history</span>
                                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Job Overview</h3>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 gap-y-6">
                                            <CompactStatCard stat={{ label: 'Pending', value: stats.detailed?.jobsPending || 0, icon: 'hourglass_empty', color: 'orange' }} />
                                            <CompactStatCard stat={{ label: 'Active', value: stats.detailed?.jobsActive || 0, icon: 'play_circle', color: 'blue' }} />
                                            <CompactStatCard stat={{ label: 'Accepted', value: stats.detailed?.jobsAccepted || 0, icon: 'check_circle', color: 'indigo' }} />
                                            <CompactStatCard stat={{ label: 'Finishing', value: stats.detailed?.jobsFinishing || 0, icon: 'rule', color: 'cyan' }} />
                                            <CompactStatCard stat={{ label: 'Rejected', value: stats.detailed?.jobsRejected || 0, icon: 'cancel', color: 'red' }} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Technician Status */}
                                    <div className="bg-emerald-50/50 rounded-2xl px-6 py-[110px] border border-emerald-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="material-symbols-outlined text-emerald-500 text-lg">engineering</span>
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Technician Status</h3>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 gap-y-6">
                                                <CompactStatCard stat={{ label: 'Available', value: stats.detailed?.techsAvailable || 0, icon: 'wifi', color: 'emerald' }} />
                                                <CompactStatCard stat={{ label: 'Engaged', value: stats.detailed?.techsEngaged || 0, icon: 'engineering', color: 'blue' }} />
                                                <CompactStatCard stat={{ label: 'Unavailable', value: stats.detailed?.techsUnavailable || 0, icon: 'wifi_off', color: 'slate' }} />
                                                <CompactStatCard stat={{ label: 'Blacklisted', value: stats.detailed?.techsBlacklisted || 0, icon: 'block', color: 'red' }} />

                                                <CompactStatCard stat={{ label: 'Premium', value: stats.detailed?.techsPremium || 0, icon: 'diamond', color: 'purple' }} />
                                                <CompactStatCard stat={{ label: 'Free', value: stats.detailed?.techsFree || 0, icon: 'money_off', color: 'gray' }} />
                                                <CompactStatCard stat={{ label: 'Approved', value: stats.detailed?.techsApproved || 0, icon: 'verified', color: 'green' }} />
                                                <CompactStatCard stat={{ label: 'Pending', value: stats.detailed?.techsNotApproved || 0, icon: 'pending', color: 'orange' }} />
                                                <CompactStatCard stat={{ label: 'Expiring Soon', value: stats.detailed?.techsExpiring || 0, icon: 'alarm', color: 'orange' }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* User Insights */}
                                    <div className="bg-purple-50/50 rounded-2xl px-6 py-[110px] border border-purple-100 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="space-y-6">
                                            <div className="flex items-center gap-2 px-1">
                                                <span className="material-symbols-outlined text-purple-500 text-lg">group</span>
                                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">User Insights</h3>
                                            </div>
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 gap-y-6">
                                                <CompactStatCard stat={{ label: 'Premium', value: stats.detailed?.usersPremium || 0, icon: 'workspace_premium', color: 'amber' }} />
                                                <CompactStatCard stat={{ label: 'Free', value: stats.detailed?.usersFree || 0, icon: 'person_outline', color: 'slate' }} />
                                                <CompactStatCard stat={{ label: 'Banned', value: stats.detailed?.usersBanned || 0, icon: 'gavel', color: 'red', alert: (stats.detailed?.usersBanned || 0) > 0 ? 'Review' : null }} />
                                                <CompactStatCard stat={{ label: 'Expiring', value: stats.detailed?.usersExpiring || 0, icon: 'timer', color: 'rose', alert: (stats.detailed?.usersExpiring || 0) > 0 ? 'Soon' : null }} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[250px]">
                                <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">User Registration Trends</h3>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={stats.registrationTrends || []}>
                                                <defs>
                                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Job Distribution</h3>
                                    <div className="flex-1 min-h-0">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={stats.jobDistribution || []}
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={50}
                                                    outerRadius={70}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {(stats.jobDistribution || []).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                    itemStyle={{ color: '#1e293b' }}
                                                />
                                                <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Technician Trends Chart */}
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-lg transition-shadow duration-300 flex flex-col h-[300px]">
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Technician Registration Trends</h3>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={stats.technicianTrends || []}>
                                            <defs>
                                                <linearGradient id="colorTechs" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} tickMargin={10} minTickGap={30} />
                                            <YAxis fontSize={12} tickLine={false} axisLine={false} tickMargin={10} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ color: '#1e293b' }}
                                                cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            />
                                            <Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorTechs)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>




                            {/* Activity Feed */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-100 dark:border-slate-800 mb-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Recent Activity</h3>
                                        <p className="text-sm text-slate-500 font-medium mt-1">Latest system events</p>
                                    </div>
                                    <button className="text-blue-600 font-bold text-sm hover:underline">View All</button>
                                </div>
                                <div className="space-y-6">
                                    {(stats.activityLog || []).map((activity) => (
                                        <div key={activity.id} className="flex items-start gap-4 group">
                                            <div className={`p-3 rounded-2xl ${activity.type === 'job' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10' : 'bg-green-50 text-green-600 dark:bg-green-500/10'} group-hover:scale-110 transition-transform duration-300`}>
                                                <span className="material-symbols-outlined text-xl">{activity.icon}</span>
                                            </div>
                                            <div className="flex-1 pt-1">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm">
                                                        {activity.user} <span className="font-medium text-slate-500 dark:text-slate-400">{activity.action}</span>
                                                    </h4>
                                                    <span className="text-xs font-bold text-slate-400">{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                                <p className="text-xs font-medium text-slate-400">
                                                    {new Date(activity.timestamp).toLocaleDateString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                    {(stats.activityLog || []).length === 0 && (
                                        <div className="text-center text-slate-500 py-4">No recent activity</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full">
                            {/* TECHNICIANS TAB */}
                            {activeTab === 'technicians' && (
                                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                    <span className="material-symbols-outlined text-6xl text-slate-300 mb-4">engineering</span>
                                    <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300">Technician Management</h2>
                                    <p className="text-slate-500 mt-2">Module coming in next update</p>
                                </div>
                            )}

                            {/* USERS TAB (New Implementation) */}
                            {activeTab === 'users' && (
                                <div className="flex flex-col h-[calc(100vh-100px)] relative -m-4 md:-m-8">
                                    <UserHeader onAddUser={() => setIsCreateUserOpen(true)} />
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                                        <div className="p-6 max-w-[1400px] mx-auto flex flex-col gap-6">
                                            <Filters
                                                searchQuery={searchQuery}
                                                setSearchQuery={setSearchQuery}
                                                activeTier={activeTier}
                                                setActiveTier={setActiveTier}
                                                activeStatus={activeStatus}
                                                setActiveStatus={setActiveStatus}
                                            />
                                            <UserTable
                                                users={paginatedUsers}
                                                selectedUserId={selectedUser?.id || null}
                                                onSelectUser={handleSelectUser}
                                                onBanUser={handleBanUser}
                                                onChangeMembership={handleChangeMembership}
                                                currentPage={userPage}
                                                onPageChange={setUserPage}
                                                totalPages={Math.ceil(filteredUsers.length / LIMIT_PER_PAGE)}
                                                totalItems={filteredUsers.length}
                                                startIndex={(userPage - 1) * LIMIT_PER_PAGE + 1}
                                                endIndex={Math.min(userPage * LIMIT_PER_PAGE, filteredUsers.length)}
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
                                        onEdit={handleEditUser}
                                    />

                                    <UserCreateModal
                                        isOpen={isCreateUserOpen || isEditUserOpen}
                                        onClose={() => { setIsCreateUserOpen(false); setIsEditUserOpen(false); }}
                                        onCreateUser={handleCreateUser}
                                        onUpdateUser={handleUpdateUser}
                                        initialData={isEditUserOpen ? selectedUser : null}
                                    />
                                </div>
                            )}

                            {/* JOBS TAB (New Professional Implementation) */}
                            {activeTab === 'jobs' && (
                                <div className="flex flex-col h-[calc(100vh-100px)] relative -m-4 md:-m-8">
                                    <JobHeader
                                        activeFilter={activeJobFilter}
                                        setActiveFilter={setActiveJobFilter}
                                        onAddJob={() => alert('Add Job Feature Coming Soon')}
                                    />
                                    <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
                                        <div className="p-6 max-w-[1400px] mx-auto flex flex-col gap-6">
                                            <JobStats jobs={filteredJobs} />
                                            <JobTable
                                                jobs={paginatedJobs}
                                                activeFilter={activeJobFilter}
                                                setActiveFilter={setActiveJobFilter}
                                                selectedJobId={selectedJob?.id || null}
                                                onSelectJob={handleSelectJob}
                                                onEditJob={handleEditJob}
                                                currentPage={jobPage}
                                                onPageChange={setJobPage}
                                                totalPages={Math.ceil(filteredJobs.length / LIMIT_PER_PAGE)}
                                                totalItems={filteredJobs.length}
                                                startIndex={(jobPage - 1) * LIMIT_PER_PAGE + 1}
                                                endIndex={Math.min(jobPage * LIMIT_PER_PAGE, filteredJobs.length)}
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
                                        onEdit={handleEditJob}
                                    />

                                    <JobFormModal
                                        isOpen={isEditJobOpen}
                                        onClose={() => setIsEditJobOpen(false)}
                                        onUpdateJob={handleUpdateJob}
                                        initialData={selectedJob}
                                    />
                                </div>
                            )}

                            {/* OTHER TABS (Placeholder to ensure switching works) */}
                            {activeTab !== 'dashboard' && activeTab !== 'users' && activeTab !== 'jobs' && activeTab !== 'technicians' && (
                                <div className="bg-white dark:bg-card-dark rounded-xl border border-gray-200 dark:border-white/5 p-6 shadow-sm">
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 italic">
                                        {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module Loaded
                                    </h3>
                                    <p className="text-gray-500 dark:text-text-secondary">
                                        Data for {activeTab} is ready.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div >
        </div >
    );
};

export default AdminDashboard;
