import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { searchTechnicians } from '../services/api';
import { X, Navigation, AlertCircle, Star, CheckCircle2, Briefcase, MapPin } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import useSupabaseRealtime from '../hooks/useSupabaseRealtime';

const mapContainerStyle = { width: '100%', height: '100%' };

// --- Helper to handle map centering without re-mounting ---
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center[0] !== 0) {
            map.setView(center, map.getZoom());
        }
    }, [center, map]);
    return null;
};

// --- Container that ensures Leaflet won't collide ---
const MapWrapper = ({ children, mapReady, instanceKey }) => {
    const [shouldRender, setShouldRender] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        if (mapReady) {
            // Surgical DOM cleanup just in case
            if (containerRef.current) {
                const node = containerRef.current;
                if (node._leaflet_id) delete node._leaflet_id;
                // Clear children just to be safe
                while (node.firstChild) node.removeChild(node.firstChild);
            }

            // Short delay to ensure browser paints and cleans up old instances
            const timer = setTimeout(() => setShouldRender(true), 50);
            return () => clearTimeout(timer);
        } else {
            setShouldRender(false);
        }
    }, [mapReady, instanceKey]);

    if (!shouldRender) return (
        <div ref={containerRef} className="flex items-center justify-center h-full text-gray-400 bg-gray-50">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Initializing Map...</p>
            </div>
        </div>
    );

    return (
        <div
            key={`wrapper-${instanceKey}`}
            className="w-full h-full"
            ref={containerRef}
        >
            {children}
        </div>
    );
};

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

