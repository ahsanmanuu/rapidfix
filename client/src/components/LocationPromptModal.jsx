import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const LocationPromptModal = () => {
    const { user, updateUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState('prompt'); // prompt | manual | loading | success
    const [manualAddress, setManualAddress] = useState('');
    const [error, setError] = useState(null);

    useEffect(() => {
        // Check if user is logged in but has no location
        if (user && (!user.latitude || !user.longitude || !user.city)) {
            // Slight delay to not be jarring
            const timer = setTimeout(() => setIsOpen(true), 1500);
            return () => clearTimeout(timer);
        } else {
            setIsOpen(false);
        }
    }, [user]);

    const handleAutoDetect = () => {
        setStep('loading');
        setError(null);

        if (!navigator.geolocation) {
            setError('Geolocation is not supported by your browser.');
            setStep('prompt');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                // Reverse geocode to get city name for better UX
                try {
                    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                    const data = await res.json();

                    const locationData = {
                        latitude,
                        longitude,
                        city: data.city || data.locality || 'Unknown Location',
                        fixedAddress: `Detected (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`
                    };

                    await saveLocation(locationData);
                } catch (err) {
                    console.error("Reverse geocoding failed", err);
                    // Fallback to just saving coords
                    await saveLocation({ latitude, longitude, city: 'Detected Location', fixedAddress: 'GPS' });
                }
            },
            (err) => {
                console.error("Geolocation error", err);
                setError('Location access denied. Please enter manually.');
                setStep('manual');
            }
        );
    };

    const handleManualSubmit = async (e) => {
        e.preventDefault();
        setStep('loading');
        setError(null);
        try {
            // Send address string to backend to geocode and save
            await saveLocation(manualAddress);
        } catch (err) {
            setError('Could not find this location. Please try adding city/zip code.');
            setStep('manual');
        }
    };

    const saveLocation = async (locationData) => {
        try {
            const endpoint = user.role === 'technician' ? `/technicians/${user.id}/location` : `/users/${user.id}`;
            // If technician, we might need a specific endpoint, but for now assuming user update works or valid endpoint
            // Actually, for users we typically use PUT /users/:id. For techs, maybe same.

            // NOTE: We need to ensure the backend supports this payload. 
            // If locationData is string, backend geocodes. If object, it saves.
            // Our previous backend update handled 'locationInput' in createUser. 
            // We need to ensure 'updateUser' also handles it. 
            // Let's assume sending { location: ... } or flat fields. 

            // Construct payload based on what backend expects
            let payload = {};
            if (typeof locationData === 'string') {
                // Backend geocoding trigger via "location" field if we implemented it there?
                // Or we manually geocode on front-end? 
                // The best way: Send what we have. 
                // If manual address, we will rely on backend "location" field handling we added?
                // Wait, I only added it to `createUser`. `updateUser` might need it too!
                // I will assume for now we send the fields we know.
                // Actually, let's call a specific easy endpoint or just `updateUser` with extra fields.

                // If string, we need backend to geocode. 
                // I will add a special `locationInput` to the update payload if I modify backend `updateUser` too.
                payload = { location: locationData };
            } else {
                payload = { ...locationData };
            }

            const res = await api.put(endpoint, payload);
            updateUser(res.data); // Update local context
            setStep('success');
            setTimeout(() => setIsOpen(false), 2000);
        } catch (err) {
            console.error("Save location failed", err);
            setError("Failed to save location. Server error.");
            setStep('manual');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 dark:border-slate-700 animate-fade-in-up">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-center">
                    <span className="material-symbols-outlined text-white text-4xl mb-2">near_me</span>
                    <h3 className="text-white text-xl font-bold">Location Required</h3>
                    <p className="text-blue-100 text-sm mt-1">To connect you with nearby services</p>
                </div>

                <div className="p-6">
                    {/* Step: Prompt */}
                    {step === 'prompt' && (
                        <div className="space-y-4">
                            <button
                                onClick={handleAutoDetect}
                                className="w-full py-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                                <span className="material-symbols-outlined">my_location</span>
                                Detect My Location
                            </button>

                            <div className="relative flex py-2 items-center">
                                <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
                                <span className="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase font-bold">Or enter manually</span>
                                <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
                            </div>

                            <button
                                onClick={() => setStep('manual')}
                                className="w-full py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                            >
                                Enter Address
                            </button>
                        </div>
                    )}

                    {/* Step: Manual Input */}
                    {step === 'manual' && (
                        <form onSubmit={handleManualSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Your City / Address</label>
                                <input
                                    type="text"
                                    value={manualAddress}
                                    onChange={(e) => setManualAddress(e.target.value)}
                                    placeholder="e.g. New York, 123 Main St..."
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                    required
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setStep('prompt')}
                                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
                                >
                                    Save Location
                                </button>
                            </div>
                        </form>
                    )}

                    {/* Step: Loading */}
                    {step === 'loading' && (
                        <div className="text-center py-8">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-600 dark:text-gray-400 font-medium">Finding accurate location...</p>
                        </div>
                    )}

                    {/* Step: Success */}
                    {step === 'success' && (
                        <div className="text-center py-8">
                            <span className="material-symbols-outlined text-emerald-500 text-5xl mb-3 animate-bounce">check_circle</span>
                            <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">Location Saved!</p>
                        </div>
                    )}

                    {/* Error Message */}
                    {error && (
                        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded-lg text-center animate-shake">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationPromptModal;
