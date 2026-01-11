const Database = require('./DatabaseLoader');
const UserManager = require('./UserManager');
const TechnicianManager = require('./TechnicianManager');
const NotificationManager = require('./NotificationManager');
const FinanceManager = require('./FinanceManager');
const ComplaintManager = require('./ComplaintManager');

class JobManager {
    constructor() {
        this.db = new Database('jobs');
        this.userManager = new UserManager();
        this.techManager = new TechnicianManager();
        this.notificationManager = new NotificationManager();
        this.financeManager = new FinanceManager();
        this.complaintManager = new ComplaintManager();
        this.io = null; // Will be set via server/index.js
    }

    setSocketIO(io) {
        this.io = io;
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(job) {
        if (!job) return null;
        try {
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
                createdAt: created_at || job.createdAt,
                updatedAt: updated_at || job.updatedAt,
                customerMobile: contact_phone || job.customerMobile
            };
        } catch (err) {
            console.error("[JobManager] Error mapping from DB:", err);
            return job;
        }
    }

    // Helper to map App camelCase to DB snake_case
    _mapToDb(job) {
        if (!job) return null;
        try {
            const mapped = {};
            if (job.userId !== undefined) mapped.user_id = job.userId;
            if (job.technicianId !== undefined) mapped.technician_id = job.technicianId;
            if (job.serviceType !== undefined) mapped.service_type = job.serviceType;
            if (job.status !== undefined) mapped.status = job.status;
            if (job.contactPhone !== undefined) mapped.contact_phone = job.contactPhone;
            else if (job.customerMobile !== undefined) mapped.contact_phone = job.customerMobile;
            if (job.contactName !== undefined) mapped.contact_name = job.contactName;
            if (job.scheduledDate !== undefined) mapped.scheduled_date = job.scheduledDate;
            if (job.scheduledTime !== undefined) mapped.scheduled_time = job.scheduledTime;

            if (job.location) {
                mapped.location = job.location;
                if (job.location.address) mapped.address = job.location.address;
            }
            if (job.address) {
                mapped.address = job.address;
            } else if (!mapped.address) {
                mapped.address = job.location?.address || job.location?.city || "No address provided";
            }
            if (job.createdAt !== undefined) mapped.created_at = job.createdAt;
            if (job.updatedAt !== undefined) mapped.updated_at = job.updatedAt;
            return mapped;
        } catch (err) {
            console.error("[JobManager] Error mapping to DB:", err);
            return job;
        }
    }

