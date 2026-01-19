import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';

const Offers = () => {
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const socket = useSocket();

    useEffect(() => {
        fetchOffers();

        if (socket) {
            socket.on('new_offer_created', (newOffer) => {
                setOffers(prev => [newOffer, ...prev]);
            });
            socket.on('offer_deleted', ({ id }) => {
                setOffers(prev => prev.filter(o => o.id !== id));
            });
        }

        return () => {
            if (socket) {
                socket.off('new_offer_created');
                socket.off('offer_deleted');
            }
        };
    }, [socket]);

    const fetchOffers = async () => {
        try {
            const res = await api.get('/offers');
            if (res.data.success) {
                setOffers(res.data.offers);
            }
        } catch (err) {
            console.error('Failed to fetch offers', err);
        } finally {
            setLoading(false);
        }
    };

    // Helper to copy code
    const copyToClipboard = (code) => {
        navigator.clipboard.writeText(code);
        // Could show toast here
    };

    return (
        <div className="w-full max-w-[1600px] mx-auto font-sans">
            {/* Main Layout: 2 Columns */}
            <div className="flex flex-col xl:flex-row gap-6">

                {/* Left Column: Feed */}
                <div className="flex-1 flex flex-col gap-8 min-w-0">

                    {/* Hero Section (Static for now, can be dynamic later) */}
                    <section className="relative h-64 rounded-xl overflow-hidden shadow-md group">
                        <div className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCTg3C-3933lBIeuk6uWqw43TDE-mFL00QvELO9-Pk9-ixCZi2yYJj2LzUNcz-Oibhz6YepsniLpGwyO1isDmaX1MOPfgOU_pnSpfjhzvXyrWktAXim89Wm9nGj5rId42DyHS9JvW6jlCKe1nP9BEnKglN882YtDx0PAxsKBy1wUM3OP55MxyGAQ2zjK2_YZnDdkW75Nro89NqVNVPcrq5VFsnsR0bHr-CHsx_jDgDXHjRienVK16POJvEBAzmImkugwpjo1MN4rg')" }}></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 via-blue-900/40 to-transparent"></div>
                        <div className="relative h-full flex flex-col justify-center px-8 md:px-10 text-white">
                            <span className="inline-block bg-orange-500 text-[10px] font-bold px-2.5 py-1 rounded mb-3 w-fit uppercase tracking-widest shadow-sm">Seasonal Deal</span>
                            <h2 className="text-3xl md:text-4xl font-bold mb-2 break-words">Summer AC Overhaul</h2>
                            <p className="text-blue-100 max-w-lg mb-6 text-sm font-medium leading-relaxed break-words line-clamp-3">Professional AC servicing at your doorstep. Ensure 100% cooling efficiency this summer with our certified technicians.</p>
                            <div className="flex gap-3">
                                <button className="bg-[#3e74ea] text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-900/20 active:scale-95">Book Now</button>
                                <button className="bg-white/10 backdrop-blur-md text-white border border-white/20 px-5 py-2 rounded-lg font-bold text-sm hover:bg-white/20 transition-all active:scale-95">Learn More</button>
                            </div>
                        </div>
                    </section>

                    {/* Tabs Navigation */}
                    <div className="border-b border-gray-200 dark:border-gray-800">
                        <div className="flex gap-8">
                            <button className="pb-3 text-sm font-bold text-[#3e74ea] border-b-2 border-[#3e74ea]">Seasonal Offers</button>
                            <button className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#3e74ea] transition-colors border-b-2 border-transparent">AMC Packages</button>
                            <button className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-[#3e74ea] transition-colors border-b-2 border-transparent">Partner Deals</button>
                        </div>
                    </div>

                    {/* Promo Codes Grid (Dynamic) */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3e74ea]">local_activity</span>
                                Active Promo Codes
                            </h3>
                            <button className="text-[#3e74ea] text-xs font-bold uppercase tracking-wider hover:underline">View All</button>
                        </div>

                        {loading ? (
                            <div className="flex justify-center p-10"><span className="loading loading-spinner text-primary">Loading Offers...</span></div>
                        ) : offers.length === 0 ? (
                            <div className="text-center p-10 bg-gray-50 rounded-xl text-gray-500">No active offers at the moment.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                {offers.map((offer) => (
                                    <div key={offer.id} className="bg-white dark:bg-gray-900 p-5 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-[#3e74ea]/5 rounded-bl-full -mr-8 -mt-8"></div>
                                        <div className="flex items-start justify-between mb-4 relative">
                                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-center text-[#3e74ea]">
                                                {/* Dynamic Icon based on content? Defaulting for now */}
                                                <span className="material-symbols-outlined text-[20px]">local_offer</span>
                                            </div>
                                            {offer.badgeText && (
                                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/20 uppercase tracking-wide">
                                                    {offer.badgeText}
                                                </span>
                                            )}
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1 truncate">{offer.title}</h4>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 h-8 line-clamp-2 break-words">{offer.description}</p>

                                        {offer.code && (
                                            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded-lg border border-dashed border-gray-300 dark:border-gray-700 min-w-0">
                                                <span className="font-mono font-bold text-[#3e74ea] text-sm tracking-wider truncate mr-2">{offer.code}</span>
                                                <button
                                                    onClick={() => copyToClipboard(offer.code)}
                                                    className="text-[10px] font-bold text-gray-500 hover:text-[#3e74ea] transition-colors uppercase flex items-center gap-1 shrink-0">
                                                    <span className="material-symbols-outlined text-[14px]">content_copy</span>
                                                    Copy
                                                </button>
                                            </div>
                                        )}
                                        {/* Fallback if no code, showing discount */}
                                        {!offer.code && offer.discountValue && (
                                            <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-center text-xs font-bold">
                                                {offer.discountType === 'fixed' ? `₹${offer.discountValue} OFF` : `${offer.discountValue}% OFF`}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>

                    {/* AMC Packages (Static for now, implies Subscription products) */}
                    <section>
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                <span className="material-symbols-outlined text-[#3e74ea]">verified_user</span>
                                AMC Packages
                            </h3>
                            <button className="text-[#3e74ea] text-xs font-bold uppercase tracking-wider hover:underline">Compare Plans</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Plan 1 */}
                            <div className="bg-white dark:bg-gray-900 border-2 border-[#3e74ea] rounded-xl p-6 relative shadow-md overflow-hidden">
                                <div className="absolute top-0 right-0 bg-[#3e74ea] text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">Best Value</div>
                                <div className="mb-4">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Gold Care Plan</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">All-in-one home protection</p>
                                </div>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">₹8,999</span>
                                    <span className="text-sm text-gray-500">/year</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                                        4 Preventive Maintenance Visits
                                    </li>
                                    <li className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                                        Priority Service Scheduling
                                    </li>
                                    <li className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                                        Free AC Service (Once)
                                    </li>
                                </ul>
                                <button className="w-full py-3 bg-[#3e74ea] text-white rounded-lg font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]">Subscribe Now</button>
                            </div>

                            {/* Plan 2 */}
                            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm hover:border-gray-300 transition-colors">
                                <div className="mb-4">
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Platinum Elite</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Concierge maintenance services</p>
                                </div>
                                <div className="flex items-baseline gap-1 mb-6">
                                    <span className="text-3xl font-bold text-gray-900 dark:text-white">₹14,999</span>
                                    <span className="text-sm text-gray-500">/year</span>
                                </div>
                                <ul className="space-y-3 mb-8">
                                    <li className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                                        Unlimited Emergency Visits
                                    </li>
                                    <li className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                                        Home Deep Cleaning (Bi-annual)
                                    </li>
                                    <li className="flex items-center gap-2.5 text-sm text-gray-600 dark:text-gray-300 font-medium">
                                        <span className="material-symbols-outlined text-green-500 text-[18px]">check_circle</span>
                                        Dedicated Relationship Manager
                                    </li>
                                </ul>
                                <button className="w-full py-3 border border-[#3e74ea] text-[#3e74ea] rounded-lg font-bold text-sm hover:bg-blue-50 transition-all active:scale-[0.98]">Get Platinum</button>
                            </div>
                        </div>
                    </section>
                </div>

                {/* Right Sidebar: Sticky */}
                <div className="w-full xl:w-80 min-w-0 flex flex-col gap-6 xl:sticky xl:top-6 xl:self-start xl:h-[calc(100vh-3rem)] overflow-y-auto no-scrollbar pb-6">

                    {/* Rewards Card */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
                        <div className="flex items-center gap-2.5 mb-6">
                            <span className="material-symbols-outlined text-[#3e74ea] text-[24px]" style={{ fontVariationSettings: "'FILL' 1" }}>stars</span>
                            <h3 className="font-bold text-gray-900 dark:text-white text-base">Your Rewards</h3>
                        </div>
                        <div className="space-y-5">
                            <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-lg border border-blue-100 dark:border-gray-700">
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Available Points</p>
                                <p className="text-3xl font-extrabold text-gray-900 dark:text-white mt-1">2,450</p>
                                <button className="text-[10px] text-[#3e74ea] font-bold mt-2 hover:underline cursor-pointer uppercase tracking-wide">Redeem History</button>
                            </div>
                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase">Referral Goal</span>
                                    <span className="text-[11px] font-bold text-[#3e74ea]">3/5</span>
                                </div>
                                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#3e74ea] w-[60%] rounded-full shadow-[0_0_10px_rgba(62,116,234,0.3)]"></div>
                                </div>
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-2 leading-snug">Refer 2 more friends to unlock a <span className="font-bold text-gray-700 dark:text-gray-200">₹1,000 Gift Card</span>.</p>
                            </div>
                            <hr className="border-gray-100 dark:border-gray-800" />
                            <div>
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Latest Gains</h4>
                                <div className="space-y-3">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/10">
                                            <span className="material-symbols-outlined text-emerald-600 dark:text-emerald-400 text-[16px]">add_task</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">+250 Points</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Service: AC Repair #FIX102</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3 items-center">
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-900/10">
                                            <span className="material-symbols-outlined text-[#3e74ea] text-[16px]">group_add</span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-gray-900 dark:text-white">+500 Points</p>
                                            <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">Referral: Sarah M.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <button className="w-full mt-6 flex items-center justify-center gap-2 py-2.5 bg-[#3e74ea] text-white rounded-lg text-xs font-bold hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20 active:scale-[0.98]">
                            <span className="material-symbols-outlined text-[18px]">share</span>
                            Invite Friends
                        </button>
                    </div>

                    {/* Active Subs Card */}
                    <div className="bg-[#111318] rounded-xl p-5 text-white shadow-lg shadow-black/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50"></div>

                        <div className="flex items-center gap-2 mb-4 relative">
                            <span className="material-symbols-outlined text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            <h3 className="font-bold text-sm">Active Subscriptions</h3>
                        </div>
                        <div className="space-y-3 relative">
                            <div className="bg-white/5 p-3.5 rounded-lg border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                                <div className="flex justify-between items-start mb-1 gap-2">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">Standard AMC</p>
                                    <div className="size-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] shrink-0 mt-1"></div>
                                </div>
                                <p className="text-sm font-bold mb-3">Expires in 12 days</p>
                                <div className="flex items-center justify-between">
                                    <button className="text-[10px] font-bold text-[#111318] bg-white hover:bg-gray-100 px-3 py-1.5 rounded transition-colors">Renew Plan</button>
                                    <span className="material-symbols-outlined text-[16px] text-gray-400 cursor-pointer hover:text-white transition-colors">info</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Offers;
