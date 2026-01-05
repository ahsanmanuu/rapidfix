const Database = require('./Database');

class TechnicianManager {
    constructor() {
        this.db = new Database('technicians.json');
    }

    createTechnician(name, email, phone, serviceType, location, password, experience, addressDetails) {
        if (!name || !email || !password) {
            throw new Error("Missing required fields: name, email, or password");
        }

        const existing = this.db.find('email', email);
        if (existing) {
            throw new Error('Technician already exists with this email');
        }

        const newTechnician = {
            id: Date.now().toString(),
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
            reviews: [],
            status: 'available', // pending admin approval - TEMP: auto-approve
            joinedAt: new Date().toISOString()
        };

        return this.db.add(newTechnician);
    }

    login(email, password) {
        if (!email || !password) return null;

        const cleanEmail = email.trim().toLowerCase();
        const allTechs = this.db.read();

        // Detailed Debugging
        console.log(`[TechnicianManager] Attempting login for: '${cleanEmail}'`);

        const tech = allTechs.find(t => t.email && t.email.toLowerCase() === cleanEmail);

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

    getTechnician(id) {
        const tech = this.db.find('id', id);
        if (tech) {
            const { password, ...techWithoutPass } = tech;
            return techWithoutPass;
        }
        return null;
    }

    getAllTechnicians() {
        return this.db.read().map(t => {
            const { password, ...rest } = t;
            return rest;
        });
    }

    findByService(serviceType) {
        return this.db.findAll('serviceType', serviceType).map(t => {
            const { password, ...rest } = t;
            return rest;
        });
    }

    searchTechnicians(userLat, userLon, serviceType) {
        // Convert inputs to floats/clean strings
        const lat = parseFloat(userLat);
        const lon = parseFloat(userLon);
        const type = (serviceType || '').toLowerCase().trim();

        // 1. Get all techs (Case-Insensitive Service Match)
        // Note: db.findAll is simple, so we fetch all and filter manually for robustness
        const allTechs = this.db.read();
        const techs = allTechs.filter(t => t.serviceType && t.serviceType.toLowerCase().trim() === type);

        const FeedbackManager = require('./FeedbackManager');
        const feedbackManager = new FeedbackManager();

        // 2. Filter by distance (using Haversine) and enrich
        const availableTechs = techs.map(tech => {
            if (!tech.location || !tech.location.latitude || !tech.location.longitude) {
                // console.log(`[TechnicianManager] Tech ${tech.name} excluded: Missing location`);
                return null;
            }

            const dist = this.calculateDistance(
                lat,
                lon,
                parseFloat(tech.location.latitude),
                parseFloat(tech.location.longitude)
            );

            // console.log(`[TechnicianManager] Tech: ${tech.name}, Distance: ${dist.toFixed(2)} km`);

            // Calculate Ratings
            const feedbacks = feedbackManager.getFeedbackForTechnician(tech.id);
            let averageRating = 0;
            if (feedbacks && feedbacks.length > 0) {
                const total = feedbacks.reduce((sum, f) => {
                    const categories = Object.values(f.ratings || {});
                    const feedbackAvg = categories.length ? categories.reduce((a, b) => a + b, 0) / categories.length : 0;
                    return sum + feedbackAvg;
                }, 0);
                averageRating = parseFloat((total / feedbacks.length).toFixed(1));
            }

            // Return tech with distance and rating
            const { password, ...rest } = tech;
            return {
                ...rest,
                distance: parseFloat(dist.toFixed(1)), // Keep 1 decimal place
                rating: averageRating,
                experience: tech.experience,
                status: tech.status
            };
        }).filter(item => {
            if (item === null) return false;

            // RELAXED Radius: Increased to 50km to ensure visibility
            const isInRange = item.distance <= 50.0;
            if (!isInRange) console.log(`[TechnicianManager] Tech ${item.name} filtered out: Distance ${item.distance} > 50km`);
            return isInRange;
        });

        // 3. Sort by distance
        return availableTechs.sort((a, b) => a.distance - b.distance);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return d;
    }

    deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    updateLocation(id, location) {
        // Ensure location has lat/lng if possible, or just save what is passed
        return this.db.update('id', id, { location });
    }

    updateTechnicianDocuments(id, documents) {
        const tech = this.db.find('id', id);
        if (!tech) return null;

        const updatedDocs = { ...tech.documents, ...documents };
        return this.db.update('id', id, { documents: updatedDocs });
    }

    updateStatus(id, status) {
        return this.db.update('id', id, { status });
    }

    updateProfile(id, updates) {
        // updates can contain: photo, password, etc.
        const tech = this.db.find('id', id);
        if (!tech) return null;

        const { password, documents, ...rest } = updates;
        const changes = {};

        if (password) changes.password = password;
        if (documents && documents.photo) {
            changes.documents = { ...tech.documents, photo: documents.photo };
        }

        return this.db.update('id', id, changes);
    }

    updateMembership(id, type) {
        // type: 'free' | 'premium'
        return this.db.update('id', id, { membership: type, membershipSince: new Date().toISOString() });
    }

    getOffers() {
        // This is better handled by OfferManager, but we can provide a helper if needed.
        // For now, let's assume OfferManager handles fetching.
        return [];
    }
}

module.exports = TechnicianManager;
