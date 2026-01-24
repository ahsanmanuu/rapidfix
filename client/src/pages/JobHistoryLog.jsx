import React from 'react';
import TechnicianLayout from '../components/TechnicianLayout';

const JobHistoryLog = () => {
    // Static data to match the screenshot/HTML entries
    const jobs = [
        {
            id: '#JB-4892',
            customer: { name: 'Sarah Jenkins', uid: '882190' },
            technician: { name: 'Alex Rivera', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChryn294fXlrLLy4u67qTssRw-h9AI0FAJ7AgKZOM_itv1cgF_UsOAUni4k8LUsp_GBHho4AiwJeo2dt7jZJwMRNq4PbaplfbDVLSrLjBVp0g0-2YwHleD8E3M50kOHEFYX6dZrBsagXNpsZDKVs8MolKQeX9kRrWnN-uE0WtXqJDQfajEAb7gQnetEy41oWdBKtHYcrdpnt8kYiloVxakrMszQJ_LgZYfD4m-t52M2YlaHAEc5tF9c1pOwNJyBjFZO5_JloI1z7U' },
            service: { type: 'Plumbing', icon: 'plumbing', color: 'text-blue-500' },
            date: 'Oct 24, 2023',
            time: '11:30 AM',
            status: 'Completed',
            statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            payment: '₹450.00',
            paymentIcon: 'credit_card'
        },
        {
            id: '#JB-4890',
            customer: { name: 'Mark Thompson', uid: '882145' },
            technician: { name: 'David Chen', avatar: null },
            service: { type: 'Electrical', icon: 'bolt', color: 'text-amber-500' },
            date: 'Oct 23, 2023',
            time: '09:15 AM',
            status: 'Cancelled',
            statusClass: 'bg-rose-50 text-rose-700 border-rose-100',
            payment: '₹0.00',
            paymentIcon: 'account_balance'
        },
        {
            id: '#JB-4888',
            customer: { name: 'Lydia Vane', uid: '881022' },
            technician: { name: 'Alex Rivera', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChryn294fXlrLLy4u67qTssRw-h9AI0FAJ7AgKZOM_itv1cgF_UsOAUni4k8LUsp_GBHho4AiwJeo2dt7jZJwMRNq4PbaplfbDVLSrLjBVp0g0-2YwHleD8E3M50kOHEFYX6dZrBsagXNpsZDKVs8MolKQeX9kRrWnN-uE0WtXqJDQfajEAb7gQnetEy41oWdBKtHYcrdpnt8kYiloVxakrMszQJ_LgZYfD4m-t52M2YlaHAEc5tF9c1pOwNJyBjFZO5_JloI1z7U' },
            service: { type: 'Plumbing', icon: 'plumbing', color: 'text-blue-500' },
            date: 'Oct 22, 2023',
            time: '16:45 PM',
            status: 'Refunded',
            statusClass: 'bg-slate-100 text-slate-600 border-slate-200',
            payment: '₹1,200',
            paymentStrike: true,
            paymentIcon: 'wallet'
        },
        {
            id: '#JB-4885',
            customer: { name: 'James Wilson', uid: '880912' },
            technician: { name: 'Sanjay Kumar', avatar: null },
            service: { type: 'Electrical', icon: 'bolt', color: 'text-amber-500' },
            date: 'Oct 22, 2023',
            time: '10:00 AM',
            status: 'Completed',
            statusClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            payment: '₹2,500.00',
            paymentIcon: 'payments'
        }
    ];

    const headerActions = (
        <button className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-all shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">download</span>
            Export Logs
        </button>
    );

    return (
        <TechnicianLayout title="Job History Log" headerActions={headerActions}>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50">
                {/* Search & Filter Bar */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex flex-wrap items-center gap-4">
                    <div className="flex-1 min-w-[240px]">
                        <div className="relative">
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
                            <input
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-slate-400 transition-all outline-none"
                                placeholder="Search Customer, ID or Technician..."
                                type="text"
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Status</span>
                            <div className="relative">
                                <select className="text-xs font-bold border border-slate-200 rounded-lg bg-white px-3 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none pr-8 appearance-none cursor-pointer hover:border-slate-300 transition-colors">
                                    <option>All Statuses</option>
                                    <option>Completed</option>
                                    <option>Cancelled</option>
                                    <option>Refunded</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">expand_more</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Service</span>
                            <div className="relative">
                                <select className="text-xs font-bold border border-slate-200 rounded-lg bg-white px-3 py-2 focus:ring-2 focus:ring-blue-500/20 outline-none pr-8 appearance-none cursor-pointer hover:border-slate-300 transition-colors">
                                    <option>All Services</option>
                                    <option>Plumbing</option>
                                    <option>Electrical</option>
                                </select>
                                <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">expand_more</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 hover:border-slate-300 transition-colors cursor-pointer">
                            <span className="material-symbols-outlined text-slate-400 text-lg">event</span>
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Date Range</span>
                                <span className="text-[11px] font-bold text-slate-700">Oct 01 - Oct 24</span>
                            </div>
                        </div>
                        <button className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-500 transition-colors">
                            <span className="material-symbols-outlined text-lg">filter_alt</span>
                        </button>
                    </div>
                </div>

                {/* Main Table */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Job ID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Customer & UID</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Technician</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Service Type</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Date & Time</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">Payment</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {jobs.map((job) => (
                                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors group">
                                        <td className="px-6 py-4 font-black text-blue-600 text-xs">{job.id}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-900">{job.customer.name}</span>
                                                <span className="text-[10px] text-slate-400 font-medium">UID: {job.customer.uid}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {job.technician.avatar ? (
                                                    <div className="size-6 rounded-full bg-slate-200 bg-cover bg-center" style={{ backgroundImage: `url("${job.technician.avatar}")` }}></div>
                                                ) : (
                                                    <div className="size-6 rounded-full bg-slate-200 flex items-center justify-center">
                                                        <span className="material-symbols-outlined text-xs text-slate-400">person</span>
                                                    </div>
                                                )}
                                                <span className="text-xs font-semibold text-slate-600">{job.technician.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                                                <span className={`material-symbols-outlined text-sm ${job.service.color}`}>{job.service.icon}</span>
                                                {job.service.type}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-slate-700">{job.date}</span>
                                                <span className="text-[10px] text-slate-400">{job.time}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${job.statusClass}`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-xs font-black ${job.paymentStrike ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{job.payment}</span>
                                                <span className="material-symbols-outlined text-sm text-slate-400">{job.paymentIcon}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-slate-400 hover:text-blue-600 transition-colors p-1 rounded-md hover:bg-slate-100">
                                                <span className="material-symbols-outlined text-lg">more_vert</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination */}
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Showing 1 to 4 of 248 entries</span>
                        <div className="flex items-center gap-1">
                            <button className="size-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-50 transition-colors" disabled>
                                <span className="material-symbols-outlined text-lg">chevron_left</span>
                            </button>
                            <button className="size-8 flex items-center justify-center rounded bg-blue-600 text-white font-bold text-xs shadow-sm">1</button>
                            <button className="size-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 font-bold text-xs hover:bg-white transition-colors">2</button>
                            <button className="size-8 flex items-center justify-center rounded border border-slate-200 text-slate-600 font-bold text-xs hover:bg-white transition-colors">3</button>
                            <button className="size-8 flex items-center justify-center rounded border border-slate-200 text-slate-400 hover:bg-white transition-colors">
                                <span className="material-symbols-outlined text-lg">chevron_right</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Stats Widgets */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6">
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br from-emerald-50 to-white">
                        <div className="size-10 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                            <span className="material-symbols-outlined">verified</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Completed</p>
                            <h4 className="text-xl font-black text-slate-800">182 Jobs</h4>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br from-rose-50 to-white">
                        <div className="size-10 bg-rose-100 rounded-lg flex items-center justify-center text-rose-600 shrink-0">
                            <span className="material-symbols-outlined">cancel</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Total Cancelled</p>
                            <h4 className="text-xl font-black text-slate-800">12 Jobs</h4>
                        </div>
                    </div>
                    <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 flex items-center gap-4 bg-gradient-to-br from-blue-50/50 to-white">
                        <div className="size-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Revenue Period</p>
                            <h4 className="text-xl font-black text-slate-800">₹42,850.00</h4>
                        </div>
                    </div>
                </div>
            </div>
        </TechnicianLayout>
    );
};

export default JobHistoryLog;
