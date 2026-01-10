import React from 'react';

const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'technicians', icon: 'engineering', label: 'Technicians' },
    { id: 'users', icon: 'group', label: 'Users' },
    { id: 'jobs', icon: 'work', label: 'Jobs' },
    { id: 'feedback', icon: 'star', label: 'Feedback' },
    { id: 'billing', icon: 'payments', label: 'Billing' },
    { id: 'support', icon: 'support_agent', label: 'Support' },
    { id: 'settings', icon: 'settings', label: 'Settings' }
];

export const Sidebar = ({ activeTab, setActiveTab, isOpen, setIsOpen }) => {
    return (
        <aside className={`fixed inset-y-0 left-0 z-[60] w-64 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 dark:from-slate-950 dark:via-slate-950 dark:to-black border-r border-slate-700/50 dark:border-slate-800/50 flex flex-col h-full overflow-y-auto custom-scrollbar transition-all duration-300 lg:static lg:translate-x-0 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="flex flex-col h-full p-4 justify-between">
                <div className="flex flex-col gap-6">
                    {/* Logo Section */}
                    <div className="flex items-center justify-between px-2 pt-2">
                        <div className="flex items-center gap-3">
                            {/* Logo with gradient background */}
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl blur-md opacity-75"></div>
                                <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl size-10 flex items-center justify-center shadow-lg">
                                    <span className="material-symbols-outlined text-white text-2xl font-bold">build_circle</span>
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-white text-lg font-black leading-none tracking-tight">Fixofy</h1>
                                <p className="text-blue-400 text-[10px] font-semibold uppercase tracking-wider">Admin Panel</p>
                            </div>
                        </div>
                        <button
                            className="lg:hidden p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Navigation */}
                    <nav className="flex flex-col gap-1.5 mt-4">
                        {navItems.map((item) => {
                            const isActive = activeTab === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { setActiveTab(item.id); setIsOpen(false); }}
                                    className={`
                                        group relative flex items-center gap-3 px-4 py-3 rounded-xl 
                                        transition-all duration-200 w-full text-left
                                        ${isActive
                                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/50 scale-105'
                                            : 'text-slate-400 hover:text-white hover:bg-white/10 hover:scale-105'
                                        }
                                    `}
                                >
                                    {/* Active indicator bar */}
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-r-full"></div>
                                    )}

                                    <span className={`material-symbols-outlined text-xl ${isActive ? 'filled' : ''}`}>
                                        {item.icon}
                                    </span>
                                    <p className="text-sm font-semibold leading-normal">{item.label}</p>

                                    {/* Hover arrow indicator */}
                                    {!isActive && (
                                        <span className="material-symbols-outlined text-sm ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                            chevron_right
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom user profile */}
                <div className="mt-auto pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 cursor-pointer transition-all hover:scale-105 group">
                        <div className="relative">
                            <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-full size-10 flex items-center justify-center text-white font-bold">
                                A
                            </div>
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-900"></div>
                        </div>
                        <div className="flex flex-col text-left flex-1 min-w-0">
                            <p className="text-white text-sm font-bold truncate">Admin User</p>
                            <p className="text-slate-400 text-xs truncate">admin@fixofy.com</p>
                        </div>
                        <span className="material-symbols-outlined text-slate-400 group-hover:text-white text-lg transition-colors">
                            more_vert
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
};
