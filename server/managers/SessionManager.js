const Database = require('./DatabaseLoader');
const crypto = require('crypto');

class SessionManager {
    constructor() {
        this.db = new Database('sessions');
    }

    _mapFromDb(sess) {
        if (!sess) return null;
        const { user_id, device_id, expires_at, created_at, ...rest } = sess;
        return {
            ...rest,
            userId: user_id,
            deviceId: device_id,
            expiresAt: expires_at,
            createdAt: created_at
        };
    }

    _mapToDb(sess) {
        if (!sess) return null;
        const { userId, deviceId, expiresAt, createdAt, id, ...rest } = sess;
        const mapped = { ...rest };
        if (userId !== undefined) mapped.user_id = userId;
        if (deviceId !== undefined) mapped.device_id = deviceId;
        if (expiresAt !== undefined) mapped.expires_at = expiresAt;
        if (createdAt !== undefined) mapped.created_at = createdAt;
        return mapped;
    }

    async createSession(userId, role, deviceId) {
        const token = crypto.randomBytes(32).toString('hex');
        const session = {
            token,
            userId,
            role,
            deviceId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };
        const dbSess = this._mapToDb(session);
        const saved = await this.db.add(dbSess);
        return this._mapFromDb(saved);
    }

    async validateSession(token) {
        const session = await this.db.find('token', token);
        if (!session) return null;
        const mapped = this._mapFromDb(session);

        if (new Date(mapped.expiresAt) < new Date()) {
            await this.db.delete('token', token);
            return null;
        }

        return mapped;
    }

    async deleteSession(token) {
        return await this.db.delete('token', token);
    }
}

module.exports = SessionManager;
