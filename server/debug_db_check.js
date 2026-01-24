const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkTables() {
    const tables = ['users', 'technicians', 'admins'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(5);
        if (error) {
            console.error(`Error fetching ${table}:`, error.message);
        } else {
            console.log(`--- ${table} ---`);
            data.forEach(row => {
                console.log(`ID: ${row.id}, Email: ${row.email}, Pass: ${row.password}, Role: ${row.role}`);
            });
            if (data.length === 0) console.log("No records found.");
        }
    }
}

checkTables();
