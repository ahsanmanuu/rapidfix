import React from 'react';

export const StatsCard = ({ stat }) => {
    const isAlert = !!stat.alert;

    // Gradient background colors for each theme
    const gradientClasses = {
        blue: 'from-blue-500/10 to-blue-600/5 hover:from-blue-500/20 hover:to-blue-600/10 border-blue-200 dark:border-blue-800',
        purple: 'from-purple-500/10 to-purple-600/5 hover:from-purple-500/20 hover:to-purple-600/10 border-purple-200 dark:border-purple-800',
        emerald: 'from-emerald-500/10 to-emerald-600/5 hover:from-emerald-500/20 hover:to-emerald-600/10 border-emerald-200 dark:border-emerald-800',
        rose: 'from-rose-500/10 to-rose-600/5 hover:from-rose-500/20 hover:to-rose-600/10 border-rose-200 dark:border-rose-800',
        orange: 'from-orange-500/10 to-orange-600/5 hover:from-orange-500/20 hover:to-orange-600/10 border-orange-200 dark:border-orange-800'
    };

    // Icon background colors
    const iconBgClasses = {
        blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
        purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
        emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
        rose: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
        orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
    };

    const textColors = {
        blue: 'text-blue-600 dark:text-blue-400',
        purple: 'text-purple-600 dark:text-purple-400',
        emerald: 'text-emerald-600 dark:text-emerald-400',
        rose: 'text-rose-600 dark:text-rose-400',
        orange: 'text-orange-600 dark:text-orange-400'
    };

    const currentGradient = gradientClasses[stat.color] || gradientClasses.blue;
    const currentIconBg = iconBgClasses[stat.color] || iconBgClasses.blue;
    const currentTextColor = textColors[stat.color] || textColors.blue;

    return (
        <div
            className={`
                relative overflow-hidden rounded-2xl p-6 
                bg-gradient-to-br ${currentGradient}
                bg-white dark:bg-slate-900/50
                border-2
                backdrop-blur-sm
                transition-all duration-300 ease-out
                hover:scale-105 hover:shadow-2xl
                cursor-pointer group
            `}
        >
            {/* Decorative circle */}
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${currentIconBg} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}></div>

            <div className="relative z-10 flex flex-col gap-3">
                {/* Header with icon */}
                <div className="flex items-center justify-between">
                    <div className={`
                        p-3 rounded-xl ${currentIconBg}
                        transform transition-transform duration-300
                        group-hover:rotate-6 group-hover:scale-110
                    `}>
                        <span className="material-symbols-outlined text-3xl font-bold">
                            {stat.icon}
                        </span>
                    </div>

                    {isAlert && (
                        <span className="px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-wider animate-pulse">
                            {stat.alert}
                        </span>
                    )}
                </div>

                {/* Value */}
                <div className="space-y-1">
                    <p className="text-slate-900 dark:text-white text-3xl md:text-4xl font-black tracking-tight truncate">
                        {stat.value}
                    </p>
                    <p className={`${currentTextColor} text-sm font-semibold uppercase tracking-wide truncate`}>
                        {stat.label}
                    </p>
                </div>

                {/* Trend indicator */}
                {!isAlert && stat.trend !== undefined && (
                    <div className="flex items-center gap-1">
                        <span className={`
                            material-symbols-outlined text-sm
                            ${stat.trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
                            animate-bounce
                        `}>
                            {stat.trend >= 0 ? 'arrow_upward' : 'arrow_downward'}
                        </span>
                        <p className={`
                            text-xs font-bold
                            ${stat.trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}
                        `}>
                            {Math.abs(stat.trend)}% from last month
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
