import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Wallet, ShieldCheck, Ticket, Calendar, DollarSign, CheckCircle, Smartphone } from 'lucide-react';
import { topUpWallet, verifyCoupon, initiatePhonePePayment } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AddFundsModal = ({ isOpen, onClose, onSuccess }) => {
    const { user } = useAuth();
    const [amount, setAmount] = useState('');
    const [promoCode, setPromoCode] = useState('');
    const [promoStatus, setPromoStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [method, setMethod] = useState('phonepe');

    if (!isOpen) return null;

    const handleApplyPromo = async () => {
        if (!promoCode) return;
        setLoading(true);
        try {
            const res = await verifyCoupon({ code: promoCode, userId: user.id });
            if (res.data.success) {
                setPromoStatus({ valid: true, msg: `Applied! +₹${res.data.amount}`, amount: res.data.amount });
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
                    window.location.href = data.url;
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
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh] relative border border-white/20"
                >
                    {/* Header: Clean Teal Gradient */}
                    <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] p-4 text-white relative shrink-0">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold">Add Funds</h2>
                                <p className="text-teal-50/80 text-[10px] sm:text-xs">Top up your Fixofy Wallet instantly</p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-95"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
                        {/* Amount Section */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Amount (₹)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-lg">₹</span>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-100 bg-slate-50/50 text-xl font-black text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-300 placeholder:font-medium"
                                />
                            </div>
                            {/* Presets Grid */}
                            <div className="grid grid-cols-4 gap-2 mt-2">
                                {[100, 500, 1000, 2000].map(val => (
                                    <button
                                        key={val}
                                        onClick={() => setAmount(val.toString())}
                                        className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${amount === val.toString() ? 'bg-teal-600 border-teal-600 text-white shadow-sm' : 'bg-white border-slate-100 text-slate-600 hover:border-teal-200 hover:text-teal-600'}`}
                                    >
                                        ₹{val}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Promo Code Section */}
                        <div className="bg-slate-50/50 border border-slate-100 p-3 rounded-xl space-y-2">
                            <div className="flex items-center gap-2 mb-1">
                                <Ticket size={14} className="text-teal-600" />
                                <span className="text-[10px] font-bold text-slate-500 uppercase">Promo Code</span>
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={promoCode}
                                    onChange={(e) => setPromoCode(e.target.value)}
                                    placeholder="ENTER CODE"
                                    className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none uppercase placeholder:text-slate-300 placeholder:font-medium"
                                />
                                <button
                                    onClick={handleApplyPromo}
                                    disabled={!promoCode || loading}
                                    className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-[10px] hover:bg-slate-900 transition-colors disabled:opacity-50"
                                >
                                    Apply
                                </button>
                            </div>
                            {promoStatus && (
                                <p className={`text-[10px] font-bold ${promoStatus.valid ? 'text-teal-600' : 'text-rose-500'}`}>
                                    {promoStatus.msg}
                                </p>
                            )}
                        </div>

                        {/* Payment Method Section */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Payment Method</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setMethod('phonepe')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all relative overflow-hidden ${method === 'phonepe' ? 'border-teal-500 bg-teal-50/30 text-teal-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                >
                                    <Smartphone size={20} className={method === 'phonepe' ? 'text-teal-600' : 'text-slate-300'} />
                                    <span className="font-bold text-[10px]">PhonePe / UPI</span>
                                    {method === 'phonepe' && <div className="absolute top-0 right-0 w-4 h-4 bg-teal-500 text-white flex items-center justify-center rounded-bl-lg"><CheckCircle size={10} /></div>}
                                </button>
                                <button
                                    onClick={() => setMethod('card')}
                                    className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all relative overflow-hidden ${method === 'card' ? 'border-teal-500 bg-teal-50/30 text-teal-700' : 'border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                >
                                    <Wallet size={20} className={method === 'card' ? 'text-teal-600' : 'text-slate-300'} />
                                    <span className="font-bold text-[10px]">Test Wallet</span>
                                    {method === 'card' && <div className="absolute top-0 right-0 w-4 h-4 bg-teal-500 text-white flex items-center justify-center rounded-bl-lg"><CheckCircle size={10} /></div>}
                                </button>
                            </div>
                        </div>

                        {/* Summary Card */}
                        <div className="bg-teal-600 rounded-xl p-3 text-white flex justify-between items-center shadow-md shadow-teal-600/20 shrink-0 mt-2">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-bold uppercase tracking-widest opacity-80">Total Payable</span>
                                <span className="text-lg font-black tracking-tight">₹{amount || '0'}</span>
                            </div>
                            <ShieldCheck size={24} className="opacity-40" />
                        </div>
                    </div>

                    {/* Bottom Action Section */}
                    <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 shrink-0">
                        <button
                            onClick={handlePayment}
                            disabled={loading || !amount}
                            className="w-full py-3 sm:py-3.5 rounded-xl bg-[#111418] text-white font-bold text-sm shadow-xl hover:bg-black transition-all active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Proceed to Pay</span>
                                    <ShieldCheck size={16} className="group-hover:scale-110 transition-transform text-white/70" />
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
