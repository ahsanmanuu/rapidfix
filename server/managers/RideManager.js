const Database = require('./DatabaseLoader');

class RideManager {
    constructor() {
        this.db = new Database('rides');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(ride) {
        if (!ride) return null;
        try {
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
        } catch (err) {
            console.error("[RideManager] Error mapping from DB:", err);
            return ride;
        }
    }

    _mapToDb(ride) {
        if (!ride) return null;
        try {
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
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[RideManager] Error mapping to DB:", err);
            return ride;
        }
    }

    async startRide(technicianId, jobId, startLocation, endLocation) {
        try {
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
            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.emit('ride_started', result);
                this.io.to(`user_${result.jobId}`).emit('ride_started', result);
                this.io.to(`tech_${technicianId}`).emit('ride_started', result);
            }

            return result;
        } catch (err) {
            console.error("[RideManager] Error starting ride:", err);
            throw err;
        }
    }

    async updateRoute(rideId, location) {
        try {
            const ride = await this.db.find('id', rideId);
            if (ride) {
                const history = ride.route_history || [];
                history.push({ ...location, timestamp: new Date().toISOString() });

                await this.db.update('id', rideId, {
                    route_history: history,
                    current_location: location
                });

                if (this.io) {
                    this.io.emit('ride_location_update', { rideId, location });
                }
                return true;
            }
            return false;
        } catch (err) {
            console.error(`[RideManager] Error updating route for ride ${rideId}:`, err);
            return false;
        }
    }

    async completeRide(rideId) {
        try {
            const result = await this.db.update('id', rideId, {
                status: 'completed',
                end_time: new Date().toISOString()
            });
            const ride = this._mapFromDb(result);

            if (this.io) {
                this.io.emit('ride_completed', ride);
                this.io.to(`user_${ride.jobId}`).emit('ride_completed', ride);
            }
            return ride;
        } catch (err) {
            console.error(`[RideManager] Error completing ride ${rideId}:`, err);
            return null;
        }
    }

    async getRidesByTechnician(technicianId) {
        try {
            const rides = await this.db.findAll('technician_id', technicianId);
            return rides.map(r => this._mapFromDb(r));
        } catch (err) {
            console.error(`[RideManager] Error getting rides for tech ${technicianId}:`, err);
            return [];
        }
    }

    async getRide(id) {
        try {
            const ride = await this.db.find('id', id);
            return this._mapFromDb(ride);
        } catch (err) {
            console.error(`[RideManager] Error getting ride ${id}:`, err);
            return null;
        }
    }
}

module.exports = RideManager;
