
import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import api from '../../../services/api';
import { useSocket } from '../../../context/SocketContext';

const FinanceView = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ revenue: 0, payouts: 0, balance: 0 });

    const fetchFinance = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/finance');
            if (res.data.success) {
                setTransactions(res.data.transactions || []);
                setStats(res.data.stats || { revenue: 0, payouts: 0, balance: 0 });
            }
        } catch (err) {
            console.error("Finance fetch error", err);
        } finally {
            setLoading(false);
        }
    };

    const socket = useSocket();

    useEffect(() => {
        fetchFinance();

        if (socket) {
            socket.on('admin_finance_update', fetchFinance);
            return () => {
                socket.off('admin_finance_update', fetchFinance);
            };
        }
    }, [socket]);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <DollarSign className="text-emerald-500" /> Financial Overview
            </h2>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-900/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-emerald-500 transform scale-150">
                        <TrendingUp size={48} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">Total Revenue</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">₹{stats.revenue.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-blue-500 transform scale-150">
                        <CreditCard size={48} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">System Balance</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">₹{stats.balance.toLocaleString()}</h3>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-rose-100 dark:border-rose-900/30 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-rose-500 transform scale-150">
                        <ArrowDownLeft size={48} />
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-xs tracking-wider">Total Payouts</p>
                    <h3 className="text-3xl font-black text-slate-800 dark:text-white mt-2">₹{stats.payouts.toLocaleString()}</h3>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Recent Transactions</h3>
                    <button onClick={fetchFinance} className="text-sm font-bold text-blue-600 hover:underline">Refresh</button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-8 py-4">ID</th>
                                <th className="px-8 py-4">User</th>
                                <th className="px-8 py-4">Type</th>
                                <th className="px-8 py-4">Amount</th>
                                <th className="px-8 py-4">Date</th>
                                <th className="px-8 py-4">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr><td colSpan="6" className="text-center py-10 text-slate-400">Loading records...</td></tr>
                            ) : transactions.length === 0 ? (
                                <tr><td colSpan="6" className="text-center py-10 text-slate-400">No transactions found</td></tr>
                            ) : (
                                transactions.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-8 py-4 font-mono text-xs text-slate-400">#{t.id.slice(0, 8)}</td>
                                        <td className="px-8 py-4 font-medium text-slate-700 dark:text-slate-300">
                                            {t.userId}
                                            <div className="text-[10px] text-slate-400">{t.description}</div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${t.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                                {t.type === 'credit' ? <ArrowDownLeft size={10} /> : <ArrowUpRight size={10} />}
                                                {t.type}
                                            </span>
                                        </td>
                                        <td className={`px-8 py-4 font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-slate-800 dark:text-white'}`}>
                                            {t.type === 'credit' ? '+' : '-'}₹{t.amount}
                                        </td>
                                        <td className="px-8 py-4 text-sm text-slate-500">
                                            {new Date(t.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-8 py-4">
                                            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                Completed
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default FinanceView;
