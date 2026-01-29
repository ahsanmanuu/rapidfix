const AdminManager = require('./server/managers/AdminManager');
const TechnicianManager = require('./server/managers/TechnicianManager');
const fs = require('fs');

async function verifyFix() {
    console.log("--- Verifying Technician Filtering Fix ---");
    const logFile = 'verify_output.txt';
    const log = (msg) => {
        console.log(msg);
        fs.appendFileSync(logFile, msg + '\n');
    };
    fs.writeFileSync(logFile, "Starting Verification\n");

    const adminManager = new AdminManager();
    const techManager = new TechnicianManager();

    // [NEW] Inject Dependency for Test
    adminManager.setTechnicianManager(techManager);

    // 1. Create a dummy technician with a specific city
    const testCity = "TestCity_" + Date.now();
    const mockTech = {
        name: "Test Tech",
        email: `testtech_${Date.now()}@example.com`,
        phone: "1234567890",
        serviceType: "Plumber",
        addressDetails: { city: testCity, pincode: "123456" },
        location: { latitude: 28.7041, longitude: 77.1025 }, // Delhi
        password: "password"
    };

    try {
        const createdTech = await techManager.createTechnician(mockTech);
        log(`\nCreated Test Technician in ${testCity}: ${createdTech.id}`);
        log(`Created Tech Address Details: ${JSON.stringify(createdTech.addressDetails)}`);

        // 2. Test Filters

        // Scenario A: Correct City
        log(`\n--- Scenario A: City Match (${testCity}) ---`);
        const resultsCity = await adminManager.getTechnicians(0, 0, { city: testCity });
        log(`Found ${resultsCity.length} techs.`);
        if (resultsCity.find(t => t.id === createdTech.id)) {
            log("SUCCESS: Found the test technician by city.");
        } else {
            log("FAILURE: Did not find technician by city.");
            if (resultsCity.length > 0) log(`First Result City: ${JSON.stringify(resultsCity[0].addressDetails)}`);
        }

        // Scenario B: Wrong City
        log(`\n--- Scenario B: Wrong City ---`);
        const resultsWrongCity = await adminManager.getTechnicians(0, 0, { city: "WrongCity" });
        log(`Found ${resultsWrongCity.length} techs.`);
        if (resultsWrongCity.length === 0) {
            log("SUCCESS: Correctly returned no technicians.");
        } else {
            log("FAILURE: Should have returned 0.");
        }

        // Scenario C: Pincode Match (No City provided)
        log(`\n--- Scenario C: Pincode Match (123456) ---`);
        const resultsPin = await adminManager.getTechnicians(0, 0, { pincode: "123456" });
        log(`Found ${resultsPin.length} techs.`);
        if (resultsPin.find(t => t.id === createdTech.id)) {
            log("SUCCESS: Found the test technician by pincode.");
        } else {
            // Exact match might fail if strict type check (string vs number) wasn't handled.
            log("FAILURE: Did not find technician by pincode.");
            // Debug why
            const allTechs = await techManager.getAllTechnicians();
            const myself = allTechs.find(t => t.id === createdTech.id);
            log(`My Tech Pincode in DB: ${myself?.addressDetails?.pincode} (Type: ${typeof myself?.addressDetails?.pincode})`);
        }

        // Cleanup
        // In a real DB we might want to delete, but for JSON DB it's fine for now or we can leave it.

    } catch (e) {
        log("Verification Error: " + e.message);
        console.error(e);
    }
}

verifyFix();
