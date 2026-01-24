const Database = require('./DatabaseLoader');

class TestimonialManager {
    constructor() {
        this.db = new Database('testimonials');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(t) {
        if (!t) return null;
        // Map any snake_case to camelCase if necessary, or just return as is if frontend handles it
        // Supabase returns snake_case usually.
        return {
            id: t.id,
            userName: t.user_name || t.userName,
            userAvatar: t.user_avatar || t.userAvatar,
            rating: t.rating,
            comment: t.comment,
            isFeatured: t.is_featured || t.isFeatured,
            createdAt: t.created_at || t.createdAt
        };
    }

    async createTestimonial(userName, userAvatar, rating, comment) {
        try {
            const testimonial = {
                user_name: userName,
                user_avatar: userAvatar,
                rating,
                comment,
                is_featured: false,
                created_at: new Date().toISOString()
            };

            const saved = await this.db.add(testimonial);
            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.emit('new_testimonial', result);
            }
            return result;
        } catch (err) {
            console.error("[TestimonialManager] Error creating testimonial:", err);
            throw err;
        }
    }

    async getTestimonials() {
        try {
            const all = await this.db.read();
            return all.map(t => this._mapFromDb(t));
        } catch (err) {
            console.error("[TestimonialManager] Error getting testimonials:", err);
            return [];
        }
    }

    async deleteTestimonial(id) {
        try {
            const result = await this.db.delete('id', id);
            if (result && this.io) {
                this.io.emit('testimonial_deleted', { id });
            }
            return result;
        } catch (err) {
            console.error(`[TestimonialManager] Error deleting testimonial ${id}:`, err);
            return false;
        }
    }
}

module.exports = TestimonialManager;
