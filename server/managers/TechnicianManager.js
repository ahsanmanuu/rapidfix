const Database = require('./DatabaseLoader');

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
            const { service_type, address_details, review_count, membership_since, joined_at, updated_at, documents, location, base_address, service_radius, ...rest } = tech;

            // Extract details from location JSONB if available
            let lat = tech.latitude;
            let lng = tech.longitude;
            let addr = base_address;
            let rad = service_radius || 10;

            if (location && typeof location === 'object') {
                if (location.latitude) lat = location.latitude;
                if (location.longitude) lng = location.longitude;
                if (location.address) addr = location.address;
                if (location.serviceRadius) rad = location.serviceRadius;
            }

            return {
                ...rest,
                serviceType: service_type,
                addressDetails: address_details,
                reviewCount: review_count,
                membershipSince: membership_since,
                joinedAt: joined_at,
                updatedAt: updated_at,
                documents: documents || {},
                location: location || {}, // Keep original json too if needed
                latitude: lat,
                longitude: lng,
                baseAddress: addr,
                serviceRadius: rad
            };
        } catch (err) {
            console.error("[TechnicianManager] Error mapping from DB:", err);
            return tech;
        }
    }

    // Helper to map App camelCase to DB snake_case
    _mapToDb(tech) {
        if (!tech) return null;
        try {
            // Destructure known app properties
            const {
                serviceType, addressDetails, reviewCount, membershipSince, joinedAt, updatedAt,
                documents, baseAddress, serviceRadius, id, latitude, longitude, location,
                ...rest
            } = tech;

            const mapped = { ...rest };
            if (serviceType !== undefined) mapped.service_type = serviceType;
            if (addressDetails !== undefined) mapped.address_details = addressDetails;
            if (reviewCount !== undefined) mapped.review_count = reviewCount;
            if (membershipSince !== undefined) mapped.membership_since = membershipSince;
            if (joinedAt !== undefined) mapped.joined_at = joinedAt;
            if (updatedAt !== undefined) mapped.updated_at = updatedAt;
            if (documents !== undefined) mapped.documents = documents;
            if (id !== undefined) mapped.id = id;

            // Construct Location JSONB
            // We prioritize existing location object, then overlay updates
            let locObj = (location && typeof location === 'object') ? { ...location } : {};

            if (latitude !== undefined) locObj.latitude = latitude;
            if (longitude !== undefined) locObj.longitude = longitude;
            if (baseAddress !== undefined) locObj.address = baseAddress;
            if (serviceRadius !== undefined) locObj.serviceRadius = serviceRadius;

            // Only set location if it has meaningful data
            if (Object.keys(locObj).length > 0) {
                mapped.location = locObj;
            }

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
                location: {
                    latitude: lat,
                    longitude: lng,
                    address: baseAddress,
                    serviceRadius: 10
                }
            };

            const created = await this.db.add(newTechnician);
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

    async login(email, password) {
        try {
            if (!email || !password) return null;
            const cleanEmail = email.trim().toLowerCase();
            const tech = await this.db.find('email', cleanEmail);

            if (!tech) return null;

            if (tech.password === password) {
                const { password, ...techWithoutPass } = this._mapFromDb(tech);
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

    async searchTechnicians(userLat, userLon, serviceType, radius = 10.0) {
        try {
            const lat = parseFloat(userLat);
            const lon = parseFloat(userLon);
            const type = (serviceType || '').toLowerCase().trim();

            const allTechs = await this.db.read();
            const techs = allTechs
                .map(t => this._mapFromDb(t))
                .filter(t => t.serviceType && t.serviceType.toLowerCase().trim() === type);

            const nearbyTechs = techs.map(tech => {
                // Check if we have valid coordinates
                let tLat = tech.latitude;
                let tLon = tech.longitude;

                // Fallback to legacy location object if exists
                if ((tLat === undefined || tLon === undefined) && tech.location && typeof tech.location === 'object') {
                    tLat = tech.location.latitude ?? tech.location.lat;
                    tLon = tech.location.longitude ?? tech.location.lng;
                }

                if (typeof tLat === 'string') tLat = parseFloat(tLat);
                if (typeof tLon === 'string') tLon = parseFloat(tLon);

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
            const result = await this.db.update('id', id, { location });
            if (this.io) {
                this.io.emit('technician_location_update', { technicianId: id, location });
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

            // Handle Location Input
            if (updates.location) {
                if (typeof updates.location === 'string') {
                    updates.baseAddress = updates.location;
                    const coords = await geocodeAddress(updates.location);
                    if (coords) {
                        updates.latitude = coords.lat;
                        updates.longitude = coords.lng;
                    }
                } else if (typeof updates.location === 'object') {
                    updates.latitude = updates.location.latitude;
                    updates.longitude = updates.location.longitude;

                    if (!updates.location.address && !updates.location.baseAddress) {
                        const addressName = await reverseGeocode(updates.latitude, updates.longitude);
                        if (addressName) updates.baseAddress = addressName;
                    } else {
                        updates.baseAddress = updates.location.address || updates.location.baseAddress;
                    }
                }
                delete updates.location;
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
                // Check if lat/long is present in internal tech object (mapped ref)
                if (tech.latitude && tech.longitude) {
                    this.io.emit('technician_location_update', {
                        id: id,
                        latitude: tech.latitude,
                        longitude: tech.longitude,
                        status: tech.status
                    });
                }
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
