const Database = require('./DatabaseLoader');

class FeedbackManager {
    constructor() {
        this.db = new Database('feedbacks');
    }

    addFeedback(userId, technicianId, ratings, comment) {
        // ratings should be an object: { time, attitude, communication, knowledge, honesty, behavior, punctuality, respect }
        const feedback = {
            id: Date.now().toString(),
            userId,
            technicianId,
            ratings,
            comment,
            createdAt: new Date().toISOString()
        };
        return this.db.add(feedback);
    }

    getFeedbackForTechnician(technicianId) {
        return this.db.findAll('technicianId', technicianId);
    }

    getAllFeedback() {
        return this.db.read();
    }
}

module.exports = FeedbackManager;
