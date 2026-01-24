require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function runDiagnostic() {
    console.log('--- Supabase Diagnostic Start ---');

    // 1. Check columns in 'jobs' table
    console.log('1. Checking table structure...');
    try {
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .limit(1);

        if (error) {
            console.error(' [ERROR] select(*) failed:', error.message);
            if (error.message.includes('description')) {
                console.log(' [RESULT] Postgrest CACHE is definitely stale. It thinks "description" is missing.');
            }
        } else {
            console.log(' [SUCCESS] select(*) worked without error.');
            console.log(' Initial data columns found:', Object.keys(data[0] || {}).join(', '));
        }
    } catch (e) {
        console.error(' Unexpected error during check:', e);
    }

    // 2. Force Reload Schema
    console.log('\n2. Force Reloading Schema Cache via RPC if possible...');
    try {
        // Many users don't have this function, let's try a direct notify
        const { error: notifyError } = await supabase.rpc('pgrst_watch'); // Some stacks have this
        if (notifyError) {
            console.log(' RPC "pgrst_watch" not found or failed. This is common.');
        } else {
            console.log(' [SUCCESS] RPC "pgrst_watch" executed.');
        }
    } catch (e) {
        // Ignore
    }

    console.log('\n3. Final Verification: Trying explicit select(id)...');
    try {
        const { count, error } = await supabase
            .from('jobs')
            .select('id', { count: 'exact', head: true });

        if (error) {
            console.error(' [ERROR] Explicit select("id") failed:', error.message);
        } else {
            console.log(' [SUCCESS] Explicit select("id") worked. Row count:', count);
        }
    } catch (e) {
        console.error(' Unexpected error during explicit check:', e);
    }

    console.log('\n--- Diagnostic Finished ---');
    console.log('If you STILL see the "description" error, it means the SERVER is running OLD CODE.');
    console.log('Current Heartbeat Version Target: [SYSTEMIC_BYPASS_VER_1.4]');
}

runDiagnostic();
