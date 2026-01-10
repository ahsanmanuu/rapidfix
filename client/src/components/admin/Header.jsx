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

export const Header = ({ sidebarOpen, setSidebarOpen, activeTab, onLogout, searchQuery, setSearchQuery }) => {
    const { isDarkMode, currentColor, toggleTheme, setThemeColor } = useTheme();
    const [showThemePopup, setShowThemePopup] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const themePopupRef = useRef(null);
    const userMenuRef = useRef(null);
    const notificationRef = useRef(null);

    // Close popups when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (themePopupRef.current && !themePopupRef.current.contains(event.target)) {
                setShowThemePopup(false);
            }
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Time State
    const [currentTime, setCurrentTime] = useState(new Date());
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Network State
    const [networkStatus, setNetworkStatus] = useState({
        online: navigator.onLine,
        type: 'Wifi', // Default fallback
        downlink: 10 // Default fallback
    });

    useEffect(() => {
        const updateNetwork = () => {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            setNetworkStatus({
                online: navigator.onLine,
                type: connection ? connection.effectiveType.toUpperCase() : 'WIFI',
                downlink: connection ? connection.downlink : 10
            });
        };

        window.addEventListener('online', updateNetwork);
        window.addEventListener('offline', updateNetwork);
        if (navigator.connection) {
            navigator.connection.addEventListener('change', updateNetwork);
        }
        updateNetwork(); // Initial check

        return () => {
            window.removeEventListener('online', updateNetwork);
            window.removeEventListener('offline', updateNetwork);
            if (navigator.connection) {
                navigator.connection.removeEventListener('change', updateNetwork);
            }
        };
    }, []);

    // Location State
    const [location, setLocation] = useState({ city: null, error: null });
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    // Mock reverse geocoding for privacy/no-key usage:
                    // Simple logic to show coords if we can't get city easily without keys
                    // For now, we'll try a public IP-based check as backup or just show Lat/Lng
                    // But to be "cool", let's format it nice:
                    setLocation({ city: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`, error: null });

                    // Optional: Try to fetch city name from free open API
                    try {
                        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                        const data = await res.json();
                        if (data.city || data.locality) {
                            setLocation({ city: data.city || data.locality, error: null });
                        }
                    } catch (e) {
                        // Fallback to coords
                    }
                },
                (error) => {
                    setLocation({ city: null, error: error.message });
                }
            );
        } else {
            setLocation({ city: null, error: "Not supported" });
        }
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

            <div className="flex items-center gap-4 md:gap-6 w-full max-w-5xl">
                <h2 className="text-gray-900 dark:text-white text-lg font-bold leading-tight hidden md:block whitespace-nowrap truncate">
                    {activeTab === 'dashboard' ? 'Dashboard Overview' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </h2>

                {/* Status Bar (Network, Location, Time) */}
                <div className="hidden xl:flex items-center gap-4 bg-gray-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-700">
                    {/* Network */}
                    <div className="flex items-center gap-2" title="Network Strength">
                        <span className={`material-symbols-outlined text-[18px] ${networkStatus.online ? 'text-emerald-500' : 'text-red-500'}`}>
                            {networkStatus.online ? 'signal_cellular_alt' : 'signal_cellular_off'}
                        </span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Network</span>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none">
                                {networkStatus.online ? `${networkStatus.type} (${networkStatus.downlink}Mbps)` : 'Offline'}
                            </span>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-slate-700"></div>

                    {/* Location */}
                    <div className="flex items-center gap-2" title="Current Location">
                        <span className="material-symbols-outlined text-[18px] text-blue-500">near_me</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Location</span>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none max-w-[100px] truncate">
                                {location.error ? 'Location Off' : location.city || 'Locating...'}
                            </span>
                        </div>
                    </div>

                    <div className="w-px h-6 bg-gray-200 dark:bg-slate-700"></div>

                    {/* Time */}
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-purple-500">schedule</span>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Time</span>
                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 leading-none">
                                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex w-full flex-1 items-center rounded-xl h-11 bg-gray-100/50 dark:bg-[#232f48]/50 border border-transparent focus-within:border-primary/30 focus-within:bg-white dark:focus-within:bg-[#1A202C] focus-within:shadow-lg focus-within:shadow-primary/5 transition-all duration-300 px-3 overflow-hidden">
                    <span className="material-symbols-outlined text-gray-400 dark:text-[#92a4c9] text-[20px]">search</span>
                    <input
                        className="w-full bg-transparent text-gray-900 dark:text-white border-none focus:ring-0 placeholder:text-gray-400 dark:placeholder:text-[#92a4c9] px-3 text-sm focus:outline-none h-full truncate"
                        placeholder="Search for job ID, user, or technician..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
                <div className="relative" ref={notificationRef}>
                    <motion.button
                        whileHover={{ scale: 1.05, y: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`flex items-center justify-center rounded-xl size-10 bg-white dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:text-primary hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 shadow-sm ${showNotifications ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : ''}`}
                    >
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        <span className="absolute top-2 right-2.5 size-2 bg-red-500 rounded-full border border-white dark:border-slate-900"></span>
                    </motion.button>

                    <AnimatePresence>
                        {showNotifications && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 8 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 8 }}
                                transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                className="absolute right-0 top-full mt-3 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-blue-500/20 dark:shadow-black/70 border border-slate-200 dark:border-slate-700 backdrop-blur-xl bg-white/95 dark:bg-slate-900/95 p-4 z-50 overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-800 dark:text-white">Notifications</h3>
                                    <button className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">Mark all read</button>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                    {[
                                        { title: 'New Job Request', desc: 'Job #1234 req by John', time: '5m ago', icon: 'work' },
                                        { title: 'Payment Received', desc: '₹1,200 received', time: '1h ago', icon: 'payments' },
                                        { title: 'New User', desc: 'Sarah registered', time: '2h ago', icon: 'person_add' }
                                    ].map((notif, i) => (
                                        <div key={i} className="flex gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer group">
                                            <div className="size-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                <span className="material-symbols-outlined text-sm">{notif.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-slate-800 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{notif.title}</p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400">{notif.desc}</p>
                                                <p className="text-[10px] text-slate-400 mt-1">{notif.time}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

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
