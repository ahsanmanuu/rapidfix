const Database = require('./DatabaseLoader');

class OfferManager {
    constructor() {
        this.db = new Database('offers');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(offer) {
        if (!offer) return null;
        try {
            const { created_by, expiry_date, is_active, created_at, badge_text, discount_type, discount_value, image_url, ...rest } = offer;
            return {
                ...rest,
                createdBy: created_by,
                expiryDate: expiry_date,
                isActive: is_active,
                createdAt: created_at,
                badgeText: badge_text,
                discountType: discount_type || 'percentage',
                discountValue: discount_value || 0,
                imageUrl: image_url
            };
        } catch (err) {
            console.error("[OfferManager] Error mapping from DB:", err);
            return offer;
        }
    }

    _mapToDb(offer) {
        if (!offer) return null;
        try {
            const { createdBy, expiryDate, isActive, createdAt, badgeText, id, discountType, discountValue, imageUrl, ...rest } = offer;
            const mapped = { ...rest };
            if (createdBy !== undefined) mapped.created_by = createdBy;
            if (expiryDate !== undefined) mapped.expiry_date = expiryDate;
            if (isActive !== undefined) mapped.is_active = isActive;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (badgeText !== undefined) mapped.badge_text = badgeText;
            if (discountType !== undefined) mapped.discount_type = discountType;
            if (discountValue !== undefined) mapped.discount_value = discountValue;
            if (imageUrl !== undefined) mapped.image_url = imageUrl;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[OfferManager] Error mapping to DB:", err);
            return offer;
        }
    }

    async createOffer(title, description, code, discountType, discountValue, badgeText, createdBy, expiryDate, imageUrl) {
        try {
            const offer = {
                title,
                description,
                code,
                discountType: discountType || 'percentage',
                discountValue: discountValue || 0,
                badgeText,
                createdBy,
                expiryDate,
                imageUrl,
                isActive: true,
                createdAt: new Date().toISOString()
            };
            const dbOffer = this._mapToDb(offer);
            const saved = await this.db.add(dbOffer);
            const result = this._mapFromDb(saved);

            if (this.io) {
                this.io.emit('new_offer_created', result);
            }

            return result;
        } catch (err) {
            console.error("[OfferManager] Error creating offer:", err);
            throw err;
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

    async getOffersByLocation(lat, lng, radiusKm = 30, technicianManager) {
        try {
            const allOffers = await this.getAllOffers();
            if (!lat || !lng || !technicianManager) return allOffers;

            const visibleTechIds = new Set(await technicianManager.getTechnicianIdsByLocation(lat, lng, radiusKm));

            // Filter offers created by visible technicians
            // Assumption: 'createdBy' in offers refers to Technician ID
            return allOffers.filter(o => visibleTechIds.has(o.createdBy));
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
