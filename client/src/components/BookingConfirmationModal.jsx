import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, ShieldCheck, CheckCircle, Star, Zap, Wallet, CreditCard, PlusCircle } from 'lucide-react';
import { estimateJobCost, getWalletBalance } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AddFundsModal from './AddFundsModal';

const BookingConfirmationModal = ({ isOpen, onClose, technician, jobDetails, onConfirm }) => {
    const { user } = useAuth();
    const [agreement, setAgreement] = useState(false);
    const [readableAddress, setReadableAddress] = useState(jobDetails?.location?.address || "Current Location");
    const [description, setDescription] = useState(jobDetails?.description || '');

    const [pricing, setPricing] = useState({ total: 0, baseCharge: 0, distance: 0 });
    const [loadingPricing, setLoadingPricing] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [insufficientFunds, setInsufficientFunds] = useState(false);
    const [showAddFunds, setShowAddFunds] = useState(false);

    const fetchWalletBalance = () => {
        if (user?.id) {
            getWalletBalance(user.id).then(res => {
                if (res.data.success) setWalletBalance(res.data.balance);
            }).catch(console.error);
        }
    };

    useEffect(() => {
        // 1. Resolve Address
        if (isOpen && jobDetails?.location?.latitude && jobDetails?.location?.longitude) {
            const fetchAddress = async () => {
                try {
                    // Use OpenStreetMap Nominatim instead of Google Maps (which requires key)
                    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${jobDetails.location.latitude}&lon=${jobDetails.location.longitude}`);
                    const data = await res.json();
                    if (data && data.display_name) {
                        // Cleanup address: get first 2-3 parts
                        const parts = data.display_name.split(',').slice(0, 3).join(', ');
                        setReadableAddress(parts);
                    }
                } catch (e) { console.error("Geocoding failed", e); }
            };
            fetchAddress();
        } else if (jobDetails?.location?.address && jobDetails.location.address !== "Current Location") {
            setReadableAddress(jobDetails.location.address);
        }

        // 2. Fetch Pricing
        if (isOpen) {
            const fetchPricing = async () => {
                setLoadingPricing(true);
                try {
                    const res = await estimateJobCost({ serviceType: jobDetails.serviceType, userLocation: jobDetails.location, technicianId: technician?.id });
                    if (res.data.success) setPricing(res.data.estimate);
                } catch (err) {
                    setPricing({ total: 99, baseCharge: 99, distance: 0 });
                } finally { setLoadingPricing(false); }
            };
            fetchPricing();
        }

        if (isOpen && user?.id) fetchWalletBalance();
    }, [isOpen, jobDetails, technician, user]);

    // Format Default Date/Time if missing
    const displayDate = jobDetails?.scheduledDate || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const displayTime = jobDetails?.scheduledTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    useEffect(() => {
        setInsufficientFunds(user && paymentMethod === 'wallet' && walletBalance < pricing.total);
    }, [user, paymentMethod, walletBalance, pricing]);

    if (!isOpen) return null;

    const photoUrl = technician?.documents?.photo
        ? (technician.documents.photo.startsWith('http') ? technician.documents.photo : `http://localhost:3000${technician.documents.photo}`)
        : `https://ui-avatars.com/api/?name=${technician?.name || 'T'}&background=0D9488&color=fff&size=48`;
    const isTechBusy = ['engaged', 'finishing_work', 'finishing work'].includes((technician?.status || '').toLowerCase());

    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!agreement) return alert("Please agree to the terms.");
        setIsSubmitting(true);

        // [FIX] Guest Logic: If not logged in, proceed to OnConfirm (which should handle login)
        // Do NOT check wallet balance for guests (balance is 0, so it would always trigger Add Funds)
        if (!user) {
            await onConfirm({
                ...jobDetails,
                description,
                visitingCharges: pricing.total,
                agreementAccepted: true,
                paymentMethod,
                paymentStatus: 'pending', // Will be handled after login
                technicianId: technician?.id || null
            });
            setIsSubmitting(false);
            return;
        }

        // Wallet Balance Check (Only for Logged In Users)
        if (paymentMethod === 'wallet') {
            if (walletBalance < pricing.total) {
                setShowAddFunds(true);
                setIsSubmitting(false);
                return;
            }
        }

        const { scheduledDate, scheduledTime, ...rest } = jobDetails || {};
        const payload = {
            ...rest,
            description,
            visitingCharges: pricing.total,
            agreementAccepted: true,
            technicianId: technician?.id || null,
            paymentStatus: 'paid', // Both Wallet and Online are considered immediate payments now
            paymentMethod
        };
        if (scheduledDate) payload.scheduledDate = scheduledDate;
        if (scheduledTime) payload.scheduledTime = scheduledTime;

        try {
            await onConfirm(payload);
        } catch (e) {
            setIsSubmitting(false);
        }
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 font-sans backdrop-blur-sm"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden border border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white p-5 shrink-0 relative">
                        <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors">
                            <X size={20} />
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <img src={photoUrl} alt="" className="w-14 h-14 rounded-full border-4 border-white/20 object-cover bg-teal-800 shadow-inner" />
                                {technician && (
                                    <div className="absolute -bottom-1 -right-1 bg-yellow-400 text-teal-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                                        {technician.rating}★
                                    </div>
                                )}
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-xs uppercase tracking-wider text-teal-100 font-bold mb-0.5">{technician ? 'Booking Professional' : 'Finding Professional'}</p>
                                <p className="font-bold text-xl truncate leading-tight">{technician?.name || 'Top Available Expert'}</p>
                                <p className="text-sm text-teal-50 opacity-90">{jobDetails?.serviceType}</p>
                            </div>
                        </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f8fafc]" style={{ maxHeight: 'calc(90vh - 180px)' }}>

                        {isTechBusy && (
                            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-3 shadow-sm">
                                <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-amber-800">Technician is busy</p>
                                    <p className="text-xs text-amber-700 leading-relaxed">They are currently finishing a job. They will contact you as soon as they are free.</p>
                                </div>
                            </div>
                        )}

                        {/* Location & Time Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm space-y-3">
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-teal-50 rounded-lg shrink-0">
                                    <MapPin size={18} className="text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-gray-500 font-bold mb-0.5">Service Location</p>
                                    <p className="text-sm font-semibold text-gray-800 leading-snug">{readableAddress}</p>
                                </div>
                            </div>
                            <div className="h-px bg-gray-100 w-full" />
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-teal-50 rounded-lg shrink-0">
                                    <Calendar size={18} className="text-teal-600" />
                                </div>
                                <div>
                                    <p className="text-xs uppercase text-gray-500 font-bold mb-0.5">Date & Time</p>
                                    <p className="text-sm font-semibold text-gray-800">
                                        {displayDate} <span className="text-gray-400 mx-1">•</span> {displayTime}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Problem Description */}
                        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                            <p className="text-xs uppercase text-gray-500 font-bold mb-2">Issue Description (Optional)</p>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="E.g. AC is not cooling, Tap is leaking..."
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none h-20 transition-all"
                            />
                        </div>

                        {/* Payment Selection */}
                        <div className="space-y-3">
                            <p className="text-xs uppercase text-gray-500 font-bold ml-1">Payment Method</p>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'wallet'
                                        ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-md ring-1 ring-teal-600/30'
                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${paymentMethod === 'wallet' ? 'bg-teal-100' : 'bg-gray-100'}`}>
                                        <Wallet size={20} className={paymentMethod === 'wallet' ? 'text-teal-700' : 'text-gray-500'} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm">Wallet</p>
                                        <p className={`text-xs font-semibold ${user && walletBalance < pricing.total ? 'text-red-500' : 'text-gray-500'}`}>
                                            {user ? `₹${walletBalance}` : 'Login to see'}
                                        </p>
                                    </div>
                                    {paymentMethod === 'wallet' && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center">
                                                <CheckCircle size={10} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                </button>

                                <button
                                    onClick={() => setPaymentMethod('online')}
                                    className={`relative p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${paymentMethod === 'online'
                                        ? 'bg-teal-50 border-teal-600 text-teal-800 shadow-md ring-1 ring-teal-600/30'
                                        : 'bg-white border-gray-100 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                        }`}
                                >
                                    <div className={`p-2 rounded-full ${paymentMethod === 'online' ? 'bg-teal-100' : 'bg-gray-100'}`}>
                                        <CreditCard size={20} className={paymentMethod === 'online' ? 'text-teal-700' : 'text-gray-500'} />
                                    </div>
                                    <div className="text-center">
                                        <p className="font-bold text-sm">Pay Online</p>
                                        <p className="text-xs text-gray-400">UPI / Card</p>
                                    </div>
                                    {paymentMethod === 'online' && (
                                        <div className="absolute top-2 right-2">
                                            <div className="w-4 h-4 rounded-full bg-teal-600 flex items-center justify-center">
                                                <CheckCircle size={10} className="text-white" />
                                            </div>
                                        </div>
                                    )}
                                </button>
                            </div>

                            {/* Insufficient Funds Warning */}
                            {insufficientFunds && paymentMethod === 'wallet' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-2 text-red-700">
                                        <div className="p-1.5 bg-red-100 rounded-full">
                                            <Wallet size={14} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold uppercase">Low Balance</p>
                                            <p className="text-xs">Needed: ₹{pricing.total}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAddFunds(true)}
                                        className="bg-red-600 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm hover:bg-red-700 active:scale-95 transition-all flex items-center gap-1"
                                    >
                                        <PlusCircle size={14} />
                                        Add Funds
                                    </button>
                                </motion.div>
                            )}
                        </div>

                        {/* Total Cost */}
                        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                            <div>
                                <p className="text-xs uppercase text-gray-500 font-bold">Total to Pay</p>
                                <p className="text-[10px] text-gray-400">Inc. taxes & charges</p>
                            </div>
                            <div className="text-2xl font-black text-slate-800">
                                {loadingPricing ? <span className="w-16 h-8 bg-gray-200 animate-pulse rounded inline-block" /> : `₹${pricing.total}`}
                            </div>
                        </div>

                    </div>

                    {/* Footer */}
                    <div className="p-5 bg-white border-t border-gray-100 shrink-0 shadow-[0_-5px_20px_rgba(0,0,0,0.03)] z-10">
                        <label onClick={() => setAgreement(!agreement)} className="flex items-center gap-3 cursor-pointer mb-4 select-none group">
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${agreement ? 'bg-teal-600 border-teal-600' : 'border-gray-300 group-hover:border-teal-500'}`}>
                                {agreement && <CheckCircle size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            <p className="text-xs text-gray-600 font-medium group-hover:text-gray-800 transition-colors">
                                I agree to the <span className="underline decoration-gray-300">Terms of Service</span> & <span className="underline decoration-gray-300">Privacy Policy</span>.
                            </p>
                        </label>

                        {/* Smart Button */}
                        <button
                            onClick={handleConfirm}
                            disabled={!agreement || isSubmitting}
                            className={`w-full py-4 rounded-xl text-white text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98]
                                ${(agreement && !isSubmitting)
                                    ? (insufficientFunds && paymentMethod === 'wallet'
                                        ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30'
                                        : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
                                    )
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                                }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                                    Processing...
                                </>
                            ) : !user ? (
                                <>
                                    <ShieldCheck size={20} /> Login & Book Now
                                </>
                            ) : insufficientFunds && paymentMethod === 'wallet' ? (
                                <>
                                    <PlusCircle size={20} /> Add Funds & Pay
                                </>
                            ) : (
                                <>
                                    <ShieldCheck size={20} /> {paymentMethod === 'online' ? 'Pay & Book' : 'Confirm Booking'}
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            <AddFundsModal isOpen={showAddFunds} onClose={() => setShowAddFunds(false)} onSuccess={fetchWalletBalance} />
        </AnimatePresence>
        , document.body);
};

export default BookingConfirmationModal;
