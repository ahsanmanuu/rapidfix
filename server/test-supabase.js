// Test Supabase Connection
require('dotenv').config();
const SupabaseDatabase = require('./managers/SupabaseDatabase');

async function testConnection() {
    console.log('🔍 Testing Supabase Connection...\n');

    // Check env vars
    console.log('Environment Variables:');
    console.log('- SUPABASE_URL:', process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ Set' : '❌ Missing');
    console.log('- USE_SUPABASE:', process.env.USE_SUPABASE);
    console.log('');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing Supabase credentials in .env file!');
        process.exit(1);
    }

    try {
        const db = new SupabaseDatabase('users');

        // Test read
        console.log('📖 Testing SELECT...');
        const users = await db.read();
        console.log(`✅ Read ${users.length} users from Supabase`);
        console.log('');

        // Test insert
        console.log('📝 Testing INSERT...');
        const testUser = {
            name: 'Test User',
            email: `test-${Date.now()}@example.com`,
            phone: '1234567890',
            password: 'test123',
            location: { latitude: 0, longitude: 0 }
        };

        const created = await db.add(testUser);
        console.log('✅ Created test user:', created.id);
        console.log('');

        // Test find
        console.log('🔍 Testing SELECT by ID...');
        const found = await db.find('id', created.id);
        console.log('✅ Found user:', found.email);
        console.log('');

        // Cleanup
        console.log('🗑️  Cleaning up...');
        await db.delete('id', created.id);
        console.log('✅ Deleted test user');
        console.log('');

        console.log('🎉 All tests passed! Supabase is working correctly.');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error('');
        console.error('Full error:', error);
        process.exit(1);
    }
}

testConnection();
