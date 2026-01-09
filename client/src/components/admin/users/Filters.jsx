import React from 'react';

const Filters = () => {
    return (
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white dark:bg-[#1A2332] p-4 rounded-xl border dark:border-slate-700 shadow-sm">
            <div className="relative w-full lg:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 group-focus-within:text-primary transition-colors">search</span>
                </div>
                <input
                    className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg leading-5 bg-slate-100 dark:bg-[#111722] text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary sm:text-sm transition-shadow"
                    placeholder="Search by name, email or ID..."
                    type="text"
                />
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-[#232f48] border border-transparent dark:border-slate-700 transition-colors">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tier: All</span>
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">expand_more</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-[#232f48] border border-transparent dark:border-slate-700 transition-colors">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status: Active</span>
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">expand_more</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-[#232f48] border border-transparent dark:border-slate-700 transition-colors">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sort: Recent</span>
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">sort</span>
                </button>
            </div>
        </div>
    );
};

export default Filters;
