import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, ShieldCheck, CheckCircle, Star, Zap, Wallet, CreditCard, PlusCircle, Sparkles, FileText } from 'lucide-react';
import { estimateJobCost, getWalletBalance } from '../services/api';
import { useAuth } from '../context/AuthContext';
import AddFundsModal from './AddFundsModal';

const BookingConfirmationModal = ({ isOpen, onClose, technician, jobDetails, onConfirm }) => {
    const { user } = useAuth();
    const [agreement, setAgreement] = useState(false);
    const [readableAddress, setReadableAddress] = useState(jobDetails?.location?.address || "Current Location");
    const [description, setDescription] = useState(jobDetails?.description || '');

    // Pricing & Payment State
    const [pricing, setPricing] = useState({ total: 0, base: 0, distance: 0 });
    const [loadingPricing, setLoadingPricing] = useState(false);
    const [walletBalance, setWalletBalance] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('wallet');
    const [insufficientFunds, setInsufficientFunds] = useState(false);

    // Add Funds Modal
    const [showAddFunds, setShowAddFunds] = useState(false);

    const fetchWalletBalance = () => {
        if (user?.id) {
            getWalletBalance(user.id).then(res => {
                if (res.data.success) {
                    setWalletBalance(res.data.balance);
                }
            }).catch(console.error);
        }
    };

    useEffect(() => {
        if (isOpen && jobDetails?.location?.latitude && jobDetails?.location?.longitude) {
            const fetchAddress = async () => {
                try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${jobDetails.location.latitude},${jobDetails.location.longitude}&key=${apiKey}`);
                    const data = await res.json();
                    if (data.results && data.results.length > 0) {
                        const addressComponents = data.results[0].address_components;
                        const locality = addressComponents.find(c => c.types.includes('locality'))?.long_name;
                        const sublocality = addressComponents.find(c => c.types.includes('sublocality'))?.long_name;
                        const area = sublocality || locality || data.results[0].formatted_address;
                        const fullCity = (sublocality && locality && sublocality !== locality)
                            ? `${sublocality}, ${locality}`
                            : (area || "Current Location");
                        setReadableAddress(fullCity);
                    }
                } catch (error) {
                    console.error("Geocoding failed", error);
                }
            };
            fetchAddress();

            const fetchPricing = async () => {
                setLoadingPricing(true);
                try {
                    const payload = {
                        serviceType: jobDetails.serviceType,
                        userLocation: jobDetails.location,
                        technicianId: technician?.id
                    };
                    const res = await estimateJobCost(payload);
                    if (res.data.success) {
                        setPricing(res.data.estimate);
                    }
                } catch (err) {
                    console.error("Pricing Fetch Failed", err);
                    setPricing({ total: 99, baseCharge: 99, distance: 0 });
                } finally {
                    setLoadingPricing(false);
                }
            };
            fetchPricing();
        }

        if (isOpen && user?.id) {
            fetchWalletBalance();
        }
    }, [isOpen, jobDetails, technician, user]);

    useEffect(() => {
        if (paymentMethod === 'wallet' && walletBalance < pricing.total) {
            setInsufficientFunds(true);
        } else {
            setInsufficientFunds(false);
        }
    }, [paymentMethod, walletBalance, pricing]);

    if (!isOpen) return null;

    const photoUrl = technician?.documents?.photo
        ? (technician.documents.photo.startsWith('http') ? technician.documents.photo : `http://localhost:3000${technician.documents.photo}`)
        : `https://ui-avatars.com/api/?name=${technician?.name || 'Tech'}&background=random`;

    const isTechBusy = ['engaged', 'finishing_work', 'finishing work'].includes((technician?.status || '').toLowerCase());

    const handleConfirm = () => {
        if (!agreement) {
            alert("Please agree to the terms to continue.");
            return;
        }
        const { scheduledDate, scheduledTime, ...restJobDetails } = jobDetails || {};
        const payload = {
            ...restJobDetails,
            description,
            visitingCharges: pricing.total,
            agreementAccepted: true,
            technicianId: technician?.id || null,
            paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
            paymentMethod: paymentMethod
        };
        if (scheduledDate) payload.scheduledDate = scheduledDate;
        if (scheduledTime) payload.scheduledTime = scheduledTime;
        onConfirm(payload);
    };

    return createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-lg font-sans"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 40 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 40 }}
                    transition={{ type: "spring", damping: 28, stiffness: 350 }}
                    className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-2xl max-h-[92vh] flex flex-col overflow-hidden relative ring-1 ring-white/10"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header Section */}
                    <div className="relative bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-5 sm:p-6 shrink-0">
                        {/* Decorative Elements */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 rounded-full blur-3xl" />
                            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl" />
                        </div>

                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 sm:top-4 sm:right-4 z-50 p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all"
                        >
                            <X size={20} />
                        </button>

                        <div className="relative z-10 flex items-start gap-4">
                            {/* Technician Avatar */}
                            <div className="relative shrink-0">
                                {technician ? (
                                    <motion.img
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        src={photoUrl}
                                        alt={technician.name}
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-white/30 object-cover shadow-xl"
                                    />
                                ) : (
                                    <motion.div
                                        initial={{ scale: 0.8 }}
                                        animate={{ scale: 1 }}
                                        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 border-white/30 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl"
                                    >
                                        <Zap size={24} className="text-white fill-white" />
                                    </motion.div>
                                )}
                                <div className={`absolute -bottom-1.5 -right-1.5 text-white text-[9px] font-bold px-2 py-0.5 rounded-full border-2 border-slate-900 ${isTechBusy ? 'bg-amber-500' : 'bg-emerald-500'}`}>
                                    {isTechBusy ? 'BUSY' : 'READY'}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="min-w-0 flex-1">
                                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
                                    <Sparkles size={10} className="fill-current" />
                                    {technician ? "Expert Selected" : "Smart Assignment"}
                                </div>
                                <h2 className="text-lg sm:text-xl font-bold leading-tight truncate">
                                    {technician?.name || "Assigning Best Available..."}
                                </h2>
                                {technician && (
                                    <div className="flex items-center gap-1.5 mt-1 text-amber-400">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill="currentColor" strokeWidth={0} />)}
                                        <span className="ml-1 text-xs font-bold text-white/80">{technician?.rating || '5.0'}</span>
                                        <span className="text-white/50 text-xs">• {jobDetails?.serviceType}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {isTechBusy && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 bg-amber-500/20 border border-amber-400/30 rounded-xl flex items-start gap-2.5"
                            >
                                <Clock size={16} className="text-amber-300 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-100 leading-relaxed">
                                    <strong className="text-amber-200">Queue Booking:</strong> This technician is busy. Place your request, and they will call you when available.
                                </p>
                            </motion.div>
                        )}
                    </div>

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto overscroll-contain p-5 sm:p-6 space-y-4 sm:space-y-5 bg-slate-50">
                        {/* DateTime & Location Grid */}
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <motion.div whileHover={{ y: -2 }} className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Calendar size={16} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Date</span>
                                </div>
                                <p className="font-bold text-slate-700 text-sm sm:text-base truncate">{jobDetails?.scheduledDate || "Today"}</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -2 }} className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm transition-shadow hover:shadow-md">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
                                        <Clock size={16} />
                                    </div>
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Time</span>
                                </div>
                                <p className="font-bold text-slate-700 text-sm sm:text-base truncate">{jobDetails?.scheduledTime || "Immediate"}</p>
                            </motion.div>
                        </div>

                        {/* Location */}
                        <motion.div whileHover={{ y: -2 }} className="bg-white p-3 sm:p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                                    <MapPin size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <span className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Location</span>
                                    <p className="font-bold text-slate-700 text-sm sm:text-base leading-snug mt-0.5 break-words">{readableAddress}</p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Problem Description */}
                        <div>
                            <label className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                <FileText size={14} /> Problem Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the issue briefly (e.g., 'AC not cooling properly...')"
                                className="w-full p-3 sm:p-4 bg-white border border-slate-200 rounded-xl text-slate-700 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none resize-none h-20 text-sm transition-all"
                            />
                        </div>

                        {/* Pricing Summary */}
                        <div className="bg-gradient-to-br from-white to-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex flex-col gap-2.5">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500">Base Charge</span>
                                    <span className="font-semibold text-slate-600">₹{pricing.baseCharge || 0}</span>
                                </div>
                                {pricing.distance > 0 && (
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-slate-500">Distance ({pricing.distance} km)</span>
                                        <span className="font-semibold text-slate-600">₹{pricing.distanceCharge || 0}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between pt-3 mt-1 border-t border-dashed border-slate-200">
                                    <div>
                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total Estimate</p>
                                    </div>
                                    {loadingPricing ? (
                                        <div className="h-8 w-20 bg-slate-200 animate-pulse rounded-lg" />
                                    ) : (
                                        <motion.p
                                            key={pricing.total}
                                            initial={{ scale: 1.1 }}
                                            animate={{ scale: 1 }}
                                            className="text-2xl sm:text-3xl font-black text-slate-800"
                                        >
                                            ₹{pricing.total}
                                        </motion.p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Payment Method</label>
                            <div className="grid grid-cols-2 gap-3">
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`p-3 sm:p-4 rounded-xl border-2 flex flex-col items-start gap-1.5 transition-all ${paymentMethod === 'wallet' ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                            <Wallet size={18} className={paymentMethod === 'wallet' ? 'text-blue-600' : 'text-slate-400'} />
                                            Wallet
                                        </div>
                                        {paymentMethod === 'wallet' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                    </div>
                                    <p className={`text-xs ${walletBalance < pricing.total && paymentMethod === 'wallet' ? 'text-red-500 font-bold' : 'text-slate-500'}`}>
                                        Balance: ₹{walletBalance}
                                    </p>
                                </motion.button>
                                <motion.button
                                    whileTap={{ scale: 0.97 }}
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`p-3 sm:p-4 rounded-xl border-2 flex flex-col items-start gap-1.5 transition-all ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50/80 ring-2 ring-blue-500/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                >
                                    <div className="flex items-center justify-between w-full">
                                        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
                                            <CreditCard size={18} className={paymentMethod === 'cash' ? 'text-emerald-600' : 'text-slate-400'} />
                                            Pay Later
                                        </div>
                                        {paymentMethod === 'cash' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                    </div>
                                    <p className="text-xs text-slate-500">Cash/Online after job</p>
                                </motion.button>
                            </div>
                            {insufficientFunds && paymentMethod === 'wallet' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-3 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between"
                                >
                                    <p className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                                        <X size={14} /> Low Balance
                                    </p>
                                    <button
                                        onClick={() => setShowAddFunds(true)}
                                        className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                                    >
                                        <PlusCircle size={14} /> Add Funds
                                    </button>
                                </motion.div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 sm:p-5 bg-white border-t border-slate-100 shrink-0">
                        <label
                            onClick={() => setAgreement(!agreement)}
                            className="flex items-start gap-3 cursor-pointer group mb-4 select-none p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                        >
                            <motion.div
                                animate={agreement ? { scale: [1, 1.2, 1] } : {}}
                                className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${agreement ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}
                            >
                                {agreement && <CheckCircle size={12} className="text-white" strokeWidth={3} />}
                            </motion.div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">I accept the Visiting Charges & Terms</p>
                                <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">I authorize the technician to inspect and provide a final quote.</p>
                            </div>
                        </label>

                        <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConfirm}
                            disabled={!agreement || (insufficientFunds && paymentMethod === 'wallet')}
                            className={`w-full py-3.5 sm:py-4 rounded-xl text-white font-bold shadow-xl transition-all flex items-center justify-center gap-2.5 relative overflow-hidden group ${agreement && (!insufficientFunds || paymentMethod !== 'wallet') ? (isTechBusy ? 'bg-amber-600 shadow-amber-600/30' : 'bg-gradient-to-r from-blue-600 to-indigo-600 shadow-blue-600/30') : 'bg-slate-300 shadow-none cursor-not-allowed'}`}
                        >
                            {agreement && (
                                <motion.div
                                    className={`absolute inset-0 ${isTechBusy ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-blue-500 to-indigo-500'}`}
                                    initial={{ x: '-100%' }}
                                    whileHover={{ x: 0 }}
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                            <div className="relative z-10 flex items-center gap-2">
                                {isTechBusy ? <Clock size={18} /> : <ShieldCheck size={18} />}
                                <span className="text-sm sm:text-base tracking-wide">
                                    {!agreement ? 'Accept Terms to Continue' : (isTechBusy ? 'Queue & Wait for Call' : 'Confirm & Book Now')}
                                </span>
                            </div>
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>

            <AddFundsModal
                isOpen={showAddFunds}
                onClose={() => setShowAddFunds(false)}
                onSuccess={() => {
                    fetchWalletBalance();
                }}
            />
        </AnimatePresence>
        , document.body);
};

export default BookingConfirmationModal;
