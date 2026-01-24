import React from 'react';

export const CompactStatCard = ({ stat }) => {
    const isAlert = !!stat.alert;

    // Minimalist color schemes (border + icon color + subtle bg)
    const colorSchemes = {
        blue: {
            border: 'border-blue-200 dark:border-blue-800',
            icon: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-700 dark:text-blue-300'
        },
        purple: {
            border: 'border-purple-200 dark:border-purple-800',
            icon: 'text-purple-600 dark:text-purple-400',
            bg: 'bg-purple-50 dark:bg-purple-900/20',
            text: 'text-purple-700 dark:text-purple-300'
        },
        emerald: {
            border: 'border-emerald-200 dark:border-emerald-800',
            icon: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-900/20',
            text: 'text-emerald-700 dark:text-emerald-300'
        },
        orange: {
            border: 'border-orange-200 dark:border-orange-800',
            icon: 'text-orange-600 dark:text-orange-400',
            bg: 'bg-orange-50 dark:bg-orange-900/20',
            text: 'text-orange-700 dark:text-orange-300'
        },
        red: {
            border: 'border-red-200 dark:border-red-800',
            icon: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20',
            text: 'text-red-700 dark:text-red-300'
        },
        indigo: {
            border: 'border-indigo-200 dark:border-indigo-800',
            icon: 'text-indigo-600 dark:text-indigo-400',
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            text: 'text-indigo-700 dark:text-indigo-300'
        },
        cyan: {
            border: 'border-cyan-200 dark:border-cyan-800',
            icon: 'text-cyan-600 dark:text-cyan-400',
            bg: 'bg-cyan-50 dark:bg-cyan-900/20',
            text: 'text-cyan-700 dark:text-cyan-300'
        },
        amber: {
            border: 'border-amber-200 dark:border-amber-800',
            icon: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-700 dark:text-amber-300'
        },
        rose: {
            border: 'border-rose-200 dark:border-rose-800',
            icon: 'text-rose-600 dark:text-rose-400',
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            text: 'text-rose-700 dark:text-rose-300'
        },
        slate: {
            border: 'border-slate-200 dark:border-slate-700',
            icon: 'text-slate-600 dark:text-slate-400',
            bg: 'bg-slate-50 dark:bg-slate-800/50',
            text: 'text-slate-700 dark:text-slate-300'
        },
        gray: {
            border: 'border-gray-200 dark:border-gray-700',
            icon: 'text-gray-600 dark:text-gray-400',
            bg: 'bg-gray-50 dark:bg-gray-800/50',
            text: 'text-gray-700 dark:text-gray-300'
        }
    };

    const scheme = colorSchemes[stat.color] || colorSchemes.blue;

    return (
        <div
            className={`
                group relative overflow-hidden
                bg-white dark:bg-slate-900 
                border ${scheme.border} ${isAlert ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-transparent'}
                rounded-xl shadow-sm hover:shadow-lg
                transition-all duration-300 ease-out
                hover:-translate-y-1 p-3
                flex items-center gap-3
            `}
        >
            {/* Icon Container */}
            <div className={`
                p-2 rounded-lg ${scheme.bg} ${scheme.icon}
                transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3
            `}>
                <span className="material-symbols-outlined text-xl">
                    {stat.icon}
                </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <p className="text-gray-500 dark:text-gray-400 text-xs font-semibold uppercase tracking-wider">
                    {stat.label}
                </p>
                <div className="flex items-baseline gap-2">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                        {stat.value}
                    </h4>
                    {stat.alert && (
                        <span className="text-[10px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded-full animate-pulse whitespace-nowrap">
                            {stat.alert}
                        </span>
                    )}
                </div>
            </div>

            {/* Decoration */}
            <div className={`
                absolute -right-4 -bottom-4 w-16 h-16 rounded-full 
                ${scheme.bg} opacity-0 group-hover:opacity-100 
                transition-opacity duration-500 pointer-events-none
             `} />
        </div>
    );
};
