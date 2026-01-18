const BaseManager = require('./BaseManager');
const { geocodeAddress } = require('../utils/geocoder');

class UserManager extends BaseManager {
    constructor() {
        super('users'); // BaseManager sets up this.db with 'users' table
    }

    // Helper to map DB snake_case to App camelCase
    _mapFromDb(user) {
        if (!user) return null;
        try {
            const { membership_expiry, created_at, updated_at, fixed_address, ...rest } = user;
            return {
                ...rest,
                membershipExpiry: membership_expiry || user.membershipExpiry,
                createdAt: created_at || user.createdAt,
                updatedAt: updated_at || user.updatedAt,
                fixedAddress: fixed_address || user.fixedAddress,
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
            const { membershipExpiry, createdAt, updatedAt, fixedAddress, id, ...rest } = user;
            const mapped = { ...rest };
            if (membershipExpiry !== undefined) mapped.membership_expiry = membershipExpiry;
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (updatedAt !== undefined) mapped.updated_at = updatedAt;
            if (fixedAddress !== undefined) mapped.fixed_address = fixedAddress;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[UserManager] Error mapping to DB:", err);
            return user;
        }
    }

    async createUser(name, email, phone, locationInput, password) {
        try {
            const existing = await this.findOne('email', email);
            if (existing) {
                throw new Error('User already exists with this email');
            }

            let lat = null;
            let lng = null;
            let fixedAddress = null;

            if (locationInput) {
                if (typeof locationInput === 'string') {
                    fixedAddress = locationInput;
                    const coords = await geocodeAddress(locationInput);
                    if (coords) {
                        lat = coords.lat;
                        lng = coords.lng;
                    }
                } else if (typeof locationInput === 'object') {
                    lat = locationInput.latitude;
                    lng = locationInput.longitude;
                    fixedAddress = locationInput.address;
                }
            }

            const newUser = {
                id: Date.now().toString(), // Or crypto.randomUUID() if migrating
                name,
                email,
                phone,
                password,
                role: 'user',
                status: 'Active',
                membership: 'Free',
                walletBalance: 0.00,
                latitude: lat,
                longitude: lng,
                fixedAddress: fixedAddress
            };

            // Use BaseManager's automated create
            return await this.create(newUser);

        } catch (err) {
            console.error("[UserManager] Error creating user:", err);
            throw err;
        }
    }

    // Overriding update to add specific user logic if needed, or just use generic
    // But we need to maintain specific method signature if called elsewhere
    async updateUser(id, updates) {
        // Handle Location Input in Update (copying logic from createUser)
        if (updates.location) {
            if (typeof updates.location === 'string') {
                // Geocode city/address
                const coords = await geocodeAddress(updates.location);
                if (coords) {
                    updates.latitude = coords.lat;
                    updates.longitude = coords.lng;
                    updates.city = updates.location;
                    updates.fixedAddress = coords.displayName;
                }
            } else if (typeof updates.location === 'object') {
                updates.latitude = updates.location.latitude;
                updates.longitude = updates.location.longitude;
                updates.city = updates.location.city;
                updates.fixedAddress = updates.location.fixedAddress || updates.location.address;
            }
            // Cleanup custom field before mapping to DB
            delete updates.location;
        }

        // BaseManager handles timestamps and mapping automatically
        return await this.update(id, updates);
    }

    async login(email, password) {
        try {
            if (!email || !password) return null;
            const cleanEmail = String(email).trim().toLowerCase();
            const cleanPassword = String(password).trim();

            const user = await this.findOne('email', cleanEmail);
            if (user && String(user.password).trim() === cleanPassword) {
                const { password, ...userWithoutPass } = user;
                return userWithoutPass;
            }
            return null;
        } catch (err) {
            console.error("[UserManager] Error during login:", err);
            return null;
        }
    }

    async getUser(id) {
        try {
            const user = await this.findOne(id); // Use BaseManager's findOne by ID
            if (user) {
                const { password, ...userWithoutPass } = user;
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

    // [NEW] Get users within specific radius
    async getUsersByLocation(lat, lng, radiusKm = 30) {
        try {
            const allUsers = await this.getAllUsers();
            if (!lat || !lng) return allUsers;

            const searchLat = parseFloat(lat);
            const searchLng = parseFloat(lng);

            return allUsers.filter(u => {
                const uLat = parseFloat(u.latitude);
                const uLon = parseFloat(u.longitude);

                if (isNaN(uLat) || isNaN(uLon)) return false;

                const dist = this._calculateDistance(searchLat, searchLng, uLat, uLon);
                return dist <= radiusKm;
            });
        } catch (err) {
            console.error("[UserManager] Error getting users by location:", err);
            return [];
        }
    }

    async getUserIdsByLocation(lat, lng, radiusKm = 30) {
        const users = await this.getUsersByLocation(lat, lng, radiusKm);
        return users.map(u => u.id);
    }

    _calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * (Math.PI / 180);
        const dLon = (lon2 - lon1) * (Math.PI / 180);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    async updateUser(id, data) {
        try {
            // Handle Location Input in Update (copying logic from createUser)
            if (data.location) {
                if (typeof data.location === 'string') {
                    // Geocode city/address
                    const coords = await geocodeAddress(data.location);
                    if (coords) {
                        data.latitude = coords.lat;
                        data.longitude = coords.lng;
                        data.city = data.location;
                        data.fixed_address = coords.displayName;
                    }
                } else if (typeof data.location === 'object') {
                    data.latitude = data.location.latitude;
                    data.longitude = data.location.longitude;
                    data.city = data.location.city;
                    data.fixed_address = data.location.fixedAddress || data.location.address;
                }
                // Cleanup custom field before mapping to DB
                delete data.location;
            }

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
