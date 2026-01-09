const Database = require('./DatabaseLoader');

class TechnicianManager {
    constructor() {
        this.db = new Database('technicians');
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(tech) {
        if (!tech) return null;
        const { service_type, address_details, review_count, membership_since, joined_at, updated_at, documents, ...rest } = tech;
        return {
            ...rest,
            serviceType: service_type,
            addressDetails: address_details,
            reviewCount: review_count,
            membershipSince: membership_since,
            joinedAt: joined_at,
            updatedAt: updated_at,
            documents: documents || {} // Ensure documents is object
        };
    }

    // Helper to map App camelCase to DB snake_case
    _mapToDb(tech) {
        if (!tech) return null;
        const { serviceType, addressDetails, reviewCount, membershipSince, joinedAt, updatedAt, documents, id, ...rest } = tech;

        // Only include defined fields
        const mapped = { ...rest };
        if (serviceType !== undefined) mapped.service_type = serviceType;
        if (addressDetails !== undefined) mapped.address_details = addressDetails;
        if (reviewCount !== undefined) mapped.review_count = reviewCount;
        if (membershipSince !== undefined) mapped.membership_since = membershipSince;
        if (joinedAt !== undefined) mapped.joined_at = joinedAt;
        if (updatedAt !== undefined) mapped.updated_at = updatedAt;
        if (documents !== undefined) mapped.documents = documents;
        if (id !== undefined) mapped.id = id;

        return mapped;
    }

    async createTechnician(name, email, phone, serviceType, location, password, experience, addressDetails) {
        if (!name || !email || !password) {
            throw new Error("Missing required fields: name, email, or password");
        }

        const existing = await this.db.find('email', email);
        if (existing) {
            throw new Error('Technician already exists with this email');
        }

        const newTechnician = {
            name,
            email,
            phone,
            location,
            password,
            experience,
            rating: 0,
            status: 'available',
            // Mapped fields
            service_type: serviceType,
            address_details: addressDetails,
            documents: {},
            joined_at: new Date().toISOString()
        };

        const created = await this.db.add(newTechnician);
        return this._mapFromDb(created);
    }

    async login(email, password) {
        if (!email || !password) return null;

        const cleanEmail = email.trim().toLowerCase();
        const tech = await this.db.find('email', cleanEmail);

        if (!tech) {
            console.log(`[TechnicianManager] User not found for email: ${cleanEmail}`);
            return null;
        }

        if (tech.password === password) {
            console.log(`[TechnicianManager] Login successful for: ${tech.name}`);
            const appTech = this._mapFromDb(tech);
            const { password, ...techWithoutPass } = appTech;
            return techWithoutPass;
        } else {
            console.log(`[TechnicianManager] Password mismatch for: ${tech.name}`);
            return null;
        }
    }

    async getTechnician(id) {
        const tech = await this.db.find('id', id);
        if (tech) {
            const appTech = this._mapFromDb(tech);
            const { password, ...techWithoutPass } = appTech;
            return techWithoutPass;
        }
        return null;
    }

    async searchTechnicians(userLat, userLon, serviceType) {
        const lat = parseFloat(userLat);
        const lon = parseFloat(userLon);
        const type = (serviceType || '').toLowerCase().trim();

        // 1. Get all raw techs
        const allTechs = await this.db.read();

        // 2. Map and Filter
        const techs = allTechs
            .map(t => this._mapFromDb(t))
            .filter(t => t.serviceType && t.serviceType.toLowerCase().trim() === type);

        // 3. Filter by distance
        const nearbyTechs = techs.map(tech => {
            if (!tech.location) return null;

            // Support both {latitude, longitude} and {lat, lng} formats
            let tLat = tech.location.latitude ?? tech.location.lat;
            let tLon = tech.location.longitude ?? tech.location.lng;

            // Try parsing if string
            if (typeof tLat === 'string') tLat = parseFloat(tLat);
            if (typeof tLon === 'string') tLon = parseFloat(tLon);

            if (tLat === undefined || tLon === undefined || isNaN(tLat) || isNaN(tLon)) return null;

            const dist = this.calculateDistance(
                lat,
                lon,
                tLat,
                tLon
            );

            const { password, ...rest } = tech;

            // Normalize location for frontend consistency
            const normalizedLocation = {
                latitude: tLat,
                longitude: tLon,
                address: tech.location.address || ''
            };

            return {
                ...rest,
                location: normalizedLocation,
                distance: parseFloat(dist.toFixed(1))
            };
        }).filter(item => item !== null && item.distance <= 2.0); // Strict 2km radius

        const enrichedTechs = await this._enrichWithRatings(nearbyTechs);
        return enrichedTechs.sort((a, b) => a.distance - b.distance);
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
                        const categories = Object.values(f.ratings || {});
                        const feedbackAvg = categories.length ? categories.reduce((a, b) => a + b, 0) / categories.length : 0;
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

    async getAllTechnicians() {
        const all = await this.db.read();
        const rawTechs = all.map(t => {
            const appTech = this._mapFromDb(t);
            const { password, ...rest } = appTech;
            return rest;
        });
        return await this._enrichWithRatings(rawTechs);
    }

    async findByService(serviceType) {
        // Warning: findAll might query by snake_case field if we pass 'serviceType'
        // But Database.js (Supabase) won't know mapping. 
        // We should query by 'service_type'
        const matches = await this.db.findAll('service_type', serviceType);
        const rawTechs = matches.map(t => {
            const appTech = this._mapFromDb(t);
            const { password, ...rest } = appTech;
            return rest;
        });
        return await this._enrichWithRatings(rawTechs);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    deg2rad(deg) { return deg * (Math.PI / 180); }

    async updateLocation(id, location) {
        // Location is same in DB
        return await this.db.update('id', id, { location });
    }

    async updateTechnicianDocuments(id, documents) {
        const techRaw = await this.db.find('id', id);
        if (!techRaw) return null;

        // Need to handle existing docs which might be in DB format
        // But since we just want to merge, we can read, merge, write.
        const currentDocs = techRaw.documents || {};
        const updatedDocs = { ...currentDocs, ...documents };

        // Write back
        const result = await this.db.update('id', id, { documents: updatedDocs });
        return this._mapFromDb(result);
    }

    async updateStatus(id, status) {
        const result = await this.db.update('id', id, { status });
        return this._mapFromDb(result);
    }

    async updateProfile(id, updates) {
        const techRaw = await this.db.find('id', id);
        if (!techRaw) return null;

        // Map updates to DB format
        // This is tricky because updates uses camelCase
        const dbUpdates = this._mapToDb(updates);

        // Handle nested documents special case if needed, but _mapToDb handles top level
        // Merge strategy? Database.js update usually merges top-level fields.
        // If updates contains documents, it replaces.

        // Special case for photo in documents if passed separately?
        // Current logic: 
        // if (documents && documents.photo) { changes.documents = { ...tech.documents, photo: documents.photo }; }

        const currentDocs = techRaw.documents || {};
        if (updates.documents) {
            dbUpdates.documents = { ...currentDocs, ...updates.documents };
        }

        const result = await this.db.update('id', id, dbUpdates);
        return this._mapFromDb(result);
    }

    async updateMembership(id, type) {
        const result = await this.db.update('id', id, {
            membership: type,
            membership_since: new Date().toISOString()
        });
        return this._mapFromDb(result);
    }

    getOffers() { return []; }
}

module.exports = TechnicianManager;
