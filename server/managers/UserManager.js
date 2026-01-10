const Database = require('./DatabaseLoader');

class UserManager {
    constructor() {
        this.db = new Database('users');
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(user) {
        if (!user) return null;
        const { membership_expiry, created_at, updated_at, ...rest } = user;
        return {
            ...rest,
            membershipExpiry: membership_expiry,
            createdAt: created_at,
            updatedAt: updated_at
        };
    }

    // Helper to map App camelCase to DB snake_case
    _mapToDb(user) {
        if (!user) return null;
        const { membershipExpiry, createdAt, updatedAt, id, ...rest } = user;

        const mapped = { ...rest };
        if (membershipExpiry !== undefined) mapped.membership_expiry = membershipExpiry;
        if (createdAt !== undefined) mapped.created_at = createdAt;
        if (updatedAt !== undefined) mapped.updated_at = updatedAt;

        // Don't map ID if it's meant to be generated, but if used for lookup it's fine.
        // Usually we don't write ID back to DB for existing records.

        return mapped;
    }

    async createUser(name, email, phone, password, location, photoUrl = null) {
        const existing = await this.db.find('email', email);
        if (existing) {
            throw new Error('User already exists');
        }

        const newUser = {
            name,
            email,
            phone,
            password, // In a real app, hash this!
            location, // { latitude, longitude }
            role: 'user',
            photo: photoUrl, // Use uploaded photo URL or null
            status: 'Active', // Default status
            membership: 'Free', // Default tier
            created_at: new Date().toISOString()
        };

        const created = await this.db.add(newUser);
        return this._mapFromDb(created);
    }

    async updateUser(id, updates) {
        // updates can include name, photo, password, location, membership, membershipExpiry
        const dbUpdates = this._mapToDb(updates);
        dbUpdates.updated_at = new Date().toISOString();

        const result = await this.db.update('id', id, dbUpdates);
        return this._mapFromDb(result);
    }

    async login(email, password) {
        const user = await this.db.find('email', email);
        if (user && user.password === password) {
            const appUser = this._mapFromDb(user);
            const { password, ...userWithoutPass } = appUser;
            return userWithoutPass;
        }
        return null;
    }

    async getUser(id) {
        const user = await this.db.find('id', id);
        if (user) {
            const appUser = this._mapFromDb(user);
            const { password, ...userWithoutPass } = appUser;
            return userWithoutPass;
        }
        return null;
    }

    async getAllUsers() {
        const users = await this.db.read();
        return users.map(u => {
            const appUser = this._mapFromDb(u);
            const { password, ...rest } = appUser;
            return rest;
        });
    }

    async setStatus(id, status) {
        // Robust update: Find first, then update
        const users = await this.db.read();
        const target = users.find(u => String(u.id) === String(id));

        if (target) {
            const result = await this.db.update('id', target.id, { status, updated_at: new Date().toISOString() });
            return this._mapFromDb(result);
        }
        return null; // User not found
    }

    async checkAndSyncMembership(id) {
        const user = await this.db.find('id', id);
        if (!user) return null;

        const appUser = this._mapFromDb(user);

        // If Premium, check for expiry
        if (appUser.membership === 'Premium' && appUser.membershipExpiry) {
            const expiry = new Date(appUser.membershipExpiry);
            const now = new Date();

            if (now > expiry) {
                console.log(`[UserManager] Membership expired for user ${id}. Downgrading to Free.`);
                const updated = await this.db.update('id', id, {
                    membership: 'Free',
                    updated_at: new Date().toISOString()
                });
                const mappedUpdated = this._mapFromDb(updated);
                return { ...mappedUpdated, statusChanged: true, newTier: 'Free' };
            }
        }
        return appUser;
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

            const result = await this.db.update('id', target.id, updates);
            return this._mapFromDb(result);
        }
        return null;
    }
}

module.exports = UserManager;
