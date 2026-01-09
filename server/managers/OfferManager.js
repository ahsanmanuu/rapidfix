const Database = require('./DatabaseLoader');

class OfferManager {
    constructor() {
        this.db = new Database('offers');

        // Seed some initial offers if empty
        const offers = this.db.read();
        if (!offers || offers.length === 0) {
            this.createOffer('Summer Sale', 'Get 20% off on all AC Services this week!', '20% OFF', 'admin', '2025-12-31');
            this.createOffer('New User Bonus', 'Flat ₹100 cashback on your first booking.', '₹100 CAHSBACK', 'admin', '2025-12-31');
        }
    }

    createOffer(title, description, badgeText, createdBy, expiryDate) {
        const offer = {
            id: Date.now().toString(),
            title,
            description,
            badgeText,
            createdBy, // adminId
            expiryDate,
            isActive: true,
            createdAt: new Date().toISOString()
        };
        return this.db.add(offer);
    }

    getAllOffers() {
        return this.db.read().filter(o => o.isActive);
    }

    deleteOffer(id) {
        const offers = this.db.read();
        const updatedOffers = offers.filter(o => o.id !== id);
        this.db.write(updatedOffers);
        return true;
    }
}

module.exports = OfferManager;
