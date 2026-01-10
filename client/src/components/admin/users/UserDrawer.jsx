import React, { useState } from 'react';

const UserDrawer = ({ user, onClose, onBanUser, onChangeMembership, onEdit }) => {
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
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity duration-300 ${user ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div className={`fixed right-4 md:right-8 top-1/2 -translate-y-1/2 h-[60vh] w-[90%] md:w-96 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl border border-slate-200 dark:border-slate-700 transform transition-transform duration-300 ease-out z-50 flex flex-col overflow-hidden ${user ? 'translate-x-0' : 'translate-x-[200%]'}`}>
                {/* Header with Close Button */}
                <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between shrink-0 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                    <h2 className="text-lg font-black bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">User Details</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => onEdit(user)}
                            className="size-10 flex items-center justify-center rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 hover:border-blue-200 dark:hover:border-blue-500/20 transition-all hover:scale-110 active:scale-95 shadow-sm"
                            title="Edit User"
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
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <div className="p-6 flex flex-col items-center border-b border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800/50 dark:to-slate-900">
                        <div className="relative mb-4">
                            <div
                                className="size-24 rounded-full bg-cover bg-center border-4 border-white dark:border-slate-700 shadow-xl ring-4 ring-blue-100 dark:ring-blue-900/30"
                                style={{ backgroundImage: `url("${user.avatar || user.photo || 'https://randomuser.me/api/portraits/lego/1.jpg'}")` }}
                            />
                            <div className="absolute bottom-1 right-1 bg-emerald-500 size-6 rounded-full border-3 border-white dark:border-slate-900 shadow-lg flex items-center justify-center" title="Online">
                                <div className="size-2 bg-white rounded-full animate-pulse"></div>
                            </div>
                        </div>
                        <h3 className="text-xl font-black text-slate-900 dark:text-white">{user.name}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 truncate max-w-full px-4">{user.email}</p>
                        <div className="flex gap-3 w-full justify-center px-4">
                            <button
                                onClick={() => window.open(`mailto:${user.email}`, '_blank')}
                                className="flex-1 flex justify-center items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-[18px]">email</span>
                                Email User
                            </button>
                        </div>
                    </div>

                    {/* Status & Membership */}
                    <div className="p-6 flex flex-col gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Account Status</span>
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
                                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${user.status !== 'Banned' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : 'bg-slate-300 dark:bg-slate-600'
                                        } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                >
                                    <span className="sr-only">Toggle Account Status</span>
                                    <span
                                        className={`inline-block size-5 transform rounded-full bg-white shadow-lg transition-transform duration-200 ${user.status !== 'Banned' ? 'translate-x-8' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                {user.status !== 'Banned' ? '✓ Account Active' : '✗ Account Banned'}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wide">Membership</span>
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
                                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all focus:outline-none ${user.membership === 'Premium' ? 'bg-yellow-500 shadow-md shadow-yellow-500/30' : 'bg-slate-300 dark:bg-slate-600'
                                            } ${isUpdatingStatus ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
                                    >
                                        <span
                                            className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${user.membership === 'Premium' ? 'translate-x-6' : 'translate-x-1'
                                                }`}
                                        />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`material-symbols-outlined filled ${user.membership === 'Premium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400'}`}>
                                        workspace_premium
                                    </span>
                                    <span className="text-slate-900 dark:text-white font-bold text-sm">{user.membership}</span>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border border-emerald-200 dark:border-emerald-800">
                                <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wide block mb-2">Wallet</span>
                                <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
                                    ₹{(user.walletBalance || 0).toFixed(2)}
                                </div>
                            </div>
                        </div>

                        {/* Jobs Section */}
                        <div className="mt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wide">Recent Jobs</h4>
                            </div>

                            <div className="flex border-b border-slate-200 dark:border-slate-700 mb-4">
                                {['active', 'completed', 'rejected'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`px-4 py-2 text-sm font-semibold transition-all border-b-2 capitalize ${activeTab === tab
                                            ? 'text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400'
                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 border-transparent'
                                            }`}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>

                            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto custom-scrollbar">
                                {user.jobs && user.jobs.filter(job => getJobCategory(job.status) === activeTab).length > 0 ? (
                                    user.jobs
                                        .filter(job => getJobCategory(job.status) === activeTab)
                                        .map((job) => (
                                            <div
                                                key={job.id}
                                                className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer group"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <span className="text-xs font-mono text-slate-400 truncate">#{job.id?.substring(0, 8)}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${['accepted', 'in_progress'].includes(job.status) ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300' :
                                                        ['rejected', 'cancelled'].includes(job.status) ? 'bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-300' :
                                                            job.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' :
                                                                'bg-slate-100 text-slate-600'
                                                        }`}>
                                                        {job.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <h5 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                                    {job.serviceType || 'Service Request'}
                                                </h5>
                                            </div>
                                        ))
                                ) : (
                                    <div className="py-12 text-center">
                                        <span className="material-symbols-outlined text-slate-300 dark:text-slate-600 text-5xl mb-3 block">history</span>
                                        <p className="text-slate-400 text-sm">No {activeTab} jobs found</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default UserDrawer;
