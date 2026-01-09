const Database = require('./DatabaseLoader');

class NotificationManager {
    constructor() {
        this.db = new Database('notifications');
    }

    _mapFromDb(notif) {
        if (!notif) return null;
        const { recipient_id, related_id, created_at, ...rest } = notif;
        return {
            ...rest,
            recipientId: recipient_id,
            relatedId: related_id,
            createdAt: created_at
        };
    }

    _mapToDb(notif) {
        if (!notif) return null;
        const { recipientId, relatedId, createdAt, id, ...rest } = notif;
        const mapped = { ...rest };
        if (recipientId !== undefined) mapped.recipient_id = recipientId;
        if (relatedId !== undefined) mapped.related_id = relatedId;
        if (createdAt !== undefined) mapped.created_at = createdAt;
        return mapped;
    }

    async createNotification(recipientId, role, title, message, type, relatedId = null) {
        const notification = {
            recipientId, // 'admin', 'superadmin', or specific userId/techId
            role,        // 'user', 'technician', 'admin', 'superadmin'
            title,
            message,
            type,        // 'job_created', 'job_accepted', 'payment', etc.
            relatedId,   // Job ID or Transaction ID
            read: false,
            createdAt: new Date().toISOString()
        };
        const dbNotif = this._mapToDb(notification);
        const saved = await this.db.add(dbNotif);
        return this._mapFromDb(saved);
    }

    async getNotifications(recipientId) {
        const notifs = await this.db.findAll('recipient_id', recipientId);
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
