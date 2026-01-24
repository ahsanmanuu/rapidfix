const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

/**
 * Migration script to migrate JSON file data to Supabase
 * Run this ONCE after setting up Supabase schema
 */

// Load environment variables
require('dotenv').config();

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

// Configuration
const DATA_DIR = path.join(__dirname, 'data');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Table mapping: JSON filename -> Supabase table name
const TABLE_MAPPING = {
    'users.json': 'users',
    'technicians.json': 'technicians',
    'jobs.json': 'jobs',
    'feedbacks.json': 'feedbacks',
    'finance.json': 'finance',
    'rides.json': 'rides',
    'sessions.json': 'sessions',
    'complaints.json': 'complaints',
    'notifications.json': 'notifications',
    'offers.json': 'offers',
    'admins.json': 'admins',
    'superadmins.json': 'admins', // Merge into admins table
    'chats.json': 'chats'
};

/**
 * Read JSON file
 */
function readJSONFile(filename) {
    try {
        const filepath = path.join(DATA_DIR, filename);
        if (!fs.existsSync(filepath)) {
            console.log(`⚠️  File not found: ${filename}`);
            return [];
        }
        const data = fs.readFileSync(filepath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading ${filename}:`, error.message);
        return [];
    }
}

/**
 * Transform data for Supabase
 * - Rename 'id' to 'legacy_id'
 * - Convert timestamps to ISO format
 * - Map camelCase to snake_case field names
 */
function transformRecord(record, tableName) {
    const transformed = {};

    // Store original ID as legacy_id
    if (record.id) {
        transformed.legacy_id = record.id;
    }

    // Field name mappings: JSON field -> SQL field
    const fieldMappings = {
        // Common fields
        'createdAt': 'created_at',
        'updatedAt': 'updated_at',
        'joinedAt': 'joined_at',

        // Technicians specific
        'serviceType': 'service_type',
        'addressDetails': 'address_details',
        'reviewCount': 'review_count',
        'membershipSince': 'membership_since',

        // Jobs specific
        'userId': 'user_id',
        'technicianId': 'technician_id',
        'contactName': 'contact_name',
        'contactPhone': 'contact_phone',
        'scheduledDate': 'scheduled_date',
        'scheduledTime': 'scheduled_time',

        // Feedbacks specific
        'jobId': 'job_id',

        // Finance specific
        'walletBalance': 'wallet_balance',

        // Rides specific
        'startLocation': 'start_location',
        'endLocation': 'end_location',
        'startedAt': 'started_at',
        'endedAt': 'ended_at',

        // Sessions specific
        'expiresAt': 'expires_at',

        // Complaints specific
        'resolvedAt': 'resolved_at',

        // Offers specific
        'discountPercentage': 'discount_percentage',
        'validUntil': 'valid_until'
    };

    // Copy all fields with transformation
    for (const [key, value] of Object.entries(record)) {
        if (key === 'id') continue; // Already handled as legacy_id

        // Skip fields that don't exist in SQL schema
        const excludedFields = [
            'reviews', // technicians - stored in feedbacks table
            'agreementAccepted', // jobs - not in schema
            'customerMobile', // jobs - using contact_phone
            'associatedId', // finance - using specific user_id/technician_id
            'status', // finance - not in schema
            'startTime', 'endTime', // rides - using started_at/ended_at
            'deviceId', 'role', // sessions - not needed
            'recipientId', 'relatedId', // notifications - using user_id
            'badgeText', 'badge', 'icon', 'createdBy', // offers - not in schema
            'name', // admins - only email/password needed
            'message', 'read', 'lastMessage', 'timestamp' // chats - using messages array
        ];

        if (excludedFields.includes(key)) continue;

        const sqlFieldName = fieldMappings[key] || key;

        // Convert date strings to ISO format
        if (['createdAt', 'updatedAt', 'joinedAt', 'created_at', 'updated_at', 'joined_at',
            'startedAt', 'endedAt', 'started_at', 'ended_at', 'expiresAt', 'expires_at',
            'resolvedAt', 'resolved_at', 'validUntil', 'valid_until', 'membershipSince', 'membership_since',
            'membershipExpiry', 'membership_expiry', 'scheduledDate', 'scheduled_date'].includes(key)) {
            if (value) {
                try {
                    transformed[sqlFieldName] = new Date(value).toISOString();
                } catch (e) {
                    transformed[sqlFieldName] = value;
                }
            }
        } else {
            transformed[sqlFieldName] = value;
        }
    }

    // Table-specific transformations
    if (tableName === 'admins' && record.role === 'superadmin') {
        transformed.role = 'superadmin';
    }

    return transformed;
}

/**
 * Migrate a single table
 */
async function migrateTable(jsonFile, tableName) {
    console.log(`\n📦 Migrating ${jsonFile} -> ${tableName}...`);

    const records = readJSONFile(jsonFile);

    if (records.length === 0) {
        console.log(`   ⏭️  No records to migrate`);
        return { success: true, count: 0 };
    }

    const transformed = records.map(r => transformRecord(r, tableName));

    try {
        const { data, error } = await supabase
            .from(tableName)
            .insert(transformed)
            .select();

        if (error) {
            console.error(`   ❌ Error:`, error.message);
            return { success: false, error: error.message };
        }

        console.log(`   ✅ Migrated ${data.length} records`);
        return { success: true, count: data.length };
    } catch (error) {
        console.error(`   ❌ Exception:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Migrate files from /uploads to Supabase Storage
 */
async function migrateFiles() {
    console.log(`\n📁 Migrating files from /uploads...`);

    if (!fs.existsSync(UPLOADS_DIR)) {
        console.log(`   ⏭️  No uploads directory found`);
        return;
    }

    const files = fs.readdirSync(UPLOADS_DIR);
    let uploaded = 0;

    for (const filename of files) {
        try {
            const filepath = path.join(UPLOADS_DIR, filename);
            const fileBuffer = fs.readFileSync(filepath);

            // Determine bucket based on filename pattern
            let bucket = 'technician-documents';
            if (filename.includes('avatar') || filename.includes('user')) {
                bucket = 'user-avatars';
            } else if (filename.includes('job') || filename.includes('invoice')) {
                bucket = 'job-attachments';
            }

            const { data, error } = await supabase.storage
                .from(bucket)
                .upload(filename, fileBuffer, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (error) {
                console.error(`   ❌ Failed to upload ${filename}:`, error.message);
            } else {
                uploaded++;
                console.log(`   ✅ Uploaded ${filename} to ${bucket}`);
            }
        } catch (error) {
            console.error(`   ❌ Error uploading ${filename}:`, error.message);
        }
    }

    console.log(`   📊 Total files uploaded: ${uploaded}/${files.length}`);
}

/**
 * Update file URLs in database records
 * Replace local paths with Supabase Storage URLs
 */
async function updateFileURLs() {
    console.log(`\n🔗 Updating file URLs to Supabase Storage...`);

    // Update technician documents
    const { data: technicians } = await supabase
        .from('technicians')
        .select('id, documents, legacy_id');

    for (const tech of technicians || []) {
        if (tech.documents) {
            const updatedDocs = { ...tech.documents };
            let hasChanges = false;

            ['photo', 'pan', 'aadhar'].forEach(docType => {
                if (updatedDocs[docType] && !updatedDocs[docType].startsWith('http')) {
                    // Convert local path to Supabase URL
                    const filename = path.basename(updatedDocs[docType]);
                    const { data } = supabase.storage
                        .from('technician-documents')
                        .getPublicUrl(filename);

                    updatedDocs[docType] = data.publicUrl;
                    hasChanges = true;
                }
            });

            if (hasChanges) {
                await supabase
                    .from('technicians')
                    .update({ documents: updatedDocs })
                    .eq('id', tech.id);
                console.log(`   ✅ Updated URLs for technician ${tech.legacy_id}`);
            }
        }
    }

    // Update user avatars
    const { data: users } = await supabase
        .from('users')
        .select('id, photo, legacy_id');

    for (const user of users || []) {
        if (user.photo && !user.photo.startsWith('http')) {
            const filename = path.basename(user.photo);
            const { data } = supabase.storage
                .from('user-avatars')
                .getPublicUrl(filename);

            await supabase
                .from('users')
                .update({ photo: data.publicUrl })
                .eq('id', user.id);
            console.log(`   ✅ Updated photo URL for user ${user.legacy_id}`);
        }
    }
}

/**
 * Main migration function
 */
async function runMigration() {
    console.log('🚀 Starting Fixofy → Supabase Migration\n');
    console.log('=======================================');

    // Check Supabase connection
    try {
        const { data, error } = await supabase.from('users').select('count');
        if (error && error.code !== 'PGRST116') {
            throw new Error('Cannot connect to Supabase');
        }
        console.log('✅ Supabase connection successful\n');
    } catch (error) {
        console.error('❌ Supabase connection failed:', error.message);
        console.log('\nPlease check:');
        console.log('1. SUPABASE_URL is set in .env');
        console.log('2. SUPABASE_SERVICE_KEY is set in .env');
        console.log('3. Schema has been created in Supabase');
        process.exit(1);
    }

    const results = {};

    // Migrate each table
    for (const [jsonFile, tableName] of Object.entries(TABLE_MAPPING)) {
        const result = await migrateTable(jsonFile, tableName);
        results[tableName] = result;
    }

    // Migrate files
    await migrateFiles();

    // Update file URLs
    await updateFileURLs();

    // Summary
    console.log('\n=======================================');
    console.log('📊 Migration Summary:');
    console.log('=======================================\n');

    Object.entries(results).forEach(([table, result]) => {
        if (result.success) {
            console.log(`✅ ${table}: ${result.count} records`);
        } else {
            console.log(`❌ ${table}: FAILED (${result.error})`);
        }
    });

    console.log('\n✨ Migration complete!');
    console.log('\nNext steps:');
    console.log('1. Verify data in Supabase Dashboard');
    console.log('2. Update .env to set USE_SUPABASE=true');
    console.log('3. Restart your server');
    console.log('4. Test all functionality');
    console.log('\n⚠️  Keep JSON backups for 30 days before deleting');
}

// Run migration
if (require.main === module) {
    runMigration().catch(error => {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    });
}

module.exports = { runMigration };
