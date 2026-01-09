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
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col md:flex-row relative border-4 border-red-600"
                >
                    {/* Floating Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-8 right-8 z-[60] p-3 rounded-full bg-white shadow-xl hover:bg-slate-50 transition-all text-slate-400 hover:text-slate-600 hover:rotate-90 duration-300"
                    >
                        <X size={28} />
                    </button>

                    {/* --- LEFT: MAP SECTION --- */}
                    <div className="w-full md:w-1/2 h-[40%] md:h-full relative bg-slate-100">
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
                                        scale: 10,
                                        fillColor: "#3B82F6",
                                        fillOpacity: 1,
                                        strokeColor: "#FFFFFF",
                                        strokeWeight: 4,
                                    }}
                                />
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-500/10 rounded-full animate-ping pointer-events-none" />

                                {/* Tech Markers using OverlayView for Custom UI */}
                                {!searching && technicians.map((tech) => {
                                    // Robust Image Logic
                                    let photoUrl = tech.documents?.photo
                                        ? (tech.documents.photo.startsWith('http') ? tech.documents.photo : `http://localhost:3000${tech.documents.photo}`)
                                        : `https://ui-avatars.com/api/?name=${tech.name}&background=random`;

                                    // Real Status Logic
                                    const rawStatus = tech.status;
                                    const statusConfig = getStatusConfig(rawStatus);
                                    // TEMP: Allow pending for testing
                                    const isAvailable = ['available', 'pending'].includes((rawStatus || '').toLowerCase().trim());

                                    // FORCE FLOAT with safety checks
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
                                                className={`relative flex flex-col items-center group ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} hover:z-[999] -translate-y-4`}
                                                onClick={() => {
                                                    if (isAvailable) onBook(tech);
                                                    else alert(`This technician is currently ${statusConfig.label}`);
                                                }}
                                            >

                                                {/* Status Flag Badge (Literal Flag) */}
                                                <div className={`flex items-center gap-1.5 mb-2 px-3 py-1.5 rounded-full shadow-lg border-2 border-white ${statusConfig.bg} ${statusConfig.text} text-xs font-bold uppercase tracking-wider whitespace-nowrap transform transition-all group-hover:-translate-y-1`}>
                                                    <CircleDot size={10} className="fill-current" />
                                                    {statusConfig.label}
                                                </div>

                                                {/* Technician Avatar Marker */}
                                                <div className={`w-16 h-16 rounded-full border-4 border-white shadow-2xl overflow-hidden ring-4 ${statusConfig.color.replace('bg-', 'ring-')} transition-transform transform group-hover:scale-110 duration-200 bg-white relative z-10`}>
                                                    <img
                                                        src={photoUrl}
                                                        alt={tech.name}
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${tech.name}&background=random`}
                                                    />
                                                </div>

                                                {/* Pointer Triangle */}
                                                <div className={`w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] ${statusConfig.color.replace('bg-', 'border-t-')} -mt-0.5 drop-shadow-sm`}></div>
                                            </div>
                                        </OverlayView>
                                    );
                                })}

                            </GoogleMap>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400 font-medium text-lg">Loading Map...</div>
                        )}

                        {/* Search Loading Overlay */}
                        <AnimatePresence>
                            {searching && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-10"
                                >
                                    <div className="relative">
                                        <div className="w-24 h-24 border-[6px] border-slate-200 border-t-blue-600 rounded-full animate-spin"></div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Navigation size={32} className="text-blue-600 animate-pulse" />
                                        </div>
                                    </div>
                                    <h3 className="mt-8 text-2xl font-bold text-slate-800">Locating Professionals</h3>
                                    <p className="text-base text-slate-500 font-medium">Scanning network for {serviceType}s...</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* --- RIGHT: LIST SECTION --- */}
                    <div className="w-full md:w-1/2 h-[60%] md:h-full bg-white flex flex-col relative z-20 shadow-xl border-l border-slate-200">
                        {/* Header */}
                        <div className="px-12 py-12 border-b border-slate-100 bg-white z-30">
                            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
                                {searching ? `Searching...` : `Nearby ${serviceType}s`}
                            </h2>
                            <div className="flex items-center gap-3 mt-3">
                                <span className={`flex h-3 w-3 rounded-full ${searching ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500 animate-pulse'}`}></span>
                                <p className="text-base font-medium text-slate-500">
                                    {searching ? "Connecting to dispatch grid..." : `${technicians.length} professionals found`}
                                </p>
                            </div>
                        </div>

                        {/* List Content */}
                        <div className="flex-1 overflow-y-auto px-12 py-12 space-y-48 custom-scrollbar bg-slate-50">
                            {searching ? (
                                // Skeletons
                                [1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-10 rounded-3xl border border-slate-100 shadow-sm animate-pulse flex gap-8">
                                        <div className="w-14 h-14 bg-slate-200 rounded-full" />
                                        <div className="flex-1 space-y-3 py-3">
                                            <div className="h-5 bg-slate-200 rounded w-2/3" />
                                            <div className="h-4 bg-slate-100 rounded w-1/3" />
                                        </div>
                                    </div>
                                ))
                            ) : technicians.length > 0 ? (
                                technicians.map((tech, idx) => {
                                    // Image
                                    let photoUrl = tech.documents?.photo
                                        ? (tech.documents.photo.startsWith('http') ? tech.documents.photo : `http://localhost:3000${tech.documents.photo}`)
                                        : `https://ui-avatars.com/api/?name=${tech.name}&background=random`;

                                    // Status
                                    const rawStatus = tech.status;
                                    const statusConfig = getStatusConfig(rawStatus);
                                    // TEMP: Allow pending for testing
                                    const isAvailable = ['available', 'pending'].includes((rawStatus || '').toLowerCase().trim());

                                    return (
                                        <motion.div
                                            key={tech.id}
                                            onClick={() => {
                                                if (isAvailable) onBook(tech);
                                            }}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className={`group relative bg-white rounded-3xl p-8 border-2 border-pink-500 shadow-sm transition-all duration-300 ${isAvailable ? 'hover:shadow-2xl hover:border-blue-200 cursor-pointer hover:-translate-y-1 hover:scale-[1.02]' : 'cursor-not-allowed opacity-90'}`}

                                        >
                                            <div className="flex gap-8 items-center">
                                                {/* List Avatar (Refined Spacing) */}
                                                <div className="relative flex-shrink-0">
                                                    <div className={`w-14 h-14 rounded-full overflow-hidden border-4 border-slate-50 bg-slate-100 shadow-lg relative ${isAvailable ? 'group-hover:border-blue-50' : ''} transition-all`}>
                                                        <img
                                                            src={photoUrl}
                                                            alt={tech.name}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${tech.name}&background=random`}
                                                        />
                                                    </div>
                                                    {/* Rating Badge (Compact) */}
                                                    <div className="absolute -bottom-1 -right-1 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100 flex items-center gap-1 text-[10px] font-bold text-slate-700">
                                                        {tech.rating && tech.rating > 0 && tech.rating <= 5 ? (
                                                            <>
                                                                <Star size={10} className="fill-yellow-400 text-yellow-400" />
                                                                {tech.rating}
                                                            </>
                                                        ) : (
                                                            <span className="text-[9px] text-blue-600 font-bold uppercase tracking-wide">New Talent</span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div>
                                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                                                                {tech.name}
                                                            </h3>
                                                            {/* Status Badge in List */}
                                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold mt-1.5 ${statusConfig.bg} ${statusConfig.text} border ${statusConfig.border}`}>
                                                                <CircleDot size={10} className={`mr-1.5 fill-current`} />
                                                                {statusConfig.label}
                                                            </div>
                                                        </div>
                                                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full whitespace-nowrap">
                                                            {tech.distance} km
                                                        </span>
                                                    </div>

                                                    <div className="flex items-center gap-6 mt-4">
                                                        <span className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                                            <Briefcase size={16} className="text-slate-400" /> {tech.experience ? `${tech.experience} Yrs` : "No Experience"}
                                                        </span>
                                                        <span className="flex items-center gap-2 text-sm font-medium text-emerald-600">
                                                            <CheckCircle2 size={16} /> Verified
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Button - MASSIVE Size */}
                                                {/* Action Button - Conditional Logic */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (isAvailable) {
                                                            onBook(tech);
                                                        }
                                                    }}
                                                    disabled={!isAvailable}
                                                    className={`px-28 py-7 text-xs font-bold active:scale-95 whitespace-nowrap self-center tracking-wide flex items-center justify-center leading-relaxed rounded-2xl shadow-lg transition-all
                                                        ${isAvailable
                                                            ? 'bg-slate-900 hover:bg-blue-600 text-white hover:shadow-xl hover:shadow-blue-500/20'
                                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                                                        }
                                                    `}
                                                >
                                                    {isAvailable ? 'Book Now' : statusConfig.label}
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })
                            ) : (
                                // No Results State
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                                        <AlertCircle size={40} className="text-slate-400" />
                                    </div>
                                    <h4 className="text-xl font-bold text-slate-800">No Professionals Found</h4>
                                    <p className="text-sm mt-3 max-w-[250px] leading-relaxed text-slate-400">
                                        We couldn't locate any available {serviceType}s nearby.
                                    </p>
                                    <button onClick={onClose} className="mt-6 text-blue-600 font-bold text-sm hover:underline">
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
