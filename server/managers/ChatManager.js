const Database = require('./DatabaseLoader');

class ChatManager {
    constructor() {
        this.db = new Database('chats');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(chat) {
        if (!chat) return null;
        try {
            const { sender_id, receiver_id, sender_name, created_at, ...rest } = chat;
            return {
                ...rest,
                senderId: sender_id,
                receiverId: receiver_id,
                senderName: sender_name,
                createdAt: created_at || chat.createdAt
            };
        } catch (err) {
            console.error("[ChatManager] Error mapping from DB:", err);
            return chat;
        }
    }

    _mapToDb(chat) {
        if (!chat) return null;
        try {
            const { senderId, receiverId, senderName, createdAt, id, ...rest } = chat;
            const mapped = { ...rest };
            if (senderId !== undefined) mapped.sender_id = senderId;
            if (receiverId !== undefined) mapped.receiver_id = receiverId;
            if (senderName !== undefined) mapped.sender_name = senderName;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[ChatManager] Error mapping to DB:", err);
            return chat;
        }
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
            const dbChat = this._mapToDb(chat);
            const saved = await this.db.add(dbChat);
            const result = this._mapFromDb(saved);

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
            return allChats.map(c => this._mapFromDb(c)).filter(c =>
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
            const relevantChats = allChats.map(c => this._mapFromDb(c)).filter(c => c.senderId === userId || c.receiverId === userId);

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
            // Note: Efficient update would be updateWhere but simple DB might not support it 
            // Standard approach: Get all -> filter -> update loop
            const history = await this.getHistory(senderId, receiverId);
            const unread = history.filter(c => c.senderId === senderId && !c.read);

            for (const msg of unread) {
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
