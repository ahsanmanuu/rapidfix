import React from 'react';

const TechnicianDrawer = ({ technician, onClose, onBanTech, onVerifyTech }) => {
    if (!technician) return null;

    return (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-gray-200 dark:border-slate-800 flex flex-col h-full">

            {/* Header */}
            <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700 flex-shrink-0">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/30 text-white rounded-full transition-colors backdrop-blur-sm"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
                <div className="absolute -bottom-12 left-8">
                    <div className="w-24 h-24 rounded-full border-4 border-white dark:border-slate-900 bg-white dark:bg-slate-800 overflow-hidden shadow-lg">
                        {technician.avatar ? (
                            <img src={technician.avatar} alt={technician.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-gray-400">
                                <span className="material-symbols-outlined text-4xl">person</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-8 pt-16 pb-8">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{technician.name}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                                {technician.serviceType}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${technician.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300' :
                                    'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                {technician.status}
                            </span>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center gap-1 justify-end text-amber-500">
                            <span className="font-bold text-lg">{technician.rating || '0.0'}</span>
                            <span className="material-symbols-outlined icon-filled text-sm">star</span>
                        </div>
                        <p className="text-xs text-gray-500">{technician.reviewCount || 0} reviews</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Email</label>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200 overflow-hidden text-ellipsis">{technician.email}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Phone</label>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{technician.phone || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Location</label>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">{technician.baseAddress || 'N/A'}</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-500">Member Since</label>
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-200">
                            {technician.joinedAt ? new Date(technician.joinedAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>

                {/* Documents Section */}
                <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Verification Documents</h3>
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-800">
                        {technician.documents && Object.keys(technician.documents).length > 0 ? (
                            <ul className="space-y-3">
                                {Object.entries(technician.documents).map(([key, url]) => (
                                    <li key={key} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-blue-400 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-blue-500">description</span>
                                            <span className="text-sm font-medium text-gray-700 dark:text-slate-300 capitalize">
                                                {key.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <span className="material-symbols-outlined text-gray-400 group-hover:text-blue-500">open_in_new</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-6 text-gray-500 dark:text-slate-500">
                                <span className="material-symbols-outlined text-3xl mb-2 opacity-50">folder_off</span>
                                <p className="text-sm">No documents submitted</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Summary */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl text-center">
                        <h4 className="text-xl font-bold text-blue-600 dark:text-blue-400">{technician.jobsCompleted || 0}</h4>
                        <p className="text-xs font-medium text-blue-600/70 dark:text-blue-400/70 uppercase tracking-wide">Jobs Done</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-500/10 p-4 rounded-xl text-center">
                        <h4 className="text-xl font-bold text-purple-600 dark:text-purple-400">₹{technician.earnings || 0}</h4>
                        <p className="text-xs font-medium text-purple-600/70 dark:text-purple-400/70 uppercase tracking-wide">Earned</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-500/10 p-4 rounded-xl text-center">
                        <h4 className="text-xl font-bold text-emerald-600 dark:text-emerald-400">100%</h4>
                        <p className="text-xs font-medium text-emerald-600/70 dark:text-emerald-400/70 uppercase tracking-wide">Completion</p>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900/50 flex gap-3">
                <button
                    onClick={() => { onBanTech(technician); onClose(); }}
                    className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all focus:scale-95 ${technician.status === 'Banned'
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:hover:bg-emerald-500/20'
                            : 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20'
                        }`}
                >
                    {technician.status === 'Banned' ? 'Activate Account' : 'Suspend Account'}
                </button>
                {technician.status === 'Pending' && (
                    <button
                        onClick={() => { onVerifyTech(technician); onClose(); }}
                        className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all focus:scale-95"
                    >
                        Approve & Verify
                    </button>
                )}
            </div>
        </div>
    );
};

export default TechnicianDrawer;
