
import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Check, Loader2 } from 'lucide-react';
import api from '../../services/api';

const mapContainerStyle = {
    width: '100%',
    height: '100%',
    borderRadius: '1rem',
};

const defaultCenter = {
    lat: 26.1542, // Darbhanga default
    lng: 85.8918
};

const mapOptions = {
    disableDefaultUI: true,
    zoomControl: true,
};

const AdminCreationModal = ({ isOpen, onClose, onCreated }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        address: '',
    });
    const [location, setLocation] = useState(null); // { lat, lng }
    const [map, setMap] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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

    const handleMapClick = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setLocation({ lat, lng });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location) {
            setError('Please pinpoint the office location on the map.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const payload = {
                ...formData,
                location: {
                    latitude: location.lat,
                    longitude: location.lng,
                    address: formData.address // Ideally reverse geocode this or let user type
                }
            };

            const res = await api.post('/superadmin/create-admin', payload);
            if (res.data.success) {
                onCreated(res.data.admin);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to create admin.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                >
                    {/* Left: Form Section */}
                    <div className="w-full md:w-1/3 p-8 flex flex-col border-r border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">New Admin</h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                                <X size={20} className="text-slate-500" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 overflow-y-auto pr-2">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                                <input
                                    type="text"
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g. Rahul Kumar"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="admin@fixofy.com"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
                                <input
                                    type="password"
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    required
                                    placeholder="Secure Password"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Office Address (Text)</label>
                                <textarea
                                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 outline-none transition resize-none h-20"
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    required
                                    placeholder="Full street address..."
                                />
                            </div>

                            <div className="pt-4 mt-auto">
                                {error && <p className="text-red-500 text-sm mb-3 font-medium">{error}</p>}
                                <button
                                    type="submit"
                                    disabled={loading || !location}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg shadow-blue-600/30 transition-all flex justify-center items-center gap-2"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                    Create Admin
                                </button>
                                {!location && <p className="text-xs text-center text-amber-500 mt-2 font-medium">Please select location on map</p>}
                            </div>
                        </form>
                    </div>

                    {/* Right: Map Section */}
                    <div className="w-full md:w-2/3 bg-slate-100 relative min-h-[400px]">
                        {isLoaded ? (
                            <GoogleMap
                                mapContainerStyle={mapContainerStyle}
                                center={defaultCenter}
                                zoom={12}
                                options={mapOptions}
                                onLoad={onLoad}
                                onUnmount={onUnmount}
                                onClick={handleMapClick}
                            >
                                {location && (
                                    <Marker
                                        position={location}
                                        animation={window.google.maps.Animation.DROP}
                                    />
                                )}
                            </GoogleMap>
                        ) : (
                            <div className="flex items-center justify-center h-full text-slate-400">Loading Map...</div>
                        )}

                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-4 py-2 rounded-xl shadow-lg border border-white/50">
                            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                                <MapPin size={16} className="text-blue-500" />
                                {location ? 'Location Selected' : 'Click map to set fixed location'}
                            </h3>
                            {location && (
                                <p className="text-xs text-slate-500 mt-1">
                                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default AdminCreationModal;
