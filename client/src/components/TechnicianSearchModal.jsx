import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker, OverlayView, Circle } from '@react-google-maps/api';
import { searchTechnicians } from '../services/api';
import { X, Navigation, AlertCircle, Star, CheckCircle2, CircleDot, Briefcase, MapPin } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import useSupabaseRealtime from '../hooks/useSupabaseRealtime';

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
    let s = (status || '').toString().trim().toLowerCase();

    // [FIX] Safety check for JSON-encoded strings
    if (s.startsWith('{')) {
        try {
            const parsed = JSON.parse(s);
            s = (parsed.status || 'unknown').toLowerCase().trim();
        } catch (e) {
            console.error("Failed to parse corrupted status JSON:", s);
        }
    }

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
        default: return { color: 'bg-slate-300', text: 'text-slate-500', bg: 'bg-slate-50', border: 'border-slate-200', label: s.toUpperCase() || 'Unknown' };
    }
};



const TechnicianSearchModal = ({ isOpen, onClose, userLocation, serviceType, onBook }) => {
    const [searching, setSearching] = useState(true);
    const [technicians, setTechnicians] = useState([]);
    const [error, setError] = useState(null);
    const [map, setMap] = useState(null);
    const [accuracy, setAccuracy] = useState(null);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const onLoad = useCallback(function callback(map) { setMap(map); }, []);
    const onUnmount = useCallback(function callback(map) { setMap(null); }, []);

    const socket = useSocket();

    const performSearch = useCallback(async (loc = userLocation) => {
        if (!loc || !serviceType) return;
        setSearching(true);
        setError(null);
        try {
            const res = await searchTechnicians({
                latitude: loc.latitude,
                longitude: loc.longitude,
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

    const handlePrecisionRefresh = () => {
        if (!navigator.geolocation) return;
        setIsRefreshing(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                setAccuracy(accuracy);
                setIsRefreshing(false);

                // Update map view
                if (map) {
                    map.panTo({ lat: latitude, lng: longitude });
                    if (accuracy < 100) map.setZoom(15);
                }

                // Call search with new precise location
                performSearch({ latitude, longitude });
            },
            (err) => {
                console.error("Precision GPS failed", err);
                setIsRefreshing(false);
                alert("Could not get precise GPS lock. Using last known location.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    useEffect(() => {
        if (isOpen) {
            performSearch();
        }
    }, [isOpen, performSearch]);

    // Real-time Updates (Status & Location)
    // Real-time Updates (Status & Location)
    useEffect(() => {
        if (!socket || !isOpen) return;

        const handleStatusUpdate = ({ technicianId, status }) => {
            setTechnicians(prev => prev.map(t =>
                t.id === technicianId ? { ...t, status } : t
            ));
        };

        const handleLocationUpdate = ({ technicianId, location }) => {
            setTechnicians(prev => prev.map(t =>
                t.id === technicianId ? {
                    ...t,
                    location: { ...t.location, ...location },
                    latitude: location.latitude,
                    longitude: location.longitude
                } : t
            ));
        };

        socket.on('technician_status_update', handleStatusUpdate);
        socket.on('technician_location_update', handleLocationUpdate);

        return () => {
            socket.off('technician_status_update', handleStatusUpdate);
            socket.off('technician_location_update', handleLocationUpdate);
        };
    }, [socket, isOpen]);

    // Supabase Realtime Subscription for technician updates
    useSupabaseRealtime('technicians', (payload) => {
        if (!isOpen) return;

        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'UPDATE' && newRecord) {
            // Update technician in list
            setTechnicians(prev => prev.map(t => {
                if (t.id === newRecord.id) {
                    return {
                        ...t,
                        status: newRecord.status,
                        location: {
                            latitude: newRecord.current_latitude,
                            longitude: newRecord.current_longitude
                        },
                        rating: newRecord.rating || t.rating
                    };
                }
                return t;
            }));
        }
    });

    // Real-time Updates

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/80 backdrop-blur-md p-4 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 30 }}
                    transition={{ type: "spring", damping: 25, stiffness: 300 }}
                    className="bg-white rounded-2xl md:rounded-3xl shadow-2xl w-full max-w-[95vw] h-[90vh] overflow-hidden flex flex-col md:flex-row relative ring-1 ring-slate-200/50"
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:top-6 md:right-6 z-[60] p-2.5 md:p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-xl hover:bg-white text-slate-400 hover:text-rose-500 hover:rotate-90 transition-all duration-300 ring-1 ring-slate-100"
                    >
                        <X size={20} className="md:w-6 md:h-6" />
                    </button>

                    {/* Precision GPS Refresh Button */}
                    <button
                        onClick={handlePrecisionRefresh}
                        className={`absolute top-4 right-16 md:top-6 md:right-20 z-[60] p-2.5 md:p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-xl text-blue-600 hover:bg-blue-50 transition-all duration-300 ring-1 ring-slate-100 flex items-center gap-2 ${isRefreshing ? 'animate-pulse' : ''}`}
                        title="Precision GPS Refresh"
                    >
                        <Navigation size={20} className={isRefreshing ? 'animate-spin' : ''} />
                        <span className="hidden md:block text-xs font-bold uppercase tracking-widest">Precision Lock</span>
                    </button>

                    {/* --- LEFT: MAP SECTION --- */}
                    <div className="w-full md:w-1/2 h-[40%] md:h-full relative bg-slate-100 shrink-0">
                        {loadError ? (
                            <div className="flex items-center justify-center h-full bg-red-50 text-red-600 font-medium text-center p-6">
                                <div>
                                    <AlertCircle size={48} className="mx-auto mb-2" />
                                    <p>Map failed to load.</p>
                                    <p className="text-xs mt-1 text-red-400">Please check API Key configuration.</p>
                                </div>
                            </div>
                        ) : isLoaded && userLocation ? (
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

                                {/* Accuracy Circle */}
                                {accuracy && (
                                    <Circle
                                        center={{ lat: parseFloat(userLocation.latitude), lng: parseFloat(userLocation.longitude) }}
                                        radius={accuracy}
                                        options={{
                                            fillColor: '#3B82F6',
                                            fillOpacity: 0.1,
                                            strokeColor: '#3B82F6',
                                            strokeOpacity: 0.2,
                                            strokeWeight: 1,
                                            clickable: false,
                                            editable: false,
                                            draggable: false,
                                            zIndex: 1
                                        }}
                                    />
                                )}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full animate-ping pointer-events-none" />

                                {/* Tech Markers using OverlayView for Custom UI */}
                                {!searching && Array.isArray(technicians) && technicians
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
                                                    className={`relative flex flex-col items-center group ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-80'} hover:z-[999] -translate-y-6 transition-all duration-300 ${tech.distance > 2.0 ? 'opacity-60' : ''}`}
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
                        <div className="flex-1 overflow-y-auto px-5 py-6 md:px-8 md:py-8 space-y-4 md:space-y-6 custom-scrollbar bg-gradient-to-b from-slate-50 to-white">
                            {searching ? (
                                // Skeletons
                                [1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm animate-pulse flex gap-4 md:gap-5 items-center">
                                        <div className="w-14 h-14 md:w-16 md:h-16 bg-slate-200 rounded-2xl" />
                                        <div className="flex-1 space-y-3">
                                            <div className="h-4 md:h-5 bg-slate-200 rounded w-2/3" />
                                            <div className="h-3 md:h-4 bg-slate-100 rounded w-1/3" />
                                        </div>
                                    </div>
                                ))
                            ) : (Array.isArray(technicians) ? technicians : []).length > 0 ? (
                                (Array.isArray(technicians) ? technicians : [])
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
                                                className={`group relative bg-white rounded-2xl md:rounded-3xl p-5 md:p-6 border shadow-sm hover:shadow-lg transition-all duration-300 ${tech.distance > 2.0 ? 'opacity-60 border-slate-200' : 'border-slate-200 hover:border-blue-300'
                                                    } ${isAvailable ? 'hover:shadow-blue-500/10 cursor-pointer hover:-translate-y-1' : 'cursor-not-allowed opacity-60 border-slate-100'}`}
                                            >
                                                <div className="flex gap-4 md:gap-5 items-center">
                                                    {/* List Avatar */}
                                                    <div className="relative flex-shrink-0">
                                                        <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden shadow-md border-2 border-white ${isAvailable ? 'ring-2 ring-blue-500/20' : 'ring-2 ring-slate-200'}`}>
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
                                                    <div className="flex-1 min-w-0 pl-1">
                                                        <div className="flex justify-between items-start gap-3 mb-2">
                                                            <h3 className="text-base md:text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1 flex-1">
                                                                {tech.name}
                                                            </h3>
                                                            <span className="text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap flex-shrink-0 ${
                                                                tech.distance <= 2.0 ? 'text-blue-600 bg-blue-50 ring-1 ring-blue-100' : 'text-amber-600 bg-amber-50 ring-1 ring-amber-100'
                                                            }">
                                                                {tech.distance.toFixed(1)} km {tech.distance > 2.0 ? '• Far' : ''}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center gap-3 mb-3">
                                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide ${statusConfig.bg} ${statusConfig.text} ring-1 ${statusConfig.ringColor || 'ring-current/20'}`}>
                                                                {statusConfig.label}
                                                            </div>
                                                            <span className="text-slate-200">•</span>
                                                            <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                                                                <Briefcase size={13} className="text-slate-400" /> {tech.experience ? `${tech.experience} Yrs` : "New"}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                                                                <CheckCircle2 size={14} /> Verified
                                                            </div>

                                                            {/* Mini Book Button */}
                                                            {isAvailable && (
                                                                <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-bold rounded-xl opacity-100 md:opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 md:translate-x-2 md:group-hover:translate-x-0 hover:from-blue-700 hover:to-blue-800 shadow-sm hover:shadow-md">
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
        </AnimatePresence>,
        document.body
    );
};

export default TechnicianSearchModal;
