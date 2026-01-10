const Database = require('./DatabaseLoader');

class AdminManager {
    constructor() {
        this.db = new Database('admins');
        this.io = null;
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
                console.log(`[AdminManager] Default admin ${defaultEmail} already exists.`);
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
}

module.exports = AdminManager;
