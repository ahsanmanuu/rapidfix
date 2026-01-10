const Database = require('./DatabaseLoader');

class LocationManager {
    constructor() {
        this.db = new Database('locations');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    async addLocation(city, area, pincode) {
        try {
            const all = await this.db.read();
            const existing = all.find(l => l.pincode === pincode);
            if (existing) throw new Error('Location already exists');

            const location = {
                city,
                area,
                pincode,
                active: true,
                created_at: new Date().toISOString()
            };
            const result = await this.db.add(location);
            if (this.io) {
                this.io.emit('new_service_location_added', result);
            }
            return result;
        } catch (err) {
            console.error("[LocationManager] Error adding service location:", err);
            throw err;
        }
    }

    async getAllLocations() {
        try {
            return await this.db.read();
        } catch (err) {
            console.error("[LocationManager] Error getting all locations:", err);
            return [];
        }
    }

    async removeLocation(id) {
        try {
            return await this.db.delete('id', id);
        } catch (err) {
            console.error(`[LocationManager] Error removing location ${id}:`, err);
            return false;
        }
    }

    async saveUserRealtimeLocation(userId, coords) {
        try {
            const locationEntry = {
                user_id: userId,
                technician_id: null,
                latitude: coords.latitude,
                longitude: coords.longitude
            };
            const result = await this.db.add(locationEntry);
            if (this.io) {
                this.io.emit('user_location_update', { userId, location: coords });
            }
            return result;
        } catch (err) {
            console.error(`[LocationManager] Error saving user location for ${userId}:`, err);
            return null;
        }
    }
}

module.exports = LocationManager;
