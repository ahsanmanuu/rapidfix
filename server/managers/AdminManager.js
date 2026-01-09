const Database = require('./Database');

class AdminManager {
    constructor() {
        this.db = new Database('admins.json');
        this.ensureDefaultAdmin();
    }

    ensureDefaultAdmin() {
        const admins = this.db.read();
        if (admins.length === 0) {
            this.createAdmin('admin', 'admin@fixofy.com', 'admin123', 'Super Admin');
        }
    }

    createAdmin(name, email, password, role = 'Admin') {
        const existing = this.db.find('email', email);
        if (existing) {
            throw new Error('Admin already exists');
        }

        const newAdmin = {
            id: Date.now().toString(),
            name,
            email,
            password, // Hash in production
            role,
            createdAt: new Date().toISOString()
        };

        return this.db.add(newAdmin);
    }

    login(email, password) {
        if (!email || !password) return null;

        const cleanEmail = String(email).trim().toLowerCase();
        const admins = this.db.read();
        const admin = admins.find(a => String(a.email).trim().toLowerCase() === cleanEmail);

        if (admin && admin.password === password) {
            const { password, ...adminWithoutPass } = admin;
            return adminWithoutPass;
        }
        return null;
    }
}

module.exports = AdminManager;
