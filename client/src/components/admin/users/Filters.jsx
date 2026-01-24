import React from 'react';

const Filters = ({ searchQuery, setSearchQuery, activeTier, setActiveTier, activeStatus, setActiveStatus }) => {
    return (
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-white dark:bg-[#1A2332] p-4 rounded-xl border dark:border-slate-700 shadow-sm">
            <div className="relative w-full lg:w-96 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="material-symbols-outlined text-slate-400 group-focus-within:text-blue-500 transition-colors">search</span>
                </div>
                <input
                    value={searchQuery || ''}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border-none rounded-lg leading-5 bg-slate-100 dark:bg-[#111722] text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-shadow"
                    placeholder="Search by name, email or ID..."
                    type="text"
                />
            </div>

            <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                <select
                    value={activeTier || 'All'}
                    onChange={(e) => setActiveTier(e.target.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-[#232f48] border border-transparent dark:border-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8 relative"
                    style={{ backgroundImage: 'none' }}
                >
                    <option value="All">Tier: All</option>
                    <option value="Premium">Tier: Premium</option>
                    <option value="Free">Tier: Free</option>
                </select>

                <select
                    value={activeStatus || 'All'}
                    onChange={(e) => setActiveStatus(e.target.value)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-[#232f48] border border-transparent dark:border-slate-700 transition-colors text-sm font-medium text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none pr-8"
                >
                    <option value="All">Status: All</option>
                    <option value="Active">Status: Active</option>
                    <option value="Banned">Status: Banned</option>
                </select>

                <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-100 dark:bg-[#111722] hover:bg-slate-200 dark:hover:bg-[#232f48] border border-transparent dark:border-slate-700 transition-colors">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Sort: Recent</span>
                    <span className="material-symbols-outlined text-slate-500 text-[20px]">sort</span>
                </button>
            </div>
        </div>
    );
};

export default Filters;
