import React from 'react';

const JobDrawer = ({ job, onClose, onEdit }) => {
    if (!job) return null;

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase();
        if (s === 'completed') return 'bg-emerald-500 text-white';
        if (['in-progress', 'accepted', 'assigned'].includes(s)) return 'bg-amber-500 text-white';
        if (s === 'rejected' || s === 'cancelled') return 'bg-rose-500 text-white';
        return 'bg-primary text-white';
    };

    return (
        <div className={`fixed right-4 md:right-8 top-1/2 -translate-y-1/2 h-[60vh] w-[90%] md:w-96 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 z-50 transform transition-transform duration-300 ease-out flex flex-col overflow-hidden ${job ? 'translate-x-0' : 'translate-x-[200%]'}`}>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                    <h2 className="text-lg font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">Job Details</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit && onEdit(job)}
                            className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/20 transition-all hover:scale-110 active:scale-95 shadow-sm"
                            title="Edit Job"
                        >
                            <span className="material-symbols-outlined text-xl font-bold">edit</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:border-red-200 dark:hover:border-red-500/20 transition-all hover:scale-110 active:scale-95 shadow-sm"
                            aria-label="Close drawer"
                        >
                            <span className="material-symbols-outlined text-xl font-bold">close</span>
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar">
                    <div className="flex flex-col gap-8">
                        {/* Summary Card */}
                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -mr-10 -mt-10 blur-xl"></div>

                            <div className="flex flex-col gap-4 relative z-10">
                                <div className="flex items-center justify-between">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyles(job.status)}`}>
                                        {job.status}
                                    </div>
                                    <span className="text-sm font-black text-slate-400">#{job.id?.substring(0, 8)}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{job.serviceType}</h3>
                                <div className="h-px bg-slate-200 dark:bg-slate-700 w-full" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Created On</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Amount Paid</span>
                                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{job.offerPrice || job.visitingCharges || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        {/* Customer Info */}
                        <div className="flex flex-col gap-3">
                            <h4 className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Customer Insight</h4>
                            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-blue-300 transition-colors group">
                                <div className="size-12 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg shadow-inner">
                                    {job.contactName?.charAt(0) || 'G'}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{job.contactName || 'Guest User'}</span>
                                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{job.contactPhone || 'No phone provided'}</span>
                                </div>
                                <button className="size-10 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all shadow-sm">
                                    <span className="material-symbols-outlined text-xl">call</span>
                                </button>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="flex flex-col gap-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Location Details</h4>
                            <div className="bg-white dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5 flex gap-3">
                                <span className="material-symbols-outlined text-rose-500">location_on</span>
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {job.location?.address || `${job.location?.latitude}, ${job.location?.longitude}`}
                                </p>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex flex-col gap-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Service Description</h4>
                            <p className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl text-sm font-medium text-gray-600 dark:text-gray-400 leading-relaxed border border-gray-100 dark:border-white/5">
                                {job.description || "No specific details provided by the customer for this service request."}
                            </p>
                        </div>

                        {/* Technician Info (if assigned) */}
                        {job.technicianId && (
                            <div className="flex flex-col gap-4">
                                <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Assigned Technician</h4>
                                <div className="bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 font-bold text-xs">
                                            T
                                        </div>
                                        <span className="text-sm font-bold text-slate-900 dark:text-white">ID: {job.technicianId.substring(0, 10)}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Verified Meta</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
                    <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 bg-white dark:bg-white/5 text-slate-900 dark:text-white border border-gray-200 dark:border-white/10 px-4 py-3 rounded-xl text-sm font-black hover:bg-gray-100 dark:hover:bg-white/10 transition-all">
                            <span className="material-symbols-outlined text-sm">edit</span>
                            Edit Job
                        </button>
                        <button className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-3 rounded-xl text-sm font-black hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                            <span className="material-symbols-outlined text-sm">download</span>
                            Invoice
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default JobDrawer;
