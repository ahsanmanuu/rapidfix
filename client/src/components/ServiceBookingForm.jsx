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
        technicianId: preselectedTechnician?.id || null, // [NEW]
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

    // ... (useEffect for click outside remains)

    useEffect(() => {
        if (preselectedTechnician) {
            setFormData(prev => ({
                ...prev,
                technicianId: preselectedTechnician.id,
                // Also ensure service type matches tech if not set
                serviceType: preselectedService || preselectedTechnician.serviceType
            }));
        }
    }, [preselectedTechnician]);

    // Auto-detect location on mount if address is empty
    useEffect(() => {
        if (!formData.address && !formData.location && navigator.geolocation) {
            // Re-use logic from handleDetectLocation but silently (no alert on error)
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    const { latitude, longitude } = pos.coords;
                    try {
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();
                        if (data && data.display_name) {
                            setFormData(prev => ({
                                ...prev,
                                location: { latitude, longitude },
                                address: data.display_name
                            }));
                            setLocationStatus('success');
                        }
                    } catch (error) {
                        // Silent fail on auto-detect
                    }
                },
                (err) => { /* Silent fail */ }
            );
        }
    }, []); // Run once on mount

    // ... (other useEffects)

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
                        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                        const data = await response.json();

                        if (data && data.display_name) {
                            setFormData(prev => ({
                                ...prev,
                                location: { latitude, longitude },
                                address: data.display_name
                            }));
                            setLocationStatus('success');
                        } else {
                            throw new Error("Address not found");
                        }
                    } catch (error) {
                        console.error("Reverse geocoding failed:", error);
                        // Fallback if API fails
                        setFormData(prev => ({
                            ...prev,
                            location: { latitude, longitude },
                            address: `Lat: ${latitude.toFixed(4)}, Long: ${longitude.toFixed(4)}`
                        }));
                        setLocationStatus('success'); // Still success as we got coordinates
                    }
                },
                (err) => {
                    console.error('Location error', err);
                    setLocationStatus('error');
                    alert("Could not access location. Please allow location permissions.");
                },
                { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
            );
        } else {
            setLocationStatus('error');
            alert("Geolocation is not supported by your browser.");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.serviceType) {
            alert("Please select a service type.");
            return;
        }
        if (!formData.address && !formData.location) {
            alert("Please detect your location so we can find nearby technicians.");
            return;
        }
        // [FIX] Enforce coordinates to prevent "Missing location" errors in backend
        if (formData.address && !formData.location) {
            alert("We need your precise location coordinates to assign a technician. Please click 'Detect Location'.");
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
        { name: "Electrician", icon: <Zap size={18} className="text-[#137fec]" /> },
        { name: "Plumber", icon: <Droplet size={18} className="text-[#137fec]" /> },
        { name: "Painter", icon: <Paintbrush size={18} className="text-[#137fec]" /> },
        { name: "A.C. Technician", icon: <Fan size={18} className="text-[#137fec]" /> },
        { name: "CCTV Technician", icon: <Video size={18} className="text-[#137fec]" /> },
        { name: "Inverter Technician", icon: <BatteryCharging size={18} className="text-[#137fec]" /> },
        { name: "Biometrics Technician", icon: <Fingerprint size={18} className="text-[#137fec]" /> },
        { name: "Printer Technician", icon: <Printer size={18} className="text-[#137fec]" /> }
    ];

    // ...

    return (
        <div className="max-w-[680px] w-full bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl md:shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-100 md:border-2 md:border-red-500 overflow-hidden mx-auto font-sans relative z-30">
            {/* [NEW] Expert Booking Banner */}
            {preselectedTechnician && (
                <div className="bg-blue-50/50 border-b border-blue-100 p-3 md:p-4 rounded-t-xl flex items-center justify-center gap-2 text-blue-700">
                    <CheckCircle size={18} className="fill-blue-100 shrink-0" />
                    <span className="font-semibold text-xs md:text-sm">Booking Expert: {preselectedTechnician.name}</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 md:p-10 space-y-5 md:space-y-8 pt-4 md:pt-8 bg-white/50 backdrop-blur-sm"> {/* Refined padding */}

                {/* Service Type (Custom Dropdown) */}
                <div className="flex flex-col gap-2.5 relative z-50">
                    <label className="text-slate-800 text-sm font-bold uppercase tracking-wider">
                        Service Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative group" ref={dropdownRef}>
                        <div
                            onClick={() => setIsServiceDropdownOpen(!isServiceDropdownOpen)}
                            className="flex items-center w-full rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer py-4 px-4 focus-within:ring-4 focus-within:ring-[#137fec]/10 focus-within:border-[#137fec]"
                        >
                            <Search size={20} className="mr-3 text-slate-400 shrink-0" />
                            <input
                                className="flex-1 w-full bg-transparent border-none text-slate-900 placeholder:text-slate-400 focus:ring-0 text-base cursor-pointer font-medium min-w-0"
                                placeholder="Select a technician (Electrician, Plumber, etc.)"
                                value={formData.serviceType}
                                readOnly
                                type="text"
                            />
                            <ChevronDown size={20} className="ml-3 text-slate-400 shrink-0" />
                        </div>

                        <AnimatePresence>
                            {isServiceDropdownOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full left-0 w-full mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-[100] py-3 max-h-[300px] overflow-y-auto"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1 px-3">
                                        {services.map((service) => (
                                            <div
                                                key={service.name}
                                                onClick={() => handleServiceSelect(service.name)}
                                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 cursor-pointer text-slate-700 transition-colors group/item"
                                            >
                                                {service.icon}
                                                <span className="text-sm font-medium group-hover/item:text-[#137fec] transition-colors">{service.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* Date & Time Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2.5">
                        <label className="text-slate-800 text-sm font-bold uppercase tracking-wider">
                            Preferred Date <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                name="scheduledDate"
                                value={formData.scheduledDate}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 py-4 px-5 focus:ring-4 focus:ring-[#137fec]/10 focus:border-[#137fec] transition-all outline-none font-medium"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        <label className="text-slate-800 text-sm font-bold uppercase tracking-wider">
                            Preferred Time <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <select
                                name="scheduledTime"
                                value={formData.scheduledTime}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 py-4 px-5 focus:ring-4 focus:ring-[#137fec]/10 focus:border-[#137fec] transition-all outline-none font-medium appearance-none cursor-pointer"
                                required
                            >
                                <option value="">Select Time Slot</option>
                                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                                <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                                <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                                <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <Clock size={20} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-2.5">
                        <label className="text-slate-800 text-sm font-bold uppercase tracking-wider">
                            Full Name <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                name="contactName"
                                placeholder="John Doe"
                                value={formData.contactName}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 py-4 px-5 focus:ring-4 focus:ring-[#137fec]/10 focus:border-[#137fec] transition-all outline-none font-medium placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>
                    <div className="flex flex-col gap-2.5">
                        <label className="text-slate-800 text-sm font-bold uppercase tracking-wider">
                            Mobile No <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="tel"
                                name="contactPhone"
                                placeholder="+1 (555) 000-0000"
                                value={formData.contactPhone}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 py-4 px-5 focus:ring-4 focus:ring-[#137fec]/10 focus:border-[#137fec] transition-all outline-none font-medium placeholder:text-slate-400"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Service Location */}
                <div className="flex flex-col gap-2.5">
                    <label className="text-slate-800 text-sm font-bold uppercase tracking-wider">
                        Service Location <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                name="address"
                                placeholder="Enter your full address"
                                value={formData.address}
                                onChange={handleChange}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 text-slate-900 py-4 pr-10 pl-5 focus:ring-4 focus:ring-[#137fec]/10 focus:border-[#137fec] transition-all outline-none font-medium placeholder:text-slate-400"
                                required={!formData.location}
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                <MapPin size={20} />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={handleDetectLocation}
                            className="flex items-center justify-center gap-2 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all group shrink-0 active:scale-95 border border-slate-200 min-w-[120px]"
                        >
                            <Crosshair size={20} className={`text-[#137fec] ${locationStatus === 'loading' ? 'animate-spin' : 'group-active:scale-90'}`} />
                            <span className="hidden sm:inline">Detect</span>
                        </button>
                    </div>
                    {locationStatus === 'success' && <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle size={12} /> Location lat/long captured</p>}
                </div>

                <div className="pt-8">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#137fec] hover:bg-[#116dd9] text-white font-bold py-5 rounded-xl text-lg shadow-xl shadow-[#137fec]/25 transition-all flex items-center justify-center gap-3 group active:scale-[0.99]"
                    >
                        {loading ? 'Processing...' : 'Book Now'}
                        {!loading && <ArrowRight size={24} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                    <div className="flex items-center justify-center gap-2 text-slate-400 text-xs mt-4">
                        <ShieldCheck size={14} />
                        Your request is secure and verified
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ServiceBookingForm;
