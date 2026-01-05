const Database = require('./Database');

class RideManager {
    constructor() {
        this.db = new Database('rides.json');
    }

    startRide(technicianId, jobId, startLocation, endLocation) {
        const ride = {
            id: Date.now().toString(),
            technicianId,
            jobId,
            startLocation,
            endLocation,
            status: 'in_progress',
            startTime: new Date().toISOString(),
            endTime: null,
            route_history: [startLocation] // Initialize with start point
        };
        return this.db.add(ride);
    }

    updateRoute(rideId, location) {
        // Find the ride first
        const ride = this.db.find('id', rideId);
        if (ride) {
            const history = ride.route_history || [];
            history.push({ ...location, timestamp: new Date().toISOString() });

            return this.db.update('id', rideId, {
                route_history: history,
                currentLocation: location
            });
        }
        return null;
    }

    completeRide(rideId) {
        return this.db.update('id', rideId, {
            status: 'completed',
            endTime: new Date().toISOString()
        });
    }

    getRidesByTechnician(technicianId) {
        return this.db.findAll('technicianId', technicianId);
    }

    getRide(id) {
        return this.db.find('id', id);
    }
}

module.exports = RideManager;
