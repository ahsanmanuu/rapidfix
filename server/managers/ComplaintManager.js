const Database = require('./DatabaseLoader');

class ComplaintManager {
    constructor() {
        this.db = new Database('complaints');
    }

    createComplaint(userId, technicianId, subject, description) {
        const complaint = {
            id: Date.now().toString(),
            userId,
            technicianId,
            subject,
            description,
            status: 'open',
            date: new Date().toISOString()
        };
        return this.db.add(complaint);
    }

    getAllComplaints() {
        return this.db.read();
    }

    getComplaintsByUser(userId) {
        return this.db.findAll('userId', userId);
    }

    getComplaintsByTechnician(technicianId) {
        return this.db.findAll('technicianId', technicianId);
    }

    updateStatus(id, status) {
        return this.db.update('id', id, { status });
    }
}

module.exports = ComplaintManager;
