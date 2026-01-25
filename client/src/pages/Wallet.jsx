import React, { useState } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';

// Helper for Material Symbols
const MaterialIcon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const Wallet = () => {
    // State for Withdrawal Widget
    const [withdrawAmount, setWithdrawAmount] = useState('100.00');
    const [selectedPreset, setSelectedPreset] = useState('100');

    const handlePresetClick = (amount) => {
        setSelectedPreset(amount);
        if (amount !== 'custom') {
            setWithdrawAmount(amount + '.00');
        } else {
            setWithdrawAmount('');
        }
    };

    const handleAmountChange = (e) => {
        setWithdrawAmount(e.target.value);
        setSelectedPreset('custom');
    };

    return (
        <TechnicianLayout title="TechWallet">
            <div className="flex-1 overflow-y-auto p-4 sm:px-10 lg:px-20 py-6 bg-[#f6f8f7] font-sans text-[#0d1b14]">
                <div className="flex flex-col max-w-[1200px] mx-auto gap-6">

                    {/* Sub-Navigation (extracted from snippet header) */}
                    <div className="flex flex-wrap items-center gap-6 border-b border-[#cfe7db] pb-4 mb-2">
                        <button className="text-[#0d1b14] text-sm font-semibold border-b-2 border-[#13ec80] pb-1">Dashboard</button>
                        <button className="text-[#4c9a73] text-sm font-medium hover:text-[#13ec80] transition-colors">Earnings</button>
                        <button className="text-[#4c9a73] text-sm font-medium hover:text-[#13ec80] transition-colors">Tax Center</button>
                        <button className="text-[#4c9a73] text-sm font-medium hover:text-[#13ec80] transition-colors">Invoices</button>

                        <div className="ml-auto hidden sm:flex items-center bg-[#e7f3ed] rounded-lg px-3 py-1.5 h-9 w-64">
                            <MaterialIcon name="search" className="text-[#4c9a73] text-xl mr-2" />
                            <input
                                className="bg-transparent border-none focus:ring-0 text-sm placeholder-[#4c9a73] w-full p-0 text-[#0d1b14]"
                                placeholder="Search transactions..."
                            />
                        </div>
                    </div>

                    {/* 1. Stats Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#cfe7db] bg-white shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[#4c9a73] text-xs font-bold uppercase tracking-wider">Total Balance</p>
                            <p className="text-[#0d1b14] tracking-tight text-2xl font-bold leading-tight">$4,240.50</p>
                            <div className="flex items-center gap-1 mt-1">
                                <MaterialIcon name="trending_up" className="text-[#13ec80] text-sm" />
                                <p className="text-[#13ec80] text-xs font-bold">+12.4% vs last month</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#cfe7db] bg-white shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[#4c9a73] text-xs font-bold uppercase tracking-wider">Available for Payout</p>
                            <p className="text-[#13ec80] tracking-tight text-2xl font-bold leading-tight">$2,850.00</p>
                            <p className="text-[#4c9a73] text-xs font-medium mt-1">Ready to withdraw</p>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#cfe7db] bg-white shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[#4c9a73] text-xs font-bold uppercase tracking-wider">Pending Settlements</p>
                            <p className="text-[#0d1b14] tracking-tight text-2xl font-bold leading-tight">$1,390.50</p>
                            <p className="text-[#4c9a73] text-xs font-medium mt-1">3 jobs in review</p>
                        </div>
                        <div className="flex flex-col gap-1 rounded-xl p-5 border border-[#cfe7db] bg-white shadow-sm hover:shadow-md transition-shadow">
                            <p className="text-[#4c9a73] text-xs font-bold uppercase tracking-wider">Life-time Earnings</p>
                            <p className="text-[#0d1b14] tracking-tight text-2xl font-bold leading-tight">$82,100.00</p>
                            <p className="text-[#4c9a73] text-xs font-medium mt-1">Since Jan 2023</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: 8 units wide */}
                        <div className="lg:col-span-8 flex flex-col gap-6">
                            {/* 2. Interactive Withdrawal Widget */}
                            <div className="bg-white rounded-xl border border-[#cfe7db] p-6 shadow-sm overflow-hidden relative">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-[#0d1b14] text-lg font-bold">Transfer to Bank</h3>
                                    <span className="bg-[#e7f3ed] text-[#4c9a73] text-[10px] font-bold px-2 py-1 rounded uppercase">Instant Transfer</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="flex flex-col gap-4">
                                        <label className="block text-sm font-semibold text-[#0d1b14]">Select Amount</label>
                                        <div className="flex h-10 items-center justify-center rounded-lg bg-[#f0f7f4] p-1">
                                            {['50', '100', '500'].map(amt => (
                                                <button
                                                    key={amt}
                                                    onClick={() => handlePresetClick(amt)}
                                                    className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-2 text-sm font-semibold transition-all ${selectedPreset === amt
                                                            ? 'bg-white shadow-sm text-[#13ec80]'
                                                            : 'text-[#4c9a73] hover:bg-white/50'
                                                        }`}
                                                >
                                                    ${amt}
                                                </button>
                                            ))}
                                            <button
                                                onClick={() => handlePresetClick('custom')}
                                                className={`flex cursor-pointer h-full grow items-center justify-center rounded-md px-2 text-sm font-semibold transition-all ${selectedPreset === 'custom'
                                                        ? 'bg-white shadow-sm text-[#13ec80]'
                                                        : 'text-[#4c9a73] hover:bg-white/50'
                                                    }`}
                                            >
                                                Custom
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4c9a73]">$</span>
                                            <input
                                                className="w-full pl-7 pr-4 py-2 rounded-lg border-[#cfe7db] bg-[#f8fcfa] focus:ring-[#13ec80] focus:border-[#13ec80] text-lg font-bold text-[#0d1b14]"
                                                type="text"
                                                value={withdrawAmount}
                                                onChange={handleAmountChange}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <label className="block text-sm font-semibold text-[#0d1b14]">Destination Account</label>
                                        <div className="flex items-center gap-3 p-3 rounded-lg border border-[#13ec80]/30 bg-[#13ec80]/5 cursor-pointer hover:bg-[#13ec80]/10 transition-colors group">
                                            <div className="size-10 bg-white rounded-lg border border-[#cfe7db] flex items-center justify-center group-hover:border-[#13ec80]/50 transition-colors">
                                                <MaterialIcon name="account_balance" className="text-[#0d1b14]" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-bold text-[#0d1b14] leading-tight">Chase Checking</p>
                                                <p className="text-xs text-[#4c9a73]">Ending in •••• 4432</p>
                                            </div>
                                            <MaterialIcon name="expand_more" className="text-[#4c9a73]" />
                                        </div>
                                        <button className="mt-2 w-full bg-[#13ec80] hover:bg-[#13ec80]/90 text-[#0d1b14] font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-md shadow-[#13ec80]/20">
                                            <span>Withdraw Now</span>
                                            <MaterialIcon name="arrow_forward" className="text-xl" />
                                        </button>
                                    </div>
                                </div>
                                <p className="mt-4 text-[11px] text-[#4c9a73] text-center italic">Processing time: Instant to 30 mins. Fees may apply for express transfers.</p>
                            </div>

                            {/* 3. Earnings Analytics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Bar Chart Placeholder constructed with CSS */}
                                <div className="bg-white rounded-xl border border-[#cfe7db] p-5 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-bold text-[#0d1b14]">Weekly Payout Trends</h3>
                                        <MaterialIcon name="more_horiz" className="text-[#4c9a73] text-lg" />
                                    </div>
                                    <div className="flex items-end justify-between h-32 px-2 gap-2">
                                        <div className="w-full bg-[#e7f3ed] rounded-t-sm h-1/2"></div>
                                        <div className="w-full bg-[#e7f3ed] rounded-t-sm h-3/4"></div>
                                        <div className="w-full bg-[#13ec80] rounded-t-sm h-full shadow-[0_4px_10px_rgba(19,236,128,0.2)]"></div>
                                        <div className="w-full bg-[#e7f3ed] rounded-t-sm h-2/3"></div>
                                        <div className="w-full bg-[#e7f3ed] rounded-t-sm h-1/3"></div>
                                        <div className="w-full bg-[#e7f3ed] rounded-t-sm h-4/5"></div>
                                        <div className="w-full bg-[#13ec80]/40 rounded-t-sm h-1/2"></div>
                                    </div>
                                    <div className="flex justify-between mt-3 text-[10px] text-[#4c9a73] font-medium">
                                        <span>Mon</span><span>Tue</span><span className="text-[#13ec80] font-bold">Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                                    </div>
                                </div>

                                {/* Pie Chart Placeholder */}
                                <div className="bg-white rounded-xl border border-[#cfe7db] p-5 shadow-sm">
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-sm font-bold text-[#0d1b14]">Income Distribution</h3>
                                        <MaterialIcon name="pie_chart" className="text-[#4c9a73] text-lg" />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="relative size-28 rounded-full border-[10px] border-[#e7f3ed] flex items-center justify-center">
                                            {/* CSS Clips for chart segments */}
                                            <div className="absolute inset-0 border-[10px] border-[#13ec80] rounded-full" style={{ clipPath: 'polygon(50% 50%, 50% 0%, 100% 0%, 100% 50%)' }}></div>
                                            <div className="absolute inset-0 border-[10px] border-[#13ec80]/40 rounded-full" style={{ clipPath: 'polygon(50% 50%, 100% 50%, 100% 100%, 50% 100%)' }}></div>
                                            <p className="text-[10px] font-bold text-center leading-none text-[#0d1b14]">Job<br />Revenue</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full bg-[#13ec80]"></div>
                                                <span className="text-xs text-[#4c9a73]">Job Fees (70%)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full bg-[#13ec80]/40"></div>
                                                <span className="text-xs text-[#4c9a73]">Tips (20%)</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="size-2 rounded-full bg-[#e7f3ed]"></div>
                                                <span className="text-xs text-[#4c9a73]">Bonuses (10%)</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Transaction History Table */}
                            <div className="bg-white rounded-xl border border-[#cfe7db] shadow-sm overflow-hidden">
                                <div className="p-5 border-b border-[#cfe7db] flex justify-between items-center">
                                    <h3 className="text-[#0d1b14] font-bold">Recent Activity</h3>
                                    <button className="text-sm font-semibold text-[#13ec80] hover:text-[#13ec80]/80">View All</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-[#f8fcfa] text-[#4c9a73] uppercase text-[10px] font-bold tracking-wider">
                                            <tr>
                                                <th className="px-5 py-3">Transaction</th>
                                                <th className="px-5 py-3">Date</th>
                                                <th className="px-5 py-3">Method</th>
                                                <th className="px-5 py-3">Status</th>
                                                <th className="px-5 py-3 text-right">Amount</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#cfe7db]">
                                            <tr className="hover:bg-[#13ec80]/5 transition-colors group">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded bg-[#e7f3ed] flex items-center justify-center group-hover:bg-[#13ec80]/20 transition-colors">
                                                            <MaterialIcon name="build" className="text-[#13ec80] text-lg" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#0d1b14]">Job #45291</p>
                                                            <p className="text-[10px] text-[#4c9a73]">Electrical Repair</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-[#4c9a73]">Oct 24, 2023</td>
                                                <td className="px-5 py-4 font-medium italic text-[#0d1b14]">Wallet</td>
                                                <td className="px-5 py-4">
                                                    <span className="bg-[#13ec80]/10 text-[#13ec80] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#13ec80]/20">SUCCESS</span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-[#0d1b14]">+$245.00</td>
                                            </tr>
                                            <tr className="hover:bg-[#13ec80]/5 transition-colors group">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded bg-[#f0f2f1] flex items-center justify-center group-hover:bg-[#13ec80]/20 transition-colors">
                                                            <MaterialIcon name="account_balance" className="text-[#4c9a73] text-lg" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#0d1b14]">Withdrawal</p>
                                                            <p className="text-[10px] text-[#4c9a73]">Chase •••• 4432</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-[#4c9a73]">Oct 23, 2023</td>
                                                <td className="px-5 py-4 font-medium italic text-[#0d1b14]">Bank</td>
                                                <td className="px-5 py-4">
                                                    <span className="bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full text-[10px] font-bold border border-amber-200">PROCESSING</span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-[#0d1b14]">-$500.00</td>
                                            </tr>
                                            <tr className="hover:bg-[#13ec80]/5 transition-colors group">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="size-8 rounded bg-[#e7f3ed] flex items-center justify-center group-hover:bg-[#13ec80]/20 transition-colors">
                                                            <MaterialIcon name="card_giftcard" className="text-[#13ec80] text-lg" />
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-[#0d1b14]">Performance Bonus</p>
                                                            <p className="text-[10px] text-[#4c9a73]">Oct Maintenance Peak</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-[#4c9a73]">Oct 22, 2023</td>
                                                <td className="px-5 py-4 font-medium italic text-[#0d1b14]">Direct Credit</td>
                                                <td className="px-5 py-4">
                                                    <span className="bg-[#13ec80]/10 text-[#13ec80] px-2 py-0.5 rounded-full text-[10px] font-bold border border-[#13ec80]/20">SUCCESS</span>
                                                </td>
                                                <td className="px-5 py-4 text-right font-bold text-[#0d1b14]">+$50.00</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: 4 units wide (AI Sidebar) */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            {/* 5. AI Financial Assistant */}
                            <div className="bg-gradient-to-br from-[#152a20] to-[#0d1b14] text-white rounded-xl p-6 shadow-xl sticky top-24">
                                <div className="flex items-center gap-2 mb-6">
                                    <MaterialIcon name="auto_awesome" className="text-[#13ec80]" />
                                    <h3 className="font-bold tracking-tight">AI Financial Assistant</h3>
                                </div>
                                <div className="flex flex-col gap-5">
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-xs text-[#13ec80] font-bold uppercase tracking-widest">Tax Estimation</span>
                                            <MaterialIcon name="info" className="text-sm opacity-50" />
                                        </div>
                                        <p className="text-2xl font-bold">$1,240.00</p>
                                        <p className="text-xs text-white/60 mt-1">Suggested set aside for Q4 taxes.</p>
                                        <button className="mt-3 w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold transition-colors">Move to Tax Pot</button>
                                    </div>
                                    <div className="flex flex-col gap-4">
                                        <div className="flex gap-3">
                                            <div className="size-8 rounded-full bg-[#13ec80]/20 flex items-center justify-center shrink-0">
                                                <MaterialIcon name="lightbulb" className="text-[#13ec80] text-sm" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Savings Suggestion</p>
                                                <p className="text-xs text-white/70 leading-relaxed">Save $75 more this week to reach your 'Holiday Fund' goal by December.</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="size-8 rounded-full bg-[#13ec80]/20 flex items-center justify-center shrink-0">
                                                <MaterialIcon name="calendar_today" className="text-[#13ec80] text-sm" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Peak Earning Insight</p>
                                                <p className="text-xs text-white/70 leading-relaxed">Tuesdays are your top-earning days. Aim for 2 more morning slots!</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="border-t border-white/10 pt-4 mt-2">
                                        <div className="flex items-center justify-between text-xs mb-3">
                                            <span className="text-white/60">Financial Health Score</span>
                                            <span className="text-[#13ec80] font-bold">85/100</span>
                                        </div>
                                        <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                                            <div className="bg-[#13ec80] h-full w-[85%] rounded-full shadow-[0_0_8px_#13ec80]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Mini Banner */}
                            <div className="bg-[#13ec80]/10 border border-[#13ec80]/20 rounded-xl p-5">
                                <h4 className="text-xs font-bold text-[#0d1b14] uppercase mb-2">Professional Tip</h4>
                                <p className="text-sm text-[#4c9a73] leading-snug">Link your invoices to your bank account for 2x faster settlements.</p>
                                <button className="inline-block mt-3 text-xs font-bold text-[#13ec80] underline underline-offset-4">Learn How</button>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <footer className="border-t border-[#cfe7db] py-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[#4c9a73] text-xs mt-6">
                        <p>© 2023 TechWallet Hub Inc. All rights reserved.</p>
                        <div className="flex gap-6 font-semibold">
                            <span className="hover:text-[#13ec80] transition-colors cursor-pointer">Privacy Policy</span>
                            <span className="hover:text-[#13ec80] transition-colors cursor-pointer">Support</span>
                            <span className="hover:text-[#13ec80] transition-colors cursor-pointer">Security</span>
                        </div>
                    </footer>
                </div>
            </div>
        </TechnicianLayout>
    );
};

export default Wallet;
