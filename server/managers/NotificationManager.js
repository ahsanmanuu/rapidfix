const Database = require('./DatabaseLoader');

class NotificationManager {
    constructor() {
        this.db = new Database('notifications');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(notif) {
        if (!notif) return null;
        try {
            const { user_id, created_at, ...rest } = notif;
            return {
                ...rest,
                recipientId: user_id,
                createdAt: created_at
            };
        } catch (err) {
            console.error("[NotificationManager] Error mapping from DB:", err);
            return notif;
        }
    }

    _mapToDb(notif) {
        if (!notif) return null;
        try {
            const mapped = {};
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

            if (notif.recipientId !== undefined) {
                if (uuidRegex.test(notif.recipientId)) {
                    mapped.user_id = notif.recipientId;
                } else {
                    return null;
                }
            }

            if (notif.title !== undefined) mapped.title = notif.title;
            if (notif.message !== undefined) mapped.message = notif.message;
            if (notif.type !== undefined) mapped.type = notif.type;
            if (notif.read !== undefined) mapped.read = notif.read;
            if (notif.createdAt !== undefined) mapped.created_at = notif.createdAt;
            if (notif.id !== undefined) mapped.id = notif.id;

            return mapped;
        } catch (err) {
            console.error("[NotificationManager] Error mapping to DB:", err);
            return notif;
        }
    }

    async createNotification(recipientId, role, title, message, type, relatedId = null) {
        try {
            const notification = {
                recipientId,
                role,
                title,
                message,
                type,
                relatedId,
                read: false,
                createdAt: new Date().toISOString()
            };
            const dbNotif = this._mapToDb(notification);

            if (!dbNotif) {
                console.log(`[NotificationManager] Virtual notification (non-UUID): ${recipientId}`);
                if (this.io) {
                    this.io.to(`user_${recipientId}`).emit('new_notification', notification);
                }
                return notification;
            }

            const saved = await this.db.add(dbNotif);
            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.to(`user_${recipientId}`).emit('new_notification', result);
                this.io.emit('admin_notification_update', result);
            }

            return result;
        } catch (err) {
            console.error(`[NotificationManager] Error creating notification:`, err);
            return null;
        }
    }

    async getNotifications(recipientId) {
        try {
            const notifs = await this.db.findAll('user_id', recipientId);
            return notifs.map(n => this._mapFromDb(n)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        } catch (err) {
            console.error(`[NotificationManager] Error getting notifs for user ${recipientId}:`, err);
            return [];
        }
    }

    async markRead(id) {
        try {
            const result = await this.db.update('id', id, { read: true });
            return this._mapFromDb(result);
        } catch (err) {
            console.error(`[NotificationManager] Error marking read ${id}:`, err);
            return null;
        }
    }

    async markAllRead(recipientId) {
        try {
            const userNotifs = await this.getNotifications(recipientId);
            for (const n of userNotifs) {
                if (!n.read) await this.markRead(n.id);
            }
            return true;
        } catch (err) {
            console.error(`[NotificationManager] Error marking all read for ${recipientId}:`, err);
            return false;
        }
    }
}

module.exports = NotificationManager;
