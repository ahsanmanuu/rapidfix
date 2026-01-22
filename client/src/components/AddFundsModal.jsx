import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ShieldCheck, Ticket, Calendar, DollarSign, CheckCircle, Smartphone } from 'lucide-react'; // Smartphone for PhonePe
import { topUpWallet, verifyCoupon, initiatePhonePePayment } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AddFundsModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [promoStatus, setPromoStatus] = useState(null); // { valid: bool, msg: string, amount: num }
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState('phonepe'); // phonepe, card

    if (!isOpen) return null;

    const handleApplyPromo = async () => {
        if (!promoCode) return;
        setLoading(true);
        try {
            const res = await verifyCoupon({ code: promoCode, userId: user.id });
            if (res.data.success) {
                setPromoStatus({ valid: true, msg: `Coupon Applied! Extra ₹${res.data.amount}`, amount: res.data.amount });
            } else {
                setPromoStatus({ valid: false, msg: 'Invalid Code' });
            }
        } catch (err) {
            setPromoStatus({ valid: false, msg: err.response?.data?.error || 'Invalid Code' });
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        const numericAmount = parseFloat(amount);
        if (!numericAmount || numericAmount <= 0) {
            alert("Please enter a valid amount");
            return;
        }

        setLoading(true);

        if (method === 'phonepe') {
            try {
                const { data } = await initiatePhonePePayment({
                    userId: user.id,
                    amount: numericAmount
                });
                if (data.success && data.url) {
                    window.location.href = data.url; // Redirect
                } else {
                    alert("Failed to initiate PhonePe payment");
                    setLoading(false);
                }
            } catch (err) {
                console.error("PhonePe Error", err);
                alert("Payment Error: " + (err.response?.data?.error || err.message));
                setLoading(false);
            }
            return;
        }

        // Simulation (Card/Wallet Mock)
        try {
            const res = await topUpWallet({
                userId: user.id,
                amount: numericAmount,
                couponCode: promoStatus?.valid ? promoCode : null
            });
            if (res.data.success) {
                alert(`Successfully added ₹${numericAmount + (res.data.bonus || 0)}!`);
                if (onSuccess) onSuccess();
                onClose();
            }
        } catch (err) {
            console.error("Top Up Error", err);
            alert("Top Up Failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
                >
                    {/* Header */}
                    <div className="bg-[#111418] p-6 text-white flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">Add Funds</h2>
                            <p className="text-gray-400 text-sm mt-1">Top up your Fixofy Wallet instantly.</p>
                        </div>
                        <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Amount Input */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (₹)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount (e.g. 500)"
                                    className="w-full pl-10 pr-4 py-4 rounded-xl border border-slate-200 bg-slate-50 text-2xl font-bold text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>
                            {/* Presets */}
                            <div className="flex gap-2">
                                {[100, 500, 1000, 2000].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val.toString())}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${amount === val.toString() ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                    >
                                        ₹{val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Coupon Code */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Promo Code</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Ticket size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={promoCode}
                                        onChange={(e) => setPromoCode(e.target.value)}
                                        placeholder="Coupon Code"
                                        className="w-full pl-10 pr-3 py-3 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none uppercase"
                                    />
                                </div>
                                <button
                                    onClick={handleApplyPromo}
                                    disabled={!promoCode || loading}
                                    className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-colors disabled:opacity-50"
                                >
                                    Apply
                                </button>
                            </div>
                            {promoStatus && (
                                <p className={`text-xs mt-2 font-bold ${promoStatus.valid ? 'text-green-600' : 'text-red-500'}`}>
                                    {promoStatus.msg}
                                </p>
                            )}
                        </div>

                        {/* Payment Method Toggle (PhonePe vs Card) */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setMethod('phonepe')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'phonepe' ? 'border-[#5f259f] bg-purple-50 text-[#5f259f]' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    <Smartphone size={24} />
                                    <span className="font-bold text-sm">PhonePe / UPI</span>
                                </button>
                                <button
                                    onClick={() => setMethod('card')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${method === 'card' ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    <Wallet size={24} />
                                    <span className="font-bold text-sm">Test Wallet</span>
                                </button>
                            </div>
                        </div>

                        {/* Summary */}
                        <div className="bg-slate-50 p-4 rounded-xl flex justify-between items-center">
                            <span className="text-slate-500 font-medium text-sm">You Pay:</span>
                            <span className="text-xl font-black text-slate-800">₹{amount || 0}</span>
                        </div>

                        {/* Action */}
                        <button
                            onClick={handlePayment}
                            disabled={loading || !amount}
                            className="w-full py-4 rounded-xl bg-[#111418] text-white font-bold text-lg shadow-xl hover:bg-black transition-transform active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <ShieldCheck size={20} />
                                    Proceed to Pay
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default AddFundsModal;
