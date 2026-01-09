const Database = require('./DatabaseLoader');

class FeedbackManager {
    constructor() {
        this.db = new Database('feedbacks');
    }

    _mapFromDb(fb) {
        if (!fb) return null;
        const { user_id, technician_id, job_id, created_at, ...rest } = fb;
        return {
            ...rest,
            userId: user_id,
            technicianId: technician_id,
            jobId: job_id,
            createdAt: created_at
        };
    }

    _mapToDb(fb) {
        if (!fb) return null;
        const { userId, technicianId, jobId, createdAt, id, ...rest } = fb;
        const mapped = { ...rest };
        if (userId !== undefined) mapped.user_id = userId;
        if (technicianId !== undefined) mapped.technician_id = technicianId;
        if (jobId !== undefined) mapped.job_id = jobId;
        if (createdAt !== undefined) mapped.created_at = createdAt;
        return mapped;
    }

    async addFeedback(userId, technicianId, ratings, comment, jobId = null) {
        // ratings should be an object: { time, attitude, communication, knowledge, honesty, behavior, punctuality, respect }
        const feedback = {
            userId,
            technicianId,
            jobId,
            ratings,
            comment,
            createdAt: new Date().toISOString()
        };
        const dbFb = this._mapToDb(feedback);
        const saved = await this.db.add(dbFb);
        return this._mapFromDb(saved);
    }

    async getFeedbackForTechnician(technicianId) {
        const feedbacks = await this.db.findAll('technician_id', technicianId);
        return feedbacks.map(f => this._mapFromDb(f));
    }

    async getAllFeedback() {
        const feedbacks = await this.db.read();
        return feedbacks.map(f => this._mapFromDb(f));
    }
}

module.exports = FeedbackManager;
