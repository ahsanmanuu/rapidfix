const BaseManager = require('./BaseManager');

class AdminManager extends BaseManager {
    constructor() {
        super('admins'); // BaseManager sets up this.db with 'admins'
        this.io = null;
        this.geocoder = require('../utils/geocoder');
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
            // Use findOne from BaseManager
            const defaultEmail = 'admin@fixofy.com';
            const existing = await this.findOne('email', defaultEmail);

            if (!existing) {
                console.log(`[AdminManager] No default admin found. Creating ${defaultEmail}...`);
                await this.createAdmin('Admin', defaultEmail, 'admin123', 'Super Admin');
            } else {
                console.log(`[AdminManager] Default admin ${defaultEmail} found.`);
                // SELF-HEALING: Ensure the password is 'admin123' to prevent lockout
                if (String(existing.password).trim() !== 'admin123') {
                    console.log(`[AdminManager] Password mismatch for default admin. Resetting to 'admin123'...`);
                    // Use BaseManager update
                    await this.update(existing.id, { password: 'admin123' });
                    console.log(`[AdminManager] Password reset successful.`);
                }
            }
        } catch (err) {
            console.error("[AdminManager] Error ensuring default admin:", err);
        }
    }

    async createAdmin(name, email, password, role = 'Admin', listLocation = null, createdBy = null) {
        try {
            const cleanEmail = String(email).trim().toLowerCase();
            const existing = await this.findOne('email', cleanEmail);
            if (existing) throw new Error('Admin already exists');

            const newAdmin = {
                id: require('crypto').randomUUID(), // Ensure UUID
                name,
                email: cleanEmail,
                password,
                role,
                created_at: new Date().toISOString(), // DB field name directly for now, or rely on mapping
                createdAt: new Date().toISOString(),
                createdBy // [NEW] Link to Super Admin ID
            };

            // [NEW] Handle fixed location assignment
            if (listLocation) {
                if (listLocation.latitude && listLocation.longitude) {
                    newAdmin.latitude = listLocation.latitude;
                    newAdmin.longitude = listLocation.longitude;
                    newAdmin.fixed_latitude = listLocation.latitude;
                    newAdmin.fixed_longitude = listLocation.longitude;
                }
                if (listLocation.address) {
                    newAdmin.office_address = listLocation.address;
                }
            }

            // Use BaseManager's create
            const result = await this.create(newAdmin);
            if (this.io) {
                this.io.emit('new_admin_created', { name, email: cleanEmail, role });
            }
            return result;

        } catch (err) {
            console.error("[AdminManager] Create Admin Error:", err);
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

    // [MODIFIED] Get nearby users and technicians within 30km fixed radius
    async getNearbyEntities(adminLat, adminLng) {
        try {
            const radiusKm = 30; // Fixed 30 KM radius
            const lat = parseFloat(adminLat);
            const lng = parseFloat(adminLng);

            // DatabaseLoader will return SupabaseDatabase or JSON Database
            const UserDB = new (require('./DatabaseLoader'))('users');
            const TechDB = new (require('./DatabaseLoader'))('technicians');

            const users = await UserDB.read();
            const technicians = await TechDB.read();

            const nearbyUsers = users.filter(u => {
                // Priority: Live Location -> Registered Location
                const uLat = parseFloat(u.location?.latitude || u.latitude || u.registered_latitude || 0);
                const uLng = parseFloat(u.location?.longitude || u.longitude || u.registered_longitude || 0);

                if (!uLat || !uLng) return false;
                const dist = this._calculateDistance(lat, lng, uLat, uLng);
                return dist <= radiusKm;
            });

            const nearbyTechs = technicians.filter(t => {
                // Priority: Live Location -> Registered Location
                const tLat = parseFloat(t.location?.latitude || t.latitude || t.registered_latitude || 0);
                const tLng = parseFloat(t.location?.longitude || t.longitude || t.registered_longitude || 0);

                if (!tLat || !tLng) return false;
                const dist = this._calculateDistance(lat, lng, tLat, tLng);
                return dist <= radiusKm;
            });

            return {
                users: nearbyUsers,
                technicians: nearbyTechs,
                center: { lat: lat, lng: lng, radius: radiusKm }
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

    async getUsers(adminLat, adminLng) {
        try {
            const UserDB = new (require('./DatabaseLoader'))('users');
            const users = await UserDB.read();

            if (!adminLat || !adminLng) return users;

            const radiusKm = 50;
            const lat = parseFloat(adminLat);
            const lng = parseFloat(adminLng);

            return users.filter(u => {
                const uLat = parseFloat(u.latitude || u.location?.latitude || u.registered_latitude || 0);
                const uLng = parseFloat(u.longitude || u.location?.longitude || u.registered_longitude || 0);
                if (!uLat || !uLng) return false;
                return this._calculateDistance(lat, lng, uLat, uLng) <= radiusKm;
            });
        } catch (err) {
            console.error("[AdminManager] GetUsers Error:", err);
            return [];
        }
    }

    async getTechnicians(adminLat, adminLng) {
        try {
            const TechDB = new (require('./DatabaseLoader'))('technicians');
            const techs = await TechDB.read();

            if (!adminLat || !adminLng) return techs;

            const radiusKm = 50;
            const lat = parseFloat(adminLat);
            const lng = parseFloat(adminLng);

            return techs.filter(t => {
                const tLat = parseFloat(t.latitude || t.location?.latitude || t.registered_latitude || 0);
                const tLng = parseFloat(t.longitude || t.location?.longitude || t.registered_longitude || 0);
                if (!tLat || !tLng) return false;
                return this._calculateDistance(lat, lng, tLat, tLng) <= radiusKm;
            });
        } catch (err) {
            console.error("[AdminManager] GetTechnicians Error:", err);
            return [];
        }
    }

    async getJobs(adminLat, adminLng) {
        try {
            const JobDB = new (require('./DatabaseLoader'))('jobs');
            const jobs = await JobDB.read();

            if (!adminLat || !adminLng) return jobs;

            const radiusKm = 50;
            const lat = parseFloat(adminLat);
            const lng = parseFloat(adminLng);

            return jobs.filter(j => {
                const jLat = parseFloat(j.location?.latitude || 0);
                const jLng = parseFloat(j.location?.longitude || 0);
                if (!jLat || !jLng) return false;
                return this._calculateDistance(lat, lng, jLat, jLng) <= radiusKm;
            });
        } catch (err) {
            console.error("[AdminManager] GetJobs Error:", err);
            return [];
        }
    }
    async getStats(adminLat, adminLng) {
        try {
            const radiusKm = 50; // Filter stats within 50km radius
            const isGeoFenced = adminLat && adminLng;

            // Load all data
            const UserDB = new (require('./DatabaseLoader'))('users');
            const TechDB = new (require('./DatabaseLoader'))('technicians');
            const JobDB = new (require('./DatabaseLoader'))('jobs');

            let users = await UserDB.read();
            let technicians = await TechDB.read();
            let jobs = await JobDB.read();

            // Filter if Lat/Lng provided
            if (isGeoFenced) {
                const lat = parseFloat(adminLat);
                const lng = parseFloat(adminLng);

                users = users.filter(u => {
                    // Check live location first, then fixed/registered
                    const uLat = parseFloat(u.latitude || u.location?.latitude || u.registered_latitude || 0);
                    const uLng = parseFloat(u.longitude || u.location?.longitude || u.registered_longitude || 0);
                    if (!uLat || !uLng) return false; // Exclude users without location in Geo-Mode
                    return this._calculateDistance(lat, lng, uLat, uLng) <= radiusKm;
                });

                technicians = technicians.filter(t => {
                    const tLat = parseFloat(t.latitude || t.location?.latitude || t.registered_latitude || 0);
                    const tLng = parseFloat(t.longitude || t.location?.longitude || t.registered_longitude || 0);
                    if (!tLat || !tLng) return false;
                    return this._calculateDistance(lat, lng, tLat, tLng) <= radiusKm;
                });

                // Filter jobs by User location or Job location
                jobs = jobs.filter(j => {
                    const jLat = parseFloat(j.location?.latitude || 0);
                    const jLng = parseFloat(j.location?.longitude || 0);
                    if (!jLat || !jLng) return false;
                    return this._calculateDistance(lat, lng, jLat, jLng) <= radiusKm;
                });
            }

            // Calculate Aggregates
            const totalUsers = users.length;
            const activeTechnicians = technicians.filter(t => t.status !== 'Blacklisted' && t.status !== 'Pending').length;
            const totalJobs = jobs.length;
            const revenue = jobs.reduce((acc, job) => acc + (parseFloat(job.amount) || parseFloat(job.visitingCharges) || 0), 0);

            // Detailed Breakdown
            const detailed = {
                jobsPending: jobs.filter(j => j.status === 'pending').length,
                jobsActive: jobs.filter(j => ['in_progress', 'assigned', 'started'].includes(j.status)).length,
                jobsAccepted: jobs.filter(j => j.status === 'accepted').length,
                jobsFinishing: jobs.filter(j => j.status === 'completed').length, // Map 'completed' to 'finishing' for dashboard
                jobsRejected: jobs.filter(j => j.status === 'cancelled' || j.status === 'rejected').length,

                techsAvailable: technicians.filter(t => t.status === 'Available').length,
                techsEngaged: technicians.filter(t => t.status === 'Engaged' || t.status === 'Busy').length,
                techsUnavailable: technicians.filter(t => t.status === 'Offline' || t.status === 'Unavailable').length,
                techsBlacklisted: technicians.filter(t => t.status === 'Blacklisted').length,
                techsPremium: technicians.filter(t => t.membership === 'Premium').length,
                techsFree: technicians.filter(t => t.membership !== 'Premium').length,
                techsApproved: technicians.filter(t => t.documents?.verificationStatus === 'Approved').length,
                techsNotApproved: technicians.filter(t => t.documents?.verificationStatus !== 'Approved').length,
                techsExpiring: 0, // Logic pending

                usersPremium: users.filter(u => u.membership === 'Premium').length,
                usersFree: users.filter(u => u.membership !== 'Premium').length,
                usersBanned: users.filter(u => u.status === 'Banned').length,
                usersExpiring: 0 // Logic pending
            };

            // Trends (Mock/Calculated)
            const registrationTrends = [
                { name: 'Week 1', count: Math.floor(totalUsers * 0.2) },
                { name: 'Week 2', count: Math.floor(totalUsers * 0.3) },
                { name: 'Week 3', count: Math.floor(totalUsers * 0.4) },
                { name: 'Week 4', count: Math.floor(totalUsers * 0.1) },
            ];

            const technicianTrends = [
                { name: 'Week 1', count: Math.floor(activeTechnicians * 0.2) },
                { name: 'Week 2', count: Math.floor(activeTechnicians * 0.3) },
                { name: 'Week 3', count: Math.floor(activeTechnicians * 0.3) },
                { name: 'Week 4', count: Math.floor(activeTechnicians * 0.2) },
            ];

            const jobDistribution = [
                { name: 'Completed', value: detailed.jobsFinishing, color: '#10b981' },
                { name: 'Pending', value: detailed.jobsPending, color: '#f59e0b' },
                { name: 'Cancelled', value: detailed.jobsRejected, color: '#ef4444' }
            ];

            // Activity Log (Mocked to be recent events of these filtered entities)
            const activityLog = [];
            // Add some synthetic logs based on recent jobs
            jobs.slice(0, 5).forEach(j => {
                activityLog.push({
                    id: j.id,
                    user: j.contactName || 'User',
                    action: `created job #${j.id.substring(0, 6)}`,
                    timestamp: j.created_at || new Date().toISOString(),
                    type: 'job',
                    icon: 'work'
                });
            });

            return {
                totalUsers,
                activeTechnicians,
                totalJobs,
                revenue,
                detailed,
                registrationTrends,
                technicianTrends,
                jobDistribution,
                activityLog: activityLog.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5),
                filterRadius: isGeoFenced ? radiusKm : 'Global'
            };

        } catch (err) {
            console.error("[AdminManager] GetStats Error:", err);
            return {};
        }
    }

    _deg2rad(deg) {
        return deg * (Math.PI / 180);
    }
}

module.exports = AdminManager;
