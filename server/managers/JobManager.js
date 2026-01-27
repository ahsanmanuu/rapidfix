const Database = require('./DatabaseLoader');
const UserManager = require('./UserManager');
const TechnicianManager = require('./TechnicianManager');
const NotificationManager = require('./NotificationManager');
const FinanceManager = require('./FinanceManager');
const ComplaintManager = require('./ComplaintManager');
const ActivityLogManager = require('./ActivityLogManager'); // [NEW]

const InvoiceManager = require('./InvoiceManager');

class JobManager {
    constructor() {
        this.db = new Database('jobs');
        this.pricingDb = new Database('service_pricing');
        this.userManager = new UserManager();
        this.techManager = new TechnicianManager();
        this.notificationManager = new NotificationManager();
        this.financeManager = new FinanceManager();
        this.complaintManager = new ComplaintManager();
        this.activityManager = new ActivityLogManager(); // [NEW]
        this.analyticsManager = null;
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

    setActivityLogManager(activityManager) {
        this.activityManager = activityManager;
    }

    setAnalyticsManager(analyticsManager) {
        this.analyticsManager = analyticsManager;
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(job, includeOtp = false) {
        if (!job) return null;
        try {
            const { user_id, technician_id, service_type, contact_name, contact_phone, scheduled_date, scheduled_time, created_at, updated_at, otp, visiting_charges, spare_parts_cost, tax, total_cost, invoice_url, ...rest } = job;

            // Calc total if not stored
            const vCharges = Number(visiting_charges || 0);
            const spareCost = Number(spare_parts_cost || 0);
            const jobTax = Number(tax || 0);
            const total = Number(total_cost || (vCharges + spareCost + jobTax));

            const mapped = {
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
                offerPrice: job.offer_price || rest.offer_price || 0, // [FIX] Typo consistency
                paymentStatus: job.payment_status || 'pending',
                paymentMethod: job.payment_method,
                feedbackGiven: job.feedback_given || false,
                invoiceUrl: invoice_url || job.invoice_url || rest.invoice_url
            };

            if (includeOtp) {
                mapped.otp = otp;
            }

            return mapped;
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

            if (job.paymentStatus !== undefined) mapped.payment_status = job.paymentStatus;
            if (job.paymentMethod !== undefined) mapped.payment_method = job.paymentMethod;

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
            if (job.offerPrice !== undefined) {
                mapped.offer_price = job.offerPrice;
            }
            if (job.feedbackGiven !== undefined) {
                mapped.feedback_given = !!job.feedbackGiven;
            }
            if (job.invoiceUrl !== undefined) {
                mapped.invoice_url = job.invoiceUrl;
            }

            if (job.createdAt !== undefined) mapped.created_at = job.createdAt;
            if (job.updatedAt !== undefined) mapped.updated_at = job.updatedAt;
            return mapped;
        } catch (err) {
            console.error("[JobManager] Error mapping to DB:", err);
            return job;
        }
    }

    _checkModificationWindow(job) {
        if (!job || !job.scheduledDate) return;

        try {
            // Combine date and time (default to 00:00 if time missing)
            let dateStr = job.scheduledDate; // YYYY-MM-DD
            if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];

            let timeStr = job.scheduledTime || '00:00:00';
            // Normalize time (10:00 AM -> 10:00) handled by Date parse usually, but let's be safe
            // If it's a simple HH:MM string, Date.parse might treat as ISO or local depending on browser/node.
            // Best to construct explicitly or use standard ISO string if possible.
            // For now, robust string concat:
            const scheduled = new Date(`${dateStr}T${timeStr.split(' ')[0]}`); // split space for AM/PM stripping if extremely simple

            // Better Parsing if time has AM/PM
            const fullDateTimeStr = `${dateStr} ${timeStr}`;
            const scheduledDate = new Date(fullDateTimeStr);

            if (isNaN(scheduledDate.getTime())) {
                // If invalid, we can't enforce. Log and allow.
                console.warn(`[JobManager] _checkModificationWindow: Invalid Schedule ${fullDateTimeStr}. Skipping check.`);
                return;
            }

            const now = new Date();

            // [FIX] Grace Period Check
            // If the job was created very recently (e.g. < 15 minutes ago), allow cancellation even if it's "immediate".
            // This prevents the "2-hour rule" from blocking users who just made a mistake booking 'Now'.
            if (job.createdAt) {
                const createdTime = new Date(job.createdAt);
                const minutesSinceCreation = (now.getTime() - createdTime.getTime()) / (1000 * 60);
                if (minutesSinceCreation < 15) {
                    console.log(`[JobManager] Modification Allowed: Grace Period (${minutesSinceCreation.toFixed(1)}m < 15m)`);
                    return;
                }
            }

            const diffMs = scheduledDate.getTime() - now.getTime();
            const diffHours = diffMs / (1000 * 60 * 60);

            console.log(`[JobManager] Modification Check: Job ${job.id} is ${diffHours.toFixed(2)} hours away.`);

            // Restriction: Cannot cancel within 2 hours
            if (diffHours < 2 && diffHours > -24) { // -24 to allow cancelling OLD jobs that are stale? Or just strict 'future' check?
                // The requirement is "cannot be cancelled... within 2 hours".
                // Usually implies "Less than 2 hours remaining".
                // If it's already PASSED (negative diff), they certainly can't "cancel" a past job in normal flows, or maybe they can?
                // Let's stick to the prompt: "within 2 hours of the scheduled time".
                // Assuming this applies to UPCOMING jobs.
                if (diffHours < 2) {
                    throw new Error("Action Not Allowed: Bookings cannot be cancelled or rescheduled within 2 hours of the scheduled time. Please contact support.");
                }
            }
        } catch (e) {
            if (e.message.startsWith("Action Not Allowed")) throw e;
            console.error("[JobManager] _checkModificationWindow Error:", e);
        }
    }

    async calculateVisitingCharges(serviceType, userLat, userLng, techLat, techLng, technicianId) {
        try {
            // 1. Get Pricing Config
            const defaultPricing = await this.pricingDb.find('service_type', 'default') || { base_visiting_charge: 99, per_km_charge: 10 };
            const specificPricing = serviceType ? (await this.pricingDb.find('service_type', serviceType)) : null;

            const pricing = specificPricing || defaultPricing;
            const baseCharge = parseFloat(pricing.base_visiting_charge || 99);
            const perKmCharge = parseFloat(pricing.per_km_charge || 10);

            // Resolve Tech Location if ID provided
            let tLat = techLat;
            let tLng = techLng;
            if (technicianId && (!tLat || !tLng)) {
                const tech = await this.techManager.getTechnician(technicianId);
                if (tech) {
                    tLat = tech.latitude || tech.fixedLatitude;
                    tLng = tech.longitude || tech.fixedLongitude;
                }
            }

            // 2. Calculate Distance
            let distance = 0;
            if (tLat && tLng && userLat && userLng) {
                distance = this.techManager.calculateDistance(
                    parseFloat(userLat), parseFloat(userLng),
                    parseFloat(tLat), parseFloat(tLng)
                );
            }

            // 3. Total
            const distanceCharge = distance * perKmCharge;
            const total = baseCharge + distanceCharge;

            return {
                baseCharge,
                distance: parseFloat(distance.toFixed(2)),
                perKmCharge,
                distanceCharge: parseFloat(distanceCharge.toFixed(2)),
                total: parseFloat(total.toFixed(2))
            };
        } catch (err) {
            console.error("[JobManager] Error calculating charges:", err);
            // Fallback
            return { baseCharge: 99, distance: 0, perKmCharge: 10, distanceCharge: 0, total: 99 };
        }
    }

    async createJob(userId, serviceType, description, location, address, scheduledDate, scheduledTime, contactName, contactPhone, offerPrice, technicianId, visitingCharges, agreementAccepted, paymentStatus = 'pending', paymentMethod = 'cash') {
        console.log(`[JobManager] createJob starting.`);
        try {
            console.log(`[JobManager] creating job for user ${userId}, service: ${serviceType}, schedule: ${scheduledDate} ${scheduledTime}`);

            // [ALGO] Validation Pipeline
            this._validateSchedule(scheduledDate, scheduledTime);

            const user = await this.userManager.getUser(userId);

            // Generate OTP
            const otp = Math.floor(1000 + Math.random() * 9000).toString();

            // Visiting Charges default
            // If visitingCharges passed (e.g. from offer or pre-calc in Quick Booking), use it.
            // Otherwise, we can calc base charge now (techId might be null so 0 distance).
            let vCharges = visitingCharges || offerPrice || 0;
            if (!vCharges) {
                const pricing = await this.calculateVisitingCharges(serviceType); // Base only
                vCharges = pricing.baseCharge;
            }

            // Tax & Total (Initial)
            const tax = vCharges * 0.0;
            const total = parseFloat(vCharges) + tax;

            // 1. Pre-Check Wallet Balance
            if (paymentMethod === 'wallet') {
                if (!userId) {
                    throw new Error("User must be logged in to use wallet.");
                }
                const balance = await this.financeManager.getBalance(userId);
                if (balance < total) {
                    throw new Error("Insufficient wallet balance.");
                }
            }

            const newJob = {
                userId,
                serviceType,
                description,
                location,
                address,
                // Default to NOW for immediate bookings (Quick Tile)
                scheduledDate: scheduledDate || new Date().toLocaleDateString('en-CA'),
                scheduledTime: scheduledTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }),
                contactName: contactName || (user ? user.name : "Customer"),
                contactPhone: contactPhone || (user ? user.phone : ""),
                technicianId,
                status: 'pending',
                otp,
                visitingCharges: vCharges,
                offerPrice: offerPrice || 0,
                sparePartsCost: 0,
                tax: 0,
                totalCost: total,

                // Payment Fields
                paymentStatus: paymentMethod === 'wallet' ? 'pending' : (paymentStatus || 'pending'), // Set to pending until deducted
                paymentMethod,

                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const dbJob = this._mapToDb(newJob);
            // Include new columns in insert
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, otp, visiting_charges, spare_parts_cost, tax, total_cost, offer_price, description, professional_note, payment_status, payment_method, feedback_given, reason, invoice_url';

            console.log(`[JobManager] Inserting Job with OTP: ${otp}`);
            const saved = await this.db.add(dbJob, columns);

            // 2. Process Payment Deduction
            if (paymentMethod === 'wallet') {
                const result = await this.financeManager.processJobPayment(userId, total, saved.id);
                if (result.success) {
                    // Update Job Status to Paid
                    await this.db.update('id', saved.id, { payment_status: 'paid' });
                    saved.payment_status = 'paid'; // Local update for return
                } else {
                    console.error(`[JobManager] Payment failed for ${saved.id}: ${result.reason}`);
                    // Optionally cancel job or keep as pending payment
                }
            } else if (paymentStatus === 'paid') {
                // Trust external payment status if passed
            }
            const job = await this._enrichJob(this._mapFromDb(saved, true)); // Include OTP for the creating user

            // Real-time broadcast for new job
            if (this.io) {
                // Global broadcast (strips OTP for technicians/marketplace)
                const publicJob = { ...job };
                delete publicJob.otp;
                this.io.emit('new_job_created', publicJob);

                // Private broadcast to the specific user (includes OTP)
                this.io.to(`user_${userId}`).emit('job_status_updated', job);

                // [NEW] Private broadcast to assigned technician
                if (technicianId) {
                    this.io.to(`tech_${technicianId}`).emit('new_job_assigned', job);
                    this.io.to(`tech_${technicianId}`).emit('job_status_updated', job);
                }
            }

            if (technicianId) {
                await this.activityManager.log(userId, technicianId, 'job_request', 'New Job Request', `New request: ${serviceType}`, { jobId: job.id });
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
        // console.log(`[JobManager] Starting Advanced Real-Time AutoAssign for Job #${jobId}`);
        try {
            const job = await this.getJob(jobId);
            if (!job || job.technicianId || job.status !== 'pending') return job;

            // [ALGO IMPROVEMENT] Handle Scheduling
            const isFutureBooking = job.scheduledDate && new Date(job.scheduledDate).toDateString() !== new Date().toDateString();
            if (isFutureBooking) {
                // console.log(`[JobManager] Job #${jobId} is for a future date (${job.scheduledDate}). Skipping immediate auto-assignment.`);
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
                // console.log(`[AutoAssign] Found ${candidates.length} candidates within ${radius}km for ${serviceType}`);

                const allJobsThisMonth = await this._getMonthlyJobCountGlobal();
                const qualifiedTechs = [];

                for (const tech of candidates) {
                    // --- CRITERIA CHECKS ---

                    // 1. Star Rating Filter (> 3.0 OR New/0)
                    const rating = tech.rating || 0;
                    if (rating > 0 && rating < 3.0) {
                        continue;
                    }

                    // 2. Rejection Rate Filter (Relaxed: < 40% only if > 5 jobs)
                    const jobStats = await this.getJobStats(tech.id, true);
                    if (jobStats.total >= 5 && jobStats.ratio >= 0.40) {
                        console.log(`[AutoAssign] Filtered ${tech.name}: High Rejection Rate (${(jobStats.ratio * 100).toFixed(1)}%)`);
                        continue;
                    }

                    // 3. Market Share / Workload Caps
                    // Condition: Free < 20%
                    const isPremium = tech.membership === 'Premium' || tech.subscription === 'premium';

                    // Relaxed: Simple Cap check only for Free tier
                    if (!isPremium) {
                        const techMonthlyJobs = await this._getMonthlyJobCount(tech.id);
                        // Cap at 20 jobs/month for free tier instead of relative share
                        if (techMonthlyJobs >= 20) {
                            console.log(`[AutoAssign] Filtered ${tech.name}: Monthly Free Tier Cap Reached (20)`);
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
            await this.techManager.syncStatsFromJobs(technicianId);
            if (this.analyticsManager) {
                await this.analyticsManager.syncStats(technicianId);
            }

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

            // [FIX] Address Fallback: If Job has no address, use User's Profile Address
            if (!enriched.address || enriched.address === 'No address provided' || enriched.address.length < 5) {
                if (customer) {
                    // Priority: Fixed Address > Location (if string) > Location (if obj)
                    const userAddr = customer.fixedAddress ||
                        (typeof customer.location === 'string' ? customer.location : null) ||
                        customer.location?.address ||
                        customer.location?.city;

                    if (userAddr) {
                        enriched.address = userAddr;
                        // console.log(`[JobManager] Job ${job.id} address patched from User Profile: ${userAddr}`);
                    }
                }
            }

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

    async getJob(id, includeOtp = false) {
        try {
            const columns = `id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, ${includeOtp ? 'otp, ' : ''}visiting_charges, spare_parts_cost, tax, total_cost, offer_price, description, professional_note, payment_status, payment_method, feedback_given, reason, invoice_url`;
            const job = await this.db.find('id', id, columns);
            return await this._enrichJob(this._mapFromDb(job, includeOtp));
        } catch (err) {
            console.error(`[JobManager] Error getting job ${id}:`, err);
            return null;
        }
    }

    async getAllJobs() {
        try {
            // For admin/internal use, OTP is generally not needed unless explicitly requested.
            // We'll fetch all columns and let _mapFromDb handle the default exclusion.
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, otp, visiting_charges, spare_parts_cost, tax, total_cost, offer_price, description, professional_note, payment_status, payment_method, feedback_given, reason, invoice_url';
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
            const columns = 'id, user_id, technician_id, service_type, status, scheduled_date, scheduled_time, created_at, visiting_charges, total_cost, payment_status, payment_method, invoice_url';
            const currentJob = await this.db.find('id', id, columns);

            // [NEW] 2-Hour Restriction for Cancellation
            if (status === 'cancelled') {
                this._checkModificationWindow(this._mapFromDb(currentJob));
            }

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
                ...details
            };

            // [NEW] Automatic Refund Logic
            if ((status === 'cancelled' || status === 'rejected') && currentJob.payment_status === 'paid' && currentJob.payment_method === 'wallet') {
                console.log(`[JobManager] Job ${id} is ${status}. Processing automatic WALLET REFUND.`);
                const refundAmount = currentJob.total_cost || currentJob.visiting_charges || 0;

                if (refundAmount > 0) {
                    try {
                        const refundResult = await this.financeManager.processPayment(
                            currentJob.user_id,
                            refundAmount,
                            'credit',
                            `Refund for Job #${id} (${status})`
                        );
                        if (refundResult) {
                            updates.payment_status = 'refunded';
                            console.log(`[JobManager] Refund successful for Job ${id}. Amount: ${refundAmount}`);
                            // Notify User specifically about refund
                            await this.notificationManager.createNotification(
                                currentJob.user_id,
                                'user',
                                'Refund Processed 💰',
                                `₹${refundAmount} has been refunded to your wallet for Job #${id}.`,
                                'payment_refund',
                                id
                            );
                        }
                    } catch (refundErr) {
                        console.error(`[JobManager] REFUND FAILED for Job ${id}:`, refundErr);
                        // We still proceed with cancellation but log critical error
                        updates.payment_status = 'refund_failed'; // Optional status to track failure
                    }
                }
            }

            // [NEW] Wallet Reversal Logic (If Status changed FROM completed TO something else)
            if (currentJob.status === 'completed' && status !== 'completed' && currentJob.technician_id) {
                console.log(`[JobManager] Job ${id} Reopened (was completed). Reversing Wallet Credit.`);
                const revAmount = currentJob.offer_price || currentJob.visiting_charges || 0;
                if (revAmount > 0) {
                    try {
                        const payout = revAmount * 0.9;
                        await this.financeManager.processPayment(
                            currentJob.technician_id,
                            payout,
                            'debit',
                            `Reversal: Job #${id} Reopened`,
                            true, // isTechnician
                            id    // associatdId (Job ID)
                        );
                        console.log(`[JobManager] Reversal successful for Job ${id}. Debited: ${payout}`);
                    } catch (revErr) {
                        console.error(`[JobManager] REVERSAL FAILED for Job ${id}:`, revErr);
                    }
                }
            }

            // [NEW] OTP Verification for Job Completion
            if (status === 'completed') {
                if (currentJob.status === 'completed') {
                    console.log(`[JobManager] Job ${id} is already completed. Returning existing state (Idempotent).`);
                    return await this._enrichJob(this._mapFromDb(currentJob));
                }

                // [CRITICAL FIX] Prevent completion without technician
                if (!currentJob.technician_id) {
                    console.error(`[JobManager] FATAL: Attempted to complete Job ${id} without an assigned technician.`);
                    throw new Error("Cannot complete job: No technician assigned. Please ensure a technician is assigned before finalizing.");
                }

                const jobWithOtp = await this.db.find('id', id, 'id, otp');
                const storedOtp = jobWithOtp?.otp;
                const providedOtp = details.otp || details.OTP;

                console.log(`[JobManager] Verifying OTP for Job ${id}. Stored: ${storedOtp}, Provided: ${providedOtp}`);

                if (!storedOtp) {
                    // Strict: If No OTP exists, it might be already used or never generated. Fail it.
                    throw new Error("Security Error: This job is missing a verification code or has already been finalized.");
                } else if (String(storedOtp) !== String(providedOtp)) {
                    throw new Error("Invalid Verification OTP. Please ask the customer for the correct code.");
                }

                // [HARDENING] Invalidate OTP after success to prevent reuse
                updates.otp = null;
            }

            const dbUpdates = this._mapToDb(updates);
            // Add new columns to allowed update list
            const updateCols = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, otp, visiting_charges, spare_parts_cost, tax, total_cost, offer_price, description, professional_note, payment_status, payment_method, feedback_given, reason, invoice_url';
            const updated = await this.db.update('id', id, dbUpdates, updateCols);
            const enriched = await this._enrichJob(this._mapFromDb(updated, false)); // Strip OTP by default

            if (this.io) {
                // To Technician: STRIPPED
                if (enriched.technicianId) {
                    this.io.to(`tech_${enriched.technicianId}`).emit('job_status_updated', enriched);
                    this.io.to(`tech_${enriched.technicianId}`).emit('job_updated', enriched);
                }

                // To Admin: STRIPPED
                this.io.emit('admin_job_update', enriched);
                this.io.emit('job_status_updated_admin', enriched);
                this.io.emit('job_updated', enriched);

                // To User: INCLUDE OTP (Securely mapped)
                const userEnriched = await this._enrichJob(this._mapFromDb(updated, true));
                this.io.to(`user_${enriched.userId}`).emit('job_status_updated', userEnriched);
                this.io.to(`user_${enriched.userId}`).emit('job_updated', userEnriched);
            }

            if (status === 'completed') {
                console.log(`[JobManager] Job ${id} completed, processing payment and syncing tech ${enriched.technicianId} stats`);

                // 1. Process Payment First
                // 1. Process Payment First
                const amount = enriched.offerPrice || enriched.visitingCharges || 0;
                if (amount > 0) {
                    await this.financeManager.processPayment(enriched.technicianId, amount * 0.9, 'credit', `Job Compensation #${enriched.id}`, true, enriched.id);
                }

                // 2. Then Sync Stats and Status
                await this.techManager.syncStatsFromJobs(enriched.technicianId);
                await this.techManager.updateStatus(enriched.technicianId, 'available');

                // 2.1 Sync Detailed Analytics
                if (this.analyticsManager) {
                    await this.analyticsManager.syncStats(enriched.technicianId);
                }

                if (this.io) {
                    this.io.emit('job_status_updated', enriched);
                }

                // 3. Generate Invoice (Async)
                if (this.invoiceManager) {
                    (async () => {
                        try {
                            await this.invoiceManager.createAndSaveInvoice(enriched);
                        } catch (invErr) {
                            console.error(`[JobManager] Invoice generation failed for Job ${id}:`, invErr);
                        }
                    })();
                }
            } else if (status === 'rejected') {
                console.log(`[JobManager] Job ${id} rejected, syncing tech ${enriched.technicianId} stats and setting status to available`);
                await this.techManager.syncStatsFromJobs(enriched.technicianId);
                await this.techManager.updateStatus(enriched.technicianId, 'available');
            } else if (status === 'accepted') {
                console.log(`[JobManager] Job ${id} accepted, syncing tech ${enriched.technicianId} stats and setting status to engaged`);
                await this.techManager.syncStatsFromJobs(enriched.technicianId);
                await this.techManager.updateStatus(enriched.technicianId, 'engaged');
            } else if (status === 'in_progress') {
                console.log(`[JobManager] Job ${id} in progress, syncing tech ${enriched.technicianId} stats and setting status to finishing_work`);
                await this.techManager.syncStatsFromJobs(enriched.technicianId);
                await this.techManager.updateStatus(enriched.technicianId, 'finishing_work');
            } else if (status === 'cancelled') {
                console.log(`[JobManager] Job ${id} cancelled, syncing tech ${enriched.technicianId} stats and setting status to available`);
                await this.techManager.syncStatsFromJobs(enriched.technicianId);
                await this.techManager.updateStatus(enriched.technicianId, 'available');
            }

            // [NEW] Global Analytics Sync for Realtime Updates
            if (enriched.technicianId && this.analyticsManager) {
                await this.analyticsManager.syncStats(enriched.technicianId);
            }

            // [NEW] Persist Notifications
            if (enriched.userId) {
                await this.notificationManager.createNotification(enriched.userId, 'user', `Job ${status.replace('_', ' ')}`, `Your job #${enriched.id} is now ${status.replace('_', ' ')}`, `job_${status}`, enriched.id);
            }
            if (enriched.technicianId) {
                await this.notificationManager.createNotification(enriched.technicianId, 'technician', `Job ${status.replace('_', ' ')}`, `Job #${enriched.id} is now ${status.replace('_', ' ')}`, `job_${status}`, enriched.id);

                // [NEW] LIVE ACTIVITY LOGGING
                let logTitle = '';
                let logMsg = '';
                if (status === 'accepted') {
                    logTitle = 'Job Accepted';
                    logMsg = `You accepted Job #${enriched.id}`;
                } else if (status === 'rejected') {
                    logTitle = 'Job Rejected';
                    logMsg = `You rejected Job #${enriched.id}`;
                } else if (status === 'completed') {
                    logTitle = 'Job Completed';
                    logMsg = `Job #${enriched.id} marked as completed`;
                } else if (status === 'cancelled') {
                    logTitle = 'Job Cancelled';
                    logMsg = `Job #${enriched.id} was cancelled`;
                }

                if (logTitle) {
                    await this.activityManager.log(enriched.userId, enriched.technicianId, `job_${status}`, logTitle, logMsg, { jobId: enriched.id });
                }
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

        // [NEW] 2-Hour Restriction for Rescheduling
        if (data.scheduledDate || data.scheduledTime) {
            const existingJob = await this.getJob(id); // Using public method to get full details
            if (existingJob) {
                this._checkModificationWindow(existingJob);
            }
        }

        try {
            const updates = {
                ...this._mapToDb(data),
                updated_at: new Date().toISOString()
            };
            delete updates.id; // Protect ID

            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, otp, visiting_charges, spare_parts_cost, tax, total_cost, offer_price, description, professional_note, payment_status, payment_method, feedback_given, reason, invoice_url';
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
            if (total === 0) return { total: 0, rejected: 0, completed: 0, accepted: 0, pending: 0, ratio: 0 };

            const rejected = filteredJobs.filter(j => ['rejected', 'cancelled'].includes(j.status)).length;
            const completed = filteredJobs.filter(j => ['completed', 'work_done', 'finishing'].includes(j.status)).length;
            const accepted = filteredJobs.filter(j => ['accepted', 'in_progress', 'ongoing', 'started', 'arrived'].includes(j.status)).length;
            const pending = filteredJobs.filter(j => ['pending', 'waiting_confirmation', 'assigned'].includes(j.status)).length;

            return { total, rejected, completed, accepted, pending, ratio: total > 0 ? rejected / total : 0 };
        } catch (err) {
            console.error(`[JobManager] Error getting stats for tech ${technicianId}:`, err);
            return { total: 0, rejected: 0, completed: 0, accepted: 0, pending: 0, ratio: 0 };
        }
    }

    async getJobsByTechnician(technicianId) {
        try {
            // Explicitly exclude 'otp' from columns for technicians
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, visiting_charges, spare_parts_cost, tax, total_cost, offer_price, description, professional_note, payment_status, payment_method, feedback_given, reason, invoice_url';
            const jobs = await this.db.findAll('technician_id', technicianId, columns, { column: 'created_at', ascending: false });
            return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j, false)))); // Pass false to explicitly exclude OTP
        } catch (err) {
            console.error(`[JobManager] Error getting jobs for tech ${technicianId}:`, err);
            return [];
        }
    }

    /**
     * getJobHistory - Advanced job fetching for logs
     * @param {string} technicianId 
     * @param {Object} options { page, limit, status, serviceType, startDate, endDate, search }
     */
    async getJobHistory(technicianId, options = {}) {
        try {
            const page = parseInt(options.page) || 1;
            const limit = parseInt(options.limit) || 10;
            const offset = (page - 1) * limit;

            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, visiting_charges, spare_parts_cost, tax, total_cost, offer_price, description, professional_note, payment_status, payment_method, feedback_given, reason, invoice_url';

            // We'll use a complex query if it's Supabase, otherwise fallback to in-memory filtering for robustness
            // Since we use SupabaseDatabase.js as a drop-in, we can use its query method.

            const filters = { technician_id: technicianId };
            if (options.status && options.status !== 'All Statuses') {
                filters.status = options.status.toLowerCase();
            }
            if (options.serviceType && options.serviceType !== 'All Services') {
                filters.service_type = options.serviceType;
            }

            // Fetching data
            let jobs = await this.db.findAll('technician_id', technicianId, columns, { column: 'created_at', ascending: false });

            // Apply further filters in memory for complex things like search and date ranges if DB doesn't support it directly yet
            if (options.search) {
                const search = options.search.toLowerCase();
                jobs = jobs.filter(j =>
                    j.id.toLowerCase().includes(search) ||
                    (j.contact_name && j.contact_name.toLowerCase().includes(search))
                );
            }

            if (options.startDate) {
                const start = new Date(options.startDate);
                jobs = jobs.filter(j => new Date(j.created_at) >= start);
            }
            if (options.endDate) {
                const end = new Date(options.endDate);
                end.setHours(23, 59, 59, 999);
                jobs = jobs.filter(j => new Date(j.created_at) <= end);
            }

            const total = jobs.length;
            const totalPages = Math.ceil(total / limit);
            const paginated = jobs.slice(offset, offset + limit);

            const enriched = await Promise.all(paginated.map(j => this._enrichJob(this._mapFromDb(j, false))));

            return {
                data: enriched,
                total,
                page,
                totalPages
            };
        } catch (err) {
            console.error(`[JobManager] Error getting job history for tech ${technicianId}:`, err);
            return { data: [], total: 0, page: 1, totalPages: 0 };
        }
    }

    async getJobsByUser(userId, filters = {}) {
        try {
            // For user, we want to include OTP if available, so we fetch all columns and let _mapFromDb handle it.
            // Or, if using Supabase, we can select all and then filter in _mapFromDb.
            // For now, we'll select all and rely on _mapFromDb(j, true) to expose it.
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, otp, visiting_charges, spare_parts_cost, tax, total_cost, description, professional_note, payment_status, payment_method, feedback_given, invoice_url';


            if (this.db.client) {
                let query = this.db.client
                    .from('jobs')
                    .select(columns) // Select all columns including OTP
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });

                console.log(`[JobManager] getJobsByUser Filters:`, filters);

                // [FILTER] Status
                if (filters.status && filters.status !== 'all') {
                    query = query.eq('status', filters.status);
                }

                // [FILTER] Date Range (created_at)
                // Ensure ranges cover the full day
                // Robust Check: handle undefined, null, empty string, or "undefined" string
                const isValidDate = (d) => d && typeof d === 'string' && d !== 'undefined' && d.trim() !== '';

                if (isValidDate(filters.startDate)) {
                    let start = filters.startDate;
                    if (start.length === 10) start += 'T00:00:00'; // Append start of day
                    query = query.gte('created_at', start);
                    console.log(`[JobManager] Applied Start Date: ${start}`);
                }
                if (isValidDate(filters.endDate)) {
                    let end = filters.endDate;
                    if (end.length === 10) end += 'T23:59:59'; // Append end of day
                    query = query.lte('created_at', end);
                    console.log(`[JobManager] Applied End Date: ${end}`);
                }

                // [FILTER] Search (Job ID or Service Type)
                if (filters.search && filters.search !== 'undefined') {
                    // UUID check for ID search to prevent invalid input syntax for UUID column if applicable
                    // But 'id' is UUID. 'service_type' is text.
                    // 'or' syntax: id.eq.val,service_type.ilike.%val%
                    // Note: Supabase 'or' expects valid syntax. Searching UUID column with non-UUID string fails.
                    // So we only search ID if it LOOKS like a UUID, otherwise just Service/Desc.
                    const s = filters.search.trim();
                    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

                    if (isUuid) {
                        query = query.or(`id.eq.${s},service_type.ilike.%${s}%`);
                    } else {
                        // Just search text fields
                        query = query.ilike('service_type', `%${s}%`);
                    }
                }

                const results = await query;
                const jobs = results.data || [];
                return Promise.all(jobs.map(j => this._enrichJob(this._mapFromDb(j, true)))); // Pass true to include OTP for user
            } else {
                // FALLBACK: Client-Side (Local JSON)
                const allJobs = await this.db.findAll('user_id', userId, columns); // Fetch all columns including OTP
                let filtered = allJobs; // Start with all jobs for the user

                if (filters.status && filters.status !== 'all') {
                    filtered = filtered.filter(j => j.status === filters.status);
                }
                if (filters.startDate) {
                    let start = filters.startDate;
                    if (start.length === 10) start += 'T00:00:00';
                    filtered = filtered.filter(j => (j.created_at || j.createdAt) >= start);
                }
                if (filters.endDate) {
                    let end = filters.endDate;
                    if (end.length === 10) end += 'T23:59:59';
                    filtered = filtered.filter(j => (j.created_at || j.createdAt) <= end);
                }
                if (filters.search) {
                    const s = filters.search.toLowerCase();
                    filtered = filtered.filter(j =>
                        (j.id && j.id.toLowerCase().includes(s)) ||
                        (j.service_type && j.service_type.toLowerCase().includes(s))
                    );
                }

                // Sort
                filtered.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt));

                return Promise.all(filtered.map(j => this._enrichJob(this._mapFromDb(j, true))));
            }

        } catch (err) {
            console.error(`[JobManager] Error getting jobs for user ${userId}:`, err);
            return [];
        }
    }

    async getUnassignedJobs() {
        try {
            const columns = 'id, user_id, technician_id, service_type, status, contact_name, contact_phone, address, scheduled_date, scheduled_time, created_at, updated_at, location, otp, visiting_charges, spare_parts_cost, tax, total_cost, description, professional_note, payment_status, payment_method, feedback_given';
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

        console.log(`[JobManager] Validating schedule: ${date} '${time}'`);

        // Handle Time Range (e.g. "02:00 PM - 04:00 PM")
        let startTime = time;
        if (time.includes(' - ')) {
            startTime = time.split(' - ')[0];
        } else if (time.includes('-')) {
            startTime = time.split('-')[0];
        }
        startTime = startTime.trim();

        // Handle "10:00 AM" vs "10:00:00" vs "10:00"
        let dateTimeStr = `${date}T${startTime}`;

        // If time has AM/PM, parse manually or trust Date constructor
        if (startTime.toLowerCase().includes('m')) { // am/pm
            dateTimeStr = `${date} ${startTime}`;
        }

        const scheduledAt = new Date(dateTimeStr);

        if (isNaN(scheduledAt.getTime())) {
            console.error(`[JobManager] Invalid Date Parsed: ${dateTimeStr} (Original: ${time})`);
            // Fallback: If we can't parse it, just warn and allow it to proceed 
            // because blocking the user for a date format issue is worse than a bad timestamp in DB.
            console.warn(`[JobManager] WARNING: Could not parse schedule date. Skipping validation.`);
            return;
        }

        const now = new Date();

        // [FIX] Add 15-minute grace period for network latency or login delays
        const gracePeriod = 15 * 60 * 1000;

        // Check if date is valid
        if (scheduledAt.getTime() < (now.getTime() - gracePeriod)) {
            console.warn(`[JobManager] Warning: Job scheduled in the past or close to it.`);
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
