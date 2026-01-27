const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function seedWallet() {
    try {
        console.log("Seeding Wallet Data...");

        // 1. Get a technician
        const { data: techs, error: techError } = await supabase.from('technicians').select('id').limit(1);
        if (techError || !techs.length) throw new Error("No technicians found to seed.");
        const techId = techs[0].id;
        console.log(`Target Technician: ${techId}`);

        // 2. Seed Transactions
        const transactions = [
            { technician_id: techId, type: 'credit', amount: 4500, description: 'Job compensation #1024', category: 'Job Fees', status: 'completed' },
            { technician_id: techId, type: 'credit', amount: 500, description: 'Tip from customer', category: 'Tips', status: 'completed' },
            { technician_id: techId, type: 'debit', amount: 1200, description: 'Part purchase: Cooling Fan', category: 'Supplies', status: 'completed' },
            { technician_id: techId, type: 'credit', amount: 2000, description: 'Quarterly bonus for top rating', category: 'Bonuses', status: 'completed' }
        ];

        console.log("Inserting transactions...");
        const { error: txnError } = await supabase.from('finance').insert(transactions);
        if (txnError) console.error("Txn Error:", txnError.message);

        // 3. Seed Analytics
        console.log("Upserting analytics...");
        const { error: anaError } = await supabase.from('technician_finance_analytics').upsert({
            technician_id: techId,
            tax_estimation: 1450,
            tax_message: 'Reserved for FY 24-25 Q4 estimation.',
            savings_goal: 5000,
            savings_message: 'Save ₹500 more this month.',
            peak_insight: 'Saturday evenings are your most profitable slots.',
            health_score: 88,
            last_updated: new Date().toISOString()
        }, { onConflict: 'technician_id' });
        if (anaError) console.error("Ana Error:", anaError.message);

        // 4. Seed Pots
        const pots = [
            { technician_id: techId, name: 'Tax Pot', target_amount: 15000, current_amount: 4500, color: '#3b82f6', icon: 'account_balance_wallet' },
            { technician_id: techId, name: 'Emergency Fund', target_amount: 20000, current_amount: 8000, color: '#10b981', icon: 'savings' }
        ];

        console.log("Inserting pots...");
        const { error: potError } = await supabase.from('wallet_pots').insert(pots);
        if (potError) console.error("Pot Error:", potError.message);

        // 5. Seed Bank Account
        console.log("Inserting bank account...");
        const { error: bankError } = await supabase.from('bank_accounts').insert({
            technician_id: techId,
            bank_name: 'HDFC Bank',
            account_number: '50100432109876',
            ifsc_code: 'HDFC0001234',
            account_holder_name: 'Primary Tech Account',
            is_primary: true
        });
        if (bankError) console.error("Bank Error:", bankError.message);

        console.log("Seeding Complete!");

    } catch (err) {
        console.error("Seed Error:", err.message);
    }
}

seedWallet();
