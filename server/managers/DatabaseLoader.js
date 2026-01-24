// Smart database loader - switches between JSON and Supabase based on env variable
const val = (process.env.USE_SUPABASE || '').toLowerCase().trim();
const USE_SUPABASE = val === 'true' || val === '1' || val === 'yes';
// [CRITICAL CHECK] - Warn if running on Render without Supabase
if (process.env.RENDER && !USE_SUPABASE) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('[CRITICAL WARNING] YOU ARE RUNNING ON RENDER WITHOUT SUPABASE PERSISTENCE!');
    console.error('All data (users, technicians) will be LOST every time the server restarts.');
    console.error('Please set USE_SUPABASE=true and configure Supabase credentials in Render Environment.');
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
}

console.log('[DatabaseLoader] USE_SUPABASE:', process.env.USE_SUPABASE, '-> Using:', USE_SUPABASE ? 'Supabase' : 'Local JSON');

const Database = USE_SUPABASE
    ? require('./SupabaseDatabase')
    : require('./Database');

module.exports = Database;
