
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
    mapId: "38936d595166255d" // Optional: Use a dark mode map ID if available
};

const NearbyMap = ({ user }) => {
    const [entities, setEntities] = useState({ users: [], technicians: [] });
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

    const fetchNearby = async () => {
        setLoading(true);
        try {
            // Use fixed location if available, else current location (fallback)
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
            }
        } catch (err) {
            console.error("Failed to fetch nearby", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNearby();
    }, [user]);

    // Helper to get coords
    const adminLat = parseFloat(user.fixed_latitude || user.location?.latitude || user.latitude || 26.1542);
    const adminLng = parseFloat(user.fixed_longitude || user.location?.longitude || user.longitude || 85.8918);

    if (!isLoaded) return <div className="h-full flex items-center justify-center text-slate-400">Loading Map Engine...</div>;

    return (
        <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800">
            <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={{ lat: adminLat, lng: adminLng }}
                zoom={11} // Shows roughly 30km radius
                options={mapOptions}
                onLoad={onLoad}
                onUnmount={onUnmount}
            >
                {/* Admin Office Marker (Fixed) */}
                <Marker
                    position={{ lat: adminLat, lng: adminLng }}
                    icon={{
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#EF4444",
                        fillOpacity: 1,
                        strokeColor: "#FFFFFF",
                        strokeWeight: 3,
                    }}
                />

                {/* 30KM Radius Circle */}
                <Circle
                    center={{ lat: adminLat, lng: adminLng }}
                    radius={30000} // 30 KM
                    options={{
                        fillColor: '#3B82F6',
                        fillOpacity: 0.05,
                        strokeColor: '#3B82F6',
                        strokeOpacity: 0.3,
                        strokeWeight: 1,
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
                            <div className="relative group cursor-pointer transform hover:scale-110 transition-transform">
                                <div className="w-8 h-8 rounded-full border-2 border-white shadow-md overflow-hidden ring-2 ring-purple-500">
                                    <img
                                        src={u.photo || u.avatar || `https://ui-avatars.com/api/?name=${u.name}`}
                                        className="w-full h-full object-cover"
                                        onError={e => e.target.src = `https://ui-avatars.com/api/?name=${u.name}`}
                                    />
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                    User: {u.name}
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
                            <div className="relative group cursor-pointer transform hover:scale-110 transition-transform">
                                <div className={`w-8 h-8 rounded-full border-2 border-white shadow-md overflow-hidden ${t.status === 'Available' ? 'ring-2 ring-emerald-500' : 'ring-2 ring-slate-400'}`}>
                                    <img
                                        src={t.photo || t.avatar || t.documents?.photo || t.documents?.profile_photo || `https://ui-avatars.com/api/?name=${t.name}`}
                                        className="w-full h-full object-cover"
                                        onError={e => e.target.src = `https://ui-avatars.com/api/?name=${t.name}`}
                                    />
                                </div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                                    {t.name} ({t.serviceType})
                                </div>
                            </div>
                        </OverlayView>
                    );
                })}
            </GoogleMap>

            {/* Overlay Controls */}
            <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 rounded-2xl shadow-lg border border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <MapPin className="text-red-500" size={18} />
                    Admin Territory
                </h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">Monitoring 30km Radius</p>

                <div className="flex flex-col gap-2 text-xs font-medium">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-purple-500"></span>
                        <span className="text-slate-600 dark:text-slate-300">Users ({entities.users.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                        <span className="text-slate-600 dark:text-slate-300">Technicians ({entities.technicians.length})</span>
                    </div>
                </div>

                <button
                    onClick={fetchNearby}
                    className="mt-4 w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
                >
                    <Navigation size={14} className={loading ? 'animate-spin' : ''} />
                    Refresh Scan
                </button>
            </div>
        </div>
    );
};

export default NearbyMap;
