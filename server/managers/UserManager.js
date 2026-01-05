const Database = require('./Database');

class UserManager {
    constructor() {
        this.db = new Database('users.json');
    }

    createUser(name, email, phone, password, location) {
        const existing = this.db.find('email', email);
        if (existing) {
            throw new Error('User already exists');
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            phone,
            password, // In a real app, hash this!
            location, // { latitude, longitude }
            role: 'user',
            photo: null, // Default photo
            createdAt: new Date().toISOString()
        };

        return this.db.add(newUser);
    }

    updateUser(id, updates) {
        // updates can include name, photo, password
        return this.db.update('id', id, { ...updates, updatedAt: new Date().toISOString() });
    }

    login(email, password) {
        const user = this.db.find('email', email);
        if (user && user.password === password) {
            const { password, ...userWithoutPass } = user;
            return userWithoutPass;
        }
        return null;
    }

    getUser(id) {
        const user = this.db.find('id', id);
        if (user) {
            const { password, ...userWithoutPass } = user;
            return userWithoutPass;
        }
        return null;
    }

    getAllUsers() {
        return this.db.read().map(u => {
            const { password, ...rest } = u;
            return rest;
        });
    }
}

module.exports = UserManager;
