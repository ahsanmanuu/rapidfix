// Smart database loader - switches between JSON and Supabase based on env variable
const Database = process.env.USE_SUPABASE === 'true'
    ? require('./SupabaseDatabase')
    : require('./Database');

module.exports = Database;
