const Database = require('./DatabaseLoader');

class OfferManager {
    constructor() {
        this.db = new Database('offers');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    setJobManager(jobManager) {
        this.jobManager = jobManager;
    }

    setUserManager(userManager) {
        this.userManager = userManager;
    }

    setTechnicianManager(technicianManager) {
        this.technicianManager = technicianManager;
    }

    setNotificationManager(notificationManager) {
        this.notificationManager = notificationManager;
    }

    // ... (mid file)

    async getOpenBids() {
        try {
            const all = await this.db.read();
            return all
                .map(o => this._mapFromDb(o))
                .filter(o => o.isActive && o.type === 'job_bid' && o.status === 'open');
        } catch (err) {
            console.error("[OfferManager] Error getting open bids:", err);
            return [];
        }
    }

    async acceptOffer(offerId, technicianId) {
        try {
            const rawOffer = await this.db.find('id', offerId);
            const offer = this._mapFromDb(rawOffer);

            if (!offer) throw new Error("Offer not found");
            if (offer.status !== 'open') throw new Error("Offer is not open");
            if (offer.type !== 'job_bid') throw new Error("Only job bids can be accepted");
            if (!this.jobManager) throw new Error("JobManager not initialized in OfferManager");

            // Fetch User for location fallback
            let location = { lat: 0, lng: 0 };
            let address = "Address provided via chat";

            if (this.userManager && offer.userId) {
                const user = await this.userManager.getUser(offer.userId);
                if (user) {
                    if (user.location && user.location.lat) location = user.location;
                    if (user.address) address = user.address;
                }
            }

            // Create Job
            // Defaulting to Today/Now for schedule as Bids are usually immediate or discussed
            const today = new Date().toISOString().split('T')[0];
            const nowTime = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

            const job = await this.jobManager.createJob(
                offer.userId,
                offer.jobType || 'General',
                (offer.title ? `[${offer.title}] ` : '') + (offer.description || ''),
                location,
                address,
                today,
                nowTime,
                null, // Contact Name (auto-fetched)
                null, // Contact Phone (auto-fetched)
                offer.price, // Offer Price becomes Job Price
                technicianId,
                0, // Visiting Charges (Assume 0 for bid jobs)
                true // Agreement Accepted
            );

            // Update Offer Status
            await this.db.update(offerId, { status: 'accepted' });

            // Emit update
            if (this.io) {
                this.io.emit('offer_accepted', { offerId, jobId: job.id, technicianId });
                // Also update the offer listing for everyone
                const updatedOffer = { ...offer, status: 'accepted' };
                this.io.emit('offer_updated', updatedOffer);
            }

            return job;
        } catch (err) {
            console.error("[OfferManager] Accept Offer Error:", err);
            throw err;
        }
    }

    _mapFromDb(offer) {
        if (!offer) return null;
        try {
            const { created_by, expiry_date, is_active, created_at, badge_text, discount_type, discount_value, image_url, job_type, price, user_id, status, type, ...rest } = offer;
            return {
                ...rest,
                createdBy: created_by,
                expiryDate: expiry_date,
                isActive: is_active,
                createdAt: created_at,
                badgeText: badge_text,
                discountType: discount_type || 'percentage',
                discountValue: discount_value || 0,
                imageUrl: image_url,
                jobType: job_type,
                price: price,
                userId: user_id,
                status: status || 'open',
                type: type || 'coupon' // 'coupon' or 'job_bid'
            };
        } catch (err) {
            console.error("[OfferManager] Error mapping from DB:", err);
            return offer;
        }
    }

    _mapToDb(offer) {
        if (!offer) return null;
        try {
            const { createdBy, expiryDate, isActive, createdAt, badgeText, id, discountType, discountValue, imageUrl, jobType, price, userId, status, type, code, ...rest } = offer;
            const mapped = { ...rest };
            if (createdBy !== undefined && createdBy !== null) mapped.created_by = createdBy;
            if (expiryDate !== undefined && expiryDate !== null) mapped.expiry_date = expiryDate;
            if (isActive !== undefined && isActive !== null) mapped.is_active = isActive;
            if (createdAt !== undefined && createdAt !== null) mapped.created_at = createdAt;
            if (badgeText !== undefined && badgeText !== null) mapped.badge_text = badgeText;
            if (discountType !== undefined && discountType !== null) mapped.discount_type = discountType;
            if (discountValue !== undefined && discountValue !== null) mapped.discount_value = discountValue;
            if (imageUrl !== undefined && imageUrl !== null) mapped.image_url = imageUrl;
            if (id !== undefined && id !== null) mapped.id = id;

            // Optional Code Field (Coupon only)
            if (code !== undefined && code !== null) mapped.code = code;

            // New Fields for Job Bids
            if (jobType !== undefined && jobType !== null) mapped.job_type = jobType;
            if (price !== undefined && price !== null) mapped.price = price;
            if (userId !== undefined && userId !== null) mapped.user_id = userId;
            if (status !== undefined && status !== null) mapped.status = status;
            if (type !== undefined && type !== null) mapped.type = type;

            return mapped;
        } catch (err) {
            console.error("[OfferManager] Error mapping to DB:", err);
            return offer;
        }
    }

    async createOffer(data) {
        try {
            // Destructure with defaults
            const {
                title, description, code, discountType, discountValue, badgeText,
                createdBy, expiryDate, imageUrl,
                jobType, price, userId, type = 'coupon'
            } = data;

            const offer = {
                title,
                description,
                code,
                discountType: discountType || 'percentage',
                discountValue: discountValue || 0,
                badgeText,
                createdBy, // Admin/Technician who created the coupon
                expiryDate,
                imageUrl,
                isActive: true,
                createdAt: new Date().toISOString(),
                // Job Bid Fields
                jobType,
                price,
                userId, // User who created the bid
                status: 'open',
                type
            };
            const mappedValues = this._mapToDb(offer);
            // 1. Create Offer in DB
            const created = await this.db.add(mappedValues);
            const fullOffer = this._mapFromDb(created);

            // 2. [SMART BROADCAST] Notify Nearby Technicians (if Job Bid)
            if (fullOffer.type === 'job_bid' && this.technicianManager && this.notificationManager && this.io) {
                // Pass original location preference if available in input data
                if (data.location) fullOffer.location = data.location;
                this._broadcastToNearbyTechnicians(fullOffer, userId);
            }

            // 3. Emit global event (Legacy / Admin)
            if (this.io) {
                this.io.emit('new_offer_created', fullOffer);
            }

            return fullOffer;
        } catch (err) {
            console.error("[OfferManager] Create Error:", err);
            throw err;
        }
    }

    async _broadcastToNearbyTechnicians(offer, userId) {
        try {
            console.log(`[OfferManager] Initiating Smart Broadcast for Offer ${offer.id}...`);
            let lat, lng;

            // [FIX] Priority 1: Use Location from Offer Payload (if passed)
            // Note: createOffer saves to DB then calls this. 'offer' is the DB result which might NOT have location column if schema doesn't support it.
            // But we can pass the ORIGINAL payload location if we change method signature or assume it's attached.
            // Actually, 'offer' argument here IS the result from _mapFromDb(created).
            // If the DB doesn't store location, we lost it.
            // BETTER: pass location explicitly to this method.

            // HOWEVER, for now, let's see if we can get it from USER first (Standard Flow).
            // Fallback: Check if 'offer' has it (maybe we added it to schema? No).

            // Let's rely on User Profile. 
            if (this.userManager && userId) {
                const user = await this.userManager.getUser(userId);
                if (user && user.location) {
                    lat = user.location.latitude;
                    lng = user.location.longitude;
                }
            }

            // [NEW] If still missing, check if it was temporarily attached to offer object by caller (hacky but works if we change createOffer)
            if ((!lat || !lng) && offer.location) {
                lat = offer.location.latitude;
                lng = offer.location.longitude;
            }

            if (!lat || !lng) {
                console.log("[OfferManager] Smart Broadcast skipped: No user location found.");
                return;
            }

            // Find Techs within 30km matching the Job Type
            const radius = 30;
            const nearbyTechs = await this.technicianManager.getTechniciansByLocation(lat, lng, radius);

            // Filter by Job Type match (if applicable)
            const matchedTechs = nearbyTechs.filter(t => {
                if (!offer.jobType) return true; // No specific type, notify all
                const tType = (t.serviceType || '').toLowerCase();
                const oType = offer.jobType.toLowerCase();
                return tType.includes(oType) || oType.includes(tType);
            });

            console.log(`[OfferManager] Found ${matchedTechs.length} nearby matching technicians.`);

            // Broadcast & Notify
            for (const tech of matchedTechs) {
                // 1. Socket Event
                this.io.to(`tech_${tech.id}`).emit('new_nearby_offer', offer);

                // 2. Persistent Notification
                await this.notificationManager.createNotification(
                    tech.id,
                    'technician',
                    'New Job Opportunity Nearby',
                    `New ${offer.jobType || 'Job'} offer available: ${offer.title} ($${offer.price})`,
                    'new_offer',
                    offer.id
                );
            }

        } catch (err) {
            console.error("[OfferManager] Smart Broadcast Error:", err);
        }
    }

    async getAllOffers() {
        try {
            const offers = await this.db.read();
            return offers.map(o => this._mapFromDb(o)).filter(o => o.isActive);
        } catch (err) {
            console.error("[OfferManager] Error getting all offers:", err);
            return [];
        }
    }

    async getOffersByUser(userId) {
        try {
            const offers = await this.db.find('user_id', userId); // Assuming find returns array or use findAll logic
            // SupabaseDatabase.js find() usually returns ONE. findAll() returns array. 
            // I should check SupabaseDatabase.js. If find() is single, I need findAll or logic.
            // Assuming db.read() returns all, I can filter.
            const all = await this.getAllOffers();
            return all.filter(o => o.userId === userId && o.type === 'job_bid');
        } catch (err) {
            console.error("[OfferManager] Error getting user offers:", err);
            return [];
        }
    }

    async getOffersByLocation(lat, lng, radiusKm = 30, technicianManager) {
        try {
            const allOffers = await this.getAllOffers();
            // Assuming this filter is for COUPONS shown to user based on Tech location?
            // Or Job Bids shown to Techs?
            // For now, leaving as is, targeting coupons.
            // If we want to show Job Bids to Techs nearby, we need similar logic.

            if (!lat || !lng || !technicianManager) return allOffers;

            const visibleTechIds = new Set(await technicianManager.getTechnicianIdsByLocation(lat, lng, radiusKm));

            // Show coupons from nearby techs + ALL Job Bids (since they are remote/user based?)
            // Or filter Job Bids by user location?
            // For simplicity, returning all.
            return allOffers;
        } catch (err) {
            console.error("[OfferManager] Error getting offers by location:", err);
            return [];
        }
    }

    async deleteOffer(id) {
        try {
            const result = await this.db.delete('id', id);
            if (this.io) {
                this.io.emit('offer_deleted', { id });
            }
            return result;
        } catch (err) {
            console.error(`[OfferManager] Error deleting offer ${id}:`, err);
            return false;
        }
    }
}

module.exports = OfferManager;
