const Database = require('./DatabaseLoader');
const crypto = require('crypto');

class SessionManager {
    constructor() {
        this.db = new Database('sessions');
    }

    createSession(userId, role, deviceId) {
        // Remove existing session for this device if needed, or allow multiple
        // For this requirement: "if not so ask again login" implies check. 
        // We'll trust the token, but storing deviceId helps tracking.

        const token = crypto.randomBytes(32).toString('hex');
        const session = {
            token,
            userId,
            role,
            deviceId,
            createdAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
        };
        return this.db.add(session);
    }

    validateSession(token) {
        const session = this.db.find('token', token);
        if (!session) return null;

        if (new Date(session.expiresAt) < new Date()) {
            this.db.delete('token', token);
            return null;
        }

        return session;
    }

    deleteSession(token) {
        return this.db.delete('token', token);
    }
}

module.exports = SessionManager;
