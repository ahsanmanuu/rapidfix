import React, { useEffect, useState, useRef } from 'react';
import { IconButton, Button, Typography, CircularProgress } from '@mui/material';
import { Close, Navigation, MyLocation, Circle } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const containerStyle = {
    width: '100%',
    height: '100%'
};

// --- Helper to handle map centering without re-mounting ---
const RecenterMap = ({ center }) => {
    const map = useMap();
    useEffect(() => {
        if (center && center.lat !== 0) {
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
        <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50/50">
            <div className="text-center">
                <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm font-medium">Starting Live Navigation...</p>
            </div>
        </div>
    );
    return <div key={`live-map-instance-${instanceKey}`} style={{ height: '100%', width: '100%' }}>{children}</div>;
};

const LiveRideModal = ({ job, technicianId, userId, onClose, socket, onEndRide }) => {
    const [currentPos, setCurrentPos] = useState(null);
    const [destination, setDestination] = useState(null);
    const [heading, setHeading] = useState(0);
    const [directions, setDirections] = useState(null);
    const [error, setError] = useState(null);
    const watchIdRef = useRef(null);

    useEffect(() => {
        if (job?.location) {
            setDestination({
                lat: parseFloat(job.location.latitude),
                lng: parseFloat(job.location.longitude)
            });
        }
    }, [job]);

    useEffect(() => {
        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, heading } = position.coords;
                    const newPos = { lat: latitude, lng: longitude };
                    setCurrentPos(newPos);
                    setHeading(heading || 0);

                    // Emit to Server
                    socket.emit('ride_location_update', {
                        rideId: job.activeRideId,
                        location: { latitude, longitude },
                        userId,
                        technicianId
                    });
                },
                (err) => {
                    console.error("Location Error", err);
                    setError("Unable to retrieve location. Please enable GPS.");
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [socket, job, technicianId, userId]);

    return (
        <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
            {/* Header */}
            <div className="bg-blue-600 text-white p-4 shadow-md flex justify-between items-center z-10">
                <div>
                    <Typography variant="h6" fontWeight="bold">Live Navigation</Typography>
                    <p className="text-blue-100 text-xs flex items-center gap-1">
                        <Navigation fontSize="inherit" className="animate-pulse" />
                        Heading to {job.contactName || "Customer"}
                    </p>
                </div>
                <IconButton onClick={onClose} color="inherit" size="small">
                    <Close />
                </IconButton>
            </div>

            {/* Map Area */}
            <div className="flex-1 relative bg-gray-200">
                {error && (
                    <div className="absolute top-4 left-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-20" role="alert">
                        <span className="block sm:inline">{error}</span>
                    </div>
                )}

                <MapWrapper>
                    <MapContainer
                        center={currentPos || destination || { lat: 0, lng: 0 }}
                        zoom={18}
                        style={containerStyle}
                        zoomControl={false}
                    >
                        <RecenterMap center={currentPos || destination || { lat: 0, lng: 0 }} />
                        <TileLayer
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            maxZoom={19}
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        />

                        {currentPos && (
                            <Marker
                                position={currentPos}
                                icon={new L.DivIcon({
                                    className: 'custom-leaflet-icon',
                                    html: `
                                        <div style="transform: rotate(${heading}deg); transition: transform 0.5s ease;">
                                            <svg width="40" height="40" viewBox="0 0 24 24" fill="#4285F4" stroke="white" stroke-width="2">
                                                <path d="M12 2L2 22L12 18L22 22L12 2Z" />
                                            </svg>
                                        </div>
                                    `,
                                    iconSize: [40, 40],
                                    iconAnchor: [20, 20]
                                })}
                            />
                        )}

                        {destination && (
                            <Marker
                                position={destination}
                                icon={new L.DivIcon({
                                    className: 'custom-leaflet-icon',
                                    html: '<div class="w-8 h-8 rounded-full bg-red-600 border-2 border-white shadow-lg flex items-center justify-center text-white font-bold">C</div>',
                                    iconSize: [32, 32],
                                    iconAnchor: [16, 32]
                                })}
                            />
                        )}

                        {currentPos && destination && (
                            <Polyline
                                positions={[currentPos, destination]}
                                pathOptions={{ color: '#4285F4', weight: 4, dashArray: '10, 10' }}
                            />
                        )}
                    </MapContainer>
                </MapWrapper>

                {/* Floating Info Card */}
                <div className="absolute bottom-6 left-4 right-4 bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-xs uppercase font-bold">Destination</p>
                        <p className="text-gray-800 font-semibold truncate max-w-[200px]">{job.description || "Customer Location"}</p>
                    </div>
                    <Button
                        variant="contained"
                        color="success"
                        size="large"
                        startIcon={<MyLocation />}
                        onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${destination?.lat},${destination?.lng}`, '_blank')}
                    >
                        Open Maps
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default LiveRideModal;
