import React, { useState } from 'react';

const UserDrawer = ({ user, onClose, onBanUser, onChangeMembership }) => {
    const [activeTab, setActiveTab] = useState('active');
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    if (!user) return null;

    // Helper to group statuses
    const getJobCategory = (status) => {
        if (['pending', 'accepted', 'in_progress'].includes(status)) return 'active';
        if (status === 'completed') return 'completed';
        if (['rejected', 'cancelled'].includes(status)) return 'rejected';
        return 'other';
    };

    return (
        <div className={`fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white dark:bg-[#1A2332] shadow-2xl border-l dark:border-slate-700 transform transition-transform duration-300 ease-in-out z-30 flex flex-col h-full overflow-hidden ${user ? 'translate-x-0' : 'translate-x-full'}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b dark:border-slate-700 flex items-center justify-between shrink-0">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">User Details</h2>
                <button
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                <div className="p-6 flex flex-col items-center border-b dark:border-slate-700 bg-slate-50/50 dark:bg-[#111722]/50">
                    <div className="relative mb-4">
                        <div
                            className="size-24 rounded-full bg-cover bg-center border-4 border-white dark:border-[#2A3447] shadow-lg"
                            style={{ backgroundImage: `url("${user.avatar || user.photo || 'https://randomuser.me/api/portraits/lego/1.jpg'}")` }}
                        />
                        <div className="absolute bottom-0 right-0 bg-emerald-500 size-5 rounded-full border-2 border-white dark:border-[#1A2332]" title="Online"></div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-4">{user.email}</p>
                    <div className="flex gap-3 w-full justify-center">
                        <button
                            onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                            className="flex-1 flex justify-center items-center gap-2 bg-white dark:bg-[#232f48] border dark:border-transparent text-slate-700 dark:text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-[#2A3447] transition-colors shadow-sm"
                        >
                            <span className="material-symbols-outlined text-[18px]">mail</span>
                            Email
                        </button>
                        <div className="flex-1 flex flex-col justify-center items-center gap-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Status</span>
                            <button
                                onClick={async () => {
                                    if (isUpdatingStatus) return;
                                    setIsUpdatingStatus(true);
                                    try {
                                        await onBanUser(user.id, user.status);
                                    } catch (err) {
                                        console.error("Ban Toggle Failed", err);
                                    } finally {
                                        setIsUpdatingStatus(false);
                                    }
                                }}
                                disabled={isUpdatingStatus}
                                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${user.status !== 'Banned' ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
                                    } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                <span className="sr-only">Toggle Ban Status</span>
                                <span
                                    className={`inline-block size-6 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${user.status !== 'Banned' ? 'translate-x-9' : 'translate-x-1'
                                        }`}
                                >
                                    {isUpdatingStatus && (
                                        <span className="absolute inset-0 flex items-center justify-center">
                                            <span className="size-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></span>
                                        </span>
                                    )}
                                </span>
                                <span className={`absolute text-[9px] font-bold ${user.status !== 'Banned' ? 'left-2 text-white' : 'right-2 text-slate-500'}`}>
                                    {user.status !== 'Banned' ? 'ON' : 'OFF'}
                                </span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-6 flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border dark:border-slate-700 flex flex-col">
                            <span className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Membership</span>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined filled ${user.membership === 'Premium' ? 'text-yellow-500' : 'text-slate-400'}`}>
                                        workspace_premium
                                    </span>
                                    <span className="text-slate-900 dark:text-white font-bold text-sm">{user.membership}</span>
                                </div>

                                <button
                                    onClick={async () => {
                                        if (isUpdatingStatus) return;
                                        const newTier = user.membership === 'Premium' ? 'Free' : 'Premium';
                                        setIsUpdatingStatus(true);
                                        try {
                                            await onChangeMembership(user.id, newTier);
                                        } finally {
                                            setIsUpdatingStatus(false);
                                        }
                                    }}
                                    disabled={isUpdatingStatus}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${user.membership === 'Premium' ? 'bg-yellow-500' : 'bg-slate-200 dark:bg-slate-700'
                                        } ${isUpdatingStatus ? 'opacity-50 cursor-wait' : ''}`}
                                >
                                    <span
                                        className={`inline-block size-4 transform rounded-full bg-white shadow transition-transform duration-200 ease-in-out ${user.membership === 'Premium' ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">
                                {user.membership === 'Premium' ? 'Revoke Premium access' : 'Grant Premium benefits'}
                            </span>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#111722] border dark:border-slate-700 flex flex-col">
                            <span className="text-xs text-slate-500 font-medium mb-2 uppercase tracking-wide">Wallet Balance</span>
                            <div className="text-2xl font-black text-slate-900 dark:text-white font-mono tracking-tight">${(user.walletBalance || 0).toFixed(2)}</div>
                            <button className="mt-auto text-xs text-primary font-semibold hover:underline text-left">Adjust Balance</button>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Recent Jobs</h4>
                            <a className="text-xs text-primary font-semibold hover:underline" href="#">View All</a>
                        </div>

                        <div className="flex border-b dark:border-slate-700 mb-4">
                            {['active', 'completed', 'rejected'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 capitalize ${activeTab === tab
                                        ? 'text-primary border-primary'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="flex flex-col gap-3">
                            {user.jobs && user.jobs.filter(job => getJobCategory(job.status) === activeTab).length > 0 ? (
                                user.jobs
                                    .filter(job => getJobCategory(job.status) === activeTab)
                                    .map((job) => (
                                        <div
                                            key={job.id}
                                            className={`p-4 rounded-lg border dark:border-slate-700 bg-white dark:bg-[#111722] hover:border-primary/50 transition-all cursor-pointer group ${job.status === 'rejected' ? 'opacity-75 hover:opacity-100' : ''}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <span className="text-xs font-mono text-slate-400">#{job.id?.substring(0, 8)}</span>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${['accepted', 'in_progress'].includes(job.status) ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                                                    ['rejected', 'cancelled'].includes(job.status) ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' :
                                                        job.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {job.status.replace('_', ' ')}
                                                </span>
                                            </div>
                                            <h5 className="text-sm font-semibold text-slate-900 dark:text-white group-hover:text-primary transition-colors">{job.serviceType || 'Service Request'}</h5>

                                            {job.reason ? (
                                                <div className="mt-2 text-xs text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                                                    Reason: {job.reason}
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-1 mt-2">
                                                    <div className="flex items-center gap-1 text-xs text-slate-500">
                                                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                                        <span>{job.scheduledDate} {job.scheduledTime}</span>
                                                    </div>

                                                    {['accepted', 'in_progress', 'completed'].includes(job.status) && job.technician && (
                                                        <div className="flex items-center gap-2 mt-1 bg-slate-50 dark:bg-white/5 p-1.5 rounded-lg border dark:border-white/5">
                                                            <div
                                                                className="size-6 rounded-full bg-cover bg-center border border-white dark:border-white/10"
                                                                style={{ backgroundImage: `url("${job.technician.photo || 'https://randomuser.me/api/portraits/lego/1.jpg'}")` }}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 leading-none">{job.technician.name}</span>
                                                                <span className="text-[9px] text-slate-400 leading-none mt-0.5">{job.technician.serviceType}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                            ) : (
                                <div className="py-8 text-center">
                                    <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-4xl mb-2">history</span>
                                    <p className="text-slate-400 text-sm">No jobs found for this category.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-4 border-t dark:border-slate-700 bg-slate-50 dark:bg-[#111722] shrink-0">
                <button
                    onClick={() => alert("Edit Full Profile functionality comming soon!")}
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-slate-100 transition-all transform active:scale-[0.98]"
                >
                    Edit Full Profile
                </button>
            </div>
        </div>
    );
};

export default UserDrawer;
