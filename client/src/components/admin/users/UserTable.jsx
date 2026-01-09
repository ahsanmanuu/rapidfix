import React from 'react';

const UserTable = ({ users, selectedUserId, onSelectUser }) => {
    return (
        <div className="bg-white dark:bg-[#1A2332] rounded-xl border dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 dark:bg-[#111722] border-b dark:border-slate-700 text-xs uppercase text-slate-500 dark:text-slate-400 font-semibold tracking-wider">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Membership</th>
                            <th className="px-6 py-4 text-right">Wallet Balance</th>
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
                                className={`group cursor-pointer hover:bg-slate-50 dark:hover:bg-[#232f48]/50 transition-colors ${selectedUserId === user.id ? 'bg-primary/5 dark:bg-primary/10' : ''
                                    }`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="size-10 rounded-full bg-cover bg-center border-2 border-white dark:border-[#2A3447]"
                                            style={{ backgroundImage: `url("${user.avatar || user.photo || 'https://randomuser.me/api/portraits/lego/1.jpg'}")` }}
                                        />
                                        <div>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.membership === 'Premium' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-amber-200 to-yellow-400 text-yellow-900 border border-yellow-200">
                                            <span className="material-symbols-outlined text-[14px] filled">workspace_premium</span>
                                            Premium
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                            Free
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-slate-900 dark:text-white font-mono">
                                    ${(user.walletBalance || 0).toFixed(2)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {user.status === 'Active' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                                            <span className="size-1.5 rounded-full bg-emerald-500"></span>
                                            Active
                                        </span>
                                    ) : user.status === 'Banned' ? (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-500/20">
                                            <span className="size-1.5 rounded-full bg-red-500"></span>
                                            Banned
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-500/20">
                                            <span className="size-1.5 rounded-full bg-slate-500"></span>
                                            Inactive
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-400">
                                    {user.lastActive}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <button className="text-slate-400 hover:text-primary dark:hover:text-white transition-colors p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#232f48]">
                                        <span className="material-symbols-outlined">more_horiz</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-white dark:bg-[#1A2332] px-6 py-4 border-t dark:border-slate-700 flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Showing <span className="font-medium text-slate-900 dark:text-white">1-{users.length}</span> of <span className="font-medium text-slate-900 dark:text-white">248</span> users
                </p>
                <div className="flex gap-2">
                    <button className="px-3 py-1 rounded-lg border dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-[#232f48] disabled:opacity-50">Previous</button>
                    <button className="px-3 py-1 rounded-lg border dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-[#232f48]">Next</button>
                </div>
            </div>
        </div>
    );
};

export default UserTable;
