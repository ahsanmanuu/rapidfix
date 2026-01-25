const BaseManager = require('./BaseManager');

class ActivityLogManager extends BaseManager {
    constructor() {
        super('activity_logs');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    async log(userId, technicianId, type, title, message, meta = {}) {
        try {
            console.log(`[ActivityLog] Logging: ${title} - ${message} (Tech: ${technicianId})`);
            const entry = {
                user_id: userId,
                technician_id: technicianId,
                type,
                title,
                message,
                meta,
                read: false,
                created_at: new Date().toISOString()
            };

            const result = await this.db.add(entry);

            // Real-time broadcast
            if (this.io) {
                // Emit to specific user/tech rooms
                if (userId) this.io.to(`user_${userId}`).emit('new_activity', entry);
                if (technicianId) this.io.to(`tech_${technicianId}`).emit('new_activity', entry);
            }

            return result;

            return result;
        } catch (err) {
            console.error('[ActivityLog] Failed to log activity:', err);
            return null;
        }
    }
}

module.exports = ActivityLogManager;
