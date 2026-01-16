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
            const { created_at, created_by, ...rest } = admin;
            return {
                ...rest,
                createdAt: created_at,
                createdBy: created_by || admin.createdBy
            };
        } catch (err) {
            console.error("[AdminManager] Error mapping from DB:", err);
            return admin;
        }
    }

    _mapToDb(admin) {
        if (!admin) return null;
        try {
            const { createdAt, createdBy, id, ...rest } = admin;
            const mapped = { ...rest };
            if (createdAt !== undefined) mapped.created_at = createdAt;
            if (createdBy !== undefined) mapped.created_by = createdBy;
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
                    if (this.db.update) {
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

    async createAdmin(name, email, password, role = 'Admin', listLocation = null, createdBy = null) {
        try {
            const cleanEmail = String(email).trim().toLowerCase();
            const existing = await this.db.find('email', cleanEmail);
            if (existing) throw new Error('Admin already exists');

            const newAdmin = {
                name,
                email: cleanEmail,
                password,
                role,
                createdAt: new Date().toISOString(),
                createdBy // [NEW] Link to Super Admin ID
            };

            // [NEW] Handle fixed location assignment
            if (listLocation) {
                if (listLocation.latitude && listLocation.longitude) {
                    newAdmin.latitude = listLocation.latitude;
                    newAdmin.longitude = listLocation.longitude;
                    newAdmin.fixed_latitude = listLocation.latitude; // Cannot be changed by Admin, only SuperAdmin
                    newAdmin.fixed_longitude = listLocation.longitude;
                }
                if (listLocation.address) {
                    newAdmin.office_address = listLocation.address;
                }
            }

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

                    if (!location.address) {
                        const addressName = await this.geocoder.reverseGeocode(finalUpdates.latitude, finalUpdates.longitude);
                        if (addressName) finalUpdates.office_address = addressName;
                    } else {
                        finalUpdates.office_address = location.address;
                    }
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

    // [NEW] Get nearby users and technicians within 30km fixed radius
    async getNearbyEntities(adminLat, adminLng) {
        try {
            const radiusKm = 30; // Fixed 30 KM radius as per requirements

            // We need access to users and technicians. 
            // Ideally should inject UserManager and TechnicianManager, but for now we'll lazily load or use DB directly.
            // Using DB directly to avoid circular dependency hell if Managers require each other.

            // DatabaseLoader will return SupabaseDatabase or JSON Database
            const UserDB = new (require('./DatabaseLoader'))('users');
            const TechDB = new (require('./DatabaseLoader'))('technicians');

            const users = await UserDB.read();
            const technicians = await TechDB.read();

            const nearbyUsers = users.filter(u => {
                if (!u.latitude || !u.longitude) return false;
                const dist = this._calculateDistance(adminLat, adminLng, u.latitude, u.longitude);
                return dist <= radiusKm;
            });

            const nearbyTechs = technicians.filter(t => {
                if (!t.latitude || !t.longitude) return false;
                const dist = this._calculateDistance(adminLat, adminLng, t.latitude, t.longitude);
                return dist <= radiusKm;
            });

            return {
                users: nearbyUsers,
                technicians: nearbyTechs,
                center: { lat: adminLat, lng: adminLng, radius: radiusKm }
            };

        } catch (err) {
            console.error("[AdminManager] Error getting nearby entities:", err);
            return { users: [], technicians: [], error: err.message };
        }
    }

    // [MODIFIED] Search Admins with default 50km or custom radius
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
