const Database = require('./Database');

class UserManager {
    constructor() {
        this.db = new Database('users.json');
    }

    createUser(name, email, phone, password, location) {
        const existing = this.db.find('email', email);
        if (existing) {
            throw new Error('User already exists');
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            password, // In a real app, hash this!
            location, // { latitude, longitude }
            role: 'user',
            photo: null, // Default photo
            status: 'Active', // Default status
            membership: 'Free', // Default tier
            createdAt: new Date().toISOString()
        };

        return this.db.add(newUser);
    }

    updateUser(id, updates) {
        // updates can include name, photo, password, location, membership, membershipExpiry
        return this.db.update('id', id, { ...updates, updatedAt: new Date().toISOString() });
    }

    login(email, password) {
        const user = this.db.find('email', email);
        if (user && user.password === password) {
            const { password, ...userWithoutPass } = user;
            return userWithoutPass;
        }
        return null;
    }

    getUser(id) {
        const user = this.db.find('id', id);
        if (user) {
            const { password, ...userWithoutPass } = user;
            return userWithoutPass;
        }
        return null;
    }

    getAllUsers() {
        return this.db.read().map(u => {
            const { password, ...rest } = u;
            return rest;
        });
    }

    setStatus(id, status) {
        // Robust update: Find first, then update
        const users = this.db.read();
        const target = users.find(u => String(u.id) === String(id));

        if (target) {
            return this.db.update('id', target.id, { status, updatedAt: new Date().toISOString() });
        }
        return null; // User not found
    }

    checkAndSyncMembership(id) {
        const user = this.db.find('id', id);
        if (!user) return null;

        // If Premium, check for expiry
        if (user.membership === 'Premium' && user.membershipExpiry) {
            const expiry = new Date(user.membershipExpiry);
            const now = new Date();

            if (now > expiry) {
                console.log(`[UserManager] Membership expired for user ${id}. Downgrading to Free.`);
                const updated = this.db.update('id', id, {
                    membership: 'Free',
                    updatedAt: new Date().toISOString()
                });
                return { ...updated, statusChanged: true, newTier: 'Free' };
            }
        }
        return user;
    }

    setMembership(id, tier, expiryDate = null) {
        // Robust update: Find first, then update
        const users = this.db.read();
        const target = users.find(u => String(u.id) === String(id));

        if (target) {
            const updates = {
                membership: tier,
                updatedAt: new Date().toISOString()
            };
            if (expiryDate) updates.membershipExpiry = expiryDate;

            return this.db.update('id', target.id, updates);
        }
        return null;
    }
}

module.exports = UserManager;
