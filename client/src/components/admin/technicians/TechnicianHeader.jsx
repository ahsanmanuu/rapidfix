import React from 'react';

const TechnicianHeader = ({ onAddTechnician }) => {
    return (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Technician Management</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                    Manage service providers, verifications, and performance.
                </p>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onAddTechnician}
                    className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 shadow-lg shadow-blue-500/20 active:scale-95"
                >
                    <span className="material-symbols-outlined text-[20px]">add</span>
                    Register Technician
                </button>
            </div>
        </div>
    );
};

export default TechnicianHeader;
