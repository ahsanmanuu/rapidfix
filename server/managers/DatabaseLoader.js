// Smart database loader - switches between JSON and Supabase based on env variable
const val = (process.env.USE_SUPABASE || '').toLowerCase().trim();
const USE_SUPABASE = val === 'true' || val === '1' || val === 'yes';
console.log('[DatabaseLoader] USE_SUPABASE:', process.env.USE_SUPABASE, '-> Using:', USE_SUPABASE ? 'Supabase' : 'Local JSON');

const Database = USE_SUPABASE
    ? require('./SupabaseDatabase')
    : require('./Database');

module.exports = Database;
