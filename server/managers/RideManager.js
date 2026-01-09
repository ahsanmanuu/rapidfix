const Database = require('./DatabaseLoader');

class RideManager {
    constructor() {
        this.db = new Database('rides');
    }

    _mapFromDb(ride) {
        if (!ride) return null;
        const { technician_id, job_id, start_location, end_location, start_time, end_time, route_history, current_location, ...rest } = ride;
        return {
            ...rest,
            technicianId: technician_id,
            jobId: job_id,
            startLocation: start_location,
            endLocation: end_location,
            startTime: start_time,
            endTime: end_time,
            routeHistory: route_history,
            currentLocation: current_location
        };
    }

    _mapToDb(ride) {
        if (!ride) return null;
        const { technicianId, jobId, startLocation, endLocation, startTime, endTime, routeHistory, currentLocation, id, ...rest } = ride;
        const mapped = { ...rest };
        if (technicianId !== undefined) mapped.technician_id = technicianId;
        if (jobId !== undefined) mapped.job_id = jobId;
        if (startLocation !== undefined) mapped.start_location = startLocation;
        if (endLocation !== undefined) mapped.end_location = endLocation;
        if (startTime !== undefined) mapped.start_time = startTime;
        if (endTime !== undefined) mapped.end_time = endTime;
        if (routeHistory !== undefined) mapped.route_history = routeHistory;
        if (currentLocation !== undefined) mapped.current_location = currentLocation;
        return mapped;
    }

    async startRide(technicianId, jobId, startLocation, endLocation) {
        const ride = {
            technicianId,
            jobId,
            startLocation,
            endLocation,
            status: 'in_progress',
            startTime: new Date().toISOString(),
            endTime: null,
            routeHistory: [startLocation]
        };
        const dbRide = this._mapToDb(ride);
        const saved = await this.db.add(dbRide);
        return this._mapFromDb(saved);
    }

    async updateRoute(rideId, location) {
        const ride = await this.db.find('id', rideId);
        if (ride) {
            const history = ride.route_history || [];
            history.push({ ...location, timestamp: new Date().toISOString() });

            // Supabase update returns array usually, handled by SupabaseDatabase wrapper
            await this.db.update('id', rideId, {
                route_history: history,
                current_location: location
            });
            return true;
        }
        return false;
    }

    async completeRide(rideId) {
        return await this.db.update('id', rideId, {
            status: 'completed',
            end_time: new Date().toISOString()
        });
    }

    async getRidesByTechnician(technicianId) {
        const rides = await this.db.findAll('technician_id', technicianId);
        return rides.map(r => this._mapFromDb(r));
    }

    async getRide(id) {
        const ride = await this.db.find('id', id);
        return this._mapFromDb(ride);
    }
}

module.exports = RideManager;
