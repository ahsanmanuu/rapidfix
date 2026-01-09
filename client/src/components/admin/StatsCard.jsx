import React from 'react';

export const StatsCard = ({ stat }) => {
    const isAlert = !!stat.alert;
    // Map text colors to the background color for high contrast
    const colorClasses = {
        blue: 'text-blue-600',
        purple: 'text-purple-600',
        emerald: 'text-emerald-600',
        rose: 'text-rose-600',
        orange: 'text-orange-600'
    };

    const currentColorClass = colorClasses[stat.color] || 'text-blue-600';

    return (
        <div className={`flex flex-col gap-2 rounded-xl p-6 pl-8 bg-white dark:bg-slate-900 border-2 border-red-600 transition-all hover:translate-y-[-2px] hover:shadow-lg overflow-hidden relative shadow-sm`}>
            <div className="flex justify-between items-start relative z-10">
                <p className={`${currentColorClass} opacity-80 text-xs font-black uppercase tracking-widest`}>{stat.label}</p>
                <div className={`${isAlert ? 'text-orange-500' : currentColorClass}`}>
                    <span className="material-symbols-outlined text-2xl font-bold">{stat.icon}</span>
                </div>
            </div>
            <div className="flex items-baseline gap-2 mt-2 relative z-10">
                <p className="text-slate-900 dark:text-white text-3xl font-black tracking-tight">{stat.value}</p>
                {isAlert ? (
                    <span className="px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-[10px] font-black uppercase tracking-wider">{stat.alert}</span>
                ) : (
                    <p className="text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center">
                        <span className="material-symbols-outlined text-sm">arrow_upward</span> {stat.trend}%
                    </p>
                )}
            </div>
        </div>
    );
};
