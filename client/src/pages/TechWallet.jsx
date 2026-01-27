import React, { useState } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';
import useWallet from '../hooks/useWallet';
import api from '../services/api';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const TechWallet = () => {
    const {
        walletData, transactions, bankAccounts, invoices, loading,
        addBankAccount, requestWithdrawal, saveToPot, syncAnalytics,
        shareInvoice, downloadJobInvoice, technicianId
    } = useWallet();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [showWithdrawModal, setShowWithdrawModal] = useState(false);
    const [showAddBankModal, setShowAddBankModal] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [selectedBank, setSelectedBank] = useState('');
    const [newBank, setNewBank] = useState({ bank_name: '', account_number: '', ifsc_code: '', account_holder_name: '' });
    const [showChartMenu, setShowChartMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [typeFilter, setTypeFilter] = useState('all');
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const [gstEnabled, setGstEnabled] = useState(false);
    const [showGstModal, setShowGstModal] = useState(false);
    const [showExpenses, setShowExpenses] = useState(false);

    // Add Bank Logic
    const handleAddBank = async (e) => {
        e.preventDefault();
        try {
            await addBankAccount(newBank);
            setShowAddBankModal(false);
            setNewBank({ bank_name: '', account_number: '', ifsc_code: '', account_holder_name: '' });
            alert('Bank linked successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to add bank');
        }
    };

    const handleDownloadPDF = async () => {
        if (!technicianId) return;
        try {
            const response = await api.get(`/finance/statement/${technicianId}`, {
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Fixofy_Statement_${technicianId}_${new Date().toISOString().split('T')[0]}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            setShowChartMenu(false); // Close menu
        } catch (err) {
            console.error("Download failed:", err);
            alert("Failed to download statement.");
        }
    };

    const handleShareWhatsApp = (inv) => {
        const message = `Hello, this is Fixofy. You can view your invoice for ${inv.service} (#${inv.id}) here: ${inv.invoiceUrl || 'Access via Fixofy Dashboard'}`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleShareEmail = async (jobId) => {
        try {
            await shareInvoice(jobId);
            alert("Invoice shared with customer via email.");
        } catch (err) {
            console.error("Email share error:", err);
            alert("Failed to share via email.");
        }
    };

    const handleDownloadInvoice = async (jobId) => {
        try {
            await downloadJobInvoice(jobId);
        } catch (err) {
            console.error("Download error:", err);
            alert("Failed to download invoice PDF.");
        }
    };

    // Withdrawal Logic
    const handleWithdraw = async (e) => {
        e.preventDefault();
        try {
            await requestWithdrawal(withdrawAmount, selectedBank);
            setShowWithdrawModal(false);
            setWithdrawAmount('');
            alert('Withdrawal requested successfully!');
        } catch (err) {
            alert(err.response?.data?.error || 'Withdrawal failed');
        }
    };

    if (loading) return (
        <TechnicianLayout>
            <div className="flex items-center justify-center h-96">
                <div className="animate-spin size-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
        </TechnicianLayout>
    );

    return (
        <TechnicianLayout title="Wallet & Finance">
            <div className="max-w-7xl mx-auto space-y-14 pb-20">
                {/* --- HERO SECTION --- */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative overflow-hidden group"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 via-blue-600 to-indigo-800 rounded-[2.5rem] shadow-2xl shadow-blue-600/20"></div>
                    <div className="absolute top-0 right-0 p-40 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-white/20 transition-all duration-700"></div>

                    <div className="relative z-10 p-10 md:py-20 md:px-16 flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                        <div className="space-y-4">
                            <motion.p
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-blue-100 font-bold uppercase tracking-[0.3em] text-xs"
                            >
                                Total Balance
                            </motion.p>
                            <motion.h1
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="text-[clamp(2rem,7vw,4.5rem)] font-black text-white tracking-tighter break-all truncate leading-[0.9] drop-shadow-2xl"
                                title={`₹${walletData.balance.toLocaleString('en-IN')}`}
                            >
                                ₹{walletData.balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </motion.h1>
                            <motion.div
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-center gap-3 text-emerald-300 text-sm font-black bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-2xl w-fit border border-white/10"
                            >
                                <span className="material-symbols-outlined text-lg">trending_up</span>
                                +12.4% vs last month
                            </motion.div>
                        </div>

                        <motion.div
                            initial={{ x: 20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.5 }}
                        >
                            <button
                                onClick={() => setShowWithdrawModal(true)}
                                className="group px-10 py-5 bg-white text-indigo-700 rounded-3xl font-black text-lg shadow-2xl shadow-indigo-900/40 hover:shadow-white/20 hover:scale-105 transition-all flex items-center gap-3 active:scale-95"
                            >
                                <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">payments</span>
                                Withdraw Funds
                                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </button>
                        </motion.div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-10 md:p-12 border-t border-white/10 bg-white/5 backdrop-blur-sm">
                        {[
                            { label: 'Available Payout', val: walletData.available, color: 'text-white', sub: 'Instant Transfer' },
                            { label: 'Pending Settlement', val: 0, color: 'text-amber-300', sub: 'No pending jobs' },
                            { label: 'Lifetime Earning', val: walletData.totalEarnings, color: 'text-blue-300', sub: 'Career Total' }
                        ].map((stat, i) => (
                            <motion.div
                                key={i}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 + i * 0.1 }}
                                className="group p-2 min-w-0 overflow-hidden"
                            >
                                <p className="text-blue-100/60 text-[10px] font-black uppercase tracking-[0.2em] mb-2 truncate">{stat.label}</p>
                                <p className={`text-2xl sm:text-3xl lg:text-4xl font-black ${stat.color} tracking-tight group-hover:scale-105 transition-transform origin-left truncate break-all`}>₹{stat.val.toLocaleString('en-IN')}</p>
                                <p className="text-[10px] text-blue-100/40 font-bold mt-2 uppercase tracking-wide truncate">{stat.sub}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* --- NAVIGATION TABS --- */}
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide px-2 mt-4 mb-4">
                    {['dashboard', 'transactions', 'earnings', 'tax center', 'invoices'].map((tab, i) => (
                        <motion.button
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.8 + i * 0.05 }}
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-8 py-3.5 rounded-3xl text-sm font-black capitalize whitespace-nowrap transition-all duration-300 relative group
                            ${activeTab === tab ? 'text-white' : 'text-slate-500 hover:text-slate-900 bg-white border border-slate-200'}`}
                        >
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-slate-900 rounded-3xl -z-10 shadow-xl shadow-slate-900/20"
                                />
                            )}
                            {tab}
                        </motion.button>
                    ))}
                </div>

                {/* TAB: TRANSACTIONS */}
                {activeTab === 'transactions' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden"
                    >
                        <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 backdrop-blur-md">
                            <div>
                                <h2 className="font-black text-2xl text-slate-900 tracking-tight">Ledger</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Real-time payment audit</p>
                            </div>
                            <div className="flex gap-4">
                                <div className="relative">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        onClick={() => setShowFilterMenu(!showFilterMenu)}
                                        className={`size-12 rounded-2xl bg-white border flex items-center justify-center transition-all
                                            ${typeFilter !== 'all' ? 'border-blue-600 text-blue-600' : 'border-slate-200 text-slate-400 hover:text-slate-900'}`}
                                    >
                                        <span className="material-symbols-outlined text-2xl">filter_list</span>
                                    </motion.button>
                                    <AnimatePresence>
                                        {showFilterMenu && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-30"
                                            >
                                                {['all', 'credit', 'debit'].map(t => (
                                                    <button
                                                        key={t}
                                                        onClick={() => { setTypeFilter(t); setShowFilterMenu(false); }}
                                                        className={`w-full text-left px-5 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all
                                                            ${typeFilter === t ? 'bg-slate-900 text-white' : 'hover:bg-slate-50 text-slate-500'}`}
                                                    >
                                                        {t}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    onClick={handleDownloadPDF}
                                    className="size-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-lg shadow-slate-900/20 transition-all hover:bg-blue-600"
                                >
                                    <span className="material-symbols-outlined text-2xl">download</span>
                                </motion.button>
                            </div>
                        </div>
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left min-w-[800px]">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">ID / Timestamp</th>
                                        <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Source / Trace</th>
                                        <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Classification</th>
                                        <th className="px-6 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">Verification</th>
                                        <th className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 text-right">Magnitude</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {transactions
                                        .filter(t => (typeFilter === 'all' || t.type === typeFilter))
                                        .length > 0 ? transactions
                                            .filter(t => (typeFilter === 'all' || t.type === typeFilter))
                                            .map((txn, i) => (
                                                <motion.tr
                                                    initial={{ opacity: 0, x: -10 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    key={txn.id}
                                                    className="hover:bg-slate-50/80 transition-all group"
                                                >
                                                    <td className="px-10 py-6 min-w-0">
                                                        <p className="font-black text-sm text-slate-900 group-hover:text-blue-600 transition-colors uppercase tabular-nums tracking-tighter truncate" style={{ maxWidth: 'clamp(100px, 15vw, 200px)' }} title={`#${txn.id}`}>#{txn.id?.slice(0, 12)}</p>
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 whitespace-nowrap">
                                                            {new Date(txn.createdAt).toLocaleDateString()} • {new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        {txn.associatedId && txn.associatedId !== 'SYSTEM' ? (
                                                            <span className="inline-block px-3 py-1 rounded-xl bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-2 border border-indigo-100/50">
                                                                Job Ref: {txn.associatedId.slice(0, 8)}
                                                            </span>
                                                        ) : null}
                                                        <p className="text-xs font-black text-slate-700 uppercase tracking-tight leading-relaxed truncate max-w-[150px] md:max-w-xs" title={txn.description}>{txn.description}</p>
                                                    </td>
                                                    <td className="px-6 py-6 text-center">
                                                        <span className={`px-4 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm
                                                    ${txn.type === 'credit' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                                                            {txn.type === 'credit' ? 'Credit' : 'Debit'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-6">
                                                        <div className="flex items-center gap-2">
                                                            <div className="size-2 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">
                                                                {txn.status || 'Verified'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="pr-14 pl-10 py-6 text-right">
                                                        <p className={`text-xl font-black tabular-nums tracking-tighter
                                                    ${txn.type === 'credit' ? 'text-emerald-500' : 'text-slate-900'}`}>
                                                            {txn.type === 'credit' ? '+' : '-'}₹{Number(txn.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                        </p>
                                                    </td>
                                                </motion.tr>
                                            )) : (
                                        <td colSpan="5" className="px-10 py-32 text-center">
                                            <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                                                <div className="size-20 bg-slate-50 rounded-[2rem] flex items-center justify-center border border-slate-100 shadow-inner group">
                                                    <span className="material-symbols-outlined text-4xl text-slate-300 group-hover:scale-110 transition-transform">receipt_long</span>
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase tracking-[0.25em] text-slate-900 text-sm mb-2">No Transactions Yet</p>
                                                    <p className="text-xs text-slate-400 font-bold leading-relaxed">
                                                        Your financial audit trail is waiting for its first entry. Complete a job to see your earnings here.
                                                    </p>
                                                </div>
                                                <motion.button
                                                    whileHover={{ scale: 1.05 }}
                                                    onClick={() => setActiveTab('dashboard')}
                                                    className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                                >
                                                    Go to Dashboard
                                                </motion.button>
                                            </div>
                                        </td>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}

                {/* TAB CONTENT: DASHBOARD */}
                {activeTab === 'dashboard' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-3 gap-10"
                    >
                        {/* Left Col: Charts */}
                        <div className="lg:col-span-2 space-y-10">
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <div>
                                        <h3 className="font-black text-2xl text-slate-900 tracking-tight">Payout Trends</h3>
                                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Weekly analysis</p>
                                    </div>
                                    <div className="relative">
                                        <motion.button
                                            whileTap={{ scale: 0.9 }}
                                            onClick={() => setShowChartMenu(!showChartMenu)}
                                            className="size-12 flex items-center justify-center text-slate-400 hover:text-slate-900 rounded-2xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
                                        >
                                            <span className="material-symbols-outlined text-2xl">more_horiz</span>
                                        </motion.button>

                                        <AnimatePresence>
                                            {showChartMenu && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                    className="absolute right-0 top-full mt-4 w-60 bg-white/80 backdrop-blur-2xl rounded-[1.5rem] shadow-2xl border border-white/20 p-2 z-20"
                                                >
                                                    <button
                                                        onClick={() => { refresh(true); setShowChartMenu(false); }}
                                                        className="w-full text-left px-5 py-3.5 text-sm font-black text-slate-700 hover:bg-slate-900 hover:text-white rounded-2xl transition-all flex items-center gap-3"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">refresh</span>
                                                        Sync Data Now
                                                    </button>
                                                    <button
                                                        onClick={handleDownloadPDF}
                                                        className="w-full text-left px-5 py-3.5 text-sm font-black text-slate-700 hover:bg-slate-900 hover:text-white rounded-2xl transition-all flex items-center gap-3"
                                                    >
                                                        <span className="material-symbols-outlined text-xl">download</span>
                                                        Export Statement
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                                <div style={{ height: '350px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={walletData.weeklyTrends.map((val, i) => ({ day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i], amount: val }))}>
                                            <defs>
                                                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="0%" stopColor="#4f46e5" />
                                                    <stop offset="100%" stopColor="#3b82f6" />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                                            <XAxis
                                                dataKey="day"
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }}
                                                dy={15}
                                            />
                                            <YAxis
                                                axisLine={false}
                                                tickLine={false}
                                                tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }}
                                                tickFormatter={(val) => `₹${val}`}
                                                dx={-10}
                                            />
                                            <Tooltip
                                                cursor={{ fill: '#f8fafc', radius: 12 }}
                                                contentStyle={{ borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', padding: '15px' }}
                                                itemStyle={{ fontWeight: 900, color: '#0f172a' }}
                                            />
                                            <Bar dataKey="amount" fill="url(#barGradient)" radius={[10, 10, 10, 10]} barSize={45} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </motion.div>

                            {/* Recent Activity */}
                            <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                                <div className="p-12 flex justify-between items-center border-b border-slate-50">
                                    <h3 className="font-black text-2xl text-slate-900 tracking-tight">Recent Activity</h3>
                                    <button
                                        onClick={() => setActiveTab('transactions')}
                                        className="px-5 py-2 rounded-2xl bg-slate-50 text-xs font-black text-blue-600 hover:bg-blue-600 hover:text-white transition-all uppercase tracking-widest"
                                    >
                                        View History
                                    </button>
                                </div>
                                <div className="divide-y divide-slate-50">
                                    {transactions.slice(0, 5).map((txn, idx) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + idx * 0.1 }}
                                            key={txn.id}
                                            className="p-6 hover:bg-slate-50 transition-all flex items-center justify-between group cursor-pointer"
                                        >
                                            <div className="flex items-center gap-6">
                                                <div className={`size-14 rounded-2xl flex items-center justify-center shrink-0 shadow-lg
                                                    ${txn.category === 'Withdrawal' ? 'bg-amber-100 text-amber-600 shadow-amber-200/50' : 'bg-blue-100 text-blue-600 shadow-blue-200/50'}`}>
                                                    <span className="material-symbols-outlined text-2xl">
                                                        {txn.category === 'Withdrawal' ? 'account_balance' : 'build'}
                                                    </span>
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-base font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate" title={txn.description}>{txn.description}</p>
                                                    <p className="text-xs text-slate-400 font-bold mt-1 tracking-wide whitespace-nowrap overflow-hidden text-ellipsis">{new Date(txn.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className={`text-xl font-black mb-1 
                                                    ${txn.type === 'debit' ? 'text-slate-900' : 'text-emerald-500'}`}>
                                                    {txn.type === 'debit' ? '-' : '+'}₹{txn.amount.toFixed(2)}
                                                </p>
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-white border border-slate-100 px-3 py-1 rounded-full">
                                                    {txn.status || 'COMPLETED'}
                                                </span>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Right Col: Insights */}
                        <div className="space-y-10">
                            {/* Income Pie */}
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
                            >
                                <h3 className="font-black text-xl text-slate-900 mb-8 tracking-tight uppercase tracking-widest text-sm">Income Mix</h3>
                                <div className="h-56 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={walletData.incomeDistribution}
                                                innerRadius={70}
                                                outerRadius={90}
                                                paddingAngle={8}
                                                dataKey="value"
                                                animationBegin={500}
                                                animationDuration={1500}
                                            >
                                                {walletData.incomeDistribution.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    {/* Center Text */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Gross</p>
                                            <p className="text-3xl font-black text-slate-900">₹{walletData.totalEarnings.toFixed(0)}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4 mt-8">
                                    {walletData.incomeDistribution.map((item, i) => (
                                        <motion.div
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.5 + i * 0.1 }}
                                            key={item.name}
                                            className="flex items-center justify-between gap-4 min-w-0"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="size-3 rounded-full shadow-lg shrink-0" style={{ backgroundColor: item.color }}></div>
                                                <span className="text-slate-600 font-black text-xs uppercase tracking-wider truncate" title={item.name}>{item.name}</span>
                                            </div>
                                            <span className="font-black text-slate-900 text-sm shrink-0">{((item.value / (walletData.totalEarnings || 1)) * 100).toFixed(0)}%</span>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* AI Insights Card */}
                            <motion.div
                                whileHover={{ y: -10 }}
                                className="bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 p-10 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-300 relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>

                                <div className="relative z-10 flex items-center gap-3 mb-8">
                                    <div className="size-10 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                        <span className="material-symbols-outlined text-yellow-300 text-2xl">auto_awesome</span>
                                    </div>
                                    <h3 className="font-black tracking-tight text-lg">AI Co-pilot</h3>
                                </div>

                                <div className="relative z-10 space-y-6">
                                    <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl border border-white/10">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-indigo-100 uppercase tracking-[0.2em]">Estimated Tax</span>
                                            <span className="material-symbols-outlined text-sm opacity-50">info</span>
                                        </div>
                                        <p className="text-3xl font-black mb-2 truncate">₹{walletData.analytics?.taxEstimation?.amount?.toFixed(2) || '0.00'}</p>
                                        <p className="text-xs text-indigo-100/70 font-bold leading-relaxed line-clamp-2" title={walletData.analytics?.taxEstimation?.message}>
                                            {walletData.analytics?.taxEstimation?.message}
                                        </p>
                                        <button className="mt-5 w-full py-3.5 bg-white text-indigo-900 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/40">
                                            Save to Pot
                                        </button>
                                    </div>

                                    <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer group">
                                        <div className="flex gap-4">
                                            <div className="size-10 bg-yellow-400 group-hover:rotate-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-yellow-400/30 transition-transform">
                                                <span className="material-symbols-outlined text-slate-900 font-bold">lightbulb</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black mb-1 uppercase tracking-tight truncate">Savings Hack</p>
                                                <p className="text-xs text-indigo-100/70 font-bold leading-relaxed line-clamp-2" title={walletData.analytics?.savingsSuggestion?.message}>
                                                    {walletData.analytics?.savingsSuggestion?.message || "Great job managing your finances!"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white/10 p-5 rounded-3xl backdrop-blur-xl border border-white/10 hover:bg-white/20 transition-all cursor-pointer group">
                                        <div className="flex gap-4">
                                            <div className="size-10 bg-emerald-400 group-hover:rotate-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-400/30 transition-transform">
                                                <span className="material-symbols-outlined text-slate-900 font-bold">calendar_today</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black mb-1 uppercase tracking-tight truncate">Peak Window</p>
                                                <p className="text-xs text-indigo-100/70 font-bold leading-relaxed line-clamp-2" title={walletData.analytics?.peakInsight?.message}>
                                                    {walletData.analytics?.peakInsight?.message || "Keep working hard!"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Financial Health Score */}
                            <motion.div
                                whileHover={{ y: -5 }}
                                className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100"
                            >
                                <div className="flex justify-between items-center mb-6 gap-4">
                                    <h3 className="font-black text-slate-900 tracking-tight text-sm uppercase tracking-widest truncate">Health Score</h3>
                                    <span className="text-3xl font-black text-emerald-500 tracking-tighter shrink-0">{walletData.analytics?.healthScore || 0}%</span>
                                </div>
                                <div className="h-4 bg-slate-100 rounded-full overflow-hidden shadow-inner p-1">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${walletData.analytics?.healthScore || 0}%` }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full shadow-lg"
                                    ></motion.div>
                                </div>
                                <div className="mt-8 bg-blue-50/50 p-6 rounded-3xl border border-blue-100 flex gap-4">
                                    <div className="size-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-blue-600 text-2xl font-black">verified</span>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-black text-blue-900 mb-2 uppercase tracking-wide">Expert Tip</p>
                                        <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                                            Link your GST number to unlock <span className="text-blue-900 font-black">Tax Benefits</span> and faster settlements.
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {/* TAB: EARNINGS */}
                {activeTab === 'earnings' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="space-y-10"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {[
                                { label: 'This Week', val: walletData.thisWeekEarnings || 0, icon: 'calendar_view_week', trend: `+${walletData.trends?.week || 0}%`, color: 'from-blue-600 to-indigo-600' },
                                { label: 'This Month', val: walletData.thisMonthEarnings || 0, icon: 'calendar_month', trend: `${walletData.trends?.month >= 0 ? '+' : ''}${walletData.trends?.month || 0}%`, color: 'from-emerald-500 to-teal-600' },
                                { label: 'Avg / Job', val: walletData.avgPerJob || 0, icon: 'average', trend: `+${walletData.trends?.avg || 0}%`, color: 'from-violet-500 to-purple-600' },
                                { label: 'Proj. Next Month', val: walletData.projectedEarnings || 0, icon: 'analytics', trend: 'Forecast', color: 'from-amber-500 to-orange-600' }
                            ].map((s, i) => (
                                <motion.div
                                    key={i}
                                    whileHover={{ y: -5 }}
                                    className={`bg-gradient-to-br ${s.color} p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden group min-w-0`}
                                >
                                    <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                                        <span className="material-symbols-outlined text-8xl">{s.icon}</span>
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-70 mb-2 truncate">{s.label}</p>
                                    <p className="text-2xl sm:text-3xl font-black tracking-tighter mb-4 truncate break-all">₹{s.val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10 truncate">
                                        <span className="material-symbols-outlined text-xs">trending_up</span>
                                        {s.trend}
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100">
                            <h3 className="font-black text-2xl text-slate-900 tracking-tight mb-8">Long-term Growth</h3>
                            <div style={{ height: '400px', width: '100%' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={walletData.totalEarnings > 0 ? [
                                        { m: 'Jan', e: 45000 }, { m: 'Feb', e: 52000 }, { m: 'Mar', e: 48000 },
                                        { m: 'Apr', e: 61000 }, { m: 'May', e: 55000 }, { m: 'Jun', e: walletData.totalEarnings / 4 }
                                    ] : [
                                        { m: 'Jan', e: 0 }, { m: 'Feb', e: 0 }, { m: 'Mar', e: 0 },
                                        { m: 'Apr', e: 0 }, { m: 'May', e: 0 }, { m: 'Jun', e: 0 }
                                    ]}>
                                        <defs>
                                            <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="8 8" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="m"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }}
                                            dy={15}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }}
                                            dx={-10}
                                        />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="e" stroke="#4f46e5" strokeWidth={4} fillOpacity={1} fill="url(#areaGradient)" />
                                    </AreaChart>
                                    {walletData.totalEarnings === 0 && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]">
                                            <div className="text-center">
                                                <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">analytics</span>
                                                <p className="font-black uppercase tracking-widest text-slate-400 text-xs">Waiting for growth data...</p>
                                            </div>
                                        </div>
                                    )}
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TAB: TAX CENTER */}
                {activeTab === 'tax center' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="grid grid-cols-1 lg:grid-cols-2 gap-10"
                    >
                        <div className="space-y-10">
                            <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col items-center text-center">
                                <div className="size-24 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner">
                                    <span className="material-symbols-outlined text-5xl">description</span>
                                </div>
                                <h3 className="font-black text-2xl text-slate-900 tracking-tight">Tax Documents (FY 24-25)</h3>
                                <p className="text-slate-500 font-bold text-[11px] sm:text-sm mt-4 mb-10 max-w-xs leading-relaxed">
                                    Verified Form 16A and TDS certificates are issued quarterly as per GoI regulations.
                                </p>
                                <div className="w-full space-y-4">
                                    {['Q1 TDS Certificate', 'Q2 TDS Certificate', 'Annual Summary'].map(doc => (
                                        <motion.button
                                            whileHover={{ x: 10 }}
                                            key={doc}
                                            className="w-full p-6 bg-slate-50 hover:bg-slate-900 hover:text-white rounded-3xl flex items-center justify-between transition-all group border border-slate-100"
                                        >
                                            <div className="flex items-center gap-4 text-left">
                                                <span className="material-symbols-outlined text-blue-500 group-hover:text-blue-300">verified_user</span>
                                                <span className="font-black tracking-tight uppercase text-xs">{doc}</span>
                                            </div>
                                            <span className="material-symbols-outlined text-slate-300 group-hover:text-white transition-colors">download</span>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-900 rounded-[2.5rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-blue-900/40">
                            <div className="absolute top-0 right-0 p-40 bg-blue-500/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                            <h3 className="relative z-10 font-black text-2xl tracking-tight mb-4">Tax Optimization</h3>
                            <p className="relative z-10 text-blue-100/60 font-bold text-sm mb-10 tracking-wide uppercase">AI-driven tax planning</p>

                            <div className="relative z-10 space-y-8">
                                <div className="p-8 bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/10 overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 truncate">Est. Tax Liability</p>
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            onClick={syncAnalytics}
                                            className="size-6 bg-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-sm">sync</span>
                                        </motion.button>
                                    </div>
                                    <div className="flex items-baseline gap-2 mb-4 truncate">
                                        <p className="text-3xl sm:text-5xl font-black tracking-tighter">₹{walletData.analytics?.taxEstimation?.amount?.toFixed(0) || '0'}</p>
                                        <p className="text-[10px] font-black text-blue-100/40 uppercase tracking-widest">Reserved</p>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-6">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.min(100, (walletData.analytics?.taxEstimation?.amount / (walletData.balance || 1)) * 100)}%` }}
                                            className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                        ></motion.div>
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => saveToPot('Tax Pot', walletData.analytics?.taxEstimation?.amount || 0)}
                                        className="w-full py-3 bg-white/10 hover:bg-white text-white hover:text-slate-900 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Save to Tax Pot
                                    </motion.button>
                                    <p className="text-[10px] text-blue-100/20 font-bold mt-4 italic truncate">Calculated for FY 24-25</p>
                                </div>

                                <div className="space-y-4">
                                    <div
                                        onClick={() => setShowGstModal(true)}
                                        className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group cursor-pointer overflow-hidden"
                                    >
                                        <div className={`size-11 rounded-xl flex items-center justify-center shrink-0 transition-colors
                                            ${gstEnabled ? 'bg-blue-500 text-white' : 'bg-white/10 text-blue-400'}`}>
                                            <span className="material-symbols-outlined">{gstEnabled ? 'check_circle' : 'account_balance_wallet'}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black uppercase tracking-tight truncate">GST Invoicing</p>
                                            <p className="text-[11px] text-blue-100/50 font-bold truncate">
                                                {gstEnabled ? 'Active • Linking verified' : 'Configure GST & claim credits.'}
                                            </p>
                                        </div>
                                        <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-all shrink-0">settings</span>
                                    </div>
                                    <div
                                        onClick={() => setShowExpenses(true)}
                                        className="flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group cursor-pointer overflow-hidden"
                                    >
                                        <div className="size-11 bg-white/10 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                                            <span className="material-symbols-outlined">receipt_long</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black uppercase tracking-tight truncate">Expense Tracker</p>
                                            <p className="text-[11px] text-blue-100/50 font-bold truncate">Auto-detect from ledger.</p>
                                        </div>
                                        <span className="material-symbols-outlined text-white/30 group-hover:text-white transition-all shrink-0">visibility</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* TAB: INVOICES */}
                {activeTab === 'invoices' && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/40 border border-slate-100 overflow-hidden"
                    >
                        <div className="px-12 py-10 border-b border-slate-50 flex justify-between items-center bg-slate-50/30 backdrop-blur-md">
                            <div>
                                <h2 className="font-black text-2xl text-slate-900 tracking-tight">Invoices</h2>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Generated service receipts</p>
                            </div>
                            <div className="flex gap-4">
                                <motion.button whileHover={{ scale: 1.05 }} className="px-6 py-3 rounded-2xl bg-indigo-50 text-indigo-700 font-black text-xs uppercase tracking-widest border border-indigo-100">
                                    Refresh List
                                </motion.button>
                            </div>
                        </div>
                        <div className="overflow-x-auto scrollbar-hide">
                            <table className="w-full text-left min-w-[900px]">
                                <thead>
                                    <tr className="border-b border-slate-50">
                                        {['Invoice Audit', 'Issue Date', 'Customer Node', 'Line Item', 'Valuation', 'Verification', 'Dispatch'].map(h => (
                                            <th key={h} className="px-10 py-6 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {invoices.length > 0 ? invoices.map((inv, i) => (
                                        <motion.tr
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            key={inv.id}
                                            className="hover:bg-slate-50/80 transition-all group"
                                        >
                                            <td className="px-10 py-6 font-black text-sm text-blue-600 uppercase tracking-widest group-hover:underline truncate" style={{ maxWidth: '120px' }}>#{inv.id.slice(0, 8)}</td>
                                            <td className="px-10 py-6 text-[11px] font-black text-slate-400 uppercase whitespace-nowrap">{new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                            <td className="px-10 py-6 text-sm text-slate-900 font-black uppercase italic tracking-tight truncate" style={{ maxWidth: 'clamp(100px, 20vw, 250px)' }} title={inv.customer}>{inv.customer}</td>
                                            <td className="px-10 py-6">
                                                <span className="px-3 py-1 rounded-xl bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-500 whitespace-nowrap">
                                                    {inv.service}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6 text-base font-black text-slate-900 tabular-nums whitespace-nowrap">₹{inv.amount.toLocaleString()}</td>
                                            <td className="px-10 py-6 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <div className="size-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                                                        {inv.status}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="pr-14 pl-10 py-6">
                                                <div className="flex items-center gap-3">
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, y: -2 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleShareWhatsApp(inv)}
                                                        className="size-9 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                                                        title="Share on WhatsApp"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">chat</span>
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, y: -2 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleShareEmail(inv.id)}
                                                        className="size-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center border border-blue-100 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                        title="Share via Email"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">mail</span>
                                                    </motion.button>
                                                    <motion.button
                                                        whileHover={{ scale: 1.1, y: -2 }}
                                                        whileTap={{ scale: 0.9 }}
                                                        onClick={() => handleDownloadInvoice(inv.id)}
                                                        className="size-9 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10 hover:bg-indigo-600 transition-all"
                                                        title="Download PDF"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">download</span>
                                                    </motion.button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="7" className="px-10 py-32 text-center">
                                                <div className="flex flex-col items-center gap-6 max-w-sm mx-auto">
                                                    <div className="size-20 bg-indigo-50 rounded-[2rem] flex items-center justify-center border border-indigo-100/50 shadow-inner group">
                                                        <span className="material-symbols-outlined text-4xl text-indigo-300 group-hover:scale-110 transition-transform">article</span>
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase tracking-[0.25em] text-slate-900 text-sm mb-2">Invoice Library Empty</p>
                                                        <p className="text-xs text-slate-400 font-bold leading-relaxed">
                                                            Detailed service receipts will appear here once jobs are finalized and verified.
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* --- WITHDRAW MODAL --- */}
            <AnimatePresence>
                {showWithdrawModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowWithdrawModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 30 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 30 }}
                            className="bg-white w-full max-w-xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] relative overflow-hidden flex flex-col"
                        >
                            <div className="h-44 bg-slate-900 p-10 text-white relative flex flex-col justify-end">
                                <div className="absolute top-0 right-0 p-32 bg-blue-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                                <button
                                    onClick={() => setShowWithdrawModal(false)}
                                    className="absolute top-8 right-8 size-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-rose-500 transition-colors group"
                                >
                                    <span className="material-symbols-outlined text-white text-xl">close</span>
                                </button>
                                <h3 className="text-4xl font-black tracking-tighter">Initiate Payout</h3>
                                <p className="text-blue-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1">Real-time settlement protocol</p>
                            </div>

                            <div className="p-10 space-y-10">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block">Receiving Node</label>
                                    {bankAccounts.length > 0 ? (
                                        <div className="p-6 bg-slate-50 rounded-3xl border-2 border-slate-100 flex items-center gap-5 group transition-all">
                                            <div className="size-14 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-900 border border-slate-100 group-hover:bg-slate-900 group-hover:text-white transition-all">
                                                <span className="material-symbols-outlined text-3xl">account_balance</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-900 uppercase tracking-tight text-lg truncate" title={bankAccounts[0].bank_name}>
                                                    {bankAccounts[0].bank_name}
                                                </p>
                                                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                                                    A/C •••• {bankAccounts[0].account_number?.slice(-4)}
                                                </p>
                                            </div>
                                            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl border border-emerald-100">
                                                <div className="size-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => { setShowWithdrawModal(false); setShowAddBankModal(true); }}
                                            className="p-6 bg-rose-50 border-2 border-dashed border-rose-200 rounded-3xl flex items-center gap-5 cursor-pointer hover:bg-rose-100 transition-all group"
                                        >
                                            <div className="size-14 bg-white rounded-2xl flex items-center justify-center text-rose-500">
                                                <span className="material-symbols-outlined text-3xl">add_card</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-black text-rose-900 uppercase text-xs tracking-wider">No Bank Account Linked</p>
                                                <p className="text-[10px] text-rose-600 font-bold mt-1">Click here to bridge your financial node.</p>
                                            </div>
                                            <span className="material-symbols-outlined text-rose-300 group-hover:translate-x-1 transition-transform">chevron_right</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-4 px-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Amount Magnitude</label>
                                        <button
                                            onClick={() => setWithdrawAmount(walletData.available.toString())}
                                            className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 underline underline-offset-4 truncate max-w-[150px]"
                                        >
                                            Max: ₹{walletData.available.toLocaleString()}
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute left-8 top-1/2 -translate-y-1/2 text-5xl font-black text-slate-300 group-focus-within:text-slate-900 transition-colors pointer-events-none">₹</div>
                                        <input
                                            type="number"
                                            value={withdrawAmount}
                                            onChange={(e) => setWithdrawAmount(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] py-10 pl-16 pr-8 text-3xl sm:text-5xl font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-all outline-none tabular-nums placeholder:text-slate-200"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <motion.button
                                    whileHover={{ y: -4, shadow: '0 20px 40px -12px rgba(0,0,0,0.3)' }}
                                    whileTap={{ scale: 0.98 }}
                                    disabled={loading || !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > walletData.available}
                                    onClick={handleWithdraw}
                                    className={`w-full py-6 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-4
                                        ${loading || !withdrawAmount || Number(withdrawAmount) <= 0 || Number(withdrawAmount) > walletData.available
                                            ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                            : 'bg-slate-900 text-white shadow-xl'}`}
                                >
                                    {loading ? (
                                        <div className="size-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Execute Transfer
                                            <span className="material-symbols-outlined text-xl">arrow_right_alt</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- ADD BANK MODAL --- */}
            <AnimatePresence>
                {showAddBankModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddBankModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden">
                            <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                                <div>
                                    <h3 className="font-black text-3xl text-slate-900 tracking-tight truncate">Link Node</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1 italic break-words">Authorized financial linking</p>
                                </div>
                                <button onClick={() => setShowAddBankModal(false)} className="size-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:border-rose-100 transition-all">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <form onSubmit={handleAddBank} className="p-10 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    {[
                                        { label: 'Bank Entity', key: 'bank_name', ph: 'e.g. ICICI BANK', icon: 'account_balance' },
                                        { label: 'Account Holder', key: 'account_holder_name', ph: 'AS PER RECORDS', icon: 'person' },
                                        { label: 'Account Number', key: 'account_number', ph: '0000 0000 0000', icon: 'numbers' },
                                        { label: 'Routing Code (IFSC)', key: 'ifsc_code', ph: 'ICIC0001234', icon: 'qr_code' }
                                    ].map((f) => (
                                        <div key={f.key}>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 px-1 block">{f.label}</label>
                                            <div className="relative group">
                                                <span className="absolute left-5 top-1/2 -translate-y-1/2 material-symbols-outlined text-slate-300 group-focus-within:text-slate-900 transition-colors">{f.icon}</span>
                                                <input
                                                    type="text"
                                                    required
                                                    value={newBank[f.key]}
                                                    onChange={e => setNewBank({ ...newBank, [f.key]: f.key === 'ifsc_code' ? e.target.value.toUpperCase() : e.target.value })}
                                                    placeholder={f.ph}
                                                    className="w-full pl-14 pr-6 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 focus:outline-none focus:border-slate-900 transition-all uppercase placeholder:text-slate-200"
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <motion.button
                                    whileHover={{ y: -4 }}
                                    whileTap={{ scale: 0.98 }}
                                    type="submit"
                                    className="w-full py-6 bg-slate-900 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 mt-4"
                                >
                                    Verify Connection
                                </motion.button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- GST CONFIG MODAL --- */}
            <AnimatePresence>
                {showGstModal && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowGstModal(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden">
                            <div className="h-40 bg-gradient-to-br from-indigo-700 to-violet-800 p-10 text-white relative flex flex-col justify-end">
                                <div className="absolute top-0 right-0 p-32 bg-white/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
                                <button onClick={() => setShowGstModal(false)} className="absolute top-8 right-8 size-10 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 hover:bg-rose-500 transition-colors">
                                    <span className="material-symbols-outlined text-white text-xl">close</span>
                                </button>
                                <h3 className="text-3xl font-black tracking-tighter">GST Node</h3>
                                <p className="text-indigo-200 font-black uppercase text-[9px] tracking-[0.3em] mt-1">Tax optimization layer</p>
                            </div>
                            <div className="p-10 space-y-8">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 px-1 block">GSTIN Identifier</label>
                                    <input type="text" placeholder="27AAAAA0000A1Z5" className="w-full p-5 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-slate-900 focus:border-indigo-600 outline-none transition-all uppercase placeholder:text-slate-200" />
                                </div>
                                <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between group">
                                    <div className="min-w-0 pr-4">
                                        <p className="text-xs font-black text-indigo-900 uppercase">Auto-filing Engine</p>
                                        <p className="text-[10px] text-indigo-600 font-bold mt-0.5 leading-relaxed">Fixofy AI manages quarterly returns.</p>
                                    </div>
                                    <button onClick={() => setGstEnabled(!gstEnabled)} className={`w-14 h-7 rounded-full transition-all relative shrink-0 ${gstEnabled ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-slate-200 shadow-inner'}`}>
                                        <motion.div animate={{ x: gstEnabled ? 28 : 4 }} className="absolute top-1 size-5 bg-white rounded-full shadow-md" />
                                    </button>
                                </div>
                                <button onClick={() => setShowGstModal(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl hover:bg-indigo-600 transition-all">
                                    Deploy Configuration
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* --- EXPENSES MODAL --- */}
            <AnimatePresence>
                {showExpenses && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExpenses(false)} className="absolute inset-0 bg-slate-900/80 backdrop-blur-2xl" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative flex flex-col max-h-[85vh] overflow-hidden">
                            <div className="p-12 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
                                <div>
                                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter truncate">Expense Audit</h3>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mt-1 italic break-words">Detected work-related deficits</p>
                                </div>
                                <button onClick={() => setShowExpenses(false)} className="size-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                                    <span className="material-symbols-outlined">close</span>
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4 p-10 scrollbar-hide bg-slate-50/50">
                                {transactions.filter(t => t.type === 'debit').length > 0 ? transactions.filter(t => t.type === 'debit').map(t => (
                                    <div key={t.id} className="p-6 bg-white rounded-3xl grid grid-cols-[1fr_auto] items-center gap-6 border border-white shadow-sm hover:shadow-md transition-all">
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-slate-900 uppercase tracking-tight truncate leading-none mb-2 break-all" title={t.description}>{t.description}</p>
                                            <div className="flex items-center gap-3 min-w-0 overflow-hidden">
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none shrink-0">{new Date(t.createdAt).toLocaleDateString()}</p>
                                                <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md text-[8px] font-black uppercase tracking-widest border border-blue-100 truncate shrink">Tax Deductible</span>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-lg font-black text-rose-500 tabular-nums">₹{t.amount.toLocaleString()}</p>
                                            <p className="text-[8px] font-black text-slate-300 uppercase tracking-[0.2em] mt-1">Magniture</p>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="py-24 text-center">
                                        <div className="size-20 bg-slate-100 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-slate-300">
                                            <span className="material-symbols-outlined text-4xl">database_off</span>
                                        </div>
                                        <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">No Expenses Detected</p>
                                    </div>
                                )}
                            </div>
                            <div className="p-10 border-t border-slate-50 bg-white shrink-0">
                                <button onClick={() => setShowExpenses(false)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-xl">
                                    Review Completed
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </TechnicianLayout>
    );
};

export default TechWallet;
