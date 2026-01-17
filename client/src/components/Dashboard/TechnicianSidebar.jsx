import React from 'react';
import {
    LayoutDashboard,
    History,
    MessageSquare,
    Wallet,
    Settings,
    LogOut,
    Bell,
    Star,
    Menu,
    X,
    ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TechnicianSidebar = ({
    isOpen,
    toggleSidebar,
    activeTab,
    setActiveTab,
    user,
    onLogout
}) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'history', label: 'Job History', icon: History },
        { id: 'chat', label: 'Messages', icon: MessageSquare },
        { id: 'feedback', label: 'Reviews', icon: Star },
        { id: 'notifications', label: 'Alerts', icon: Bell },
        { id: 'profile', label: 'Settings', icon: Settings },
    ];

    const sidebarVariants = {
        open: {
            x: 0,
            width: '280px',
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        },
        closed: {
            x: '-100%',
            width: '0px',
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        },
        desktopClosed: {
            width: '80px',
            x: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        }
    };

    // Determine variant based on screen size (handled by parent passing isOpen)
    // But for simplicity, we'll assume the parent controls `isOpen` fully.

    return (
        <>
            {/* Mobile Backdrop */}
            <AnimatePresence>
                {isOpen && window.innerWidth < 768 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={toggleSidebar}
                        className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Sidebar Container */}
            <motion.aside
                initial={false}
                animate={isOpen ? 'open' : (window.innerWidth >= 768 ? 'desktopClosed' : 'closed')}
                variants={sidebarVariants}
                className={`
                    fixed md:relative inset-y-0 left-0 z-50
                    flex flex-col h-screen
                    bg-slate-900 text-white
                    shadow-2xl border-r border-slate-800
                    overflow-hidden
                `}
            >
                {/* Header / Logo */}
                <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-slate-950/50 shrink-0 relative">
                    <div className="flex items-center gap-3 overflow-hidden whitespace-nowrap">
                        {/* [FIX] Use logo.png instead of gradient box */}
                        <div className="w-10 h-10 flex items-center justify-center shrink-0">
                            <img src="/logo.png" alt="Fixofy" className="w-full h-full object-contain" />
                        </div>
                        <motion.div
                            animate={{ opacity: isOpen ? 1 : 0, width: isOpen ? 'auto' : 0 }}
                            className="font-bold text-xl tracking-wide bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent origin-left"
                        >
                            Fixofy
                        </motion.div>
                    </div>
                </div>

                {/* User Info (Visible only when open) */}
                <motion.div
                    animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                    className="p-6 border-b border-slate-800 shrink-0 overflow-hidden"
                >
                    <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50 backdrop-blur-md">
                        <img
                            src={user?.documents?.photo || user?.photo || "https://ui-avatars.com/api/?name=Technician&background=0D8ABC&color=fff"}
                            alt="Profile"
                            className="w-10 h-10 rounded-full object-cover border-2 border-slate-600"
                        />
                        <div className="overflow-hidden">
                            <h4 className="font-bold text-sm truncate">{user?.name || 'Technician'}</h4>
                            <span className="text-xs text-emerald-400 font-medium px-1.5 py-0.5 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                                {user?.status === 'available' ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                </motion.div>

                {/* Navigation Items */}
                <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    if (window.innerWidth < 768) toggleSidebar();
                                }}
                                className={`
                                    w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden
                                    ${isActive
                                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/20'
                                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    }
                                `}
                                title={!isOpen ? item.label : ''}
                            >
                                <Icon size={22} className={`shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} />

                                <span className={`whitespace-nowrap font-medium transition-all duration-300 ${isOpen ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10 hidden'}`}>
                                    {item.label}
                                </span>

                                {isActive && isOpen && (
                                    <motion.div
                                        layoutId="activeIndicator"
                                        className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Footer / Logout */}
                <div className="p-4 border-t border-slate-800 shrink-0 relative">
                    <button
                        onClick={onLogout}
                        className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-xl 
                            text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 
                            transition-all duration-300 group
                        `}
                        title="Logout"
                    >
                        <LogOut size={22} className="shrink-0 transition-transform group-hover:-translate-x-1" />
                        <span className={`whitespace-nowrap font-medium transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 hidden'}`}>
                            Log Out
                        </span>
                    </button>

                    {/* Toggle Button for Desktop - [FIX] Position adjusted to be inside or overlay correctly */}
                    <button
                        onClick={toggleSidebar}
                        className="hidden md:flex absolute -right-3 top-[-16px] bg-blue-600 text-white w-7 h-7 rounded-full items-center justify-center shadow-lg hover:bg-blue-500 transition-colors z-50 ring-4 ring-slate-50"
                        style={{ right: '-14px', top: '10px' }} // Inline override for precision
                    >
                        <ChevronLeft size={16} className={`transition-transform duration-300 ${!isOpen ? 'rotate-180' : ''}`} />
                    </button>
                </div>
            </motion.aside>
        </>
    );
};

export default TechnicianSidebar;
