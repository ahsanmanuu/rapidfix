const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

console.log('Testing connection to:', supabaseUrl);

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing URL or Key');
    process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function test() {
    try {
        const { data, error } = await client.from('users').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('Supabase Error:', error);
        } else {
            console.log('Connection Successful! User count:', data); // data might be null for head:true, check count
        }
    } catch (err) {
        console.error('Unexpected Error:', err);
    }
}


// Direct Fetch Test
async function directFetchTest() {
    console.log("Starting Direct Fetch Test...");
    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/users?select=count`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        if (response.ok) {
            console.log("Direct Fetch Success! Status:", response.status);
        } else {
            console.error("Direct Fetch Failed! Status:", response.status, await response.text());
        }
    } catch (e) {
        console.error("Direct Fetch Error:", e);
    }
}

test().then(directFetchTest);
