const Database = require('./DatabaseLoader');

class ComplaintManager {
    constructor() {
        this.db = new Database('complaints');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(complaint) {
        if (!complaint) return null;
        try {
            const { user_id, technician_id, ...rest } = complaint;
            return {
                ...rest,
                userId: user_id,
                technicianId: technician_id
            };
        } catch (err) {
            console.error("[ComplaintManager] Error mapping from DB:", err);
            return complaint;
        }
    }

    _mapToDb(complaint) {
        if (!complaint) return null;
        try {
            const { userId, technicianId, id, timeline, ...rest } = complaint;
            const mapped = { ...rest };
            if (userId !== undefined) mapped.user_id = userId;
            if (technicianId !== undefined) mapped.technician_id = technicianId;
            if (id !== undefined) mapped.id = id;
            if (timeline !== undefined) mapped.timeline = timeline; // JSONB
            return mapped;
        } catch (err) {
            console.error("[ComplaintManager] Error mapping to DB:", err);
            return complaint;
        }
    }

    async createComplaint(userId, technicianId, subject, description, category, evidence) {
        try {
            const complaint = {
                userId,
                technicianId,
                subject,
                description,
                category: category || 'General',
                evidence: evidence || [], // JSONB in DB
                status: 'open',
                created_at: new Date().toISOString(),
                timeline: [
                    { status: 'open', message: 'Complaint filed', timestamp: new Date().toISOString() }
                ]
            };
            const dbComplaint = this._mapToDb(complaint);
            const saved = await this.db.add(dbComplaint);
            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.emit('new_complaint', result);
                this.io.emit('admin_complaint_update', result);
            }
            return result;
        } catch (err) {
            console.error("[ComplaintManager] Error creating complaint:", err);
            throw err;
        }
    }

    async getAllComplaints() {
        try {
            const complaints = await this.db.read();
            return complaints.map(c => this._mapFromDb(c));
        } catch (err) {
            console.error("[ComplaintManager] Error getting all complaints:", err);
            return [];
        }
    }

    async getComplaintsByUser(userId) {
        try {
            const complaints = await this.db.findAll('user_id', userId);
            return complaints.map(c => this._mapFromDb(c));
        } catch (err) {
            console.error(`[ComplaintManager] Error getting user complaints for ${userId}:`, err);
            return [];
        }
    }

    async getComplaintsByLocation(lat, lng, radiusKm = 30, userManager) {
        try {
            const all = await this.getAllComplaints();
            if (!lat || !lng || !userManager) return all;

            const visibleUserIds = new Set(await userManager.getUserIdsByLocation(lat, lng, radiusKm));
            return all.filter(c => visibleUserIds.has(c.userId));
        } catch (err) {
            console.error("[ComplaintManager] Error getting complaints by location:", err);
            return [];
        }
    }

    async updateStatus(id, status) {
        try {
            const result = await this.db.update('id', id, { status });
            const complaint = this._mapFromDb(result);
            if (this.io) {
                this.io.emit('complaint_status_updated', { id, status });
                this.io.emit('admin_complaint_update', complaint);
            }
            return complaint;
        } catch (err) {
            console.error(`[ComplaintManager] Error updating status for complaint ${id}:`, err);
            return null;
        }
    }

    // [New] Helper for Auto-Assignment Algo
    async getComplaintStats(technicianId) {
        try {
            const complaints = await this.db.findAll('technician_id', technicianId);
            return {
                total: complaints.length,
                open: complaints.filter(c => c.status === 'open').length
            };
        } catch (err) {
            console.error(`[ComplaintManager] Error getting complaint stats for ${technicianId}:`, err);
            return { total: 0, open: 0 };
        }
    }
}

module.exports = ComplaintManager;
