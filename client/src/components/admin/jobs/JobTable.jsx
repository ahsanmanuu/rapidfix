import React from 'react';

const JobTable = ({ jobs, activeFilter, onSelectJob, selectedJobId }) => {
    const filteredJobs = jobs.filter(job => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'Pending') return job.status?.toLowerCase() === 'pending' || job.status?.toLowerCase() === 'accepted';
        return job.status?.toLowerCase() === activeFilter.toLowerCase();
    });

    const getStatusStyles = (status) => {
        const s = status?.toLowerCase();
        if (s === 'completed') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
        if (['in-progress', 'accepted', 'assigned'].includes(s)) return 'bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400';
        if (s === 'rejected' || s === 'cancelled') return 'bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400';
        return 'bg-blue-100 text-blue-700 dark:bg-primary/10 dark:text-primary';
    };

    return (
        <div className="px-8 py-4">
            <div className="bg-white dark:bg-card-dark border border-gray-200 dark:border-white/5 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/5">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-text-secondary">Job ID / Service</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-text-secondary">Client</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-text-secondary">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-text-secondary">Date</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-wider text-gray-500 dark:text-text-secondary text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {filteredJobs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500 dark:text-text-secondary font-medium">
                                        No jobs found matching your criteria.
                                    </td>
                                </tr>
                            ) : (
                                filteredJobs.map((job) => (
                                    <tr
                                        key={job.id}
                                        onClick={() => onSelectJob(job)}
                                        className={`group cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors ${selectedJobId === job.id ? 'bg-primary/5 dark:bg-primary/10' : ''
                                            }`}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                    {job.serviceType?.charAt(0)}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">#{job.id?.substring(0, 8)}</span>
                                                    <span className="text-[11px] font-medium text-gray-500 dark:text-text-secondary">{job.serviceType}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-slate-700 dark:text-gray-200">{job.contactName || 'Guest User'}</span>
                                                <span className="text-[11px] font-medium text-gray-500 dark:text-text-secondary">{job.contactPhone || 'No contact'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-tighter ${getStatusStyles(job.status)}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-500 dark:text-text-secondary">
                                            {new Date(job.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="material-symbols-outlined text-gray-400 group-hover:text-primary transition-colors">
                                                chevron_right
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default JobTable;
