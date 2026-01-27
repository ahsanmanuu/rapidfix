import React, { useState } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import useEarningsHub from '../hooks/useEarningsHub';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Wallet, CheckCircle, BarChart3, ArrowUpRight, ArrowDownRight, Zap, Target, Star, BrainCircuit } from 'lucide-react';

const GlassCard = ({ children, className = "", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        className={`bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl overflow-hidden hover:border-white/10 hover:bg-slate-800/50 transition-all duration-500 group relative ${className}`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        {children}
    </motion.div>
);

const MetricCard = ({ title, value, trend, trendLabel, icon: Icon, color = "indigo", delay = 0 }) => (
    <GlassCard className="p-6 relative overflow-hidden" delay={delay}>
        <div className={`absolute top-0 right-0 p-4 opacity-[0.03] text-${color}-400 group-hover:scale-110 group-hover:opacity-10 transition-all duration-500`}>
            <Icon size={80} strokeWidth={1} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
                <div className={`size-10 rounded-xl bg-${color}-500/10 flex items-center justify-center border border-${color}-500/20 group-hover:border-${color}-500/40 transition-colors`}>
                    <Icon size={20} className={`text-${color}-400 group-hover:text-${color}-300 transition-colors`} />
                </div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">{title}</h3>
            </div>
            <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-white tracking-tight group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-slate-300 transition-all">
                    {value}
                </span>
            </div>
            {trend && (
                <div className="flex items-center gap-2 mt-2">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${trend >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                        {trend >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />} {Math.abs(trend)}%
                    </span>
                    <span className="text-[10px] font-medium text-slate-500">{trendLabel}</span>
                </div>
            )}
        </div>
    </GlassCard>
);

const EarningsHub = () => {
    const { user } = useAuth();
    const [timeRange, setTimeRange] = useState('30D');
    const { stats, earningsData, aiCoach, recentJobs, loading } = useEarningsHub(timeRange);

    if (loading) {
        return (
            <TechnicianLayout title="Earnings Hub">
                <div className="flex items-center justify-center h-[80vh] bg-slate-950">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="size-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="size-2 bg-indigo-500 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] animate-pulse">Loading Analytics...</p>
                    </div>
                </div>
            </TechnicianLayout>
        );
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const HeaderActions = (
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 pl-3 pr-4 py-1.5 bg-slate-900/80 border border-slate-800 rounded-full shadow-lg backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Live Updates</span>
            </div>
        </div>
    );

    return (
        <TechnicianLayout title="Earnings Hub" headerActions={HeaderActions}>
            <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-12">

                {/* Decorative Background Elements */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/5 rounded-full blur-[120px] mix-blend-screen"></div>
                </div>

                <div className="relative max-w-7xl mx-auto space-y-8 px-1">

                    {/* Controls Row */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                        <div className="flex p-1 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-lg shadow-xl">
                            {['7D', '30D', '90D', 'YTD'].map((range) => (
                                <button
                                    key={range}
                                    onClick={() => setTimeRange(range)}
                                    className={`relative px-6 py-2 rounded-xl text-xs font-bold transition-all duration-300 ${timeRange === range
                                        ? 'text-white'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    {timeRange === range && (
                                        <motion.div
                                            layoutId="activeRange"
                                            className="absolute inset-0 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30"
                                        />
                                    )}
                                    <span className="relative z-10">{range}</span>
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:border-slate-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                                <TrendingUp size={16} />
                                <span>Filters</span>
                            </button>
                            <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-900/50 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all">
                                <ArrowDownRight size={16} />
                                <span>Export Report</span>
                            </button>
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <MetricCard
                            title="Total Earnings"
                            value={formatCurrency(stats.projectedNet || 0)}
                            trend={stats.netTrend}
                            trendLabel="vs last month"
                            icon={Wallet}
                            color="emerald"
                            delay={0.1}
                        />
                        <MetricCard
                            title="Efficiency Score"
                            value={`${stats.efficiency}%`}
                            trend={2.4}
                            trendLabel="Optimization"
                            icon={Zap}
                            color="indigo"
                            delay={0.2}
                        />
                        <MetricCard
                            title="Active Jobs"
                            value={stats.pendingJobs}
                            icon={Target}
                            color="amber"
                            delay={0.3}
                            trendLabel="In pipeline"
                        />
                        <MetricCard
                            title="Customer Rating"
                            value={stats.safety || "5.0"}
                            icon={Star}
                            color="cyan"
                            delay={0.4}
                            trendLabel="Top 5% Peer"
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-12 gap-8">
                        {/* Main Revenue Chart */}
                        <GlassCard className="col-span-12 lg:col-span-8 p-8 min-h-[400px]" delay={0.5}>
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-white tracking-tight mb-1">Revenue Performance</h3>
                                    <p className="text-xs font-medium text-slate-400">Actual Earnings vs AI Projection</p>
                                </div>
                                <div className="flex gap-6">
                                    <div className="flex items-center gap-2">
                                        <span className="size-2.5 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"></span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="size-2.5 rounded-full bg-slate-700 border border-slate-600"></span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Baseline</span>
                                    </div>
                                </div>
                            </div>

                            <div className="h-[300px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={earningsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                        <XAxis
                                            dataKey="name"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                                            tickFormatter={(value) => `₹${value / 1000}k`}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                                                borderColor: 'rgba(255,255,255,0.1)',
                                                backdropFilter: 'blur(8px)',
                                                borderRadius: '12px',
                                                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
                                            }}
                                            itemStyle={{ color: '#fff', fontWeight: 700, fontSize: '12px' }}
                                            labelStyle={{ color: '#94a3b8', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}
                                            cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                            formatter={(value) => [`₹${(value || 0).toLocaleString()}`, 'Revenue']}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="value"
                                            stroke="#6366f1"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorRevenue)"
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </GlassCard>

                        {/* Right Column: AI Coach */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <GlassCard className="p-0 overflow-hidden" delay={0.6}>
                                <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900/50 p-6 border-b border-white/5">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="size-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shadow-lg shadow-indigo-900/20">
                                            <BrainCircuit size={24} />
                                        </div>
                                        <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                                            Active
                                        </div>
                                    </div>
                                    <h3 className="text-lg font-black text-white tracking-tight mb-1">AI Performance Coach</h3>
                                    <p className="text-xs text-indigo-300/80 font-medium">Real-time optimization suggestions</p>
                                </div>
                                <div className="p-6 space-y-4">
                                    {aiCoach.length === 0 ? (
                                        <div className="text-center py-6">
                                            <p className="text-xs text-slate-500">No active suggestions.</p>
                                        </div>
                                    ) : (
                                        aiCoach.map((item, idx) => (
                                            <motion.div
                                                key={item.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                transition={{ delay: 0.7 + (idx * 0.1) }}
                                                className="group relative pl-4 border-l-2 border-slate-700 hover:border-indigo-500 transition-colors duration-300"
                                            >
                                                <div className="flex gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-slate-200 group-hover:text-indigo-400 transition-colors">{item.title}</p>
                                                        <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">{item.message}</p>
                                                    </div>
                                                    {item.action && (
                                                        <button className="self-start px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white text-[9px] font-black uppercase tracking-wider rounded-lg transition-all border border-indigo-500/20">
                                                            {item.action}
                                                        </button>
                                                    )}
                                                </div>
                                            </motion.div>
                                        ))
                                    )}
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6 flex items-center justify-between" delay={0.8}>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Market Rank</p>
                                    <p className="text-lg font-black text-white">{stats.rank}</p>
                                </div>
                                <div className="size-12 rounded-full border-4 border-slate-800 border-t-emerald-500 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-emerald-500">Top 5%</span>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Recent Activity Table */}
                        <div className="col-span-12">
                            <GlassCard className="overflow-hidden" delay={0.9}>
                                <div className="p-6 border-b border-white/5 flex flex-wrap gap-4 justify-between items-center">
                                    <div>
                                        <h3 className="text-base font-black text-white uppercase tracking-tight">Recent Transactions</h3>
                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Live Feed</p>
                                    </div>
                                    <button className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-widest transition-colors">View All History</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-white/5 bg-slate-800/20">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Service</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {recentJobs.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-10 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        No recent activity found
                                                    </td>
                                                </tr>
                                            ) : (
                                                recentJobs.map((job, idx) => (
                                                    <tr key={job.id} className="group hover:bg-white/[0.02] transition-colors">
                                                        <td className="px-6 py-4 text-xs font-bold text-slate-300 group-hover:text-white transition-colors">
                                                            #{job.id.substring(0, 8)}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-medium text-slate-400 group-hover:text-indigo-300 transition-colors uppercase tracking-tight">
                                                            {job.service || "General Service"}
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-medium text-slate-500">
                                                            {new Date(job.date).toLocaleDateString()}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${job.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                job.status === 'cancelled' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                                                    'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                                }`}>
                                                                {job.status}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 text-right">
                                                            <span className="text-sm font-black text-slate-200 group-hover:text-emerald-400 transition-colors">
                                                                {formatCurrency(job.amount || 0)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>
                    </div>
                </div>
            </div>
        </TechnicianLayout>
    );
};

export default EarningsHub;
