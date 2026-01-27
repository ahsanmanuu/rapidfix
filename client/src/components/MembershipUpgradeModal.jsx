import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Check, Wallet, Globe, Loader2, AlertCircle, Crown, Star } from 'lucide-react';
import api, { getWalletBalance } from '../services/api';
import { useNavigate } from 'react-router-dom';

// GlassCard Component for internal use
const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-slate-900/40 backdrop-blur-xl border border-white/10 shadow-xl rounded-2xl ${className}`}>
        {children}
    </div>
);

const MembershipUpgradeModal = ({ isOpen, onClose, user, onSuccess }) => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('wallet'); // 'wallet' | 'online'
    const [step, setStep] = useState('details'); // 'details' | 'confirm' | 'success'

    // Config
    const PLAN_PRICE = 999;
    const PLAN_NAME = 'Pro Membership';
    const DURATION = '30 Days';

    useEffect(() => {
        if (isOpen && user?.id) {
            fetchBalance();
        }
    }, [isOpen, user]);

    const fetchBalance = async () => {
        try {
            const res = await getWalletBalance(user.id);
            if (res.data) setBalance(res.data.balance || 0);
        } catch (err) {
            console.error("Failed to fetch balance", err);
        }
    };

    const handleUpgrade = async () => {
        setLoading(true);
        try {
            const res = await api.post(`/technicians/${user.id}/membership`, {
                type: 'Premium',
                method: paymentMethod,
                amount: PLAN_PRICE
            });

            if (res.data.success) {
                setStep('success');
                setTimeout(() => {
                    onSuccess && onSuccess(res.data.technician);
                    onClose();
                    setStep('details'); // Reset for next time
                }, 2000);
            }
        } catch (err) {
            console.error("Upgrade failed:", err);
            alert(err.response?.data?.error || "Upgrade failed. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const insufficientFunds = paymentMethod === 'wallet' && balance < PLAN_PRICE;

    return (
        <AnimatePresence>
            <div
                onClick={onClose}
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
            >
                <motion.div
                    onClick={(e) => e.stopPropagation()}
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md overflow-hidden"
                >
                    {/* Background Glow */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>

                    <GlassCard className="overflow-hidden">
                        {/* Header */}
                        <div className="relative p-6 border-b border-white/5 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
                            <button
                                onClick={onClose}
                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="size-14 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20 text-white">
                                    <Crown size={28} fill="currentColor" strokeWidth={1.5} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight">Upgrade to Pro</h2>
                                    <p className="text-sm font-medium text-slate-400">Unlock maximum earning potential</p>
                                </div>
                            </div>
                        </div>

                        {step === 'details' && (
                            <div className="p-6 space-y-6">
                                {/* Plan Details */}
                                <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-xl p-5 border border-indigo-500/20 relative overflow-hidden group">
                                    <div className="absolute inset-0 bg-indigo-500/5 group-hover:bg-indigo-500/10 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Recommended Plan</p>
                                                <h3 className="text-xl font-black text-white flex items-center gap-2">
                                                    {PLAN_NAME}
                                                    <Star size={16} className="text-amber-400 fill-amber-400" />
                                                </h3>
                                            </div>
                                            <div className="text-right">
                                                <div className="flex items-end gap-1">
                                                    <span className="text-3xl font-black text-white leading-none">₹{PLAN_PRICE}</span>
                                                    <span className="text-xs text-slate-400 font-bold mb-1">/{DURATION}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="h-px w-full bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent my-4"></div>
                                        <ul className="grid grid-cols-1 gap-3">
                                            {[
                                                'Unlimited Job Requests',
                                                '0% Commission on first 10 jobs',
                                                'Verified Badge on Profile',
                                                'Priority Support Access'
                                            ].map((feat, i) => (
                                                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-300">
                                                    <div className="size-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                        <Check size={12} className="text-emerald-400" strokeWidth={3} />
                                                    </div>
                                                    {feat}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                {/* Payment Method */}
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">Payment Method</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setPaymentMethod('wallet')}
                                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden
                                                ${paymentMethod === 'wallet'
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'}`}
                                        >
                                            <Wallet size={24} />
                                            <span className="text-xs font-bold uppercase tracking-wide">Wallet Pay</span>
                                            {paymentMethod === 'wallet' && <div className="absolute inset-0 border-2 border-white/20 rounded-xl"></div>}
                                        </button>
                                        <button
                                            onClick={() => setPaymentMethod('online')}
                                            className={`p-4 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden
                                                ${paymentMethod === 'online'
                                                    ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/25'
                                                    : 'bg-slate-800/50 border-white/5 text-slate-400 hover:bg-slate-800 hover:border-white/10'}`}
                                        >
                                            <Globe size={24} />
                                            <span className="text-xs font-bold uppercase tracking-wide">Pay Online</span>
                                            {paymentMethod === 'online' && <div className="absolute inset-0 border-2 border-white/20 rounded-xl"></div>}
                                        </button>
                                    </div>

                                    {paymentMethod === 'wallet' && (
                                        <div className={`p-3 rounded-xl border flex items-center justify-between text-sm transition-colors
                                            ${insufficientFunds
                                                ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                                                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                                            <div className="flex items-center gap-2">
                                                <Wallet size={16} />
                                                <span className="font-bold">Bal: ₹{balance.toLocaleString()}</span>
                                            </div>
                                            {insufficientFunds && (
                                                <button
                                                    onClick={() => { onClose(); navigate('/wallet'); }}
                                                    className="text-[10px] bg-rose-500 text-white px-2 py-1 rounded-lg font-bold shadow-sm hover:bg-rose-600 transition-colors uppercase tracking-wider"
                                                >
                                                    + Add Funds
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action */}
                                <button
                                    onClick={handleUpgrade}
                                    disabled={loading || insufficientFunds}
                                    className={`w-full py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all
                                        ${insufficientFunds
                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                                            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 shadow-xl shadow-blue-600/20 hover:scale-[1.02] active:scale-[0.98]'}`}
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Processing...
                                        </>
                                    ) : (
                                        insufficientFunds ? 'Insufficient Balance' : `Pay ₹${PLAN_PRICE} & Upgrade`
                                    )}
                                </button>
                            </div>
                        )}

                        {step === 'success' && (
                            <div className="p-12 flex flex-col items-center text-center">
                                <div className="size-20 bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mb-6 animate-in zoom-in duration-300 ring-4 ring-emerald-500/10">
                                    <Check size={40} strokeWidth={4} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-2">Upgrade Successful!</h3>
                                <p className="text-slate-400 font-medium leading-relaxed max-w-[200px] mx-auto">
                                    You have successfully upgraded to the Pro Plan. Enjoy your new benefits!
                                </p>
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MembershipUpgradeModal;
