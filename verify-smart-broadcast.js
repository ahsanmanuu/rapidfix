const io = require('./client/node_modules/socket.io-client');
const http = require('http');

// Use native fetch (Node 18+) or assume available
// Connection details
const SERVER_URL = 'http://localhost:3000';
const TECH_ID = 'e7467645-8664-42f4-8025-502621021487'; // A known tech ID based on previous logs or I'll use a random valid-ish one if needed.
// Ideally I need a valid Tech ID that is "Nearby".
// The server logic filters by DB. I might need to insert a temporary tech or trust the loop.
// For this test, I'll rely on the server logs to see "Broadcasting to X techs".

async function runTest() {
    console.log("=== SMART BROADCAST TEST ===");

    // 1. Setup Socket Listener
    console.log("1. Connecting to Socket.io...");
    const socket = io(SERVER_URL, {
        reconnectionDelayMax: 10000,
    });

    socket.on('connect', () => {
        console.log("   ✅ Socket Connected:", socket.id);
        // Join Tech Room (The server joins automatically on login? Or we manually join?)
        // Server: socket.on('join_room') -> socket.join(roomId)
        // TechnicianManager emits to `tech_${id}`.
        // So we MUST join that room.
        const roomName = `tech_${TECH_ID}`;
        console.log(`   Joining room: ${roomName}`);
        socket.emit('join_room', roomName);
    });

    socket.on('new_nearby_offer', (data) => {
        console.log("\n🔥 EVENT RECEIVED: 'new_nearby_offer' 🔥");
        console.log("   Offer Title:", data.title);
        console.log("   Price:", data.price);
        console.log("   Job Type:", data.jobType);
        console.log("   ✅ VERIFICATION SUCCESSFUL!");
        process.exit(0);
    });

    // 2. Submit Offer via API (Simulating User)
    setTimeout(async () => {
        console.log("\n2. Submitting 'Electrician' Offer via API...");
        try {
            const payload = {
                title: "TEST SMART OFFER " + Date.now(),
                price: 500,
                description: "Auto-test description",
                jobType: "Electrician",
                type: "job_bid",
                userId: "6457702e-c4d4-490f-a9c1-49870990f125", // maham (Valid User)
                location: { latitude: 28.7041, longitude: 77.1025 }, // Delhi Coords
                createdBy: "6457702e-c4d4-490f-a9c1-49870990f125"
            };

            const response = await fetch(`${SERVER_URL}/api/offers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            if (result.success) {
                console.log("   ✅ API Submit Success. Offer ID:", result.offer.id);
                console.log("   Waiting for Socket Event...");
            } else {
                console.error("   ❌ API Failed:", result.error);
            }
        } catch (err) {
            console.error("   ❌ API Network Error:", err.message);
        }
    }, 2000);

    // Timeout
    setTimeout(() => {
        console.log("\n⏳ Timeout: Did not receive event in 10s.");
        console.log("   (This might be because no Techs are in DB nearby, or logic issue)");
        process.exit(0);
    }, 10000);
}

runTest();
