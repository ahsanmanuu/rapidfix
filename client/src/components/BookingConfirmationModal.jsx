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

    const [pricing, setPricing] = useState({ total: 0, base: 0, distance: 0 });
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
        if (isOpen && jobDetails?.location?.latitude && jobDetails?.location?.longitude) {
            const fetchAddress = async () => {
                try {
                    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${jobDetails.location.latitude},${jobDetails.location.longitude}&key=${apiKey}`);
                    const data = await res.json();
                    if (data.results?.length > 0) {
                        const ac = data.results[0].address_components;
                        const locality = ac.find(c => c.types.includes('locality'))?.long_name;
                        const sublocality = ac.find(c => c.types.includes('sublocality'))?.long_name;
                        setReadableAddress(sublocality && locality && sublocality !== locality ? `${sublocality}, ${locality}` : (sublocality || locality || data.results[0].formatted_address));
                    }
                } catch (e) { console.error("Geocoding failed", e); }
            };
            fetchAddress();

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

    useEffect(() => {
        setInsufficientFunds(paymentMethod === 'wallet' && walletBalance < pricing.total);
    }, [paymentMethod, walletBalance, pricing]);

    if (!isOpen) return null;

    const photoUrl = technician?.documents?.photo
        ? (technician.documents.photo.startsWith('http') ? technician.documents.photo : `http://localhost:3000${technician.documents.photo}`)
        : `https://ui-avatars.com/api/?name=${technician?.name || 'T'}&background=random&size=64`;
    const isTechBusy = ['engaged', 'finishing_work', 'finishing work'].includes((technician?.status || '').toLowerCase());

    const handleConfirm = () => {
        if (!agreement) return alert("Please agree to the terms.");
        const { scheduledDate, scheduledTime, ...rest } = jobDetails || {};
        const payload = { ...rest, description, visitingCharges: pricing.total, agreementAccepted: true, technicianId: technician?.id || null, paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending', paymentMethod };
        if (scheduledDate) payload.scheduledDate = scheduledDate;
        if (scheduledTime) payload.scheduledTime = scheduledTime;
        onConfirm(payload);
    };

    return createPortal(
        <AnimatePresence>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm font-sans" onClick={onClose}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", damping: 30, stiffness: 400 }}
                    className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-[360px] sm:max-w-[420px] max-h-[88vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Compact Header */}
                    <div className="relative bg-gradient-to-r from-slate-800 to-blue-900 text-white px-4 py-3 shrink-0">
                        <button onClick={onClose} className="absolute top-2 right-2 p-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-full transition-all">
                            <X size={16} />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                {technician ? (
                                    <img src={photoUrl} alt={technician.name} className="w-10 h-10 rounded-lg border border-white/20 object-cover" />
                                ) : (
                                    <div className="w-10 h-10 rounded-lg border border-white/20 bg-blue-600 flex items-center justify-center">
                                        <Zap size={18} className="text-white" />
                                    </div>
                                )}
                                <div className={`absolute -bottom-1 -right-1 text-[8px] font-bold px-1.5 py-0.5 rounded-full border border-slate-800 ${isTechBusy ? 'bg-amber-500' : 'bg-emerald-500'} text-white`}>
                                    {isTechBusy ? '●' : '✓'}
                                </div>
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1 text-[9px] font-semibold text-blue-200 uppercase tracking-wide">
                                    <Sparkles size={9} /> {technician ? "Expert" : "Auto-Assign"}
                                </div>
                                <p className="font-semibold text-sm truncate">{technician?.name || "Finding best match..."}</p>
                                {technician && (
                                    <div className="flex items-center gap-0.5 text-amber-400 mt-0.5">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={9} fill="currentColor" strokeWidth={0} />)}
                                        <span className="text-[10px] text-white/70 ml-1">{technician?.rating || '5.0'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Scrollable Content - Compact */}
                    <div className="flex-1 overflow-y-auto overscroll-contain p-3 sm:p-4 space-y-3 bg-slate-50 text-sm">
                        {isTechBusy && (
                            <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-700">
                                <Clock size={14} className="shrink-0 mt-0.5" />
                                <span><strong>Queue Booking:</strong> Technician is busy. They'll call when free.</span>
                            </div>
                        )}

                        {/* Date/Time/Location - Compact Grid */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                                <Calendar size={14} className="mx-auto text-blue-500 mb-0.5" />
                                <p className="text-[10px] text-slate-400 uppercase">Date</p>
                                <p className="font-semibold text-xs text-slate-700 truncate">{jobDetails?.scheduledDate || "Today"}</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                                <Clock size={14} className="mx-auto text-indigo-500 mb-0.5" />
                                <p className="text-[10px] text-slate-400 uppercase">Time</p>
                                <p className="font-semibold text-xs text-slate-700 truncate">{jobDetails?.scheduledTime || "Now"}</p>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-100 text-center">
                                <MapPin size={14} className="mx-auto text-purple-500 mb-0.5" />
                                <p className="text-[10px] text-slate-400 uppercase">Area</p>
                                <p className="font-semibold text-xs text-slate-700 truncate">{readableAddress.split(',')[0]}</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="flex items-center gap-1 text-[10px] font-bold text-slate-400 uppercase mb-1">
                                <FileText size={10} /> Issue Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Briefly describe the problem..."
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none h-14 text-xs"
                            />
                        </div>

                        {/* Pricing */}
                        <div className="bg-white p-3 rounded-lg border border-slate-100">
                            <div className="flex justify-between text-xs text-slate-500 mb-1">
                                <span>Base Charge</span>
                                <span>₹{pricing.baseCharge || 0}</span>
                            </div>
                            {pricing.distance > 0 && (
                                <div className="flex justify-between text-xs text-slate-500 mb-1">
                                    <span>Distance ({pricing.distance} km)</span>
                                    <span>₹{pricing.distanceCharge || 0}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-slate-200">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Total</span>
                                {loadingPricing ? (
                                    <div className="h-5 w-12 bg-slate-200 animate-pulse rounded" />
                                ) : (
                                    <span className="text-xl font-black text-slate-800">₹{pricing.total}</span>
                                )}
                            </div>
                        </div>

                        {/* Payment - Compact */}
                        <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block">Payment</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`p-2 rounded-lg border text-left transition-all ${paymentMethod === 'wallet' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                                >
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <Wallet size={12} className={paymentMethod === 'wallet' ? 'text-blue-500' : 'text-slate-400'} />
                                        Wallet
                                    </div>
                                    <p className={`text-[10px] mt-0.5 ${walletBalance < pricing.total ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>₹{walletBalance}</p>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`p-2 rounded-lg border text-left transition-all ${paymentMethod === 'cash' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}
                                >
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                                        <CreditCard size={12} className={paymentMethod === 'cash' ? 'text-emerald-500' : 'text-slate-400'} />
                                        Pay Later
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-0.5">After job</p>
                                </button>
                            </div>
                            {insufficientFunds && paymentMethod === 'wallet' && (
                                <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center justify-between">
                                    <span className="text-[10px] text-red-600 font-semibold">Low Balance</span>
                                    <button onClick={() => setShowAddFunds(true)} className="px-2 py-1 bg-red-500 text-white rounded text-[10px] font-semibold flex items-center gap-1">
                                        <PlusCircle size={10} /> Add
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer - Compact */}
                    <div className="p-3 bg-white border-t border-slate-100 shrink-0">
                        <label onClick={() => setAgreement(!agreement)} className="flex items-start gap-2 cursor-pointer mb-3 select-none">
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all ${agreement ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                {agreement && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-slate-700">I accept the Visiting Charges & Terms</p>
                                <p className="text-[10px] text-slate-500">Authorize technician to inspect & quote.</p>
                            </div>
                        </label>

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConfirm}
                            disabled={!agreement || (insufficientFunds && paymentMethod === 'wallet')}
                            className={`w-full py-2.5 rounded-lg text-white font-semibold text-sm shadow transition-all flex items-center justify-center gap-2 ${agreement && (!insufficientFunds || paymentMethod !== 'wallet') ? (isTechBusy ? 'bg-amber-600' : 'bg-blue-600 hover:bg-blue-700') : 'bg-slate-300 cursor-not-allowed'}`}
                        >
                            {isTechBusy ? <Clock size={14} /> : <ShieldCheck size={14} />}
                            {!agreement ? 'Accept Terms' : (isTechBusy ? 'Queue & Wait' : 'Confirm Booking')}
                        </motion.button>
                    </div>
                </motion.div>
            </motion.div>

            <AddFundsModal isOpen={showAddFunds} onClose={() => setShowAddFunds(false)} onSuccess={fetchWalletBalance} />
        </AnimatePresence>
        , document.body);
};

export default BookingConfirmationModal;
