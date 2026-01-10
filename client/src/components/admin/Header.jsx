import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_COLORS = [
    { name: 'Blue', color: '#135bec' },
    { name: 'Green', color: '#0bda5e' },
    { name: 'Purple', color: '#9333ea' },
    { name: 'Orange', color: '#f97316' },
    { name: 'Rose', color: '#f43f5e' },
];

import { useTheme } from '../../context/ThemeContext';

export const Header = ({ sidebarOpen, setSidebarOpen, activeTab, onLogout }) => {
    const { isDarkMode, currentColor, toggleTheme, setThemeColor } = useTheme();
    const [showThemePopup, setShowThemePopup] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const themePopupRef = useRef(null);
    const userMenuRef = useRef(null);

    // Close popups when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (themePopupRef.current && !themePopupRef.current.contains(event.target)) {
                setShowThemePopup(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="sticky top-0 z-40 flex-shrink-0 flex items-center justify-between border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 md:px-6 py-4 transition-colors duration-300">
            {/* ... (sidebar toggle and search) ... */}
            <div className="flex items-center gap-4 lg:hidden">
                <button
                    className="p-2 -ml-2 rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    <span className="material-symbols-outlined">menu</span>
                </button>
            </div>

            <div className="flex items-center gap-4 md:gap-6 w-full max-w-2xl">
                <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight hidden md:block whitespace-nowrap truncate">
                    {activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>
                <div className="flex w-full flex-1 items-center rounded-xl h-11 bg-gray-100/50 dark:bg-[#232f48]/50 border border-transparent focus-within:border-primary/30 focus-within:bg-white dark:focus-within:bg-[#1A202C] focus-within:shadow-lg focus-within:shadow-primary/5 transition-all duration-300 px-3 overflow-hidden">
                    <span className="material-symbols-outlined text-gray-400 dark:text-[#92a4c9] text-[20px]">search</span>
                    <input
                        className="w-full bg-transparent text-gray-900 dark:text-white border-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-[#92a4c9] px-3 text-sm focus:outline-none h-full truncate"
                        placeholder="Search for job ID, user, or technician..."
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                <motion.button
                    whileHover={{ scale: 1.05, y: -1 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center justify-center rounded-xl size-10 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 shadow-sm"
                >
                    <span className="material-symbols-outlined text-[20px]">notifications</span>
                </motion.button>

                <div className="relative" ref={themePopupRef}>
                    <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowThemePopup(!showThemePopup)}
                        className={`flex items-center justify-center rounded-xl size-10 border transition-all duration-300 shadow-sm ${showThemePopup
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-white dark:bg-slate-800/50 border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px]">palette</span>
                    </motion.button>

                    <AnimatePresence>
                        {showThemePopup && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className="absolute right-0 top-full mt-3 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-blue-500/20 dark:shadow-black/70 border border-slate-200 dark:border-slate-700 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 p-5 z-50 flex flex-col gap-6"
                            >
                                <div className="flex items-center justify-between">
                                    <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-black text-sm tracking-wide">Appearance</span>
                                    <button
                                        onClick={() => setShowThemePopup(false)}
                                        className="size-6 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                </div>

                                {/* Theme Toggle (Segmented Control) */}
                                <div className="space-y-2.5">
                                    <span className="text-[11px] font-bold text-primary uppercase tracking-widest pl-1">Mode</span>
                                    <div className="grid grid-cols-2 bg-gray-50 dark:bg-slate-800/50 p-1.5 rounded-xl border border-gray-100 dark:border-slate-800 relative isolate">
                                        <motion.div
                                            layout
                                            className="absolute top-1.5 bottom-1.5 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-gray-200/50 dark:border-slate-600 z-0"
                                            initial={false}
                                            animate={{
                                                x: isDarkMode ? '100%' : '0%',
                                                width: '50%'
                                            }}
                                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                        />

                                        <button
                                            onClick={() => toggleTheme('light')}
                                            className={`relative z-10 flex items-center justify-center gap-2 py-1.5 rounded-lg transition-colors text-xs font-semibold ${!isDarkMode ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                                        >
                                            <span className="material-symbols-outlined text-[16px] filled">light_mode</span>
                                            Light
                                        </button>
                                        <button
                                            onClick={() => toggleTheme('dark')}
                                            className={`relative z-10 flex items-center justify-center gap-2 py-1.5 rounded-lg transition-colors text-xs font-semibold ${isDarkMode ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-300'}`}
                                        >
                                            <span className="material-symbols-outlined text-[16px] filled">dark_mode</span>
                                            Dark
                                        </button>
                                    </div>
                                </div>

                                {/* Color Picker */}
                                <div className="space-y-2.5">
                                    <div className="flex justify-between items-center px-1">
                                        <span className="text-[11px] font-bold text-primary uppercase tracking-widest">Accent</span>
                                        <span className="text-[10px] text-white bg-primary px-2 py-0.5 rounded-md font-bold shadow-sm shadow-primary/20 truncate max-w-[80px]">
                                            {currentColor}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between gap-1">
                                        {THEME_COLORS.map((c) => {
                                            const isActive = currentColor === c.name.toLowerCase();
                                            return (
                                                <button
                                                    key={c.name}
                                                    onClick={() => setThemeColor(c.name.toLowerCase())}
                                                    className={`group relative size-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${isActive ? 'scale-110' : 'hover:scale-105 opacity-80 hover:opacity-100'}`}
                                                >
                                                    {isActive && (
                                                        <motion.div
                                                            layoutId="activeColorRing"
                                                            className="absolute inset-0 rounded-full ring-[2px] ring-primary ring-offset-2 ring-offset-white dark:ring-offset-[#0f172a]"
                                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                                        />
                                                    )}
                                                    <div
                                                        className={`size-full rounded-full border border-gray-100 dark:border-white/10 shadow-sm ${isActive ? 'ring-0' : 'ring-1 ring-inset ring-black/5 dark:ring-white/5'}`}
                                                        style={{ backgroundColor: c.color }}
                                                    />
                                                    {isActive && (
                                                        <motion.span
                                                            initial={{ scale: 0, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            className="material-symbols-outlined text-white text-[14px] font-bold drop-shadow-md absolute inset-0 flex items-center justify-center"
                                                        >
                                                            check
                                                        </motion.span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* User Menu with Logout */}
                <div className="relative" ref={userMenuRef}>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowUserMenu(!showUserMenu)}
                        className={`flex items-center justify-center rounded-xl size-10 border transition-all duration-300 shadow-sm ${showUserMenu
                            ? 'bg-primary border-primary text-white shadow-lg shadow-primary/30'
                            : 'bg-gradient-to-br from-blue-500 to-purple-600 border-blue-400 text-white hover:shadow-lg hover:shadow-blue-500/30'
                            }`}
                    >
                        <span className="material-symbols-outlined text-[20px] font-bold">person</span>
                    </motion.button>

                    <AnimatePresence>
                        {showUserMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className="absolute right-0 top-full mt-3 w-56 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-blue-500/20 dark:shadow-black/70 border border-slate-200 dark:border-slate-700 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 overflow-hidden z-50"
                            >
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">Admin User</p>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 truncate">admin@fixofy.com</p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <button className="w-full px-4 py-2 flex items-center gap-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">person</span>
                                        Profile
                                    </button>
                                    <button className="w-full px-4 py-2 flex items-center gap-3 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <span className="material-symbols-outlined text-[18px]">settings</span>
                                        Settings
                                    </button>
                                </div>

                                {/* Logout Button */}
                                <div className="p-2 border-t border-gray-100 dark:border-slate-700">
                                    <button
                                        onClick={onLogout}
                                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-sm hover:from-red-600 hover:to-rose-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-red-500/30"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">logout</span>
                                        Log Out
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
};