    async createJob(userId, serviceType, description, location, address, scheduledDate, scheduledTime, contactName, contactPhone) {
        try {
            const user = await this.userManager.getUser(userId);
            const newJob = {
                userId,
                serviceType,
                description,
                location,
                address,
                scheduledDate,
                scheduledTime,
                contactName: contactName || (user ? user.name : "Customer"),
                contactPhone: contactPhone || (user ? user.phone : ""),
                status: 'pending',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const dbJob = this._mapToDb(newJob);
            const saved = await this.db.add(dbJob);
            const job = await this._enrichJob(this._mapFromDb(saved));

            // Real-time broadcast for new job
            if (this.io) {
                this.io.emit('new_job_created', job);
                this.io.to(`user_${userId}`).emit('job_status_updated', job);
            }

            // [AUTOMATED] Run Smart Assignment Flow immediately
            this.autoAssignJob(job.id).catch(err => console.error(`[JobManager] AutoAssign background error for ${job.id}:`, err));

            return job;
        } catch (err) {
            console.error("[JobManager] Error creating job:", err);
            throw err;
        }
    }

    async autoAssignJob(jobId) {
        console.log(`[JobManager] Starting Advanced AutoAssign for Job #${jobId}`);
        try {
            const job = await this.getJob(jobId);
            if (!job || job.technicianId || job.status !== 'pending') {
                return job;
            }

            const { location, serviceType, technicianId: requestedTechId } = job;

            // 1. Direct Assignment if Requested
            if (requestedTechId) {
                return await this.assignTechnician(jobId, requestedTechId);
            }

            // 2. Advanced Search & Filter
            if (location && (location.latitude || location.lat) && (location.longitude || location.lng)) {
                const lat = location.latitude || location.lat;
                const lon = location.longitude || location.lng;

                // Get Potential Candidates (Available + Nearby + Service Match)
                // [FIX] STRICTLY restricted radius to 2km ONLY as per user request
                const radius = 2.0;
                let candidates = await this.techManager.searchTechnicians(lat, lon, serviceType, radius);
                candidates = candidates.filter(t => t.status === 'available');

                // Pre-Fetch Data required for filtering
                const platformEarnings = await this.financeManager.getPlatformMonthlyEarnings();
                const allJobsThisMonth = await this._getMonthlyJobCountGlobal();

                const qualifiedTechs = [];

                for (const tech of candidates) {
                    // --- CRITERIA CHECKS ---

                    // 1. Rating > 3.5
                    if ((tech.rating || 0) <= 3.5) continue;

                    // 2. Job Rejection Rate < 40%
                    const jobStats = await this.getJobStats(tech.id);
                    // jobStats.ratio is rejection ratio (0.0 to 1.0)
                    if (jobStats.ratio >= 0.40) continue;

                    // 3. Completion Rate > 50% ("Served more than 50%")
                    // Completion = Completed / Assigned
                    const completionRate = jobStats.total > 0 ? (jobStats.completed / jobStats.total) : 1; // Give benefit of doubt to new techs
                    if (completionRate <= 0.50) continue;

                    // 4. Complaints < 30%
                    const complaintStats = await this.complaintManager.getComplaintStats(tech.id);
                    const complaintRate = jobStats.completed > 0 ? (complaintStats.total / jobStats.completed) : 0;
                    if (complaintRate >= 0.30) continue;

                    // 5. Monthly Job Volume Cap
                    // Rule: Max 10% for Standard, 100% (No Cap) for Premium
                    const isPremium = tech.membership === 'Premium' || tech.subscription === 'premium';
                    const volumeCap = isPremium ? 1.0 : 0.10;

                    const techMonthlyJobs = await this._getMonthlyJobCount(tech.id);
                    const volumeShare = allJobsThisMonth > 0 ? (techMonthlyJobs / allJobsThisMonth) : 0;

                    if (volumeShare >= volumeCap) {
                        console.log(`[AutoAssign] Skipping ${tech.name}: Over volume cap (${(volumeShare * 100).toFixed(1)}% / ${(volumeCap * 100).toFixed(1)}%)`);
                        continue;
                    }

                    // 6. Monthly Earning Cap (Earning is not more than 80%)
                    // Assume: Tech Earnings / Total Platform Earnings < 80% (Anti-Monopoly)
                    const techEarnings = await this.financeManager.getMonthlyEarnings(tech.id);
                    const earningShare = platformEarnings > 0 ? (techEarnings / platformEarnings) : 0;
                    if (earningShare >= 0.80) {
                        console.log(`[AutoAssign] Skipping ${tech.name}: Over earning cap (${(earningShare * 100).toFixed(1)}%)`);
                        continue;
                    }

                    qualifiedTechs.push(tech);
                }

                if (qualifiedTechs.length > 0) {
                    // Sort by Rating (High) -> Distance (Low)
                    qualifiedTechs.sort((a, b) => (b.rating || 0) - (a.rating || 0) || (a.distance - b.distance));
                    const bestTech = qualifiedTechs[0];

                    console.log(`[JobManager] Auto-pairing Job #${jobId} with ${bestTech.name} (Qualified Candidate)`);
                    const result = await this.assignTechnician(jobId, bestTech.id);
                    return result;
                } else {
                    console.log(`[JobManager] No qualified technicians found for Job #${jobId} after filtering.`);
                }
            }
            return job;
        } catch (err) {
            console.error(`[JobManager] AutoAssign Critical Failure for Job #${jobId}:`, err);
            return null;
        }
    }

    // New Helpers for Algo
    async _getMonthlyJobCount(technicianId) {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const jobs = await this.db.findAll('technician_id', technicianId);
            return jobs.filter(j => j.created_at >= startOfMonth).length;
        } catch (e) { return 0; }
    }
    async _getMonthlyJobCountGlobal() {
        try {
            const now = new Date();
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const jobs = await this.db.read();
            return jobs.filter(j => j.created_at >= startOfMonth).length;
        } catch (e) { return 1; }
    }

