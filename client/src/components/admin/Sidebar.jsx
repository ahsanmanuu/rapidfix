import React from 'react';

const navItems = [
    { id: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
    { id: 'technicians', icon: 'group', label: 'Technicians' },
    { id: 'users', icon: 'person', label: 'Users' },
    { id: 'jobs', icon: 'work', label: 'Jobs' },
    { id: 'feedback', icon: 'chat_bubble', label: 'Feedback' },
    { id: 'billing', icon: 'receipt_long', label: 'Billing' },
    { id: 'support', icon: 'info', label: 'Support' },
    { id: 'settings', icon: 'settings', label: 'Settings' }
];

export const Sidebar = ({ activeTab, setActiveTab }) => {
    return (
        <aside className="w-64 flex-shrink-0 border-r border-gray-200 dark:border-[#232f48] bg-white dark:bg-[#111722] hidden lg:flex flex-col h-full overflow-y-auto custom-scrollbar transition-colors duration-300">
            <div className="flex flex-col h-full p-4 justify-between">
                <div className="flex flex-col gap-6">
                    <div className="flex items-center gap-3 px-2">
                        <div className="bg-center bg-no-repeat bg-cover rounded-full size-10 bg-primary/20 flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-2xl">admin_panel_settings</span>
                        </div>
                        <h1 className="text-primary text-lg font-bold leading-normal tracking-tight">Admin Console</h1>
                    </div>
                    <nav className="flex flex-col gap-2">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-200 group w-full text-left ${activeTab === item.id
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'hover:bg-gray-100 dark:hover:bg-[#232f48] text-gray-500 dark:text-[#92a4c9] hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                <span className={`material-symbols-outlined ${activeTab === item.id ? 'fill-1' : ''}`}>
                                    {item.icon}
                                </span>
                                <p className="text-sm font-medium leading-normal">{item.label}</p>
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-[#232f48]/50 border border-gray-200 dark:border-[#232f48] hover:bg-gray-100 dark:hover:bg-[#232f48] cursor-pointer transition-colors group">
                    <div className="bg-center bg-no-repeat bg-cover rounded-full size-8 bg-gray-700"></div>
                    <div className="flex flex-col text-left">
                        <p className="text-gray-900 dark:text-white text-xs font-bold">Admin User</p>
                        <p className="text-gray-500 dark:text-[#92a4c9] text-[10px]">admin@system.com</p>
                    </div>
                    <span className="material-symbols-outlined text-gray-400 dark:text-[#92a4c9] ml-auto text-sm group-hover:text-gray-900 dark:group-hover:text-white">more_vert</span>
                </div>
            </div>
        </aside>
    );
};
