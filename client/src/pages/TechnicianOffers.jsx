import React, { useState, useEffect } from 'react';
import TechnicianLayout from '../components/TechnicianLayout';
import { getOffers, acceptOffer } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Store, Target, FileText, History, Bolt, Star, Timer, Copy,
    ArrowRight, BrainCircuit, TrendingUp, CheckCircle2, Wallet, Award, Briefcase, Zap
} from 'lucide-react';

const GlassCard = ({ children, className = "", delay = 0 }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay }}
        className={`bg-slate-900/40 backdrop-blur-md border border-white/5 rounded-2xl shadow-xl ${className}`}
    >
        {children}
    </motion.div>
);

const GlassModal = ({ children, onClose, title }) => (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md" onClick={onClose}>
        <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex justify-between items-center p-6 border-b border-white/10 bg-white/5 relative z-10">
                <h3 className="text-lg font-black text-white tracking-tight uppercase">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors text-slate-400 hover:text-white">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar relative z-10">
                {children}
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-end relative z-10">
                <button onClick={onClose} className="px-6 py-2.5 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-700 transition-colors uppercase tracking-widest border border-white/5">
                    Close
                </button>
            </div>
        </motion.div>
    </div>
);

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
                // You might want to show a nicer toast here
                const updated = offers.filter(o => o.id !== offerId);
                setOffers(updated);
            }
        } catch (err) {
            console.error("Failed to accept offer:", err);
            // Handle error state or user notification
        }
    };

    const renderModalContent = () => {
        switch (activeModal) {
            case 'offers':
                return (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-400 font-medium">You have <span className="text-emerald-400 font-bold">{offers.length}</span> active offers available.</p>
                        {offers.slice(0, 3).map(offer => (
                            <div key={offer.id} className="p-4 border border-white/10 bg-slate-800/50 rounded-xl flex gap-4 items-center hover:border-emerald-500/30 transition-colors">
                                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
                                    <Bolt size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-white text-sm">{offer.title}</p>
                                    <p className="text-xs text-slate-400 mt-0.5">{offer.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                );
            case 'targets':
                return (
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <p className="font-bold text-white uppercase text-xs tracking-wider">Weekly Goal</p>
                                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">ON TRACK</span>
                            </div>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '75%' }}
                                    className="bg-emerald-500 h-full rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                                ></motion.div>
                            </div>
                            <p className="text-xs text-slate-400 font-medium text-right">Completed 15/20 Jobs</p>
                        </div>
                    </div>
                );
            case 'contracts':
                return (
                    <div className="space-y-3">
                        <div className="p-4 border border-white/10 bg-slate-800/50 rounded-xl hover:bg-slate-800/70 transition-colors group cursor-pointer">
                            <div className="flex justify-between mb-2">
                                <p className="font-bold text-white text-sm group-hover:text-indigo-400 transition-colors">Green Valley Apts</p>
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] px-2 py-0.5 rounded font-bold uppercase">Active</span>
                            </div>
                            <p className="text-xs text-slate-400 flex items-center gap-2">
                                <Briefcase size={12} /> Monthly Maintenance • ₹15,000/mo
                            </p>
                        </div>
                    </div>
                );
            case 'history':
                return (
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm p-4 bg-slate-800/30 border border-white/5 rounded-xl">
                            <span className="text-white font-medium flex items-center gap-2">
                                <Award size={16} className="text-amber-400" /> Amazon Voucher
                            </span>
                            <span className="text-rose-400 font-bold font-mono">-500 pts</span>
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
            <div className="flex flex-1 flex-col lg:flex-row h-full font-sans text-slate-200 bg-slate-950 overflow-hidden">
                {/* Decorative BG */}
                <div className="fixed inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute top-[10%] left-[5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px] animate-pulse-slow"></div>
                    <div className="absolute bottom-[10%] right-[5%] w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
                </div>

                {/* Internal Sidebar */}
                <aside className="relative flex w-full lg:w-80 flex-col gap-6 bg-slate-900/50 border-b lg:border-b-0 lg:border-r border-white/5 p-6 h-auto lg:h-full overflow-y-auto shrink-0 backdrop-blur-sm z-10">

                    {/* Progress Tracker */}
                    <GlassCard className="p-5 bg-gradient-to-br from-indigo-900/20 to-slate-900/50 border-indigo-500/20">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Targeted Goal</span>
                            <span className="text-[10px] font-bold text-white bg-indigo-500/20 border border-indigo-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-indigo-400 animate-pulse"></span> Active
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs font-bold text-white">
                                <span className="flex items-center gap-1.5"><Zap size={12} className="text-amber-400" /> Weekend Surge</span>
                                <span>3/5 Jobs</span>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: '60%' }}
                                    transition={{ duration: 1, delay: 0.5 }}
                                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                ></motion.div>
                            </div>
                        </div>
                        <div className="mt-4 flex items-start gap-3 bg-slate-950/50 p-3 rounded-xl border border-white/5">
                            <BrainCircuit className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-0.5">AI Prediction</span>
                                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">85% likelihood of completion based on your current speed.</p>
                            </div>
                        </div>
                    </GlassCard>

                    {/* Navigation Tiles */}
                    <div className="flex flex-col gap-3">
                        <p className="text-[10px] font-black text-slate-500 px-1 uppercase tracking-widest">Quick Actions</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setActiveModal('offers')} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all gap-2 text-center group">
                                <Store className="text-slate-400 group-hover:text-emerald-400 transition-colors" size={20} />
                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase tracking-wider">Offers</span>
                            </button>
                            <button onClick={() => setActiveModal('targets')} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all gap-2 text-center group">
                                <Target className="text-slate-400 group-hover:text-indigo-400 transition-colors" size={20} />
                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase tracking-wider">Targets</span>
                            </button>
                            <button onClick={() => setActiveModal('contracts')} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all gap-2 text-center group">
                                <FileText className="text-slate-400 group-hover:text-blue-400 transition-colors" size={20} />
                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase tracking-wider">Contracts</span>
                            </button>
                            <button onClick={() => setActiveModal('history')} className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-800/40 border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all gap-2 text-center group">
                                <History className="text-slate-400 group-hover:text-amber-400 transition-colors" size={20} />
                                <span className="text-[10px] font-bold text-slate-300 group-hover:text-white uppercase tracking-wider">History</span>
                            </button>
                        </div>
                    </div>

                    <div className="mt-auto border-t border-white/5 pt-6 hidden lg:block">
                        <div className="flex items-center justify-between mb-4 px-1">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Earned</span>
                                <span className="text-2xl font-black text-white tracking-tight">₹14,500</span>
                            </div>
                            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                                <Wallet size={20} />
                            </div>
                        </div>
                        <button className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black text-xs tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 hover:shadow-emerald-500/30 transition-all uppercase hover:scale-[1.02] active:scale-[0.98]">
                            Withdraw Earnings
                        </button>
                    </div>
                </aside>

                {/* Main Content Area */}
                <div className="relative flex-1 flex flex-col overflow-y-auto z-10 custom-scrollbar">
                    {/* Featured Carousel */}
                    <div className="px-6 md:px-8 pt-6 md:pt-8 min-h-[300px]">
                        <div className="flex overflow-x-visible gap-6 pb-8 snap-x">
                            {/* Static Promotional Cards */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="min-w-full md:min-w-[650px] flex-1 snap-start relative group rounded-3xl overflow-hidden bg-slate-900 aspect-[21/9] shadow-2xl border border-white/10"
                            >
                                <div className="absolute inset-0 bg-cover bg-center opacity-40 transition-transform duration-700 group-hover:scale-105 saturate-0 group-hover:saturate-100" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2000&auto=format&fit=crop')" }}></div>
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/80 to-transparent"></div>
                                <div className="relative h-full flex flex-col justify-center p-8 md:p-12 max-w-2xl">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className="bg-emerald-500 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg shadow-emerald-500/30">High Value</span>
                                        <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"><Star size={12} fill="currentColor" /> Premium Partner</span>
                                    </div>
                                    <h2 className="text-white text-3xl md:text-4xl font-black mb-3 leading-tight tracking-tight">AMC Partnership: <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">High-Value Contracts</span></h2>
                                    <p className="text-slate-300 text-sm mb-8 max-w-md font-medium leading-relaxed hidden md:block">Join the Annual Maintenance Program for steady monthly income, exclusive priority jobs, and guaranteed payouts.</p>
                                    <button className="flex items-center gap-3 bg-white text-slate-950 px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest w-fit transition-all hover:scale-105 hover:bg-slate-200">
                                        Apply Now <ArrowRight size={16} />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Section Header & Tabs */}
                    <div className="px-6 md:px-8 pb-4 sticky top-0 z-20 bg-slate-950/80 backdrop-blur-md border-b border-white/5 pt-2">
                        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
                            <div>
                                <h2 className="text-white text-2xl font-black tracking-tight mb-1">Active Opportunities</h2>
                                <p className="text-slate-400 text-sm font-medium">Explore and claim available jobs and offers.</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-lg border border-white/5">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">{offers.length} active offers</span>
                            </div>
                        </div>
                        <div className="flex border-b border-white/5 gap-8 overflow-x-auto no-scrollbar">
                            {['Admin Offers', 'Super Admin Exclusives', 'Targeted Goals', 'Seasonal'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`relative flex flex-col items-center justify-center pb-4 px-1 transition-all whitespace-nowrap outline-none ${activeTab === tab
                                        ? 'text-white'
                                        : 'text-slate-500 hover:text-slate-300'
                                        }`}
                                >
                                    <p className="text-sm font-bold leading-normal tracking-wide">{tab}</p>
                                    {activeTab === tab && (
                                        <motion.div
                                            layoutId="activeTab"
                                            className="absolute bottom-0 w-full h-[2px] bg-gradient-to-r from-indigo-500 to-emerald-500"
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Offers Grid */}
                    <div className="px-6 md:px-8 py-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 pb-20">
                        {loading ? (
                            <div className="col-span-full py-20 flex flex-col items-center justify-center text-slate-500 gap-4">
                                <div className="size-10 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin"></div>
                                <p className="text-xs font-bold uppercase tracking-widest">Loading offers...</p>
                            </div>
                        ) : offers.length === 0 ? (
                            <div className="col-span-full py-20 text-center space-y-4">
                                <div className="size-20 bg-slate-900 rounded-full flex items-center justify-center mx-auto border border-white/5">
                                    <Store className="text-slate-700" size={32} />
                                </div>
                                <p className="text-slate-500 font-bold">No active offers at the moment.</p>
                            </div>
                        ) : (
                            offers.map((offer, index) => (
                                <GlassCard key={offer.id} delay={index * 0.1} className="overflow-hidden group hover:border-white/10 hover:shadow-2xl hover:shadow-emerald-900/10 transition-all duration-300">
                                    <div className={`h-1 w-full bg-gradient-to-r ${offer.type === 'job_bid' ? 'from-emerald-500 to-teal-500' : 'from-blue-500 to-indigo-500'}`}></div>
                                    <div className="p-6">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className={`p-3 rounded-xl border border-white/5 ${offer.type === 'job_bid' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                                {offer.type === 'job_bid' ? <Bolt size={20} /> : <Award size={20} />}
                                            </div>
                                            {offer.expiryDate && (
                                                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400">
                                                    <Timer size={12} />
                                                    <span className="text-[10px] font-black uppercase tracking-wider">{new Date(offer.expiryDate).toLocaleDateString()}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 mb-6 min-h-[5rem]">
                                            <h3 className="text-white text-lg font-black tracking-tight leading-tight group-hover:text-emerald-400 transition-colors">{offer.title}</h3>
                                            <p className="text-sm text-slate-400 font-medium leading-relaxed">{offer.description}</p>
                                        </div>

                                        <div className="mb-6">
                                            {offer.price ? (
                                                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 flex flex-col items-center">
                                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Value</p>
                                                    <p className="text-2xl font-black text-white tracking-tight">₹{offer.price}</p>
                                                </div>
                                            ) : (
                                                <div className="bg-slate-950/50 p-4 rounded-xl border border-white/5 group-hover:border-emerald-500/20 transition-colors">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">CODE</span>
                                                        <button
                                                            className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold hover:text-emerald-300 transition-colors"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                navigator.clipboard.writeText(offer.code);
                                                            }}
                                                        >
                                                            <Copy size={10} /> COPY
                                                        </button>
                                                    </div>
                                                    <div className="flex items-center justify-center border border-dashed border-slate-700 bg-slate-900/50 p-2.5 rounded-lg group-hover:border-emerald-500/30 transition-colors">
                                                        <code className="font-mono font-bold text-white tracking-widest">{offer.code || 'N/A'}</code>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => handleAccept(offer.id)}
                                            className={`w-full py-4 rounded-xl font-black text-xs shadow-lg transition-all uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98]
                                                ${offer.type === 'job_bid'
                                                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 hover:bg-emerald-500'
                                                    : 'bg-blue-600 text-white shadow-blue-600/20 hover:bg-blue-500'}`}
                                        >
                                            {offer.type === 'job_bid' ? 'Accept Job' : 'Claim Offer'}
                                        </button>
                                    </div>
                                </GlassCard>
                            ))
                        )}
                    </div>
                </div>

                <AnimatePresence>
                    {activeModal && (
                        <GlassModal
                            onClose={() => setActiveModal(null)}
                            title={getModalTitle()}
                        >
                            {renderModalContent()}
                        </GlassModal>
                    )}
                </AnimatePresence>
            </div>
        </TechnicianLayout>
    );
};

export default TechnicianOffers;
