import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Phone, Search, CheckCircle, ArrowRight } from 'lucide-react';
import { createJob } from '../services/api';

const ServiceBookingForm = ({ preselectedService = 'Electrician', onSearch }) => {
    const [formData, setFormData] = useState({
        serviceType: preselectedService,
        contactName: '',
        contactPhone: '',
        scheduledDate: '',
        scheduledTime: '',
        description: '',
        location: null
    });

    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [locationStatus, setLocationStatus] = useState('pending');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setFormData(prev => ({ ...prev, contactName: user.name || '', contactPhone: user.phone || '' }));

            // Priority: Use Saved User Location
            if (user.location && user.location.latitude) {
                setFormData(prev => ({
                    ...prev,
                    location: { ...user.location }
                }));
                setLocationStatus('success');
                return; // Skip fresh geolocation
            }
        }

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData(prev => ({
                        ...prev,
                        location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
                    }));
                    setLocationStatus('success');
                },
                (err) => {
                    console.error('Location error', err);
                    setLocationStatus('error');
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, [preselectedService]);

    useEffect(() => {
        setFormData(prev => ({ ...prev, serviceType: preselectedService }));
    }, [preselectedService]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.location) {
            alert("Location is required. Please enable location services.");
            return;
        }
        if (onSearch) {
            onSearch(formData);
        }
    };

    const services = [
        "Electrician", "Plumber", "Painter", "AC Technician",
        "Inverter Tech", "CCTV Technician", "Biometrics Technician", "Printer Technician"
    ];

    if (submitted) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-3xl shadow-2xl p-10 text-center min-h-[250px] flex flex-col items-center justify-center border border-slate-100"
            >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
                    <CheckCircle size={40} />
                </div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">Booking Confirmed</h2>
                <p className="text-slate-500 mb-6">Expert arriving on {formData.scheduledDate} at {formData.scheduledTime}</p>
                <button onClick={() => setSubmitted(false)} className="px-6 py-2 bg-slate-900 text-white rounded-lg font-bold">Book Another</button>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="w-full bg-white rounded-full shadow-[0_20px_40px_-5px_rgba(0,0,0,0.1)] border border-slate-200 p-2 pl-8 hidden lg:block"
        >
            <form onSubmit={handleSubmit} className="flex items-center divide-x divide-slate-200">
                {/* 1. Service */}
                <div className="flex-1 pr-6 py-2 group relative">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Service</label>
                    <div className="relative">
                        <select
                            name="serviceType"
                            value={formData.serviceType}
                            onChange={handleChange}
                            className="w-full bg-transparent border-none p-0 text-lg font-bold text-slate-800 focus:ring-0 cursor-pointer appearance-none truncate"
                        >
                            {services.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <p className="text-sm text-slate-400 truncate mt-0.5">What help do you need?</p>
                </div>

                {/* 2. Date & Time */}
                <div className="flex-1 px-6 py-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Schedule</label>
                    <div className="flex gap-2">
                        <input
                            type="date"
                            name="scheduledDate"
                            value={formData.scheduledDate}
                            onChange={handleChange}
                            className="bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 w-28 cursor-pointer"
                            required
                        />
                        <input
                            type="time"
                            name="scheduledTime"
                            value={formData.scheduledTime}
                            onChange={handleChange}
                            className="bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 w-20 cursor-pointer"
                            required
                        />
                    </div>
                    <p className="text-sm text-slate-400 truncate mt-0.5">Pick a slot</p>
                </div>

                {/* 3. Contact */}
                <div className="flex-1 px-6 py-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Contact</label>
                    <div className="flex flex-col">
                        <input type="text" name="contactName" placeholder="Name" value={formData.contactName} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-sm font-bold text-slate-800 focus:ring-0 placeholder:font-normal" required />
                        <input type="tel" name="contactPhone" placeholder="Phone" value={formData.contactPhone} onChange={handleChange} className="w-full bg-transparent border-none p-0 text-xs text-slate-500 focus:ring-0" required />
                    </div>
                </div>

                {/* 4. Description (Mobile hidden or truncated) */}
                <div className="flex-1 px-6 py-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Description</label>
                    <input
                        type="text"
                        name="description"
                        placeholder="Issue details..."
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-800 focus:ring-0 placeholder:text-slate-400"
                    />
                    <div className="flex items-center gap-1 mt-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${locationStatus === 'success' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                        <span className="text-[10px] text-slate-400">{locationStatus === 'success' ? 'Location Set' : 'Locating...'}</span>
                    </div>
                </div>

                {/* Button */}
                <div className="pl-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white rounded-full w-16 h-16 flex items-center justify-center shadow-lg transition-transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed group"
                    >
                        {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Search size={28} />}
                    </button>
                </div>
            </form>

            {/* Mobile Fallback - keeping the larger card style for mobile only */}
            <div className="lg:hidden">
                {/* Fallback code for mobile view if needed, or we just rely on grid stack. 
                    Actually, let's make the form responsive by using flex-col on mobile.
                */}
            </div>
        </motion.div>
    );
};

// We need a separate return for Mobile to look good.
// Replacing the above with a responsive version in one component.

