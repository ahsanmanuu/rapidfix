const Database = require('./DatabaseLoader');

class UserManager {
    constructor() {
        this.db = new Database('users');
        this.io = null;
    }

    setSocketIO(io) {
        this.io = io;
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(user) {
        if (!user) return null;
        try {
            const { membership_expiry, created_at, updated_at, ...rest } = user;
            return {
                ...rest,
                membershipExpiry: membership_expiry || user.membershipExpiry,
                createdAt: created_at || user.createdAt,
                updatedAt: updated_at || user.updatedAt
            };
        } catch (err) {
            console.error("[UserManager] Error mapping from DB:", err);
            return user;
        }
    }

    // Helper to map App camelCase to DB snake_case
    _mapToDb(user) {
        if (!user) return null;
        try {
            const { membershipExpiry, createdAt, updatedAt, id, ...rest } = user;
            const mapped = { ...rest };
            if (membershipExpiry !== undefined) mapped.membership_expiry = membershipExpiry;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (updatedAt !== undefined) mapped.updated_at = updatedAt;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[UserManager] Error mapping to DB:", err);
            return user;
        }
    }

    async createUser(name, email, phone, password, location, photoUrl = null) {
        try {
            const existing = await this.db.find('email', email);
            if (existing) {
                throw new Error('User already exists');
            }

            const newUser = {
                name,
                email,
                phone,
                password,
                location,
                role: 'user',
                photo: photoUrl,
                status: 'Active',
                membership: 'Free',
                created_at: new Date().toISOString()
            };

            const created = await this.db.add(newUser);
            const user = this._mapFromDb(created);

            if (this.io) {
                this.io.emit('new_user_registered', user);
            }

            return user;
        } catch (err) {
            console.error("[UserManager] Error creating user:", err);
            throw err;
        }
    }

    async updateUser(id, updates) {
        try {
            const dbUpdates = this._mapToDb(updates);
            dbUpdates.updated_at = new Date().toISOString();

            const result = await this.db.update('id', id, dbUpdates);
            const user = this._mapFromDb(result);

            if (this.io) {
                this.io.to(`user_${id}`).emit('profile_updated', user);
                this.io.emit('admin_user_update', user);
            }
            return user;
        } catch (err) {
            console.error(`[UserManager] Error updating user ${id}:`, err);
            throw err;
        }
    }

    async login(email, password) {
        try {
            const user = await this.db.find('email', email);
            if (user && user.password === password) {
                const { password, ...userWithoutPass } = this._mapFromDb(user);
                return userWithoutPass;
            }
            return null;
        } catch (err) {
            console.error("[UserManager] Login error:", err);
            return null;
        }
    }

    async getUser(id) {
        try {
            const user = await this.db.find('id', id);
            if (user) {
                const { password, ...userWithoutPass } = this._mapFromDb(user);
                return userWithoutPass;
            }
            return null;
        } catch (err) {
            console.error(`[UserManager] Error getting user ${id}:`, err);
            return null;
        }
    }

    async getAllUsers() {
        try {
            const users = await this.db.read();
            return users.map(u => {
                const { password, ...rest } = this._mapFromDb(u);
                return rest;
            });
        } catch (err) {
            console.error("[UserManager] Error getting all users:", err);
            return [];
        }
    }

    async updateUser(id, data) {
        try {
            const updates = {
                ...this._mapToDb(data),
                updated_at: new Date().toISOString()
            };
            // Prevent ID/Email tampering if not intended
            delete updates.id;

            const result = await this.db.update('id', id, updates);
            const user = this._mapFromDb(result);

            if (this.io) {
                this.io.to(`user_${id}`).emit('profile_updated', user);
                this.io.emit('admin_user_update', user);
            }
            return user;
        } catch (err) {
            console.error(`[UserManager] Error updating user ${id}:`, err);
            return null;
        }
    }

    async setStatus(id, status) {
        try {
            const result = await this.db.update('id', id, {
                status,
                updated_at: new Date().toISOString()
            });
            const user = this._mapFromDb(result);
            if (this.io) {
                this.io.to(`user_${id}`).emit('profile_updated', user);
                this.io.emit('admin_user_update', user);
            }
            return user;
        } catch (err) {
            console.error(`[UserManager] Error setting status for user ${id}:`, err);
            return null;
        }
    }

    async setMembership(id, tier, expiryDate = null) {
        try {
            const updates = {
                membership: tier,
                updated_at: new Date().toISOString()
            };
            if (expiryDate) updates.membership_expiry = expiryDate;

            const result = await this.db.update('id', id, updates);
            const user = this._mapFromDb(result);
            if (this.io) {
                this.io.to(`user_${id}`).emit('membership_updated', { membership: tier, expiry: expiryDate });
                this.io.emit('admin_user_update', user);
            }
            return user;
        } catch (err) {
            console.error(`[UserManager] Error setting membership for user ${id}:`, err);
            return null;
        }
    }

    async checkAndSyncMembership(userId) {
        try {
            const user = await this.getUser(userId);
            if (!user) return null;

            if (user.membership === 'Premium' && user.membershipExpiry) {
                const expiry = new Date(user.membershipExpiry);
                if (expiry < new Date()) {
                    console.log(`[UserManager] Membership expired for ${userId}. Downgrading to Free.`);
                    const updated = await this.setMembership(userId, 'Free', null);
                    return { ...updated, statusChanged: true, newTier: 'Free' };
                }
            }
            return { ...user, statusChanged: false };
        } catch (err) {
            console.error(`[UserManager] Error syncing membership for ${userId}:`, err);
            return null;
        }
    }
}

module.exports = UserManager;
