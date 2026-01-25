import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Shield, Check, Wallet, Globe, Loader2, AlertCircle } from 'lucide-react';
import api, { getWalletBalance, topUpWallet } from '../services/api'; // Assuming topUpWallet is exposed or we redirect
import { useNavigate } from 'react-router-dom';

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
            // Call API
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
                >
                    {/* Header */}
                    <div className="bg-slate-900 p-6 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                        <button onClick={onClose} className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors">
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 relative z-10">
                            <div className="size-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
                                <Shield className="text-emerald-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">Upgrade to Pro</h2>
                                <p className="text-sm text-slate-400">Unlock premium benefits</p>
                            </div>
                        </div>
                    </div>

                    {step === 'details' && (
                        <div className="p-6 space-y-6">
                            {/* Plan Details */}
                            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase">Selected Plan</p>
                                        <h3 className="text-lg font-black text-slate-800">{PLAN_NAME}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-blue-600">₹{PLAN_PRICE}</p>
                                        <p className="text-xs text-slate-500 font-medium">/{DURATION}</p>
                                    </div>
                                </div>
                                <ul className="space-y-2">
                                    {[
                                        'Unlimited Job Requests',
                                        'Priority Support',
                                        'Verified Badge on Profile',
                                        'Lowest Commission Rates'
                                    ].map((feat, i) => (
                                        <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                                            <Check size={14} className="text-emerald-500" /> {feat}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Payment Method */}
                            <div className="space-y-3">
                                <p className="text-xs font-bold text-slate-500 uppercase">Payment Method</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('wallet')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'wallet' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <Wallet size={20} />
                                        <span className="text-xs font-bold">Wallet Pay</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('online')}
                                        className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'online' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
                                    >
                                        <Globe size={20} />
                                        <span className="text-xs font-bold">Pay Online</span>
                                    </button>
                                </div>

                                {paymentMethod === 'wallet' && (
                                    <div className={`p-3 rounded-lg flex items-center justify-between text-sm ${insufficientFunds ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                                        <span className="font-medium">Wallet Balance: ₹{balance}</span>
                                        {insufficientFunds && (
                                            <button
                                                onClick={() => { onClose(); navigate('/wallet'); }}
                                                className="text-xs bg-white border border-red-200 px-2 py-1 rounded font-bold shadow-sm hover:shadow"
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
                                className={`w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 text-sm transition-all
                                    ${insufficientFunds
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                        : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'}`}
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : (insufficientFunds ? 'Insufficient Balance' : `Pay ₹${PLAN_PRICE} & Upgrade`)}
                            </button>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="size-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-in zoom-in">
                                <Check size={32} strokeWidth={3} />
                            </div>
                            <h3 className="text-xl font-black text-slate-800">Upgrade Successful!</h3>
                            <p className="text-sm text-slate-500 mt-2">You are now a Pro Member. Current expiry: 30 days from now.</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default MembershipUpgradeModal;
