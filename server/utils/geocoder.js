const axios = require('axios');

// [FIX] Precision Geocoding using Google Maps API
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;

/**
 * Geocode an address string to coordinates using Google Maps Geocoding API.
 * @param {string} address - The address or city name to geocode.
 * @returns {Promise<{lat: number, lng: number, displayName: string}|null>} - Coordinates or null if failed.
 */
async function geocodeAddress(address) {
    if (!address) return null;
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("[Geocoder] GOOGLE_MAPS_API_KEY is missing from environment.");
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            const result = response.data.results[0];
            return {
                lat: result.geometry.location.lat,
                lng: result.geometry.location.lng,
                displayName: result.formatted_address
            };
        }
        return null;
    } catch (error) {
        console.error("[Geocoder] Geocoding failed:", error.message);
        return null;
    }
}

/**
 * Reverse geocode coordinates to an address string using Google Maps API.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string|null>} - Formatted address or null.
 */
async function reverseGeocode(lat, lng) {
    if (!lat || !lng) return null;
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("[Geocoder] GOOGLE_MAPS_API_KEY is missing from environment.");
        return null;
    }

    try {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`;
        const response = await axios.get(url);

        if (response.data.status === 'OK' && response.data.results.length > 0) {
            return response.data.results[0].formatted_address;
        }
        return null;
    } catch (error) {
        console.error("[Geocoder] Reverse geocoding failed:", error.message);
        return null;
    }
}

module.exports = { geocodeAddress, reverseGeocode };
