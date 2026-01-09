import React, { useMemo } from 'react';

const JobStats = ({ jobs }) => {
    const stats = useMemo(() => {
        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        const active = jobs.filter(j => ['pending', 'accepted', 'assigned', 'in-progress'].includes(j.status?.toLowerCase())).length;
        const completedToday = jobs.filter(j =>
            j.status?.toLowerCase() === 'completed' &&
            new Date(j.updatedAt || j.createdAt) >= startOfDay
        ).length;
        const pendingReview = jobs.filter(j => j.status?.toLowerCase() === 'pending').length;
        const urgent = jobs.filter(j =>
            ['pending', 'accepted'].includes(j.status?.toLowerCase()) &&
            (now - new Date(j.createdAt)) > 24 * 60 * 60 * 1000 // Older than 24h
        ).length;

        return [
            { id: 1, label: 'Active Jobs', value: active, trend: '+12%', icon: 'bolt', color: 'text-primary' },
            { id: 2, label: 'Completed Today', value: completedToday, trend: '+5%', icon: 'check_circle', color: 'text-emerald-500' },
            { id: 3, label: 'Pending Review', value: pendingReview, trend: '-2%', icon: 'pending_actions', color: 'text-amber-500' },
            { id: 4, label: 'Urgent Issues', value: urgent, trend: 'Stable', icon: 'error', color: 'text-rose-500' },
        ];
    }, [jobs]);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 px-8 py-2">
            {stats.map((stat) => (
                <div key={stat.id} className="bg-white dark:bg-card-dark border border-gray-200 dark:border-white/5 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 group">
                    <div className="flex items-center justify-between mb-3">
                        <div className={`size-12 rounded-xl flex items-center justify-center bg-gray-50 dark:bg-white/5 ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                            <span className="material-symbols-outlined">{stat.icon}</span>
                        </div>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${stat.trend.startsWith('+') ? 'text-emerald-500 bg-emerald-500/10' :
                                stat.trend.startsWith('-') ? 'text-rose-500 bg-rose-500/10' :
                                    'text-gray-400 bg-gray-400/10'
                            }`}>
                            {stat.trend}
                        </span>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-2xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                        <span className="text-gray-500 dark:text-text-secondary text-xs font-bold uppercase tracking-wider">{stat.label}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default JobStats;
