import React from 'react';

export const StatsCard = ({ stat }) => {
    const isAlert = !!stat.alert;

    return (
        <div className={`flex flex-col gap-2 rounded-xl p-5 bg-white dark:bg-card-dark border transition-all hover:translate-y-[-2px] hover:shadow-lg overflow-hidden relative ${isAlert ? 'border-orange-500/30' : 'border-gray-200 dark:border-white/5 shadow-sm dark:shadow-none'}`}>
            {isAlert && <div className="absolute top-0 right-0 w-16 h-16 bg-orange-500/10 rounded-bl-full -mr-4 -mt-4"></div>}
            <div className="flex justify-between items-start relative z-10">
                <p className="text-blue-600/80 dark:text-blue-400/80 text-sm font-bold uppercase tracking-wide">{stat.label}</p>
                <div className={`p-1.5 rounded-md ${isAlert ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}`}>
                    <span className="material-symbols-outlined text-lg">{stat.icon}</span>
                </div>
            </div>
            <div className="flex items-baseline gap-2 mt-1 relative z-10">
                <p className="text-gray-900 dark:text-white text-2xl font-bold">{stat.value}</p>
                {isAlert ? (
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px] font-bold uppercase tracking-wider">{stat.alert}</span>
                ) : (
                    <p className="text-green-600 dark:text-accent-green text-xs font-medium flex items-center">
                        <span className="material-symbols-outlined text-sm">arrow_upward</span> {stat.trend}%
                    </p>
                )}
            </div>
        </div>
    );
};
