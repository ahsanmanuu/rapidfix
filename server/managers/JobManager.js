const Database = require('./DatabaseLoader');
const UserManager = require('./UserManager');
const TechnicianManager = require('./TechnicianManager');
const NotificationManager = require('./NotificationManager');
const FinanceManager = require('./FinanceManager');
const ComplaintManager = require('./ComplaintManager');

const InvoiceManager = require('./InvoiceManager');

class JobManager {
    constructor() {
        this.db = new Database('jobs');
        this.userManager = new UserManager();
        this.techManager = new TechnicianManager();
        this.notificationManager = new NotificationManager();
        this.financeManager = new FinanceManager();
        this.complaintManager = new ComplaintManager();
        this.invoiceManager = new InvoiceManager(); // [NEW]
        this.io = null; // Will be set via server/index.js
    }

    setSocketIO(io) {
        this.io = io;
    }

    setTechnicianManager(techManager) {
        this.techManager = techManager;
    }

    setFinanceManager(financeManager) {
        this.financeManager = financeManager;
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
            if (job.reason !== undefined) mapped.reason = job.reason;
            if (job.otp !== undefined) mapped.otp = job.otp;

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
        console.log(`[JobManager] Starting Real-Time AutoAssign for Job #${jobId}`);
        try {
            const job = await this.getJob(jobId);
            if (!job || job.technicianId || job.status !== 'pending') {
                return job;
            }

            const { location, serviceType, technicianId: requestedTechId } = job;

            // --- CONDITION 2 & 3: Direct Assignment (Quick Booking / Tech of Month) ---
            if (requestedTechId) {
                console.log(`[JobManager] Condition 2/3 Met: Direct Assignment requested for ${requestedTechId}`);
                return await this.assignTechnician(jobId, requestedTechId);
            }

            // --- CONDITION 1: Auto-Search & Filter ---
            if (location && (location.latitude || location.lat) && (location.longitude || location.lng)) {
                const lat = location.latitude || location.lat;
                const lon = location.longitude || location.lng;

                // Step A: Search Nearby (Radius 2km)
                const radius = 2.0;
                let candidates = await this.techManager.searchTechnicians(lat, lon, serviceType, radius);

                // Filter only available technicians
                candidates = candidates.filter(t => t.status === 'available');

                console.log(`[AutoAssign] Found ${candidates.length} candidates within ${radius}km for ${serviceType}`);

                // Pre-Fetch Global Stats for Market Share Calculation
                const platformEarnings = await this.financeManager.getPlatformMonthlyEarnings();
                const allJobsThisMonth = await this._getMonthlyJobCountGlobal();

                const qualifiedTechs = [];

                for (const tech of candidates) {
                    // --- CRITERIA CHECKS ---

                    // 1. Check Star Rating (>= 3.0 OR New/0)
                    const rating = tech.rating || 0;
                    if (rating > 0 && rating < 3.0) {
                        // console.debug(`[AutoAssign] Skipping ${tech.name}: Low Rating (${rating})`);
                        continue;
                    }

                    // 2. Check Job Rejection Rate (< 20% in CURRENT MONTH)
                    const jobStats = await this.getJobStats(tech.id, true); // true = current month only
                    // jobStats.ratio is rejection ratio (0.0 to 1.0)
                    // We allow if total jobs is low (< 3) so we don't block new techs on 1 rejection immediately
                    if (jobStats.total >= 3 && jobStats.ratio >= 0.20) {
                        // console.debug(`[AutoAssign] Skipping ${tech.name}: High Monthly Rejection Rate (${(jobStats.ratio * 100).toFixed(1)}%)`);
                        continue;
                    }

                    // 3. Market Share / Workload Caps
                    // Condition: Free < 20%, Premium < 80% (Using Job Volume)
                    const isPremium = tech.membership === 'Premium' || tech.subscription === 'premium';
                    const volumeCap = isPremium ? 0.80 : 0.20;

                    const techMonthlyJobs = await this._getMonthlyJobCount(tech.id);
                    // Avoid division by zero
                    const volumeShare = allJobsThisMonth > 0 ? (techMonthlyJobs / allJobsThisMonth) : 0;

                    // Only apply cap if there is significant volume (e.g., > 10 jobs in system)
                    if (allJobsThisMonth > 10 && volumeShare >= volumeCap) {
                        // console.debug(`[AutoAssign] Skipping ${tech.name}: Over volume cap (${(volumeShare * 100).toFixed(1)}% / ${(volumeCap * 100).toFixed(1)}%)`);
                        continue;
                    }

                    qualifiedTechs.push(tech);
                }

                // If found, pick the best one
                if (qualifiedTechs.length > 0) {
                    // Sort Priority:
                    // 1. Rating (Desc)
                    // 2. Premium Status (Privilege) - Optional but good for business
                    // 3. Distance (Asc)
                    qualifiedTechs.sort((a, b) => {
                        const scoreA = (a.rating || 0) + (a.membership === 'Premium' ? 1 : 0);
                        const scoreB = (b.rating || 0) + (b.membership === 'Premium' ? 1 : 0);
                        return (scoreB - scoreA) || (a.distance - b.distance);
                    });

                    const bestTech = qualifiedTechs[0];

                    console.log(`[JobManager] Auto-pairing Job #${jobId} with ${bestTech.name} (Dist: ${bestTech.distance}km, Rate: ${bestTech.rating})`);

                    // Assign
                    return await this.assignTechnician(jobId, bestTech.id);
                } else {
                    // console.debug(`[JobManager] No qualified technicians found for Job #${jobId} after filtering.`);
                }
            } else {
                // console.debug(`[JobManager] AutoAssign skipped: Missing location data for Job #${jobId}`);
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

            // [NEW] Update Stats
            await this.techManager.updateStats(technicianId, { type: 'assign' });

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

                    // [REFACTORED] Centralized Side Effects
                    if (status === 'completed') {
                        console.log(`[JobManager] Job ${id} completed, updating tech ${enriched.technicianId} stats and status`);
                        await this.techManager.updateStats(enriched.technicianId, { type: 'complete' });
                        await this.techManager.updateStatus(enriched.technicianId, 'available'); // Free up tech

                        // Process Payment (Credit Tech) - 90% of price
                        const amount = enriched.offerPrice || enriched.visitingCharges || 0;
                        if (amount > 0) {
                            await this.financeManager.processPayment(enriched.technicianId, amount * 0.9, 'credit', `Job Compensation #${enriched.id}`);
                            this.io.to(`tech_${enriched.technicianId}`).emit('wallet_updated', { balance: await this.financeManager.getBalance(enriched.technicianId) });
                            this.io.to(`tech_${enriched.technicianId}`).emit('wallet_updated', { balance: await this.financeManager.getBalance(enriched.technicianId) });
                        }

                        // [NEW] Generate and Send Invoice (Async)
                        try {
                            console.log(`[JobManager] Generating invoice for Job ${id}...`);
                            const pdfBuffer = await this.invoiceManager.generateInvoice(enriched);
                            await this.invoiceManager.sendInvoiceEmail(enriched, pdfBuffer);
                            console.log(`[JobManager] Invoice generated and sent for Job ${id}`);
                        } catch (invErr) {
                            console.error(`[JobManager] Invoice generation failed for Job ${id}:`, invErr);
                        }
                    } else if (status === 'rejected') {
                        console.log(`[JobManager] Job ${id} rejected, updating tech ${enriched.technicianId} stats and setting status to available`);
                        await this.techManager.updateStats(enriched.technicianId, { type: 'reject' });
                        await this.techManager.updateStatus(enriched.technicianId, 'available'); // Free up tech
                    }
                    else if (status === 'accepted') {
                        console.log(`[JobManager] Job ${id} accepted, updating tech ${enriched.technicianId} stats and setting status to engaged`);
                        await this.techManager.updateStats(enriched.technicianId, { type: 'accept' });
                        await this.techManager.updateStatus(enriched.technicianId, 'engaged'); // Engage tech
                    } else if (status === 'in_progress') {
                        console.log(`[JobManager] Job ${id} in progress, setting tech ${enriched.technicianId} status to engaged`);
                        await this.techManager.updateStatus(enriched.technicianId, 'engaged');
                    }
                }
                this.io.emit('admin_job_update', enriched);
                this.io.emit('job_status_updated_admin', enriched); // Sync with Admin listener
            }

            // [NEW] Persist Notifications
            if (enriched.userId) {
                await this.notificationManager.createNotification(enriched.userId, 'user', `Job ${status.replace('_', ' ')}`, `Your job #${enriched.id} is now ${status.replace('_', ' ')}`, `job_${status}`, enriched.id);
            }
            if (enriched.technicianId) {
                await this.notificationManager.createNotification(enriched.technicianId, 'technician', `Job ${status.replace('_', ' ')}`, `Job #${enriched.id} is now ${status.replace('_', ' ')}`, `job_${status}`, enriched.id);
            }
            // Admin Notification
            await this.notificationManager.createNotification('admin', 'admin', `Job ${status.replace('_', ' ')}`, `Job #${enriched.id} updated to ${status}`, `job_status_update`, enriched.id);
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

    async getJobStats(technicianId, monthOnly = false) {
        try {
            const jobs = await this.getJobsByTechnician(technicianId);
            let filteredJobs = jobs; // Default to all

            if (monthOnly) {
                const now = new Date();
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
                filteredJobs = jobs.filter(j => j.createdAt >= startOfMonth || j.created_at >= startOfMonth);
            }

            const total = filteredJobs.length;
            if (total === 0) return { total: 0, rejected: 0, completed: 0, ratio: 0 };
            const rejected = filteredJobs.filter(j => j.status === 'rejected' || j.status === 'cancelled').length;
            const completed = filteredJobs.filter(j => j.status === 'completed').length;
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

    // [NEW] Get jobs within specific radius
    async getJobsByLocation(lat, lng, radiusKm = 30) {
        try {
            const allJobs = await this.getAllJobs();
            if (!lat || !lng) return allJobs;

            const searchLat = parseFloat(lat);
            const searchLng = parseFloat(lng);

            return allJobs.filter(j => {
                let jLat = null;
                let jLon = null;

                // 1. Prioritize Job Location
                if (j.location && (j.location.latitude || j.location.lat)) {
                    jLat = parseFloat(j.location.latitude || j.location.lat);
                    jLon = parseFloat(j.location.longitude || j.location.lng);
                }
                // 2. Fallback to Customer Location
                else if (j.customer && j.customer.latitude) {
                    jLat = parseFloat(j.customer.latitude);
                    jLon = parseFloat(j.customer.longitude);
                }

                if (jLat === null || jLon === null || isNaN(jLat) || isNaN(jLon)) return false;

                // Simple Distance Calc
                const R = 6371;
                const dLat = (jLat - searchLat) * (Math.PI / 180);
                const dLon = (jLon - searchLng) * (Math.PI / 180);
                const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                    Math.cos(searchLat * (Math.PI / 180)) * Math.cos(jLat * (Math.PI / 180)) *
                    Math.sin(dLon / 2) * Math.sin(dLon / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const dist = R * c;

                return dist <= radiusKm;
            });
        } catch (err) {
            console.error("[JobManager] Error getting jobs by location:", err);
            return [];
        }
    }
}

module.exports = JobManager;
