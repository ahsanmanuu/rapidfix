import React, { useState } from 'react';

const JobTable = ({ jobs, activeFilter, onSelectJob, selectedJobId, currentPage, onPageChange, totalPages, totalItems, startIndex, endIndex }) => {
    const [showActionsMenu, setShowActionsMenu] = useState(null);

    const filteredJobs = jobs.filter(job => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'Pending') return job.status?.toLowerCase() === 'pending' || job.status?.toLowerCase() === 'accepted';
        return job.status?.toLowerCase() === activeFilter.toLowerCase();
    });

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg mx-2">
            <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-600 dark:text-slate-400 font-black tracking-wider">
                            <th className="px-6 py-4">Job ID / Service</th>
                            <th className="px-6 py-4">Client</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Amount</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4 text-center">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredJobs.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                                    <div className="flex flex-col items-center gap-2">
                                        <span className="material-symbols-outlined text-4xl text-slate-300">search_off</span>
                                        <p>No jobs found matching "{activeFilter}" status.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredJobs.map((job) => (
                                <tr
                                    key={job.id}
                                    onClick={() => onSelectJob(job)}
                                    className={`group cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all ${selectedJobId === job.id ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-200 dark:ring-blue-800' : ''
                                        }`}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="size-11 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm shadow-sm">
                                                {job.serviceType?.charAt(0)}
                                            </div>
                                            <div className="flex flex-col min-w-0">
                                                <span className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[150px]">#{job.id?.substring(0, 8)}</span>
                                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{job.serviceType}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-sm font-bold text-slate-700 dark:text-gray-200 truncate max-w-[150px]">{job.contactName || 'Guest User'}</span>
                                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 truncate max-w-[150px]">{job.contactPhone || 'No contact'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wide border ${['completed'].includes(job.status?.toLowerCase())
                                            ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                                            : ['in-progress', 'accepted', 'assigned'].includes(job.status?.toLowerCase())
                                                ? 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30'
                                                : ['rejected', 'cancelled'].includes(job.status?.toLowerCase())
                                                    ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
                                                    : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
                                            }`}>
                                            <span className={`size-1.5 rounded-full ${['completed'].includes(job.status?.toLowerCase()) ? 'bg-emerald-500' :
                                                ['in-progress', 'accepted', 'assigned'].includes(job.status?.toLowerCase()) ? 'bg-amber-500' :
                                                    ['rejected', 'cancelled'].includes(job.status?.toLowerCase()) ? 'bg-red-500' : 'bg-blue-500'
                                                }`}></span>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-bold text-slate-900 dark:text-white font-mono">₹{job.offerPrice || job.visitingCharges || 0}</span>
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                                        {new Date(job.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="relative inline-block">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowActionsMenu(showActionsMenu === job.id ? null : job.id);
                                                }}
                                                className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all hover:scale-110 active:scale-95"
                                            >
                                                <span className="material-symbols-outlined text-xl">more_vert</span>
                                            </button>

                                            {showActionsMenu === job.id && (
                                                <>
                                                    <div
                                                        className="fixed inset-0 z-[40]"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setShowActionsMenu(null);
                                                        }}
                                                    />
                                                    <div
                                                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl shadow-blue-500/20 dark:shadow-black/70 border border-slate-200 dark:border-slate-700 py-2 z-[50] backdrop-blur-xl"
                                                        style={{ position: 'fixed', transform: 'translateX(-90%) translateY(10px)' }}
                                                    >
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSelectJob(job);
                                                                setShowActionsMenu(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                            View Details
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onSelectJob(job); // Reuse for edit
                                                                setShowActionsMenu(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                                            Edit Job
                                                        </button>
                                                        <div className="my-1 border-t border-slate-200 dark:border-slate-700"></div>
                                                        <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                                            Delete Job
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-bold text-slate-900 dark:text-white">{startIndex || 1}-{endIndex || filteredJobs.length}</span> of <span className="font-bold text-slate-900 dark:text-white">{totalItems || jobs.length}</span> jobs
                </p>
                <div className="flex gap-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Previous
                    </button>
                    <button
                        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg shadow-blue-500/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default JobTable;
