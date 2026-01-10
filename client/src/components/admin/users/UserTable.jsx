import React, { useState } from 'react';

const UserTable = ({ users, selectedUserId, onSelectUser }) => {
    const [showActionsMenu, setShowActionsMenu] = useState(null);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs uppercase text-slate-600 dark:text-slate-400 font-black tracking-wider">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Membership</th>
                            <th className="px-6 py-4 text-center">Wallet Balance</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Last Active</th>
                            <th className="px-6 py-4 text-center">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {users.map((user) => (
                            <tr
                                key={user.id}
                                onClick={() => onSelectUser(user)}
                                className={`group cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all ${selectedUserId === user.id ? 'bg-blue-50 dark:bg-blue-900/20 ring-2 ring-inset ring-blue-200 dark:ring-blue-800' : ''
                                    }`}
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="relative">
                                            <div
                                                className="size-11 rounded-xl bg-cover bg-center border-2 border-white dark:border-slate-700 shadow-md ring-2 ring-slate-200 dark:ring-slate-700 group-hover:ring-blue-300 dark:group-hover:ring-blue-700 transition-all"
                                                style={{ backgroundImage: `url("${user.avatar || user.photo || 'https://randomuser.me/api/portraits/lego/1.jpg'}")` }}
                                            />
                                            {(user.status === 'Active' || !user.status) && (
                                                <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 shadow-sm"></div>
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.membership === 'Premium' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-amber-400 to-yellow-500 text-yellow-950 shadow-sm shadow-yellow-500/30 ring-1 ring-yellow-600/20">
                                            <span className="material-symbols-outlined text-[14px] filled">workspace_premium</span>
                                            Premium
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 ring-1 ring-slate-200 dark:ring-slate-600">
                                            Free
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <span className="inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 font-mono ring-1 ring-emerald-200 dark:ring-emerald-800">
                                        ${(user.walletBalance || 0).toFixed(2)}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.status === 'Active' || !user.status ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-200 dark:ring-emerald-500/30">
                                            <span className="size-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Active
                                        </span>
                                    ) : user.status === 'Banned' ? (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400 ring-1 ring-red-200 dark:ring-red-500/30">
                                            <span className="size-2 rounded-full bg-red-500"></span>
                                            Banned
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-slate-500/30">
                                            <span className="size-2 rounded-full bg-slate-500"></span>
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    {user.lastActive || 'Just now'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className="relative inline-block">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowActionsMenu(showActionsMenu === user.id ? null : user.id);
                                            }}
                                            className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all hover:scale-110 active:scale-95"
                                        >
                                            <span className="material-symbols-outlined text-xl">more_vert</span>
                                        </button>

                                        {showActionsMenu === user.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowActionsMenu(null);
                                                    }}
                                                />
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl shadow-blue-500/20 dark:shadow-black/70 border border-slate-200 dark:border-slate-700 py-2 z-20 backdrop-blur-xl">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelectUser(user);
                                                            setShowActionsMenu(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors"
                                                    >
                                                        <span className="material-symbols-outlined text-[18px]">visibility</span>
                                                        View Details
                                                    </button>
                                                    <button className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors">
                                                        <span className="material-symbols-outlined text-[18px]">edit</span>
                                                        Edit User
                                                    </button>
                                                    <button className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-2 transition-colors">
                                                        <span className="material-symbols-outlined text-[18px]">email</span>
                                                        Send Email
                                                    </button>
                                                    <div className="my-1 border-t border-slate-200 dark:border-slate-700"></div>
                                                    <button className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors">
                                                        <span className="material-symbols-outlined text-[18px]">block</span>
                                                        Ban User
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-800 px-6 py-4 border-t border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Showing <span className="font-bold text-slate-900 dark:text-white">1-{users.length}</span> of <span className="font-bold text-slate-900 dark:text-white">248</span> users
                </p>
                <div className="flex gap-2">
                    <button className="px-4 py-2 rounded-lg bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold shadow-sm">
                        Previous
                    </button>
                    <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 transition-all text-sm font-bold shadow-lg shadow-blue-500/30 hover:scale-105 active:scale-95">
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserTable;
