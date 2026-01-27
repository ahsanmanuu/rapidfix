
require('dotenv').config();
const JobManager = require('./managers/JobManager');
const TechnicianManager = require('./managers/TechnicianManager');

// Mock Env
process.env.USE_SUPABASE = 'true';

async function testOtp() {
    console.log("Starting OTP Test...");
    const jobManager = new JobManager();
    const techManager = new TechnicianManager();

    // Wiring
    jobManager.setTechnicianManager(techManager);

    try {
        // 0. Get a User
        const users = await jobManager.userManager.getAllUsers();
        if (users.length === 0) { console.error("No users"); return; }
        const userId = users[0].id;

        // 1. Create a job
        const job = await jobManager.createJob(
            userId,
            'Test OTP Service',
            'Desc',
            { lat: 10, lng: 10 },
            'Addr',
            '2026-02-01',
            '10:00:00'
        );
        console.log(`Job Created: ${job.id}, OTP: ${job.otp}`);

        // 2. Complete Job with OTP
        console.log("Completing Job...");
        await jobManager.updateStatus(job.id, 'completed', { otp: job.otp });

        console.log("Job Completed Successfully");

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

testOtp();
