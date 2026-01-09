const Database = require('./DatabaseLoader');

class LocationManager {
    constructor() {
        this.db = new Database('locations');
    }

    addLocation(city, area, pincode) {
        const existing = this.db.read().find(l => l.pincode === pincode);
        if (existing) {
            throw new Error('Location already exists');
        }

        const location = {
            id: Date.now().toString(),
            city,
            area,
            pincode,
            active: true
        };
        return this.db.add(location);
    }

    getAllLocations() {
        return this.db.read();
    }

    removeLocation(id) {
        return this.db.delete('id', id);
    }

    saveUserRealtimeLocation(userId, coords) {
        const locationEntry = {
            id: Date.now().toString(),
            userId,
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().toISOString(),
            type: 'user_realtime'
        };
        return this.db.add(locationEntry);
    }
}

module.exports = LocationManager;
