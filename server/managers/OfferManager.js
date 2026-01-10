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
            const { created_by, expiry_date, is_active, created_at, badge_text, ...rest } = offer;
            return {
                ...rest,
                createdBy: created_by,
                expiryDate: expiry_date,
                isActive: is_active,
                createdAt: created_at,
                badgeText: badge_text
            };
        } catch (err) {
            console.error("[OfferManager] Error mapping from DB:", err);
            return offer;
        }
    }

    _mapToDb(offer) {
        if (!offer) return null;
        try {
            const { createdBy, expiryDate, isActive, createdAt, badgeText, id, ...rest } = offer;
            const mapped = { ...rest };
            if (createdBy !== undefined) mapped.created_by = createdBy;
            if (expiryDate !== undefined) mapped.expiry_date = expiryDate;
            if (isActive !== undefined) mapped.is_active = isActive;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (badgeText !== undefined) mapped.badge_text = badgeText;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[OfferManager] Error mapping to DB:", err);
            return offer;
        }
    }

    async createOffer(title, description, badgeText, createdBy, expiryDate) {
        try {
            const offer = {
                title,
                description,
                badgeText,
                createdBy,
                expiryDate,
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
