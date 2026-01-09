const Database = require('./DatabaseLoader');

class TechnicianManager {
    constructor() {
        this.db = new Database('technicians');
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
            serviceType,
            location, // { latitude, longitude }
            password, // In a real app, hash this!
            experience,
            addressDetails, // { country, state, city, pincode }
            documents: {}, // key-value pairs of doc type and path
            rating: 0,
            status: 'available',
            created_at: new Date().toISOString()
        };

        return await this.db.add(newTechnician);
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
            const { password, ...techWithoutPass } = tech;
            return techWithoutPass;
        } else {
            console.log(`[TechnicianManager] Password mismatch for: ${tech.name}`);
            return null;
        }
    }

    async getTechnician(id) {
        const tech = await this.db.find('id', id);
        if (tech) {
            const { password, ...techWithoutPass } = tech;
            return techWithoutPass;
        }
        return null;
    }

    async searchTechnicians(userLat, userLon, serviceType) {
        const lat = parseFloat(userLat);
        const lon = parseFloat(userLon);
        const type = (serviceType || '').toLowerCase().trim();

        const allTechs = await this.db.read();
        const techs = allTechs.filter(t => t.serviceType && t.serviceType.toLowerCase().trim() === type);

        const nearbyTechs = techs.map(tech => {
            if (!tech.location || !tech.location.latitude || !tech.location.longitude) return null;

            const dist = this.calculateDistance(
                lat,
                lon,
                parseFloat(tech.location.latitude),
                parseFloat(tech.location.longitude)
            );

            const { password, ...rest } = tech;
            return {
                ...rest,
                distance: parseFloat(dist.toFixed(1))
            };
        }).filter(item => item !== null && item.distance <= 10.0); // Radius increased for testing

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
            const { password, ...rest } = t;
            return rest;
        });
        return await this._enrichWithRatings(rawTechs);
    }

    async findByService(serviceType) {
        const matches = await this.db.findAll('serviceType', serviceType);
        const rawTechs = matches.map(t => {
            const { password, ...rest } = t;
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
        return await this.db.update('id', id, { location });
    }

    async updateTechnicianDocuments(id, documents) {
        const tech = await this.db.find('id', id);
        if (!tech) return null;
        const updatedDocs = { ...tech.documents, ...documents };
        return await this.db.update('id', id, { documents: updatedDocs });
    }

    async updateStatus(id, status) {
        return await this.db.update('id', id, { status });
    }

    async updateProfile(id, updates) {
        const tech = await this.db.find('id', id);
        if (!tech) return null;

        const { password, documents, ...rest } = updates;
        const changes = {};

        if (password) changes.password = password;
        if (documents && documents.photo) {
            changes.documents = { ...tech.documents, photo: documents.photo };
        }

        return await this.db.update('id', id, changes);
    }

    async updateMembership(id, type) {
        return await this.db.update('id', id, {
            membership: type,
            membershipSince: new Date().toISOString()
        });
    }

    getOffers() { return []; }
}

module.exports = TechnicianManager;
