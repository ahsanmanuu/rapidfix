const io = require('./client/node_modules/socket.io-client');
const path = require('path');
const SERVER_URL = 'http://localhost:3000';

async function runTest() {
    console.log("=== END-TO-END SMART BROADCAST TEST ===");

    // 1. Setup Tech via Direct Manager (Server-side bypass)
    let techId;
    try {
        require('./server/node_modules/dotenv').config({ path: path.join(__dirname, 'server/.env') });
        const SupabaseDatabase = require('./server/managers/SupabaseDatabase');
        const db = new SupabaseDatabase('technicians');

        console.log("\n1. Creating Test Technician (Delhi) via Direct DB...");

        // Minimal Payload
        const rawTech = {
            name: "Auto Test Tech",
            email: `autotech_${Date.now()}@test.com`,
            service_type: "Electrician",
            status: "Available",
            password: "hashedpassword123", // Required
            location: { latitude: 28.7041, longitude: 77.1025 }, // JSON col
            latitude: 28.7041,
            longitude: 77.1025
        };

        const tech = await db.add(rawTech);
        techId = tech.id;
        console.log(`   ✅ Created Tech: ${tech.name} (${techId})`);
    } catch (err) {
        console.error("   ❌ Setup Error:", err.message);
        process.exit(1);
    }

    // 2. Connect Socket
    console.log("\n2. Connecting Socket for Tech...");
    const socket = io(SERVER_URL);

    socket.on('connect', () => {
        console.log(`   ✅ Socket Connected. Joining 'tech_${techId}'...`);
        socket.emit('join_room', `tech_${techId}`);
    });

    socket.on('new_nearby_offer', (data) => {
        console.log("\n🔥🔥🔥 SUCCESS: Received 'new_nearby_offer' 🔥🔥🔥");
        console.log("   Offer:", data.title);
        console.log("   Distance/Location check passed!");
        console.log("   [TEST PASSED]");
        process.exit(0);
    });

    // 3. Submit Offer via API
    setTimeout(async () => {
        console.log("\n3. Submitting Offer...");
        try {
            // Use m@gmail.com ID but PROVIDE explicit location in payload
            // to exercise the new fallback logic.
            const payload = {
                title: "SMART OFFER " + Date.now(),
                price: 999,
                jobType: "Electrician",
                type: "job_bid",
                userId: "6457702e-c4d4-490f-a9c1-49870990f125",
                location: { latitude: 28.7041, longitude: 77.1025 }
            };

            const response = await fetch(`${SERVER_URL}/api/offers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const res = await response.json();
            if (res.success) console.log("   ✅ API Offer Created.");
            else console.error("   ❌ API Error:", res);

        } catch (e) { console.error("API Call Failed", e); }
    }, 2000);

    setTimeout(() => {
        console.log("\n⏳ Timeout - Test Failed.");
        process.exit(1);
    }, 10000);
}

runTest();
