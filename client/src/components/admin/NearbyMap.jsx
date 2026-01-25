
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, MapPin } from 'lucide-react';
import api from '../../services/api';

// --- Custom Icons for Leaflet ---
const createIcon = (url, color = 'blue') => {
    return new L.DivIcon({
        className: 'custom-leaflet-icon',
        html: `
            <div class="relative group transform hover:scale-110 transition-all duration-300">
                <div class="w-8 h-8 rounded-full border-2 border-white dark:border-slate-800 shadow-lg overflow-hidden ring-2 ring-${color}-500 bg-white">
                    <img src="${url}" class="w-full h-full object-cover" onerror="this.src='https://ui-avatars.com/api/?name=User&background=random'" />
                </div>
            </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
    });
};

const adminIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const NearbyMap = ({ user }) => {
    const [entities, setEntities] = useState({ users: [], technicians: [] });
    // Initialize center
    const [mapCenter, setMapCenter] = useState({
        lat: parseFloat(user.fixed_latitude || user.location?.latitude || user.latitude || 26.1542),
        lng: parseFloat(user.fixed_longitude || user.location?.longitude || user.longitude || 85.8918)
    });
    const [loading, setLoading] = useState(true);

    const fetchNearby = async (manual = false) => {
        if (manual) setLoading(true);
        else if (!entities.users.length) setLoading(true);

        try {
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
        const interval = setInterval(() => fetchNearby(false), 30000);
        return () => clearInterval(interval);
    }, [user]);

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
    const MapWrapper = ({ children }) => {
        const [shouldRender, setShouldRender] = useState(false);
        const [instanceKey, setInstanceKey] = useState(0);

        useEffect(() => {
            // Force a new React key to guarantee a fresh DOM element
            setInstanceKey(prev => prev + 1);
            const timer = setTimeout(() => setShouldRender(true), 200);
            return () => {
                clearTimeout(timer);
                setShouldRender(false);
            };
        }, []);

        if (!shouldRender) return (
            <div className="flex items-center justify-center h-full text-slate-400 bg-slate-50/50">
                <div className="text-center">
                    <div className="w-8 h-8 border-3 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-2" />
                    <p className="text-xs font-bold uppercase tracking-wider">Syncing Territory Map...</p>
                </div>
            </div>
        );
        return <div key={`admin-map-instance-${instanceKey}`} className="w-full h-full">{children}</div>;
    };

    return (
        <div className="relative h-full w-full rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 z-0">
            <MapWrapper>
                <MapContainer
                    center={[mapCenter.lat, mapCenter.lng]}
                    zoom={11}
                    style={{ width: '100%', height: '100%' }}
                    zoomControl={false}
                >
                    <RecenterMap center={[mapCenter.lat, mapCenter.lng]} />
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        maxZoom={19}
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />

                    {/* Admin Marker */}
                    <Marker position={[mapCenter.lat, mapCenter.lng]} icon={adminIcon}>
                        <Popup>Admin HQ</Popup>
                    </Marker>

                    {/* Radius Circle */}
                    <Circle
                        center={[mapCenter.lat, mapCenter.lng]}
                        radius={30000}
                        pathOptions={{ color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1 }}
                    />

                    {/* Users */}
                    {entities.users.map(u => {
                        const lat = parseFloat(u.location?.latitude || u.latitude);
                        const lng = parseFloat(u.location?.longitude || u.longitude);
                        if (!lat || !lng) return null;
                        return (
                            <Marker
                                key={`user-${u.id}`}
                                position={[lat, lng]}
                                icon={createIcon(u.photo || u.avatar || `https://ui-avatars.com/api/?name=${u.name}`, 'purple')}
                            >
                                <Popup>
                                    <div className="font-bold text-sm">{u.name}</div>
                                    <div className="text-xs text-gray-500">User</div>
                                </Popup>
                            </Marker>
                        );
                    })}

                    {/* Technicians */}
                    {entities.technicians.map((tech) => (
                        <Marker
                            key={`tech-${tech.id}`}
                            position={[tech.location?.latitude || tech.latitude, tech.location?.longitude || tech.longitude]}
                            icon={createIcon(tech.documents?.photo || tech.photo || tech.avatar || `https://ui-avatars.com/api/?name=${tech.name}`, 'emerald')}
                        >
                            <Popup>
                                <div className="p-1">
                                    <h3 className="font-bold text-slate-900">{tech.name}</h3>
                                    <p className="text-xs text-slate-500">{tech.serviceType}</p>
                                    <div className={`text-[10px] mt-1 px-1.5 py-0.5 rounded-full inline-block ${tech.status === 'available' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{tech.status}</div>
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                </MapContainer>
            </MapWrapper>

            {/* Premium Glass Control Panel */}
            <div className="absolute top-4 left-4 z-[500] w-64 bg-white/80 dark:bg-black/60 backdrop-blur-xl p-5 rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 ring-1 ring-black/5">
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
