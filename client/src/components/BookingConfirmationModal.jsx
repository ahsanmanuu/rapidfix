import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden relative ring-1 ring-white/20 border-2 border-red-500"
                >
                    {/* LEFT SIDE: Visual Journey (40%) - Hidden on very small screens if needed, or collapsed */}
                    <div className="w-full md:w-2/5 relative bg-slate-900 text-white overflow-hidden flex flex-col justify-between p-6 md:p-10 shrink-0">
                        {/* Dynamic Background */}
                        <div className="absolute inset-0 z-0">
                            <img
                                src="https://images.unsplash.com/photo-1581578731117-104f8a3d46a8?auto=format&fit=crop&q=80&w=1000"
                                alt="Service Background"
                                className="w-full h-full object-cover opacity-50 mix-blend-overlay"
                            />
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900/95 via-indigo-900/95 to-slate-900/95" />
                        </div>

                        {/* Content */}
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-[10px] md:text-xs font-bold uppercase tracking-wider mb-4 md:mb-6">
                                <Zap size={12} className="fill-current" />
                                Instant Booking
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-none mb-2">Final<br /><span className="text-blue-400">Step</span></h2>
                            <p className="text-slate-300 font-medium text-xs md:text-sm leading-relaxed max-w-[250px] hidden md:block">
                                Confirm your details below to secure your expert technician instantly.
                            </p>
                        </div>

                        {/* Tech Card - Compact on mobile */}
                        <div className="relative z-10 mt-4 md:mt-auto bg-white/10 backdrop-blur-xl rounded-2xl md:rounded-3xl p-4 md:p-5 border border-red-500 shadow-xl">
                            <div className="flex items-center gap-4">
                                <div className="relative shrink-0">
                                    {technician ? (
                                        <img src={photoUrl} alt={technician.name} className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl border-2 border-white/30 object-cover shadow-lg" />
                                    ) : (
                                        <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl border-2 border-white/30 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                            <Zap size={20} className="text-white fill-white md:w-7 md:h-7" />
                                        </div>
                                    )}
                                    <div className="absolute -bottom-1 -right-1 md:-bottom-2 md:-right-2 bg-emerald-500 text-white text-[8px] md:text-[10px] font-bold px-1.5 md:px-2 py-0.5 rounded-full border border-slate-900">
                                        READY
                                    </div>
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] md:text-xs text-blue-200 font-bold uppercase tracking-widest mb-0.5 md:mb-1">{technician ? "Your Expert" : "Smart Assign"}</p>
                                    <h4 className="font-bold text-base md:text-lg leading-none mb-1 truncate">{technician?.name || "Assigning Best Tech..."}</h4>
                                    <div className="flex items-center gap-1 text-xs text-amber-400">
                                        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={10} fill="currentColor" strokeWidth={0} />)}
                                        <span className="ml-1 font-bold text-white/80">{technician?.rating || '5.0'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT SIDE: Actionable Form (60%) */}
                    <div className="w-full md:w-3/5 flex flex-col bg-white h-full relative">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 md:top-6 md:right-6 z-50 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} className="md:w-6 md:h-6" />
                        </button>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-10">
                            <h3 className="text-xl md:text-2xl font-black text-slate-800 mb-6 md:mb-8 border-l-4 border-blue-500 pl-4 mt-2 md:mt-0">Booking Summary</h3>

                            <div className="space-y-4 md:space-y-6">
                                {/* DateTime Group - Grid on big screens, stack on small */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-5">
                                    <div className="group">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Date</label>
                                        <div className="p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 group-hover:bg-white group-hover:border-blue-200 group-hover:shadow-lg transition-all duration-300">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0">
                                                <Calendar size={18} className="md:w-5 md:h-5" />
                                            </div>
                                            <span className="font-bold text-slate-700 text-base md:text-lg">{jobDetails?.scheduledDate || "Today"}</span>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Time</label>
                                        <div className="p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-3 group-hover:bg-white group-hover:border-blue-200 group-hover:shadow-lg transition-all duration-300">
                                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-indigo-100/50 flex items-center justify-center text-indigo-600 shrink-0">
                                                <Clock size={18} className="md:w-5 md:h-5" />
                                            </div>
                                            <span className="font-bold text-slate-700 text-base md:text-lg">{jobDetails?.scheduledTime || "Now"}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Location Group */}
                                <div className="group">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Service Location</label>
                                    <div className="p-3 md:p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-4 group-hover:bg-white group-hover:border-purple-200 group-hover:shadow-lg transition-all duration-300">
                                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-100/50 flex items-center justify-center text-purple-600 shrink-0 mt-0.5">
                                            <MapPin size={18} className="md:w-5 md:h-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-700 leading-snug text-sm md:text-base">{readableAddress}</p>
                                            <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-1">Precise GPS Location Detected</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Financials (Clean) */}
                                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-dashed border-slate-200">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs md:text-sm font-bold text-slate-500 uppercase tracking-wide">Visiting Charge</p>
                                            <p className="text-[10px] md:text-xs text-slate-400 font-medium">To be paid after service inspection</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">₹{visitingCharges}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer (Sticky) */}
                        <div className="p-6 md:p-8 bg-white border-t border-slate-100 relative z-20 shrink-0">
                            <label
                                onClick={() => setAgreement(!agreement)}
                                className="flex items-start gap-3 md:gap-4 cursor-pointer group mb-4 md:mb-6 select-none p-3 md:p-4 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100"
                            >
                                <div className={`mt-0.5 w-5 h-5 md:w-6 md:h-6 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${agreement ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                    {agreement && <CheckCircle size={14} className="text-white md:w-4 md:h-4" strokeWidth={4} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs md:text-sm font-bold text-slate-700 group-hover:text-blue-700 transition-colors">I accept the Visiting Charges & Terms</p>
                                    <p className="text-[10px] md:text-xs text-slate-500 mt-0.5">I authorize the technician to inspect and provide a final quote.</p>
                                </div>
                            </label>

                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (!agreement) {
                                        alert("Please agree to the terms to continue.");
                                        return;
                                    }
                                    onConfirm({ ...jobDetails, visitingCharges, agreementAccepted: true, technicianId: technician?.id || null });
                                }}
                                className={`w-full py-3 md:py-4 rounded-xl text-white font-bold shadow-xl transition-all flex items-center justify-center gap-3 relative overflow-hidden group ${agreement ? 'bg-slate-900 shadow-slate-900/20' : 'bg-slate-300 shadow-none cursor-not-allowed'}`}
                            >
                                {agreement && <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                <div className="relative z-10 flex items-center gap-2">
                                    <ShieldCheck size={18} className="md:w-5 md:h-5" />
                                    <span className="text-sm md:text-lg tracking-wide">{agreement ? 'Confirm & Book Now' : 'Accept Terms to Continue'}</span>
                                </div>
                            </motion.button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
        , document.body);
};

export default BookingConfirmationModal;