// --- Leaflet Icon Helper ---
const createIcon = (url, ringClass = '') => {
    // Extract base color from ring class (e.g. 'ring-emerald-500' -> 'emerald')
    // Fallback logic for simplicity
    let color = 'blue';
    if (ringClass.includes('emerald')) color = 'emerald';
    if (ringClass.includes('rose')) color = 'rose';
    if (ringClass.includes('amber')) color = 'amber';
    if (ringClass.includes('slate')) color = 'slate';

    return new L.DivIcon({
        className: 'custom-leaflet-icon',
        html: `
            <div class="relative group transform hover:scale-110 transition-all duration-300">
                <div class="w-10 h-10 rounded-full border-2 border-white shadow-lg overflow-hidden ring-2 ring-${color}-500 bg-white">
                    <img src="${url}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=User'" />
                </div>
            </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
        popupAnchor: [0, -20]
    });
};


const TechnicianSearchModal = ({ isOpen, onClose, userLocation, serviceType, onBook }) => {
    const [searching, setSearching] = useState(true);
    const [technicians, setTechnicians] = useState([]);
    const [error, setError] = useState(null);
    const [mapReady, setMapReady] = useState(false);
    const [loadingId, setLoadingId] = useState(null); // Track which tech is being booked
    const [mapId, setMapId] = useState(`map-${Math.random().toString(36).substr(2, 9)}`);

    useEffect(() => {
        if (!isOpen) {
            setMapReady(false);
        } else {
            // Generate a fresh ID every time the modal opens
            setMapId(`map-${Math.random().toString(36).substr(2, 9)}`);
        }
    }, [isOpen]);

    const socket = useSocket();

    const handleBookClick = async (tech) => {
        if (loadingId) return; // Prevent multiple clicks
        setLoadingId(tech.id);
        try {
            await onBook(tech);
        } catch (err) {
            console.error("Booking error", err);
        } finally {
            setLoadingId(null);
        }
    };

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

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div key="tech-search-modal-overlay" className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-2 sm:p-4 font-sans">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        onAnimationComplete={(definition) => {
                            if (isOpen) setMapReady(true);
                        }}
                        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] sm:h-[85vh] overflow-hidden flex flex-col md:flex-row relative"
                    >
                        {/* Close Button */}
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-[9999] p-2 rounded-full bg-white shadow-xl text-gray-500 hover:text-red-500 hover:bg-gray-50 transition-all border border-gray-100"
                            title="Close"
                        >
                            <X size={20} />
                        </button>

                        {/* MAP SECTION */}
                        <div className="w-full md:w-1/2 h-[35%] md:h-full relative bg-gray-100 shrink-0 z-0">
                            <MapWrapper mapReady={mapReady} instanceKey={mapId}>
                                <MapContainer
                                    id={mapId}
                                    center={[center.lat, center.lng]}
                                    zoom={18}
                                    style={mapContainerStyle}
                                    zoomControl={false}
                                >
                                    <RecenterMap center={[center.lat, center.lng]} />
                                    <TileLayer
                                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                        maxZoom={19}
                                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                    />

                                    {/* User Marker */}
                                    <Marker
                                        position={[center.lat, center.lng]}
                                        icon={new L.DivIcon({
                                            className: 'custom-leaflet-icon',
                                            html: `<div class="w-4 h-4 rounded-full bg-blue-600 border-2 border-white shadow-md ring-2 ring-blue-200"></div>`,
                                            iconSize: [20, 20],
                                            iconAnchor: [10, 10]
                                        })}
                                    />

                                    {/* Technician Markers */}
                                    {!searching && sortedTechs.map((tech) => {
                                        const lat = parseFloat(tech.location?.latitude || tech.latitude);
                                        const lng = parseFloat(tech.location?.longitude || tech.longitude);
                                        if (!lat || !lng) return null;
                                        const statusConfig = getStatusConfig(tech.status);
                                        const isBookable = ['available', 'engaged', 'finishing_work', 'finishing work'].includes((tech.status || '').toLowerCase());

                                        return (
                                            <Marker
                                                key={tech.id}
                                                position={[lat, lng]}
                                                icon={createIcon(tech.documents?.photo || `https://ui-avatars.com/api/?name=${tech.name}`, statusConfig.color.replace('bg-', 'ring-'))}
                                                eventHandlers={{
                                                    click: () => isBookable && onBook(tech)
                                                }}
                                            >
                                                <Popup>
                                                    <div className="cursor-pointer" onClick={() => isBookable && onBook(tech)}>
                                                        <div className="font-bold text-sm">{tech.name}</div>
                                                        <div className="text-xs text-gray-500 mb-1">{(tech.distance || 0).toFixed(1)} km • {tech.rating || 'New'}★</div>
                                                        {isBookable && (
                                                            <div className="mt-1">
                                                                {loadingId === tech.id ? (
                                                                    <div className="flex items-center gap-1 text-gray-500 text-xs font-bold uppercase">
                                                                        <div className="w-2 h-2 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                                                                        Loading...
                                                                    </div>
                                                                ) : (
                                                                    <div
                                                                        className="text-blue-600 text-xs font-bold uppercase hover:underline"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleBookClick(tech);
                                                                        }}
                                                                    >
                                                                        Book Now
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </Popup>
                                            </Marker>
                                        );
                                    })}
                                </MapContainer>
                            </MapWrapper>

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
                                {sortedTechs.length > 0 && sortedTechs[0].isFar && (
                                    <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
                                        <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-bold text-blue-700">Extended Search</p>
                                            <p className="text-[10px] text-blue-600">
                                                No professionals found nearby. Showing the nearest available experts.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                <h2 className="text-lg font-bold text-gray-800">
                                    {searching ? 'Searching...' : `Nearby ${serviceType}s`}
                                </h2>
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-gray-500">
                                        {searching ? 'Scanning area...' : `${sortedTechs.length} found within 30km`}
                                    </p>
                                    {userLocation?.address && (
                                        <p className="text-[10px] text-gray-400 truncate max-w-full flex items-center gap-1">
                                            <MapPin size={10} />
                                            Near: {userLocation.address}
                                        </p>
                                    )}
                                </div>
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
                                                    <button
                                                        disabled={loadingId === tech.id}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleBookClick(tech);
                                                        }}
                                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all active:scale-95 shrink-0 flex items-center gap-1.5
                                                            ${loadingId === tech.id
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                                                : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                                                            }`}
                                                    >
                                                        {loadingId === tech.id ? (
                                                            <>
                                                                <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                                                                Booking...
                                                            </>
                                                        ) : (
                                                            'Book Now'
                                                        )}
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
            )}
        </AnimatePresence>,
        document.body
    );
};

export default TechnicianSearchModal;
