import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, History, Settings, MessageSquare,
    LogOut, Bell, Search, MapPin, Clock, Calendar,
    CheckCircle2, XCircle, TrendingUp, Star,
    Coffee, Briefcase, Zap, Menu, X,
    MoreVertical, User, ChevronDown, RefreshCw, Send, Image as ImageIcon, Lock, Shield,
    ArrowUpRight, ArrowDownRight, PieChart, Signal
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    AreaChart, Area, PieChart as RePieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar'; // Use main Navbar if preferred, or custom sidebar
import { useAuth } from '../context/AuthContext';
import useSupabaseRealtime from '../hooks/useSupabaseRealtime';

import GoogleMapReact from 'google-map-react';
import LiveRideModal from '../components/Dashboard/LiveRideModal';

// --- AdminLTE Style Components ---

// --- Modern Stat Card Component ---
const StatCard = ({ title, value, icon: Icon, color, trend, onClick, subtext }) => (
    <motion.div
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className={`relative overflow-hidden rounded-2xl bg-white shadow-lg border border-gray-100 p-6 cursor-pointer group hover:shadow-xl transition-all duration-300`}
    >
        <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 ${color} group-hover:scale-150 transition-transform duration-500`} />

        <div className="relative z-10 flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-gray-800 tracking-tight">{value}</h3>
                {subtext && <p className="text-xs text-gray-400 mt-1 font-medium">{subtext}</p>}
            </div>
            <div className={`p-3 rounded-xl ${color.replace('bg-', 'bg-opacity-20 ')} ${color.replace('bg-', 'text-')} bg-opacity-10`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
        </div>

        {trend && (
            <div className="mt-4 flex items-center text-xs font-bold">
                <span className={`${trend.positive ? 'text-emerald-500' : 'text-rose-500'} flex items-center gap-1`}>
                    {trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {trend.value}%
                </span>
                <span className="text-gray-400 ml-2">vs last month</span>
            </div>
        )}

        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
);

// --- Stats Detail Modal ---
const DashboardStatsModal = ({ isOpen, onClose, stats, type }) => {
    if (!isOpen) return null;

    const totalBalance = typeof stats.earnings === 'object' ? (stats.earnings.balance || 0) : (stats.earnings || 0);
    const monthlyTotal = typeof stats.monthlyEarnings === 'object' ? (stats.monthlyEarnings.amount || 0) : (stats.monthlyEarnings || 0);

    const data = [
        { name: 'Week 1', value: monthlyTotal * 0.2 || (monthlyTotal > 0 ? 0 : 4000) },
        { name: 'Week 2', value: monthlyTotal * 0.25 || (monthlyTotal > 0 ? 0 : 3000) },
        { name: 'Week 3', value: monthlyTotal * 0.3 || (monthlyTotal > 0 ? 0 : 5000) },
        { name: 'Week 4', value: monthlyTotal * 0.25 || (monthlyTotal > 0 ? 0 : 4500) },
    ];

    const pieData = [
        { name: 'Completed', value: stats.completedJobs, color: '#10B981' }, // Emerald
        { name: 'Rejected', value: stats.rejectedJobs || 0, color: '#F43F5E' },  // Rose
    ];

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                >
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-800">Detailed Analytics</h2>
                            <p className="text-sm text-gray-500">Monthly Performance Report</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                            <X size={24} className="text-gray-500" />
                        </button>
                    </div>

                    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Area Chart: Earnings Trend */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <TrendingUp size={20} className="text-blue-500" /> Earnings Curve
                            </h3>
                            <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart key={isOpen} data={data}>
                                        <defs>
                                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Pie Chart: Job Distribution */}
                        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                                <PieChart size={20} className="text-emerald-500" /> Job Distribution
                            </h3>
                            <div className="h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RePieChart key={isOpen}>
                                        <Pie
                                            data={pieData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {pieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <RechartsTooltip />
                                    </RePieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                                    <span className="text-3xl font-bold text-gray-800">{stats.completedJobs + stats.rejectedJobs}</span>
                                    <span className="text-xs text-gray-400 font-medium uppercase">Total</span>
                                </div>
                            </div>
                            <div className="flex justify-center gap-6 mt-4">
                                {pieData.map((item, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                        <span className="text-sm text-gray-600 font-medium">{item.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 border-t border-gray-100">
                        <h4 className="font-bold text-gray-800 mb-4">Quick Insights</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Completion Rate</div>
                                <div className="text-2xl font-bold text-emerald-600">
                                    {Math.round((stats.completedJobs / (stats.completedJobs + stats.rejectedJobs || 1)) * 100)}%
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Avg. Earnings / Job</div>
                                <div className="text-2xl font-bold text-blue-600">
                                    ₹{stats.completedJobs ? Math.round(totalBalance / stats.completedJobs) : 0}
                                </div>
                            </div>
                            <div className="p-4 bg-white rounded-lg border border-gray-200">
                                <div className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1">Customer Rating</div>
                                <div className="text-2xl font-bold text-amber-500 flex items-center gap-1">
                                    {stats.rating} <Star size={18} fill="currentColor" />
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const ContentHeader = ({ title, breadcrumb }) => (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 px-6 bg-transparent">
        <h1 className="text-lg sm:text-2xl font-normal text-gray-800 m-0">{title}</h1>
        <nav className="flex text-sm text-gray-500 mt-2 sm:mt-0">
            <span className="hover:text-blue-500 cursor-pointer">Home</span>
            <span className="mx-2">/</span>
            <span className="text-gray-700">{breadcrumb}</span>
        </nav>
    </div>
);

const Card = ({ title, tools, children, noPadding = false, headerColor = "border-t-blue-500", height = "auto" }) => (
    <div className={`bg-white rounded-md shadow-sm border-t-4 ${headerColor} mb-12 flex flex-col`} style={{ minHeight: height }}>
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
            <div className="flex items-center gap-2 text-gray-400">
                {tools}
            </div>
        </div>
        <div className={`flex-1 ${noPadding ? 'p-0' : 'p-8'}`}>
            {children}
        </div>
    </div>
);

const StatusToggle = ({ currentStatus, onUpdate, loading }) => {
    const statuses = [
        { id: 'available', label: 'Available', color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-100' },
        { id: 'engaged', label: 'Engaged', color: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-100' },
        { id: 'finishing_work', label: 'Finishing', color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-100' },
        { id: 'not_available', label: 'Offline', color: 'bg-gray-500', text: 'text-gray-700', bg: 'bg-gray-200' },
    ];

    const current = statuses.find(s => s.id === currentStatus) || statuses[0];
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative z-50">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded shadow-sm text-sm font-medium transition-all ${current.bg} ${current.text} border border-transparent hover:shadow-md`}
            >
                {loading ? <RefreshCw size={14} className="animate-spin" /> : <div className={`w-2 h-2 rounded-full ${current.color}`} />}
                <span>{current.label}</span>
                <ChevronDown size={14} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="absolute right-0 mt-2 w-40 bg-white rounded shadow-lg border border-gray-200 py-1"
                    >
                        {statuses.map((status) => (
                            <button
                                key={status.id}
                                onClick={() => { onUpdate(status.id); setIsOpen(false); }}
                                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                                <div className={`w-2 h-2 rounded-full ${status.color}`} />
                                {status.label}
                            </button>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// --- Main Layout Component ---

const TechnicianDashboard = () => {
    const navigate = useNavigate();
    const socket = useSocket();
    const { user, logout, updateUser } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    // [FIX] Sync Tab with URL for Back Button Support
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'dashboard';
    const setActiveTab = (tab) => setSearchParams({ tab });

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('sessionToken');
            if (token) {
                await api.post('/users/logout', { token });
            }
        } catch (error) {
            console.error("Logout error", error);
        } finally {
            // Hard Logout: Clear storage and force reload to Home to bypass ProtectedRoute race conditions
            localStorage.removeItem('user');
            localStorage.removeItem('sessionToken');
            window.location.replace('/');
        }
    };

    // Data States
    const [stats, setStats] = useState({
        earnings: { balance: 0, monthly: 0 },
        monthlyEarnings: 0,
        completedJobs: user?.completedJobs || 0,
        pendingJobs: user?.pendingJobs || 0,
        rejectedJobs: user?.rejectedJobs || 0,
        acceptedJobs: user?.acceptedJobs || 0,
        rating: user?.rating || 0,
        totalReviews: user?.reviewCount || 0,
        onTime: 100
    });
    const [feedbacks, setFeedbacks] = useState([]);
    const [myJobs, setMyJobs] = useState([]);
    const [statusLoading, setStatusLoading] = useState(false);

    // [RESTORED] Missing UI State
    const [rideModalOpen, setRideModalOpen] = useState(false);
    const [activeRideJob, setActiveRideJob] = useState(null);
    const [jobFilter, setJobFilter] = useState('all');
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState("");
    const [selectedJobId, setSelectedJobId] = useState(null);
    const [viewJob, setViewJob] = useState(null);
    const [openMenuJobId, setOpenMenuJobId] = useState(null);
    const [statsModalOpen, setStatsModalOpen] = useState(false);
    const [activeChatUser, setActiveChatUser] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [profileLoading, setProfileLoading] = useState(false);
    const [profileForm, setProfileForm] = useState({ password: '' });
    const [registeredAddress, setRegisteredAddress] = useState("Loading location...");

    // Ride Tracking State
    const [currentRideId, setCurrentRideId] = useState(null);
    const [watchId, setWatchId] = useState(null);

    const [offers, setOffers] = useState([
        { title: "Complete 10 Jobs", description: "Get ₹500 bonus", badgeText: "Active" },
        { title: "Maintain 4.8 Rating", description: "Priority Allocation", badgeText: "Goal" }
    ]);
    const [currentLocationName, setCurrentLocationName] = useState("Unknown Location");
    const [currentTime, setCurrentTime] = useState(new Date());
    const [formattedTime, setFormattedTime] = useState("");
    const [unreadNotifications, setUnreadNotifications] = useState(0);

    const chatEndRef = useRef(null);

    // Initial Clock & Location
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);




    // [NEW] Resolve Registered Address

    useEffect(() => {
        if (!user) return;

        const resolveAddress = async () => {
            // 1. Resolve Current Location (from lat/lng) for Header
            // Use top-level or nested location object
            const lat = user.latitude || user.location?.latitude;
            const lng = user.longitude || user.location?.longitude;

            if (lat && lng) {
                try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
                    const data = await res.json();
                    if (data.results?.[0]) {
                        const locality = data.results[0].address_components.find(c => c.types.includes('locality') || c.types.includes('sublocality'))?.long_name;
                        const city = data.results[0].address_components.find(c => c.types.includes('administrative_area_level_2'))?.long_name;
                        const street = data.results[0].address_components.find(c => c.types.includes('route'))?.short_name;

                        // Construct a readable place name
                        let placeName = [street, locality, city].filter(Boolean).join(', ');
                        if (!placeName && data.results[0].formatted_address) {
                            placeName = data.results[0].formatted_address.split(',')[0];
                        }

                        if (placeName) {
                            setCurrentLocationName(placeName);
                        } else {
                            setCurrentLocationName("Unknown Place");
                        }
                    } else {
                        setCurrentLocationName("Location not found");
                    }
                } catch (e) {
                    console.error("Current Loc Error:", e);
                    setCurrentLocationName("Locating Error");
                }
            } else if (user.city) {
                setCurrentLocationName(user.city);
            } else {
                setCurrentLocationName("No live location");
            }

            // 2. Resolve Registered Location (from registeredLatitude/Longitude) for Card
            const rLat = user.registeredLatitude || user.latitude || user.location?.latitude;
            const rLng = user.registeredLongitude || user.longitude || user.location?.longitude;

            if (rLat && rLng) {
                try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${rLat},${rLng}&key=${apiKey}`);
                    const data = await res.json();
                    if (data.results?.[0]) {
                        // Prefer full address for registration
                        const formatted = data.results[0].formatted_address;
                        setRegisteredAddress(formatted || "Location Found");
                    } else {
                        setRegisteredAddress(user.address || user.baseAddress || "Reg. Location not found");
                    }
                } catch (e) {
                    console.error("Reg Loc Error:", e);
                    setRegisteredAddress(user.address || user.baseAddress || "Address Error");
                }
            } else {
                setRegisteredAddress(user.address || user.baseAddress || "No Registered Address");
            }
        };

        resolveAddress();
    }, [user]);

    // [FIX] Real-time Status & Data Sync
    useEffect(() => {
        if (!socket || !user) return;

        socket.on('technician_status_update', (data) => {
            if (data.technicianId === user?.id) {
                if (updateProfile) {
                    updateProfile({ status: data.status });
                }
            }
        });

        const handleJobUpdate = (data) => {
            // Refresh data on any job change relevant to this tech
            fetchAllData();
        };

        const handleStatsUpdate = (updatedTech) => {
            if (updatedTech.id === user.id) {
                setStats(prev => ({
                    ...prev,
                    completedJobs: updatedTech.completedJobs || 0,
                    pendingJobs: updatedTech.pendingJobs || 0,
                    rejectedJobs: updatedTech.rejectedJobs || 0,
                    acceptedJobs: updatedTech.acceptedJobs || 0,
                    rating: updatedTech.rating || prev.rating,
                    totalReviews: updatedTech.reviewCount || prev.totalReviews
                }));
                // Also persist to auth context if needed, but local state is faster for dashboard
                updateUser({ ...user, ...updatedTech });
            }
        };

        const handleWalletUpdate = (data) => {
            if (data.balance !== undefined) {
                setStats(prev => ({ ...prev, earnings: { ...prev.earnings, balance: data.balance } }));
            }
        };

        socket.on('technician_status_update', handleStatusUpdate);
        socket.on('job_updated', handleJobUpdate);
        socket.on('job_status_updated', handleJobUpdate);
        socket.on('new_job_assigned', handleJobUpdate);
        socket.on('stats_updated', handleStatsUpdate);
        socket.on('wallet_updated', handleWalletUpdate);
        socket.on('payment_received', handleWalletUpdate);

        return () => {
            socket.off('technician_status_update', handleStatusUpdate);
            socket.off('job_updated', handleJobUpdate);
            socket.off('job_status_updated', handleJobUpdate);
            socket.off('new_job_assigned', handleJobUpdate);
            socket.off('stats_updated', handleStatsUpdate);
            socket.off('wallet_updated', handleWalletUpdate);
            socket.off('payment_received', handleWalletUpdate);
        };
    }, [socket, user]);

    // [NEW] Ride Tracking Effect
    useEffect(() => {
        if (currentRideId && navigator.geolocation) {
            const id = navigator.geolocation.watchPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    try {
                        // Update Server (RideManager)
                        await api.put(`/rides/${currentRideId}/location`, { location: { latitude, longitude } });
                        // Update Socket (redundant if API broadcasts, but safe)
                    } catch (err) {
                        console.error("Ride tracking error", err);
                    }
                },
                (err) => console.error(err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            setWatchId(id);
        } else {
            if (watchId) {
                navigator.geolocation.clearWatch(watchId);
                setWatchId(null);
            }
        }
        return () => {
            if (watchId) navigator.geolocation.clearWatch(watchId);
        };
    }, [currentRideId]);

    // Live Data Fetching


    // [NEW] Notification Real-time
    useSupabaseRealtime('notifications', (payload) => {
        if (payload.new && payload.new.receiverId === user.id && !payload.new.read) {
            setUnreadNotifications(prev => prev + 1);
        }
    });

    useEffect(() => {
        const fetchNotifications = async () => {
            if (!user) return;
            try {
                // Assuming an endpoint exists, or defaulting to 0 if not yet implemented
                const res = await api.get(`/notifications/unread/${user.id}`);
                if (res.data.success) setUnreadNotifications(res.data.count);
            } catch (e) {
                // Silent fail or just set to 0
                console.log("Notification fetch info:", e.message);
            }
        };
        fetchNotifications();
    }, [user]);

    // [RESTORED] Missing Data Fetching & Derived State
    const fetchAllData = async () => {
        if (!user) return;
        try {
            // Fetch jobs
            const jobsRes = await api.get(`/jobs/technician/${user.id}`);
            if (jobsRes.data.success) setMyJobs(jobsRes.data.jobs);

            // Fetch stats
            const statsRes = await api.get(`/technicians/${user.id}/stats`);
            // Handle potentially different response structures
            if (statsRes.data.success) {
                setStats(prev => ({ ...prev, ...statsRes.data.stats }));
            }

            // Fetch feedback
            const feedbackRes = await api.get(`/technicians/${user.id}/feedbacks`);
            if (feedbackRes.data.success) setFeedbacks(feedbackRes.data.feedbacks);

        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        }
    };

    // [NEW] Sync Stats with User Object (Real-time updates via user prop)
    useEffect(() => {
        if (user) {
            setStats(prev => ({
                ...prev,
                // Stats Sync
                completedJobs: user.completedJobs !== undefined ? user.completedJobs : prev.completedJobs,
                rejectedJobs: user.rejectedJobs !== undefined ? user.rejectedJobs : prev.rejectedJobs,
                acceptedJobs: user.acceptedJobs !== undefined ? user.acceptedJobs : prev.acceptedJobs, // [NEW]
                pendingJobs: user.pendingJobs !== undefined ? user.pendingJobs : prev.pendingJobs,
                rating: user.rating !== undefined ? user.rating : prev.rating
            }));
        }
    }, [user]);

    useEffect(() => {
        fetchAllData();
    }, [user]);

    const filteredJobs = (myJobs || []).filter(job => {
        if (jobFilter === 'all') return ['pending', 'accepted', 'in_progress'].includes(job.status);
        return job.status === jobFilter;
    });

    // [RESTORED] Handlers
    const handleStatusUpdate = async (newStatus) => {
        setStatusLoading(true);
        try {
            const res = await api.put(`/technicians/${user.id}/status`, { status: newStatus });
            if (res.data.success) {
                updateUser({ ...user, status: newStatus });
            }
        } catch (error) {
            console.error("Status update error", error);
        } finally {
            setStatusLoading(false);
        }
    };

    const handleStartRide = async (job) => {
        if (!navigator.geolocation) return alert("Geolocation is not supported by your browser.");

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const startLoc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };

            // 1. Update Job Status to In Progress
            await handleJobAction(job.id, 'start');

            // 2. Start Ride Session
            try {
                const res = await api.post('/rides/start', {
                    technicianId: user.id,
                    jobId: job.id,
                    startLocation: startLoc,
                    endLocation: job.location || { latitude: 0, longitude: 0 }
                });

                if (res.data.success) {
                    setCurrentRideId(res.data.ride.id);
                    setRideModalOpen(true);
                    // Also open the map view directly
                    window.open(`https://www.google.com/maps/dir/?api=1&origin=${startLoc.latitude},${startLoc.longitude}&destination=${job.location?.latitude},${job.location?.longitude}`, '_blank');
                }
            } catch (err) {
                console.error("Failed to start ride session", err);
                alert("Could not start ride tracking. Job status updated.");
            }
        });
    };

    const handleViewJobDetails = (jobId) => {
        const job = myJobs.find(j => j.id === jobId);
        if (job) setViewJob(job);
    };

    const handleSendMessage = () => {
        if (!newMessage.trim() || !activeChatUser) return;
        // socket code would go here
        setChatMessages(prev => [...prev, { senderId: user.id, message: newMessage, createdAt: new Date() }]);
        setNewMessage("");
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            // Mock update
            await new Promise(r => setTimeout(r, 1000));
            alert("Profile updated successfully!");
        } catch (err) {
            console.error(err);
        } finally {
            setProfileLoading(false);
        }
    };


    const handleJobAction = async (jobId, action, extraData = {}) => {
        try {
            let status = '';
            let apiData = {};

            switch (action) {
                case 'accept': status = 'accepted'; break;
                case 'reject': status = 'rejected'; break;
                case 'start': status = 'in_progress'; break;
                case 'complete': status = 'completed'; break;
                case 'cancel': status = 'cancelled'; break;
                default: return;
            }

            // Optimistic Update
            setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, status } : j));

            const res = await api.put(`/jobs/${jobId}/status`, { status, details: { ...extraData, ...apiData } });

            if (res.data.success) {
                // Confirm with server data
                setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, ...res.data.job } : j));

                // [NEW] Clear Ride State if Completed/Rejected
                if (['complete', 'reject', 'cancel'].includes(action)) {
                    setCurrentRideId(null);
                    setRideModalOpen(false);
                    // If tracking, stop it
                    if (watchId) {
                        navigator.geolocation.clearWatch(watchId);
                        setWatchId(null);
                    }
                }

                fetchAllData(); // key for stats sync
                setOpenMenuJobId(null);
            }
        } catch (error) {
            console.error(`Failed to ${action} job:`, error);
            // Revert on error (could implement more robust rollback)
            fetchAllData();
        }
    };

    // ...

    const renderJobItem = (job) => (
        <div key={job.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl shrink-0">
                    {job.serviceType.charAt(0)}
                </div>
                <div>
                    <h4 className="font-bold text-gray-800 text-base">{job.serviceType} Request</h4>
                    <p className="text-sm text-gray-700 font-bold">{job.contactName || job.customer?.name || "Customer"}</p>
                    <p className="text-xs text-blue-600 font-medium">Mobile: {job.customerMobile || job.contactPhone || job.customer?.phone || "No Phone"}</p>
                    <p className="text-xs text-gray-500 line-clamp-1 mt-1">{job.description || "No description provided"}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Clock size={12} /> {new Date(job.scheduledDate).toLocaleDateString()}
                        <MapPin size={12} className="ml-2" />
                        {job.location && typeof job.location === 'object' ? (
                            <span
                                className="text-blue-500 cursor-pointer hover:underline font-medium"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`https://www.google.com/maps?q=${job.location.latitude},${job.location.longitude}`, '_blank');
                                }}
                            >
                                View Map
                            </span>
                        ) : "Remote / TBD"}
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end gap-2 w-full sm:w-auto">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                        ${job.status === 'in_progress' ? 'bg-amber-100 text-amber-600' :
                        job.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                            'bg-gray-100 text-gray-600'}`
                }>
                    {job.status.replace('_', ' ')}
                </span>

                {/* Action Buttons via Popup Menu */}
                <div className="relative">
                    <button
                        onClick={() => setOpenMenuJobId(openMenuJobId === job.id ? null : job.id)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors border border-gray-200"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {openMenuJobId === job.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-50 py-2 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            {job.status === 'pending' && (
                                <button
                                    onClick={() => { handleJobAction(job.id, 'accept'); setOpenMenuJobId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 group"
                                >
                                    <div className="p-1 rounded-full bg-emerald-100 group-hover:bg-emerald-200 transition-colors"><CheckCircle2 size={14} /></div>
                                    Accept Request
                                </button>
                            )}
                            {job.status === 'accepted' && (
                                <button
                                    onClick={() => { handleStartRide(job); setOpenMenuJobId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-amber-600 hover:bg-amber-50 flex items-center gap-2 group border-b border-gray-50"
                                >
                                    <div className="p-1 rounded-full bg-amber-100 group-hover:bg-amber-200 transition-colors"><MapPin size={14} /></div>
                                    Start Journey
                                </button>
                            )}
                            {job.status === 'in_progress' && (
                                <button
                                    onClick={() => { handleJobAction(job.id, 'complete'); setOpenMenuJobId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-blue-600 hover:bg-blue-50 flex items-center gap-2 group"
                                >
                                    <div className="p-1 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors"><CheckCircle2 size={14} /></div>
                                    Mark Completed
                                </button>
                            )}
                            {['accepted', 'pending'].includes(job.status) && (
                                <button
                                    onClick={() => { setRejectModalOpen(true); setSelectedJobId(job.id); setOpenMenuJobId(null); }}
                                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 group"
                                >
                                    <div className="p-1 rounded-full bg-rose-100 group-hover:bg-rose-200 transition-colors"><XCircle size={14} /></div>
                                    Reject Job
                                </button>

                            )
                            }
                            <button
                                onClick={() => { handleViewJobDetails(job.id); setOpenMenuJobId(null); }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 border-t border-gray-100 mt-1"
                            >
                                View Details
                            </button>
                        </div >
                    )}
                </div >
            </div >
        </div >
    );

    const renderDashboardContent = () => (
        <div className="p-4 sm:p-6 lg:p-8">
            {/* Rejection Modal */}
            <AnimatePresence>
                {rejectModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
                        >
                            <h3 className="text-lg font-bold text-gray-800 mb-4">Reject Job Request</h3>
                            <textarea
                                className="w-full border border-gray-300 rounded p-3 text-sm focus:ring-2 focus:ring-red-500 outline-none mb-4"
                                rows="4"
                                placeholder="Please provide a reason for rejection..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button onClick={() => setRejectModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">Cancel</button>
                                <button
                                    onClick={() => handleJobAction(selectedJobId, 'reject', { reason: rejectReason })}
                                    disabled={!rejectReason.trim()}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                                >
                                    Confirm Rejection
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Ride Tracking Modal - [NEW] */}
            <AnimatePresence>
                {rideModalOpen && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ y: 50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 50, opacity: 0 }}
                            className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6 text-center border border-indigo-100"
                        >
                            <div className="mb-4 relative">
                                <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-75"></div>
                                <div className="relative bg-amber-100 text-amber-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                                    <MapPin size={32} />
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-1">Live Tracking Active</h3>
                            <p className="text-sm text-gray-500 mb-6">Navigating to customer location. Updates are being sent live.</p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={() => window.open(`https://www.google.com/maps`, '_blank')}
                                    className="w-full py-2.5 bg-indigo-600 text-white font-bold rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <MapPin size={16} /> Open Google Maps
                                </button>
                                <button
                                    onClick={() => setRideModalOpen(false)}
                                    className="text-sm text-gray-500 underline hover:text-gray-700"
                                >
                                    Minimize Window
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* View Details Modal */}
            <AnimatePresence>
                {viewJob && (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
                        >
                            <div className="flex justify-between items-start mb-6">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Job #{viewJob.id} Details</h3>
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide
                                        ${viewJob.status === 'in_progress' ? 'bg-amber-100 text-amber-600' :
                                            viewJob.status === 'accepted' ? 'bg-blue-100 text-blue-600' :
                                                viewJob.status === 'completed' ? 'bg-green-100 text-green-600' :
                                                    'bg-gray-100 text-gray-600'}`
                                    }>
                                        {viewJob.status.replace('_', ' ')}
                                    </span>
                                </div>
                                <button onClick={() => setViewJob(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <User size={16} /> Customer Info
                                        </h4>
                                        <p className="text-sm text-gray-600"><span className="font-semibold">Name:</span> {viewJob.contactName || viewJob.customer?.name || "N/A"}</p>
                                        <p className="text-sm text-gray-600"><span className="font-semibold">Phone/Mobile:</span> {viewJob.customerMobile || viewJob.contactPhone || viewJob.customer?.phone || "N/A"}</p>
                                    </div>
                                    <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                            <Clock size={16} /> Schedule
                                        </h4>
                                        <p className="text-sm text-gray-600"><span className="font-semibold">Date:</span> {new Date(viewJob.scheduledDate).toLocaleDateString()}</p>
                                        <p className="text-sm text-gray-600"><span className="font-semibold">Time:</span> {viewJob.scheduledTime || "Flexible"}</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <MapPin size={16} /> Location Info
                                    </h4>
                                    <p className="text-sm text-gray-600 line-clamp-2">
                                        {viewJob.address || "No address provided"}
                                    </p>
                                    <div className="mt-2">
                                        {viewJob.location && typeof viewJob.location === 'object' ? (
                                            <span
                                                className="text-blue-500 cursor-pointer hover:underline text-xs font-bold"
                                                onClick={() => window.open(`https://www.google.com/maps?q=${viewJob.location.latitude},${viewJob.location.longitude}`, '_blank')}
                                            >
                                                Open in Maps
                                            </span>
                                        ) : <span className="text-xs text-gray-400">Coords N/A</span>}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4 pt-4">
                                <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 h-full">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <Briefcase size={16} /> Service Details
                                    </h4>
                                    <p className="text-sm text-gray-600 mb-2"><span className="font-semibold">Type:</span> {viewJob.serviceType}</p>
                                    <p className="text-sm text-gray-600 mb-4"><span className="font-semibold">Description:</span> {viewJob.description}</p>
                                    <div className="pt-3 border-t border-gray-200">
                                        <p className="text-sm font-bold text-gray-800 flex justify-between">
                                            <span>Offer Price:</span>
                                            <span className="text-emerald-600">₹{viewJob.offerPrice || viewJob.visitingCharges || "TBD"}</span>
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {viewJob.location && viewJob.location.latitude && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <MapPin size={16} /> Location
                                    </h4>
                                    <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden relative">
                                        <img
                                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${viewJob.location.latitude},${viewJob.location.longitude}&zoom=15&size=600x300&markers=color:red%7C${viewJob.location.latitude},${viewJob.location.longitude}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`}
                                            alt="Map"
                                            className="w-full h-full object-cover"
                                        />
                                        <a
                                            href={`https://www.google.com/maps?q=${viewJob.location.latitude},${viewJob.location.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/20 transition-colors group"
                                        >
                                            <span className="bg-white px-4 py-2 rounded-full text-sm font-bold shadow-md group-hover:scale-105 transition-transform">Open in Google Maps</span>
                                        </a>
                                    </div>
                                </div>
                            )}

                            <div className="mt-8 flex justify-end gap-3">
                                {['accepted', 'pending'].includes(viewJob.status) && (
                                    <button
                                        onClick={() => { handleStartRide(viewJob); setViewJob(null); }}
                                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-bold flex items-center gap-2 shadow-lg animate-pulse"
                                    >
                                        <MapPin size={18} /> Start Riding Now
                                    </button>
                                )}
                                <button
                                    onClick={() => setViewJob(null)}
                                    className="px-6 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 font-medium"
                                >
                                    Close
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>


            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {/* Premium Stats Grid */}
                {/* Unified Grid for Top Row */}
                <StatCard
                    title="Total Balance"
                    value={`₹${(typeof stats.earnings === 'object' ? stats.earnings.balance : stats.earnings)?.toLocaleString() || 0}`}
                    icon={Wallet}
                    color="bg-emerald-500"
                    trend={stats.earnings?.balance > 0 ? { value: 12, positive: true } : null}
                    onClick={() => setStatsModalOpen(true)}
                    subtext="Available for withdrawal"
                />
                <StatCard
                    title="Month Earnings"
                    value={`₹${(typeof stats.monthlyEarnings === 'object' ? stats.monthlyEarnings.amount : stats.monthlyEarnings)?.toLocaleString() || 0}`}
                    icon={TrendingUp}
                    color="bg-blue-500"
                    trend={stats.monthlyEarnings > 0 ? { value: 5, positive: true } : null}
                    onClick={() => setStatsModalOpen(true)}
                    subtext="Since 1st of Month"
                />
                <StatCard
                    title="Completed Jobs"
                    value={stats.completedJobs}
                    icon={CheckCircle2}
                    color="bg-indigo-500"
                    onClick={() => setStatsModalOpen(true)}
                    subtext="Lifetime Total"
                />
                <StatCard
                    title="Rating"
                    value={stats.rating}
                    icon={Star}
                    color="bg-amber-500"
                    onClick={() => setActiveTab('feedback')}
                    subtext={`Based on ${stats.totalReviews} reviews`}
                />
            </div> {/* Close Unified Grid */}

            {/* Additional Stats Row - Grid Expanded */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-4 sm:gap-6 mb-8 px-1">
                {/* Existing Small Cards */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 xl:col-span-1 min-w-[140px] flex-shrink-0">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0"><Briefcase size={20} /></div>
                    <div className="overflow-hidden">
                        <div className="text-xl font-bold text-gray-800">{stats.monthJobs || stats.monthlyJobs || 0}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase truncate">Jobs This Month</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 xl:col-span-1 min-w-[140px] flex-shrink-0">
                    <div className="p-2 bg-rose-50 rounded-lg text-rose-600 flex-shrink-0"><XCircle size={20} /></div>
                    <div className="overflow-hidden">
                        <div className="text-xl font-bold text-gray-800">{stats.rejectedJobs || 0}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase truncate">Rejected</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 xl:col-span-1 min-w-[140px] flex-shrink-0">
                    <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 flex-shrink-0"><CheckCircle2 size={20} /></div>
                    <div className="overflow-hidden">
                        <div className="text-xl font-bold text-gray-800">{stats.completedJobs || 0}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase truncate">Completed</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 xl:col-span-1 min-w-[140px] flex-shrink-0">
                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600 flex-shrink-0"><Clock size={20} /></div>
                    <div className="overflow-hidden">
                        <div className="text-xl font-bold text-gray-800">{stats.pendingJobs || 0}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase truncate">Pending</div>
                    </div>

                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 xl:col-span-1 min-w-[140px] flex-shrink-0">
                    <div className="p-2 bg-cyan-50 rounded-lg text-cyan-600 flex-shrink-0"><CheckCircle2 size={20} /></div>
                    <div className="overflow-hidden">
                        <div className="text-xl font-bold text-gray-800">{stats.acceptedJobs || 0}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase truncate">Accepted</div>
                    </div>
                </div>

                {/* [NEW] Account Info Cards */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 xl:col-span-1 border-l-4 border-l-indigo-500 min-w-[140px] flex-shrink-0">
                    <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600 flex-shrink-0"><Shield size={20} /></div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-bold text-gray-800 truncate">{user?.membership || 'Free'}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase truncate">Membership</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 xl:col-span-1 border-l-4 border-l-orange-500 min-w-[140px] flex-shrink-0">
                    <div className="p-2 bg-orange-50 rounded-lg text-orange-600 flex-shrink-0"><MapPin size={20} /></div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-bold text-gray-800 truncate" title={registeredAddress}>{registeredAddress}</div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase truncate">Registered Loc</div>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 xl:col-span-1 border-l-4 border-l-pink-500 min-w-[140px] flex-shrink-0">
                    <div className="p-2 bg-pink-50 rounded-lg text-pink-600 flex-shrink-0"><Calendar size={20} /></div>
                    <div className="overflow-hidden">
                        <div className="text-sm font-bold text-gray-800 truncate">
                            {user?.membershipExpiry ? new Date(user.membershipExpiry).toLocaleDateString() : 'Lifetime'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase truncate">Expires On</div>
                    </div>
                </div>
            </div>

            <DashboardStatsModal
                isOpen={statsModalOpen}
                onClose={() => setStatsModalOpen(false)}
                stats={stats}
            />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-12">
                {/* Main Job List & Offers */}
                <div className="lg:col-span-2 space-y-16">
                    {/* [NEW] Direct Analytics Curve on Dashboard */}
                    <Card title="Earnings Dynamics" headerColor="border-t-blue-600" noPadding>
                        <div className="p-6">
                            <div className="h-64 sm:h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={[
                                            { name: 'Week 1', value: (typeof stats.earnings === 'object' ? stats.earnings.monthly : stats.earnings) * 0.2 || 4000 },
                                            { name: 'Week 2', value: (typeof stats.earnings === 'object' ? stats.earnings.monthly : stats.earnings) * 0.25 || 3000 },
                                            { name: 'Week 3', value: (typeof stats.earnings === 'object' ? stats.earnings.monthly : stats.earnings) * 0.3 || 5000 },
                                            { name: 'Week 4', value: (typeof stats.earnings === 'object' ? stats.earnings.monthly : stats.earnings) * 0.25 || 4500 },
                                        ]}
                                    >
                                        <defs>
                                            <linearGradient id="dashboardColorPrimary" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                        <RechartsTooltip
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#2563EB"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#dashboardColorPrimary)"
                                            animationDuration={2000}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Card>

                    <Card
                        title="Active Jobs"
                        headerColor="border-t-blue-500"
                        tools={
                            <div className="relative">
                                <select
                                    value={jobFilter}
                                    onChange={(e) => setJobFilter(e.target.value)}
                                    className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none cursor-pointer"
                                >
                                    <option value="all">Active (All)</option>
                                    <option value="pending">Pending</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="in_progress">In Progress</option>
                                </select>
                            </div>
                        }
                        noPadding
                    >
                        {filteredJobs.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Briefcase size={48} className="mx-auto text-gray-300 mb-2" />
                                <p>No {jobFilter !== 'all' ? jobFilter.replace('_', ' ') : 'active'} jobs found.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {Array.isArray(filteredJobs) && filteredJobs.map(job => renderJobItem(job))}
                            </div>
                        )}
                        <div className="p-4 border-t border-gray-100 text-center">
                            <button
                                onClick={() => setActiveTab('history')}
                                className="text-sm font-medium text-blue-600 hover:text-blue-700"
                            >
                                View All Job History
                            </button>
                        </div>
                    </Card>

                    {/* Offers Section */}
                    {offers.length > 0 && (
                        <Card title="Special Offers For You" headerColor="border-t-yellow-500">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(offers || []).map((offer, i) => (
                                    <div key={i} className="border border-yellow-100 bg-yellow-50 p-4 rounded-lg flex items-start gap-3">
                                        <Zap className="text-yellow-600 mt-1" size={20} />
                                        <div>
                                            <h4 className="font-bold text-gray-800 text-sm">{offer.title}</h4>
                                            <p className="text-xs text-gray-600 mt-1">{offer.description}</p>
                                            {offer.badgeText && <span className="inline-block mt-2 px-2 py-0.5 bg-yellow-200 text-yellow-800 text-[10px] font-bold rounded">{offer.badgeText}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Feedback Panel */}
                <div className="lg:col-span-1">
                    <Card title="Feedback Breakdown" headerColor="border-t-purple-500">
                        <div className="space-y-4">
                            {(() => {
                                // Dynamic Calculation
                                const metrics = [
                                    { key: 'timeliness', label: 'Timeliness', color: 'bg-green-500' },
                                    { key: 'expertise', label: 'Expertise', color: 'bg-blue-500' },
                                    { key: 'professionalism', label: 'Professionalism', color: 'bg-purple-500' },
                                    { key: 'honesty', label: 'Honesty', color: 'bg-cyan-500' },
                                    { key: 'behavior', label: 'Behavior', color: 'bg-indigo-500' },
                                    { key: 'knowledge', label: 'Knowledge', color: 'bg-teal-500' },
                                    { key: 'respect', label: 'Respect', color: 'bg-pink-500' },
                                    { key: 'overall', label: 'Overall', color: 'bg-amber-500' },
                                    { key: 'recommendation', label: 'Recommendation', color: 'bg-rose-500', max: 10 }
                                ];

                                const data = metrics.map(m => {
                                    if (!Array.isArray(feedbacks) || feedbacks.length === 0) return { ...m, v: 0, raw: "0.0" };
                                    const sum = feedbacks.reduce((acc, f) => {
                                        const val = f.ratings?.[m.key] || 0;
                                        return acc + Number(val);
                                    }, 0);
                                    const avg = sum / feedbacks.length;
                                    const max = m.max || 5;
                                    const percent = Math.round((avg / max) * 100);
                                    return { ...m, v: percent, raw: avg.toFixed(1) };
                                });

                                return data.map((m, i) => (
                                    <div key={i}>
                                        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                                            <span>{m.label}</span>
                                            <span>{m.v}% <span className="text-gray-400 font-normal">({m.raw})</span></span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div style={{ width: `${m.v}%` }} className={`h-full rounded-full ${m.color}`} />
                                        </div>
                                    </div>
                                ));
                            })()}
                            <h4 className="font-semibold text-gray-700 mt-6 mb-3 text-sm">Recent Reviews</h4>
                            <div className="space-y-3">
                                {(Array.isArray(feedbacks) ? feedbacks : []).slice(0, 3).map((f, i) => (
                                    <div key={i} className="bg-gray-50 p-3 rounded text-xs border border-gray-100">
                                        <div className="flex text-amber-400 mb-1">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={8} fill="currentColor" />)}
                                        </div>
                                        <div className='flex justify-between items-center mb-1'>
                                            <span className='font-bold text-[10px] text-gray-700'>{f.ratings?.overall || 5}/5</span>
                                            <span className='text-[10px] text-gray-400'>{new Date(f.createdAt || Date.now()).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-gray-600 italic">"{f.comment || 'No comment'}"</p>
                                    </div>
                                ))}
                                {feedbacks.length === 0 && <p className="text-xs text-center text-gray-400">No reviews to display.</p>}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div >
    );

    const renderChat = () => (
        <div className="px-6 h-[calc(100vh-140px)] flex flex-col">
            <Card title="Live Chat Support" headerColor="border-t-blue-600" height="100%" noPadding>
                <div className="flex h-full">
                    {/* Contacts List */}
                    <div className="w-64 border-r border-gray-100 bg-gray-50 flex flex-col">
                        <div className="p-3 border-b border-gray-100 font-bold text-xs text-gray-500 uppercase">Recent Chats</div>
                        <div className="flex-1 overflow-y-auto">
                            {/* Mock Contacts for now until we have history API integrated fully */}
                            <div onClick={() => setActiveChatUser({ id: 'admin', name: 'Admin Support' })} className={`p-4 hover:bg-white cursor-pointer transition-colors ${activeChatUser?.id === 'admin' ? 'bg-white border-l-4 border-blue-500' : ''}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">A</div>
                                    <div>
                                        <div className="text-sm font-bold text-gray-700">Admin Support</div>
                                        <div className="text-xs text-green-500">Online</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col bg-white">
                        {activeChatUser ? (
                            <>
                                <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h4 className="font-bold text-gray-700">{activeChatUser.name}</h4>
                                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {(Array.isArray(chatMessages) ? chatMessages : []).map((msg, i) => (
                                        <div key={i} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] p-3 rounded-lg text-sm ${msg.senderId === user.id ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                                {msg.message}
                                                <div className={`text-[10px] mt-1 ${msg.senderId === user.id ? 'text-blue-200' : 'text-gray-400'}`}>
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={chatEndRef} />
                                </div>
                                <div className="p-3 border-t border-gray-100 bg-white">
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500 transition-colors"
                                        />
                                        <button onClick={handleSendMessage} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors">
                                            <Send size={18} />
                                        </button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col">
                                <MessageSquare size={48} className="mb-2 opacity-50" />
                                <p>Select a contact to start chatting</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    );

    const renderSettings = () => (
        <div className="px-6 max-w-2xl">
            <Card title="Profile Settings" headerColor="border-t-slate-600">
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                                {user.documents?.photo ? (
                                    <img src={user.documents.photo} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="text-gray-400" />
                                )}
                            </div>
                            <button type="button" className="text-sm text-blue-600 font-medium hover:underline">Upload New Photo</button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Change Password</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="password"
                                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Enter new password"
                                value={profileForm.password}
                                onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Membership Status</label>
                        <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded">
                            <Shield className="text-indigo-600" size={20} />
                            <div>
                                <div className="font-bold text-indigo-900 text-sm">Free Membership</div>
                                <div className="text-xs text-indigo-600">Upgrade to Premium for lower commissions and verified badge.</div>
                            </div>
                            <button type="button" className="ml-auto px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700">Upgrade</button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100">
                        <button disabled={profileLoading} className="px-6 py-2 bg-slate-900 text-white font-bold rounded hover:bg-slate-800 transition-colors disabled:opacity-50 text-sm">
                            {profileLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </Card>
        </div>
    );

    return (
        <div className="flex bg-gray-100 font-sans text-gray-800 h-screen overflow-hidden">
            {/* --- SIDEBAR --- */}
            {/* Mobile: Fixed & Translated. Desktop: Relative & Width-based toggle */}
            <aside
                className={`
                    bg-slate-900 z-40 shadow-xl flex flex-col transition-all duration-300 ease-in-out
                    fixed inset-y-0 left-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                    md:relative md:translate-x-0 
                    ${sidebarOpen ? 'md:w-64' : 'md:w-0'} 
                    w-64
                `}
            >
                <div className="w-64 flex flex-col h-full border-r border-gray-800">
                    {/* Brand Logo */}
                    <div className="h-[57px] flex items-center px-4 border-b border-gray-700 bg-slate-900 shadow-sm shrink-0">
                        <img src="/logo.png" alt="Fixofy" className="w-8 h-8 mr-3 object-contain" />
                        <span className="text-lg font-light text-gray-200 tracking-wide">Fixofy</span>
                    </div>

                    {/* User Panel */}
                    <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                        <img src={user?.documents?.photo || `https://ui-avatars.com/api/?name=${user?.name}`} className="w-9 h-9 rounded-full border border-gray-600" alt="User" />
                        <div className="overflow-hidden">
                            <div className="text-gray-200 text-sm font-medium truncate w-32">{user?.name}</div>
                            <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider mb-0.5">{user?.serviceType || 'Professional'}</div>
                            <div className="flex items-center gap-1 text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Online
                            </div>
                        </div>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 overflow-y-auto py-2 custom-scrollbar">
                        <ul className="space-y-1 px-2">
                            {[
                                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                                { id: 'jobs', label: 'My Contracts', icon: Briefcase },
                                { id: 'chat', label: 'Live Chat', icon: MessageSquare },
                                { id: 'wallet', label: 'Finances', icon: Wallet },
                                { id: 'history', label: 'History', icon: History },
                                { id: 'feedback', label: 'Feedback', icon: Star },
                            ].map(item => (
                                <li key={item.id}>
                                    <button
                                        onClick={() => { setActiveTab(item.id); if (window.innerWidth < 768) setSidebarOpen(false); }}
                                        className={`w-full flex items-center px-3 py-2.5 rounded text-sm transition-colors ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                                    >
                                        <item.icon size={18} className="mr-3 opactiy-80" />
                                        {item.label}
                                    </button>
                                </li>
                            ))}

                            <li className="mt-8 px-3 text-xs font-bold text-gray-500 uppercase tracking-wider">Settings</li>
                            <li>
                                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center px-3 py-2.5 rounded text-sm transition-colors ${activeTab === 'settings' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}>
                                    <User size={18} className="mr-3" /> Profile
                                </button>
                            </li>
                            <li>
                                <button onClick={handleLogout} className="w-full flex items-center px-3 py-2.5 rounded text-sm text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-colors mt-2">
                                    <LogOut size={18} className="mr-3" /> Sign Out
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            </aside>

            {/* Mobile Backdrop */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="fixed inset-0 bg-black/50 z-30 md:hidden"
                />
            )}

            {/* --- CONTENT WRAPPER --- */}
            {/* No manual margins! Flexbox handles it. */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative">

                {/* Navbar */}
                <nav className="bg-white h-[57px] shadow-sm border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30 shrink-0">
                    <div className="flex items-center">
                        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 text-gray-500 hover:text-gray-700">
                            <Menu size={20} />
                        </button>
                        <div className="hidden sm:flex items-center text-sm text-gray-500 ml-4 gap-4">
                            <span className="hover:text-blue-500 cursor-pointer text-gray-700 font-medium">Home</span>
                            <span className="hover:text-blue-500 cursor-pointer">Contact</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-6">
                        {/* Realtime Status Toggle in Navbar */}
                        <StatusToggle currentStatus={user?.status} onUpdate={handleStatusUpdate} loading={statusLoading} />

                        <div className="flex items-center gap-2 sm:gap-4 text-gray-400">
                            {/* Force Search/Bell to fit better on mobile */}
                            <div className="flex gap-2">
                                <Search size={18} className="hover:text-blue-500 cursor-pointer" />
                                <div className="relative">
                                    <Bell size={18} className="hover:text-blue-500 cursor-pointer" />
                                    {unreadNotifications > 0 && <span className="absolute -top-1.5 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-sm shadow-sm">{unreadNotifications}</span>}
                                </div>
                            </div>

                            <div className="h-6 w-px bg-gray-200 mx-1 sm:mx-2"></div>

                            {/* Time & Location: Enhanced alignment and formatting */}
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="hidden xs:flex flex-col items-end leading-tight">
                                    <div className="flex items-center gap-1.5 text-gray-700 font-bold tracking-tight">
                                        <Clock size={12} className="text-blue-500" />
                                        <span className="text-[11px] sm:text-xs">
                                            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-400 mt-0.5">
                                        <MapPin size={10} className="shrink-0" />
                                        <span className="text-[9px] sm:text-[10px] max-w-[100px] sm:max-w-[150px] truncate font-medium">
                                            {currentLocationName || "Locating..."}
                                        </span>
                                    </div>
                                </div>

                                {/* Network Indicator: Modern Signal Symbol */}
                                <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 rounded-lg border border-emerald-100/50 group">
                                    <div className="relative">
                                        <Signal size={14} className="text-emerald-600" />
                                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse border border-white"></span>
                                    </div>
                                    <span className="text-[9px] sm:text-[10px] text-emerald-700 font-bold uppercase tracking-wider hidden xs:block">
                                        Live
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </nav>

                {/* Main Content Scrollable Area */}
                <main className="flex-1 bg-gray-100 overflow-y-auto pb-20">
                    <ContentHeader
                        title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                        breadcrumb={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                    />

                    {/* Dynamic Content Switching */}
                    {activeTab === 'dashboard' && renderDashboardContent()}
                    {activeTab === 'chat' && renderChat()}
                    {activeTab === 'settings' && renderSettings()}

                    {['jobs', 'wallet', 'history', 'feedback'].includes(activeTab) && (
                        <div className="p-4 sm:p-6 lg:p-8">
                            {/* Placeholder for tabs handled within dashboard summary initially, extending them here now */}
                            <Card
                                title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                                headerColor="border-t-gray-400"
                                tools={activeTab === 'jobs' && (
                                    <select
                                        value={jobFilter}
                                        onChange={(e) => setJobFilter(e.target.value)}
                                        className="text-xs border border-gray-300 rounded px-2 py-1 bg-white focus:outline-none cursor-pointer"
                                    >
                                        <option value="all">Active (All)</option>
                                        <option value="pending">Pending</option>
                                        <option value="accepted">Accepted</option>
                                        <option value="in_progress">In Progress</option>
                                    </select>
                                )}
                            >
                                {activeTab === 'wallet' && (
                                    <div className="text-center py-10">
                                        <h3 className="text-2xl font-bold text-emerald-600 mb-2">₹{(typeof stats.earnings === 'object' ? stats.earnings.balance : stats.earnings)?.toLocaleString() || 0}</h3>
                                        <p className="text-gray-500">Current Balance</p>
                                        <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded shadow">Withdraw Funds</button>
                                    </div>
                                )}
                                {activeTab === 'jobs' && (
                                    <div className="divide-y divide-gray-100">
                                        {filteredJobs.length === 0 ? (
                                            <div className="p-20 text-center text-gray-500">
                                                <Briefcase size={64} className="mx-auto text-gray-200 mb-4" />
                                                <h3 className="text-xl font-bold text-gray-400">No active contracts</h3>
                                                <p className="text-gray-400 text-sm mt-1">You are not assigned to any jobs matching this filter.</p>
                                            </div>
                                        ) : (
                                            filteredJobs.map(job => renderJobItem(job))
                                        )}
                                    </div>
                                )}
                                {['history', 'feedback'].includes(activeTab) && (
                                    <div className="text-center py-20 bg-gray-50 rounded border border-dashed border-gray-200">
                                        <Coffee size={48} className="mx-auto text-gray-300 mb-4" />
                                        <h3 className="text-lg font-medium text-gray-600">Module Loaded</h3>
                                        <p className="text-gray-400 text-sm">Detailed view for {activeTab} is ready for data population.</p>
                                    </div>
                                )}
                            </Card>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="bg-white border-t border-gray-200 p-4 text-xs text-gray-500 flex justify-between items-center shrink-0">
                    <div>
                        <strong>Copyright &copy; 2024 <span className="text-blue-600">Fixofy.io</span>.</strong> All rights reserved. {/* v3.2.0-rc */}
                    </div>
                    <div className="hidden sm:block">
                        <b>Version</b> 3.2.0-rc
                    </div>
                </footer>

            </div >
        </div >
    );
};

export default TechnicianDashboard;
