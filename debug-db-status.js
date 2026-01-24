const path = require('path');
require('./server/node_modules/dotenv').config({ path: path.join(__dirname, 'server/.env') });
const { createClient } = require('./server/node_modules/@supabase/supabase-js');

async function checkConstraints() {
    console.log("=== DB CONSTRAINT CHECKER ===");
    const supabaseWithServiceKey = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    // Query Information Schema via RPC or direct SQL if possible?
    // Supabase JS client cannot query information_schema directly unless exposed via API or RPC.
    // However, we can TRY to insert a bad record and parse the error "constraint name".

    console.log("Attempting to trigger constraint violation to identify it...");

    const testOffer = {
        title: "Constraint PROBE",
        description: "Probe",
        price: 1,
        // REAL USER ID for m@gmail.com
        user_id: "6457702e-c4d4-490f-a9c1-49870990f125",
        created_by: "6457702e-c4d4-490f-a9c1-49870990f125",
        type: 'job_bid',
        status: 'open',
        code: 'TESTCODE' // Ensure code is present
    };

    const { data, error } = await supabaseWithServiceKey
        .from('offers')
        .insert([testOffer])
        .select();

    if (error) {
        console.log("❌ Insert Failed (Expected). Analysis:");
        console.log("   Message:", error.message);
        console.log("   Details:", error.details);
        console.log("   Constraint Name:", error.constraint || "Unknown"); // Postgres often returns this

        if (error.code === '23503') {
            console.log("   -> CONFIRMED: Foreign Key Violation.");
            if (error.details.includes('auth.users')) {
                console.log("   -> ISSUE: Still pointing to 'auth.users'.");
            } else if (error.details.includes('public.users')) {
                console.log("   -> NOTE: Pointing to 'public.users'. (But ID 1111... not found, which is expected for test)");
            }
        }
    } else {
        console.log("✅ Insert SUCCEEDED??");
        console.log("   -> This implies NO Foreign Key constraint exists on user_id!");
        // Clean up
        await supabaseWithServiceKey.from('offers').delete().eq('id', data[0].id);
    }
}

checkConstraints();
