const Database = require('./DatabaseLoader');
const UserManager = require('./UserManager');
const TechnicianManager = require('./TechnicianManager');
const NotificationManager = require('./NotificationManager');

class JobManager {
    constructor() {
        this.db = new Database('jobs');
        this.userManager = new UserManager();
        this.techManager = new TechnicianManager();
        this.notificationManager = new NotificationManager();
        this.io = null; // Will be set via server/index.js
    }

    setSocketIO(io) {
        this.io = io;
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(job) {
        if (!job) return null;
        const { user_id, technician_id, service_type, contact_name, contact_phone, scheduled_date, scheduled_time, created_at, updated_at, ...rest } = job;
        return {
            ...rest,
            userId: user_id,
            technicianId: technician_id,
            serviceType: service_type,
            contactName: contact_name,
            contactPhone: contact_phone,
            scheduledDate: scheduled_date,
            scheduledTime: scheduled_time,
            createdAt: created_at,
            updatedAt: updated_at,
            // Aliases or computed fields
            customerMobile: contact_phone // Alias
        };
    }

    // Helper to map App camelCase to DB snake_case
    // Helper to map App camelCase to DB snake_case
    _mapToDb(job) {
        if (!job) return null;

        // Strict Allow-list Mapping
        // Only map fields that we KNOW exist in the Supabase Schema
        const mapped = {};

        if (job.userId !== undefined) mapped.user_id = job.userId;
        if (job.technicianId !== undefined) mapped.technician_id = job.technicianId;
        if (job.serviceType !== undefined) mapped.service_type = job.serviceType;
        if (job.status !== undefined) mapped.status = job.status;

        // Use contactPhone or customerMobile
        if (job.contactPhone !== undefined) mapped.contact_phone = job.contactPhone;
        else if (job.customerMobile !== undefined) mapped.contact_phone = job.customerMobile;

        if (job.contactName !== undefined) mapped.contact_name = job.contactName;

        if (job.scheduledDate !== undefined) mapped.scheduled_date = job.scheduledDate;
        if (job.scheduledTime !== undefined) mapped.scheduled_time = job.scheduledTime;

        // Include location if it exists (JSONB or Text)
        if (job.location) {
            mapped.location = job.location;
            // Unpack location fields if they exist as separate columns
            if (job.location.address) mapped.address = job.location.address;
        }

        // Also check top-level address (ServiceBookingForm sends it here)
        if (job.address) {
            mapped.address = job.address;
        } else if (!mapped.address) {
            // Safety Fallback: Use location description or generic text to satisfy NOT NULL constraint
            mapped.address = job.location?.address || job.location?.city || "No address provided - See Map";
        }

        if (job.createdAt !== undefined) mapped.created_at = job.createdAt;
        if (job.updatedAt !== undefined) mapped.updated_at = job.updatedAt;

        return mapped;
    }

    async createJob(userId, serviceType, description, location, address, scheduledDate, scheduledTime, contactName, contactPhone) {
        const user = await this.userManager.getUser(userId);

        const newJob = {
            userId,
            serviceType,
            location,
            address,
            scheduledDate,
            scheduledTime,
            contactName: contactName || (user ? user.name : ""),
            contactPhone: contactPhone || (user ? user.phone : ""),
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const dbJob = this._mapToDb(newJob);
        const saved = await this.db.add(dbJob);
        const job = await this._enrichJob(this._mapFromDb(saved));

        // [AUTOMATED] Run Smart Assignment Flow immediately
        // We don't await this so the job creation is fast for the user
        this.autoAssignJob(job.id).catch(err => console.error(`[JobManager] AutoAssign background error for ${job.id}:`, err));

        return job;
    }

    async autoAssignJob(jobId) {
        try {
            const job = await this.getJob(jobId);
            if (!job || job.technicianId) return job; // Already assigned or missing

            console.log(`[JobManager] AutoAssign Processing Job #${jobId} (${job.serviceType})`);
            const { location, serviceType, technicianId: requestedTechId } = job;

            // 1. Specific Technician Requested?
            if (requestedTechId) {
                await this.assignTechnician(job.id, requestedTechId);
                await this.techManager.updateStatus(requestedTechId, 'engaged');

                if (this.io) {
                    this.io.emit('technician_status_update', { technicianId: requestedTechId, status: 'engaged' });
                    this.io.to(`tech_${requestedTechId}`).emit('new_job_assigned', job);
                }

                this.notificationManager.createNotification(requestedTechId, 'technician', 'New Job Assigned', `Job #${job.id} assigned to you`, 'job_assigned', job.id);
                return { ...job, technicianId: requestedTechId, status: 'accepted' };
            }

            // 2. Background Smart Matching
            if (location && location.latitude && location.longitude) {
                let nearbyTechnicians = await this.techManager.searchTechnicians(location.latitude, location.longitude, serviceType);
                nearbyTechnicians = nearbyTechnicians.filter(t => t.status !== 'engaged');

                if (nearbyTechnicians.length > 0) {
                    const candidates = await Promise.all(nearbyTechnicians.map(async tech => {
                        const stats = await this.getJobStats(tech.id);
                        return { ...tech, rating: tech.rating || 0, price: tech.visitingCharges || 9999, cancelRatio: stats.ratio };
                    }));

                    candidates.sort((a, b) => {
                        const aTop = a.rating >= 4.0 && a.cancelRatio <= 0.15;
                        const bTop = b.rating >= 4.0 && b.cancelRatio <= 0.15;
                        if (aTop && !bTop) return -1;
                        if (!aTop && bTop) return 1;
                        return (a.distance || 0) - (b.distance || 0);
                    });

                    const bestTech = candidates[0];
                    console.log(`[JobManager] Best Match Found: ${bestTech.name} (${bestTech.distance}km)`);

                    await this.assignTechnician(job.id, bestTech.id);
                    await this.techManager.updateStatus(bestTech.id, 'engaged');

                    if (this.io) {
                        this.io.emit('technician_status_update', { technicianId: bestTech.id, status: 'engaged' });
                        this.io.to(`tech_${bestTech.id}`).emit('new_job_assigned', { ...job, technicianId: bestTech.id, status: 'accepted' });
                    }

                    this.notificationManager.createNotification(bestTech.id, 'technician', 'Auto-Assigned Job', `You have been automatically assigned Job #${job.id}`, 'job_assigned', job.id);

                    return { ...job, technicianId: bestTech.id, status: 'accepted' };
                } else {
                    console.log(`[JobManager] No available technicians found for Job #${jobId}`);
                }
            }
            return job;
        } catch (err) {
            console.error(`[JobManager] AutoAssign Error for Job #${jobId}:`, err);
            return null;
        }
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

    async getUnassignedJobs() {
        const jobs = await this.db.findAll('status', 'pending');
        // Double check technicianId is null (Supabase findAll doesn't support IS NULL easily in this wrapper)
        return jobs.filter(j => !j.technician_id || j.technician_id === null);
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
