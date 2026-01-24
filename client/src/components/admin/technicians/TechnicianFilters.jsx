import React from 'react';

const TechnicianFilters = ({
    searchQuery, setSearchQuery,
    activeStatus, setActiveStatus,
    activeService, setActiveService,
    services = ['All', 'Electrician', 'Plumber', 'Carpenter', 'Painter', 'HVAC', 'Appliance Repair']
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative group">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">search</span>
                <input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-gray-400"
                />
            </div>

            {/* Status Filter */}
            <div className="min-w-[160px]">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">filter_list</span>
                    <select
                        value={activeStatus}
                        onChange={(e) => setActiveStatus(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-all"
                    >
                        <option value="All">All Statuses</option>
                        <option value="Active">Active</option>
                        <option value="Pending">Pending</option>
                        <option value="Suspended">Suspended</option>
                        <option value="Banned">Banned</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">expand_more</span>
                </div>
            </div>

            {/* Service Filter */}
            <div className="min-w-[180px]">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">category</span>
                    <select
                        value={activeService}
                        onChange={(e) => setActiveService(e.target.value)}
                        className="w-full pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-700 dark:text-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer transition-all"
                    >
                        {services.map(service => (
                            <option key={service} value={service === 'All' ? 'All' : service}>{service === 'All' ? 'All Services' : service}</option>
                        ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-[20px]">expand_more</span>
                </div>
            </div>
        </div>
    );
};

export default TechnicianFilters;
