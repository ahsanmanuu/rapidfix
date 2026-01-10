const Database = require('./DatabaseLoader');

class ChatManager {
    constructor() {
        this.db = new Database('chats');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    async sendMessage(senderId, receiverId, message, senderName) {
        try {
            const chat = {
                senderId,
                receiverId,
                senderName,
                message,
                read: false,
                createdAt: new Date().toISOString()
            };
            const result = await this.db.add(chat);
            if (this.io) {
                this.io.to(`user_${receiverId}`).emit('new_message', result);
                this.io.to(`user_${senderId}`).emit('message_sent', result);
            }
            return result;
        } catch (err) {
            console.error("[ChatManager] Error sending message:", err);
            return null;
        }
    }

    async getHistory(userId1, userId2) {
        try {
            const allChats = await this.db.read();
            return allChats.filter(c =>
                (c.senderId === userId1 && c.receiverId === userId2) ||
                (c.senderId === userId2 && c.receiverId === userId1)
            ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        } catch (err) {
            console.error("[ChatManager] Error getting history:", err);
            return [];
        }
    }

    async getConversations(userId) {
        try {
            const allChats = await this.db.read();
            const relevantChats = allChats.filter(c => c.senderId === userId || c.receiverId === userId);

            const conversations = {};
            relevantChats.forEach(c => {
                const otherId = c.senderId === userId ? c.receiverId : c.senderId;
                if (!conversations[otherId] || new Date(c.createdAt) > new Date(conversations[otherId].createdAt)) {
                    conversations[otherId] = c;
                }
            });

            return Object.values(conversations);
        } catch (err) {
            console.error("[ChatManager] Error getting conversations:", err);
            return [];
        }
    }

    async markAsRead(senderId, receiverId) {
        try {
            const allChats = await this.db.read();
            const targets = allChats.filter(c => c.senderId === senderId && c.receiverId === receiverId && !c.read);

            for (const msg of targets) {
                await this.db.update('id', msg.id, { read: true });
            }
            return true;
        } catch (err) {
            console.error("[ChatManager] Error marking as read:", err);
            return false;
        }
    }
}

module.exports = ChatManager;
