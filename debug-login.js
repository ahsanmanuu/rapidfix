const path = require('path');
require('./server/node_modules/dotenv').config({ path: path.join(__dirname, 'server/.env') });

const UserManager = require('./server/managers/UserManager');
const SupabaseDatabase = require('./server/managers/SupabaseDatabase');

async function debugLogin() {
    console.log("=== LOGIN DEBUGGER ===");
    console.log("SUPABASE_URL:", process.env.SUPABASE_URL ? "SET" : "MISSING");
    console.log("SUPABASE_SERVICE_KEY:", process.env.SUPABASE_SERVICE_KEY ? "SET" : "MISSING");

    if (!process.env.SUPABASE_SERVICE_KEY) {
        console.error("❌ CRITICAL: SUPABASE_SERVICE_KEY is missing in .env. Login will fail via API.");
    }

    const userManager = new UserManager();

    // 1. Check if we can read ANY users
    console.log("\n1. Fetching all users...");
    const users = await userManager.getAllUsers();
    console.log(`   Found ${users.length} users in 'users' table.`);

    if (users.length > 0) {
        const sample = users[0];
        console.log("   Sample User:", {
            id: sample.id,
            email: sample.email,
            hasPassword: !!sample.password,
            passwordLength: sample.password ? sample.password.length : 0
        });

        // 2. Simulate Login with Sample
        if (sample.email && sample.password) {
            console.log(`\n2. Simulating Login for ${sample.email}...`);
            // Note: In real DB, password should be hashed. Here it seems plain text based on previous code review.
            const result = await userManager.login(sample.email, sample.password);
            if (result) {
                console.log("   ✅ Login Simulation: SUCCESS");
            } else {
                console.log("   ❌ Login Simulation: FAILED (Password mismatch internal check?)");
            }
        }
    } else {
        console.warn("   ⚠️ No users found. You need to Register first.");
    }

    console.log("=== END DEBUG ===");
}

debugLogin();
