
require('dotenv').config();
const UserManager = require('./managers/UserManager');
const DatabaseLoader = require('./managers/DatabaseLoader');

// Force Supabase just in case, though DatabaseLoader should handle it
process.env.USE_SUPABASE = 'true';

async function listUsers() {
    console.log("--- Debugging Users in Database ---");
    const userManager = new UserManager();

    try {
        const users = await userManager.getAllUsers();
        console.log(`Found ${users.length} users:`);
        users.forEach(u => {
            console.log(`- [${u.id}] ${u.email} (Role: ${u.role})`);
        });

        if (users.length === 0) {
            console.warn("WARNING: No users found! This explains the login failure if you are trying to use a user that only existed locally.");
        }
    } catch (err) {
        console.error("Failed to list users:", err);
    }
}

listUsers();
