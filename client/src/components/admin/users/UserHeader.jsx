import React from 'react';

const UserHeader = () => {
    return (
        <header className="h-16 px-6 flex items-center justify-between border-b dark:border-slate-700 bg-white dark:bg-[#111722] shrink-0 z-20">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">User Management</h1>
            <div className="flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">notifications</span>
                    <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white dark:border-[#111722]"></span>
                </button>
                <button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    <span>Add New User</span>
                </button>
            </div>
        </header>
    );
};

export default UserHeader;
