
require('dotenv').config();
const JobManager = require('./managers/JobManager');
const TechnicianManager = require('./managers/TechnicianManager');
const DatabaseLoader = require('./managers/DatabaseLoader');

// Mock Env
process.env.USE_SUPABASE = 'true';

async function testRejection() {
    console.log("Starting Rejection Test...");
    const jobManager = new JobManager();
    const techManager = new TechnicianManager();

    // Wiring
    jobManager.setTechnicianManager(techManager);

    try {
        // 0. Get a User
        const users = await jobManager.userManager.getAllUsers();
        let userId;
        if (users.length > 0) {
            userId = users[0].id;
        } else {
            // Fallback if no users, create one is complex, so fail
            console.error("No users found to test with.");
            return;
        }
        console.log(`Using User: ${userId}`);

        // 1. Create a dummy job
        const job = await jobManager.createJob(
            userId,
            'Test Service',
            'Test Description',
            { lat: 10, lng: 10 },
            'Test Address',
            '2026-02-01',
            '10:00:00'
        );
        console.log(`Job Created: ${job.id}`);

        // 2. Assign to a tech (Need a valid tech ID)
        // I'll assume we can pick the first available technician
        const techs = await techManager.getAllTechnicians();
        if (techs.length === 0) {
            console.error("No technicians found to test with.");
            return;
        }
        const techId = techs[0].id;
        console.log(`Assigning to Technician: ${techId}`);

        await jobManager.assignTechnician(job.id, techId);

        // 3. Reject the job
        console.log("Rejecting Job...");
        await jobManager.updateStatus(job.id, 'rejected', { reason: 'Test Rejection' });

        // 4. Verify
        const updatedJob = await jobManager.getJob(job.id);
        console.log("Updated Job Status:", updatedJob.status);
        console.log("Updated Job Technician:", updatedJob.technicianId);

        // check if tech is free
        const tech = await techManager.getTechnician(techId);
        console.log("Technician Status:", tech.status);

    } catch (err) {
        console.error("Test Failed:", err);
    }
}

testRejection();
