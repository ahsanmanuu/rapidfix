import React, { useState } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';
import useEarningsHub from '../hooks/useEarningsHub';
import { useAuth } from '../context/AuthContext';

const MaterialIcon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const EarningsHub = () => {
    const { user } = useAuth();
    const { stats, earningsData, aiCoach, recentJobs, loading } = useEarningsHub();
    const [timeRange, setTimeRange] = useState('30D');

    if (loading) {
        return (
            <TechnicianLayout title="Earnings Hub">
                <div className="flex items-center justify-center h-[60vh]">
                    <div className="flex flex-col items-center gap-4">
                        <div className="size-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Loading Intelligence...</p>
                    </div>
                </div>
            </TechnicianLayout>
        );
    }

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
            <div className="space-y-6 font-sans text-slate-900">
                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                        {['30D', '90D', 'Year'].map(range => (
                            <button
                                key={range}
                                onClick={() => setTimeRange(range)}
                                className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all ${timeRange === range ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-500 hover:bg-slate-50'}`}
                            >
                                {range}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all hover:shadow-sm">
                            <MaterialIcon name="tune" className="!text-lg text-slate-400" />
                            Filters
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all">
                            <MaterialIcon name="download" className="!text-lg opacity-70" />
                            Export
                        </button>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 p-5 rounded-3xl border-l-[6px] border-l-indigo-500 overflow-hidden group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Projected Net</p>
                            <div className="flex items-baseline flex-wrap gap-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">₹{stats.projectedNet.toLocaleString()}</h3>
                                <span className={`text-xs font-black ${stats.netTrend >= 0 ? 'text-emerald-500' : 'text-rose-500'} bg-slate-50 px-2 py-0.5 rounded-lg`}>
                                    {stats.netTrend >= 0 ? '↑' : '↓'} {Math.abs(stats.netTrend)}%
                                </span>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 p-5 rounded-3xl overflow-hidden group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">Efficiency</p>
                            <div className="flex items-baseline flex-wrap gap-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.efficiency}%</h3>
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg uppercase tracking-wider">{stats.efficiency > 90 ? 'High' : 'Optimal'}</span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.efficiency}%` }}
                                    className="bg-indigo-600 h-full rounded-full shadow-[0_0_10px_rgba(79,70,229,0.3)]"
                                />
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 p-5 rounded-3xl overflow-hidden group">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors">FVR Performance</p>
                            <div className="flex items-baseline flex-wrap gap-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{stats.fvr}%</h3>
                                <span className="text-xs font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg">↑ 3%</span>
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-300 p-5 rounded-3xl border-l-[6px] border-l-amber-400 overflow-hidden group">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 group-hover:text-amber-700 transition-colors">Pending Value</p>
                            <div className="flex items-baseline flex-wrap gap-2">
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter truncate">₹{stats.pendingValue.toLocaleString()}</h3>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">{stats.pendingJobs} jobs</span>
                            </div>
                        </div>
                    </div>

                    {/* Main Content Split */}
                    <div className="col-span-12 lg:col-span-8 space-y-6">
                        {/* Revenue & Forecast Chart */}
                        <div className="bg-white border border-slate-200/60 shadow-sm rounded-[2rem] overflow-hidden hover:shadow-xl transition-all duration-500">
                            <div className="p-6 border-b border-slate-100 flex justify-between items-center flex-wrap gap-4">
                                <div>
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Revenue & Forecast</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Performance vs. AI Projection</p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-indigo-600 shadow-[0_0_8px_rgba(79,70,229,0.4)]"></span>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Actual</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-0.5 border-t-2 border-dashed border-indigo-400"></div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Forecast</span>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 h-64 relative">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={earningsData}>
                                        <defs>
                                            <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fill="url(#grad1)" isAnimationActive={true} />
                                        <Area type="monotone" dataKey="forecast" stroke="#4f46e5" strokeWidth={2} strokeDasharray="6 6" fill="transparent" strokeOpacity={0.3} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px -12px rgb(0 0 0 / 0.15)', padding: '12px 16px' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: '900', color: '#1e293b' }}
                                            labelStyle={{ fontSize: '10px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', marginBottom: '4px' }}
                                            formatter={(val) => [`₹${val.toLocaleString()}`, '']}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-x-10 bottom-4 flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] pointer-events-none">
                                    <span>W1</span><span>W2</span><span>W3</span><span className="text-indigo-600">Forecast</span>
                                </div>
                            </div>
                        </div>

                        {/* Split Row: Earnings Efficiency & Service Quality */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-slate-200/60 shadow-sm rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6">Earnings Efficiency</h4>
                                <div className="h-40 border-l-2 border-b-2 border-slate-100 relative mb-6 min-w-0">
                                    <div className="absolute rounded-full border-2 border-white cursor-pointer hover:scale-150 transition-all duration-300 size-3 bg-indigo-600 left-[25%] bottom-[40%] shadow-lg shadow-indigo-200" title={`₹${(stats.projectedNet * 0.1).toFixed(0)} @ 4h`}></div>
                                    <div className="absolute rounded-full border-2 border-white cursor-pointer hover:scale-150 transition-all duration-300 size-4 bg-indigo-500/60 left-[65%] bottom-[75%] shadow-lg shadow-indigo-100" title={`₹${(stats.projectedNet * 0.25).toFixed(0)} @ 8h`}></div>
                                    <div className="absolute rounded-full border-2 border-white cursor-pointer hover:scale-150 transition-all duration-300 size-2.5 bg-amber-500 left-[15%] bottom-[20%] shadow-lg shadow-amber-100" title={`₹${(stats.projectedNet * 0.05).toFixed(0)} @ 2h`}></div>
                                    <div className="absolute rounded-full border-2 border-white cursor-pointer hover:scale-150 transition-all duration-300 size-3.5 bg-emerald-500 left-[80%] bottom-[85%] shadow-lg shadow-emerald-100" title={`₹${(stats.projectedNet * 0.15).toFixed(0)} @ 10h`}></div>
                                    <div className="absolute -left-10 top-0 h-full flex flex-col justify-between text-[9px] font-black text-slate-300 py-1 uppercase tracking-tighter">
                                        <span>₹5k</span><span>₹0</span>
                                    </div>
                                    <div className="absolute -bottom-6 left-0 w-full flex justify-between text-[9px] font-black text-slate-300 px-1 uppercase tracking-[0.2em]">
                                        <span>0h</span><span>12h+</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white border border-slate-200/60 shadow-sm rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-4">Service Quality</h4>
                                <div className="relative size-40 mx-auto">
                                    <svg className="w-full h-full drop-shadow-2xl" viewBox="0 0 100 100">
                                        <polygon className="text-slate-50" fill="currentColor" points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="none"></polygon>
                                        <polygon className="text-slate-200" fill="none" points="50,5 95,25 95,75 50,95 5,75 5,25" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 2"></polygon>
                                        <motion.polygon
                                            initial={{ scale: 0 }}
                                            animate={{ scale: 1 }}
                                            className="text-indigo-600/20"
                                            fill="currentColor"
                                            points={`50,${25 - (stats.speed * 2)} 85,35 78,70 50,${75 + (stats.safety * 2)} 30,65 18,40`}
                                            stroke="#4f46e5"
                                            strokeWidth="2"
                                        />
                                    </svg>
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-900 tracking-widest">SPEED</span>
                                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 text-[8px] font-black text-emerald-600 tracking-widest">SAFETY</span>
                                </div>
                            </div>
                        </div>

                        {/* Peak Performance Hours */}
                        <div className="bg-white border border-slate-200/60 shadow-sm rounded-[2rem] p-6 hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center justify-between mb-6">
                                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em]">Peak Performance Hours</h4>
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Quiet</span>
                                    <div className="flex gap-1">
                                        <div className="size-2.5 bg-indigo-50 rounded-sm"></div>
                                        <div className="size-2.5 bg-indigo-300 rounded-sm"></div>
                                        <div className="size-2.5 bg-indigo-600 rounded-sm shadow-[0_0_5px_rgba(79,70,229,0.3)]"></div>
                                        <div className="size-2.5 bg-indigo-900 rounded-sm shadow-[0_0_8px_rgba(49,46,129,0.4)]"></div>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Peak</span>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex flex-col justify-between text-[9px] font-black text-slate-300 uppercase tracking-tighter pr-2">
                                    <span>Mon</span><span>Fri</span>
                                </div>
                                <div className="flex-1 grid grid-cols-24 gap-1">
                                    {(stats.peakHours?.hourly || Array(24).fill(0)).map((val, i) => {
                                        const intensity = val === 0 ? 'bg-indigo-50' :
                                            val < 2 ? 'bg-indigo-300' :
                                                val < 4 ? 'bg-indigo-600' : 'bg-indigo-900';
                                        return (
                                            <div
                                                key={i}
                                                className={`aspect-square rounded-[6px] ${intensity} transition-all duration-500 hover:scale-125 cursor-help shadow-sm hover:shadow-md`}
                                                title={`${i}:00 - ${val} jobs`}
                                            ></div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: AI Coach & Status */}
                    <div className="col-span-12 lg:col-span-4 space-y-6">
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                                <MaterialIcon name="bolt" className="!text-8xl" />
                            </div>
                            <div className="flex items-center gap-3 mb-8">
                                <div className="size-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/20">
                                    <MaterialIcon name="psychology" className="!text-xl" />
                                </div>
                                <h3 className="text-xs font-black uppercase tracking-[0.3em]">AI Coach</h3>
                            </div>
                            <div className="flex items-center gap-6 mb-10">
                                <div className="relative size-20 shrink-0">
                                    <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                                        <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3"></circle>
                                        <motion.circle
                                            initial={{ strokeDasharray: "0, 100" }}
                                            animate={{ strokeDasharray: `${stats.growthPotential}, 100` }}
                                            cx="18" cy="18" r="16" fill="none" stroke="#4f46e5" strokeLinecap="round" strokeWidth="3"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-base font-black tracking-tighter">+{stats.growthPotential}%</span>
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Growth Potential</p>
                                    <p className="text-xs text-slate-400 font-bold leading-relaxed">Based on job clustering & route optimization.</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                {aiCoach.map(item => (
                                    <div key={item.id} className="p-4 bg-white/[0.03] border border-white/[0.05] rounded-[1.5rem] group/card hover:bg-white/5 transition-all">
                                        <div className="flex gap-4 mb-3">
                                            <MaterialIcon name={item.icon} className={`text-${item.color}-500 !text-2xl opacity-80`} />
                                            <div className="min-w-0">
                                                <p className="text-xs font-black tracking-tight">{item.title}</p>
                                                <p className="text-[10px] text-slate-400 font-bold mt-1 leading-tight">{item.message}</p>
                                            </div>
                                        </div>
                                        {item.action && (
                                            <button className="w-full py-2.5 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/40">
                                                {item.action}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white border border-slate-200/60 shadow-sm rounded-[2rem] p-6 hover:shadow-xl transition-all">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="size-8 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                    <MaterialIcon name="stars" className="!text-lg" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Region Status</span>
                            </div>
                            <p className="text-xs font-bold text-slate-600 leading-relaxed">{stats.regionMessage}</p>
                        </div>
                    </div>

                    {/* Job History Table */}
                    <div className="col-span-12 bg-white border border-slate-200/60 shadow-xl rounded-[2.5rem] overflow-hidden mb-12">
                        <div className="p-6 border-b border-slate-50 flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Recent Activity Log</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Transaction transparency</p>
                            </div>
                            <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all">
                                <MaterialIcon name="download" className="!text-lg text-slate-400" />
                                Export CSV
                            </button>
                        </div>
                        <div className="overflow-x-auto min-w-0">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Service Logic</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Workflow State</th>
                                        <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Revenue</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {recentJobs.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-8 py-12 text-center text-xs font-black text-slate-300 uppercase tracking-[0.3em]">
                                                Null Activity Found
                                            </td>
                                        </tr>
                                    ) : (
                                        recentJobs.map(job => (
                                            <tr key={job.id} className="hover:bg-indigo-50/30 transition-all cursor-pointer group">
                                                <td className="px-8 py-5 text-xs font-black text-slate-900 tracking-tighter">HEX_{job.id}</td>
                                                <td className="px-8 py-5 text-xs font-bold text-slate-600 uppercase tracking-tight">{job.service}</td>
                                                <td className="px-8 py-5">
                                                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black tracking-widest border 
                                                        ${job.status === 'DONE' ? 'bg-emerald-50 text-emerald-600 border-emerald-500/20' :
                                                            job.status === 'VOID' ? 'bg-rose-50 text-rose-600 border-rose-500/10' :
                                                                'bg-amber-50 text-amber-600 border-amber-500/20'}`}>
                                                        {job.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 text-xs font-black text-right text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    ₹{job.revenue.toLocaleString()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Logic Status */}
                <footer className="flex items-center justify-between pb-10 border-t border-slate-100 pt-8 opacity-60">
                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-lg flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest">Engine Nominal</span>
                        </div>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Link Latency: {Math.floor(Math.random() * 5 + 10)}ms</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.4em]">ProService Intelligence • v2.0.4</p>
                </footer>
            </div>
        </TechnicianLayout>
    );
};

export default EarningsHub;
