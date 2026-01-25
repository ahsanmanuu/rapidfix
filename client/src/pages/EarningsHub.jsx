import React, { useState } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// Custom Icons as simple SVGs to match reference precisely where lucide might differ
// or just use material symbols classes since they are available.
const MaterialIcon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const EarningsHub = () => {
    // Mock Data
    const earningsData = [
        { name: 'W1', value: 4000, forecast: 4500 },
        { name: 'W2', value: 6000, forecast: 5500 },
        { name: 'W3', value: 8000, forecast: 9000 },
        { name: 'W4', value: 7500, forecast: 9500 },
        { name: 'W5', value: 9000, forecast: 10000 },
        { name: 'W6', value: 10000, forecast: 11000 },
    ];

    const HeaderActions = (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 border border-emerald-100 rounded-full">
                <span className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                <span className="text-[9px] font-bold text-emerald-700 uppercase">Live</span>
            </div>
            <div className="relative hidden sm:block">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-400 !text-base">search</span>
                <input className="pl-8 pr-3 py-1.5 bg-slate-100 border-none rounded-full text-xs w-48 focus:ring-1 focus:ring-indigo-500/20 transition-all outline-none" placeholder="Search data..." type="text" />
            </div>
        </div>
    );

    return (
        <TechnicianLayout title="Earnings Hub" headerActions={HeaderActions}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-slate-900 bg-slate-50">
                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button className="px-3 py-1 rounded text-[11px] font-bold bg-indigo-600 text-white">30D</button>
                        <button className="px-3 py-1 rounded text-[11px] font-semibold text-slate-500 hover:bg-slate-50">90D</button>
                        <button className="px-3 py-1 rounded text-[11px] font-semibold text-slate-500 hover:bg-slate-50">Year</button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50">
                            <MaterialIcon name="tune" className="!text-base" />
                            Filters
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold shadow-sm hover:bg-slate-800">
                            <MaterialIcon name="download" className="!text-base" />
                            Export
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 p-3 rounded-xl border-l-4 border-l-indigo-500">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Projected Net</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-black text-slate-900">$14,820</h3>
                                <span className="text-[10px] font-bold text-emerald-500">↑ 18%</span>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 p-3 rounded-xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">Efficiency</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-black text-slate-900">94.8%</h3>
                                <span className="text-[10px] font-bold text-indigo-600">High</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1 rounded-full mt-2">
                                <div className="bg-indigo-600 h-full rounded-full" style={{ width: '94%' }}></div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 p-3 rounded-xl">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">FVR Performance</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-black text-slate-900">92.4%</h3>
                                <span className="text-[10px] font-bold text-emerald-500">↑ 3%</span>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm hover:shadow-md transition-shadow duration-200 p-3 rounded-xl border-l-4 border-l-amber-400">
                            <p className="text-[9px] font-black text-amber-600 uppercase tracking-wider mb-1">Pending Value</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-xl font-black text-slate-900">$3,240</h3>
                                <span className="text-[10px] font-bold text-slate-400">6 jobs</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Split */}
                    <div className="col-span-12 lg:col-span-8 space-y-4">
                        {/* Revenue & Forecast Chart */}
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-xl overflow-hidden">
                            <div className="p-3 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-xs font-bold text-slate-800">Revenue & Forecast</h3>
                                    <p className="text-[10px] font-medium text-slate-500">Performance vs. AI Projection</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-1">
                                        <span className="size-1.5 rounded-full bg-indigo-600"></span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Actual</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="w-3 h-0.5 border-t border-dashed border-indigo-600"></span>
                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Forecast</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 h-40 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={earningsData}>
                                        <defs>
                                            <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} fill="url(#grad1)" />
                                        <Area type="monotone" dataKey="forecast" stroke="#4f46e5" strokeWidth={2} strokeDasharray="4 4" fill="transparent" strokeOpacity={0.4} />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-x-4 bottom-0 flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                                    <span>W1</span><span>W2</span><span>W3</span><span className="text-indigo-600">Forecast</span>
                                </div>
                            </div>
                        </div>

                        {/* Split Row: Earnings Efficiency & Service Quality */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-xl p-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Earnings Efficiency</h4>
                                <div className="h-36 border-l border-b border-slate-200 relative mb-4">
                                    <div className="absolute rounded-full border border-white cursor-pointer hover:scale-125 transition-all duration-200 size-2.5 bg-indigo-600 left-[25%] bottom-[40%]" title="$1.2k @ 4h"></div>
                                    <div className="absolute rounded-full border border-white cursor-pointer hover:scale-125 transition-all duration-200 size-3 bg-indigo-600/60 left-[65%] bottom-[75%]"></div>
                                    <div className="absolute rounded-full border border-white cursor-pointer hover:scale-125 transition-all duration-200 size-2 bg-amber-500 left-[15%] bottom-[20%]"></div>
                                    <div className="absolute rounded-full border border-white cursor-pointer hover:scale-125 transition-all duration-200 size-2.5 bg-emerald-500 left-[80%] bottom-[85%]"></div>
                                    <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-[8px] font-bold text-slate-400 py-1">
                                        <span>$3k</span><span>$0</span>
                                    </div>
                                    <div className="absolute -bottom-4 left-0 w-full flex justify-between text-[8px] font-bold text-slate-400 px-1">
                                        <span>0h</span><span>12h+</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-xl p-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Service Quality</h4>
                                <div className="relative size-32 mx-auto">
                                    <svg className="w-full h-full" viewBox="0 0 100 100">
                                        <polygon className="text-slate-100" fill="none" points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="currentColor" strokeWidth="0.5"></polygon>
                                        <polygon className="text-indigo-600/20" fill="currentColor" points="50,15 85,35 78,70 50,85 30,65 18,40" stroke="#4f46e5" strokeWidth="1"></polygon>
                                    </svg>
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[7px] font-black">SPEED</span>
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[7px] font-black text-emerald-600">SAFETY</span>
                                </div>
                            </div>
                        </div>

                        {/* Peak Performance Hours */}
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-xl p-3">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peak Performance Hours</h4>
                                <div className="flex items-center gap-2">
                                    <span className="text-[8px] text-slate-400">Quiet</span>
                                    <div className="flex gap-0.5">
                                        <div className="size-2 bg-indigo-50 rounded-[1px]"></div>
                                        <div className="size-2 bg-indigo-300 rounded-[1px]"></div>
                                        <div className="size-2 bg-indigo-600 rounded-[1px]"></div>
                                        <div className="size-2 bg-indigo-900 rounded-[1px]"></div>
                                    </div>
                                    <span className="text-[8px] text-slate-400">Peak</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <div className="flex flex-col justify-between text-[8px] font-bold text-slate-400 uppercase pr-1">
                                    <span>Mon</span><span>Fri</span>
                                </div>
                                <div className="flex-1 grid grid-cols-24 gap-0.5">
                                    {Array.from({ length: 24 }).map((_, i) => (
                                        <div key={i} className={`aspect-square rounded-[1px] ${i % 3 === 0 ? 'bg-indigo-600' : 'bg-indigo-100'}`}></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Coach & Status */}
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                        <div className="bg-slate-900 rounded-xl p-4 text-white shadow-lg relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                                <MaterialIcon name="bolt" className="!text-6xl" />
                            </div>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="size-6 bg-indigo-600 rounded flex items-center justify-center">
                                    <MaterialIcon name="psychology" className="!text-sm" />
                                </div>
                                <h3 className="text-[11px] font-black uppercase tracking-widest">AI Coach</h3>
                            </div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="relative size-16 shrink-0">
                                    <svg className="size-full" viewBox="0 0 36 36">
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3"></path>
                                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#4f46e5" strokeDasharray="75, 100" strokeLinecap="round" strokeWidth="3"></path>
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-xs font-black">+24%</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase leading-none mb-1">Potential Growth</p>
                                    <p className="text-[11px] text-slate-300">Based on job clustering & route efficiency.</p>
                                </div>
                            </div>
                            <div className="space-y-2.5">
                                <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg group">
                                    <div className="flex gap-2.5 mb-2">
                                        <MaterialIcon name="route" className="text-indigo-600 !text-lg" />
                                        <div>
                                            <p className="text-[11px] font-bold">Cluster West Heights</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Save 45m travel time today.</p>
                                        </div>
                                    </div>
                                    <button className="w-full py-1.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-md hover:bg-indigo-600/90 transition-colors">
                                        Activate
                                    </button>
                                </div>
                                <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg">
                                    <div className="flex gap-2.5">
                                        <MaterialIcon name="school" className="text-emerald-500 !text-lg" />
                                        <div>
                                            <p className="text-[11px] font-bold">Smart Home Wiring</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Cert boost: <span className="text-emerald-500">+15% job value</span></p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-2.5 bg-white/5 border border-white/10 rounded-lg">
                                    <div className="flex gap-2.5">
                                        <MaterialIcon name="event_available" className="text-amber-500 !text-lg" />
                                        <div>
                                            <p className="text-[11px] font-bold">Peak Alert: Thu 6PM</p>
                                            <p className="text-[10px] text-slate-400 mt-0.5">Premium predicted: <span className="text-amber-500">+12%</span></p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-3">
                                <MaterialIcon name="stars" className="text-indigo-600 !text-base" />
                                <span className="text-[10px] font-black uppercase">Region Status</span>
                            </div>
                            <p className="text-[11px] font-medium text-slate-600 leading-tight">You are in the <span className="text-slate-900 font-bold">Top 5%</span> of technicians this week. Efficiency leads the market by 12%.</p>
                        </div>
                    </div>

                    {/* Job History Table */}
                    <div className="col-span-12 bg-white/80 backdrop-blur-sm border border-slate-200/60 shadow-sm rounded-xl overflow-hidden mb-8">
                        <div className="p-3 border-b border-slate-100 flex items-center justify-between">
                            <div>
                                <h3 className="text-xs font-bold text-slate-800">Job History</h3>
                            </div>
                            <button className="flex items-center gap-1.5 px-2.5 py-1 border border-slate-200 rounded-md text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50">
                                <MaterialIcon name="download" className="!text-sm" />
                                CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/80 border-b border-slate-100">
                                    <tr>
                                        <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase">Job ID</th>
                                        <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase">Service</th>
                                        <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase">Status</th>
                                        <th className="px-4 py-2 text-[9px] font-black text-slate-400 uppercase text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                        <td className="px-4 py-2.5 text-[11px] font-bold">#5502</td>
                                        <td className="px-4 py-2.5 text-[11px] text-slate-700">Panel Upgrade</td>
                                        <td className="px-4 py-2.5">
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">DONE</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[11px] font-black text-right">$1,450</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                        <td className="px-4 py-2.5 text-[11px] font-bold">#5501</td>
                                        <td className="px-4 py-2.5 text-[11px] text-slate-700">Leak Repair</td>
                                        <td className="px-4 py-2.5">
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-rose-50 text-rose-600 border border-rose-100">VOID</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[11px] font-black text-right text-slate-400">$0</td>
                                    </tr>
                                    <tr className="hover:bg-slate-50/50 transition-colors cursor-pointer">
                                        <td className="px-4 py-2.5 text-[11px] font-bold">#5498</td>
                                        <td className="px-4 py-2.5 text-[11px] text-slate-700">EV Charger</td>
                                        <td className="px-4 py-2.5">
                                            <span className="px-2 py-0.5 rounded-full text-[8px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">HOLD</span>
                                        </td>
                                        <td className="px-4 py-2.5 text-[11px] font-black text-right">$220</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="flex items-center justify-between pb-4 border-t border-slate-200 pt-4 shrink-0">
                    <div className="flex items-center gap-2">
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Engine: Nominal / 14ms</p>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">PROSERVICE INTELLIGENCE</p>
                </footer>
            </div>
        </TechnicianLayout>
    );
};

export default EarningsHub;