    async assignTechnician(jobId, technicianId) {
        try {
            console.log(`[JobManager] Assigning Technician ${technicianId} to Job ${jobId}`);
            const updatedJob = await this.updateStatus(jobId, 'accepted', { technicianId });
            await this.techManager.updateStatus(technicianId, 'engaged');

            if (this.io) {
                this.io.emit('technician_status_update', { technicianId, status: 'engaged' });
                this.io.to(`tech_${technicianId}`).emit('new_job_assigned', updatedJob);
                this.io.to(`user_${updatedJob.userId}`).emit('job_status_updated', updatedJob);
                this.io.emit('admin_job_update', updatedJob);
            }

            await this.notificationManager.createNotification(technicianId, 'technician', 'New Job Assigned', `Job #${jobId} has been assigned to you.`, 'job_assigned', jobId);

            return updatedJob;
        } catch (err) {
            console.error(`[JobManager] Error assigning technician ${technicianId} to job ${jobId}:`, err);
            throw err;
        }
    }

    async _enrichJob(job) {
        if (!job) return null;
        try {
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
                        id: tech.id,
                        name: tech.name,
                        phone: tech.phone,
                        photo: tech.documents?.photo || tech.photo,
                        serviceType: tech.serviceType,
                        rating: tech.rating
                    };
                }
            }
            return enriched;
        } catch (err) {
            console.error("[JobManager] Error enriching job:", err);
            return job;
        }
    }

    async getJob(id) {
        try {
            const job = await this.db.find('id', id);
            return await this._enrichJob(this._mapFromDb(job));
        } catch (err) {
            console.error(`[JobManager] Error getting job ${id}:`, err);
            return null;
        }
    }

    async getAllJobs() {
        try {
            const jobs = await this.db.read();
            return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j))));
        } catch (err) {
            console.error("[JobManager] Error getting all jobs:", err);
            return [];
        }
    }

    async updateStatus(id, status, details = {}) {
        try {
            const updates = { status, updatedAt: new Date().toISOString(), ...details };
            const dbUpdates = this._mapToDb(updates);
            const updated = await this.db.update('id', id, dbUpdates);
            const enriched = await this._enrichJob(this._mapFromDb(updated));

            if (this.io) {
                this.io.to(`user_${enriched.userId}`).emit('job_status_updated', enriched);
                if (enriched.technicianId) {
                    this.io.to(`tech_${enriched.technicianId}`).emit('job_status_updated', enriched);
                }
                this.io.emit('admin_job_update', enriched);
            }
            return enriched;
        } catch (err) {
            console.error(`[JobManager] Error updating status for job ${id}:`, err);
            throw err;
        }
    }

    async updateJob(id, data) {
        try {
            const updates = {
                ...this._mapToDb(data),
                updated_at: new Date().toISOString()
            };
            delete updates.id; // Protect ID

            const result = await this.db.update('id', id, updates);
            const enriched = await this._enrichJob(this._mapFromDb(result));

            if (this.io) {
                this.io.to(`user_${enriched.userId}`).emit('job_updated', enriched);
                if (enriched.technicianId) {
                    this.io.to(`tech_${enriched.technicianId}`).emit('job_updated', enriched);
                }
                this.io.emit('admin_job_update', enriched);
            }
            return enriched;
        } catch (err) {
            console.error(`[JobManager] Error updating job ${id}:`, err);
            throw err;
        }
    }

    async getJobStats(technicianId) {
        try {
            const jobs = await this.getJobsByTechnician(technicianId);
            const total = jobs.length;
            if (total === 0) return { total: 0, rejected: 0, completed: 0, ratio: 0 };
            const rejected = jobs.filter(j => j.status === 'rejected' || j.status === 'cancelled').length;
            const completed = jobs.filter(j => j.status === 'completed').length;
            return { total, rejected, completed, ratio: rejected / total };
        } catch (err) {
            console.error(`[JobManager] Error getting stats for tech ${technicianId}:`, err);
            return { total: 0, rejected: 0, ratio: 0 };
        }
    }

    async getJobsByTechnician(technicianId) {
        try {
            const jobs = await this.db.findAll('technician_id', technicianId);
            return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j))));
        } catch (err) {
            console.error(`[JobManager] Error getting jobs for tech ${technicianId}:`, err);
            return [];
        }
    }

    async getJobsByUser(userId) {
        try {
            const jobs = await this.db.findAll('user_id', userId);
            return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j))));
        } catch (err) {
            console.error(`[JobManager] Error getting jobs for user ${userId}:`, err);
            return [];
        }
    }

    async getUnassignedJobs() {
        try {
            const allJobs = await this.db.read();
            return allJobs
                .filter(j => j.status === 'pending' && !j.technician_id)
                .map(j => this._mapFromDb(j));
        } catch (err) {
            console.error('[JobManager] Error getting unassigned jobs:', err);
            return [];
        }
    }
}

module.exports = JobManager;
