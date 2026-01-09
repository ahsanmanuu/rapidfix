const Database = require('./DatabaseLoader');

class OfferManager {
    constructor() {
        this.db = new Database('offers');
    }

    _mapFromDb(offer) {
        if (!offer) return null;
        const { created_by, expiry_date, is_active, created_at, badge_text, ...rest } = offer;
        return {
            ...rest,
            createdBy: created_by,
            expiryDate: expiry_date,
            isActive: is_active,
            createdAt: created_at,
            badgeText: badge_text
        };
    }

    _mapToDb(offer) {
        if (!offer) return null;
        const { createdBy, expiryDate, isActive, createdAt, badgeText, id, ...rest } = offer;
        const mapped = { ...rest };
        if (createdBy !== undefined) mapped.created_by = createdBy;
        if (expiryDate !== undefined) mapped.expiry_date = expiryDate;
        if (isActive !== undefined) mapped.is_active = isActive;
        if (createdAt !== undefined) mapped.created_at = createdAt;
        if (badgeText !== undefined) mapped.badge_text = badgeText;
        return mapped;
    }

    async createOffer(title, description, badgeText, createdBy, expiryDate) {
        const offer = {
            title,
            description,
            badgeText,
            createdBy, // adminId
            expiryDate,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        const dbOffer = this._mapToDb(offer);
        const saved = await this.db.add(dbOffer);
        return this._mapFromDb(saved);
    }

    async getAllOffers() {
        // Since Supabase manages 'active' state, we might get all and filter, or usually filter in query
        // But for now, get all and map
        const offers = await this.db.read();
        return offers.map(o => this._mapFromDb(o)).filter(o => o.isActive);
    }

    async deleteOffer(id) {
        // Supabase delete
        return await this.db.delete(id);
    }
}

module.exports = OfferManager;
