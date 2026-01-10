const Database = require('./DatabaseLoader');

class NotificationManager {
    constructor() {
        this.db = new Database('notifications');
    }

    _mapFromDb(notif) {
        if (!notif) return null;
        const { user_id, created_at, ...rest } = notif;
        return {
            ...rest,
            recipientId: user_id,
            createdAt: created_at
        };
    }

    _mapToDb(notif) {
        if (!notif) return null;

        // Strict Allow-list Mapping to avoid "column not found"
        const mapped = {};

        // Map recipientId to user_id (Schema uses user_id)
        if (notif.recipientId !== undefined) {
            // Validation: Supabase user_id is a UUID. 
            // 'admin' or other strings will cause "invalid input syntax for type uuid"
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(notif.recipientId)) {
                mapped.user_id = notif.recipientId;
            } else {
                // If not a UUID (e.g. 'admin'), we cannot store it in this table due to FK
                return null;
            }
        }

        if (notif.title !== undefined) mapped.title = notif.title;
        if (notif.message !== undefined) mapped.message = notif.message;
        if (notif.type !== undefined) mapped.type = notif.type;
        if (notif.read !== undefined) mapped.read = notif.read;
        if (notif.createdAt !== undefined) mapped.created_at = notif.createdAt;

        // MISSING COLUMNS in current schema:
        // role, related_id

        return mapped;
    }

    async createNotification(recipientId, role, title, message, type, relatedId = null) {
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

        // If _mapToDb returned null (e.g. non-UUID recipient like 'admin'), skip DB insert
        if (!dbNotif) {
            console.log(`[NotificationManager] Skipping DB insert for non-UUID recipient: ${recipientId}`);
            return notification;
        }

        try {
            const saved = await this.db.add(dbNotif);
            return this._mapFromDb(saved);
        } catch (err) {
            // Log the error but don't THROW, to avoid crashing the caller (e.g. Job Booking)
            console.error(`[NotificationManager] Failed to SAVE notification to DB:`, err.message || err);
            return notification; // Return the virtual notification anyway
        }
    }

    async getNotifications(recipientId) {
        const notifs = await this.db.findAll('user_id', recipientId);
        return notifs.map(n => this._mapFromDb(n)).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async getAdminNotifications() {
        // Fetch all notifications intended for admins
        const all = await this.db.read();
        return all.map(n => this._mapFromDb(n)).filter(n => n.role === 'admin' || n.role === 'superadmin').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async markRead(id) {
        return await this.db.update('id', id, { read: true });
    }

    async markAllRead(recipientId) {
        const userNotifs = await this.getNotifications(recipientId);
        // Supabase update logic might be different for bulk, but iterating is safe for now
        for (const n of userNotifs) {
            if (!n.read) await this.db.update('id', n.id, { read: true });
        }
        return true;
    }
}

module.exports = NotificationManager;
