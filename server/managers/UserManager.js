const Database = require('./DatabaseLoader');

class UserManager {
    constructor() {
        this.db = new Database('users');
    }

    async createUser(name, email, phone, password, location) {
        const existing = await this.db.find('email', email);
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

        return await this.db.add(newUser);
    }

    async updateUser(id, updates) {
        // updates can include name, photo, password, location, membership, membershipExpiry
        return await this.db.update('id', id, { ...updates, updated_at: new Date().toISOString() });
    }

    async login(email, password) {
        const user = await this.db.find('email', email);
        if (user && user.password === password) {
            const { password, ...userWithoutPass } = user;
            return userWithoutPass;
        }
        return null;
    }

    async getUser(id) {
        const user = await this.db.find('id', id);
        if (user) {
            const { password, ...userWithoutPass } = user;
            return userWithoutPass;
        }
        return null;
    }

    async getAllUsers() {
        const users = await this.db.read();
        return users.map(u => {
            const { password, ...rest } = u;
            return rest;
        });
    }

    async setStatus(id, status) {
        // Robust update: Find first, then update
        const users = await this.db.read();
        const target = users.find(u => String(u.id) === String(id));

        if (target) {
            return await this.db.update('id', target.id, { status, updated_at: new Date().toISOString() });
        }
        return null; // User not found
    }

    async checkAndSyncMembership(id) {
        const user = await this.db.find('id', id);
        if (!user) return null;

        // If Premium, check for expiry
        if (user.membership === 'Premium' && user.membershipExpiry) {
            const expiry = new Date(user.membershipExpiry);
            const now = new Date();

            if (now > expiry) {
                console.log(`[UserManager] Membership expired for user ${id}. Downgrading to Free.`);
                const updated = await this.db.update('id', id, {
                    membership: 'Free',
                    updated_at: new Date().toISOString()
                });
                return { ...updated, statusChanged: true, newTier: 'Free' };
            }
        }
        return user;
    }

    async setMembership(id, tier, expiryDate = null) {
        // Robust update: Find first, then update
        const users = await this.db.read();
        const target = users.find(u => String(u.id) === String(id));

        if (target) {
            const updates = {
                membership: tier,
                updated_at: new Date().toISOString()
            };
            if (expiryDate) updates.membership_expiry = expiryDate;

            return await this.db.update('id', target.id, updates);
        }
        return null;
    }
}

module.exports = UserManager;
