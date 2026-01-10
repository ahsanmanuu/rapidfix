const Database = require('./DatabaseLoader');

class FeedbackManager {
    constructor() {
        this.db = new Database('feedbacks');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(fb) {
        if (!fb) return null;
        try {
            const { user_id, technician_id, job_id, created_at, ...rest } = fb;
            return {
                ...rest,
                userId: user_id,
                technicianId: technician_id,
                jobId: job_id,
                createdAt: created_at
            };
        } catch (err) {
            console.error("[FeedbackManager] Error mapping from DB:", err);
            return fb;
        }
    }

    _mapToDb(fb) {
        if (!fb) return null;
        try {
            const { userId, technicianId, jobId, createdAt, id, ...rest } = fb;
            const mapped = { ...rest };
            if (userId !== undefined) mapped.user_id = userId;
            if (technicianId !== undefined) mapped.technician_id = technicianId;
            if (jobId !== undefined) mapped.job_id = jobId;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[FeedbackManager] Error mapping to DB:", err);
            return fb;
        }
    }

    async addFeedback(userId, technicianId, ratings, comment, jobId = null) {
        try {
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
            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.emit('new_feedback_received', result);
                this.io.to(`tech_${technicianId}`).emit('feedback_received', result);
                this.io.emit('admin_feedback_update', result);
            }

            return result;
        } catch (err) {
            console.error("[FeedbackManager] Error adding feedback:", err);
            throw err;
        }
    }

    async getFeedbackForTechnician(technicianId) {
        try {
            const feedbacks = await this.db.findAll('technician_id', technicianId);
            return feedbacks.map(f => this._mapFromDb(f));
        } catch (err) {
            console.error(`[FeedbackManager] Error getting feedback for tech ${technicianId}:`, err);
            return [];
        }
    }

    async getAllFeedback() {
        try {
            const feedbacks = await this.db.read();
            return feedbacks.map(f => this._mapFromDb(f));
        } catch (err) {
            console.error("[FeedbackManager] Error getting all feedback:", err);
            return [];
        }
    }
}

module.exports = FeedbackManager;
