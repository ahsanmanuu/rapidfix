import React, { useState } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';
import useJobHistory from '../hooks/useJobHistory';
import { useAuth } from '../context/AuthContext';

const ReportIssueModal = ({ job, onClose, onSubmit }) => {
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        category: 'Job Related',
        description: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await onSubmit({
                ...formData,
                jobId: job.id,
                userId: job.userId
            });
            onClose();
        } catch (err) {
            console.error("Failed to report issue:", err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Report Issue</h3>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">Job #{job.id.slice(-6).toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-xl hover:bg-white hover:shadow-md transition-all flex items-center justify-center text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Category</label>
                            <select
                                required
                                value={formData.category}
                                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            >
                                <option>Job Related</option>
                                <option>Payment Issue</option>
                                <option>User Behavior</option>
                                <option>App Bug</option>
                                <option>Other</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Subject</label>
                            <input
                                required
                                type="text"
                                placeholder="E.g. Payment not received"
                                value={formData.subject}
                                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Description</label>
                            <textarea
                                required
                                rows="4"
                                placeholder="Describe the issue in detail..."
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 transition-all font-inter"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-3 px-6 py-3 bg-rose-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-700 shadow-lg shadow-rose-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <span className="material-symbols-outlined text-sm">report_problem</span>
                            )}
                            {submitting ? 'Submitting...' : 'Submit Report'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const JobDetailModal = ({ job, onClose, onReport }) => {
    if (!job) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight">Job Details</h3>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-0.5">#{job.id.toUpperCase()}</p>
                    </div>
                    <button onClick={onClose} className="size-10 rounded-xl hover:bg-white hover:shadow-md transition-all flex items-center justify-center text-slate-400 hover:text-slate-900 border border-transparent hover:border-slate-100">
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Customer Info</label>
                                <p className="text-sm font-bold text-slate-900">{job.contactName || 'Customer'}</p>
                                <p className="text-xs text-slate-500 font-medium">UID: {job.userId?.slice(-12)}</p>
                                <p className="text-xs text-slate-500 font-medium">{job.contactPhone}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Address</label>
                                <p className="text-xs text-slate-700 font-bold leading-relaxed">{job.address}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Service & Date</label>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`material-symbols-outlined text-sm ${job.serviceType === 'Plumbing' ? 'text-blue-500' : 'text-amber-500'}`}>
                                        {job.serviceType === 'Plumbing' ? 'plumbing' : 'bolt'}
                                    </span>
                                    <p className="text-sm font-bold text-slate-900">{job.serviceType}</p>
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                    {new Date(job.createdAt || job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{job.scheduledTime || 'N/A'}</p>
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Status</label>
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border inline-block
                                    ${job.status.toLowerCase() === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                        job.status.toLowerCase() === 'cancelled' || job.status.toLowerCase() === 'rejected' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'}`}>
                                    {job.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">Job Description & Notes</label>
                        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                            <p className="text-xs text-slate-600 leading-relaxed italic">
                                "{job.description || 'No description provided.'}"
                            </p>
                            {job.professional_note && (
                                <div className="mt-4 pt-4 border-t border-slate-200/50">
                                    <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-1">My Notes</p>
                                    <p className="text-xs text-slate-700 font-medium">{job.professional_note}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-slate-100">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Payment Breakdown</label>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>Visiting Charges</span>
                                <span className="text-slate-900">₹{job.visiting_charges || 0}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>Spare Parts Cost</span>
                                <span className="text-slate-900">₹{job.spare_parts_cost || 0}</span>
                            </div>
                            <div className="flex justify-between text-xs font-medium text-slate-500">
                                <span>Tax (GST)</span>
                                <span className="text-slate-900">₹{job.tax || 0}</span>
                            </div>
                            <div className="flex justify-between pt-3 border-t border-slate-100">
                                <span className="text-sm font-black text-slate-800 uppercase tracking-tight">Total Amount</span>
                                <span className="text-lg font-black text-blue-600">₹{parseFloat(job.totalCost || job.total_cost || 0).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <button
                        onClick={onReport}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-rose-500 hover:text-rose-700 transition-all group"
                    >
                        <span className="material-symbols-outlined text-sm group-hover:scale-110 transition-transform">report_problem</span>
                        Report Issue
                    </button>
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 hover:bg-white hover:shadow-sm border border-transparent hover:border-slate-200 transition-all font-inter"
                        >
                            Close
                        </button>
                        <button
                            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-600/20 active:scale-95 transition-all flex items-center gap-2"
                            onClick={() => window.print()}
                        >
                            <span className="material-symbols-outlined text-sm">print</span>
                            Print Receipt
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const JobHistoryLog = () => {
    const { user } = useAuth();
    const {
        jobs,
        total,
        page,
        totalPages,
        loading,
        filters,
        stats,
        setPage,
        updateFilters,
        refresh,
        reportIssue
    } = useJobHistory(1, 10);

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(null);
    const [reportingJob, setReportingJob] = useState(null);
    const [activeMenuId, setActiveMenuId] = useState(null);

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        updateFilters({ search: e.target.value });
    };

    const handleReportIssue = async (data) => {
        try {
            await reportIssue(data);
            // Optional: Show success toast/notification
            setReportingJob(null);
            setSelectedJob(null);
        } catch (err) {
            console.error("Reporting failed:", err);
        }
    };

    const handleStatusChange = (e) => {
        updateFilters({ status: e.target.value });
    };

    const handleServiceChange = (e) => {
        updateFilters({ serviceType: e.target.value });
    };

    const handleDateChange = (type, value) => {
        updateFilters({ [type]: value });
    };

    const exportToCSV = () => {
        if (!jobs.length) return;

        const headers = ["Job ID", "Customer", "UID", "Technician", "Service Type", "Date", "Time", "Status", "Payment"];
        const rows = jobs.map(j => [
            j.id,
            j.contactName || "N/A",
            j.userId?.slice(-6) || "N/A",
            user?.name || "Me",
            j.serviceType,
            new Date(j.createdAt || j.created_at).toLocaleDateString(),
            j.scheduledTime,
            j.status,
            `₹${j.totalCost || j.total_cost || 0}`
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `job_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const completedCount = stats?.completedJobs || 0;
    const cancelledCount = stats?.rejected || 0;
    const totalRevenue = stats?.earnings || 0;

    const getStatusClass = (status) => {
        const s = status.toLowerCase();
        if (['completed', 'work_done'].includes(s)) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (['cancelled', 'rejected'].includes(s)) return 'bg-rose-50 text-rose-700 border-rose-100';
        if (['refunded'].includes(s)) return 'bg-slate-100 text-slate-600 border-slate-200';
        return 'bg-blue-50 text-blue-700 border-blue-100';
    };

    const headerActions = (
        <button
            onClick={exportToCSV}
            disabled={loading || !jobs.length}
            className="px-3 sm:px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
        >
            <span className="material-symbols-outlined text-sm">download</span>
            <span className="hidden sm:inline">Export Logs</span>
        </button>
    );

    return (
        <TechnicianLayout title="Job History Log" headerActions={headerActions}>
            <div className="flex-1 overflow-y-auto overflow-x-hidden bg-slate-50/50 p-6 lg:p-8 scroll-smooth" onClick={() => setActiveMenuId(null)}>
                <div className="max-w-7xl mx-auto space-y-8">
                    {/* Stats Widgets */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10">
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white">
                            <div className="size-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                                <span className="material-symbols-outlined">verified</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Completed</p>
                                <h4 className="text-xl font-black text-slate-800">{completedCount} Jobs</h4>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br from-rose-50 to-white">
                            <div className="size-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 shrink-0">
                                <span className="material-symbols-outlined">cancel</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Cancelled</p>
                                <h4 className="text-xl font-black text-slate-800">{cancelledCount} Jobs</h4>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br from-blue-50/50 to-white">
                            <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                                <span className="material-symbols-outlined">payments</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Revenue Period</p>
                                <h4 className="text-xl font-black text-slate-800">₹{parseFloat(totalRevenue).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h4>
                            </div>
                        </div>
                    </div>

                    {/* Search & Filter Bar */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-wrap items-center gap-4" onClick={e => e.stopPropagation()}>
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                                <input
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all outline-none"
                                    placeholder="Search Customer or ID..."
                                    type="text"
                                    value={searchTerm}
                                    onChange={handleSearch}
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <div className="relative group">
                                <input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                                    className="text-[10px] font-bold border border-slate-200 rounded-lg bg-white px-2 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none hover:border-slate-300 transition-colors cursor-pointer w-32"
                                />
                                <span className="absolute -top-2 left-2 px-1 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest">From</span>
                            </div>
                            <div className="relative group">
                                <input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                                    className="text-[10px] font-bold border border-slate-200 rounded-lg bg-white px-2 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none hover:border-slate-300 transition-colors cursor-pointer w-32"
                                />
                                <span className="absolute -top-2 left-2 px-1 bg-white text-[9px] font-black text-slate-400 uppercase tracking-widest">To</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Status</span>
                                <div className="relative">
                                    <select
                                        value={filters.status}
                                        onChange={handleStatusChange}
                                        className="text-xs font-bold border border-slate-200 rounded-lg bg-white px-3 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none pr-8 appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                                    >
                                        <option>All Statuses</option>
                                        <option>Completed</option>
                                        <option>Cancelled</option>
                                        <option>Rejected</option>
                                        <option>Refunded</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Service</span>
                                <div className="relative">
                                    <select
                                        value={filters.serviceType}
                                        onChange={handleServiceChange}
                                        className="text-xs font-bold border border-slate-200 rounded-lg bg-white px-3 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none pr-8 appearance-none cursor-pointer hover:border-slate-300 transition-colors"
                                    >
                                        <option>All Services</option>
                                        <option>{user?.serviceType || 'Plumbing'}</option>
                                        <option>Electrical</option>
                                        <option>Plumbing</option>
                                    </select>
                                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">expand_more</span>
                                </div>
                            </div>
                            <button
                                onClick={() => refresh()}
                                className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors"
                            >
                                <span className={`material-symbols-outlined text-lg ${loading ? 'animate-spin' : ''}`}>refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Main Table */}
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden relative min-h-[400px]">
                        {loading && (
                            <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center z-10 transition-all">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Records...</p>
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Job ID</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Customer & UID</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Technician</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Service Type</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date & Time</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Payment</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {jobs.length > 0 ? jobs.map((job) => (
                                        <tr key={job.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-6 py-4 font-black text-blue-600 text-xs text-nowrap">#{job.id.slice(-6).toUpperCase()}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-900 text-nowrap">{job.contactName || 'Customer'}</span>
                                                    <span className="text-[10px] text-slate-400 font-medium">UID: {job.userId?.slice(-6) || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                                        <span className="material-symbols-outlined text-xs text-slate-400">person</span>
                                                    </div>
                                                    <span className="text-xs font-semibold text-slate-600 text-nowrap">{user?.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 text-nowrap">
                                                    <span className={`material-symbols-outlined text-sm ${job.serviceType === 'Plumbing' ? 'text-blue-500' : 'text-amber-500'}`}>
                                                        {job.serviceType === 'Plumbing' ? 'plumbing' : 'bolt'}
                                                    </span>
                                                    {job.serviceType}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-bold text-slate-700 text-nowrap">{new Date(job.createdAt || job.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                                    <span className="text-[10px] text-slate-400">{job.scheduledTime || 'N/A'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${getStatusClass(job.status)}`}>
                                                    {job.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-xs font-black ${job.status === 'Refunded' ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                                                        ₹{parseFloat(job.totalCost || job.total_cost || 0).toFixed(2)}
                                                    </span>
                                                    <span className="material-symbols-outlined text-sm text-slate-400">
                                                        {job.paymentMethod === 'cash' ? 'payments' : 'wallet'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMenuId(activeMenuId === job.id ? null : job.id);
                                                    }}
                                                    className={`transition-all p-2 rounded-xl border flex items-center justify-center
                                                    ${activeMenuId === job.id ? 'bg-slate-900 text-white border-slate-900' : 'text-slate-400 hover:text-slate-900 border-transparent hover:bg-slate-100'}`}
                                                >
                                                    <span className="material-symbols-outlined text-lg">more_vert</span>
                                                </button>

                                                {activeMenuId === job.id && (
                                                    <div className="absolute right-6 top-14 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <button
                                                            onClick={() => {
                                                                setSelectedJob(job);
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                                            View Details
                                                        </button>
                                                        <button
                                                            onClick={exportToCSV}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">download</span>
                                                            Download Receipt
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setReportingJob(job);
                                                                setActiveMenuId(null);
                                                            }}
                                                            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">report_problem</span>
                                                            Report Issue
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    )) : !loading && (
                                        <tr>
                                            <td colSpan="8" className="px-6 py-20 text-center">
                                                <div className="flex flex-col items-center gap-2 opacity-40">
                                                    <span className="material-symbols-outlined text-4xl">inventory_2</span>
                                                    <p className="text-sm font-bold uppercase tracking-widest">No matching records found</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-500 uppercase">
                                Showing {jobs.length > 0 ? (page - 1) * 10 + 1 : 0} to {Math.min(page * 10, total)} of {total} entries
                            </span>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                    disabled={page === 1}
                                    className="size-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                                </button>

                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i + 1}
                                        onClick={() => setPage(i + 1)}
                                        className={`size-8 flex items-center justify-center rounded font-bold text-xs shadow-sm transition-all ${page === i + 1 ? 'bg-blue-600 text-white' : 'border border-slate-200 text-slate-600 hover:bg-white'}`}
                                    >
                                        {i + 1}
                                    </button>
                                )).slice(0, 5)}

                                <button
                                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={page === totalPages}
                                    className="size-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50 transition-colors"
                                >
                                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {selectedJob && (
                <JobDetailModal
                    job={selectedJob}
                    onClose={() => setSelectedJob(null)}
                    onReport={() => setReportingJob(selectedJob)}
                />
            )}

            {reportingJob && (
                <ReportIssueModal
                    job={reportingJob}
                    onClose={() => setReportingJob(null)}
                    onSubmit={handleReportIssue}
                />
            )}
        </TechnicianLayout>
    );
};

export default JobHistoryLog;
