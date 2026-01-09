const Database = require('./DatabaseLoader');
const UserManager = require('./UserManager');
const TechnicianManager = require('./TechnicianManager');

class JobManager {
    constructor() {
        this.db = new Database('jobs');
        this.userManager = new UserManager();
        this.techManager = new TechnicianManager();
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(job) {
        if (!job) return null;
        const { user_id, technician_id, service_type, contact_name, contact_phone, scheduled_date, scheduled_time, is_custom_offer, visiting_charges, agreement_accepted, created_at, updated_at, ...rest } = job;
        return {
            ...rest,
            userId: user_id,
            technicianId: technician_id,
            serviceType: service_type,
            contactName: contact_name,
            contactPhone: contact_phone,
            scheduledDate: scheduled_date,
            scheduledTime: scheduled_time,
            isCustomOffer: is_custom_offer,
            visitingCharges: visiting_charges,
            agreementAccepted: agreement_accepted,
            createdAt: created_at,
            updatedAt: updated_at,
            // Aliases or computed fields
            customerMobile: contact_phone // Alias
        };
    }

    // Helper to map App camelCase to DB snake_case
    _mapToDb(job) {
        if (!job) return null;
        const { userId, technicianId, serviceType, contactName, contactPhone, customerMobile, scheduledDate, scheduledTime, isCustomOffer, visitingCharges, agreementAccepted, createdAt, updatedAt, id, customer, technician, ...rest } = job;

        const mapped = { ...rest };
        if (userId !== undefined) mapped.user_id = userId;
        if (technicianId !== undefined) mapped.technician_id = technicianId;
        if (serviceType !== undefined) mapped.service_type = serviceType;
        if (contactName !== undefined) mapped.contact_name = contactName;
        // Use contactPhone or customerMobile
        if (contactPhone !== undefined) mapped.contact_phone = contactPhone;
        else if (customerMobile !== undefined) mapped.contact_phone = customerMobile;

        if (scheduledDate !== undefined) mapped.scheduled_date = scheduledDate;
        if (scheduledTime !== undefined) mapped.scheduled_time = scheduledTime;
        if (isCustomOffer !== undefined) mapped.is_custom_offer = isCustomOffer;
        if (visitingCharges !== undefined) mapped.visiting_charges = visitingCharges;
        if (agreementAccepted !== undefined) mapped.agreement_accepted = agreementAccepted;
        if (createdAt !== undefined) mapped.created_at = createdAt;
        if (updatedAt !== undefined) mapped.updated_at = updatedAt;
        // id, customer, technician are typically ignored for writes or handled separately

        return mapped;
    }

    async createJob(userId, serviceType, description, location, scheduledDate, scheduledTime, contactName, contactPhone, offerPrice = null, technicianId = null, visitingCharges = 0, agreementAccepted = false) {
        const user = await this.userManager.getUser(userId);

        const newJob = {
            userId,
            technicianId,
            serviceType,
            description,
            location,
            scheduledDate,
            scheduledTime,
            contactName: contactName || (user ? user.name : ""),
            contactPhone: contactPhone || (user ? user.phone : ""),
            offerPrice,
            visitingCharges: visitingCharges,
            agreementAccepted: agreementAccepted,
            isCustomOffer: !!offerPrice,
            status: 'pending',
            reason: null,
            otp: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const dbJob = this._mapToDb(newJob);
        const saved = await this.db.add(dbJob);
        return await this._enrichJob(this._mapFromDb(saved));
    }

    async _enrichJob(job) {
        if (!job) return null;
        const customer = await this.userManager.getUser(job.userId);

        const enriched = {
            ...job,
            customer,
            contactName: job.contactName || customer?.name || "Customer",
            contactPhone: job.contactPhone || customer?.phone || "",
            customerMobile: job.customerMobile || job.contactPhone || customer?.phone || ""
        };

        if (job.technicianId) {
            const tech = await this.techManager.getTechnician(job.technicianId);
            if (tech) {
                enriched.technician = {
                    name: tech.name,
                    phone: tech.phone,
                    photo: tech.documents?.photo || tech.photo, // Handle new docs structure or old
                    serviceType: tech.serviceType,
                    rating: tech.rating
                };
            }
        }
        return enriched;
    }

    async getJob(id) {
        const job = await this.db.find('id', id);
        return await this._enrichJob(this._mapFromDb(job));
    }

    async getAllJobs() {
        const jobs = await this.db.read();
        // Use Promise.all for parallel enrichment
        return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j))));
    }

    async getJobsByUser(userId) {
        const jobs = await this.db.findAll('user_id', userId);
        return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j))));
    }

    async getJobsByTechnician(technicianId) {
        const jobs = await this.db.findAll('technician_id', technicianId);
        return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j))));
    }

    async getAvailableJobs(serviceType) {
        const allJobs = await this.db.read();
        const mappedJobs = allJobs.map(j => this._mapFromDb(j));

        const filtered = mappedJobs.filter(job =>
            job.status === 'pending' &&
            job.serviceType === serviceType
        );

        return Promise.all(filtered.map(j => this._enrichJob(j)));
    }

    async updateStatus(id, status, details = {}) {
        // details can contain technicianId, reason, otp
        const updates = { status, updatedAt: new Date().toISOString(), ...details };
        const dbUpdates = this._mapToDb(updates);

        const updated = await this.db.update('id', id, dbUpdates);
        return await this._enrichJob(this._mapFromDb(updated));
    }

    async assignTechnician(id, technicianId) {
        return await this.updateStatus(id, 'accepted', { technicianId });
    }

    async getJobStats(technicianId) {
        const jobs = await this.getJobsByTechnician(technicianId);
        const total = jobs.length;
        if (total === 0) return { total: 0, rejected: 0, ratio: 0 };

        const rejected = jobs.filter(j => j.status === 'rejected' || j.status === 'cancelled').length;
        const ratio = rejected / total;

        return { total, rejected, ratio };
    }
}

module.exports = JobManager;
