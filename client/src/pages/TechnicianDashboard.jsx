import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Wallet, BarChart2,
    Clock, Plus, Calendar, MapPin, User, CheckCircle2, AlertCircle, Shield,
    MoreVertical, Eye, Lock, Zap, X, Check, Phone
} from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import api, { acceptJob, rejectJob, startJob, completeJob } from '../services/api';
import { useAuth } from '../context/AuthContext';
import useTechnicianDashboard from '../hooks/useTechnicianDashboard';
import '../components/Dashboard/TechnicianDashboard.css';
import TechnicianLayout from '../components/TechnicianLayout';
import MembershipUpgradeModal from '../components/MembershipUpgradeModal';

// --- Animation Variants ---
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
};

const StatCard = ({ icon: Icon, label, value, colorClass, iconBgClass, compact }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ y: -5, transition: { duration: 0.2 } }}
        className={`bg-white border hover:border-blue-100 border-slate-200 shadow-sm rounded-xl ${compact ? 'p-3 gap-3' : 'p-4 gap-4'} flex items-center group relative transition-all border-l-4 ${colorClass}`}
    >
        <div className={`rounded-lg flex items-center justify-center ${iconBgClass} ${compact ? 'size-9' : 'size-10'} shrink-0`}>
            <Icon size={compact ? 18 : 20} strokeWidth={2.5} />
        </div>
        <div className="relative z-10 min-w-0">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter mb-0.5 truncate">{label}</p>
            <h3 className={`${compact ? 'text-lg' : 'text-xl'} font-black leading-none text-slate-800 tracking-tight truncate`}>{value}</h3>
        </div>
    </motion.div>
);



