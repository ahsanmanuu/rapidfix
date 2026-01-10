import { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker, OverlayView } from '@react-google-maps/api';
import { searchTechnicians } from '../services/api';
import { X, Navigation, AlertCircle, Star, CheckCircle2, CircleDot, Briefcase, MapPin } from 'lucide-react';
import { useSocket } from '../context/SocketContext';

const mapContainerStyle = {
    width: '100%',
    height: '100%'
};

// Premium Map Styles (Silver/Grayscale)
const mapOptions = {
    disableDefaultUI: true,
    zoomControl: false
};

const getStatusConfig = (status) => {
    // Normalize status to lowercase for robust matching
    const s = (status || '').toLowerCase().trim();
    switch (s) {
        case 'available': return { color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Available' };
        case 'engaged':
        case 'busy': return { color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Engaged' };
        case 'finishing_work':
        case 'finishing work': return { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Finishing Job' };
        case 'pending': return { color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', label: 'Pending Approval' };
        case 'not_available':
        case 'offline':
        case 'not available': return { color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-200', label: 'Not Available' };
        default: return { color: 'bg-slate-300', text: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: status || 'Unknown' };
    }
};



const TechnicianSearchModal = ({ isOpen, onClose, userLocation, serviceType, onBook }) => {
    const [searching, setSearching] = useState(true);
    const [technicians, setTechnicians] = useState([]);
    const [error, setError] = useState(null);
    const [map, setMap] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyBN-6NUc8fWY4FsOLvOXj7gvX4pWYVDRUU"
    });

    const onLoad = useCallback(function callback(map) { setMap(map); }, []);
    const onUnmount = useCallback(function callback(map) { setMap(null); }, []);

    const socket = useSocket();

    const performSearch = useCallback(async () => {
        if (!userLocation || !serviceType) return;
        setSearching(true);
        setError(null);
        try {
            const res = await searchTechnicians({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                serviceType
            });

            if (res.data.success) {
                setTechnicians(res.data.technicians || []);
            } else {
                setTechnicians([]);
            }
        } catch (err) {
            console.error("Search failed", err);
            setError("Failed to search technicians.");
        } finally {
            setSearching(false);
        }
    }, [userLocation, serviceType]);

    useEffect(() => {
        if (isOpen) {
            performSearch();
        }
    }, [isOpen, performSearch]);

    // Real-time Updates (Status & Location)
    useEffect(() => {
        if (!socket || !isOpen) return;
        const handleUpdate = () => {
            console.log("Realtime update received (Location or Status)");
            performSearch();
        };
        socket.on('technician_status_update', handleUpdate);
        socket.on('technician_location_update', handleUpdate); // [NEW] Live movement

        return () => {
            socket.off('technician_status_update', handleUpdate);
            socket.off('technician_location_update', handleUpdate);
        };
    }, [socket, isOpen, performSearch]);

    // Real-time Updates

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col md:flex-row relative ring-1 ring-white/20 border-2 border-red-500"
                >
                    {/* Floating Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:top-6 md:right-6 z-[60] p-2.5 md:p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-xl hover:bg-white text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300 ring-1 ring-slate-100"
                    >
                        <X size={20} className="md:w-6 md:h-6" />
                    </button>

                    {/* --- LEFT: MAP SECTION --- */}
                    <div className="w-full md:w-1/2 h-[40%] md:h-full relative bg-slate-100 shrink-0">
                        {isLoaded && userLocation ? (
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={{ lat: parseFloat(userLocation.latitude), lng: parseFloat(userLocation.longitude) }}
                                zoom={14}
                                options={mapOptions}
                                onLoad={onLoad}
                                onUnmount={onUnmount}
                            >
                                {/* User Pulse Marker */}
                                <Marker
                                    position={{ lat: parseFloat(userLocation.latitude), lng: parseFloat(userLocation.longitude) }}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        scale: 12,
                                        fillColor: "#3B82F6",
                                        fillOpacity: 1,
                                        strokeColor: "#FFFFFF",
                                        strokeWeight: 4,
                                    }}
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full animate-ping pointer-events-none" />

                                {/* Tech Markers using OverlayView for Custom UI */}
                                {!searching && Array.isArray(technicians) && technicians
                                    .filter(tech => tech.distance <= 2.0)
                                    .map((tech) => {
                                        let photoUrl = tech.documents?.photo
                                            ? (tech.documents.photo.startsWith('http') ? tech.documents.photo : `http://localhost:3000${tech.documents.photo}`)
                                            : `https://ui-avatars.com/api/?name=${tech.name}&background=random`;

                                        const rawStatus = tech.status;
                                        const statusConfig = getStatusConfig(rawStatus);
                                        const isAvailable = ['available', 'pending'].includes((rawStatus || '').toLowerCase().trim());

                                        const lat = parseFloat(tech.location?.latitude || userLocation.latitude);
                                        const lng = parseFloat(tech.location?.longitude || userLocation.longitude);

                                        return (
                                            <OverlayView
                                                key={tech.id}
                                                position={{ lat, lng }}
                                                mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                                getPixelPositionOffset={(width, height) => ({ x: -(width / 2), y: -(height / 2) })}
                                            >
                                                <div
                                                    className={`relative flex flex-col items-center group ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} hover:z-[999] -translate-y-6 transition-all duration-300`}
                                                    onClick={() => {
                                                        if (isAvailable) onBook(tech);
                                                        else alert(`This technician is currently ${statusConfig.label}`);
                                                    }}
                                                >
                                                    {/* Status Flag Badge */}
                                                    <div className={`flex items-center gap-1.5 mb-2 px-3 py-1.5 rounded-full shadow-lg border-2 border-white ${statusConfig.bg} ${statusConfig.text} text-[10px] font-black uppercase tracking-wider whitespace-nowrap opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300`}>
                                                        <CircleDot size={8} className="fill-current" />
                                                        {statusConfig.label}
                                                    </div>

                                                    {/* Technician Avatar Marker */}
                                                    <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-[3px] border-white shadow-xl overflow-hidden ring-4 ${statusConfig.color.replace('bg-', 'ring-')} transition-all transform group-hover:scale-125 duration-300 bg-white relative z-10 box-border`}>
                                                        <img
                                                            src={photoUrl}
                                                            alt={tech.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${tech.name}&background=random`}
                                                        />
                                                    </div>

                                                    {/* Pointer */}
                                                    <div className={`w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] ${statusConfig.color.replace('bg-', 'border-t-')} mt-1 drop-shadow-sm opacity-80`}></div>
                                                </div>
                                            </OverlayView>
                                        );
                                    })}

                            </GoogleMap>
                        ) : (
                            <div className="flex items-center justify-center h-full bg-slate-50 text-slate-400 font-medium text-lg">
                                <div className="flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 border-4 border-slate-200 border-t-slate-400 rounded-full animate-spin" />
                                    <span>Initializing Satellite Map...</span>
                                </div>
                            </div>
                        )}

                        {/* Search Loading Overlay */}
                        <AnimatePresence>
                            {searching && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white/40 backdrop-blur-xl flex flex-col items-center justify-center z-10"
                                >
                                    <div className="relative">
                                        <div className="w-20 h-20 md:w-28 md:h-28 border-[6px] border-white/50 border-t-blue-600 rounded-full animate-spin shadow-2xl"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Navigation size={28} className="text-blue-600 animate-pulse fill-blue-600/20 md:w-9 md:h-9" />
                                        </div>
                                    </div>
                                    <h3 className="mt-8 text-xl md:text-2xl font-black text-slate-800 tracking-tight">Locating Experts</h3>
                                    <p className="text-slate-500 font-medium text-sm md:text-base">Scanning nearby area for top-rated {serviceType}s...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* --- RIGHT: LIST SECTION --- */}
                    <div className="w-full md:w-1/2 h-[60%] md:h-full bg-white flex flex-col relative z-20 shadow-2xl border-l border-slate-100">
                        {/* Header */}
                        <div className="px-6 md:px-10 py-6 md:py-8 border-b border-slate-100 bg-white z-30 flex justify-between items-center">
                            <div>
                                <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                                    {searching ? `Searching...` : `Nearby ${serviceType}s`}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`flex h-2 w-2 md:h-2.5 md:w-2.5 rounded-full ${searching ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}></span>
                                    <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-wide">
                                        {searching ? "Live Scanning" : `${Array.isArray(technicians) ? technicians.length : 0} professionals found`}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8 md:py-8 space-y-4 md:space-y-5 custom-scrollbar bg-slate-50/50">
                            {searching ? (
                                // Skeletons
                                [1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm animate-pulse flex gap-5 items-center">
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-200 rounded-2xl" />
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 md:h-5 bg-slate-200 rounded w-2/3" />
                                            <div className="h-3 md:h-4 bg-slate-100 rounded w-1/3" />
                                        </div>
                                    </div>
                                ))
                            ) : (Array.isArray(technicians) ? technicians.filter(t => t.distance <= 2.0) : []).length > 0 ? (
                                (Array.isArray(technicians) ? technicians : [])
                                    .filter(tech => tech.distance <= 2.0)
                                    .map((tech, idx) => {
                                        let photoUrl = tech.documents?.photo
                                            ? (tech.documents.photo.startsWith('http') ? tech.documents.photo : `http://localhost:3000${tech.documents.photo}`)
                                            : `https://ui-avatars.com/api/?name=${tech.name}&background=random`;

                                        const rawStatus = tech.status;
                                        const statusConfig = getStatusConfig(rawStatus);
                                        const isAvailable = ['available', 'pending'].includes((rawStatus || '').toLowerCase().trim());

                                        return (
                                            <motion.div
                                                key={tech.id}
                                                onClick={() => {
                                                    if (isAvailable) onBook(tech);
                                                }}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={`group relative bg-white rounded-2xl md:rounded-3xl p-4 md:p-6 border border-red-500 shadow-sm transition-all duration-300 ${isAvailable ? 'hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 cursor-pointer hover:-translate-y-1' : 'cursor-not-allowed opacity-70 grayscale'}`}
                                            >
                                                <div className="flex gap-4 md:gap-5 items-center">
                                                    {/* List Avatar */}
                                                    <div className="relative flex-shrink-0">
                                                        <div className={`w-14 h-14 md:w-16 md:h-16 rounded-xl md:rounded-2xl overflow-hidden shadow-md ${isAvailable ? '' : ''}`}>
                                                            <img
                                                                src={photoUrl}
                                                                alt={tech.name}
                                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                                onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${tech.name}&background=random`}
                                                            />
                                                        </div>
                                                        {/* Rating Float */}
                                                        <div className="absolute -bottom-2 -right-2 bg-white px-2 py-0.5 rounded-lg shadow-sm border border-slate-100 flex items-center gap-1 text-[10px] font-bold text-slate-700">
                                                            <Star size={10} className="fill-amber-400 text-amber-400" />
                                                            {tech.rating || 'New'}
                                                        </div>
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <h3 className="text-base md:text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">
                                                                {tech.name}
                                                            </h3>
                                                            <span className="text-[10px] md:text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md whitespace-nowrap">
                                                                {tech.distance} km
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-2 mb-2 md:mb-3">
                                                            <div className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text}`}>
                                                                {statusConfig.label}
                                                            </div>
                                                            <span className="text-slate-300">|</span>
                                                            <span className="text-xs font-medium text-slate-500 flex items-center gap-1">
                                                                <Briefcase size={12} /> {tech.experience ? `${tech.experience} Yrs` : "N/A"}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                                                <CheckCircle2 size={12} /> Verified Base
                                                            </div>

                                                            {/* Mini Book Button */}
                                                            {isAvailable && (
                                                                <button className="px-3 py-1.5 md:px-4 bg-slate-900 text-white text-[10px] md:text-xs font-bold rounded-lg opacity-100 md:opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 md:translate-x-2 md:group-hover:translate-x-0">
                                                                    Book Now
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })
                            ) : (
                                // No Results State
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 md:p-8 text-slate-500">
                                    <div className="w-20 h-20 md:w-24 md:h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 animate-pulse">
                                        <AlertCircle size={40} className="text-slate-300 md:w-12 md:h-12" />
                                    </div>
                                    <h4 className="text-lg md:text-xl font-bold text-slate-800 mb-2">No Professionals Found</h4>
                                    <p className="text-xs md:text-sm mt-1 max-w-[280px] leading-relaxed text-slate-400">
                                        We couldn't locate any available {serviceType}s within 2km radius.
                                    </p>
                                    <button onClick={onClose} className="mt-6 md:mt-8 px-5 py-2.5 md:px-6 md:py-3 bg-blue-50 text-blue-600 font-bold rounded-xl text-xs md:text-sm hover:bg-blue-100 transition-colors">
                                        Expand Search Radius
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
        , document.body);
};

export default TechnicianSearchModal;
