import React from 'react';

const JobHeader = ({ activeFilter, setActiveFilter }) => {
    const filters = [
        { id: 'all', label: 'All Jobs' },
        { id: 'Pending', label: 'Assigned' },
        { id: 'In-Progress', label: 'In-Progress' },
        { id: 'Completed', label: 'Completed' },
    ];

    return (
        <div className="bg-white dark:bg-card-dark border-b border-gray-200 dark:border-white/5 px-8 py-6 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors duration-300">
            <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">work_history</span>
                    <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Job Control Center</h1>
                </div>
                <p className="text-gray-500 dark:text-text-secondary text-sm font-medium">Manage and monitor service lifecycle in real-time.</p>
            </div>

            <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1 rounded-xl w-fit">
                {filters.map((filter) => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${activeFilter === filter.id
                                ? 'bg-white dark:bg-primary text-primary dark:text-white shadow-sm'
                                : 'text-gray-500 dark:text-text-secondary hover:text-gray-900 dark:hover:text-white'
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-all shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Create New Job
                </button>
            </div>
        </div>
    );
};

export default JobHeader;
