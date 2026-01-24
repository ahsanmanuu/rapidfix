const Database = require('./DatabaseLoader');

class PerformerManager {
    constructor() {
        this.techDb = new Database('technicians');
        this.userDb = new Database('users');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    // Get Top Technicians based on Rating and Jobs Completed
    async getTopTechnicians(limit = 5) {
        try {
            const techs = await this.techDb.read();
            // Sort by Rating (desc), then Jobs Completed (desc)
            return techs
                .sort((a, b) => {
                    if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
                    return (b.jobs_completed || 0) - (a.jobs_completed || 0);
                })
                .slice(0, limit)
                .map(t => ({
                    id: t.id,
                    name: t.name,
                    rating: t.rating || 0,
                    jobsCompleted: t.jobs_completed || 0,
                    avatar: t.avatar,
                    serviceType: t.service_type
                }));
        } catch (err) {
            console.error("[PerformerManager] Error getting top technicians:", err);
            return [];
        }
    }

    // Get Active Users (e.g. most recent jobs) - Placeholder logic for now
    async getActiveUsers(limit = 5) {
        try {
            const users = await this.userDb.read();
            // Just return recent users for now since we don't have 'jobs_requested' count easily accessible without querying jobs
            // Or we can assume 'created_at' for new users.
            // Better: Return users with mostly fully filled profiles or verified
            return users
                .filter(u => u.is_verified)
                .slice(0, limit)
                .map(u => ({
                    id: u.id,
                    name: u.name,
                    avatar: u.avatar,
                    location: u.address
                }));
        } catch (err) {
            console.error("[PerformerManager] Error getting active users:", err);
            return [];
        }
    }

    // Get overall system stats real-time
    async getSystemStats() {
        try {
            const techs = await this.techDb.read();
            const users = await this.userDb.read();

            return {
                totalTechnicians: techs.length,
                totalUsers: users.length,
                onlineTechnicians: techs.filter(t => t.status === 'available').length
            };
        } catch (err) {
            return { error: 'Could not fetch stats' };
        }
    }
}

module.exports = PerformerManager;
