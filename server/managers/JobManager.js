const Database = require('./DatabaseLoader');
const UserManager = require('./UserManager');
const TechnicianManager = require('./TechnicianManager');

class JobManager {
    constructor() {
        this.db = new Database('jobs');
        this.userManager = new UserManager();
        this.techManager = new TechnicianManager();
    }

    createJob(userId, serviceType, description, location, scheduledDate, scheduledTime, contactName, contactPhone, offerPrice = null, technicianId = null, visitingCharges = 0, agreementAccepted = false) {
        const user = this.userManager.getUser(userId);

        const job = {
            id: Date.now().toString(),
            userId,
            technicianId: technicianId,
            serviceType,
            description,
            location,
            scheduledDate,
            scheduledTime,
            // Store customer details directly in the job for persistence
            contactName: contactName || (user ? user.name : ""),
            contactPhone: contactPhone || (user ? user.phone : ""),
            customerMobile: contactPhone || (user ? user.phone : ""), // Alias for clarity
            offerPrice,
            visitingCharges: visitingCharges,
            agreementAccepted: agreementAccepted,
            isCustomOffer: !!offerPrice,
            status: 'pending', // pending, accepted, rejected, hold, completed
            reason: null, // For rejected/hold
            otp: null, // For completed
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        const saved = this.db.add(job);
        return this._enrichJob(saved);
    }

    _enrichJob(job) {
        if (!job) return null;
        const customer = this.userManager.getUser(job.userId);

        // Ensure job has the latest details even if they were empty at creation
        const enriched = {
            ...job,
            customer,
            // Fallbacks if primary fields are missing
            contactName: job.contactName || customer?.name || "Customer",
            contactPhone: job.contactPhone || customer?.phone || "",
            customerMobile: job.customerMobile || job.contactPhone || customer?.phone || ""
        };

        if (job.technicianId) {
            const tech = this.techManager.getTechnician(job.technicianId);
            if (tech) {
                enriched.technician = {
                    name: tech.name,
                    phone: tech.phone,
                    photo: tech.photo,
                    serviceType: tech.serviceType,
                    rating: tech.rating
                };
            }
        }
        return enriched;
    }

    getJob(id) {
        return this._enrichJob(this.db.find('id', id));
    }

    getAllJobs() {
        return this.db.read().map(j => this._enrichJob(j));
    }

    getJobsByUser(userId) {
        const jobs = this.db.findAll('userId', userId);
        return jobs.map(j => this._enrichJob(j));
    }

    getJobsByTechnician(technicianId) {
        const jobs = this.db.findAll('technicianId', technicianId);
        return jobs.map(j => this._enrichJob(j));
    }

    // specific method to find available jobs for a technician's service type
    getAvailableJobs(serviceType) {
        return this.db.read().filter(job =>
            job.status === 'pending' &&
            job.serviceType === serviceType
        ).map(j => this._enrichJob(j));
    }

    updateStatus(id, status, details = {}) {
        // details can contain technicianId, reason, otp
        const updateData = { status, updatedAt: new Date().toISOString(), ...details };
        const updated = this.db.update('id', id, updateData);
        return this._enrichJob(updated);
    }

    assignTechnician(id, technicianId) {
        return this.updateStatus(id, 'accepted', { technicianId });
    }

    getJobStats(technicianId) {
        const jobs = this.getJobsByTechnician(technicianId);
        const total = jobs.length;
        if (total === 0) return { total: 0, rejected: 0, ratio: 0 };

        const rejected = jobs.filter(j => j.status === 'rejected' || j.status === 'cancelled').length;
        const ratio = rejected / total;

        return { total, rejected, ratio };
    }
}

module.exports = JobManager;
