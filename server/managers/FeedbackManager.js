const Database = require('./DatabaseLoader');

class FeedbackManager {
    constructor() {
        this.db = new Database('feedbacks');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
        this.techManager = null; // Will be set by server
    }

    setTechnicianManager(techManager) {
        this.techManager = techManager;
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

    async addFeedback(userId, technicianId, jobId, ratings, comment, metadata = {}) {
        try {
            console.log(`[FeedbackManager] Adding feedback for job ${jobId}, tech ${technicianId}`);

            const feedback = {
                userId,
                technicianId,
                jobId,
                ratings,
                comment,
                recommendationScore: metadata.recommendationScore || 0,
                userName: metadata.userName || '',
                userPhone: metadata.userPhone || '',
                userLocation: metadata.userLocation || null,
                serviceCharges: metadata.serviceCharges || 0,
                createdAt: new Date().toISOString()
            };

            const dbFb = this._mapToDb(feedback);
            const saved = await this.db.add(dbFb);
            const result = this._mapFromDb(saved);

            // Calculate and update average rating for technician
            const avgRating = await this.calculateAverageRating(technicianId);
            console.log(`[FeedbackManager] Calculated avg rating for tech ${technicianId}: ${avgRating}`);

            if (this.techManager && avgRating !== null) {
                await this.techManager.updateRating(technicianId, avgRating);
                console.log(`[FeedbackManager] Updated technician rating in database`);
            }

            if (this.io) {
                this.io.emit('new_feedback_received', result);
                this.io.to(`tech_${technicianId}`).emit('feedback_received', result);
                this.io.emit('admin_feedback_update', result);
                this.io.to(`tech_${technicianId}`).emit('rating_updated', { technicianId, rating: avgRating });
            }

            return result;
        } catch (err) {
            console.error("[FeedbackManager] Error adding feedback:", err);
            throw err;
        }
    }

    async calculateAverageRating(technicianId) {
        try {
            const feedbacks = await this.getFeedbackForTechnician(technicianId);

            if (!feedbacks || feedbacks.length === 0) {
                return 0;
            }

            // Calculate average from 'overall' rating
            const totalRating = feedbacks.reduce((sum, fb) => {
                const overallRating = fb.ratings?.overall || 0;
                return sum + overallRating;
            }, 0);

            const avgRating = totalRating / feedbacks.length;
            return Math.round(avgRating * 10) / 10; // Round to 1 decimal place
        } catch (err) {
            console.error(`[FeedbackManager] Error calculating average rating for tech ${technicianId}:`, err);
            return null;
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
    async getFeedbacksByLocation(lat, lng, radiusKm = 30, technicianManager) {
        try {
            const allFeedbacks = await this.getAllFeedback();
            if (!lat || !lng || !technicianManager) return allFeedbacks;

            const visibleTechIds = new Set(await technicianManager.getTechnicianIdsByLocation(lat, lng, radiusKm));

            return allFeedbacks.filter(f => visibleTechIds.has(f.technicianId));
        } catch (err) {
            console.error("[FeedbackManager] Error getting feedbacks by location:", err);
            return [];
        }
    }
}

module.exports = FeedbackManager;
