import { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, MapPin, ShieldCheck, CheckCircle, Star, Zap, User } from 'lucide-react';

const BookingConfirmationModal = ({ isOpen, onClose, technician, jobDetails, onConfirm }) => {
    const [agreement, setAgreement] = useState(false);
    const [readableAddress, setReadableAddress] = useState(jobDetails?.location?.address || "Current Location");

    useEffect(() => {
        if (isOpen && jobDetails?.location?.latitude && jobDetails?.location?.longitude) {
            const fetchAddress = async () => {
                try {
                    const apiKey = "AIzaSyBN-6NUc8fWY4FsOLvOXj7gvX4pWYVDRUU";
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
        }
    }, [isOpen, jobDetails]);

    if (!isOpen) return null;

    const visitingCharges = 299;
    const photoUrl = technician?.documents?.photo
        ? (technician.documents.photo.startsWith('http') ? technician.documents.photo : `http://localhost:3000${technician.documents.photo}`)
        : `https://ui-avatars.com/api/?name=${technician?.name || 'Tech'}&background=random`;

    return ReactDOM.createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    // Split Screen Layout based on Colorlib Booking 12
                    className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative ring-1 ring-white/10"
                >
                    {/* LEFT SIDE: Visual / Technician Profile (40%) */}
                    <div className="md:w-2/5 relative bg-slate-900 text-white overflow-hidden flex flex-col justify-between p-8">
                        {/* Background Image / Gradient */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src="https://images.unsplash.com/photo-1581578731117-104f8a3d46a8?auto=format&fit=crop&q=80&w=1000"
                                alt="Service Background"
                                className="w-full h-full object-cover opacity-40 mix-blend-overlay"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/90 to-purple-900/90" />
                        </div>

                        {/* Header on Visual Side */}
                        <div className="relative z-10">
                            <h3 className="text-sm font-bold tracking-widest uppercase text-blue-200 mb-2">Service Booking</h3>
                            <h2 className="text-3xl font-extrabold tracking-tight">Almost <br /> Done!</h2>
                        </div>

                        {/* Technician Overlay */}
                        <div className="relative z-10 mt-auto bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                            <div className="flex items-center gap-4">
                                {technician ? (
                                    <img src={photoUrl} alt={technician.name} className="w-14 h-14 rounded-full border-2 border-white/50 object-cover" />
                                ) : (
                                    <div className="w-14 h-14 rounded-full border-2 border-white/50 bg-blue-500 flex items-center justify-center">
                                        <Zap size={24} className="text-white fill-white" />
                                    </div>
                                )}
                                <div>
                                    <p className="text-xs text-blue-200 font-bold uppercase tracking-wider mb-0.5">{technician ? "Your Expert" : "Smart Assign"}</p>
                                    <h4 className="font-bold text-lg leading-tight">{technician?.name || "Finding Best Expert..."}</h4>
                                    <div className="flex items-center gap-1 text-xs text-amber-400 mt-1">
                                        <Star size={10} fill="currentColor" /> <span className="font-bold">{technician?.rating || 'Top Rated'}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center text-xs font-medium text-slate-300">
                                <span>{technician?.serviceType || jobDetails?.serviceType}</span>
                                <span className="flex items-center gap-1 text-emerald-400"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Available Now</span>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Form / Details (60%) */}
                    <div className="md:w-3/5 flex flex-col bg-white h-full relative">
                        {/* Close Button */}
                        <button onClick={onClose} className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors z-50">
                            <X size={24} />
                        </button>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-10">
                            <h3 className="text-2xl font-bold text-slate-800 mb-6">Booking Details</h3>

                            {/* Info Grid - Styled like Inputs */}
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={12} /> Date</label>
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
                                            {jobDetails?.scheduledDate || "Today"}
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Clock size={12} /> Time</label>
                                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700">
                                            {jobDetails?.scheduledTime || "Now"}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><MapPin size={12} /> Service Location</label>
                                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 break-words">
                                        {readableAddress}
                                    </div>
                                </div>

                                {/* Financials - Minimalist */}
                                <div className="py-6 border-t border-b border-slate-100 flex items-center justify-between">
                                    <div>
                                        <span className="block text-sm font-medium text-slate-500">Visiting Charges</span>
                                        <span className="text-xs text-slate-400">Paid upon arrival</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="block text-2xl font-extrabold text-slate-900">₹{visitingCharges}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="p-8 md:p-10 pt-0 bg-white">
                            {/* Agreement */}
                            <div
                                onClick={() => setAgreement(!agreement)}
                                className="flex items-start gap-3 mb-6 cursor-pointer select-none group"
                            >
                                <div className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${agreement ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white group-hover:border-blue-400'}`}>
                                    {agreement && <CheckCircle size={14} className="text-white" strokeWidth={3} />}
                                </div>
                                <p className="text-sm text-slate-500 font-medium group-hover:text-slate-700 transition-colors">
                                    I agree to the charges & authorize the inspection.
                                </p>
                            </div>

                            <button
                                onClick={() => {
                                    if (!agreement) {
                                        alert("Please agree to the terms to continue.");
                                        return;
                                    }
                                    onConfirm({ ...jobDetails, visitingCharges, agreementAccepted: true, technicianId: technician?.id || null });
                                }}
                                className={`w-full py-4 rounded-xl text-white font-bold shadow-xl transition-all flex items-center justify-center gap-2 ${agreement ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-blue-600/30 hover:-translate-y-0.5' : 'bg-slate-400 opacity-80'}`}
                            >
                                <ShieldCheck size={20} />
                                {agreement ? 'Confirm Booking' : 'Agree to Terms & Continue'}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
        , document.body);
};

export default BookingConfirmationModal;
