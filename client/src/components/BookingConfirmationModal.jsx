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
                        setReadableAddress(sublocality && locality && sublocality !== locality ? `${sublocality}, ${locality}` : (sublocality || locality || "Your Location"));
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
        : `https://ui-avatars.com/api/?name=${technician?.name || 'T'}&background=0D9488&color=fff&size=48`;
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
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center p-3 bg-black/50 font-sans"
                onClick={onClose}
            >
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 30 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-xl shadow-xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - Clean teal gradient */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-500 text-white p-4 shrink-0 relative">
                        <button onClick={onClose} className="absolute top-3 right-3 p-1 text-white/70 hover:text-white rounded-full hover:bg-white/10">
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3">
                            <img src={photoUrl} alt="" className="w-11 h-11 rounded-full border-2 border-white/30 object-cover bg-teal-700" />
                            <div className="overflow-hidden">
                                <p className="text-[10px] uppercase tracking-wider text-teal-100 font-medium">{technician ? 'Your Technician' : 'Auto Assigning'}</p>
                                <p className="font-semibold text-sm truncate">{technician?.name || 'Best Available'}</p>
                                {technician && (
                                    <div className="flex items-center gap-1 mt-0.5">
                                        <Star size={10} className="text-yellow-300 fill-yellow-300" />
                                        <span className="text-xs text-teal-100">{technician.rating || '5.0'} • {jobDetails?.serviceType}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Content - Scrollable with fixed height */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50" style={{ maxHeight: 'calc(85vh - 180px)' }}>

                        {isTechBusy && (
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 flex items-start gap-2">
                                <Clock size={14} className="text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-700"><strong>Queue:</strong> Technician busy. They'll call when free.</p>
                            </div>
                        )}

                        {/* Schedule Info */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-2">Schedule</p>
                            <div className="flex gap-4">
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} className="text-teal-600" />
                                    <span className="text-xs font-medium text-gray-700">{jobDetails?.scheduledDate || 'Today'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={14} className="text-teal-600" />
                                    <span className="text-xs font-medium text-gray-700">{jobDetails?.scheduledTime || 'Now'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Location */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-2">Location</p>
                            <div className="flex items-center gap-2">
                                <MapPin size={14} className="text-teal-600 shrink-0" />
                                <span className="text-xs font-medium text-gray-700 truncate">{readableAddress}</span>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-2">Problem (Optional)</p>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the issue..."
                                className="w-full p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-teal-500 resize-none h-12"
                            />
                        </div>

                        {/* Pricing */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-2">Charges</p>
                            <div className="space-y-1 text-xs">
                                <div className="flex justify-between text-gray-600">
                                    <span>Base</span>
                                    <span>₹{pricing.baseCharge || 0}</span>
                                </div>
                                {pricing.distance > 0 && (
                                    <div className="flex justify-between text-gray-600">
                                        <span>Distance ({pricing.distance}km)</span>
                                        <span>₹{pricing.distanceCharge || 0}</span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold text-gray-800">
                                    <span>Total</span>
                                    {loadingPricing ? <span className="w-10 h-4 bg-gray-200 animate-pulse rounded" /> : <span>₹{pricing.total}</span>}
                                </div>
                            </div>
                        </div>

                        {/* Payment */}
                        <div className="bg-white rounded-lg border border-gray-200 p-3">
                            <p className="text-[10px] uppercase text-gray-400 font-semibold mb-2">Payment</p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPaymentMethod('wallet')}
                                    className={`flex-1 p-2 rounded border text-xs font-medium transition ${paymentMethod === 'wallet' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                >
                                    <Wallet size={12} className="inline mr-1" />
                                    Wallet <span className={walletBalance < pricing.total ? 'text-red-500' : ''}>₹{walletBalance}</span>
                                </button>
                                <button
                                    onClick={() => setPaymentMethod('cash')}
                                    className={`flex-1 p-2 rounded border text-xs font-medium transition ${paymentMethod === 'cash' ? 'bg-teal-50 border-teal-500 text-teal-700' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}
                                >
                                    <CreditCard size={12} className="inline mr-1" />
                                    Pay Later
                                </button>
                            </div>
                            {insufficientFunds && paymentMethod === 'wallet' && (
                                <div className="mt-2 flex items-center justify-between bg-red-50 border border-red-200 rounded p-2">
                                    <span className="text-[10px] text-red-600 font-medium">Low balance</span>
                                    <button onClick={() => setShowAddFunds(true)} className="text-[10px] bg-red-600 text-white px-2 py-1 rounded font-medium flex items-center gap-1">
                                        <PlusCircle size={10} /> Add
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 bg-white border-t border-gray-100 shrink-0">
                        <label onClick={() => setAgreement(!agreement)} className="flex items-start gap-2 cursor-pointer mb-3 select-none">
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${agreement ? 'bg-teal-600 border-teal-600' : 'border-gray-300'}`}>
                                {agreement && <CheckCircle size={10} className="text-white" strokeWidth={3} />}
                            </div>
                            <p className="text-xs text-gray-600">I accept the visiting charges and terms of service.</p>
                        </label>

                        <button
                            onClick={handleConfirm}
                            disabled={!agreement || (insufficientFunds && paymentMethod === 'wallet')}
                            className={`w-full py-2.5 rounded-lg text-white text-sm font-semibold flex items-center justify-center gap-2 transition ${agreement && (!insufficientFunds || paymentMethod !== 'wallet') ? 'bg-teal-600 hover:bg-teal-700' : 'bg-gray-300 cursor-not-allowed'}`}
                        >
                            <ShieldCheck size={16} />
                            {!agreement ? 'Accept Terms' : (isTechBusy ? 'Queue Booking' : 'Confirm Booking')}
                        </button>
                    </div>
                </motion.div>
            </motion.div>

            <AddFundsModal isOpen={showAddFunds} onClose={() => setShowAddFunds(false)} onSuccess={fetchWalletBalance} />
        </AnimatePresence>
        , document.body);
};

export default BookingConfirmationModal;
