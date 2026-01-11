const Database = require('./DatabaseLoader');

class AdminManager {
    constructor() {
        this.db = new Database('admins');
        this.io = null;
        this.geocoder = require('../utils/geocoder'); // Lazy load or require at top if preferred, but doing here for safety
        this.ensureDefaultAdmin();
    }

    setSocketIO(io) {
        this.io = io;
    }

    _mapFromDb(admin) {
        if (!admin) return null;
        try {
            const { created_at, ...rest } = admin;
            return {
                ...rest,
                createdAt: created_at
            };
        } catch (err) {
            console.error("[AdminManager] Error mapping from DB:", err);
            return admin;
        }
    }

    _mapToDb(admin) {
        if (!admin) return null;
        try {
            const { createdAt, id, ...rest } = admin;
            const mapped = { ...rest };
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (id !== undefined) mapped.id = id;
            return mapped;
        } catch (err) {
            console.error("[AdminManager] Error mapping to DB:", err);
            return admin;
        }
    }

    async ensureDefaultAdmin() {
        try {
            const defaultEmail = 'admin@fixofy.com';
            const existing = await this.db.find('email', defaultEmail);

            if (!existing) {
                console.log(`[AdminManager] No default admin found. Creating ${defaultEmail}...`);
                await this.createAdmin('admin', defaultEmail, 'admin123', 'Super Admin');
            } else {
                console.log(`[AdminManager] Default admin ${defaultEmail} found.`);
                // SELF-HEALING: Ensure the password is 'admin123' to prevent lockout
                if (String(existing.password).trim() !== 'admin123') {
                    console.log(`[AdminManager] Password mismatch for default admin. Resetting to 'admin123'...`);
                    const updated = { ...existing, password: 'admin123' };
                    const dbItem = this._mapToDb(updated);
                    // Use update method if available, or just re-add (if overwrite supported) - DB implementation specific
                    // Since specific DB update might be tricky without ID, let's try finding by ID or overwriting
                    // SupabaseDatabase doesn't support overwrite well, but let's assume standard DB flow.
                    // Actually, let's just use the DB 'update' if it exists or 'write' if reckless.
                    // Safer: Do nothing but LOG CRITICAL WARNING if we can't easily update.
                    // But WAIT, if Supabase, we can use client directly? No, keep abstraction.
                    // Adding a specific 'updatePassword' method would be best, but 'db.update' usually matches by ID.

                    if (this.db.update) {
                        // Correct signature: update(field, value, data)
                        await this.db.update('email', defaultEmail, { password: 'admin123' });
                        console.log(`[AdminManager] Password reset successful.`);
                    } else {
                        console.warn(`[AdminManager] CANNOT RESET PASSWORD: database.update() method missing.`);
                    }
                }
            }
        } catch (err) {
            console.error("[AdminManager] Error ensuring default admin:", err);
        }
    }

    async createAdmin(name, email, password, role = 'Admin') {
        try {
            const cleanEmail = String(email).trim().toLowerCase();
            const existing = await this.db.find('email', cleanEmail);
            if (existing) throw new Error('Admin already exists');

            const newAdmin = {
                name,
                email: cleanEmail,
                password,
                role,
                createdAt: new Date().toISOString()
            };
            const dbAdmin = this._mapToDb(newAdmin);
            const saved = await this.db.add(dbAdmin);
            const result = this._mapFromDb(saved);
            if (this.io) {
                this.io.emit('new_admin_created', { name, email: cleanEmail, role });
            }
            return result;
        } catch (err) {
            console.error("[AdminManager] Error creating admin:", err);
            throw err;
        }
    }

    async login(email, password) {
        try {
            if (!email || !password) {
                console.log("[AdminManager] Login failed: Missing email or password");
                return null;
            }

            const cleanEmail = String(email).trim().toLowerCase();
            const cleanPassword = String(password).trim();

            console.log(`[AdminManager] Attempting login for: ${cleanEmail} (Pass Length: ${cleanPassword.length})`);

            const admin = await this.db.find('email', cleanEmail);

            if (!admin) {
                console.log(`[AdminManager] Login failed: Admin not found for ${cleanEmail}`);
                return null;
            }

            // Compare passwords (Plain text for now, should be hashed in future)
            // Trim stored password just in case DB has trailing spaces
            const dbPassword = String(admin.password).trim();

            if (dbPassword === cleanPassword) {
                console.log(`[AdminManager] Login successful for: ${cleanEmail}`);
                const result = this._mapFromDb(admin);
                const { password, ...adminWithoutPass } = result;
                if (this.io) {
                    this.io.emit('admin_login', { email: cleanEmail, time: new Date().toISOString() });
                }
                return adminWithoutPass;
            } else {
                console.log(`[AdminManager] Login failed: Incorrect password for ${cleanEmail}. InputLen: ${cleanPassword.length}, StoredLen: ${dbPassword.length}`);
                return null;
            }
        } catch (err) {
            console.error("[AdminManager] Login error:", err);
            return null;
        }
    }

    async updateProfile(id, updates) {
        try {
            const admin = await this.db.find('id', id);
            if (!admin) throw new Error('Admin not found');

            const { location, ...otherUpdates } = updates;
            let finalUpdates = { ...otherUpdates };

            // Handle Location Update
            if (location) {
                if (typeof location === 'string') {
                    const coords = await this.geocoder.geocodeAddress(location);
                    if (coords) {
                        finalUpdates.latitude = coords.latitude;
                        finalUpdates.longitude = coords.longitude;
                        finalUpdates.office_address = location; // Or coords.display_name if we want better
                    }
                } else if (typeof location === 'object') {
                    if (location.latitude) finalUpdates.latitude = location.latitude;
                    if (location.longitude) finalUpdates.longitude = location.longitude;
                    if (location.address) finalUpdates.office_address = location.address;
                }
            }

            const merged = { ...admin, ...finalUpdates };
            const dbItem = this._mapToDb(merged);

            // DatabaseLoader 'update' usually takes (field, value, updates)
            // If checking ID:
            await this.db.update('id', id, this._mapToDb(finalUpdates));

            const updated = await this.db.find('id', id);
            const result = this._mapFromDb(updated);

            if (this.io) {
                this.io.emit('admin_updated', { id, ...result });
                if (finalUpdates.latitude && finalUpdates.longitude) {
                    this.io.emit('admin_location_update', { id, latitude: finalUpdates.latitude, longitude: finalUpdates.longitude });
                }
            }
            return result;
        } catch (err) {
            console.error("[AdminManager] Update error:", err);
            throw err;
        }
    }

    async searchAdmins(lat, lng, radiusKm = 50) {
        try {
            const all = await this.db.read();
            if (!lat || !lng) return all.map(this._mapFromDb);

            return all.map(a => this._mapFromDb(a)).filter(a => {
                if (!a.latitude || !a.longitude) return false;
                const dist = this._calculateDistance(lat, lng, a.latitude, a.longitude);
                a.distance = parseFloat(dist.toFixed(1));
                return dist <= radiusKm;
            });
        } catch (e) { return []; }
    }

    _calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this._deg2rad(lat2 - lat1);
        const dLon = this._deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this._deg2rad(lat1)) * Math.cos(this._deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    }

    _deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

module.exports = AdminManager;
