import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, Wallet, History, Settings, MessageSquare,
    LogOut, Bell, Search, MapPin, Clock, Calendar,
    CheckCircle2, XCircle, AlertCircle, TrendingUp, Star,
    Power, Coffee, Briefcase, Zap, ChevronRight, Menu, X,
    MoreHorizontal, MoreVertical, User, ChevronDown, Filter, RefreshCw, Send, Image as ImageIcon, Lock, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import Navbar from '../components/Navbar'; // Use main Navbar if preferred, or custom sidebar
import { useAuth } from '../context/AuthContext';
import useSupabaseRealtime from '../hooks/useSupabaseRealtime';

import GoogleMapReact from 'google-map-react';
import LiveRideModal from '../components/Dashboard/LiveRideModal';

// --- AdminLTE Style Components ---

const SmallBox = ({ title, value, icon: Icon, color, footerText = "More info", onClick }) => (
    <div className={`relative rounded-lg overflow-hidden shadow-sm text-white ${color} mb-2`}>
        <div className="p-2 relative z-10">
            <h3 className="text-lg lg:text-3xl font-bold mb-0.5">{value}</h3>
            <p className="text-[9px] sm:text-xs font-medium opacity-90 uppercase tracking-wide leading-none">{title}</p>
        </div>
        <div className="absolute right-1 top-2 opacity-20 hover:scale-110 transition-transform duration-300">
            <Icon size={32} />
        </div>
        <button onClick={onClick} className="w-full bg-black/10 hover:bg-black/20 text-center py-0.5 text-[9px] font-medium flex items-center justify-center gap-1 transition-colors relative z-20 cursor-pointer">
            {footerText} <ChevronRight size={10} />
        </button>
    </div>
);

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
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

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
        earnings: 0,
        completedJobs: 0,
        pendingJobs: 0,
        rejectedJobs: 0,
        rating: 0,
        totalReviews: 0
    });
    const [feedbacks, setFeedbacks] = useState([]);
    const [myJobs, setMyJobs] = useState([]);
    const [statusLoading, setStatusLoading] = useState(false);
    const [offers, setOffers] = useState([]);

    // Time & Location
    const [currentTime, setCurrentTime] = useState(new Date());
    const [currentLocationName, setCurrentLocationName] = useState("Locating...");

    // Chat State
    const [chatOpen, setChatOpen] = useState(false);
    const [chatMessages, setChatMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [activeChatUser, setActiveChatUser] = useState(null); // { id, name }
    const chatEndRef = useRef(null);

    // Profile Settings State
    const [profileForm, setProfileForm] = useState({ password: '', photo: null });
    const [profileLoading, setProfileLoading] = useState(false);

    // [New] Job Management State
    const [jobFilter, setJobFilter] = useState('all');
    const [openMenuJobId, setOpenMenuJobId] = useState(null);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedJobId, setSelectedJobId] = useState(null);

    const [rejectReason, setRejectReason] = useState("");
    const [viewJob, setViewJob] = useState(null); // For View Details Modal

    // Live Ride State
    const [rideModalOpen, setRideModalOpen] = useState(false);
    const [activeRideJob, setActiveRideJob] = useState(null);

    // Live Data Fetching
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const handleJobAction = async (jobId, action, extraData = {}) => {
        try {
            let status = '';
            let apiData = {};
            switch (action) {
                case 'accept': status = 'accepted'; break;
                case 'reject': status = 'rejected'; apiData = { reason: extraData.reason }; break;
                case 'start': status = 'in_progress'; break;
                case 'complete': status = 'completed'; break;
                default: return;
            }

            const res = await api.put(`/jobs/${jobId}/status`, { status, details: apiData });

            if (res.data.success) {
                setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, status, ...apiData } : j));
                if (action === 'reject') {
                    setRejectModalOpen(false);
                    setRejectReason("");
                }
                alert(`Job ${status} successfully!`);
                fetchAllData();
            }
        } catch (error) {
            console.error("Job Action Error", error);
            alert("Failed to update job status");
        }
    };

    const handleStartRide = async (job) => {
        try {
            // Auto-accept if pending
            if (job.status === 'pending') {
                await handleJobAction(job.id, 'accept');
                // Note: handleJobAction updates state and shows alert, 
                // but we continue immediately for ride start.
            }

            // Get current location
            navigator.geolocation.getCurrentPosition(async (pos) => {
                const startLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };

                const res = await api.post('/rides/start', {
                    technicianId: user.id,
                    jobId: job.id,
                    startLocation
                });

                if (res.data.success) {
                    setActiveRideJob({ ...job, activeRideId: res.data.ride.id });
                    setRideModalOpen(true);
                }
            }, (err) => {
                alert("Please enable location to start riding.");
            });
        } catch (error) {
            console.error("Start Ride Error", error);
            alert("Failed to start ride session");
        }
    };

    const filteredJobs = myJobs.filter(job => {
        if (jobFilter === 'all') return ['accepted', 'in_progress', 'pending'].includes(job.status);
        return job.status === jobFilter;
    });

    // ... existing useEffects ...





    const handleViewJobDetails = async (jobId) => {
        try {
            const res = await api.get(`/jobs/${jobId}`);
            if (res.data.success) {
                setViewJob(res.data.job);
            }
        } catch (error) {
            console.error("Error fetching job details", error);
            alert("Could not fetch latest job details.");
        }
    };

    useEffect(() => {
        if (!user) return;

        // Reverse Geocoding
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const apiKey = "AIzaSyBN-6NUc8fWY4FsOLvOXj7gvX4pWYVDRUU"; // Warning: Exposing API key in client
                    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${pos.coords.latitude},${pos.coords.longitude}&key=${apiKey}`);
                    const data = await res.json();
                    if (data.results?.[0]) {
                        const locality = data.results[0].address_components.find(c => c.types.includes('locality'))?.long_name;
                        const area = data.results[0].address_components.find(c => c.types.includes('sublocality'))?.long_name;
                        setCurrentLocationName(area ? `${area}, ${locality}` : locality || "Unknown Location");
                    }
                } catch (e) { console.error("Geo error", e); setCurrentLocationName("Location Unavailable"); }
            });
        }

        if (socket) {
            socket.on('new_job_assigned', (job) => {
                // Toast notification here ideally
                fetchAllData();
            });
            socket.on('job_status_updated', () => fetchAllData());
            socket.on('feedback_received', () => {
                // Toast logic here if needed
                fetchAllData();
            });
            socket.on('receive_message', (msg) => {
                if (msg.receiverId === user.id) {
                    // Update chat if open, or show notification
                    if (activeChatUser?.id === msg.senderId) {
                        setChatMessages(prev => [...prev, msg]);
                    }
                }
            });
        }

        fetchAllData();

        return () => {
            if (socket) {
                socket.off('new_job_assigned');
                socket.off('job_status_updated');
                socket.off('feedback_received');
                socket.off('receive_message');
            }
        };
    }, [user, socket, activeChatUser]);

    // [NEW] Supabase Realtime for Technician Jobs
    useSupabaseRealtime('jobs', (payload) => {
        // Refresh data on ANY job change relevant to this technician
        // We could filter strictly by technicianId if Supabase policies allows
        // For simplicity, we just fetch all data again to be safe
        fetchAllData();
    });

    useEffect(() => {
        // Auto scroll chat
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, chatOpen]);

    const fetchAllData = async () => {
        if (!user) return;
        try {
            const [walletRes, jobsRes, feedbackRes, offersRes, monthlyStatsRes] = await Promise.all([
                api.get(`/finance/wallet/${user.id}`),
                api.get(`/jobs/technician/${user.id}`),
                api.get(`/feedback/technician/${user.id}`),
                api.get(`/offers`),
                api.get(`/technicians/${user.id}/stats/monthly`)
            ]);

            const jobs = jobsRes.data.jobs || [];
            const completed = jobs.filter(j => j.status === 'completed').length;
            const pending = jobs.filter(j => ['accepted', 'in_progress', 'pending'].includes(j.status)).length;
            const rejected = jobs.filter(j => j.status === 'rejected').length; // Assuming we add rejected logic later

            const feed = feedbackRes.data.feedbacks || [];
            let avgRating = 0;
            if (feed.length > 0) {
                const total = feed.reduce((sum, f) => {
                    const cats = Object.values(f.ratings || {});
                    return sum + (cats.length ? cats.reduce((a, b) => a + b, 0) / cats.length : 0);
                }, 0);
                avgRating = (total / feed.length).toFixed(1);
            }

            setStats({
                earnings: walletRes.data.balance || 0,
                completedJobs: completed,
                pendingJobs: pending,
                rejectedJobs: rejected,
                rating: avgRating,
                totalReviews: feed.length,
                monthlyEarnings: monthlyStatsRes?.data?.earnings || 0,
                monthlyJobs: monthlyStatsRes?.data?.jobs || 0
            });

            setMyJobs(jobs);
            setFeedbacks(feed);
            setOffers(offersRes.data.offers || []);

        } catch (error) {
            console.error("Dashboard Data Fetch Error", error);
        }
    };

    const handleStatusUpdate = async (newStatus) => {
        setStatusLoading(true);
        try {
            const res = await api.put(`/technicians/${user.id}/status`, {
                status: newStatus,
                location: user.location
            });
            if (res.data.success) {
                updateUser({ status: newStatus });
            }
        } catch (error) {
            console.error("Status update failed", error);
            alert("Failed to update status");
        } finally {
            setStatusLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !activeChatUser) return;
        try {
            const res = await api.post('/chat/send', {
                senderId: user.id,
                receiverId: activeChatUser.id,
                message: newMessage,
                senderName: user.name
            });
            if (res.data.success) {
                setChatMessages([...chatMessages, res.data.chat]);
                setNewMessage("");
            }
        } catch (error) {
            console.error("Failed to send message", error);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileLoading(true);
        try {
            const changes = {};
            if (profileForm.password) changes.password = profileForm.password;

            const res = await api.put(`/technicians/${user.id}/profile`, changes);
            if (res.data.success) {
                alert("Profile Updated Successfully!");
                updateUser(res.data.technician);
            }
        } catch (error) {
            console.error("Profile update failed", error);
            alert("Failed to update profile");
        } finally {
            setProfileLoading(false);
        }
    };

    const handleLocationUpdate = () => {
        if (!navigator.geolocation) return;
        setProfileLoading(true);
        navigator.geolocation.getCurrentPosition(async (pos) => {
            try {
                let addressText = "Detected Location";
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
                    const data = await response.json();
                    if (data?.display_name) addressText = data.display_name;
                } catch (e) { }

                const updateData = {
                    location: {
                        latitude: pos.coords.latitude,
                        longitude: pos.coords.longitude,
                        address: addressText
                    }
                };

                const res = await api.put(`/technicians/${user.id}/profile`, updateData);
                if (res.data.success) {
                    alert("Base Location Updated Successfully!");
                    updateUser(res.data.technician);
                }
            } catch (e) {
                console.error("Loc update failed", e);
                alert("Failed to update location");
            } finally {
                setProfileLoading(false);
            }
        });
    };

    const renderJobItem = (job) => (
        <div key={job.id} className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between hover:bg-gray-50 transition-colors gap-4">
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

                {/* Primary Action Button */}
                {['accepted', 'pending'].includes(job.status) && (
                    <button
                        onClick={() => handleStartRide(job)}
                        className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded shadow-sm hover:bg-blue-700 flex items-center gap-1 animate-pulse"
                    >
                        <MapPin size={12} /> Start Riding
                    </button>
                )}

                {/* Action Buttons via Popup Menu */}
                <div className="relative">
                    <button
                        onClick={() => setOpenMenuJobId(openMenuJobId === job.id ? null : job.id)}
                        className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors border border-gray-200"
                    >
                        <MoreVertical size={16} />
                    </button>

                    {openMenuJobId === job.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-50 py-1">
                            {job.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => { handleJobAction(job.id, 'accept'); setOpenMenuJobId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-emerald-600 hover:bg-emerald-50"
                                    >
                                        Accept Job
                                    </button>
                                    <button
                                        onClick={() => { handleStartRide(job); setOpenMenuJobId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                        <MapPin size={12} /> Start Riding
                                    </button>
                                    <button
                                        onClick={() => { setSelectedJobId(job.id); setRejectModalOpen(true); setOpenMenuJobId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50"
                                    >
                                        Reject Job
                                    </button>
                                </>
                            )}
                            {job.status === 'accepted' && (
                                <>
                                    <button
                                        onClick={() => { handleStartRide(job); setOpenMenuJobId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                        <MapPin size={12} /> Start Riding
                                    </button>
                                    <button
                                        onClick={() => { handleJobAction(job.id, 'start'); setOpenMenuJobId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                    >
                                        <Zap size={12} /> Start Work (Arrived)
                                    </button>
                                    <button
                                        onClick={() => { setSelectedJobId(job.id); setRejectModalOpen(true); setOpenMenuJobId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border-t border-gray-50 mt-1"
                                    >
                                        Abort / Reject Job
                                    </button>
                                </>
                            )}
                            {job.status === 'in_progress' && (
                                <>
                                    <button
                                        onClick={() => { handleJobAction(job.id, 'complete'); setOpenMenuJobId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-2"
                                    >
                                        <CheckCircle2 size={12} /> Job Delivered
                                    </button>
                                    <button
                                        onClick={() => { setSelectedJobId(job.id); setRejectModalOpen(true); setOpenMenuJobId(null); }}
                                        className="w-full text-left px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 border-t border-gray-50 mt-1"
                                    >
                                        Cancel Job
                                    </button>
                                </>
                            )}
                            <button
                                onClick={() => { handleViewJobDetails(job.id); setOpenMenuJobId(null); }}
                                className="w-full text-left px-4 py-2 text-xs text-gray-500 hover:bg-gray-50 border-t border-gray-100 mt-1"
                            >
                                View Details
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    const renderDashboardContent = () => (
        <div className="px-10 py-8">
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
                                <div className="space-y-4">
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
                            </div>

                            {viewJob.location && viewJob.location.latitude && (
                                <div className="mt-6">
                                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                                        <MapPin size={16} /> Location
                                    </h4>
                                    <div className="w-full h-48 bg-gray-200 rounded-lg overflow-hidden relative">
                                        {/* Simple Static Map Image or Link */}
                                        <img
                                            src={`https://maps.googleapis.com/maps/api/staticmap?center=${viewJob.location.latitude},${viewJob.location.longitude}&zoom=15&size=600x300&markers=color:red%7C${viewJob.location.latitude},${viewJob.location.longitude}&key=AIzaSyBN-6NUc8fWY4FsOLvOXj7gvX4pWYVDRUU`}
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

            {/* Live Ride Modal */}
            {rideModalOpen && activeRideJob && (
                <LiveRideModal
                    job={activeRideJob}
                    technicianId={user.id}
                    userId={activeRideJob.userId}
                    socket={socket}
                    onClose={() => setRideModalOpen(false)}
                />
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
                <SmallBox
                    title="Total Balance"
                    value={`₹${(typeof stats.earnings === 'object' ? stats.earnings.balance : stats.earnings)?.toLocaleString() || 0}`}
                    icon={Wallet}
                    color="bg-emerald-600"
                    onClick={() => setActiveTab('wallet')}
                />
                {/* NEW: Monthly Earnings */}
                <SmallBox
                    title="This Month's Earnings"
                    value={`₹${(typeof stats.monthlyEarnings === 'object' ? stats.monthlyEarnings.amount : stats.monthlyEarnings)?.toLocaleString() || 0}`}
                    icon={TrendingUp} // Fixed Icon variable usage if needed, assuming TrendingUp is imported
                    color="bg-emerald-500"
                    footerText="Since 1st of Month"
                    onClick={() => setActiveTab('wallet')}
                />

                <SmallBox
                    title="Total Jobs"
                    value={stats.completedJobs}
                    icon={CheckCircle2}
                    color="bg-blue-600"
                    onClick={() => setActiveTab('history')}
                />
                {/* NEW: Monthly Jobs */}
                <SmallBox
                    title="Jobs This Month"
                    value={stats.monthlyJobs || 0}
                    icon={Calendar}
                    color="bg-blue-500"
                    footerText="Completed this month"
                    onClick={() => setActiveTab('history')}
                />

                <SmallBox
                    title="Pending Tasks"
                    value={stats.pendingJobs}
                    icon={Clock}
                    color="bg-amber-500"
                    onClick={() => setActiveTab('jobs')}
                />
                <SmallBox
                    title="My Rating"
                    value={stats.rating}
                    icon={Star}
                    color="bg-rose-500"
                    onClick={() => setActiveTab('feedback')}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* Main Job List & Offers */}
                <div className="lg:col-span-2 space-y-16">
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
        </div>
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
                                    <span className="absolute -top-1.5 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-sm shadow-sm">3</span>
                                </div>
                            </div>

                            <div className="h-6 w-px bg-gray-200 mx-1 sm:mx-2"></div>

                            {/* Time & Location: Removed 'hidden sm:block' to show on mobile, adjusted layout */}
                            <div className="text-right flex flex-col items-end">
                                <div className="text-[10px] sm:text-xs font-bold text-gray-700 flex items-center justify-end gap-1">
                                    <Clock size={10} className="text-gray-400" />
                                    <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="text-[9px] sm:text-[10px] text-gray-500 flex items-center justify-end gap-1 max-w-[100px] truncate">
                                    <MapPin size={10} /> {currentLocationName}
                                </div>
                                {/* Network Indicator in Navbar */}
                                <div className="text-[9px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div> Network
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
                        <div className="px-10 py-8">
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
                        <strong>Copyright &copy; 2024 <span className="text-blue-600">Fixofy.io</span>.</strong> All rights reserved.
                    </div>
                    <div className="hidden sm:block">
                        <b>Version</b> 3.2.0-rc
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default TechnicianDashboard;
