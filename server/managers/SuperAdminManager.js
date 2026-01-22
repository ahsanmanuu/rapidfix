const Database = require('./DatabaseLoader');

class SuperAdminManager {
    constructor() {
        this.db = new Database('admins');
        this.io = null;
        this.geocoder = require('../utils/geocoder');
        this.initialize();
    }

    setSocketIO(io) {
        this.io = io;
    }

    async initialize() {
        try {
            const admins = await this.db.read();
            const superAdmins = admins.filter(a => a.role === 'superadmin');
            if (superAdmins.length === 0) {
                await this.createSuperAdmin('Super Admin', 'super@fixofy.com', 'admin123');
            }
        } catch (error) {
            console.error('Error initializing SuperAdminManager:', error.message);
        }
    }

    async createSuperAdmin(name, email, password) {
        try {
            const existing = await this.db.find('email', email);
            if (existing && existing.role === 'superadmin') {
                return existing;
            }

            const newAdmin = {
                email,
                password,
                role: 'superadmin',
                created_at: new Date().toISOString(),
                // Default Location: Darbhanga, Bihar
                latitude: 26.1542,
                longitude: 85.8918,
                fixed_latitude: 26.1542, // Super Admin also has fixed location if needed
                fixed_longitude: 85.8918,
                office_address: 'Darbhanga, Bihar, India'
            };

            const result = await this.db.add(newAdmin);
            if (this.io) {
                this.io.emit('new_superadmin_created', { email });
            }
            return result;
        } catch (err) {
            console.error("[SuperAdminManager] Error creating superadmin:", err);
            throw err;
        }
    }

    async login(email, password) {
        try {
            const cleanEmail = String(email).trim().toLowerCase();
            const cleanPassword = String(password).trim();

            const admin = await this.db.find('email', cleanEmail);
            if (admin && admin.role === 'superadmin') {
                const dbPassword = String(admin.password).trim();

                if (dbPassword === cleanPassword) {
                    const { password, ...rest } = admin;
                    if (this.io) {
                        this.io.emit('superadmin_login', { email: cleanEmail, time: new Date().toISOString() });
                    }
                    return rest;
                } else {
                    console.log(`[SuperAdminManager] Password mismatch for ${cleanEmail}`);
                }
            }
            return null;
        } catch (err) {
            console.error("[SuperAdminManager] Login error:", err);
            return null;
        }
    }

    async updateProfile(id, updates) {
        // Similar implementation to AdminManager but strictly for SuperAdmin role checks if needed
        // For simplicity, reusing logic but ensuring we verify it's a superadmin
        try {
            const admin = await this.getSuperAdmin(id);
            if (!admin) throw new Error('SuperAdmin not found');

            const { location, ...otherUpdates } = updates;
            let finalUpdates = { ...otherUpdates };

            if (location) {
                if (typeof location === 'string') {
                    const coords = await this.geocoder.geocodeAddress(location);
                    if (coords) {
                        finalUpdates.latitude = coords.latitude;
                        finalUpdates.longitude = coords.longitude;
                        finalUpdates.office_address = location;
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

            // We need to map correctly for DB
            // Assuming direct update works on the 'admins' table
            await this.db.update('id', id, finalUpdates);

            const updated = await this.getSuperAdmin(id);
            if (this.io) {
                this.io.emit('superadmin_updated', { id, ...updated });
                if (finalUpdates.latitude) {
                    this.io.emit('admin_location_update', { id, role: 'superadmin', latitude: finalUpdates.latitude, longitude: finalUpdates.longitude });
                }
            }
            return updated;
        } catch (err) {
            console.error(err);
            throw err;
        }
    }

    async getSuperAdmin(id) {
        try {
            const admin = await this.db.find('id', id);
            if (admin && admin.role === 'superadmin') {
                const { password, ...rest } = admin;
                return rest;
            }
            return null;
        } catch (err) {
            console.error(`[SuperAdminManager] Error getting superadmin ${id}:`, err);
            return null;
        }
    }

    // [NEW] Create Sub-Admin (Delegates to AdminManager logic effectively or direct DB write)
    // [NEW] Create Sub-Admin (Delegates to AdminManager logic effectively or direct DB write)
    async createSubAdmin(name, email, password, location) {
        try {
            const existing = await this.db.find('email', email);
            if (existing) throw new Error('Admin already exists');

            // Find Super Admin ID to link as creator
            // const allAdmins = await this.db.read(); ... (This logic isn't useful if we can't store created_by)

            const newAdmin = {
                email,
                password,
                role: 'admin',
                created_at: new Date().toISOString()
                // Name, Location, CreatedBy are NOT supported by current 'admins' schema
                // fixed_latitude: location?.latitude,
            };

            // Using db.add from SuperAdminManager (which points to 'admins' table)
            const result = await this.db.add(newAdmin);
            if (this.io) this.io.emit('new_admin_created', { email, name });
            return result;
        } catch (err) {
            console.error("[SuperAdminManager] Error creating sub-admin:", err);
            throw err;
        }
    }
}

module.exports = SuperAdminManager;
