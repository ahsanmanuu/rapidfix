// Quick debug script - check Supabase on production
require('dotenv').config();

console.log('=== SUPABASE DEBUG INFO ===\n');

console.log('Environment Variables:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL || '❌ NOT SET');
console.log('- SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('- USE_SUPABASE:', process.env.USE_SUPABASE || '❌ NOT SET');
console.log('');

console.log('Expected Values:');
console.log('- USE_SUPABASE should be: "true"');
console.log('- Current value:', process.env.USE_SUPABASE);
console.log('- String comparison result:', process.env.USE_SUPABASE === 'true' ? '✅ MATCH' : '❌ NO MATCH');
console.log('');

// Check which database will be loaded
const Database = require('./managers/DatabaseLoader');
console.log('DatabaseLoader will use:', process.env.USE_SUPABASE === 'true' ? 'Supabase' : 'JSON Files');
console.log('');

// Test creating an instance
try {
    const testDb = new Database('users');
    console.log('✅ Database instance created successfully');
    console.log('Type:', testDb.constructor.name);
} catch (error) {
    console.error('❌ Error creating database:', error.message);
}
