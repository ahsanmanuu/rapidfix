require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function checkBuckets() {
    console.log('🔍 Checking Supabase Storage Buckets...');

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
        console.error('❌ Missing credentials');
        return;
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const { data, error } = await supabase.storage.listBuckets();

    if (error) {
        console.error('❌ Error listing buckets:', error.message);
        return;
    }

    console.log(`✅ Found ${data.length} buckets:`);
    data.forEach(b => console.log(`   - ${b.name} (public: ${b.public})`));

    const required = ['avatars', 'technician-documents'];
    const missing = required.filter(r => !data.find(b => b.name === r));

    if (missing.length > 0) {
        console.warn(`\n⚠️  WARNING: Missing required buckets: ${missing.join(', ')}`);
        console.log('👉 Please create these buckets in your Supabase Dashboard -> Storage.');
    } else {
        console.log('\n✅ All required buckets exist!');
    }
}

checkBuckets();
