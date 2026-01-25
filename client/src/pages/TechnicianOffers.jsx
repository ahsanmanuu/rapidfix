import React, { useState, useEffect } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';
import { getOffers, acceptOffer } from '../services/api';

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
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOffers = async () => {
            try {
                const res = await getOffers();
                if (res.data.success) {
                    setOffers(res.data.offers || []);
                }
            } catch (err) {
                console.error("Failed to fetch offers:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchOffers();
    }, []);

    const handleAccept = async (offerId) => {
        try {
            const res = await acceptOffer(offerId);
            if (res.data.success) {
                alert("Offer Accepted / Job Created!");
                // Refresh offers
                const updated = offers.filter(o => o.id !== offerId);
                setOffers(updated);
            }
        } catch (err) {
            console.error("Failed to accept offer:", err);
            alert(err.response?.data?.error || "Failed to accept offer");
        }
    };

    // Filter offers based on tab (Conceptual filtering for now)
    const filteredOffers = offers.filter(offer => {
        if (activeTab === 'Admin Offers') return true; // Show all for now
        // Implement specific logic based on offer properties later
        return true;
    });

    // Mock Content for Modals (Keep static for now as they are specific features)
    const renderModalContent = () => {
        switch (activeModal) {
            case 'offers':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-[#4c9a73]">You have {offers.length} active offers available.</p>
                        {offers.slice(0, 3).map(offer => (
                            <div key={offer.id} className="p-3 border border-[#13ec80] bg-[#13ec80]/5 rounded-lg flex gap-3 items-center">
                                <MaterialIcon name="bolt" className="text-[#13ec80]" />
                                <div>
                                    <p className="font-bold text-[#0d1b14] text-sm">{offer.title}</p>
                                    <p className="text-xs text-[#4c9a73]">{offer.description}</p>
                                </div>
                            </div>
                        ))}
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
                    </div>
                );
            case 'history':
                return (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm p-2 hover:bg-[#f6f8f7] rounded">
                            <span className="text-[#0d1b14] font-medium">Amazon Voucher</span>
                            <span className="text-[#4c9a73]">-500 pts</span>
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
                            {/* Static Promotional Cards (Can be made dynamic later) */}
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
                        </div>
                    </div>

                    {/* Section Header & Tabs */}
                    <div className="px-8 pb-4">
                        <div className="flex items-end justify-between mb-4">
                            <h2 className="text-[#0d1b14] text-2xl font-bold">Active Opportunities</h2>
                            <div className="flex gap-2">
                                <span className="text-xs text-[#4c9a73] font-medium">Viewing {offers.length} active offers</span>
                            </div>
                        </div>
                        <div className="flex border-b border-[#cfe7db] gap-8 overflow-x-auto">
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
                        {loading ? (
                            <div className="col-span-full py-10 text-center text-gray-400">Loading offers...</div>
                        ) : offers.length === 0 ? (
                            <div className="col-span-full py-10 text-center text-gray-400">No active offers at the moment.</div>
                        ) : (
                            offers.map(offer => (
                                <div key={offer.id} className="bg-white rounded-2xl border border-[#e7f3ed] overflow-hidden shadow-sm hover:shadow-lg transition-all group duration-300">
                                    <div className={`h-1.5 w-full ${offer.type === 'job_bid' ? 'bg-[#13ec80]' : 'bg-blue-500'}`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className={`p-2 rounded-lg ${offer.type === 'job_bid' ? 'bg-[#13ec80]/10 text-[#13ec80]' : 'bg-blue-50 text-blue-500'}`}>
                                                <MaterialIcon name={offer.type === 'job_bid' ? 'bolt' : 'workspace_premium'} />
                                            </div>
                                            {offer.expiryDate && (
                                                <span className="bg-red-50 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1">
                                                    <MaterialIcon name="timer" className="text-[14px]" />
                                                    {new Date(offer.expiryDate).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                        <h3 className="text-[#0d1b14] text-lg font-bold mb-1">{offer.title}</h3>
                                        <p className="text-sm text-[#4c9a73] mb-4">{offer.description}</p>

                                        <div className="mb-6">
                                            {offer.price ? (
                                                <div className="bg-[#f6f8f7] p-3 rounded-lg border border-[#e7f3ed]">
                                                    <p className="text-[9px] font-bold text-[#4c9a73] uppercase">Value</p>
                                                    <p className="text-xl font-bold text-[#0d1b14]">₹{offer.price}</p>
                                                </div>
                                            ) : (
                                                <div className="bg-[#13ec80]/5 p-4 rounded-xl">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-xs font-bold text-[#0d1b14]">CODE</span>
                                                        <span className="text-[10px] text-[#13ec80] font-bold cursor-pointer hover:underline">COPY</span>
                                                    </div>
                                                    <div className="flex items-center justify-between border-2 border-dashed border-[#13ec80]/30 p-2 rounded-lg">
                                                        <code className="font-bold text-[#0d1b14] tracking-wide">{offer.code || 'N/A'}</code>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleAccept(offer.id)}
                                            className="w-full py-3 bg-[#13ec80] text-[#0d1b14] rounded-xl font-bold text-sm shadow-md hover:shadow-lg hover:bg-[#13ec80]/90 transition-all">
                                            {offer.type === 'job_bid' ? 'Accept Job' : 'Claim Offer'}
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
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
