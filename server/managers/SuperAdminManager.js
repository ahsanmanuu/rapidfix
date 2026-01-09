const Database = require('./DatabaseLoader');

class SuperAdminManager {
    constructor() {
        this.db = new Database('admins'); // Use admins table, not superadmins

        // Ensure at least one super admin exists if empty
        this.initialize();
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
        const existing = await this.db.find('email', email);
        if (existing && existing.role === 'superadmin') {
            return existing;
        }

        const newAdmin = {
            email,
            password, // In real app, hash this
            role: 'superadmin',
            created_at: new Date().toISOString()
        };

        return await this.db.add(newAdmin);
    }

    async login(email, password) {
        const admin = await this.db.find('email', email);
        if (admin && admin.password === password && admin.role === 'superadmin') {
            const { password, ...rest } = admin;
            return rest;
        }
        return null;
    }

    async getSuperAdmin(id) {
        const admin = await this.db.find('id', id);
        if (admin && admin.role === 'superadmin') {
            const { password, ...rest } = admin;
            return rest;
        }
        return null;
    }
}

module.exports = SuperAdminManager;
