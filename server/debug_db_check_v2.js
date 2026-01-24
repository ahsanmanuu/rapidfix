const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log("Checking environment...");
const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    console.log("Current Env Keys:", Object.keys(process.env));
    try {
        const envContent = fs.readFileSync('.env', 'utf8');
        console.log(".env file exists. Content length:", envContent.length);
    } catch (e) {
        console.error(".env file not found or unreadable.");
    }
    process.exit(1);
}

console.log("URL found:", url.substring(0, 10) + "...");
console.log("Key found:", key.substring(0, 10) + "...");

const supabase = createClient(url, key);

async function checkTables() {
    const tables = ['users', 'technicians', 'admins'];
    for (const table of tables) {
        try {
            console.log(`Checking ${table}...`);
            const { data, error } = await supabase.from(table).select('*').limit(5);
            if (error) {
                console.error(`Error fetching ${table}:`, error.message);
            } else {
                console.log(`--- ${table} ---`);
                if (data.length === 0) console.log("No records found.");
                else {
                    data.forEach(row => {
                        console.log(`ID: ${row.id}, Email: ${row.email}, Pass: ${row.password}, Role: ${row.role}`);
                    });
                }
            }
        } catch (e) {
            console.error(`Exception checking ${table}:`, e.message);
        }
    }
}

checkTables();
