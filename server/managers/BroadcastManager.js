const Database = require('./DatabaseLoader');

class BroadcastManager {
    constructor() {
        this.db = new Database('broadcasts');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(bc) {
        if (!bc) return null;
        try {
            const { created_by, is_active, created_at, expires_at, ...rest } = bc;
            return {
                ...rest,
                createdBy: created_by,
                isActive: is_active,
                createdAt: created_at,
                expiresAt: expires_at
            };
        } catch (err) {
            console.error("[BroadcastManager] Error mapping from DB:", err);
            return bc;
        }
    }

    _mapToDb(bc) {
        if (!bc) return null;
        try {
            const { createdBy, isActive, createdAt, expiresAt, id, ...rest } = bc;
            const mapped = { ...rest };
            if (createdBy !== undefined) mapped.created_by = createdBy;
            if (isActive !== undefined) mapped.is_active = isActive;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (expiresAt !== undefined) mapped.expires_at = expiresAt;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[BroadcastManager] Error mapping to DB:", err);
            return bc;
        }
    }

    async createBroadcast(title, message, type = 'info', audience = 'all', createdBy = 'system') {
        try {
            const broadcast = {
                title,
                message,
                type,
                audience,
                createdBy,
                isActive: true,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
            };
            const dbBc = this._mapToDb(broadcast);
            const saved = await this.db.add(dbBc);
            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.emit('new_broadcast', result);
            }

            return result;
        } catch (err) {
            console.error("[BroadcastManager] Error creating broadcast:", err);
            throw err;
        }
    }

    async getActiveBroadcasts() {
        try {
            const now = new Date().toISOString();
            const broadcasts = await this.db.read();
            return broadcasts.map(b => this._mapFromDb(b)).filter(b => b.isActive && b.expiresAt > now);
        } catch (err) {
            console.error("[BroadcastManager] Error getting active broadcasts:", err);
            return [];
        }
    }

    async getAllBroadcasts() {
        try {
            const broadcasts = await this.db.read();
            return broadcasts.map(b => this._mapFromDb(b));
        } catch (err) {
            console.error("[BroadcastManager] Error getting all broadcasts:", err);
            return [];
        }
    }

    async deactivateBroadcast(id) {
        try {
            const result = await this.db.update('id', id, { is_active: false });
            if (this.io) {
                this.io.emit('broadcast_deactivated', { id });
            }
            return result;
        } catch (err) {
            console.error(`[BroadcastManager] Error deactivating broadcast ${id}:`, err);
            return false;
        }
    }
}

module.exports = BroadcastManager;
