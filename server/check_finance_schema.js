const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_KEY;

if (!url || !key) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkFinance() {
    try {
        const jobId = '8fd43376-8412-4f90-90e8-5da4fa309800';
        console.log(`Fetching details for job: ${jobId}...`);
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .eq('id', jobId)
            .single();

        if (error) {
            console.error("Error fetching jobs table:", error.message);
            return;
        }

        console.log("Job details:", data);

        console.log("\nChecking finance transactions for this jobId...");
        const { data: txns, error: txnErr } = await supabase
            .from('finance')
            .select('*')
            .or(`job_id.eq.${jobId},associated_id.eq.${jobId}`);

        if (txnErr) {
            console.error("Error fetching transactions:", txnErr.message);
        } else {
            console.log(`Found ${txns.length} transactions associated with this job.`);
            txns.forEach(t => {
                console.log(`Txn ID: ${t.id}, TechID: ${t.technician_id}, UserID: ${t.user_id}, Type: ${t.type}, Amount: ${t.amount}`);
            });
        }
    } catch (e) {
        console.error("Exception:", e.message);
    }
}

checkFinance();
