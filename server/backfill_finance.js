const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function backfill() {
    try {
        await client.connect();
        console.log("Connected to DB...");

        // 1. Get all completed jobs
        const res = await client.query("SELECT * FROM jobs WHERE status = 'completed'");
        const jobs = res.rows;
        console.log(`Found ${jobs.length} completed jobs.`);

        let added = 0;

        for (const job of jobs) {
            if (!job.technician_id) continue;

            // 2. Check if transaction exists
            const txnRes = await client.query(
                "SELECT * FROM finance WHERE description LIKE $1 AND technician_id = $2",
                [`%Job Compensation #${job.id}%`, job.technician_id]
            );

            if (txnRes.rowCount === 0) {
                // 3. Create Transaction
                const amount = Number(job.total_cost || job.offer_price || job.visiting_charges || 0) * 0.9;

                if (amount > 0) {
                    await client.query(
                        `INSERT INTO finance (technician_id, type, amount, description, category, status, created_at)
             VALUES ($1, 'credit', $2, $3, 'Job Fees', 'completed', $4)`,
                        [
                            job.technician_id,
                            amount,
                            `Job Compensation #${job.id}`,
                            job.updated_at || new Date()
                        ]
                    );
                    console.log(`Created txn for Job ${job.id}: $${amount}`);
                    added++;
                }
            }
        }

        console.log(`Backfill complete. Added ${added} transactions.`);

    } catch (err) {
        console.error("Backfill Error:", err);
    } finally {
        await client.end();
    }
}

backfill();
