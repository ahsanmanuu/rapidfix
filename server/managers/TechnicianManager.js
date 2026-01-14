const Database = require('./DatabaseLoader');
// Syntax fix verified

const { geocodeAddress } = require('../utils/geocoder');

class TechnicianManager {
    constructor() {
        this.db = new Database('technicians');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(tech) {
        if (!tech) return null;
        try {
            const {
                service_type, address_details, review_count, membership_since,
                joined_at, updated_at, documents, location, base_address, service_radius,
                registered_latitude, registered_longitude, latitude, longitude,
                total_jobs, completed_jobs, rejected_jobs, pending_jobs, // [NEW] Stats
                ...rest
            } = tech;

            // Extract details - WE NOW PREFER TOP-LEVEL COLUMNS
            // Dynamic Location (Current)
            let lat = latitude;
            let lng = longitude;

            // Static Location (Registered Base)
            let regLat = registered_latitude;
            let regLng = registered_longitude;

            let addr = base_address;
            let rad = service_radius || 2; // Default 2km

            // Fallback for Dynamic: If no top-level lat/long, try JSON or Registered
            if ((lat === undefined || lat === null) && location && typeof location === 'object') {
                if (location.latitude) lat = location.latitude;
                if (location.longitude) lng = location.longitude;
            }
            // If still null, fallback to registered (assuming they haven't moved or just registered)
            if (lat === undefined || lat === null) {
                lat = regLat;
                lng = regLng;
            }

            // Fallback for Address/Radius
            if (location && typeof location === 'object') {
                if (!addr && location.address) addr = location.address;
                if (!rad && location.serviceRadius) rad = location.serviceRadius;
            }

            return {
                ...rest,
                serviceType: service_type,
                addressDetails: address_details,
                reviewCount: review_count,
                membershipSince: membership_since,
                joinedAt: joined_at,
                updatedAt: updated_at,
                // [NEW]
                membershipExpiry: membership_expiry,
                documents: documents || {},
                location: location || {}, // Keep original json too if needed

                // Dynamic (Current Position)
                latitude: lat,
                longitude: lng,

                // Static (Home Base)
                registeredLatitude: regLat,
                registeredLongitude: regLng,

                baseAddress: addr,
                serviceRadius: rad,

                // Stats
                totalJobs: total_jobs || 0,
                completedJobs: completed_jobs || 0,
                completedJobs: completed_jobs || 0,
                rejectedJobs: rejected_jobs || 0,
                pendingJobs: pending_jobs || 0,
                acceptedJobs: accepted_jobs || 0 // [NEW]
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
                serviceType, addressDetails, reviewCount, membershipSince, joinedAt, updatedAt,
                documents, baseAddress, serviceRadius, id,
                latitude, longitude, registeredLatitude, registeredLongitude,
                location,
                totalJobs, completedJobs, rejectedJobs, pendingJobs, acceptedJobs, // [NEW] Stats
                membershipExpiry, // [NEW] Membership
                ...rest
            } = tech;

            const mapped = { ...rest };
            if (serviceType !== undefined) mapped.service_type = serviceType;
            if (addressDetails !== undefined) mapped.address_details = addressDetails;
            if (reviewCount !== undefined) mapped.review_count = reviewCount;
            if (membershipSince !== undefined) mapped.membership_since = membershipSince;
            if (membershipExpiry !== undefined) mapped.membership_expiry = membershipExpiry; // [NEW]
            if (joinedAt !== undefined) mapped.joined_at = joinedAt;
            if (updatedAt !== undefined) mapped.updated_at = updatedAt;
            if (documents !== undefined) mapped.documents = documents;
            if (id !== undefined) mapped.id = id;

            // Direct Columns
            if (latitude !== undefined) mapped.latitude = latitude;
            if (longitude !== undefined) mapped.longitude = longitude;
            if (registeredLatitude !== undefined) mapped.registered_latitude = registeredLatitude;
            if (registeredLongitude !== undefined) mapped.registered_longitude = registeredLongitude;
            if (baseAddress !== undefined) mapped.base_address = baseAddress;
            if (serviceRadius !== undefined) mapped.service_radius = serviceRadius;

            // Stats
            if (totalJobs !== undefined) mapped.total_jobs = totalJobs;
            if (completedJobs !== undefined) mapped.completed_jobs = completedJobs;
            if (completedJobs !== undefined) mapped.completed_jobs = completedJobs;
            if (rejectedJobs !== undefined) mapped.rejected_jobs = rejectedJobs;
            if (pendingJobs !== undefined) mapped.pending_jobs = pendingJobs;
            if (acceptedJobs !== undefined) mapped.accepted_jobs = acceptedJobs; // [NEW]

            return mapped;
        } catch (err) {
            console.error("[TechnicianManager] Error mapping to DB:", err);
            return tech;
        }
    }

    async createTechnician(name, email, phone, serviceType, locationInput, password, experience, addressDetails) {
        try {
            if (!name || !email || !password) {
                throw new Error("Missing required fields: name, email, or password");
            }

            const existing = await this.db.find('email', email);
            if (existing) {
                throw new Error('Technician already exists with this email');
            }

            let lat = null;
            let lng = null;
            let baseAddress = null;

            // Handle Location Input
            if (locationInput) {
                if (typeof locationInput === 'string') {
                    baseAddress = locationInput;
                    const coords = await geocodeAddress(locationInput);
                    if (coords) {
                        lat = coords.lat;
                        lng = coords.lng;
                    }
                } else if (typeof locationInput === 'object') {
                    lat = locationInput.latitude;
                    lng = locationInput.longitude;
                    baseAddress = locationInput.address || addressDetails;
                }
            }

            const newTechnician = {
                id: Date.now().toString(),
                name,
                email,
                phone,
                password, // Stored as plain text per previous code pattern (should be hashed in production!)
                experience,
                rating: 0,
                status: 'available',
                service_type: serviceType,
                address_details: addressDetails,
                documents: {},
                joined_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),

                // Set both Static and Dynamic to the same initial value
                latitude: lat,
                longitude: lng,
                registeredLatitude: lat,
                registeredLongitude: lng,

                baseAddress: baseAddress,
                serviceRadius: 2
            };

            const dbRecord = this._mapToDb(newTechnician);
            const created = await this.db.add(dbRecord);
            const tech = this._mapFromDb(created);

            if (this.io) {
                this.io.emit('new_technician_registered', tech);
            }

            return tech;
        } catch (err) {
            console.error("[TechnicianManager] Error creating technician:", err);
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
            const cleanEmail = email.trim().toLowerCase();
            const tech = await this.db.find('email', cleanEmail);

            if (!tech) return null;

            if (tech.password === password) {
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
            }
            return null;
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

    async searchTechnicians(userLat, userLon, serviceType, radius = 2.0) {
        try {
            const lat = parseFloat(userLat);
            const lon = parseFloat(userLon);
            const type = this._normalizeType(serviceType);

            const allTechs = await this.db.read();
            const techs = allTechs
                .map(t => this._mapFromDb(t))
                .filter(t => {
                    const dbType = t.serviceType || t.service_type || '';
                    return this._normalizeType(dbType) === type;
                });

            const nearbyTechs = techs.map(tech => {
                // PRIORITIZE FIXED/REGISTERED LOCATION
                let tLat = tech.registeredLatitude;
                let tLon = tech.registeredLongitude;

                // Fallback to Dynamic if Fixed is missing (Legacy support)
                if (tLat === undefined || tLon === undefined || tLat === null || tLon === null) {
                    tLat = tech.latitude;
                    tLon = tech.longitude;
                }

                // Checking valid numbers
                if (tLat === undefined || tLon === undefined || isNaN(tLat) || isNaN(tLon)) return null;

                const dist = this.calculateDistance(lat, lon, tLat, tLon);
                const { password, ...rest } = tech;

                return {
                    ...rest,
                    location: { latitude: tLat, longitude: tLon, address: tech.baseAddress || '' },
                    distance: parseFloat(dist.toFixed(1))
                };
            }).filter(item => item !== null && item.distance <= radius);

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

    async updateStatus(id, status) {
        try {
            const result = await this.db.update('id', id, { status });
            const tech = this._mapFromDb(result);
            if (this.io) {
                this.io.emit('technician_status_update', { technicianId: id, status });
                this.io.to(`tech_${id}`).emit('profile_updated', tech);
            }
            return tech;
        } catch (err) {
            console.error(`[TechnicianManager] Error updating status for tech ${id}:`, err);
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
            } else if (type === 'accept') { // [NEW]
                accepted += 1;
                // Pending remains roughly same logic or decrease if distinct phases, 
                // but usually 'pending' means 'awaiting action'. 
                // If 'accepted', it might still be active but no longer 'pending decision'.
                // Let's assume pending decreases when accepted.
                if (pending > 0) pending -= 1;
            } else if (type === 'complete') {
                completed += 1;
                // If 'in_progress' to 'complete', no pending change usually.
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
}

module.exports = TechnicianManager;
