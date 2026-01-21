const Database = require('./DatabaseLoader');

class SupportManager {
    constructor() {
        this.db = new Database('support_sessions');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    setNotificationManager(notificationManager) {
        this.notificationManager = notificationManager;
    }

    _mapFromDb(session) {
        if (!session) return null;
        try {
            const { user_id, agent_id, ...rest } = session;
            return {
                ...rest,
                userId: user_id,
                agentId: agent_id
            };
        } catch (err) {
            console.error("[SupportManager] Error mapping from DB:", err);
            return session;
        }
    }

    _mapToDb(session) {
        if (!session) return null;
        try {
            const { userId, agentId, id, ...rest } = session;
            const mapped = { ...rest };
            if (userId !== undefined) mapped.user_id = userId;
            if (agentId !== undefined) mapped.agent_id = agentId;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[SupportManager] Error mapping to DB:", err);
            return session;
        }
    }

    async createSession(userId) {
        try {
            // Check for existing active session
            const existing = await this.db.findAll('user_id', userId);
            const active = existing.find(s => s.status === 'active');
            if (active) return this._mapFromDb(active);

            const session = {
                userId,
                status: 'active',
                messages: [],
                created_at: new Date().toISOString()
            };
            const dbSession = this._mapToDb(session);
            const saved = await this.db.add(dbSession);
            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.emit('new_support_session', result); // Notify admins
            }
            return result;
        } catch (err) {
            console.error("[SupportManager] Error creating session:", err);
            throw err;
        }
    }

    async addMessage(sessionId, sender, text, userId) {
        try {
            const session = await this.db.find('id', sessionId);
            if (!session) throw new Error('Session not found');

            const message = {
                sender, // 'user' or 'agent'
                text,
                timestamp: new Date().toISOString()
            };

            const updatedMessages = [...(session.messages || []), message];

            const result = await this.db.update('id', sessionId, {
                messages: updatedMessages,
                updated_at: new Date().toISOString() // Force update timestamp for timeout logic
            });
            const finalSession = this._mapFromDb(result);

            if (this.io) {
                // Emit to specific session room (if we implemented rooms) or broadcast
                this.io.emit(`support_message_${sessionId}`, message);

                // Notify user specifically if agent replied
                if (sender === 'agent' && userId) {
                    this.io.to(`user_${userId}`).emit('support_message_received', message);
                }
            }

            // [NEW] Auto-Notifications
            if (this.notificationManager) {
                if (sender === 'user') {
                    // Notify Admin
                    await this.notificationManager.createNotification(
                        'admin',
                        'admin',
                        `Support Request: ${userId.substring(0, 8)}...`,
                        `Session #${sessionId}: ${text.substring(0, 50)}`,
                        'admin_support_alert',
                        sessionId
                    );
                } else if (sender === 'agent' && userId) {
                    // Notify User
                    await this.notificationManager.createNotification(
                        userId,
                        'user',
                        'Support Reply',
                        `Agent: ${text.substring(0, 50)}`,
                        'support_message',
                        sessionId
                    );
                }
            }

            return finalSession;
        } catch (err) {
            console.error("[SupportManager] Error adding message:", err);
            throw err;
        }
    }

    async closeSession(sessionId) {
        try {
            const result = await this.db.update('id', sessionId, { status: 'closed' });
            if (this.io) {
                this.io.emit(`support_session_closed_${sessionId}`, { sessionId });
            }
            return this._mapFromDb(result);
        } catch (err) {
            console.error("[SupportManager] Error closing session:", err);
            throw err;
        }
    }

    startInactivityMonitor(intervalMs = 60000) {
        if (this.monitorInterval) clearInterval(this.monitorInterval);

        console.log("[SupportManager] Starting Inactivity Monitor...");
        this.monitorInterval = setInterval(async () => {
            await this._checkTimeouts();
        }, intervalMs);
    }

    async _checkTimeouts() {
        try {
            const activeSessions = await this.getActiveSessions();
            const now = new Date();
            const FIVE_MINUTES = 5 * 60 * 1000;

            for (const session of activeSessions) {
                const lastActivity = new Date(session.updatedAt || session.createdAt);
                if (now - lastActivity > FIVE_MINUTES) {
                    console.log(`[SupportManager] Auto-closing idle session: ${session.id}`);
                    await this.closeSession(session.id);
                }
            }
        } catch (err) {
            console.error("[SupportManager] Error checking timeouts:", err);
        }
    }

    async getActiveSessions() {
        try {
            const sessions = await this.db.findAll('status', 'active');
            return sessions.map(s => this._mapFromDb(s));
        } catch (err) {
            console.error("[SupportManager] Error getting active sessions:", err);
            return [];
        }
    }

    async getSession(id) {
        try {
            const session = await this.db.find('id', id);
            return this._mapFromDb(session);
        } catch (err) {
            return null;
        }
    }
}

module.exports = SupportManager;
