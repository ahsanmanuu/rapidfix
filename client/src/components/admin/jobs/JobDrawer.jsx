import React from 'react';

const JobDrawer = ({ job, onClose }) => {
    if (!job) return null;

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase();
        if (s === 'completed') return 'bg-emerald-500 text-white';
        if (['in-progress', 'accepted', 'assigned'].includes(s)) return 'bg-amber-500 text-white';
        if (s === 'rejected' || s === 'cancelled') return 'bg-rose-500 text-white';
        return 'bg-primary text-white';
    };

    return (
        <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-[#111722] shadow-2xl z-50 transform transition-transform duration-500 ease-in-out border-l border-gray-200 dark:border-white/10 ${job ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                            <span className="material-symbols-outlined text-gray-500">close</span>
                        </button>
                        <h2 className="text-lg font-black text-slate-900 dark:text-white">Job Details</h2>
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusStyles(job.status)}`}>
                        {job.status}
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <div className="flex flex-col gap-8">
                        {/* Summary Card */}
                        <div className="bg-gray-50 dark:bg-white/5 rounded-3xl p-6 border border-gray-100 dark:border-white/5">
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Service Item</span>
                                    <span className="text-sm font-black text-primary">#{job.id?.substring(0, 10)}</span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{job.serviceType}</h3>
                                <div className="h-px bg-gray-200 dark:bg-white/10 w-full" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Created On</span>
                                        <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{new Date(job.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <span className="text-[10px] font-bold text-gray-500 uppercase">Amount Paid</span>
                                        <span className="text-sm font-black text-emerald-500">₹{job.offerPrice || job.visitingCharges || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="flex flex-col gap-4">
                            <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Customer Insight</h4>
                            <div className="flex items-center gap-4 bg-white dark:bg-white/[0.02] p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                                <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                    {job.contactName?.charAt(0) || 'G'}
                                </div>
                                <div className="flex flex-col flex-1">
                                    <span className="text-sm font-black text-slate-900 dark:text-white">{job.contactName || 'Guest User'}</span>
                                    <span className="text-xs font-medium text-gray-500 dark:text-text-secondary">{job.contactPhone || 'No phone provided'}</span>
                                </div>
                                <button className="material-symbols-outlined text-gray-400 hover:text-primary transition-colors">call</button>
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
