const BaseManager = require('./BaseManager');
const { geocodeAddress } = require('../utils/geocoder');
const crypto = require('crypto');

class TechnicianManager extends BaseManager {
    constructor() {
        super('technicians'); // BaseManager sets up this.db with 'technicians'
        this.io = null;
    }

    // Helper: Convert any string to a deterministic UUID
    _toUuid(input) {
        if (!input) return null;
        // If already a valid UUID, return it
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(input)) return input;

        // Otherwise, hash it to create a UUID-like string
        const hash = crypto.createHash('md5').update(String(input)).digest('hex');
        // Format: 8-4-4-4-12
        return `${hash.substring(0, 8)}-${hash.substring(8, 12)}-${hash.substring(12, 16)}-${hash.substring(16, 20)}-${hash.substring(20, 32)}`;
    }

    setSocketIO(io) {
        this.io = io;
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(tech) {
        if (!tech) return null;
        try {
            // Support both snake_case (Supabase) and camelCase (Local JSON/Legacy)
            const serviceType = tech.service_type || tech.serviceType;
            const addressDetails = tech.address_details || tech.addressDetails;
            const reviewCount = tech.review_count || tech.reviewCount || tech.totalReviews || 0;
            const membershipSince = tech.membership_since || tech.membershipSince;
            const membershipExpiry = tech.membership_expiry || tech.membershipExpiry;
            const joinedAt = tech.joined_at || tech.joinedAt || tech.createdAt;
            const updatedAt = tech.updated_at || tech.updatedAt;
            const createdBy = tech.created_by || tech.createdBy; // [FIX] ID-1532 Mapping

            const totalJobs = tech.total_jobs || tech.totalJobs || 0;
            const completedJobs = tech.completed_jobs || tech.completedJobs || 0;
            const rejectedJobs = tech.rejected_jobs || tech.rejectedJobs || 0;
            const pendingJobs = tech.pending_jobs || tech.pendingJobs || 0;
            const acceptedJobs = tech.accepted_jobs || tech.acceptedJobs || 0;

            const documents = tech.documents || {};
            const location = tech.location || {};
            const baseAddress = tech.base_address || tech.baseAddress;
            const serviceRadius = tech.service_radius || tech.serviceRadius || 2;

            // Coordinates
            let lat = tech.latitude;
            let lng = tech.longitude;
            // Fixed lat/lng
            let fixedLat = tech.fixed_latitude || tech.fixedLatitude;
            let fixedLng = tech.fixed_longitude || tech.fixedLongitude;

            let regLat = tech.registered_latitude || tech.registeredLatitude;
            let regLng = tech.registered_longitude || tech.registeredLongitude;

            // Fallbacks for Lat/Lng
            if ((lat === undefined || lat === null) && location.latitude) lat = location.latitude;
            if ((lng === undefined || lng === null) && location.longitude) lng = location.longitude;

            // Fallbacks for Registered Lat/Lng
            if (regLat === undefined || regLat === null) regLat = lat;
            if (regLng === undefined || regLng === null) regLng = lng;

            // If still null, try location object for registered too
            if ((regLat === undefined || regLat === null) && location.latitude) regLat = location.latitude;
            if ((regLng === undefined || regLng === null) && location.longitude) regLng = location.longitude;

            return {
                ...tech,
                serviceType,
                addressDetails,
                reviewCount,
                membershipSince,
                membershipExpiry,
                joinedAt,
                updatedAt,
                createdBy,
                documents,
                location,
                baseAddress,
                serviceRadius,
                latitude: lat,
                longitude: lng,
                fixedLatitude: fixedLat,
                fixedLongitude: fixedLng,
                registeredLatitude: regLat,
                registeredLongitude: regLng,
                totalJobs,
                completedJobs,
                rejectedJobs,
                pendingJobs,
                acceptedJobs
            };
        } catch (err) {
            console.error("[TechnicianManager] Error mapping from DB:", err);
            return tech;
        }
    }

    _normalizeType(type) {
        if (!type) return '';
        // Remove dots, hyphens, and spaces, then lowercase
        return type.toString().toLowerCase().replace(/[\.\-\s]/g, '');
    }

    // Helper to map App camelCase to DB snake_case
    _mapToDb(tech) {
        if (!tech) return null;
        try {
            // Destructure known app properties
            const {
                serviceType, addressDetails, reviewCount, membershipSince, membershipExpiry,
                joinedAt, updatedAt, totalJobs, completedJobs, rejectedJobs, pendingJobs, acceptedJobs,
                baseAddress, serviceRadius, registeredLatitude, registeredLongitude,
                fixedLatitude, fixedLongitude,
                createdAt, createdBy, id,
                ...rest
            } = tech;

            const mapped = { ...rest };
            if (serviceType) mapped.service_type = serviceType;
            if (addressDetails) mapped.address_details = addressDetails;
            if (reviewCount !== undefined) mapped.review_count = reviewCount;
            if (membershipSince) mapped.membership_since = membershipSince;
            if (membershipExpiry) mapped.membership_expiry = membershipExpiry;
            if (joinedAt) mapped.joined_at = joinedAt;
            if (updatedAt) mapped.updated_at = updatedAt;
            if (createdAt) mapped.created_at = createdAt; // IMPORTANT
            if (createdBy) mapped.created_by = createdBy; // IMPORTANT
            if (typeof totalJobs === 'number') mapped.total_jobs = totalJobs;
            if (typeof completedJobs === 'number') mapped.completed_jobs = completedJobs;
            if (typeof rejectedJobs === 'number') mapped.rejected_jobs = rejectedJobs;
            if (typeof pendingJobs === 'number') mapped.pending_jobs = pendingJobs;
            if (typeof acceptedJobs === 'number') mapped.accepted_jobs = acceptedJobs;

            // Direct Columns
            if (baseAddress) mapped.base_address = baseAddress;
            if (serviceRadius) mapped.service_radius = serviceRadius;

            if (registeredLatitude) mapped.registered_latitude = registeredLatitude;
            if (registeredLongitude) mapped.registered_longitude = registeredLongitude;
            if (fixedLatitude) mapped.fixed_latitude = fixedLatitude; // New
            if (fixedLongitude) mapped.fixed_longitude = fixedLongitude; // New

            if (id) mapped.id = id;

            return mapped;
        } catch (err) {
            console.error("[TechnicianManager] Error mapping to DB:", err);
            return tech;
        }
    }

    async createTechnician(technicianData, createdBy = null, fixedLocation = null) {
        try {
            const { name, email, phone, serviceType, addressDetails, experience } = technicianData;

            // Validate mandatory fields
            if (!name || !email || !serviceType) {
                throw new Error("Missing required fields: name, email, or serviceType");
            }

            // Check if email already exists
            const existing = await this.findOne('email', email);
            if (existing) {
                throw new Error("Technician with this email already exists");
            }

            // Geocoding Logic
            let lat = null;
            let lng = null;
            let finalAddress = addressDetails;

            // [FIX] Priority: Fixed Location (from Admin) > Address Geocoding
            if (fixedLocation && fixedLocation.latitude && fixedLocation.longitude) {
                lat = fixedLocation.latitude;
                lng = fixedLocation.longitude;
                // If address is also passed in fixedLocation, use it
                if (fixedLocation.address) finalAddress = fixedLocation.address;
            }
            else if (addressDetails) {
                const coords = await geocodeAddress(addressDetails);
                if (coords) {
                    lat = coords.lat;
                    lng = coords.lng;
                }
            }

            // Explicitly verify coordinates
            if ((!lat || !lng) && fixedLocation) {
                lat = fixedLocation.latitude;
                lng = fixedLocation.longitude;
            }

            const newTechnician = {
                id: crypto.randomUUID(), // Standard UUID
                name,
                email,
                phone,
                serviceType,
                addressDetails: finalAddress,
                experience, // Now calling code passes this
                password: technicianData.password, // Store password (should be hashed in production)
                status: 'Available', // Explicitly set to Available so they show up in search immediately
                rating: 0,
                reviewCount: 0,
                membership: 'Standard',
                membershipSince: new Date().toISOString(),
                joinedAt: new Date().toISOString(),
                location: { latitude: lat, longitude: lng },
                latitude: lat,
                longitude: lng,

                // Add Fixed Location
                fixedLatitude: lat,
                fixedLongitude: lng,

                documents: {
                    verificationStatus: 'Pending',
                    photo: null
                },

                // Add Creator ID using deterministic UUID helper if needed
                createdBy: this._toUuid(createdBy)
            };

            // Use BaseManager's automated create
            const created = await this.create(newTechnician);

            // Special Event: Notify Admins explicitly (BaseManager already emits 'technician_created')
            if (this.io) {
                // Keep this for any legacy listeners expecting 'new_technician'
                this.io.emit('new_technician', created);
            }

            return created;
        } catch (err) {
            console.error("[TechnicianManager] Create Error:", err);

            // [Self-Healing] If created_by error, retry without it
            if (err.message && err.message.includes("created_by") && technicianData.createdBy) {
                console.log("[TechnicianManager] Retrying creation without 'createdBy'...");
                return this.createTechnician({ ...technicianData, createdBy: null }, null, fixedLocation);
            }
            throw err;
        }
    }

    async updateTechnicianDocuments(id, docPaths) {
        try {
            const tech = await this.db.find('id', id);
            if (!tech) return null;

            const currentDocs = tech.documents || {};
            const newDocs = { ...currentDocs, ...docPaths };

            // Ensure we map to DB format (snake_case if needed)
            const updates = { documents: newDocs };
            const dbUpdates = this._mapToDb(updates);

            const result = await this.db.update('id', id, dbUpdates);
            return this._mapFromDb(result);
        } catch (err) {
            console.error("[TechnicianManager] Error updating documents:", err);
            return null;
        }
    }

    async login(email, password, currentLat, currentLng) {
        try {
            if (!email || !password) return null;
            const cleanEmail = String(email).trim(); // Remove toLowerCase logic here, handle in query
            const cleanPassword = String(password).trim();

            let tech = null;
            // Case-insensitive search
            if (this.db.client) {
                const columns = 'id, name, email, phone, service_type, experience, rating, review_count, status, membership, joined_at, updated_at, location, documents';
                const { data } = await this.db.client
                    .from(this.tableName)
                    .select(columns)
                    .ilike('email', cleanEmail)
                    .maybeSingle();
                if (data) tech = this._mapFromDb(data);
            } else {
                tech = await this.db.find('email', cleanEmail.toLowerCase());
            }

            if (!tech) {
                console.log(`[TechnicianManager] Login failed: Tech not found for ${cleanEmail}`);
                return null;
            }

            const dbPassword = String(tech.password).trim();
            if (dbPassword === cleanPassword) {
                // Prepare return object
                let techObj = this._mapFromDb(tech);

                // Update Dynamic Location if provided
                if (currentLat && currentLng) {
                    // Fire and forget update (awaiting it might slow down login slightly, but safer to await)
                    await this.updateLocation(tech.id, { latitude: currentLat, longitude: currentLng });
                    // Update the object in memory to return fresh state
                    techObj.latitude = currentLat;
                    techObj.longitude = currentLng;
                }

                const { password, ...techWithoutPass } = techObj;
                return techWithoutPass;
            } else {
                console.log(`[TechnicianManager] Login failed: Incorrect password for ${cleanEmail}. (Input: ${cleanPassword.length}, DB: ${dbPassword.length})`);
                return null;
            }
        } catch (err) {
            console.error("[TechnicianManager] Login error:", err);
            return null;
        }
    }

    async getTechnician(id) {
        try {
            const tech = await this.db.find('id', id);
            if (tech) {
                const { password, ...techWithoutPass } = this._mapFromDb(tech);
                return techWithoutPass;
            }
            return null;
        } catch (err) {
            console.error(`[TechnicianManager] Error getting tech ${id}:`, err);
            return null;
        }
    }

    async getAllTechnicians() {
        try {
            const techs = await this.db.read();
            return techs.map(t => {
                const { password, ...rest } = this._mapFromDb(t);
                return rest;
            });
        } catch (err) {
            console.error("[TechnicianManager] Error getting all techs:", err);
            return [];
        }
    }

    async searchTechnicians(userLat, userLon, serviceType, radius = 30.0) {
        try {
            const lat = parseFloat(userLat);
            const lon = parseFloat(userLon);
            const type = this._normalizeType(serviceType);

            // [UPDATED] Relaxed limit for testing/demo availability
            // const effectiveRadius = Math.min(Number(radius) || 30, 30);
            const effectiveRadius = Number(radius) || 10000; // Global search for demo

            // Fix: Fetch technicians from DB if not available in scope
            const allTechs = await this.db.read();

            const techs = allTechs
                .map(t => this._mapFromDb(t))
                .filter(t => {
                    const dbType = t.serviceType || t.service_type || '';
                    const normalizedDbType = this._normalizeType(dbType);
                    // Match Service Type
                    return normalizedDbType === type || normalizedDbType.includes(type) || type.includes(normalizedDbType);
                });

            const nearbyTechs = techs.map(tech => {
                // [UPDATED] PRIORITIZE DYNAMIC LOCATION (Real-time) over Registered
                let tLat = tech.latitude;
                let tLon = tech.longitude;

                // Fallback to Registered/Fixed if Dynamic is missing
                if (tLat === undefined || tLon === undefined || tLat === null || tLon === null) {
                    tLat = tech.registeredLatitude || tech.fixedLatitude;
                    tLon = tech.registeredLongitude || tech.fixedLongitude;
                }

                // Checking valid numbers
                if (tLat === undefined || tLon === undefined || isNaN(parseFloat(tLat)) || isNaN(parseFloat(tLon))) return null;

                const dist = this.calculateDistance(lat, lon, parseFloat(tLat), parseFloat(tLon));
                const { password, ...rest } = tech;

                return {
                    ...rest,
                    location: { latitude: tLat, longitude: tLon, address: tech.baseAddress || '' },
                    distance: parseFloat(dist.toFixed(1))
                };
            }).filter(item => item !== null && item.distance <= effectiveRadius);

            const enrichedTechs = await this._enrichWithRatings(nearbyTechs);
            return enrichedTechs.sort((a, b) => a.distance - b.distance);
        } catch (err) {
            console.error("[TechnicianManager] Error searching technicians:", err);
            return [];
        }
    }

    async _enrichWithRatings(techs) {
        try {
            const FeedbackManager = require('./FeedbackManager');
            const feedbackManager = new FeedbackManager();

            const enriched = [];
            for (const tech of techs) {
                const feedbacks = await feedbackManager.getFeedbackForTechnician(tech.id);
                let averageRating = 0;

                if (feedbacks && feedbacks.length > 0) {
                    const total = feedbacks.reduce((sum, f) => {
                        const ratings = f.ratings || {};
                        const vals = Object.values(ratings);
                        const feedbackAvg = vals.length ? vals.reduce((a, b) => a + Number(b), 0) / vals.length : 0;
                        return sum + feedbackAvg;
                    }, 0);
                    averageRating = parseFloat((total / feedbacks.length).toFixed(1));
                }

                enriched.push({
                    ...tech,
                    rating: averageRating,
                    reviewCount: feedbacks ? feedbacks.length : 0
                });
            }
            return enriched;
        } catch (err) {
            console.error("[TechnicianManager] Enrich Ratings Error:", err);
            return techs;
        }
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    async updateLocation(id, location) {
        try {
            // Support both objects {latitude, longitude} and raw args if needed, but here assuming object
            let updates = {};

            if (location.latitude !== undefined) updates.latitude = location.latitude;
            if (location.longitude !== undefined) updates.longitude = location.longitude;

            // If it's the "registered" location update requested specifically (rarely used directly)
            if (location.registeredLatitude !== undefined) updates.registered_latitude = location.registeredLatitude;
            if (location.registeredLongitude !== undefined) updates.registered_longitude = location.registeredLongitude;

            const result = await this.db.update('id', id, updates);

            if (this.io) {
                // Emit event for real-time tracking (Maps)
                this.io.emit('technician_location_update', {
                    technicianId: id,
                    location: {
                        latitude: location.latitude,
                        longitude: location.longitude
                    }
                });
            }
            return result;
        } catch (err) {
            console.error(`[TechnicianManager] Error updating location for tech ${id}:`, err);
            return null;
        }
    }

    setJobManager(jobManager) {
        this.jobManager = jobManager;
    }

    async updateStatus(id, status) {
        try {
            console.log(`[TechnicianManager] Updating status for Tech ${id}: ${status}`);
            // [FIX] Data Integrity: Prevent Objects/JSON from being saved as status
            let cleanStatus = status;
            if (typeof status === 'object' && status !== null) {
                console.warn(`[TechnicianManager] status update for ${id} was an object! Attempting to extract status field.`);
                cleanStatus = status.status || 'unknown';
            }
            // If it's a string but looks like JSON, it might have been double-encoded elsewhere
            if (typeof cleanStatus === 'string' && cleanStatus.startsWith('{')) {
                try {
                    const parsed = JSON.parse(cleanStatus);
                    cleanStatus = parsed.status || cleanStatus;
                } catch (e) { }
            }

            console.log(`[TechnicianManager] Calling DB update with status: ${cleanStatus}`);
            const result = await this.db.update('id', id, { status: String(cleanStatus) });

            if (!result) {
                console.error(`[TechnicianManager] DB update returned null for Tech ${id}`);
                return null;
            }

            console.log(`[TechnicianManager] DB update successful for Tech ${id}, new status: ${result.status}`);
            const tech = this._mapFromDb(result);

            if (this.io) {
                console.log(`[TechnicianManager] Emitting socket events for Tech ${id} status update`);
                this.io.emit('technician_status_update', { technicianId: id, status: cleanStatus });
                this.io.to(`tech_${id}`).emit('profile_updated', tech);
            }

            // [NEW] Queue Watcher Hook
            if (String(cleanStatus).toLowerCase() === 'available' && this.jobManager) {
                console.log(`[TechnicianManager] Tech ${id} is now Available. Checking Queue...`);
                // Fire and forget - verify queue in background
                this.jobManager.checkQueueForTechnician(id).catch(err => console.error(`[TechnicianManager] Queue Check Error for ${id}:`, err));
            }

            return tech;
        } catch (err) {
            console.error(`[TechnicianManager] Error updating status for tech ${id}:`, err);
            return null;
        }
    }

    async updateRating(id, rating) {
        try {
            console.log(`[TechnicianManager] Updating rating for Tech ${id}: ${rating}`);
            const result = await this.db.update('id', id, { rating: Number(rating) });

            if (!result) {
                console.error(`[TechnicianManager] DB update returned null for Tech ${id}`);
                return null;
            }

            console.log(`[TechnicianManager] Rating update successful for Tech ${id}, new rating: ${result.rating}`);
            const tech = this._mapFromDb(result);

            if (this.io) {
                this.io.emit('technician_rating_updated', { technicianId: id, rating });
                this.io.to(`tech_${id}`).emit('profile_updated', tech);
            }
            return tech;
        } catch (err) {
            console.error(`[TechnicianManager] Error updating rating for tech ${id}:`, err);
            return null;
        }
    }

    async updateProfile(id, updates) {
        try {
            const techRaw = await this.db.find('id', id);
            if (!techRaw) return null;

            // Handle Location Input - For Profile Updates, this usually implies Changing Home Base (Registered)
            // But if we want it to be current... typically "Profile" address is "Registered" address.
            // Let's assume Profile Address = Registered Location.

            if (updates.location) {
                if (typeof updates.location === 'string') {
                    updates.baseAddress = updates.location;
                    const coords = await geocodeAddress(updates.location);
                    if (coords) {
                        updates.registeredLatitude = coords.lat;
                        updates.registeredLongitude = coords.lng;
                        // Also update current if they are moving base? Maybe not always.
                        // Let's safe-bet: changing profile address updates registered location.
                    }
                } else if (typeof updates.location === 'object') {
                    // Direct override
                    if (updates.location.latitude) updates.registeredLatitude = updates.location.latitude;
                    if (updates.location.longitude) updates.registeredLongitude = updates.location.longitude;

                    if (!updates.baseAddress && (updates.location.address || updates.location.baseAddress)) {
                        updates.baseAddress = updates.location.address || updates.location.baseAddress;
                    }
                }
                delete updates.location; // handled
            }

            const dbUpdates = this._mapToDb(updates);
            const currentDocs = techRaw.documents || {};
            if (updates.documents) {
                dbUpdates.documents = { ...currentDocs, ...updates.documents };
            }

            const result = await this.db.update('id', id, dbUpdates);
            const tech = this._mapFromDb(result);

            if (this.io) {
                this.io.to(`tech_${id}`).emit('profile_updated', tech);
                this.io.emit('admin_tech_update', tech);
            }
            return tech;
        } catch (err) {
            console.error(`[TechnicianManager] Error updating profile for tech ${id}:`, err);
            return null;
        }
    }

    async updateMembership(id, type) {
        try {
            const result = await this.db.update('id', id, {
                membership: type,
                membership_since: new Date().toISOString()
            });
            const tech = this._mapFromDb(result);
            if (this.io) {
                this.io.to(`tech_${id}`).emit('membership_updated', { membership: type });
            }
            return tech;
        } catch (err) {
            console.error(`[TechnicianManager] Error updating membership for tech ${id}:`, err);
            return null;
        }
    }

    async updateStats(id, { type }) {
        try {
            const tech = await this.db.find('id', id);
            if (!tech) return null;

            let total = tech.total_jobs || 0;
            let completed = tech.completed_jobs || 0;
            let rejected = tech.rejected_jobs || 0;
            let pending = tech.pending_jobs || 0;
            let accepted = tech.accepted_jobs || 0; // [NEW]

            if (type === 'assign') {
                total += 1;
                pending += 1;
            } else if (type === 'accept') {
                accepted += 1;
                if (pending > 0) pending -= 1;
            } else if (type === 'complete') {
                completed += 1;
                // 'accepted' job becomes 'completed'. 'accepted' count remains as historical record of acceptance? 
                // Usually dashboard stats are 'current state'. 
                // Let's assume 'Accepted' means 'Currently Active'.
                if (accepted > 0) accepted -= 1;
            } else if (type === 'reject') {
                rejected += 1;
                if (pending > 0) pending -= 1;
            }

            const updates = {
                total_jobs: total,
                completed_jobs: completed,
                rejected_jobs: rejected,
                pending_jobs: pending,
                accepted_jobs: accepted
            };

            const result = await this.db.update('id', id, updates);
            const updatedTech = this._mapFromDb(result);

            if (this.io) {
                this.io.to(`tech_${id}`).emit('stats_updated', updatedTech);
                this.io.emit('admin_tech_update', updatedTech); // [NEW] Notify Admin
            }
            return updatedTech;
        } catch (err) {
            console.error(`[TechnicianManager] Error updating stats for tech ${id}:`, err);
            return null;
        }
    }

    async getAllTechnicians() {
        try {
            const allTechs = await this.db.read();
            return allTechs.map(t => this._mapFromDb(t));
        } catch (err) {
            console.error('[TechnicianManager] Error getting all technicians:', err);
            return [];
        }
    }

    getOffers() { return []; }

    // [NEW] Get technicians within specific radius
    async getTechniciansByLocation(lat, lng, radiusKm = 30) {
        try {
            console.log(`[TechnicianManager] Filtering techs near ${lat}, ${lng} (Radius: ${radiusKm}km)`);
            const allTechs = await this.getAllTechnicians();
            if (!lat || !lng) return allTechs;

            const filtered = allTechs.filter(t => {
                // [UPDATED] Use dynamic location primarily
                const tLat = parseFloat(t.latitude || t.registeredLatitude);
                const tLon = parseFloat(t.longitude || t.registeredLongitude);
                const searchLat = parseFloat(lat);
                const searchLng = parseFloat(lng);

                if (isNaN(tLat) || isNaN(tLon)) return false;

                const dist = this.calculateDistance(searchLat, searchLng, tLat, tLon);
                // console.log(` - Tech ${t.name} (${t.id}): ${dist.toFixed(2)}km`);
                return dist <= radiusKm;
            });

            console.log(`[TechnicianManager] Found ${filtered.length} techs within range out of ${allTechs.length}`);
            return filtered;
        } catch (err) {
            console.error("[TechnicianManager] Error getting techs by location:", err);
            return [];
        }
    }

    async getTechnicianIdsByLocation(lat, lng, radiusKm = 30) {
        const techs = await this.getTechniciansByLocation(lat, lng, radiusKm);
        return techs.map(t => t.id);
    }
}

module.exports = TechnicianManager;
