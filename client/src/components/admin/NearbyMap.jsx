
import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle, OverlayView } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin } from 'lucide-react';
import api from '../../services/api';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '1.5rem',
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
    // mapId: "38936d595166255d" // Optional: Use a dark mode map ID if available
};

const NearbyMap = ({ user }) => {
    const [entities, setEntities] = useState({ users: [], technicians: [] });
    // Initialize center with Fixed Location OR safe default. Avoid 'live' location initially if possible.
    const [mapCenter, setMapCenter] = useState({
        lat: parseFloat(user.fixed_latitude || user.location?.latitude || user.latitude || 26.1542),
        lng: parseFloat(user.fixed_longitude || user.location?.longitude || user.longitude || 85.8918)
    });
    const [loading, setLoading] = useState(true);
    const [map, setMap] = useState(null);

    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
    });

    const onLoad = useCallback((map) => {
        setMap(map);
    }, []);

    const onUnmount = useCallback(() => {
        setMap(null);
    }, []);

    const fetchNearby = async (manual = false) => {
        // Show specialized loading state for manual refresh
        if (manual) setLoading(true);
        // Only show full map loading if we have NO data yet (initial load)
        else if (!entities.users.length) setLoading(true);

        try {
            // Send known location as hint, but backend enforces truth
            const lat = user.fixed_latitude || user.location?.latitude || user.latitude;
            const lng = user.fixed_longitude || user.location?.longitude || user.longitude;

            if (!lat || !lng) {
                console.warn("No location for admin");
                setLoading(false);
                return;
            }

            const res = await api.post('/admin/nearby-entities', { latitude: lat, longitude: lng });
            if (res.data.success) {
                setEntities({
                    users: res.data.users || [],
                    technicians: res.data.technicians || []
                });

                // [FIX] Enforce Server-Side Center
                if (res.data.enforcedCenter && res.data.enforcedCenter.lat && res.data.enforcedCenter.lng) {
                    setMapCenter({
                        lat: parseFloat(res.data.enforcedCenter.lat),
                        lng: parseFloat(res.data.enforcedCenter.lng)
                    });
                }
            }
        } catch (err) {
            console.error("Failed to fetch nearby", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNearby();

        // [NEW] Auto-Refresh every 30 seconds for Realtime Updates
        const interval = setInterval(() => fetchNearby(false), 30000);
        return () => clearInterval(interval);
    }, [user]);

    if (!isLoaded) return <div className="h-full flex items-center justify-center text-slate-400 font-medium animate-pulse">Initializing Geospatial Engine...</div>;

    return (
        <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={11} // Shows roughly 30km radius
                options={mapOptions}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {/* Admin Office Marker (Fixed) */}
                <Marker
                    position={mapCenter}
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 12,
                        fillColor: "#EF4444",
                        fillOpacity: 1,
                        strokeColor: "#FFFFFF",
                        strokeWeight: 4,
                    }}
                />

                {/* 30KM Radius Circle */}
                <Circle
                    center={mapCenter}
                    radius={30000} // 30 KM
                    options={{
                        fillColor: '#3B82F6',
                        fillOpacity: 0.04,
                        strokeColor: '#3B82F6',
                        strokeOpacity: 0.4,
                        strokeWeight: 1.5,
                        clickable: false
                    }}
                />

                {/* Users Markers */}
                {entities.users.map(u => {
                    const lat = parseFloat(u.location?.latitude || u.latitude);
                    const lng = parseFloat(u.location?.longitude || u.longitude);
                    if (!lat || !lng) return null;
                    return (
                        <OverlayView
                            key={`user-${u.id}`}
                            position={{ lat, lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div className="relative group cursor-pointer transform hover:scale-125 transition-all duration-300">
                                <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-lg overflow-hidden ring-2 ring-purple-500 bg-white">
                                    <img
                                        src={u.photo || u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`}
                                        className="w-full h-full object-cover"
                                        alt={u.name}
                                        onError={e => e.target.src = `https://ui-avatars.com/api/?name=${u.name}`}
                                    />
                                </div>
                            </div>
                        </OverlayView>
                    );
                })}

                {/* Technicians Markers */}
                {entities.technicians.map(t => {
                    const lat = parseFloat(t.location?.latitude || t.latitude);
                    const lng = parseFloat(t.location?.longitude || t.longitude);
                    if (!lat || !lng) return null;
                    return (
                        <OverlayView
                            key={`tech-${t.id}`}
                            position={{ lat, lng }}
                            mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                        >
                            <div className="relative group cursor-pointer transform hover:scale-125 transition-all duration-300">
                                <div className={`w-9 h-9 rounded-full border-2 border-white dark:border-slate-800 shadow-lg overflow-hidden ${t.status === 'Available' ? 'ring-2 ring-emerald-500' : 'ring-2 ring-slate-400'} bg-white`}>
                                    <img
                                        src={t.photo || t.avatar || t.documents?.photo || `https://ui-avatars.com/api/?name=${t.name}&background=random`}
                                        className="w-full h-full object-cover"
                                        alt={t.name}
                                        onError={e => e.target.src = `https://ui-avatars.com/api/?name=${t.name}`}
                                    />
                                </div>
                            </div>
                        </OverlayView>
                    );
                })}
            </GoogleMap>

            {/* Premium Glass Control Panel */}
            <div className="absolute top-4 left-4 z-10 w-64 bg-white/80 dark:bg-black/60 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 ring-1 ring-black/5">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <MapPin className="text-red-500 drop-shadow-sm" size={16} fill="currentColor" />
                            Territory Monitor
                        </h3>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wide uppercase mt-1">
                            Radius: 30 KM
                        </p>
                    </div>
                    <div className="relative flex h-2 w-2 mt-1.5 mr-1">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-white/5 shadow-sm">
                        <span className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-1">
                            {entities.users.length}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Users
                        </span>
                    </div>
                    <div className="bg-white/50 dark:bg-white/5 rounded-xl p-3 flex flex-col items-center justify-center border border-slate-100 dark:border-white/5 shadow-sm">
                        <span className="text-2xl font-black text-slate-800 dark:text-white leading-none mb-1">
                            {entities.technicians.length}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Techs
                        </span>
                    </div>
                </div>

                <button
                    onClick={() => fetchNearby(true)}
                    disabled={loading}
                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <Navigation
                        size={14}
                        className={`transition-transform duration-700 ${loading ? 'animate-spin' : 'group-hover:rotate-45'}`}
                    />
                    {loading ? 'Scanning...' : 'Refresh Scan'}
                </button>
            </div>
        </div>
    );
};

export default NearbyMap;
