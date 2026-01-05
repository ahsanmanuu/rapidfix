const Database = require('./Database');

class BroadcastManager {
    constructor() {
        this.db = new Database('broadcasts.json');
    }

    createBroadcast(title, message, type = 'info', audience = 'all', createdBy = 'system') {
        const broadcast = {
            id: Date.now().toString(),
            title,
            message,
            type, // 'info', 'warning', 'critical', 'maintenance'
            audience, // 'all', 'users', 'technicians'
            createdBy,
            isActive: true,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default 24h expiry
        };
        return this.db.add(broadcast);
    }

    getActiveBroadcasts() {
        const now = new Date().toISOString();
        return this.db.read().filter(b => b.isActive && b.expiresAt > now);
    }

    getAllBroadcasts() {
        return this.db.read();
    }

    deactivateBroadcast(id) {
        return this.db.update('id', id, { isActive: false });
    }
}

module.exports = BroadcastManager;
