const Database = require('./DatabaseLoader');

class BroadcastManager {
    constructor() {
        this.db = new Database('broadcasts');
    }

    _mapFromDb(bc) {
        if (!bc) return null;
        const { created_by, is_active, created_at, expires_at, ...rest } = bc;
        return {
            ...rest,
            createdBy: created_by,
            isActive: is_active,
            createdAt: created_at,
            expiresAt: expires_at
        };
    }

    _mapToDb(bc) {
        if (!bc) return null;
        const { createdBy, isActive, createdAt, expiresAt, id, ...rest } = bc;
        const mapped = { ...rest };
        if (createdBy !== undefined) mapped.created_by = createdBy;
        if (isActive !== undefined) mapped.is_active = isActive;
        if (createdAt !== undefined) mapped.created_at = createdAt;
        if (expiresAt !== undefined) mapped.expires_at = expiresAt;
        return mapped;
    }

    async createBroadcast(title, message, type = 'info', audience = 'all', createdBy = 'system') {
        const broadcast = {
            title,
            message,
            type, // 'info', 'warning', 'critical', 'maintenance'
            audience, // 'all', 'users', 'technicians'
            createdBy,
            isActive: true,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // Default 24h expiry
        };
        const dbBc = this._mapToDb(broadcast);
        const saved = await this.db.add(dbBc);
        return this._mapFromDb(saved);
    }

    async getActiveBroadcasts() {
        const now = new Date().toISOString();
        const broadcasts = await this.db.read();
        return broadcasts.map(b => this._mapFromDb(b)).filter(b => b.isActive && b.expiresAt > now);
    }

    async getAllBroadcasts() {
        const broadcasts = await this.db.read();
        return broadcasts.map(b => this._mapFromDb(b));
    }

    async deactivateBroadcast(id) {
        return await this.db.update('id', id, { is_active: false });
    }
}

module.exports = BroadcastManager;
