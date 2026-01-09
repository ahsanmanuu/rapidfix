const Database = require('./DatabaseLoader');

class LocationManager {
    constructor() {
        this.db = new Database('locations');
    }

    async addLocation(city, area, pincode) {
        const existing = (await this.db.read()).find(l => l.pincode === pincode);
        if (existing) {
            throw new Error('Location already exists');
        }

        const location = {
            city,
            area,
            pincode,
            active: true,
            created_at: new Date().toISOString()
        };
        return await this.db.add(location);
    }

    async getAllLocations() {
        return await this.db.read();
    }

    async removeLocation(id) {
        return await this.db.delete('id', id);
    }

    async saveUserRealtimeLocation(userId, coords) {
        try {
            const locationEntry = {
                user_id: userId,
                technician_id: null,
                latitude: coords.latitude,
                longitude: coords.longitude
            };
            return await this.db.add(locationEntry);
        } catch (error) {
            console.error('Error adding to locations:', error);
            // Don't throw - this is not critical
            return null;
        }
    }
}

module.exports = LocationManager;
