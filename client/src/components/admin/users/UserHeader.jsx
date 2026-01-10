import React from 'react';

const UserHeader = ({ onAddUser }) => {
    return (
        <header className="h-16 px-6 flex items-center justify-between border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-[#111722] shrink-0 z-20">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">User Management</h1>
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/10">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 size-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#111722] animate-pulse"></span>
                </button>
                <button
                    onClick={onAddUser}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:scale-105 active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px] font-bold">add</span>
                    <span>Add New User</span>
                </button>
            </div>
        </header>
    );
};

export default UserHeader;
