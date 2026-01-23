import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar, Clock, MapPin, User, Phone, Search, CheckCircle,
    ArrowRight, ChevronDown, Crosshair, ShieldCheck, Zap, Droplet,
    Paintbrush, Fan, BatteryCharging, Video, Fingerprint, Printer
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ServiceBookingForm = ({ preselectedService = '', preselectedTechnician = null, onSearch }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        serviceType: preselectedService,
        technicianId: preselectedTechnician?.id || null,
        contactName: '',
        contactPhone: '',
        scheduledDate: '',
        scheduledTime: '',
        address: '',
        location: null
    });

    const [isServiceDropdownOpen, setIsServiceDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [locationStatus, setLocationStatus] = useState('idle');

    // Handle click outside for dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsServiceDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (preselectedTechnician) {
            setFormData(prev => ({
                ...prev,
                technicianId: preselectedTechnician.id,
                serviceType: preselectedService || preselectedTechnician.serviceType
            }));
        }
    }, [preselectedTechnician, preselectedService]);

    useEffect(() => {
        if (!formData.address && !formData.location && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    try {
                        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                        const data = await response.json();
                        if (data.results?.[0]) {
                            setFormData(prev => ({
                                ...prev,
                                location: { latitude, longitude },
                                address: data.results[0].formatted_address
                            }));
                            setLocationStatus('success');
                        }
                    } catch (error) { }
                },
                (err) => { },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleServiceSelect = (serviceName) => {
        setFormData(prev => ({ ...prev, serviceType: serviceName }));
        setIsServiceDropdownOpen(false);
    };

    const handleDetectLocation = (e) => {
        e.preventDefault();
        setLocationStatus('loading');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    try {
                        const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
                        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`);
                        const data = await response.json();

                        if (data.results?.[0]) {
                            setFormData(prev => ({
                                ...prev,
                                location: { latitude, longitude },
                                address: data.results[0].formatted_address
                            }));
                            setLocationStatus('success');
                        } else {
                            throw new Error("Address not found");
                        }
                    } catch (error) {
                        setFormData(prev => ({
                            ...prev,
                            location: { latitude, longitude },
                            address: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`
                        }));
                        setLocationStatus('success');
                    }
                },
                (err) => {
                    setLocationStatus('error');
                    alert("Could not access precise location. Please ensure GPS is enabled.");
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        } else {
            setLocationStatus('error');
            alert("Geolocation is not supported.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.serviceType) {
            alert("Please select a service type.");
            return;
        }
        if (!formData.address && !formData.location) {
            alert("Please detect your location.");
            return;
        }
        setLoading(true);
        setTimeout(() => {
            setLoading(false);
            if (onSearch) onSearch(formData);
            setSubmitted(true);
        }, 1500);
    };

    const services = [
        { name: "Electrician", icon: <Zap size={18} className="text-orange-600" /> },
        { name: "Plumber", icon: <Droplet size={18} className="text-orange-600" /> },
        { name: "Painter", icon: <Paintbrush size={18} className="text-orange-600" /> },
        { name: "A.C. Technician", icon: <Fan size={18} className="text-orange-600" /> },
        { name: "CCTV Technician", icon: <Video size={18} className="text-orange-600" /> },
        { name: "Inverter Technician", icon: <BatteryCharging size={18} className="text-orange-600" /> },
        { name: "Biometrics Technician", icon: <Fingerprint size={18} className="text-orange-600" /> },
        { name: "Printer Technician", icon: <Printer size={18} className="text-orange-600" /> }
    ];

    return (
        <div className="w-full max-w-[95%] sm:max-w-4xl mx-auto bg-white rounded-3xl sm:rounded-[2.5rem] shadow-2xl shadow-black/5 border border-slate-100 overflow-hidden relative z-30">
            {/* Expert Banner */}
            {preselectedTechnician && (
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-3 flex items-center justify-center gap-2 text-white shadow-lg">
                    <CheckCircle size={16} className="fill-white/20" />
                    <span className="font-extrabold text-[10px] sm:text-xs tracking-widest uppercase">Booking Expert: {preselectedTechnician.name}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 sm:p-8 md:p-10 space-y-4 sm:space-y-6">
                <div className="text-center pb-2">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Schedule Booking</h2>
                    <p className="text-slate-500 text-[10px] sm:text-sm mt-1">Find the best local experts in seconds.</p>
                </div>

                {/* Service Selection */}
                <div className="space-y-2 relative z-50">
                    <label className="text-slate-600 text-[11px] font-extrabold uppercase tracking-widest pl-1 block">Service Required</label>
                    <div className="relative" ref={dropdownRef}>
                        <div
                            onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                            className="relative flex items-center w-full rounded-xl border-2 border-slate-100 bg-white hover:border-orange-200 transition-all cursor-pointer py-2.5 px-4 focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10 shadow-sm"
                        >
                            <input
                                className="flex-1 w-full bg-transparent border-none text-slate-900 placeholder:text-slate-300 focus:ring-0 text-sm sm:text-base cursor-pointer font-bold truncate overflow-hidden pr-10"
                                placeholder="Select Service"
                                value={formData.serviceType}
                                readOnly
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <Search size={18} className="text-orange-500 shrink-0" />
                                <ChevronDown size={16} className={`text-slate-400 transition-transform shrink-0 ${isServiceDropdownOpen ? 'rotate-180' : ''}`} />
                            </div>
                        </div>

                        <AnimatePresence>
                            {isServiceDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 5 }}
                                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 p-2 overflow-hidden"
                                >
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-[240px] overflow-y-auto">
                                        {services.map((service) => (
                                            <div
                                                key={service.name}
                                                onClick={() => handleServiceSelect(service.name)}
                                                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-orange-50 text-slate-700 cursor-pointer transition-colors group"
                                            >
                                                <div className="p-1.5 bg-slate-50 rounded group-hover:bg-white border border-transparent group-hover:border-orange-100 transition-all">
                                                    {service.icon}
                                                </div>
                                                <span className="text-xs sm:text-sm font-bold group-hover:text-orange-700">{service.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-slate-600 text-[11px] font-extrabold uppercase tracking-widest pl-1 block">Preferred Date</label>
                        <div className="relative">
                            <input
                                type="date"
                                name="scheduledDate"
                                value={formData.scheduledDate}
                                onChange={handleChange}
                                className="w-full rounded-xl border-2 border-slate-100 bg-white text-slate-900 py-2.5 px-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-bold text-sm shadow-sm pr-10"
                                required
                            />
                            <Calendar size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-slate-600 text-[11px] font-extrabold uppercase tracking-widest pl-1 block">Time Slot</label>
                        <div className="relative">
                            <select
                                name="scheduledTime"
                                value={formData.scheduledTime}
                                onChange={handleChange}
                                className="w-full rounded-xl border-2 border-slate-100 bg-white text-slate-900 py-2.5 px-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-bold text-sm appearance-none cursor-pointer shadow-sm pr-10"
                                required
                            >
                                <option value="">Select Slot</option>
                                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                                <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                            </select>
                            <Clock size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Contact Info Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                        <label className="text-slate-600 text-[11px] font-extrabold uppercase tracking-widest pl-1 block">Your Name</label>
                        <div className="relative">
                            <input
                                type="text"
                                name="contactName"
                                placeholder="Full Name"
                                value={formData.contactName}
                                onChange={handleChange}
                                className="w-full rounded-xl border-2 border-slate-100 bg-white text-slate-900 py-2.5 px-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-bold text-sm placeholder:text-slate-300 shadow-sm pr-10"
                                required
                            />
                            <User size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-slate-600 text-[11px] font-extrabold uppercase tracking-widest pl-1 block">Mobile Number</label>
                        <div className="relative">
                            <input
                                type="tel"
                                name="contactPhone"
                                placeholder="+91"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                className="w-full rounded-xl border-2 border-slate-100 bg-white text-slate-900 py-2.5 px-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-bold text-sm placeholder:text-slate-300 shadow-sm pr-10"
                                required
                            />
                            <Phone size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* Location Input */}
                <div className="space-y-2">
                    <label className="text-slate-600 text-[11px] font-extrabold uppercase tracking-widest pl-1 block">Service Address</label>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                name="address"
                                placeholder="Full Address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full rounded-xl border-2 border-slate-100 bg-white text-slate-900 py-2.5 px-4 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all outline-none font-bold text-sm placeholder:text-slate-300 shadow-sm pr-10 truncate"
                                required={!formData.location}
                            />
                            <MapPin size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-500 pointer-events-none" />
                        </div>
                        <button
                            type="button"
                            onClick={handleDetectLocation}
                            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all active:scale-95 border-2 ${locationStatus === 'success' ? 'bg-green-50 border-green-100 text-green-600' : 'bg-slate-100 border-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            <Crosshair size={16} className={`${locationStatus === 'loading' ? 'animate-spin' : ''}`} />
                            {locationStatus === 'success' ? 'Detected' : 'Detect'}
                        </button>
                    </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2">
                    <button
                        type="submit"
                        disabled={loading}
                        className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 p-4 text-sm font-black uppercase tracking-widest text-white shadow-xl shadow-orange-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-orange-500/40 active:scale-[0.98] disabled:opacity-70"
                    >
                        <div className="relative z-10 flex items-center justify-center gap-3">
                            {loading ? (
                                <>
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>Book Now</span>
                                    <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1.5" />
                                </>
                            )}
                        </div>
                    </button>
                    <div className="flex items-center justify-center gap-1.5 text-slate-400 text-[9px] sm:text-[10px] uppercase tracking-widest mt-6 font-bold">
                        <ShieldCheck size={12} className="text-orange-500" />
                        Secure Verified Encryption
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ServiceBookingForm;
