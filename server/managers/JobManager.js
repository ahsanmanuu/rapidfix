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
        this.complaintManager = new ComplaintManager();
        this.invoiceManager = null; // Injected via setInvoiceManager
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

    setInvoiceManager(invoiceManager) {
        this.invoiceManager = invoiceManager;
        console.log('[JobManager] InvoiceManager injected successfully');
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(job) {
        if (!job) return null;
        try {
            const { user_id, technician_id, service_type, contact_name, contact_phone, scheduled_date, scheduled_time, created_at, updated_at, otp, visiting_charges, spare_parts_cost, tax, total_cost, ...rest } = job;

            // Calc total if not stored
            const vCharges = Number(visiting_charges || 0);
            const spareCost = Number(spare_parts_cost || 0);
            const jobTax = Number(tax || 0);
            const total = Number(total_cost || (vCharges + spareCost + jobTax));

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
                customerMobile: contact_phone || job.customerMobile,
                description: job.description, // Customer Note
                professionalNote: job.professional_note || job.professionalNote,
                timeline: job.timeline || [],
                visitingCharges: vCharges,
                sparePartsCost: spareCost,
                tax: jobTax,
                totalCost: total,
                otp: otp,
                feedbackGiven: job.feedback_given || false
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

            if (job.visitingCharges !== undefined) mapped.visiting_charges = job.visitingCharges;
            if (job.sparePartsCost !== undefined) mapped.spare_parts_cost = job.sparePartsCost;
            if (job.tax !== undefined) mapped.tax = job.tax;
            if (job.totalCost !== undefined) mapped.total_cost = job.totalCost;

            // Address Handling
            if (job.location) {
                mapped.location = job.location;
                if (job.location.address) mapped.address = job.location.address;
            }
            if (job.address) {
                mapped.address = job.address;
            } else if (!mapped.address) {
                mapped.address = job.location?.address || job.location?.city || "No address provided";
            }
            if (job.description) {
                // We keep description column separate in DB usually, but for fallback:
                // If there IS a description col, use it. If not, append.
                // Assuming description column exists in Supabase based on createJob below.
                mapped.description = job.description;
            }

            if (job.professionalNote !== undefined) {
                mapped.professional_note = job.professionalNote;
            }
            if (job.timeline !== undefined) {
                mapped.timeline = job.timeline;
            }
            if (job.feedbackGiven !== undefined) {
                mapped.feedback_given = !!job.feedbackGiven;
            }

            if (job.createdAt !== undefined) mapped.created_at = job.createdAt;
            if (job.updatedAt !== undefined) mapped.updated_at = job.updatedAt;
            return mapped;
        } catch (err) {
            console.error("[JobManager] Error mapping to DB:", err);
            return job;
        }
    }

    async createJob(userId, serviceType, description, location, address, scheduledDate, scheduledTime, contactName, contactPhone, offerPrice, technicianId, visitingCharges, agreementAccepted) {
        console.log(`[JobManager] createJob starting.`);
        try {
            console.log(`[JobManager] creating job for user ${userId}, service: ${serviceType}, schedule: ${scheduledDate} ${scheduledTime}`);

            // [ALGO] Validation Pipeline
            this._validateSchedule(scheduledDate, scheduledTime);

            const user = await this.userManager.getUser(userId);

            // Generate OTP
            const otp = Math.floor(1000 + Math.random() * 9000).toString();

            // Visiting Charges default
            const vCharges = visitingCharges || offerPrice || 0;
            // Tax & Total (Initial)
            const tax = vCharges * 0.0; // 0% initially or 10%? User prompt said 10% in UI, let's store 0 and calc in UI or consistenly here. 
            // Actually, let's keep it simple: Store what we know.

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
                technicianId,
                status: 'pending',
                otp, // New Field
                visitingCharges: vCharges,
                sparePartsCost: 0,
                tax: 0,
                totalCost: vCharges, // Initial Total
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const dbJob = this._mapToDb(newJob);
            // Include new columns in insert
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, otp, visiting_charges, spare_parts_cost, tax, total_cost, description';

            console.log(`[JobManager] Inserting Job with OTP: ${otp}`);
            const saved = await this.db.add(dbJob, columns);
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
            if (err.details) console.error("[JobManager] DB Error Details:", err.details);
            if (err.hint) console.error("[JobManager] DB Error Hint:", err.hint);
            throw err;
        }
    }

    async autoAssignJob(jobId) {
        console.log(`[JobManager] Starting Advanced Real-Time AutoAssign for Job #${jobId}`);
        try {
            const job = await this.getJob(jobId);
            if (!job || job.technicianId || job.status !== 'pending') return job;

            // [ALGO IMPROVEMENT] Handle Scheduling
            const isFutureBooking = job.scheduledDate && new Date(job.scheduledDate).toDateString() !== new Date().toDateString();
            if (isFutureBooking) {
                console.log(`[JobManager] Job #${jobId} is for a future date (${job.scheduledDate}). Skipping immediate auto-assignment.`);
                // Future jobs are left in 'pending' for manual admin assignment or a separate cron-style scheduler.
                return job;
            }

            const { location, serviceType, technicianId: requestedTechId } = job;

            // --- CONDITION 2 & 3: Direct Assignment (Quick Booking / Tech of Month) ---
            if (requestedTechId) {
                console.log(`[JobManager] Direct Assignment requested for ${requestedTechId}`);
                // [Flow 2] - Availability check is handled inside assignTechnician
                return await this.assignTechnician(jobId, requestedTechId);
            }

            // --- CONDITION 1: Auto-Search & Filter ---
            if (location && (location.latitude || location.lat) && (location.longitude || location.lng)) {
                const lat = parseFloat(location.latitude || location.lat);
                const lon = parseFloat(location.longitude || location.lng);

                // Step A: Search Nearby (Radius 30km [FIXED])
                const radius = 30.0;
                let candidates = await this.techManager.searchTechnicians(lat, lon, serviceType, radius);

                // Only consider 'available' techs for auto-assignment
                // Busy techs are excluded from Flow 1 (Generic Search)
                candidates = candidates.filter(t => t.status === 'available');
                console.log(`[AutoAssign] Found ${candidates.length} candidates within ${radius}km for ${serviceType}`);

                const allJobsThisMonth = await this._getMonthlyJobCountGlobal();
                const qualifiedTechs = [];

                for (const tech of candidates) {
                    // --- CRITERIA CHECKS ---

                    // 1. Star Rating Filter (> 3.0 OR New/0)
                    const rating = tech.rating || 0;
                    if (rating > 0 && rating < 3.0) {
                        continue;
                    }

                    // 2. Rejection Rate Filter (< 20% in CURRENT MONTH)
                    const jobStats = await this.getJobStats(tech.id, true);
                    if (jobStats.total >= 3 && jobStats.ratio >= 0.20) {
                        continue;
                    }

                    // 3. Market Share / Workload Caps
                    // Condition: Free < 20%
                    const isPremium = tech.membership === 'Premium' || tech.subscription === 'premium';

                    // Condition B: Underutilized Logic (Implicit - they pass simpler checks)

                    // Condition C: Free Tier Cap
                    if (!isPremium) {
                        const techMonthlyJobs = await this._getMonthlyJobCount(tech.id);
                        const regionTotal = Math.max(allJobsThisMonth, 1);
                        const share = techMonthlyJobs / regionTotal;

                        // Strict: If > 10 jobs exist and tech has >= 20% share, SKIP
                        if (allJobsThisMonth > 10 && share >= 0.20) {
                            console.log(`[AutoAssign] Filtered ${tech.name}: Market Cap Hit (${(share * 100).toFixed(1)}%)`);
                            continue;
                        }
                    }

                    qualifiedTechs.push(tech);
                }

                // If found, pick the best one
                if (qualifiedTechs.length > 0) {
                    // Sort Priority:
                    // 1. Premium Status (Privilege)
                    // 2. Rating (Desc)
                    // 3. Distance (Asc)
                    qualifiedTechs.sort((a, b) => {
                        const isPremA = (a.membership === 'Premium' || a.subscription === 'premium') ? 1 : 0;
                        const isPremB = (b.membership === 'Premium' || b.subscription === 'premium') ? 1 : 0;

                        if (isPremA !== isPremB) return isPremB - isPremA;
                        if ((b.rating || 0) !== (a.rating || 0)) return (b.rating || 0) - (a.rating || 0);
                        return a.distance - b.distance;
                    });

                    const winner = qualifiedTechs[0];
                    console.log(`[JobManager] Winner Selected: ${winner.name} (Premium: ${winner.membership}, Dist: ${winner.distance}km)`);
                    return await this.assignTechnician(jobId, winner.id);
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

    async assignTechnician(jobId, technicianId) {
        try {
            console.log(`[JobManager] Assigning Technician ${technicianId} to Job ${jobId}`);

            const tech = await this.techManager.getTechnician(technicianId);
            const techStatus = (tech?.status || 'available').toLowerCase();
            // Check if tech is busy (Flow 4)
            const isBusy = ['engaged', 'finishing_work', 'finishing work'].includes(techStatus);

            let newJobStatus = 'accepted';
            let flowType = 'Direct Assignment';

            if (isBusy) {
                // Flow 4: Queue Management
                console.log(`[JobManager] Tech ${technicianId} is BUSY (${techStatus}). Activating Queue Logic.`);
                newJobStatus = 'waiting_confirmation';
                flowType = 'Queue Request';
                // Tech status remains 'engaged' or 'finishing_work'
            } else {
                // Standard Assignment
                newJobStatus = 'accepted';
                await this.techManager.updateStatus(technicianId, 'engaged');
            }

            const updatedJob = await this.updateStatus(jobId, newJobStatus, { technicianId });

            if (this.io) {
                // Only broadcast 'engaged' if they weren't already busy
                if (!isBusy) this.io.emit('technician_status_update', { technicianId, status: 'engaged' });

                this.io.to(`tech_${technicianId}`).emit('new_job_assigned', { ...updatedJob, flowType });
                this.io.to(`user_${updatedJob.userId}`).emit('job_status_updated', updatedJob);
                this.io.emit('admin_job_update', updatedJob);
            }

            const notifTitle = isBusy ? 'New Job Queued 🕒' : 'New Job Assigned ✅';
            const notifBody = isBusy
                ? `Job #${jobId} added to your queue. Please accept when you finish current work.`
                : `Job #${jobId} has been assigned to you.`;

            await this.notificationManager.createNotification(technicianId, 'technician', notifTitle, notifBody, 'job_assigned', jobId);

            // Update Stats
            await this.techManager.updateStats(technicianId, { type: 'assign' });

            return updatedJob;
        } catch (err) {
            console.error("[JobManager] Assign Error:", err);
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
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at';
            const job = await this.db.find('id', id, columns);
            return await this._enrichJob(this._mapFromDb(job));
        } catch (err) {
            console.error(`[JobManager] Error getting job ${id}:`, err);
            return null;
        }
    }

    async getAllJobs() {
        try {
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at';
            const jobs = await this.db.read(columns);
            return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j))));
        } catch (err) {
            console.error("[JobManager] Error getting all jobs:", err);
            return [];
        }
    }

    async updateStatus(id, status, details = {}) {
        try {
            // Read current job to append to timeline
            // Read current job to append to timeline (bypass timeline column if missing in cache)
            const columns = 'id, user_id, technician_id, service_type, status';
            const currentJob = await this.db.find('id', id, columns);
            // Since timeline column is problematic in Supabase cache, we manage it in app memory or merge into metadata
            let currentTimeline = [];
            try {
                // If we really need it, we'd have to store it in a JSONB 'metadata' or similar. 
                // For now, let's assume empty or manage it without the dedicated column.
                if (currentJob && currentJob.timeline) currentTimeline = currentJob.timeline;
            } catch (e) {
                currentTimeline = [];
            }

            // Avoid duplicate status entries if called multiple times (optional, but good for cleanliness)
            // But timeline shows history, so repeats might be valid if status changes back and forth.

            const labelMap = {
                'pending': 'Request Received',
                'assigned': 'Pro Assigned',
                'accepted': 'Pro Assigned',
                'in_progress': 'Work Started',
                'completed': 'Completed',
                'rejected': 'Rejected',
                'cancelled': 'Cancelled'
            };

            const newEvent = {
                status,
                label: labelMap[status] || status.replace('_', ' '),
                timestamp: new Date().toISOString()
            };

            const updates = {
                status,
                updatedAt: new Date().toISOString(),
                // timeline is now omitted because it's not in Supabase schema cache
                ...details
            };
            const dbUpdates = this._mapToDb(updates);
            // Add new columns to allowed update list
            const updateCols = 'id, user_id, technician_id, status, updated_at, visiting_charges, spare_parts_cost, tax, total_cost';
            const updated = await this.db.update('id', id, dbUpdates, updateCols);
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
                        if (this.invoiceManager) {
                            // Don't await in critical path to keep response fast, but handle errors
                            (async () => {
                                try {
                                    console.log(`[JobManager] Generating invoice for Job ${id}...`);
                                    const pdfBuffer = await this.invoiceManager.generateInvoice(enriched);
                                    const result = await this.invoiceManager.sendInvoiceEmail(enriched, pdfBuffer);
                                    console.log(`[JobManager] Invoice processing for Job ${id}:`, result);
                                } catch (invErr) {
                                    console.error(`[JobManager] Invoice generation failed for Job ${id}:`, invErr);
                                }
                            })();
                        } else {
                            console.error('[JobManager] InvoiceManager not injected! Cannot send invoice.');
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
        // [CRITICAL FIX] Delegate to updateStatus if status is changing.
        // This ensures side effects (Invoice, Tech Status, Payment) trigger even if Admin updates job.
        if (data.status) {
            console.log(`[JobManager] updateJob detected status change to '${data.status}'. Delegating to updateStatus to ensure automation.`);
            return this.updateStatus(id, data.status, data);
        }

        try {
            const updates = {
                ...this._mapToDb(data),
                updated_at: new Date().toISOString()
            };
            delete updates.id; // Protect ID

            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at';
            const result = await this.db.update('id', id, updates, columns);
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
            throw err;
        }
    }

    async markFeedbackGiven(jobId) {
        try {
            console.log(`[JobManager] Marking feedback given for Job ${jobId}`);
            // Use updateStatus-like logic but specifically for this flag to avoid status side-effects
            return await this.updateJob(jobId, { feedbackGiven: true });
        } catch (err) {
            console.error(`[JobManager] Error marking feedback given for ${jobId}:`, err);
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
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at';
            const jobs = await this.db.findAll('technician_id', technicianId, columns);
            return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j))));
        } catch (err) {
            console.error(`[JobManager] Error getting jobs for tech ${technicianId}:`, err);
            return [];
        }
    }

    async getJobsByUser(userId) {
        try {
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at';
            const orderBy = { column: 'created_at', ascending: false }; // Newest first
            const jobs = await this.db.findAll('user_id', userId, columns, orderBy);
            return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j))));
        } catch (err) {
            console.error(`[JobManager] Error getting jobs for user ${userId}:`, err);
            return [];
        }
    }

    async getUnassignedJobs() {
        try {
            const columns = 'id, user_id, technician_id, service_type, status, created_at';
            const allJobs = await this.db.read(columns);
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
    // [NEW] Queue Processing Logic (Flow 4)
    async checkQueueForTechnician(technicianId) {
        console.log(`[JobManager] Checking Queue for Tech ${technicianId}...`);
        try {
            // Find jobs waiting for this specific tech
            // We use the existing 'jobs' table with status 'waiting_confirmation'
            // In a full implementation, we might query the 'job_queues' table, but 
            // the simplified logic uses the job status directly as per Implementation Plan.
            if (this.db.client) {
                // Optimized Supabase Query
                const { data: queuedJobs, error } = await this.db.client
                    .from('jobs')
                    .select('id, user_id, technician_id, status, created_at')
                    .eq('technician_id', technicianId)
                    .eq('status', 'waiting_confirmation')
                    .order('created_at', { ascending: true })
                    .limit(1);

                if (error) throw error;

                if (queuedJobs && queuedJobs.length > 0) {
                    const nextJob = queuedJobs[0];
                    console.log(`[JobManager] Found queued job #${nextJob.id}. Auto-Assigning to Tech ${technicianId}.`);

                    // Execute Assignment
                    // We use updateStatus directly to trigger notifications
                    await this.updateStatus(nextJob.id, 'accepted', { technicianId });

                    // Set Tech back to Engaged
                    await this.techManager.updateStatus(technicianId, 'engaged');

                    // Notify
                    await this.notificationManager.createNotification(technicianId, 'technician', 'Queue Job Activated 🚀', `You have been auto-assigned pending Job #${nextJob.id}.`, 'job_assigned', nextJob.id);
                }
            } else {
                // JSON Fallback
                const columns = 'id, user_id, technician_id, status, created_at';
                const allJobs = await this.db.findAll('technician_id', technicianId, columns);
                const queuedJobs = allJobs.filter(j => j.status === 'waiting_confirmation');

                if (queuedJobs.length > 0) {
                    queuedJobs.sort((a, b) => new Date(a.created_at || a.createdAt) - new Date(b.created_at || b.createdAt));
                    const nextJob = queuedJobs[0];

                    console.log(`[JobManager] Found queued job #${nextJob.id}. Auto-Assigning. (JSON Mode)`);

                    await this.updateStatus(nextJob.id, 'accepted', { technicianId });
                    await this.techManager.updateStatus(technicianId, 'engaged');

                    await this.notificationManager.createNotification(technicianId, 'technician', 'Queue Job Activated 🚀', `Queue Job #${nextJob.id} is now Active.`, 'job_assigned', nextJob.id);
                }
            }
        } catch (err) {
            console.error(`[JobManager] Error processing queue for tech ${technicianId}:`, err);
        }
    }

    _validateSchedule(date, time) {
        if (!date || !time) return; // Immediate bookings skip this

        console.log(`[JobManager] Validating schedule: ${date} ${time}`);
        const scheduledAt = new Date(`${date}T${time}`);
        const now = new Date();

        console.log(`[JobManager] ScheduledAt: ${scheduledAt.toISOString()}, Now: ${now.toISOString()}`);
        if (scheduledAt < now) {
            throw new Error(`Cannot schedule service in the past. (Scheduled: ${scheduledAt.toISOString()}, Now: ${now.toISOString()})`);
        }
    }

    // [NEW] Helpers for Advanced Auto-Assign Logic

    async _getMonthlyJobCountGlobal() {
        try {
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            // Determine filter key based on DB usage (Supabase returns snake_case usually, but mapFromDb might handle it)
            // Ideally we query with filter.
            if (this.db.client) {
                // Optimized Supabase Query
                const { count, error } = await this.db.client
                    .from('jobs')
                    .select('id', { count: 'exact', head: true })
                    .gte('created_at', startOfMonth);
                if (error) throw error;
                return count || 0;
            } else {
                // Fallback for JSON DB
                const allJobs = await this.db.read();
                return allJobs.filter(j => (j.created_at || j.createdAt) >= startOfMonth).length;
            }
        } catch (err) {
            console.error('[JobManager] Error getting global monthly job count:', err);
            return 0; // Fail safe
        }
    }

    async _getMonthlyJobCount(technicianId) {
        try {
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
            if (this.db.client) {
                const { count, error } = await this.db.client
                    .from('jobs')
                    .select('id', { count: 'exact', head: true })
                    .eq('technician_id', technicianId)
                    .gte('created_at', startOfMonth);
                if (error) throw error;
                return count || 0;
            } else {
                const jobs = await this.getJobsByTechnician(technicianId);
                return jobs.filter(j => (j.createdAt || j.created_at) >= startOfMonth).length;
            }
        } catch (err) {
            console.error(`[JobManager] Error getting monthly job count for tech ${technicianId}:`, err);
            return 0;
        }
    }
}

module.exports = JobManager;
