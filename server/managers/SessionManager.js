const Database = require('./DatabaseLoader');
const crypto = require('crypto');

class SessionManager {
    constructor() {
        this.db = new Database('sessions');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(sess) {
        if (!sess) return null;
        try {
            const { user_id, device_id, expires_at, created_at, ...rest } = sess;
            return {
                ...rest,
                userId: user_id,
                deviceId: device_id,
                expiresAt: expires_at,
                createdAt: created_at
            };
        } catch (err) {
            console.error("[SessionManager] Error mapping from DB:", err);
            return sess;
        }
    }

    _mapToDb(sess) {
        if (!sess) return null;
        try {
            const { userId, deviceId, expiresAt, createdAt, id, ...rest } = sess;
            const mapped = { ...rest };
            if (userId !== undefined) mapped.user_id = userId;
            if (deviceId !== undefined) mapped.device_id = deviceId;
            if (expiresAt !== undefined) mapped.expires_at = expiresAt;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[SessionManager] Error mapping to DB:", err);
            return sess;
        }
    }

    async createSession(userId, role, deviceId) {
        try {
            const token = crypto.randomBytes(32).toString('hex');
            const session = {
                token,
                userId,
                deviceId,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            // Only include role for local JSON DB (Supabase sessions table doesn't have role column)
            if (process.env.USE_SUPABASE !== 'true') {
                session.role = role;
            }

            const dbSess = this._mapToDb(session);

            // WORKAROUND: Use local JSON for admin sessions when using Supabase to avoid FK constraint
            // Supabase sessions table has FK to users table, but admins are in admins table
            let saved;
            if (process.env.USE_SUPABASE === 'true' && role === 'admin') {
                // Use local JSON Database for admin sessions
                const LocalDatabase = require('./Database');
                const localDb = new LocalDatabase('sessions');
                saved = await localDb.add(dbSess);
            } else {
                saved = await this.db.add(dbSess);
            }

            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.to(`user_${userId}`).emit('new_session_created', { deviceId });
                this.io.emit('admin_session_update', result);
            }

            return result;
        } catch (err) {
            console.error("[SessionManager] Error creating session:", err);
            throw err;
        }
    }

    async validateSession(token) {
        try {
            const session = await this.db.find('token', token);
            if (!session) return null;
            const mapped = this._mapFromDb(session);

            if (new Date(mapped.expiresAt) < new Date()) {
                await this.db.delete('token', token);
                return null;
            }

            return mapped;
        } catch (err) {
            console.error("[SessionManager] Error validating session:", err);
            return null;
        }
    }

    async deleteSession(token) {
        try {
            return await this.db.delete('token', token);
        } catch (err) {
            console.error("[SessionManager] Error deleting session:", err);
            return false;
        }
    }
}

module.exports = SessionManager;