const ResponsiveServiceBookingForm = ({ preselectedService = 'Electrician', onSearch }) => {
    const [formData, setFormData] = useState({
        serviceType: preselectedService,
        contactName: '',
        contactPhone: '',
        scheduledDate: '',
        scheduledTime: '',
        description: '',
        location: null
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [locationStatus, setLocationStatus] = useState('pending');

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user) {
            setFormData(prev => ({ ...prev, contactName: user.name || '', contactPhone: user.phone || '' }));
            // Priority: Use Saved User Location
            if (user.location && user.location.latitude) {
                setFormData(prev => ({
                    ...prev,
                    location: { ...user.location }
                }));
                setLocationStatus('success');
                return; // Skip fresh geolocation
            }
        }
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData(prev => ({
                        ...prev, location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
                    }));
                    setLocationStatus('success');
                },
                () => setLocationStatus('error'),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        }
    }, [preselectedService]);

    useEffect(() => { setFormData(prev => ({ ...prev, serviceType: preselectedService })); }, [preselectedService]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.location) { alert("Location required."); return; }
        if (onSearch) onSearch(formData);
    };

    if (submitted) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-xl p-8 text-center min-h-[200px] flex flex-col items-center justify-center border border-slate-100">
                <CheckCircle size={50} className="text-green-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800">Confirmed!</h2>
                <p className="text-slate-500 mb-4">Technician arriving shortly.</p>
                <button onClick={() => setSubmitted(false)} className="text-blue-600 font-bold hover:underline">Book Another</button>
            </motion.div>
        );
    }

    const services = ["Electrician", "Plumber", "Painter", "AC Technician", "Inverter Technician", "CCTV Technician", "Biometrics Technician", "Printer Technician"];

    const handleRetryLocation = () => {
        setLocationStatus('locating');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setFormData(prev => ({
                        ...prev, location: { latitude: pos.coords.latitude, longitude: pos.coords.longitude }
                    }));
                    setLocationStatus('success');
                },
                (err) => {
                    console.error('Location error', err);
                    setLocationStatus('error');
                    let msg = "Location access denied. Please enable permission in browser settings.";
                    if (err.code === 2) msg = "Position unavailable. Please check your GPS.";
                    if (err.code === 3) msg = "Location request timed out. Please try again.";
                    alert(msg);
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        } else {
            alert("Geolocation is not supported by your browser.");
            setLocationStatus('error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-white rounded-3xl shadow-[0_10px_40px_-5px_rgba(0,0,0,0.1)] border border-slate-200 p-4"
        >
            <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-4">

                {/* 1. Service */}
                <div className="flex-1 bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition-colors group cursor-pointer relative">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        <Search size={14} /> Service
                    </label>
                    <select
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleChange}
                        className="w-full bg-transparent border-none p-0 text-slate-900 font-bold text-lg focus:ring-0 cursor-pointer appearance-none z-10 relative"
                    >
                        {services.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <div className="absolute right-4 bottom-4 text-slate-300 pointer-events-none">
                        <ArrowRight size={16} className="transform rotate-90" />
                    </div>
                </div>

                {/* 2. Schedule */}
                <div className="flex-[1.2] bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition-colors">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        <Clock size={14} /> Date & Time
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            name="scheduledDate"
                            value={formData.scheduledDate}
                            onChange={handleChange}
                            className="bg-white rounded-lg border border-slate-200 px-2 py-1 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 w-full"
                            required
                        />
                        <input
                            type="time"
                            name="scheduledTime"
                            value={formData.scheduledTime}
                            onChange={handleChange}
                            className="bg-white rounded-lg border border-slate-200 px-2 py-1 text-sm font-bold text-slate-700 focus:ring-1 focus:ring-blue-500 w-32"
                            required
                        />
                    </div>
                </div>

                {/* 3. Contact */}
                <div className="flex-[1.3] bg-slate-50 rounded-2xl p-4 border border-slate-100 hover:border-blue-200 transition-colors">
                    <label className="flex items-center gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        <User size={14} /> Contact
                    </label>
                    <div className="flex flex-col gap-2">
                        <input
                            type="text"
                            name="contactName"
                            placeholder="Full Name"
                            value={formData.contactName}
                            onChange={handleChange}
                            className="w-full bg-white rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-900 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-400"
                            required
                        />
                        <input
                            type="tel"
                            name="contactPhone"
                            placeholder="Phone Number"
                            value={formData.contactPhone}
                            onChange={handleChange}
                            className="w-full bg-transparent border-none p-0 px-1 text-xs font-medium text-slate-500 focus:ring-0 placeholder:text-slate-400"
                            required
                        />
                    </div>
                </div>

                {/* 4. Details */}
                <div className="flex-[1.5] flex items-center gap-3 bg-slate-50 rounded-2xl p-2 pr-2 border border-slate-100 pl-4 hover:border-blue-200 transition-colors">
                    <div className="flex-1 py-2">
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Description (Optional)</label>
                        <input
                            type="text"
                            name="description"
                            placeholder="Describe the issue..."
                            value={formData.description}
                            onChange={handleChange}
                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-slate-700 focus:ring-0 placeholder:text-slate-400"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="h-12 px-6 bg-slate-900 hover:bg-black text-white rounded-xl font-bold text-sm shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shrink-0"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>Book <ArrowRight size={18} /></>}
                    </button>
                </div>
            </form>

            {/* GPS Indicator (Clickable for Retry) */}
            <div
                onClick={locationStatus === 'error' || locationStatus === 'pending' ? handleRetryLocation : undefined}
                className={`absolute -top-9 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full transition-all cursor-pointer ${locationStatus === 'error' ? 'bg-red-50 border border-red-100 shadow-sm' : 'bg-white/80 backdrop-blur border border-slate-100 shadow-sm'}`}
            >
                <div className={`w-2 h-2 rounded-full ${locationStatus === 'success' ? 'bg-green-500' : locationStatus === 'error' ? 'bg-red-500 animate-pulse' : 'bg-slate-400 animate-pulse'}`}></div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${locationStatus === 'error' ? 'text-red-600' : 'text-slate-600'}`}>
                    {locationStatus === 'success' ? 'Location Detected' : locationStatus === 'error' ? 'Retry Location' : 'Locating...'}
                </span>
            </div>
        </motion.div>
    );
};

export default ResponsiveServiceBookingForm;

