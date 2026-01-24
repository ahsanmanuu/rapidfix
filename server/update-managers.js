const fs = require('fs');
const path = require('path');

/**
 * Batch update script to convert all remaining managers to use DatabaseLoader
 * Converts table names from .json to plain names (e.g., 'jobs.json' → 'jobs')
 */

const MANAGERS_DIR = path.join(__dirname, 'managers');

const MANAGER_FILES = [
    'JobManager.js',
    'FeedbackManager.js',
    'FinanceManager.js',
    'RideManager.js',
    'SessionManager.js',
    'ComplaintManager.js',
    'NotificationManager.js',
    'OfferManager.js',
    'AdminManager.js',
    'SuperAdminManager.js',
    'ChatManager.js',
    'BroadcastManager.js',
    'LocationManager.js'
];

function updateManager(filename) {
    const filepath = path.join(MANAGERS_DIR, filename);

    if (!fs.existsSync(filepath)) {
        console.log(`⏭️  ${filename} not found, skipping...`);
        return;
    }

    let content = fs.readFileSync(filepath, 'utf8');
    let modified = false;

    // Replace Database import
    if (content.includes("require('./Database')")) {
        content = content.replace(
            /const Database = require\('\.\/Database'\);/g,
            "const Database = require('./DatabaseLoader');"
        );
        modified = true;
    }

    // Replace .json table names
    const tableNameRegex = /new Database\('([^']+)\.json'\)/g;
    if (tableNameRegex.test(content)) {
        content = content.replace(tableNameRegex, "new Database('$1')");
        modified = true;
    }

    if (modified) {
        fs.writeFileSync(filepath, content, 'utf8');
        console.log(`✅ Updated ${filename}`);
    } else {
        console.log(`⏭️  ${filename} - no changes needed`);
    }
}

console.log('🔧 Updating managers for Supabase compatibility...\n');

MANAGER_FILES.forEach(updateManager);

console.log('\n✨ Done! All managers updated to use DatabaseLoader');
console.log('\nNote: Methods still need to be converted to async/await manually');
console.log('UserManager and TechnicianManager are already done as examples');
