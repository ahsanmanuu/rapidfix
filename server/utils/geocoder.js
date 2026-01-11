const axios = require('axios');

/**
 * Geocode an address string to coordinates using OpenStreetMap (Nominatim).
 * @param {string} address - The address or city name to geocode.
 * @returns {Promise<{lat: number, lng: number}|null>} - Coordinates or null if failed.
 */
async function geocodeAddress(address) {
    if (!address) return null;

    try {
        // Using Nominatim (OpenStreetMap)
        // IMPORTANT: Must provide a valid User-Agent as per Usage Policy
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`;

        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'FixofyApp/1.0 (ahsan@example.com)'
            }
        });

        if (response.data && response.data.length > 0) {
            const result = response.data[0];
            return {
                lat: parseFloat(result.lat),
                lng: parseFloat(result.lon),
                displayName: result.display_name
            };
        }
        return null; // No results found
    } catch (error) {
        console.error("Geocoding failed:", error.message);
        return null;
    }
}


/**
 * Reverse geocode coordinates to an address string.
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string|null>} - Formatted address or null.
 */
async function reverseGeocode(lat, lng) {
    if (!lat || !lng) return null;
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`;
        const response = await axios.get(url, {
            headers: { 'User-Agent': 'FixofyApp/1.0 (ahsan@example.com)' }
        });
        if (response.data && response.data.display_name) {
            return response.data.display_name;
        }
        return null;
    } catch (error) {
        console.error("Reverse geocoding failed:", error.message);
        return null;
    }
}

module.exports = { geocodeAddress, reverseGeocode };
