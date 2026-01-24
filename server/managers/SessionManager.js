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
            // if (deviceId !== undefined) mapped.device_id = deviceId; // TODO: Run 'server/update-sessions-table.sql' on Supabase then uncomment this
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
                role, // [FIX] Ensure role is included so it gets saved to DB
                deviceId,
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
            };

            // [UPDATED] Use Main DB for all sessions (Schema update allows generic IDs)
            if (role === 'admin' || role === 'technician') {
                // Explicitly set role since it might not be auto-inferred by table column if strict (but we mapped it in _mapToDb)
                // mapToDb doesn't have 'role' in the destructuring list in the original code, we should check that too.
                // Actually _mapToDb lines 34-45 in SessionManager:
                // "const { userId, deviceId, expiresAt, createdAt, id, ...rest } = sess;" -> rest contains role.
                // "const mapped = { ...rest };" -> mapped contains role.
                // So role IS passed to DB.
            }

            const dbSess = this._mapToDb(session);
            let saved;
            try {
                saved = await this.db.add(dbSess);
            } catch (dbErr) {
                // Self-Healing: If 'role' column is missing, retry without it
                if (dbErr.message && (dbErr.message.includes('role') || dbErr.message.includes('column'))) {
                    console.warn("[SessionManager] 'role' column missing in DB. Retrying without role.");
                    const { role, ...fallbackSess } = dbSess;
                    saved = await this.db.add(fallbackSess);
                } else {
                    throw dbErr;
                }
            }

            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.to(`user_${userId}`).emit('new_session_created', { deviceId });
                // If it's an admin, we might broadly notify, but specific user notification is better
                if (role === 'admin') {
                    this.io.emit('admin_session_update', result);
                }
            }

            return result;
        } catch (err) {
            console.error("[SessionManager] Error creating session:", err);
            throw err;
        }
    }

    async validateSession(token) {
        try {
            // 1. Check Main DB
            // (Schema fix: 'sessions' table now supports user_id as text, holding any UUID)
            const session = await this.db.find('token', token);

            if (!session) return null;
            const mapped = this._mapFromDb(session);

            if (new Date(mapped.expiresAt) < new Date()) {
                await this.deleteSession(token); // Use deleteSession method to handle hybrid deletion
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
            const mainResult = await this.db.delete('token', token);
            return mainResult;
        } catch (err) {
            console.error("[SessionManager] Error deleting session:", err);
            return false;
        }
    }
}

module.exports = SessionManager;
