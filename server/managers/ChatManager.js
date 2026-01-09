const Database = require('./DatabaseLoader');

class ChatManager {
    constructor() {
        this.db = new Database('chats');
    }

    sendMessage(senderId, receiverId, message, senderName) {
        const chat = {
            id: Date.now().toString(),
            senderId,
            receiverId,
            senderName,
            message,
            read: false,
            createdAt: new Date().toISOString()
        };
        return this.db.add(chat);
    }

    getHistory(userId1, userId2) {
        const allChats = this.db.read();
        return allChats.filter(c =>
            (c.senderId === userId1 && c.receiverId === userId2) ||
            (c.senderId === userId2 && c.receiverId === userId1)
        ).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    }

    getConversations(userId) {
        const allChats = this.db.read();
        const relevantChats = allChats.filter(c => c.senderId === userId || c.receiverId === userId);

        // Group by the *other* person
        const conversations = {};
        relevantChats.forEach(c => {
            const otherId = c.senderId === userId ? c.receiverId : c.senderId;
            // storing just the last message for preview
            if (!conversations[otherId] || new Date(c.createdAt) > new Date(conversations[otherId].createdAt)) {
                conversations[otherId] = c;
            }
        });

        return Object.values(conversations);
    }

    markAsRead(senderId, receiverId) {
        // Mark all messages FROM sender TO receiver as read
        const allChats = this.db.read();
        let changed = false;
        allChats.forEach(c => {
            if (c.senderId === senderId && c.receiverId === receiverId && !c.read) {
                c.read = true;
                changed = true;
            }
        });
        if (changed) this.db.save();
        return true;
    }
}

module.exports = ChatManager;
