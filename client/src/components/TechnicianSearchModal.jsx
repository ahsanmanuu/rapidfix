import { useState, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleMap, useJsApiLoader, Marker, OverlayView } from '@react-google-maps/api';
import { searchTechnicians } from '../services/api';
import { X, Navigation, AlertCircle, Star, CheckCircle2, Briefcase, MapPin } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import useSupabaseRealtime from '../hooks/useSupabaseRealtime';

const mapContainerStyle = { width: '100%', height: '100%' };
const mapOptions = { disableDefaultUI: true, zoomControl: false, gestureHandling: 'greedy' };

const getStatusConfig = (status) => {
    const s = (status || '').toString().trim().toLowerCase();
    switch (s) {
        case 'available': return { color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Available' };
        case 'engaged':
        case 'busy': return { color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50', label: 'Engaged' };
        case 'finishing_work':
        case 'finishing work': return { color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50', label: 'Finishing' };
        default: return { color: 'bg-slate-400', text: 'text-slate-600', bg: 'bg-slate-100', label: 'Offline' };
    }
};

const TechnicianSearchModal = ({ isOpen, onClose, userLocation, serviceType, onBook }) => {
    const [searching, setSearching] = useState(true);
    const [technicians, setTechnicians] = useState([]);
    const [error, setError] = useState(null);
    const [map, setMap] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const onLoad = useCallback((map) => setMap(map), []);
    const onUnmount = useCallback(() => setMap(null), []);
    const socket = useSocket();

    const center = useMemo(() => ({
        lat: parseFloat(userLocation?.latitude) || 0,
        lng: parseFloat(userLocation?.longitude) || 0
    }), [userLocation]);

    const performSearch = useCallback(async () => {
        if (!userLocation || !serviceType) return;
        setSearching(true);
        try {
            const res = await searchTechnicians({
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
                serviceType,
                radius: 30
            });
            if (res.data.success) setTechnicians(res.data.technicians || []);
        } catch (err) {
            setError("Search failed");
        } finally {
            setSearching(false);
        }
    }, [userLocation, serviceType]);

    useEffect(() => {
        if (isOpen) performSearch();
    }, [isOpen, performSearch]);

    useEffect(() => {
        if (map && userLocation?.latitude) {
            map.panTo(center);
            map.setZoom(14);
        }
    }, [map, userLocation, center]);

    // Socket listeners for real-time updates
    useEffect(() => {
        if (!socket || !isOpen) return;
        const handleStatusUpdate = ({ technicianId, status }) => {
            setTechnicians(prev => prev.map(t => t.id === technicianId ? { ...t, status } : t));
        };
        socket.on('technician_status_update', handleStatusUpdate);
        return () => socket.off('technician_status_update', handleStatusUpdate);
    }, [socket, isOpen]);

    // Supabase realtime
    useSupabaseRealtime('technicians', (payload) => {
        if (payload.eventType === 'UPDATE' && payload.new) {
            setTechnicians(prev => prev.map(t => t.id === payload.new.id ? { ...t, status: payload.new.status } : t));
        }
    });

    const sortedTechs = useMemo(() =>
        [...technicians].sort((a, b) => (a.distance || 0) - (b.distance || 0)),
        [technicians]
    );

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-2 sm:p-4 font-sans">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col md:flex-row"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 z-50 p-2 rounded-full bg-white shadow-lg text-gray-400 hover:text-red-500 hover:bg-gray-50"
                    >
                        <X size={18} />
                    </button>

                    {/* MAP SECTION */}
                    <div className="w-full md:w-1/2 h-[35%] md:h-full relative bg-gray-100 shrink-0">
                        {isLoaded && userLocation ? (
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={center}
                                zoom={14}
                                options={mapOptions}
                                onLoad={onLoad}
                                onUnmount={onUnmount}
                            >
                                {/* User Marker */}
                                <Marker
                                    position={center}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        scale: 10,
                                        fillColor: "#3B82F6",
                                        fillOpacity: 1,
                                        strokeColor: "#FFF",
                                        strokeWeight: 3,
                                    }}
                                />

                                {/* Technician Markers */}
                                {!searching && sortedTechs.map((tech) => {
                                    const lat = parseFloat(tech.location?.latitude || tech.latitude);
                                    const lng = parseFloat(tech.location?.longitude || tech.longitude);
                                    if (!lat || !lng) return null;
                                    const statusConfig = getStatusConfig(tech.status);

                                    return (
                                        <OverlayView
                                            key={tech.id}
                                            position={{ lat, lng }}
                                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                                            getPixelPositionOffset={() => ({ x: -20, y: -40 })}
                                        >
                                            <div
                                                className="cursor-pointer group"
                                                onClick={() => {
                                                    const s = (tech.status || '').toLowerCase();
                                                    if (['available', 'engaged', 'finishing_work', 'finishing work'].includes(s)) {
                                                        onBook(tech);
                                                    }
                                                }}
                                            >
                                                <div className={`w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden ring-2 ${statusConfig.color.replace('bg-', 'ring-')} group-hover:scale-110 transition-transform`}>
                                                    <img
                                                        src={tech.documents?.photo || `https://ui-avatars.com/api/?name=${tech.name}&size=40`}
                                                        alt=""
                                                        className="w-full h-full object-cover"
                                                        onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${tech.name}&size=40`}
                                                    />
                                                </div>
                                                <div className={`w-0 h-0 mx-auto border-l-4 border-r-4 border-t-6 border-l-transparent border-r-transparent ${statusConfig.color.replace('bg-', 'border-t-')}`} />
                                            </div>
                                        </OverlayView>
                                    );
                                })}
                            </GoogleMap>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <div className="text-center">
                                    <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                                    <p className="text-sm">Loading Map...</p>
                                </div>
                            </div>
                        )}

                        {/* Search Overlay */}
                        {searching && (
                            <div className="absolute inset-0 bg-white/70 backdrop-blur flex items-center justify-center">
                                <div className="text-center">
                                    <Navigation size={32} className="text-blue-600 animate-pulse mx-auto mb-2" />
                                    <p className="text-sm font-medium text-gray-600">Finding {serviceType}s...</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* LIST SECTION */}
                    <div className="w-full md:w-1/2 h-[65%] md:h-full flex flex-col bg-white">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
                            <h2 className="text-lg font-bold text-gray-800">
                                {searching ? 'Searching...' : `Nearby ${serviceType}s`}
                            </h2>
                            <p className="text-xs text-gray-500">
                                {searching ? 'Scanning area...' : `${sortedTechs.length} found within 30km`}
                            </p>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-gray-50">
                            {searching ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="bg-white p-3 rounded-lg border border-gray-100 animate-pulse flex gap-3 items-center">
                                        <div className="w-12 h-12 bg-gray-200 rounded-lg shrink-0" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-200 rounded w-2/3" />
                                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                ))
                            ) : sortedTechs.length > 0 ? (
                                sortedTechs.map((tech, idx) => {
                                    const statusConfig = getStatusConfig(tech.status);
                                    const photoUrl = tech.documents?.photo || `https://ui-avatars.com/api/?name=${tech.name}&background=random&size=48`;
                                    const isBookable = ['available', 'engaged', 'finishing_work', 'finishing work'].includes((tech.status || '').toLowerCase());

                                    return (
                                        <motion.div
                                            key={tech.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.03 }}
                                            onClick={() => isBookable && onBook(tech)}
                                            className={`bg-white p-3 rounded-lg border border-gray-100 flex gap-3 items-center transition-all ${isBookable ? 'cursor-pointer hover:border-blue-200 hover:shadow-sm' : 'opacity-50'}`}
                                        >
                                            {/* Avatar */}
                                            <div className="relative shrink-0">
                                                <img
                                                    src={photoUrl}
                                                    alt=""
                                                    className="w-12 h-12 rounded-lg object-cover border border-gray-200"
                                                    onError={(e) => e.target.src = `https://ui-avatars.com/api/?name=${tech.name}`}
                                                />
                                                <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${statusConfig.color}`} />
                                            </div>

                                            {/* Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="font-semibold text-sm text-gray-800 truncate">{tech.name}</h3>
                                                    <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded shrink-0">
                                                        {(tech.distance || 0).toFixed(1)} km
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Star size={10} className="text-amber-400 fill-amber-400" />
                                                        {tech.rating || 'New'}
                                                    </span>
                                                    <span className="flex items-center gap-0.5">
                                                        <Briefcase size={10} />
                                                        {tech.experience || 0}y
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Book Button */}
                                            {isBookable && (
                                                <button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 shrink-0">
                                                    Book
                                                </button>
                                            )}
                                        </motion.div>
                                    );
                                })
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                                    <AlertCircle size={40} className="text-gray-300 mb-3" />
                                    <h4 className="font-semibold text-gray-700">No {serviceType}s Found</h4>
                                    <p className="text-xs text-gray-500 mt-1">No professionals available within 30km.</p>
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
