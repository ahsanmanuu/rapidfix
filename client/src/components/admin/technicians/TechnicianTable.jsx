import React from 'react';

const TechnicianTable = ({
    technicians,
    selectedTechId,
    onSelectTech,
    onBanTech,
    onDeleteTech
}) => {

    // Helper to get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Active': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400';
            case 'Pending':
            case 'Verification Pending': return 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400';
            case 'Banned':
            case 'Suspended': return 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Technician</th>
                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Service</th>
                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Status</th>
                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Rating</th>
                            <th className="py-4 px-6 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Joined</th>
                            <th className="py-4 px-6 text-center text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                        {technicians.map((tech) => (
                            <tr
                                key={tech.id}
                                className={`group hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer ${selectedTechId === tech.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}
                                onClick={() => onSelectTech(tech)}
                            >
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center text-gray-500 dark:text-slate-400">
                                            {tech.avatar ? (
                                                <img src={tech.avatar} alt={tech.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="material-symbols-outlined text-xl">person</span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{tech.name}</h3>
                                            <p className="text-xs text-gray-500 dark:text-slate-400">{tech.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-gray-400 text-lg">
                                            {tech.serviceType === 'Electrician' ? 'electric_bolt' :
                                                tech.serviceType === 'Plumber' ? 'plumbing' : 'handyman'}
                                        </span>
                                        <span className="text-sm text-gray-700 dark:text-slate-300">{tech.serviceType}</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(tech.status)}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${tech.status === 'Active' ? 'bg-emerald-500' : 'bg-current'}`}></span>
                                        {tech.status}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center gap-1">
                                        <span className="material-symbols-outlined text-amber-400 text-lg icon-filled">star</span>
                                        <span className="font-semibold text-gray-900 dark:text-white text-sm">{tech.rating || 'N/A'}</span>
                                        <span className="text-xs text-gray-400">({tech.reviewCount || 0})</span>
                                    </div>
                                </td>
                                <td className="py-4 px-6">
                                    <span className="text-sm text-gray-600 dark:text-slate-400">
                                        {tech.joinedAt ? new Date(tech.joinedAt).toLocaleDateString() : 'N/A'}
                                    </span>
                                </td>
                                <td className="py-4 px-6">
                                    <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onSelectTech(tech); }}
                                            className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-gray-500 hover:text-blue-600 rounded-lg transition-colors shadow-sm"
                                            title="View Details"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">visibility</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); onBanTech(tech); }}
                                            className={`p-1.5 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors shadow-sm ${tech.status === 'Banned' ? 'text-emerald-500 hover:text-emerald-600' : 'text-red-500 hover:text-red-600'}`}
                                            title={tech.status === 'Banned' ? 'Unban' : 'Ban'}
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {tech.status === 'Banned' ? 'check_circle' : 'block'}
                                            </span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {technicians.length === 0 && (
                <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="material-symbols-outlined text-3xl text-gray-400 dark:text-slate-500">search_off</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No technicians found</h3>
                    <p className="text-gray-500 dark:text-slate-400 mt-1">Try adjusting your filters or search terms.</p>
                </div>
            )}
        </div>
    );
};

export default TechnicianTable;