const OtpVerificationModal = ({ isOpen, onClose, onVerify, loading }) => {
    const [otp, setOtp] = useState(['', '', '', '']);
    const inputs = useMemo(() => Array(4).fill(0), []);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return;
        const newOtp = [...otp];
        newOtp[index] = value.slice(-1);
        setOtp(newOtp);

        if (value && index < 3) {
            const nextInput = document.getElementById(`otp-${index + 1}`);
            if (nextInput) nextInput.focus();
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevInput = document.getElementById(`otp-${index - 1}`);
            if (prevInput) prevInput.focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const otpString = otp.join('');
        if (otpString.length === 4) {
            onVerify(otpString);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200"
                    >
                        <div className="p-1 px-2 flex justify-end">
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-6 pt-2 text-center space-y-4">
                            <div className="size-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                                <Shield size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Verify Completion</h3>
                            <p className="text-sm text-slate-500 font-medium px-4">
                                Enter the 4-digit code provided by the customer to finalize this job.
                            </p>

                            <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                                <div className="flex justify-center gap-3">
                                    {inputs.map((_, i) => (
                                        <input
                                            key={i}
                                            id={`otp-${i}`}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength="1"
                                            value={otp[i]}
                                            onChange={(e) => handleChange(i, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(i, e)}
                                            className="w-12 h-14 text-center text-2xl font-black border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-800"
                                            autoFocus={i === 0}
                                            required
                                        />
                                    ))}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={loading || otp.join('').length !== 4}
                                        className="w-full py-3.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 uppercase tracking-widest disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {loading ? 'Verifying...' : 'Complete Job'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const JobDetailsModal = ({ isOpen, onClose, job }) => {
    if (!job) return null;

    const dateSource = job.createdAt || job.created_at;
    const formattedDate = dateSource ? new Date(dateSource).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200"
                    >
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <span className="size-2 bg-blue-600 rounded-full"></span>
                                Job Details
                            </h3>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 transition-colors bg-white rounded-full shadow-sm border border-slate-100">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
                            {/* Service Header */}
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-black px-2 py-0.5 rounded bg-blue-50 text-blue-600 uppercase mb-2 inline-block">
                                        {job.status?.replace('_', ' ') || 'Job ID: ' + job.id.slice(0, 8)}
                                    </span>
                                    <h4 className="text-2xl font-black text-slate-800 leading-tight">{job.serviceType || job.service_type || "Service Request"}</h4>
                                    <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">Assigned: {formattedDate}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-blue-600">₹{job.totalCost ?? job.total_cost ?? job.offerPrice ?? job.offer_price ?? job.visitingCharges ?? job.visiting_charges ?? '0'}</p>
                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Est. Revenue</p>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <User size={12} className="text-blue-500" /> Customer Information
                                    </h5>
                                    <div>
                                        <p className="text-sm font-black text-slate-800">{job.contactName || job.customer?.name || "Customer"}</p>
                                        <a href={`tel:${job.customerMobile || job.contactPhone || job.customer?.phone}`} className="text-blue-600 text-xs font-bold hover:underline flex items-center gap-1.5 mt-1">
                                            <Phone size={14} />
                                            {job.customerMobile || job.contactPhone || job.customer?.phone || "No phone provided"}
                                        </a>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3">
                                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                        <MapPin size={12} className="text-emerald-500" /> Work Location
                                    </h5>
                                    <p className="text-xs font-medium text-slate-700 leading-relaxed italic">
                                        {job.address || "No address details available."}
                                    </p>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <ClipboardList size={12} className="text-orange-500" /> Job Description
                                </h5>
                                <div className="p-4 bg-white border border-slate-100 rounded-xl text-xs font-medium text-slate-600 leading-relaxed">
                                    {job.description || "No specific instructions provided by the customer."}
                                </div>
                            </div>

                            {/* Action Summary */}
                            <div className="pt-2">
                                <div className="flex items-center gap-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-[10px] font-bold text-blue-700 uppercase tracking-tight">
                                    <AlertCircle size={14} className="shrink-0" />
                                    Remember to follow all safety protocols and verify the job completion with the customer code.
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black hover:bg-slate-50 transition-colors uppercase tracking-widest shadow-sm"
                            >
                                Close
                            </button>
                            <button
                                onClick={() => {
                                    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.address)}`, '_blank');
                                }}
                                className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-xl text-xs font-black hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 uppercase tracking-widest"
                            >
                                Get Directions
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

const TechnicianDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Use Real-time Hook
    const { stats, activeJobs, activityFeed, earningsData: realEarningsData, loading } = useTechnicianDashboard();
    const [activeMenu, setActiveMenu] = useState(null);
    const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);

    // OTP Modal State
    const [otpModalOpen, setOtpModalOpen] = useState(false);
    const [otpJobId, setOtpJobId] = useState(null);
    const [otpLoading, setOtpLoading] = useState(false);

    // Job Details Modal State
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedJob, setSelectedJob] = useState(null);

    // Fallback graph data if empty
    const earningsData = realEarningsData.length > 0 ? realEarningsData : [
        { name: 'Mon', value: 0 },
        { name: 'Tue', value: 0 },
        { name: 'Wed', value: 0 },
        { name: 'Thu', value: 0 },
        { name: 'Fri', value: 0 },
        { name: 'Sat', value: 0 },
        { name: 'Sun', value: 0 },
    ];

    const handleAcceptJob = async (jobId) => {
        try {
            await acceptJob(jobId, user.id);
            // Realtime subscription will update list automatically
        } catch (err) {
            console.error("Failed to accept job", err);
            alert("Failed to accept job: " + (err.response?.data?.message || err.message));
        }
    };

    const handleRejectJob = async (jobId) => {
        if (!window.confirm("Are you sure you want to reject this job?")) return;
        try {
            await rejectJob(jobId, "Technician rejected manually");
        } catch (err) {
            console.error("Failed to reject job", err);
        }
    };

    const handleStartJob = async (jobId) => {
        try {
            await startJob(jobId);
            setActiveMenu(null);
        } catch (err) {
            console.error("Failed to start job", err);
            alert("Error: " + (err.response?.data?.error || err.message));
        }
    };

    const handleCompleteJobAction = async (jobId) => {
        setOtpJobId(jobId);
        setOtpModalOpen(true);
        setActiveMenu(null);
    };

    const handleViewJobDetails = (job) => {
        setSelectedJob(job);
        setDetailsModalOpen(true);
        setActiveMenu(null);
    };

    const handleVerifyOtp = async (otp) => {
        setOtpLoading(true);
        try {
            await completeJob(otpJobId, otp);
            setOtpModalOpen(false);
            setOtpJobId(null);
            // Realtime update will handle UI refresh
        } catch (err) {
            console.error("Failed to complete job", err);
            alert("Error: " + (err.response?.data?.error || err.response?.data?.message || err.message));
        } finally {
            setOtpLoading(false);
        }
    };

    return (
        <TechnicianLayout title="Dashboard">
            <div className="h-full">
                <motion.div
                    className="max-w-7xl mx-auto space-y-6 lg:space-y-8"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                >
                    {/* --- Active Jobs --- */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between px-1">
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <span className="size-2 bg-blue-600 rounded-full"></span>
                                Active Jobs
                            </h2>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{activeJobs.length} assignments</span>
                        </div>

                        {activeJobs.length === 0 ? (
                            <div className="text-center p-8 bg-white rounded-xl border border-dashed border-slate-300">
                                <p className="text-sm font-bold text-slate-500">No active jobs right now.</p>
                                <p className="text-xs text-slate-400 mt-1">Status: {user?.status}. Wait for new requests.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {activeJobs.slice(0, 4).map((job) => {
                                    const isNew = job.status === 'pending';
                                    const dateSource = job.createdAt || job.created_at;
                                    const formattedDate = dateSource ? new Date(dateSource).toLocaleDateString() : 'N/A';
                                    const formattedTime = dateSource ? new Date(dateSource).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A';

                                    return (
                                        <div key={job.id} className={`bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col gap-4 hover:shadow-md transition-all ${isNew ? 'ring-2 ring-blue-500/10' : ''}`}>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap justify-between items-start mb-4 gap-4">
                                                    <div className="flex flex-col min-w-0">
                                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded w-fit mb-1.5 whitespace-nowrap uppercase ${isNew ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                                            {isNew ? 'NEW REQUEST' : (job.status || '').replace('_', ' ')}
                                                        </span>
                                                        <h3 className="text-lg font-bold text-slate-800 leading-tight break-words" title={job.description || job.serviceType || job.service_type}>
                                                            {job.serviceType || job.service_type || "Service Request"}
                                                        </h3>
                                                    </div>
                                                    <div className="text-right shrink-0 ml-auto">
                                                        <p className="text-base font-black text-slate-900">
                                                            {(typeof job.totalCost === 'number' || typeof job.visitingCharges === 'number' || job.offerPrice || job.total_cost || job.visiting_charges)
                                                                ? `₹${job.totalCost ?? job.total_cost ?? job.offerPrice ?? job.offer_price ?? job.visitingCharges ?? job.visiting_charges ?? '0'}`
                                                                : "Est. ₹500+"}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase">Estimated</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                                                        <MapPin size={16} className="shrink-0 text-slate-400 mt-0.5" />
                                                        <span className="font-medium leading-tight break-words">{job.address || "Location pending..."}</span>
                                                    </div>
                                                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                                                        <Phone size={16} className="shrink-0 text-slate-400 mt-0.5" />
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-slate-700">{job.contactName || job.customer?.name || "Customer"}</span>
                                                            <span className="font-medium leading-tight break-words">{job.customerMobile || job.contactPhone || job.customer?.phone || "No mobile provided"}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-start gap-2.5 text-xs text-slate-600">
                                                        <Clock size={16} className="shrink-0 text-slate-400 mt-0.5" />
                                                        <span className="font-medium leading-tight break-words">Created: {formattedDate}, {formattedTime}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-50">
                                                {isNew ? (
                                                    <div className="flex flex-wrap items-center gap-3 w-full">
                                                        <button onClick={() => handleAcceptJob(job.id)} className="flex-1 min-w-[120px] px-2 py-2.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 whitespace-nowrap">Accept Request</button>
                                                        <button onClick={() => handleRejectJob(job.id)} className="flex-1 min-w-[120px] px-2 py-2.5 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors whitespace-nowrap">Reject</button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-between w-full">
                                                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase">
                                                            <span className="relative flex size-2">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full size-2 bg-emerald-500"></span>
                                                            </span>
                                                            {job.status.replace('_', ' ')}
                                                        </div>

                                                        <div className="flex items-center gap-2 relative">
                                                            <button
                                                                onClick={() => navigate('/technician/chat')}
                                                                className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-lg transition-colors"
                                                            >
                                                                Chat
                                                            </button>

                                                            <div className="relative">
                                                                <button
                                                                    onClick={() => setActiveMenu(activeMenu === job.id ? null : job.id)}
                                                                    className="p-1.5 hover:bg-slate-100 rounded-full transition-colors text-slate-400"
                                                                >
                                                                    <MoreVertical size={18} />
                                                                </button>

                                                                <AnimatePresence>
                                                                    {activeMenu === job.id && (
                                                                        <motion.div
                                                                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                            animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                                                            className="absolute right-0 bottom-full mb-2 w-48 bg-white border border-slate-200 shadow-xl rounded-xl py-2 z-50 overflow-hidden"
                                                                        >
                                                                            {job.status === 'accepted' && (
                                                                                <button
                                                                                    onClick={() => handleStartJob(job.id)}
                                                                                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"
                                                                                >
                                                                                    <Zap size={14} />
                                                                                    Start Job/Work
                                                                                </button>
                                                                            )}
                                                                            {job.status === 'in_progress' && (
                                                                                <button
                                                                                    onClick={() => handleCompleteJobAction(job.id)}
                                                                                    className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-600 flex items-center gap-2 transition-colors"
                                                                                >
                                                                                    <CheckCircle2 size={14} />
                                                                                    Complete Job
                                                                                </button>
                                                                            )}
                                                                            <button
                                                                                onClick={() => handleViewJobDetails(job)}
                                                                                className="w-full px-4 py-2.5 text-left text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                                                            >
                                                                                <Eye size={14} />
                                                                                View Details
                                                                            </button>
                                                                        </motion.div>
                                                                    )}
                                                                </AnimatePresence>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* --- Stat Cards --- */}
                    <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6" variants={itemVariants}>
                        <StatCard icon={Wallet} label="Total Earnings" value={`₹${(stats.earnings || 0).toLocaleString()}`} colorClass="border-l-blue-600" iconBgClass="bg-blue-50 text-blue-600" compact />
                        <StatCard icon={BarChart2} label="Monthly Revenue" value={`₹${(stats.monthlyRevenue || 0).toLocaleString()}`} colorClass="border-l-emerald-500" iconBgClass="bg-emerald-50 text-emerald-500" compact />
                        <StatCard icon={CheckCircle2} label="Jobs Completed" value={stats.completedJobs || 0} colorClass="border-l-blue-600" iconBgClass="bg-blue-50 text-blue-600" compact />
                        <StatCard icon={Check} label="Accepted Jobs" value={stats.accepted || 0} colorClass="border-l-teal-500" iconBgClass="bg-teal-50 text-teal-600" compact />
                        <StatCard icon={Clock} label="Pending Jobs" value={stats.pending || 0} colorClass="border-l-orange-500" iconBgClass="bg-orange-50 text-orange-600" compact />
                        <StatCard icon={X} label="Rejected Jobs" value={stats.rejected || 0} colorClass="border-l-rose-500" iconBgClass="bg-rose-50 text-rose-600" compact />
                        <StatCard icon={User} label="Users Served" value={stats.usersServed || 0} colorClass="border-l-cyan-500" iconBgClass="bg-cyan-50 text-cyan-600" compact />
                        <StatCard icon={AlertCircle} label="Complaints" value={stats.complaints || 0} colorClass="border-l-red-600" iconBgClass="bg-red-50 text-red-600" compact />
                        <StatCard icon={Zap} label="Customer Rating" value={`${stats.rating || 0}/5`} colorClass="border-l-amber-400" iconBgClass="bg-amber-50 text-amber-500" compact />
                    </motion.div>

                    {/* --- Bottom Section --- */}
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Area Chart */}
                        <motion.div variants={itemVariants} className="xl:col-span-8 flex flex-col bg-white border border-slate-200 shadow-sm rounded-xl p-6 min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-base font-bold text-slate-800">Earnings Dynamics</h3>
                                    <p className="text-xs text-slate-500 mt-0.5">Weekly performance visualization</p>
                                </div>
                                <select className="text-xs font-bold border-slate-200 rounded-lg bg-slate-50 px-2 py-1 focus:ring-blue-500 focus:outline-none">
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                </select>
                            </div>
                            <div className="flex-1 w-full min-h-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={earningsData}>
                                        <defs>
                                            <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                                <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }} tickFormatter={(val) => `₹${val}`} />
                                        <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                        <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorEarnings)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </motion.div>

                        <div className="xl:col-span-4 flex flex-col gap-6">
                            {/* Membership Card */}
                            <motion.div variants={itemVariants} className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl text-white relative shadow-sm">
                                <div className="absolute inset-0 overflow-hidden rounded-xl">
                                    <div className="absolute -right-4 -top-4 size-32 bg-white/5 rounded-full blur-2xl pointer-events-none"></div>
                                </div>
                                <div className="relative z-10 p-8">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <p className="text-[10px] font-black uppercase text-slate-400 pl-10 mb-1">Membership Status</p>
                                            <h4 className="text-2xl font-black">{user?.membership || 'Free Plan'}</h4>
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
                                        <div className="w-full bg-white/10 h-1.5 rounded-full">
                                            <div className="bg-blue-600 h-full w-[100%]"></div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setUpgradeModalOpen(true)}
                                        className="mt-6 w-full py-2 bg-white text-slate-900 rounded-lg text-xs font-black hover:bg-slate-100 transition-colors uppercase tracking-wider"
                                    >
                                        Upgrade to Pro
                                    </button>
                                </div>
                            </motion.div>

                            {/* Live Activity Feed */}
                            <motion.div variants={itemVariants} className="bg-white border border-slate-200 shadow-sm rounded-xl flex flex-col h-[300px]">
                                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Live Activity Feed</h3>
                                    <div className="size-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-4 hide-scrollbar">
                                    {activityFeed.length === 0 ? (
                                        <p className="text-xs text-slate-400 text-center mt-4">No recent activity.</p>
                                    ) : (
                                        activityFeed.map((log) => (
                                            <div key={log.id} className="flex gap-3">
                                                <div className={`size-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-50 text-blue-600`}>
                                                    <Clock size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-slate-800">{log.title}</p>
                                                    <p className="text-[10px] text-slate-500 mt-0.5">{log.message}</p>
                                                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">
                                                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
            <MembershipUpgradeModal
                isOpen={upgradeModalOpen}
                onClose={() => setUpgradeModalOpen(false)}
                user={user}
                onSuccess={(updatedTech) => {
                    // The socket update in useTechnicianLayout/useAuth should handle global state,
                    // but we can also manually trigger a toast or localized update if needed.
                    console.log("Upgrade Success:", updatedTech);
                }}
            />
            <OtpVerificationModal
                isOpen={otpModalOpen}
                loading={otpLoading}
                onClose={() => {
                    setOtpModalOpen(false);
                    setOtpJobId(null);
                }}
                onVerify={handleVerifyOtp}
            />
            <JobDetailsModal
                isOpen={detailsModalOpen}
                job={selectedJob}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedJob(null);
                }}
            />
        </TechnicianLayout >
    );
};

export default TechnicianDashboard;
