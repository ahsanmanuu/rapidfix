const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const UserManager = require('./managers/UserManager');

async function debugUsers() {
    try {
        console.log("Initializing UserManager...");
        const userManager = new UserManager();

        console.log("Fetching all users...");
        // accessing db directly to avoid data masking in getAllUsers if any
        // But BaseManager.findAll uses _mapFromDb which is fine, usually keeps password if not stripped
        // Wait, UserManager.getAllUsers *strips* the password!
        // line 159: const { password, ...rest } = this._mapFromDb(u);

        // So we must access userManager.db directly
        const users = await userManager.db.read();

        console.log(`Found ${users.length} users.`);

        users.forEach(u => {
            console.log(`ID: ${u.id}`);
            console.log(`Name: ${u.name}`);
            console.log(`Email: ${u.email}`);
            console.log(`Password: '${u.password}'`); // Quote to see spaces
            console.log('-------------------');
        });

    } catch (error) {
        console.error("Debug Error:", error);
    }
}

debugUsers();
