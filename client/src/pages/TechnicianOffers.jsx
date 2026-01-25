import React, { useState } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';

// Helper for Material Symbols
const MaterialIcon = ({ name, className = "" }) => (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

// Generic Modal Component
const Modal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-[#cfe7db] overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center p-5 border-b border-[#f0f7f4]">
                    <h3 className="text-lg font-bold text-[#0d1b14]">{title}</h3>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-[#f0f7f4] transition-colors text-[#4c9a73]">
                        <MaterialIcon name="close" className="text-xl" />
                    </button>
                </div>
                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {children}
                </div>
                <div className="p-4 bg-[#f8fcfa] border-t border-[#f0f7f4] flex justify-end">
                    <button onClick={onClose} className="px-4 py-2 bg-[#13ec80] text-[#0d1b14] font-bold text-sm rounded-lg hover:bg-[#13ec80]/90 transition-colors">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const TechnicianOffers = () => {
    const [activeTab, setActiveTab] = useState('Admin Offers');
    const [activeModal, setActiveModal] = useState(null); // 'offers', 'targets', 'contracts', 'history'

    // Mock Content for Modals
    const renderModalContent = () => {
        switch (activeModal) {
            case 'offers':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-[#4c9a73]">You have 3 active offers available this week.</p>
                        <div className="p-3 border border-[#13ec80] bg-[#13ec80]/5 rounded-lg flex gap-3 items-center">
                            <MaterialIcon name="bolt" className="text-[#13ec80]" />
                            <div>
                                <p className="font-bold text-[#0d1b14] text-sm">Weekend Hustle</p>
                                <p className="text-xs text-[#4c9a73]">1.5x Payout Surge</p>
                            </div>
                        </div>
                    </div>
                );
            case 'targets':
                return (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="font-bold text-[#0d1b14]">Weekly Goal</p>
                            <span className="text-xs font-bold text-[#13ec80]">On Track</span>
                        </div>
                        <div className="w-full bg-[#e7f3ed] h-3 rounded-full overflow-hidden">
                            <div className="bg-[#13ec80] h-full w-[75%] rounded-full"></div>
                        </div>
                        <p className="text-xs text-[#4c9a73]">Completed 15/20 Jobs</p>
                    </div>
                );
            case 'contracts':
                return (
                    <div className="space-y-3">
                        <div className="p-3 border border-[#e7f3ed] rounded-lg">
                            <div className="flex justify-between mb-1">
                                <p className="font-bold text-[#0d1b14] text-sm">Green Valley Apts</p>
                                <span className="bg-[#e7f3ed] text-[#4c9a73] text-[10px] px-2 py-0.5 rounded font-bold">Active</span>
                            </div>
                            <p className="text-xs text-[#4c9a73]">Monthly Maintenance • ₹15,000/mo</p>
                        </div>
                        <div className="p-3 border border-[#e7f3ed] rounded-lg opacity-60">
                            <div className="flex justify-between mb-1">
                                <p className="font-bold text-[#0d1b14] text-sm">City Mall Plaza</p>
                                <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded font-bold">Pending</span>
                            </div>
                            <p className="text-xs text-[#4c9a73]">Electrical Contract • Reviewing</p>
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm p-2 hover:bg-[#f6f8f7] rounded">
                            <span className="text-[#0d1b14] font-medium">Amazon Voucher</span>
                            <span className="text-[#4c9a73]">-500 pts</span>
                        </div>
                        <div className="flex justify-between items-center text-sm p-2 hover:bg-[#f6f8f7] rounded">
                            <span className="text-[#0d1b14] font-medium">Cash Withdrawal</span>
                            <span className="text-[#4c9a73]">-1200 pts</span>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    const getModalTitle = () => {
        switch (activeModal) {
            case 'offers': return 'Active Offers';
            case 'targets': return 'My Targets';
            case 'contracts': return 'AMC Contracts';
            case 'history': return 'Redemption History';
            default: return '';
        }
    };

    return (
        <TechnicianLayout title="Technician Hub">
            <div className="flex flex-1 flex-col lg:flex-row h-full overflow-hidden font-sans text-[#0d1b14]">
                {/* Internal Sidebar */}
                <aside className="flex w-full lg:w-72 flex-col gap-6 bg-white border-b lg:border-b-0 lg:border-r border-[#e7f3ed] p-6 h-auto lg:h-full overflow-y-auto shrink-0">

                    {/* Progress Tracker */}
                    <div className="flex flex-col gap-4 p-4 rounded-xl bg-[#13ec80]/10 border border-[#13ec80]/20">
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-wider text-[#0d1b14]">Targeted Goal</span>
                            <span className="text-xs font-bold text-[#13ec80] bg-black px-2 py-0.5 rounded-full">Active</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm font-medium text-[#0d1b14]">
                                <span>Weekend Surge</span>
                                <span>3/5 Jobs</span>
                            </div>
                            <div className="w-full bg-[#e7f3ed] h-2 rounded-full overflow-hidden">
                                <div className="bg-[#13ec80] h-full rounded-full" style={{ width: '60%' }}></div>
                            </div>
                        </div>
                        <div className="mt-2 flex items-start gap-2 bg-white/50 p-2 rounded-lg">
                            <MaterialIcon name="psychology" className="text-[#13ec80] text-lg" />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-[#4c9a73]">AI PREDICTION</span>
                                <p className="text-[11px] text-[#0d1b14] leading-tight">85% likelihood of completion based on your current speed.</p>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tiles */}
                    <div className="flex flex-col gap-2">
                        <p className="text-xs font-bold text-[#4c9a73] px-1 mb-2 uppercase tracking-widest">Quick Actions</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setActiveModal('offers')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f6f8f7] border border-[#e7f3ed] hover:border-[#13ec80] hover:bg-[#13ec80]/5 transition-all gap-2 text-center group">
                                <MaterialIcon name="storefront" className="text-[#4c9a73] group-hover:text-[#13ec80] transition-colors" />
                                <span className="text-[11px] font-bold text-[#0d1b14] leading-tight">Active Offers</span>
                            </button>
                            <button onClick={() => setActiveModal('targets')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f6f8f7] border border-[#e7f3ed] hover:border-[#13ec80] hover:bg-[#13ec80]/5 transition-all gap-2 text-center group">
                                <MaterialIcon name="track_changes" className="text-[#4c9a73] group-hover:text-[#13ec80] transition-colors" />
                                <span className="text-[11px] font-bold text-[#0d1b14] leading-tight">My Targets</span>
                            </button>
                            <button onClick={() => setActiveModal('contracts')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f6f8f7] border border-[#e7f3ed] hover:border-[#13ec80] hover:bg-[#13ec80]/5 transition-all gap-2 text-center group">
                                <MaterialIcon name="contract" className="text-[#4c9a73] group-hover:text-[#13ec80] transition-colors" />
                                <span className="text-[11px] font-bold text-[#0d1b14] leading-tight">AMC Contracts</span>
                            </button>
                            <button onClick={() => setActiveModal('history')} className="flex flex-col items-center justify-center p-3 rounded-xl bg-[#f6f8f7] border border-[#e7f3ed] hover:border-[#13ec80] hover:bg-[#13ec80]/5 transition-all gap-2 text-center group">
                                <MaterialIcon name="history" className="text-[#4c9a73] group-hover:text-[#13ec80] transition-colors" />
                                <span className="text-[11px] font-bold text-[#0d1b14] leading-tight">History</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-[#e7f3ed] pt-6 hidden lg:block">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex flex-col">
                                <span className="text-xs text-[#4c9a73]">Total Earned</span>
                                <span className="text-xl font-bold text-[#0d1b14]">₹14,500</span>
                            </div>
                            <MaterialIcon name="payments" className="text-[#13ec80]" />
                        </div>
                        <button className="w-full py-3 bg-[#13ec80] text-[#0d1b14] rounded-lg font-bold text-sm tracking-wide shadow-lg shadow-[#13ec80]/20 hover:shadow-[#13ec80]/40 transition-shadow">
                            Withdraw Earnings
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-y-auto bg-[#f8fcfa]">
                    {/* Featured Carousel */}
                    <div className="px-8 pt-8">
                        <div className="flex overflow-x-auto gap-4 pb-6 scrollbar-hide snap-x">
                            {/* Carousel Card 1 */}
                            <div className="min-w-[85vw] md:min-w-[600px] flex-1 snap-start relative group rounded-2xl overflow-hidden bg-black aspect-[21/9] shadow-lg">
                                <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2000&auto=format&fit=crop')" }}></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent"></div>
                                <div className="relative h-full flex flex-col justify-center p-6 md:p-10 max-w-xl">
                                    <span className="bg-[#13ec80] text-[#0d1b14] text-[10px] font-bold px-2 py-1 rounded-full w-fit mb-4 uppercase tracking-wider">High Value</span>
                                    <h2 className="text-white text-2xl md:text-3xl font-bold mb-2 leading-tight">AMC Partnership: High-Value Contracts</h2>
                                    <p className="text-gray-300 text-sm mb-6 max-w-sm hidden md:block">Join the Annual Maintenance Program for steady monthly income and exclusive priority jobs.</p>
                                    <button className="flex items-center gap-2 bg-white text-black px-6 py-2.5 rounded-lg font-bold text-sm w-fit transition-transform hover:scale-105 hover:bg-gray-100">
                                        Apply Now <MaterialIcon name="arrow_forward" className="text-sm" />
                                    </button>
                                </div>
                            </div>
                            {/* Carousel Card 2 */}
                            <div className="min-w-[85vw] md:min-w-[600px] flex-1 snap-start relative group rounded-2xl overflow-hidden bg-[#102219] aspect-[21/9] shadow-lg">
                                <div className="absolute inset-0 bg-cover bg-center opacity-60 transition-transform duration-500 group-hover:scale-105" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2000&auto=format&fit=crop')" }}></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-[#0d1b14]/90 to-transparent"></div>
                                <div className="relative h-full flex flex-col justify-center p-6 md:p-10 max-w-xl">
                                    <span className="bg-orange-400 text-white text-[10px] font-bold px-2 py-1 rounded-full w-fit mb-4 uppercase tracking-wider">Seasonal Surge</span>
                                    <h2 className="text-white text-2xl md:text-3xl font-bold mb-2 leading-tight">2x Payouts This Weekend</h2>
                                    <p className="text-gray-300 text-sm mb-6 max-w-sm hidden md:block">Complete 3+ emergency calls during peak hours (6 PM - 11 PM) for double bonus points.</p>
                                    <button className="flex items-center gap-2 bg-[#13ec80] text-[#0d1b14] px-6 py-2.5 rounded-lg font-bold text-sm w-fit transition-transform hover:scale-105 hover:bg-[#13ec80]/90">
                                        Track Progress <MaterialIcon name="trending_up" className="text-sm" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section Header & Tabs */}
                    <div className="px-8 pb-4">
                        <div className="flex items-end justify-between mb-4">
                            <h2 className="text-[#0d1b14] text-2xl font-bold">Active Opportunities</h2>
                            <div className="flex gap-2">
                                <span className="text-xs text-[#4c9a73] font-medium">Viewing 12 active offers</span>
                            </div>
                        </div>
                        <div className="flex border-b border-[#cfe7db] gap-8 overflow-x-auto"> {/* Added scroll for tabs on mobile */}
                            {['Admin Offers', 'Super Admin Exclusives', 'Targeted Goals', 'Seasonal'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex flex-col items-center justify-center border-b-[3px] pb-3 pt-2 px-1 transition-colors whitespace-nowrap ${activeTab === tab
                                        ? 'border-[#13ec80] text-[#0d1b14]'
                                        : 'border-transparent text-[#4c9a73] hover:text-[#0d1b14]'
                                        }`}
                                >
                                    <p className="text-sm font-bold leading-normal">{tab}</p>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Offers Grid */}
                    <div className="px-8 pb-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {/* Offer Card 1: Annual Bonus */}
                        <div className="bg-white rounded-2xl border border-[#e7f3ed] overflow-hidden shadow-sm hover:shadow-lg transition-all group duration-300">
                            <div className="h-1.5 bg-blue-500 w-full"></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                                        <MaterialIcon name="workspace_premium" />
                                    </div>
                                    <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <MaterialIcon name="timer" className="text-[14px]" /> 12d Left
                                    </span>
                                </div>
                                <h3 className="text-[#0d1b14] text-lg font-bold mb-1">Annual Loyalty Bonus</h3>
                                <p className="text-sm text-[#4c9a73] mb-4">Complete 500 jobs this year to unlock elite status rewards.</p>
                                <div className="bg-[#f6f8f7] p-4 rounded-xl mb-6">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-bold text-[#4c9a73] uppercase tracking-wider mb-1">Potential Reward</p>
                                            <p className="text-2xl font-black text-[#0d1b14]">₹50,000</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-blue-500 mb-1 uppercase">Progress</p>
                                            <p className="text-sm font-bold text-[#0d1b14]">412/500</p>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 bg-[#e7f3ed] rounded-full mt-3 overflow-hidden">
                                        <div className="bg-blue-500 h-full w-[82%] rounded-full"></div>
                                    </div>
                                </div>
                                <button className="w-full py-3 border-2 border-[#13ec80] text-[#0d1b14] rounded-xl font-bold text-sm hover:bg-[#13ec80] transition-colors">
                                    View Full Milestones
                                </button>
                            </div>
                        </div>

                        {/* Offer Card 2: Targeted */}
                        <div className="bg-white rounded-2xl border border-[#e7f3ed] overflow-hidden shadow-sm hover:shadow-lg transition-all group duration-300">
                            <div className="h-1.5 bg-[#13ec80] w-full"></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-[#13ec80]/10 text-[#13ec80] rounded-lg">
                                        <MaterialIcon name="bolt" />
                                    </div>
                                    <span className="bg-orange-50 text-orange-500 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <MaterialIcon name="schedule" className="text-[14px]" /> Expires in 14h
                                    </span>
                                </div>
                                <h3 className="text-[#0d1b14] text-lg font-bold mb-1">Weekend Hustle</h3>
                                <p className="text-sm text-[#4c9a73] mb-4">Complete 5 extra jobs this weekend for an instant 1.5x payout surge.</p>
                                <div className="bg-[#13ec80]/5 p-4 rounded-xl mb-6">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-[#0d1b14]">PROMO CODE</span>
                                        <span className="text-[10px] text-[#13ec80] font-bold cursor-pointer hover:underline">CLICK TO COPY</span>
                                    </div>
                                    <div className="flex items-center justify-between border-2 border-dashed border-[#13ec80]/30 p-2 rounded-lg cursor-pointer hover:bg-[#13ec80]/10 transition-colors group/code">
                                        <code className="font-bold text-[#0d1b14] tracking-wide">WKNDSURGE24</code>
                                        <MaterialIcon name="content_copy" className="text-sm text-[#4c9a73] group-hover/code:text-[#13ec80]" />
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-[#13ec80] text-[#0d1b14] rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:bg-[#13ec80]/90 transition-all">
                                    Activate Offer
                                </button>
                            </div>
                        </div>

                        {/* Offer Card 3: AMC Plans */}
                        <div className="bg-white rounded-2xl border border-[#e7f3ed] overflow-hidden shadow-sm hover:shadow-lg transition-all group duration-300">
                            <div className="h-1.5 bg-orange-400 w-full"></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-orange-50 text-orange-400 rounded-lg">
                                        <MaterialIcon name="assignment_ind" />
                                    </div>
                                    <span className="bg-green-50 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                        <MaterialIcon name="verified" className="text-[14px]" /> Featured
                                    </span>
                                </div>
                                <h3 className="text-[#0d1b14] text-lg font-bold mb-1">Elite AMC Portfolio</h3>
                                <p className="text-sm text-[#4c9a73] mb-4">Lock in 10 high-value building maintenance contracts in your area.</p>
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-[#f6f8f7] p-3 rounded-lg border border-[#e7f3ed]">
                                        <p className="text-[9px] font-bold text-[#4c9a73] uppercase">Avg Contract</p>
                                        <p className="text-sm font-bold text-[#0d1b14]">₹12,000/mo</p>
                                    </div>
                                    <div className="bg-[#f6f8f7] p-3 rounded-lg border border-[#e7f3ed]">
                                        <p className="text-[9px] font-bold text-[#4c9a73] uppercase">Commitment</p>
                                        <p className="text-sm font-bold text-[#0d1b14]">12 Months</p>
                                    </div>
                                </div>
                                <button className="w-full py-3 bg-black text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all">
                                    Review Contracts
                                </button>
                            </div>
                        </div>

                        {/* Offer Card 4: Referral */}
                        <div className="bg-white rounded-2xl border border-[#e7f3ed] overflow-hidden shadow-sm hover:shadow-lg transition-all group duration-300">
                            <div className="h-1.5 bg-purple-500 w-full"></div>
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                                        <MaterialIcon name="group_add" />
                                    </div>
                                    <span className="bg-purple-50 text-purple-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase">Ongoing</span>
                                </div>
                                <h3 className="text-[#0d1b14] text-lg font-bold mb-1">Refer a Pro</h3>
                                <p className="text-sm text-[#4c9a73] mb-4">Earn ₹2,000 for every certified plumber or electrician you bring to the hub.</p>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="flex -space-x-3">
                                        <div className="size-8 rounded-full border-2 border-white bg-gray-200 bg-cover" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=11')" }}></div>
                                        <div className="size-8 rounded-full border-2 border-white bg-gray-300 bg-cover" style={{ backgroundImage: "url('https://i.pravatar.cc/100?img=12')" }}></div>
                                        <div className="size-8 rounded-full border-2 border-white bg-[#13ec80] flex items-center justify-center text-[10px] font-bold text-[#0d1b14]">+</div>
                                    </div>
                                    <span className="text-xs font-semibold text-[#0d1b14]">4 Pros Referred</span>
                                </div>
                                <button className="w-full py-3 bg-[#e7f3ed] text-[#0d1b14] rounded-xl font-bold text-sm hover:bg-[#13ec80] transition-all">
                                    Invite Friends
                                </button>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Modal Overlay */}
                <Modal
                    isOpen={!!activeModal}
                    onClose={() => setActiveModal(null)}
                    title={getModalTitle()}
                >
                    {renderModalContent()}
                </Modal>
            </div>
        </TechnicianLayout>
    );
};

export default TechnicianOffers;
