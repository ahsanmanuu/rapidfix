import React, { useEffect, useState, useRef } from 'react';
import { IconButton, Button, Typography, CircularProgress } from '@mui/material';
import { Close, Navigation, MyLocation, Circle } from '@mui/icons-material';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';

const containerStyle = {
    width: '100%',
    height: '100%'
};

const LiveRideModal = ({ job, technicianId, userId, onClose, socket, onEndRide }) => {
    const [currentPos, setCurrentPos] = useState(null);
    const [destination, setDestination] = useState(null);
    const [heading, setHeading] = useState(0);
    const [directions, setDirections] = useState(null);
    const [error, setError] = useState(null);
    const watchIdRef = useRef(null);

    // Mock Google Maps API Key for dev if missing
    // Ideally this comes from env
    const { isLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: "AIzaSyBN-6NUc8fWY4FsOLvOXj7gvX4pWYVDRUU" // Using key found in project
    });

    useEffect(() => {
        if (job?.location) {
            setDestination({
                lat: parseFloat(job.location.latitude),
                lng: parseFloat(job.location.longitude)
            });
        }
    }, [job]);

    useEffect(() => {
        // Start Watching Position
        if (navigator.geolocation) {
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude, heading } = position.coords;
                    const newPos = { lat: latitude, lng: longitude };

                    setCurrentPos(newPos);
                    setHeading(heading || 0);

                    // Emit to Server
                    // Using existing rideId passed via props or we need to fetch it?
                    // Assuming for now simple technician-based room broadcast or explicit ride update
                    // Ideally we pass rideId
                    socket.emit('ride_location_update', {
                        rideId: job.activeRideId,
                        location: { latitude, longitude }, // Use standard latitude/longitude for backend consistency
                        userId,
                        technicianId
                    });
                },
                (err) => {
                    console.error("Location Error", err);
                    setError("Unable to retrieve location. Please enable GPS.");
                },
                {
                    enableHighAccuracy: true,
                    timeout: 20000,
                    maximumAge: 1000
                }
            );
        } else {
            setError("Geolocation is not supported by this browser.");
        }

        return () => {
            if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
        };
    }, [socket, job, technicianId, userId]);

    // Calculate Directions (Mock-ish or Real if API Key valid)
    useEffect(() => {
        if (isLoaded && currentPos && destination && window.google) {
            const directionsService = new window.google.maps.DirectionsService();
            directionsService.route(
                {
                    origin: currentPos,
                    destination: destination,
                    travelMode: window.google.maps.TravelMode.DRIVING,
                },
                (result, status) => {
                    if (status === window.google.maps.DirectionsStatus.OK) {
                        setDirections(result);
                    } else {
                        console.error(`error fetching directions ${result}`);
                    }
                }
            );
        }
    }, [isLoaded, currentPos, destination]);


    if (!isLoaded) return <div className="h-full flex items-center justify-center bg-gray-100"><CircularProgress /></div>;

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

                <GoogleMap
                    mapContainerStyle={containerStyle}
                    center={currentPos || destination || { lat: 0, lng: 0 }}
                    zoom={15}
                    options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                    }}
                >
                    {currentPos && (
                        <Marker
                            position={currentPos}
                            icon={{
                                path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                                scale: 5,
                                rotation: heading,
                                fillColor: "#4285F4",
                                fillOpacity: 1,
                                strokeWeight: 2,
                                strokeColor: "white",
                            }}
                        />
                    )}

                    {destination && <Marker position={destination} label="C" />}

                    {directions && (
                        <DirectionsRenderer
                            directions={directions}
                            options={{
                                polylineOptions: {
                                    strokeColor: "#4285F4",
                                    strokeWeight: 5,
                                },
                                suppressMarkers: true // We use custom markers
                            }}
                        />
                    )}
                </GoogleMap>

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
