const Database = require('./DatabaseLoader');

class SuperAdminManager {
    constructor() {
        this.db = new Database('superadmins');

        // Ensure at least one super admin exists if empty
        if (this.db.read().length === 0) {
            this.createSuperAdmin('Super Admin', 'super@fixofy.com', 'admin123');
        }
    }

    createSuperAdmin(name, email, password) {
        const existing = this.db.find('email', email);
        if (existing) {
            return existing;
        }

        const newAdmin = {
            id: 'super_' + Date.now(),
            name,
            email,
            password, // In real app, hash this
            role: 'superadmin',
            createdAt: new Date().toISOString()
        };

        return this.db.add(newAdmin);
    }

    login(email, password) {
        const admin = this.db.find('email', email);
        if (admin && admin.password === password) {
            const { password, ...rest } = admin;
            return rest;
        }
        return null;
    }

    getSuperAdmin(id) {
        const admin = this.db.find('id', id);
        if (admin) {
            const { password, ...rest } = admin;
            return rest;
        }
        return null;
    }
}

module.exports = SuperAdminManager;
