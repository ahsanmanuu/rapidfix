const path = require('path');
require('./server/node_modules/dotenv').config({ path: path.join(__dirname, 'server/.env') });

const UserManager = require('./server/managers/UserManager');

async function resetPassword() {
    try {
        console.log("=== PASSWORD RESET TOOL ===");
        const userManager = new UserManager();

        // 1. Find the target user (m@gmail.com based on previous debug)
        const targetEmail = 'm@gmail.com';
        console.log(`Searching for ${targetEmail}...`);

        const user = await userManager.findByEmail(targetEmail);

        if (!user) {
            console.error("User not found!");
            return;
        }

        console.log(`Found User: ${user.name} (ID: ${user.id})`);

        // 2. Update Password
        console.log("Resetting password to: '123456'");

        // Direct DB update to bypass extensive logic if needed, but updateUser is safer
        // Note: UserManager logic might map 'password' field, but let's check _mapToDb.
        // UserManager._mapToDb doesn't explicitly map 'password' in the snippet I saw!
        // Wait, lines 31-38 of UserManager.js ONLY map specific fields.
        // It uses `const { ..., ...rest } = user; const mapped = { ...rest };`
        // So 'password' should pass through if it's in the input object.

        const updates = {
            password: '123456'
        };

        const result = await userManager.updateUser(user.id, updates);

        if (result) {
            console.log("✅ Password successfully updated.");
            console.log("👉 You can now login with:");
            console.log(`   Email: ${targetEmail}`);
            console.log(`   Password: 123456`);
        } else {
            console.error("❌ Failed to update user.");
        }

    } catch (err) {
        console.error("Error:", err);
    }
}

resetPassword();
