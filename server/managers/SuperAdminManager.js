const Database = require('./DatabaseLoader');

class SuperAdminManager {
    constructor() {
        this.db = new Database('admins');
        this.io = null;
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
                created_at: new Date().toISOString()
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
            const admin = await this.db.find('email', email);
            if (admin && admin.password === password && admin.role === 'superadmin') {
                const { password, ...rest } = admin;
                if (this.io) {
                    this.io.emit('superadmin_login', { email, time: new Date().toISOString() });
                }
                return rest;
            }
            return null;
        } catch (err) {
            console.error("[SuperAdminManager] Login error:", err);
            return null;
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
}

module.exports = SuperAdminManager;
