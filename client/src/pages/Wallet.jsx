import React, { useState } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';
import useWallet from '../hooks/useWallet';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts';

const MaterialIcon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const GlassCard = ({ children, className = "", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay, ease: "easeOut" }}
        className={`bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-3xl overflow-hidden hover:border-white/10 hover:bg-slate-800/50 transition-all duration-500 group relative ${className}`}
    >
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"></div>
        <div className="relative z-10">{children}</div>
    </motion.div>
);

const Wallet = () => {
    const {
        walletData, transactions, bankAccounts, withdrawals,
        loading, requestWithdrawal, addBankAccount, technicianId
    } = useWallet();

    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [selectedPreset, setSelectedPreset] = useState('');
    const [selectedBank, setSelectedBank] = useState(bankAccounts[0]?.id || '');
    const [isWithdrawing, setIsWithdrawing] = useState(false);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handlePresetClick = (amount) => {
        setSelectedPreset(amount);
        setWithdrawAmount(amount);
    };

    const handleAmountChange = (e) => {
        setWithdrawAmount(e.target.value);
        setSelectedPreset('custom');
    };

    const handleWithdraw = async () => {
        if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) return;
        setIsWithdrawing(true);
        try {
            // Default to first bank if not selected (or handle UI error)
            const bankId = selectedBank || bankAccounts[0]?.id;
            if (bankId) {
                await requestWithdrawal(parseFloat(withdrawAmount), bankId);
                setWithdrawAmount('');
                setSelectedPreset('');
                alert('Withdrawal requested successfully!');
            } else {
                alert('Please add a bank account first.');
            }
        } catch (err) {
            alert('Withdrawal failed: ' + err.message);
        } finally {
            setIsWithdrawing(false);
        }
    };

    if (loading) {
        return (
            <TechnicianLayout title="TechWallet">
                <div className="flex items-center justify-center h-[80vh] bg-slate-950">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="size-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MaterialIcon name="account_balance_wallet" className="text-emerald-500 text-xl animate-pulse" />
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] animate-pulse">Syncing Ledger...</p>
                    </div>
                </div>
            </TechnicianLayout>
        );
    }

    // Mock Chart Data if empty (for visualization)
    const chartData = walletData.weeklyTrends?.length > 0 ? walletData.weeklyTrends : [
        { name: 'Mon', value: 4000 }, { name: 'Tue', value: 3000 }, { name: 'Wed', value: 2000 },
        { name: 'Thu', value: 2780 }, { name: 'Fri', value: 1890 }, { name: 'Sat', value: 2390 }, { name: 'Sun', value: 3490 }
    ];

    const pieData = [
        { name: 'Job Fees', value: 70, color: '#10b981' },
        { name: 'Tips', value: 20, color: '#34d399' },
        { name: 'Bonuses', value: 10, color: '#6ee7b7' },
    ];

    return (
        <TechnicianLayout title="TechWallet">
            <div className="min-h-screen bg-slate-950 text-slate-200 font-sans pb-12">

                {/* Decorative BG */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] mix-blend-screen"></div>
                    <div className="absolute bottom-[10%] left-[-10%] w-[30%] h-[30%] bg-indigo-600/5 rounded-full blur-[100px] mix-blend-screen"></div>
                </div>

                <div className="relative max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8 pt-6">

                    {/* Navigation Tabs */}
                    <div className="flex flex-wrap items-center gap-2 mb-8 bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md w-fit">
                        {['Dashboard', 'Earnings', 'Tax Center', 'Invoices'].map((tab, idx) => (
                            <button
                                key={tab}
                                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 ${idx === 0
                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                    : 'text-slate-400 hover:text-emerald-400 hover:bg-white/5'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <GlassCard className="p-6" delay={0.1}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    <MaterialIcon name="account_balance_wallet" className="!text-xl" />
                                </div>
                                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">+12.4%</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Balance</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(walletData.balance)}</h3>
                        </GlassCard>

                        <GlassCard className="p-6" delay={0.2}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                                    <MaterialIcon name="payments" className="!text-xl" />
                                </div>
                                <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">Ready</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Available Payout</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(walletData.available || walletData.balance)}</h3>
                        </GlassCard>

                        <GlassCard className="p-6" delay={0.3}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                                    <MaterialIcon name="pending" className="!text-xl" />
                                </div>
                                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">Review</span>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Settlements</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(1390)}</h3>
                            {/* Using dummy for pending if not in API yet, usually calculated from jobs in progress */}
                        </GlassCard>

                        <GlassCard className="p-6" delay={0.4}>
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                                    <MaterialIcon name="savings" className="!text-xl" />
                                </div>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lifetime Earnings</p>
                            <h3 className="text-3xl font-black text-white tracking-tight">{formatCurrency(walletData.totalEarnings)}</h3>
                        </GlassCard>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Left Column (8 cols) */}
                        <div className="col-span-12 lg:col-span-8 space-y-8">

                            {/* Withdrawal Widget */}
                            <GlassCard className="p-8" delay={0.5}>
                                <div className="flex justify-between items-center mb-8 pb-6 border-b border-white/5">
                                    <div>
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight">Transfer Funds</h3>
                                        <p className="text-xs font-medium text-slate-400 mt-1">Instant layout to connected accounts</p>
                                    </div>
                                    <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-lg">Instant Active</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Select Amount</label>
                                        <div className="flex gap-3">
                                            {['1000', '2000', '5000'].map(amt => (
                                                <button
                                                    key={amt}
                                                    onClick={() => handlePresetClick(amt)}
                                                    className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${selectedPreset === amt
                                                            ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                            : 'bg-slate-800/50 border-white/5 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400'
                                                        }`}
                                                >
                                                    ₹{amt}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => { setSelectedPreset('custom'); setWithdrawAmount(''); }}
                                                className={`flex-1 py-3 rounded-xl text-sm font-bold border transition-all ${selectedPreset === 'custom'
                                                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                        : 'bg-slate-800/50 border-white/5 text-slate-400 hover:border-emerald-500/50 hover:text-emerald-400'
                                                    }`}
                                            >
                                                Custom
                                            </button>
                                        </div>
                                        <div className="relative group">
                                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold transition-colors ${withdrawAmount ? 'text-white' : 'text-slate-600'}`}>₹</span>
                                            <input
                                                type="number"
                                                value={withdrawAmount}
                                                onChange={handleAmountChange}
                                                className="w-full bg-slate-900/50 border-2 border-slate-800 rounded-2xl py-4 pl-10 pr-4 text-2xl font-black text-white placeholder-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                                                placeholder="0.00"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="flex justify-between items-center">
                                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">Destination</label>
                                            <button className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 uppercase tracking-widest">+ Add New</button>
                                        </div>

                                        {bankAccounts.length > 0 ? (
                                            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 flex items-center gap-4 cursor-pointer hover:border-emerald-500/50 transition-all group">
                                                <div className="size-12 rounded-xl bg-white flex items-center justify-center shrink-0">
                                                    <MaterialIcon name="account_balance" className="text-slate-900" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">{bankAccounts[0].bankName || "Primary Bank"}</p>
                                                    <p className="text-xs text-slate-500 font-medium truncate">•••• •••• {bankAccounts[0].accountNumber?.slice(-4) || "8832"}</p>
                                                </div>
                                                <div className="size-6 rounded-full border-2 border-emerald-500 flex items-center justify-center">
                                                    <div className="size-2.5 rounded-full bg-emerald-500"></div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-4 rounded-2xl bg-slate-800/30 border border-dashed border-slate-700 text-center cursor-pointer hover:border-emerald-500/50 hover:bg-slate-800/50 transition-all">
                                                <p className="text-xs font-bold text-slate-400">No bank account linked</p>
                                                <p className="text-[10px] text-emerald-500 font-bold mt-1">Link Account Now</p>
                                            </div>
                                        )}

                                        <button
                                            onClick={handleWithdraw}
                                            disabled={isWithdrawing || !withdrawAmount}
                                            className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg shadow-emerald-900/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                                        >
                                            {isWithdrawing ? (
                                                <>Processing <span className="animate-spin material-symbols-outlined text-sm">rotate_right</span></>
                                            ) : (
                                                <>Confirm Transfer <MaterialIcon name="arrow_forward" /></>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </GlassCard>

                            {/* Charts Row */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <GlassCard className="p-6 h-[300px]" delay={0.6}>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Payout Trends</h3>
                                        <MaterialIcon name="trending_up" className="text-emerald-500" />
                                    </div>
                                    <ResponsiveContainer width="100%" height="80%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} dy={10} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)' }}
                                                itemStyle={{ color: '#fff', fontWeight: 700 }}
                                                cursor={{ stroke: '#10b981', strokeDasharray: '4 4' }}
                                                formatter={(val) => [`₹${val}`, 'Payout']}
                                            />
                                            <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                </GlassCard>

                                <GlassCard className="p-6 h-[300px]" delay={0.7}>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-black text-white uppercase tracking-tight">Income Sources</h3>
                                        <MaterialIcon name="pie_chart" className="text-indigo-500" />
                                    </div>
                                    <div className="flex items-center justify-center h-[80%]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={pieData}
                                                    innerRadius={60}
                                                    outerRadius={80}
                                                    paddingAngle={5}
                                                    dataKey="value"
                                                >
                                                    {pieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px' }}
                                                    itemStyle={{ color: '#fff', fontWeight: 700 }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </GlassCard>
                            </div>

                            {/* Recent Transactions Table */}
                            <GlassCard className="overflow-hidden" delay={0.8}>
                                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-800/30">
                                    <h3 className="text-base font-black text-white uppercase tracking-tight">Recent Transactions</h3>
                                    <button className="text-[10px] font-bold text-emerald-400 hover:text-white uppercase tracking-widest transition-colors">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-900/50 text-slate-500">
                                            <tr>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Transaction</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Date</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Method</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest">Status</th>
                                                <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {transactions.length === 0 ? (
                                                <tr>
                                                    <td colSpan="5" className="px-6 py-10 text-center text-xs font-bold text-slate-500 uppercase tracking-widest">
                                                        No recent activity
                                                    </td>
                                                </tr>
                                            ) : (
                                                transactions.slice(0, 5).map((curr, idx) => (
                                                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className={`size-8 rounded-lg flex items-center justify-center transition-colors ${curr.type === 'credit' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-700/30 text-slate-400'}`}>
                                                                    <MaterialIcon name={curr.type === 'credit' ? 'arrow_downward' : 'arrow_upward'} className="!text-sm" />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">{curr.description}</p>
                                                                    <p className="text-[10px] text-slate-500">{curr.type.toUpperCase()}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-xs font-medium text-slate-400">{new Date(curr.date || Date.now()).toLocaleDateString()}</td>
                                                        <td className="px-6 py-4 text-xs font-medium text-slate-400 italic">Wallet</td>
                                                        <td className="px-6 py-4">
                                                            <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-md text-[9px] font-black border border-emerald-500/20">SUCCESS</span>
                                                        </td>
                                                        <td className={`px-6 py-4 text-right text-xs font-black ${curr.type === 'credit' ? 'text-emerald-400' : 'text-slate-300'}`}>
                                                            {curr.type === 'credit' ? '+' : '-'}{formatCurrency(curr.amount)}
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </GlassCard>
                        </div>

                        {/* Right Sidebar - AI Assistant */}
                        <div className="col-span-12 lg:col-span-4 space-y-6">
                            <GlassCard className="p-0 overflow-hidden" delay={0.9}>
                                <div className="bg-gradient-to-br from-emerald-900/40 to-slate-900/50 p-6 border-b border-white/5">
                                    <div className="flex items-center gap-3 mb-2">
                                        <MaterialIcon name="auto_awesome" className="text-emerald-400" />
                                        <h3 className="font-bold text-white tracking-tight">Financial Assistant</h3>
                                    </div>
                                    <p className="text-xs text-emerald-400/80 leading-relaxed font-medium">Your monthly tax & savings optimization is active.</p>
                                </div>
                                <div className="p-6 space-y-5">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] text-emerald-400 font-black uppercase tracking-widest">Tax Pot</span>
                                            <MaterialIcon name="info" className="text-sm text-slate-500 group-hover:text-white transition-colors" />
                                        </div>
                                        <p className="text-2xl font-black text-white">₹14,240</p>
                                        <p className="text-[10px] text-slate-400 mt-1">Suggested set aside for Q1 taxes.</p>
                                        <button className="mt-3 w-full py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border border-emerald-500/20">Move to Pot</button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex gap-3 items-start">
                                            <div className="size-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 border border-indigo-500/30">
                                                <MaterialIcon name="lightbulb" className="text-indigo-400 text-sm" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-200">Savings Insight</p>
                                                <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">You're spending 15% less on supplies this month. Good job!</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 items-start">
                                            <div className="size-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 border border-amber-500/30">
                                                <MaterialIcon name="trending_up" className="text-amber-400 text-sm" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-200">Peak Earning</p>
                                                <p className="text-[10px] text-slate-400 leading-relaxed mt-0.5">Friday afternoons are your highest revenue slots.</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/5">
                                        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest mb-2">
                                            <span className="text-slate-500">Health Score</span>
                                            <span className="text-emerald-400">92/100</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 w-[92%] shadow-[0_0_10px_#10b981]"></div>
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>

                            <GlassCard className="p-6 bg-gradient-to-br from-indigo-900/20 to-slate-900/50 border-indigo-500/20" delay={1.0}>
                                <h4 className="text-xs font-bold text-white uppercase tracking-widest mb-2">Pro Tip</h4>
                                <p className="text-xs text-indigo-300 leading-relaxed font-medium">Link your invoices directly to your bank account for 2x faster settlements.</p>
                                <button className="mt-4 text-[10px] font-black text-white bg-indigo-600 px-4 py-2 rounded-lg hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/50 uppercase tracking-widest">Enable Feature</button>
                            </GlassCard>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="flex items-center justify-between pb-8 pt-8 border-t border-white/5 opacity-60">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">© 2025 TechWallet Inc.</p>
                        <div className="flex gap-4">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-white cursor-pointer transition-colors">Security</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-white cursor-pointer transition-colors">Privacy</span>
                        </div>
                    </footer>

                </div>
            </div>
        </TechnicianLayout>
    );
};

export default Wallet;
