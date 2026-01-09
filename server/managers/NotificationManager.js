const Database = require('./DatabaseLoader');

class NotificationManager {
    constructor() {
        this.db = new Database('notifications');
    }

    createNotification(recipientId, role, title, message, type, relatedId = null) {
        const notification = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            recipientId, // 'admin', 'superadmin', or specific userId/techId
            role,        // 'user', 'technician', 'admin', 'superadmin'
            title,
            message,
            type,        // 'job_created', 'job_accepted', 'payment', etc.
            relatedId,   // Job ID or Transaction ID
            read: false,
            createdAt: new Date().toISOString()
        };
        return this.db.add(notification);
    }

    getNotifications(recipientId) {
        return this.db.findAll('recipientId', recipientId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    getAdminNotifications() {
        // Fetch all notifications intended for admins
        const all = this.db.read();
        return all.filter(n => n.role === 'admin' || n.role === 'superadmin').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    markRead(id) {
        return this.db.update('id', id, { read: true });
    }

    markAllRead(recipientId) {
        const userNotifs = this.getNotifications(recipientId);
        userNotifs.forEach(n => {
            if (!n.read) this.db.update('id', n.id, { read: true });
        });
        return true;
    }
}

module.exports = NotificationManager;
